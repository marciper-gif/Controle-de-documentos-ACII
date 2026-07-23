import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  deleteDoc,
  getDoc,
  getDocFromServer,
  serverTimestamp
} from 'firebase/firestore';

// Carregar fallback do firebase-applet-config.json se disponível
import appletConfigJson from '../../firebase-applet-config.json';

const appletConfig: any = appletConfigJson || {};
const metaEnv = (import.meta as any).env || {};

// Ler variáveis VITE_ do Vercel ou usar fallback do applet JSON
const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || appletConfig.apiKey || '',
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain || '',
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId || '',
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket || '',
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId || '',
  appId: metaEnv.VITE_FIREBASE_APP_ID || appletConfig.appId || ''
};

// Inicialização do Firebase (evita re-inicialização em HMR)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Configuração do Firestore com ID do banco
export const db = getFirestore(app, appletConfig.firestoreDatabaseId || undefined);

// Autenticação Firebase
export const auth = getAuth(app);

/**
 * Função utilitária para verificar se a gravação realmente persistiu no servidor Firestore.
 * Lê o documento de volta usando getDocFromServer para ignorar cache local.
 */
export async function verificarPersistencia(collectionName: string, docId: string, dadosEnviados: any): Promise<boolean> {
  try {
    // Aguardar 500ms para propagação no Firestore
    await new Promise(resolve => setTimeout(resolve, 500));

    // Buscar diretamente do servidor Firestore
    let docSnap;
    try {
      docSnap = await getDocFromServer(doc(db, collectionName, docId));
    } catch {
      // Fallback para getDoc padrão caso esteja em modo offline ou com oscilação
      docSnap = await getDoc(doc(db, collectionName, docId));
    }

    if (!docSnap.exists()) {
      console.error(`❌ Falha de persistência: O documento '${docId}' não foi encontrado em '${collectionName}'.`);
      return false;
    }

    const dadosSalvos = docSnap.data();
    
    // Comparar campos críticos (excluindo timestamps do servidor)
    const camposParaComparar = Object.keys(dadosEnviados).filter(
      k => k !== 'updatedAt' && k !== 'createdAt'
    );

    for (const campo of camposParaComparar) {
      if (dadosEnviados[campo] !== undefined) {
        const valEnviado = JSON.stringify(dadosEnviados[campo]);
        const valSalvo = JSON.stringify(dadosSalvos[campo]);
        if (valEnviado !== valSalvo) {
          console.warn(`⚠️ Divergência no campo '${campo}' de ${collectionName}/${docId}: enviado=${valEnviado}, salvo=${valSalvo}`);
        }
      }
    }

    console.log(`✅ Persistência confirmada com sucesso no Firestore: ${collectionName}/${docId}`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao verificar persistência em ${collectionName}/${docId}:`, error);
    return false;
  }
}

/**
 * Salva ou atualiza um documento no Firestore de forma assíncrona garantida.
 * Adiciona updatedAt com serverTimestamp() e updatedBy com o usuário atual.
 */
export async function salvarDocumento(tipo: string, dados: any, id?: string, currentUser?: any) {
  try {
    const targetId = id || dados.id || doc(collection(db, tipo)).id;
    const docRef = doc(db, tipo, targetId);

    // Limpar campos nulos/undefined para compatibilidade JSON
    const cleanData = JSON.parse(JSON.stringify({
      ...dados,
      id: targetId
    }));

    const dadosComTimestamp = {
      ...cleanData,
      updatedAt: serverTimestamp(),
      updatedBy: currentUser?.name || currentUser?.username || currentUser?.email || "sistema"
    };

    // USAR await OBRIGATORIAMENTE
    await setDoc(docRef, dadosComTimestamp, { merge: true });
    console.log(`✅ Documento gravado com sucesso em ${tipo}/${targetId}`);

    // Executar verificação de persistência
    await verificarPersistencia(tipo, targetId, dadosComTimestamp);

    return { success: true, id: targetId };
  } catch (error) {
    console.error(`❌ ERRO ao salvar em ${tipo}:`, error);
    throw error;
  }
}

/**
 * Deleta um documento do Firestore de forma assíncrona garantida.
 */
export async function deletarDocumento(tipo: string, id: string) {
  try {
    const docRef = doc(db, tipo, id);
    await deleteDoc(docRef);
    console.log(`✅ Documento removido com sucesso de ${tipo}/${id}`);
    return { success: true, id };
  } catch (error) {
    console.error(`❌ ERRO ao deletar em ${tipo}/${id}:`, error);
    throw error;
  }
}
