import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, collection } from 'firebase/firestore';
import { storage, db } from './firebase';

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

/**
 * Envia o arquivo para documentos/{sectorId}/{documentId}/v{version}_{fileName}
 * (caminho definido no item 2 da especificação) e retorna a URL de
 * download + o caminho salvo no Storage.
 */
export async function uploadGuardedDocumentFile(
  file: File,
  sectorId: string,
  documentId: string,
  version: number,
  onProgress?: (pct: number) => void
): Promise<{ fileUrl: string; storagePath: string }> {
  const storagePath = `documentos/${sectorId}/${documentId}/v${version}_${file.name}`;
  const storageRef = ref(storage, storagePath);
  const task = uploadBytesResumable(storageRef, file);

  await new Promise<void>((resolve, reject) => {
    task.on(
      'state_changed',
      snapshot => {
        if (onProgress && snapshot.totalBytes > 0) {
          onProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
        }
      },
      reject,
      () => resolve()
    );
  });

  const fileUrl = await getDownloadURL(task.snapshot.ref);
  return { fileUrl, storagePath };
}
