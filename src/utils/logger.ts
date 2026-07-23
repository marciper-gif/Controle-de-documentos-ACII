import { db } from '../config/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface AuditLogEntry {
  userId?: string;
  userName?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'SYNC' | 'ERROR';
  collectionName: string;
  docId?: string;
  dataSent?: any;
  error?: string;
  timestamp?: any;
}

/**
 * Utilitário de log de auditoria do sistema ACII.
 * Em desenvolvimento: exibe logs formatados no console.
 * Em produção: também grava logs na coleção 'system_logs' do Firestore.
 */
export async function logSystemEvent(log: AuditLogEntry) {
  const metaEnv = (import.meta as any).env || {};
  const isDev = metaEnv.DEV;

  // Log no Console
  if (isDev) {
    console.log(`[ACII LOG - ${log.action}] [${log.collectionName}/${log.docId || ''}]:`, log);
  }

  // Em produção ou para auditoria de escritas, salvar no Firestore
  try {
    const logRef = doc(collection(db, 'system_logs'));
    const cleanDataSent = log.dataSent ? JSON.parse(JSON.stringify(log.dataSent)) : null;

    await setDoc(logRef, {
      userId: log.userId || 'anonimo',
      userName: log.userName || 'sistema',
      action: log.action,
      collectionName: log.collectionName,
      docId: log.docId || null,
      dataSent: cleanDataSent,
      error: log.error || null,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error("Falha ao gravar log de auditoria no Firestore:", err);
  }
}
