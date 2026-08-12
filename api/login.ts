import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'crypto';
import { adminAuth, adminDb } from './_firebaseAdmin';

// Mesmo algoritmo de src/lib/userManagement.ts (hashPassword), só que em
// Node em vez de Web Crypto — precisa gerar o mesmo hex de saída.
function sha256Hex(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

const ADMIN_PASSWORD_HASH =
  '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
      return;
    }

    const cleanUsername = String(username).trim();
    const cleanUsernameLower = cleanUsername.toLowerCase();
    const cleanCpfNumbers = cleanUsername.replace(/\D/g, '');
    const passwordTrim = String(password).trim();
    const passwordLower = passwordTrim.toLowerCase();

    const isAdminLoginAttempt =
      cleanUsernameLower === 'admin' || cleanUsernameLower === 'administrador';

    const db = adminDb();
    const usersRef = db.collection('users');

    // Mesma lógica de busca de src/lib/userManagement.ts (fazerLogin):
    // por username exato, username em minúsculas, papel admin, ou CPF.
    let userDoc: FirebaseFirestore.QueryDocumentSnapshot | undefined;

    let snap = await usersRef.where('username', '==', cleanUsername).limit(1).get();
    if (snap.empty && cleanUsername !== cleanUsernameLower) {
      snap = await usersRef.where('username', '==', cleanUsernameLower).limit(1).get();
    }
    if (snap.empty && isAdminLoginAttempt) {
      snap = await usersRef.where('role', '==', 'admin').limit(1).get();
    }
    if (!snap.empty) {
      userDoc = snap.docs[0];
    } else if (cleanCpfNumbers.length > 0) {
      const snapCpf = await usersRef.where('username', '==', cleanCpfNumbers).limit(1).get();
      if (!snapCpf.empty) userDoc = snapCpf.docs[0];
    }

    let userData: any = userDoc?.data();
    let userDocId: string | undefined = userDoc?.id;

    // Fast path do admin padrão (mesmo comportamento do client em
    // userManagement.ts): admin/admin sempre funciona, mesmo sem
    // documento correspondente em `users`.
    if (!userData && isAdminLoginAttempt && passwordLower === 'admin') {
      userData = { username: 'admin', name: 'Administrador Geral', role: 'admin' };
      userDocId = '1';
    }

    if (!userData || !userDocId) {
      res.status(401).json({ error: 'Usuário não encontrado. Verifique o CPF/Login informado.' });
      return;
    }

    const accountStatus = String(userData.accountStatus || userData.status || 'ativo').toLowerCase();
    if (accountStatus === 'inativo') {
      res.status(403).json({ error: 'Conta inativa. Contate o administrador.' });
      return;
    }
    if (accountStatus === 'bloqueado') {
      res.status(403).json({ error: 'Conta bloqueada. Contate o administrador.' });
      return;
    }

    const isUserAdmin =
      userData.role === 'admin' || String(userData.username || '').toLowerCase() === 'admin' || isAdminLoginAttempt;

    const storedPass = String(userData.password || '');
    const storedHash = String(userData.passwordHash || '');

    let senhaCorreta =
      (isUserAdmin && (passwordLower === 'admin' || passwordTrim === 'Admin')) ||
      passwordTrim === storedPass ||
      passwordLower === storedPass.toLowerCase() ||
      passwordTrim === storedHash ||
      (isUserAdmin && storedHash === ADMIN_PASSWORD_HASH && passwordLower === 'admin');

    if (!senhaCorreta && storedHash) {
      senhaCorreta =
        sha256Hex(passwordTrim) === storedHash ||
        sha256Hex(passwordLower) === storedHash;
    }

    if (!senhaCorreta) {
      res.status(401).json({ error: 'Senha incorreta.' });
      return;
    }

    const role = isUserAdmin ? 'admin' : (userData.role || 'colaborador');

    // Resolve o setor do usuário (via funcionário vinculado) pra embutir
    // como claim no token — assim as regras não precisam de leitura
    // extra nenhuma no Firestore/Storage pra saber o setor da sessão.
    let sectorId: string | null = null;
    if (userData.employeeId) {
      const empSnap = await db.collection('employees').doc(userData.employeeId).get();
      const employee = empSnap.exists ? empSnap.data() : null;
      if (employee?.sector) {
        const sectorSnap = await db
          .collection('sectors')
          .where('name', '==', employee.sector)
          .limit(1)
          .get();
        if (!sectorSnap.empty) {
          sectorId = sectorSnap.docs[0].id;
        } else {
          // Pode já estar salvo com o id em vez do nome.
          const byId = await db.collection('sectors').doc(employee.sector).get();
          if (byId.exists) sectorId = byId.id;
        }
      }
    }

    const token = await adminAuth().createCustomToken(userDocId, { role, sectorId });
    res.status(200).json({ token });
  } catch (err: any) {
    console.error('Erro em /api/login:', err);
    res.status(500).json({ error: 'Falha interna ao autenticar. Tente novamente.' });
  }
}
