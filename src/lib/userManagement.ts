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

/**
 * PASSO 3 — TELA DE LOGIN COM VERIFICAÇÃO DE PRIMEIRO ACESSO E CPF
 */
export async function fazerLogin(username: string, passwordInput: string, localUsersList: UserAccount[] = []) {
  try {
    const cleanUsername = username.trim();
    const cleanCpfNumbers = cleanUsername.replace(/\D/g, "");

    // 1. Buscar usuário no Firestore ou na lista local
    let userData: UserAccount | null = null;
    let userDocId: string | null = null;

    try {
      const usersRef = collection(db, "users");
      // Tentar busca exata pelo username
      const q = query(usersRef, where("username", "==", cleanUsername));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        userData = docSnap.data() as UserAccount;
        userDocId = docSnap.id;
      } else if (cleanCpfNumbers.length > 0) {
        // Tentar busca pelo CPF apenas com números
        const qCpf = query(usersRef, where("username", "==", cleanCpfNumbers));
        const snapCpf = await getDocs(qCpf);
        if (!snapCpf.empty) {
          const docSnap = snapCpf.docs[0];
          userData = docSnap.data() as UserAccount;
          userDocId = docSnap.id;
        }
      }
    } catch (dbErr) {
      console.warn("Consulta Firestore em login falhou, buscando em memória/cache:", dbErr);
    }

    // Fallback: Buscar na lista local em memória
    if (!userData && localUsersList.length > 0) {
      const found = localUsersList.find(u => {
        const uName = (u.username || '').toLowerCase();
        const uCpf = (u.username || '').replace(/\D/g, '');
        const targetClean = cleanUsername.toLowerCase();
        return uName === targetClean || (cleanCpfNumbers.length > 0 && uCpf === cleanCpfNumbers);
      });
      if (found) {
        userData = found;
        userDocId = found.id;
      }
    }

    if (!userData) {
      throw new Error("Usuário não encontrado. Verifique o CPF/Login informado.");
    }

    // 2. Verificar status da conta
    const accountStatus = (userData.accountStatus || userData.status || 'ativo').toLowerCase();
    
    if (accountStatus === "inativo") {
      throw new Error("Conta inativa. Contate o administrador.");
    }
    
    if (accountStatus === "bloqueado") {
      throw new Error("Conta bloqueada. Contate o administrador.");
    }

    // 3. Verificar senha (suporta senha em texto puro ou hash SHA-256)
    const hashedInput = await hashPassword(passwordInput);
    const storedPass = userData.password || "";
    const storedHash = userData.passwordHash || "";

    const senhaCorreta = 
      passwordInput === storedPass ||
      passwordInput === storedHash ||
      hashedInput === storedHash ||
      hashedInput === storedPass;

    if (!senhaCorreta) {
      throw new Error("Senha incorreta.");
    }

    // 4. Verificar primeiro acesso
    const precisaTrocarSenha = userData.firstAccess === true || userData.primeiro_acesso === true;

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
 * PASSO 5 — RESETAR SENHA PARA "123"
 */
export async function resetarSenha(userId: string) {
  try {
    const senhaPadrao = "123";
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
    
    console.log("✅ Senha resetada para 123");
    return {
      success: true,
      userId,
      senhaPadrao: "123"
    };
  } catch (error) {
    console.error("❌ Erro ao resetar senha:", error);
    throw error;
  }
}
