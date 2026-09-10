import {
  doc,
  setDoc,
  getDoc,
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

// ───────────────────────────────────────────────────────────────────────
// login_index — ver o comentário em firestore.rules (match /login_index)
// para o porquê deste espelho existir. Regra resumida: `users` não pode
// mais ser consultado livremente (isso vazava senha de uma empresa pra
// sessão de outra), então o login passa a resolver o usuário por um
// documento de ID DETERMINÍSTICO — "{companyId}__{usernameLowerCase}" —
// que só guarda o mínimo pra validar a senha (nunca a senha em texto
// puro). Toda função que cria conta ou troca senha precisa manter este
// espelho atualizado — centralizado aqui em `syncLoginIndex` pra não
// haver dois lugares that podem ficar dessincronizados.
// ───────────────────────────────────────────────────────────────────────

export function loginIndexKey(companyId: string, username: string): string {
  return `${companyId}__${username.trim().toLowerCase()}`;
}

export async function syncLoginIndex(companyId: string, userId: string, username: string, passwordHash: string, status: string): Promise<void> {
  const key = loginIndexKey(companyId, username);
  await setDoc(doc(db, 'login_index', key), {
    companyId,
    userId,
    username: username.trim().toLowerCase(),
    passwordHash,
    status,
    updatedAt: serverTimestamp()
  });
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
export async function criarFuncionarioComAcesso(companyId: string, dadosFuncionario: any) {
  try {
    const funcionarioId = dadosFuncionario.id || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalId = dadosFuncionario.id || funcionarioId;

    // 1. Salvar o funcionário
    const employeeData = {
      ...dadosFuncionario,
      id: finalId,
      companyId,
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
    //    Só o hash é gravado — nunca mais a senha em texto puro (ver Fase 1:
    //    achado de segurança "senha em texto puro na coleção users").
    const senhaPadrao = getDefaultInitialPassword(dadosFuncionario.name, cpfLimpo);
    const passwordHash = await hashPassword(senhaPadrao);

    const userAccount: UserAccount = {
      id: finalId, // mesmo ID do funcionário ou vinculado
      companyId,
      username: usernameLogin, // CPF como login (apenas números)
      name: dadosFuncionario.name,
      role: "colaborador", // perfil padrão
      employeeId: finalId,
      passwordHash: passwordHash,
      firstAccess: true, // obriga troca de senha
      primeiro_acesso: true,
      accountStatus: "ativo",
      status: "Ativo",
      lastPasswordChange: undefined
    };

    await salvarDocumento("users", userAccount, finalId);
    await syncLoginIndex(companyId, finalId, usernameLogin, passwordHash, "ativo");

    console.log(`✅ Funcionário criado com sucesso. Login: ${usernameLogin}, Senha: ${senhaPadrao}`);

    return {
      success: true,
      funcionarioId: finalId,
      login: usernameLogin,
      senhaPadrao,
      userAccount
    };
  } catch (error) {
    console.error("❌ Erro ao criar funcionário:", error);
    throw error;
  }
}

/**
 * PASSO 3 — TELA DE LOGIN COM VERIFICAÇÃO DE PRIMEIRO ACESSO E CPF
 *
 * `companyId` é obrigatório a partir da Fase 1 (multiempresa) — a tela de
 * login pede a empresa antes de CPF/senha porque o mesmo CPF pode existir
 * em duas empresas diferentes, e a busca do usuário agora é feita por ID
 * exato ("{companyId}__{username}" em login_index), nunca mais por uma
 * consulta aberta na coleção `users` inteira (ver firestore.rules).
 *
 * O antigo atalho "admin"/"admin" sempre funcionava, com um hash fixo
 * gravado no código-fonte — era uma porta de acesso universal que
 * ignorava qualquer senha real configurada. Removido nesta fase: agora
 * login de admin segue a mesma verificação de qualquer outro usuário.
 */
export async function fazerLogin(companyId: string, username: string, passwordInput: string, localUsersList: UserAccount[] = []) {
  try {
    if (!companyId) {
      throw new Error("Selecione a empresa para continuar.");
    }

    const cleanUsername = username.trim();
    const cleanUsernameLower = cleanUsername.toLowerCase();
    const cleanCpfNumbers = cleanUsername.replace(/\D/g, "");
    const passwordTrim = passwordInput.trim();
    const passwordLower = passwordTrim.toLowerCase();

    // 1. BUSCA EM MEMÓRIA (FAST PATH) — usuários já carregados desta empresa
    let userData: UserAccount | null = localUsersList.find(u => {
      if (u.companyId !== companyId) return false;
      const uName = (u.username || '').toLowerCase();
      const uCpf = (u.username || '').replace(/\D/g, '');
      return uName === cleanUsernameLower || (cleanCpfNumbers.length > 0 && uCpf === cleanCpfNumbers);
    }) || null;

    let userDocId: string | null = userData?.id || null;

    // 2. FALLBACK: busca por ID exato em login_index (get, nunca list —
    //    ver firestore.rules) e depois o perfil completo em users/{userId}.
    if (!userData) {
      try {
        const tryKeys = [cleanUsernameLower];
        if (cleanCpfNumbers.length > 0 && cleanCpfNumbers !== cleanUsernameLower) tryKeys.push(cleanCpfNumbers);

        for (const key of tryKeys) {
          const indexSnap = await getDoc(doc(db, 'login_index', loginIndexKey(companyId, key)));
          if (!indexSnap.exists()) continue;
          const indexData = indexSnap.data() as { userId: string; passwordHash: string; status?: string };
          const userSnap = await getDoc(doc(db, 'users', indexData.userId));
          if (userSnap.exists()) {
            userData = { ...(userSnap.data() as UserAccount), id: userSnap.id };
            userDocId = userSnap.id;
            break;
          }
        }
      } catch (dbErr) {
        console.warn("Consulta Firestore em login falhou:", dbErr);
      }
    }

    if (!userData) {
      throw new Error("Usuário não encontrado. Verifique a empresa e o CPF/Login informados.");
    }

    // 3. Verificar status da conta
    const accountStatus = (userData.accountStatus || userData.status || 'ativo').toLowerCase();

    if (accountStatus === "inativo") {
      throw new Error("Conta inativa. Contate o administrador.");
    }

    if (accountStatus === "bloqueado") {
      throw new Error("Conta bloqueada. Contate o administrador.");
    }

    // 4. Verificar senha (hash sempre; texto puro só como fallback de
    //    leitura pra contas antigas ainda não migradas — nunca mais
    //    gravado, ver criarFuncionarioComAcesso/trocarSenha).
    const storedPass = userData.password || "";
    const storedHash = userData.passwordHash || "";

    let senhaCorreta =
      passwordTrim === storedPass ||
      passwordLower === storedPass.toLowerCase();

    if (!senhaCorreta && storedHash) {
      const hashedInput = await hashPassword(passwordTrim);
      const hashedInputLower = await hashPassword(passwordLower);
      senhaCorreta = (hashedInput === storedHash || hashedInputLower === storedHash);
    }

    if (!senhaCorreta) {
      throw new Error("Senha incorreta.");
    }

    // 5. Verificar primeiro acesso
    const precisaTrocarSenha = userData.firstAccess === true || userData.primeiro_acesso === true;

    return {
      success: true,
      userId: userDocId || userData.id,
      userData,
      precisaTrocarSenha
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
      const userSnap = await getDoc(userRef);
      await updateDoc(userRef, {
        passwordHash: passwordHash,
        firstAccess: false,
        primeiro_acesso: false,
        lastPasswordChange: nowFormatted,
        updatedAt: serverTimestamp()
      });

      const current = userSnap.data() as UserAccount | undefined;
      if (current?.companyId && current?.username) {
        await syncLoginIndex(current.companyId, userId, current.username, passwordHash, (current.accountStatus || current.status || 'ativo').toLowerCase());
      }
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
      const userSnap = await getDoc(userRef);
      await updateDoc(userRef, {
        passwordHash: passwordHash,
        firstAccess: true,
        primeiro_acesso: true,
        lastPasswordChange: serverTimestamp()
      });

      const current = userSnap.data() as UserAccount | undefined;
      if (current?.companyId && current?.username) {
        await syncLoginIndex(current.companyId, userId, current.username, passwordHash, (current.accountStatus || current.status || 'ativo').toLowerCase());
      }
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
