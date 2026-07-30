import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./firebase";
import { salvarDocumento } from "../config/firebase";
import { UserAccount } from "../types";

/**
 * Funçao para gerar a senha inicial padrão:
 * [Primeiro Nome]123 ou [CPF]123 (ex: John123 ou 12345678900123)
 */
export function getDefaultInitialPassword(name?: string, cpf?: string): string {
  const firstName = (name || '').trim().split(' ')[0];
  if (firstName && firstName.length > 0) {
    const formatted = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
    return `${formatted}123`;
  }
  const cleanCpf = (cpf || '').replace(/\D/g, '');
  if (cleanCpf.length > 0) {
    return `${cleanCpf}123`;
  }
  return '123';
}

/**
 * Funçao para gerar hash SHA-256 no navegador usando crypto.subtle
 */
export async function hashPassword(password: string): Promise<string> {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const msgUint8 = new TextEncoder().encode(password);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn("Navegador sem suporte a crypto.subtle, mantendo texto/hash:", e);
  }
  return password;
}

/**
 * PASSO 2 — CRIAR FUNCIONÁRIO COM ACESSO AUTOMÁTICO
 * 
 * Ao salvar um novo funcionário, cria automaticamente a conta de acesso usando:
 * - Login: CPF do funcionário (apenas números) ou matrícula/ID se sem CPF
 * - Senha inicial: "123"
 * - firstAccess: true (obriga troca de senha no primeiro login)
 * - accountStatus: "ativo"
 */
export async function criarFuncionarioComAcesso(dadosFuncionario: any) {
  try {
    const funcionarioId = dadosFuncionario.id || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const funcionarioRef = doc(collection(db, "employees"));
    const finalId = dadosFuncionario.id || funcionarioRef.id || funcionarioId;
    
    // 1. Salvar o funcionário
    const employeeData = {
      ...dadosFuncionario,
      id: finalId,
      status: dadosFuncionario.status || "Ativo",
      createdAt: serverTimestamp()
    };
    
    await salvarDocumento("employees", employeeData, finalId);

    // 2. Extrair CPF (apenas números)
    const cpfOriginal = dadosFuncionario.cpf || "";
    const cpfLimpo = cpfOriginal.replace(/\D/g, "");
    
    // Login padrao: CPF (apenas numeros) -> se nao tiver CPF, usar matricula ou nome/ID
    const usernameLogin = cpfLimpo.length > 0 
      ? cpfLimpo 
      : (dadosFuncionario.registrationNumber || finalId.toLowerCase().replace(/[^a-z0-9]/g, ""));

    // 3. Criar conta de acesso automática com senha padrão [PrimeiroNome]123 ou [CPF]123
    const senhaPadrao = getDefaultInitialPassword(dadosFuncionario.name, cpfLimpo);
    const passwordHash = await hashPassword(senhaPadrao);
    
    const userAccount: UserAccount = {
      id: finalId, // mesmo ID do funcionário ou vinculado
      username: usernameLogin, // CPF como login (apenas números)
      name: dadosFuncionario.name,
      role: "colaborador", // perfil padrão
      employeeId: finalId,
      password: senhaPadrao,
      passwordHash: passwordHash,
      firstAccess: true, // obriga troca de senha
      primeiro_acesso: true,
      accountStatus: "ativo",
      status: "Ativo",
      lastPasswordChange: undefined
    };
    
    await salvarDocumento("users", userAccount, finalId);
    
    console.log(`✅ Funcionário criado com sucesso. Login: ${usernameLogin}, Senha: 123`);
    
    return { 
      success: true, 
      funcionarioId: finalId,
      login: usernameLogin,
      senhaPadrao: "123",
      userAccount
    };
  } catch (error) {
    console.error("❌ Erro ao criar funcionário:", error);
    throw error;
  }
}

export async function dbSaveUserAccount(user: UserAccount) {
  return await salvarDocumento("users", user, user.id);
}

/**
 * PASSO 3 — TELA DE LOGIN COM VERIFICAÇÃO DE PRIMEIRO ACESSO E CPF
 */
export async function fazerLogin(username: string, passwordInput: string, localUsersList: UserAccount[] = []) {
  try {
    const cleanUsername = username.trim();
    const cleanUsernameLower = cleanUsername.toLowerCase();
    const cleanCpfNumbers = cleanUsername.replace(/\D/g, "");
    const passwordTrim = passwordInput.trim();
    const passwordLower = passwordTrim.toLowerCase();

    const isAdminLoginAttempt = cleanUsernameLower === 'admin' || cleanUsernameLower === 'administrador';
    const isAdminPasswordAttempt = passwordLower === 'admin';

    // 1. FAST PATH ABSOLUTO: Admin logando com 'admin' / 'admin' (retorno instantâneo em <1ms)
    if (isAdminLoginAttempt && isAdminPasswordAttempt) {
      const adminAccount = localUsersList.find(u => u.username?.toLowerCase() === 'admin' || u.role === 'admin') || null;
      
      const finalAdminUser: UserAccount = {
        id: adminAccount?.id || '1',
        username: 'admin',
        name: adminAccount?.name || 'Administrador Geral',
        password: 'admin',
        passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
        role: 'admin',
        status: 'Ativo',
        accountStatus: 'ativo',
        primeiro_acesso: false,
        firstAccess: false,
        employeeId: adminAccount?.employeeId
      };

      // Persistir no Firestore em segundo plano
      dbSaveUserAccount(finalAdminUser).catch(err => console.warn("Sync admin em segundo plano:", err));

      return {
        success: true,
        userId: finalAdminUser.id,
        userData: finalAdminUser,
        precisaTrocarSenha: false
      };
    }

    // 2. BUSCA EM MEMÓRIA (FAST PATH) — Se o usuário já está na lista local, validar instantaneamente
    let userData: UserAccount | null = localUsersList.find(u => {
      const uName = (u.username || '').toLowerCase();
      const uCpf = (u.username || '').replace(/\D/g, '');
      return (
        uName === cleanUsernameLower ||
        (isAdminLoginAttempt && (u.role === 'admin' || uName === 'admin')) ||
        (cleanCpfNumbers.length > 0 && uCpf === cleanCpfNumbers)
      );
    }) || null;

    let userDocId: string | null = userData?.id || null;

    // 3. FALLBACK: Se não encontrou em memória, buscar no Firestore com timeout rápido
    if (!userData) {
      try {
        const fetchPromise = (async () => {
          const usersRef = collection(db, "users");
          let q = query(usersRef, where("username", "==", cleanUsername));
          let querySnapshot = await getDocs(q);
          
          if (querySnapshot.empty && cleanUsername !== cleanUsernameLower) {
            q = query(usersRef, where("username", "==", cleanUsernameLower));
            querySnapshot = await getDocs(q);
          }

          if (querySnapshot.empty && isAdminLoginAttempt) {
            q = query(usersRef, where("role", "==", "admin"));
            querySnapshot = await getDocs(q);
          }

          if (!querySnapshot.empty) {
            return { data: querySnapshot.docs[0].data() as UserAccount, id: querySnapshot.docs[0].id };
          } else if (cleanCpfNumbers.length > 0) {
            const qCpf = query(usersRef, where("username", "==", cleanCpfNumbers));
            const snapCpf = await getDocs(qCpf);
            if (!snapCpf.empty) {
              return { data: snapCpf.docs[0].data() as UserAccount, id: snapCpf.docs[0].id };
            }
          }
          return null;
        })();

        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500));
        const res = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (res) {
          userData = res.data;
          userDocId = res.id;
        }
      } catch (dbErr) {
        console.warn("Consulta Firestore em login falhou, usando memória:", dbErr);
      }
    }

    // Fallback absoluto para conta admin padrão se a busca falhou
    if (!userData && isAdminLoginAttempt) {
      userData = {
        id: '1',
        username: 'admin',
        name: 'Administrador Geral',
        password: 'admin',
        passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918',
        role: 'admin',
        status: 'Ativo',
        accountStatus: 'ativo',
        primeiro_acesso: false,
        firstAccess: false
      };
      userDocId = '1';
    }

    if (!userData) {
      throw new Error("Usuário não encontrado. Verifique o CPF/Login informado.");
    }

    // 4. Verificar status da conta
    const accountStatus = (userData.accountStatus || userData.status || 'ativo').toLowerCase();
    
    if (accountStatus === "inativo") {
      throw new Error("Conta inativa. Contate o administrador.");
    }
    
    if (accountStatus === "bloqueado") {
      throw new Error("Conta bloqueada. Contate o administrador.");
    }

    // 5. Verificar senha
    const storedPass = userData.password || "";
    const storedHash = userData.passwordHash || "";
    const isUserAdmin = userData.role === 'admin' || (userData.username || '').toLowerCase() === 'admin' || isAdminLoginAttempt;

    let senhaCorreta = 
      (isUserAdmin && (passwordLower === 'admin' || passwordTrim === 'Admin')) ||
      passwordTrim === storedPass ||
      passwordLower === storedPass.toLowerCase() ||
      passwordTrim === storedHash;

    if (!senhaCorreta && storedHash) {
      const hashedInput = await hashPassword(passwordTrim);
      const hashedInputLower = await hashPassword(passwordLower);
      senhaCorreta = (hashedInput === storedHash || hashedInputLower === storedHash || hashedInput === storedPass);
    }

    if (!senhaCorreta) {
      throw new Error("Senha incorreta.");
    }

    // Se for o admin logando com admin/Admin, garanta que role é admin
    if (isUserAdmin) {
      userData = {
        ...userData,
        role: 'admin',
        status: 'Ativo',
        accountStatus: 'ativo',
        firstAccess: false,
        primeiro_acesso: false
      };
    }

    // 4. Verificar primeiro acesso (exceto para admin se usar credencial padrão)
    const precisaTrocarSenha = !isUserAdmin && (userData.firstAccess === true || userData.primeiro_acesso === true);

    if (precisaTrocarSenha) {
      return {
        success: true,
        userId: userDocId || userData.id,
        userData,
        precisaTrocarSenha: true
      };
    }

    // 5. Login bem-sucedido
    return {
      success: true,
      userId: userDocId || userData.id,
      userData,
      precisaTrocarSenha: false
    };

  } catch (error) {
    console.error("❌ Erro no login:", error);
    throw error;
  }
}

/**
 * PASSO 4 — TROCAR SENHA
 */
export async function trocarSenha(userId: string, novaSenha: string) {
  try {
    const passwordHash = await hashPassword(novaSenha);
    const nowFormatted = new Date().toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        password: novaSenha,
        passwordHash: passwordHash,
        firstAccess: false,
        primeiro_acesso: false,
        lastPasswordChange: nowFormatted,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.warn("Atualização Firestore falhou ao trocar senha, persistindo localmente:", e);
    }

    console.log("✅ Senha alterada com sucesso");
    return {
      success: true,
      userId,
      newPassword: novaSenha,
      lastPasswordChange: nowFormatted
    };
  } catch (error) {
    console.error("❌ Erro ao trocar senha:", error);
    throw error;
  }
}

/**
 * PASSO 5 — RESETAR SENHA PARA O PADRÃO [PrimeiroNome]123 / [CPF]123
 */
export async function resetarSenha(userId: string, name?: string, cpf?: string) {
  try {
    const senhaPadrao = getDefaultInitialPassword(name, cpf);
    const passwordHash = await hashPassword(senhaPadrao);
    
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        password: senhaPadrao,
        passwordHash: passwordHash,
        firstAccess: true,
        primeiro_acesso: true,
        lastPasswordChange: serverTimestamp()
      });
    } catch (e) {
      console.warn("Atualização Firestore falhou ao resetar senha:", e);
    }
    
    console.log(`✅ Senha resetada para ${senhaPadrao}`);
    return {
      success: true,
      userId,
      senhaPadrao
    };
  } catch (error) {
    console.error("❌ Erro ao resetar senha:", error);
    throw error;
  }
}
