import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, collection } from 'firebase/firestore';
import { storage, db, auth } from './firebase';

// Restrições de upload (item 2 da especificação) — validadas aqui no
// cliente antes de enviar; o storage.rules também valida tamanho/tipo
// no servidor como segunda barreira.
export const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png'
];

export const ACCEPTED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png'];

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

export function validateDocumentFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). O limite é 20MB.`;
  }
  const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
  const typeOk = ACCEPTED_MIME_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext);
  if (!typeOk) {
    return `Tipo de arquivo não permitido. Aceitos: ${ACCEPTED_EXTENSIONS.join(', ')}.`;
  }
  return null;
}

export function generateGuardedDocumentId(): string {
  return doc(collection(db, 'guarded_documents')).id;
}

function attemptUpload(
  file: File,
  storagePath: string,
  onProgress?: (pct: number) => void
): Promise<{ fileUrl: string; storagePath: string }> {
  const storageRef = ref(storage, storagePath);
  const task = uploadBytesResumable(storageRef, file);

  return new Promise<{ fileUrl: string; storagePath: string }>((resolve, reject) => {
    task.on(
      'state_changed',
      snapshot => {
        if (onProgress && snapshot.totalBytes > 0) {
          onProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
        }
      },
      reject,
      () => {
        getDownloadURL(task.snapshot.ref)
          .then(fileUrl => resolve({ fileUrl, storagePath }))
          .catch(reject);
      }
    );
  });
}

const RETRY_DELAYS_MS = [4000, 8000, 15000, 25000];

/**
 * Envia o arquivo para documentos/{sectorId}/{documentId}/v{version}_{fileName}
 * (caminho definido no item 2 da especificação) e retorna a URL de
 * download + o caminho salvo no Storage.
 *
 * As Storage Rules deste projeto leem papel/setor via Custom Claims do
 * Firebase Auth (request.auth.token.role/.sectorId), sincronizados por
 * uma Cloud Function (syncAuthLinkClaims) sempre que auth_links/{uid}
 * muda no Firestore. Isso é quase instantâneo, mas não é garantido —
 * cold start da function, latência de rede, etc. Se o SDK do Storage
 * ainda estiver usando um ID token emitido ANTES desses claims serem
 * gravados, o upload nega mesmo com tudo certo no backend.
 *
 * IMPORTANTE: o Firebase JS SDK só busca um token novo quando mandamos
 * explicitamente (getIdToken(true)) — sozinho, ele reusa o token em
 * cache até expirar (~1h). Por isso, a cada nova tentativa aqui, forçamos
 * esse refresh antes de tentar de novo: sem isso, repetir o upload só
 * repete o mesmo token velho pra sempre, e o retry nunca ajuda de verdade.
 */
export async function uploadGuardedDocumentFile(
  file: File,
  sectorId: string,
  documentId: string,
  version: number,
  onProgress?: (pct: number) => void,
  onRetry?: (attempt: number, totalAttempts: number) => void
): Promise<{ fileUrl: string; storagePath: string }> {
  const storagePath = `documentos/${sectorId}/${documentId}/v${version}_${file.name}`;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      return await attemptUpload(file, storagePath, onProgress);
    } catch (err: any) {
      const isPermissionIssue = err?.code === 'storage/unauthorized';
      const isLastAttempt = attempt === RETRY_DELAYS_MS.length;
      if (!isPermissionIssue || isLastAttempt) throw err;

      onRetry?.(attempt + 1, RETRY_DELAYS_MS.length + 1);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS_MS[attempt]));
      try {
        await auth.currentUser?.getIdToken(true);
      } catch (refreshErr) {
        console.warn('Falha ao renovar token antes de repetir o upload:', refreshErr);
      }
    }
  }

  // Inalcançável — o loop acima sempre retorna ou lança antes de sair.
  throw new Error('Falha ao enviar o documento.');
}
