import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Mesmo projeto/banco usados no cliente (src/config/firebase.ts,
// firebase-applet-config.json). O projeto e o ID do banco não são
// segredo (já aparecem no bundle público do front-end); só a chave de
// serviço (client email + private key) é sensível e fica em variáveis
// de ambiente da Vercel.
const PROJECT_ID = 'dogwood-loader-bln7n';
const DATABASE_ID = 'ai-studio-aciicontroledodo-8a9badc3-1faa-4b52-9783-49cb0814c900';

function getAdminApp() {
  const existing = getApps()[0];
  if (existing) return existing;

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error(
      'FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY não configurados nas variáveis de ambiente da Vercel.'
    );
  }

  return initializeApp({
    credential: cert({ projectId: PROJECT_ID, clientEmail, privateKey })
  });
}

export function adminAuth() {
  return getAuth(getAdminApp());
}

export function adminDb() {
  return getFirestore(getAdminApp(), DATABASE_ID);
}
