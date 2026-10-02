// ─────────────────────────────────────────────────────────────────────
// Fase 4 — identidade visual por empresa (logo + cor principal).
// ─────────────────────────────────────────────────────────────────────
// Cada empresa pode subir o próprio logo e escolher uma cor de marca,
// gravados em companies/{companyId}.logoUrl / .primaryColor — ver
// firestore.rules (admin da própria empresa pode atualizar só esses
// dois campos) e storage.rules (match /company_logos/{companyId}/...).

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from './firebase';

export const LOGO_ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
export const LOGO_MAX_SIZE_BYTES = 2 * 1024 * 1024;

export function validateLogoFile(file: File): string | null {
  if (file.size > LOGO_MAX_SIZE_BYTES) {
    return `Arquivo muito grande (${(file.size / 1024 / 1024).toFixed(1)}MB). O limite é 2MB.`;
  }
  if (!LOGO_ACCEPTED_TYPES.includes(file.type)) {
    return 'Formato não aceito. Envie PNG, JPG, WEBP ou SVG.';
  }
  return null;
}

/**
 * Sobe o logo da empresa pro Storage e grava a URL em companies/{companyId}.
 * Cada envio usa um nome novo (timestamp) — não sobrescreve o arquivo
 * anterior no Storage (ele só fica "órfão", sem custo relevante pro
 * tamanho típico de um logo), o que evita qualquer problema de cache
 * do navegador mostrando a imagem antiga.
 */
export async function uploadCompanyLogo(companyId: string, file: File): Promise<string> {
  const path = `company_logos/${companyId}/logo-${Date.now()}-${file.name}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const logoUrl = await getDownloadURL(storageRef);
  await updateDoc(doc(db, 'companies', companyId), { logoUrl });
  return logoUrl;
}

export async function updateCompanyPrimaryColor(companyId: string, primaryColor: string): Promise<void> {
  await updateDoc(doc(db, 'companies', companyId), { primaryColor });
}
