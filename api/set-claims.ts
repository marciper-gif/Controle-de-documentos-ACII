import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminAuth } from './_firebaseAdmin';

const VALID_ROLES = new Set(['admin', 'gestor', 'colaborador', 'lider']);

/**
 * Usado só pelo login via Google (src/lib/authBackend.ts,
 * syncGoogleClaims). O login por CPF/senha já ganha as claims direto no
 * token em /api/login.ts; aqui, como o Firebase Auth do Google já
 * emitiu a sessão sozinho, só ajustamos as claims por cima dela — e o
 * idToken enviado prova que quem está pedindo isso é o próprio dono da
 * sessão (não confiamos em um uid solto vindo do corpo da requisição).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { idToken, role, sectorId } = req.body || {};
    if (!idToken || !role || !VALID_ROLES.has(role)) {
      res.status(400).json({ error: 'idToken e role válidos são obrigatórios.' });
      return;
    }

    const decoded = await adminAuth().verifyIdToken(idToken);
    await adminAuth().setCustomUserClaims(decoded.uid, {
      role,
      sectorId: sectorId ?? null
    });

    res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Erro em /api/set-claims:', err);
    res.status(500).json({ error: 'Falha ao sincronizar sessão.' });
  }
}
