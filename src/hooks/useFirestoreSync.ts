import { useState, useCallback } from 'react';
import { salvarDocumento, deletarDocumento, verificarPersistencia } from '../config/firebase';
import { logSystemEvent } from '../utils/logger';

export function useFirestoreSync() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const clearToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  /**
   * Executa a gravação de documento com aguardo de 500ms e verificação getDoc
   */
  const salvarComVerificacao = useCallback(async (
    colecao: string,
    dados: any,
    id?: string,
    currentUser?: any
  ) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Gravar documento
      const res = await salvarDocumento(colecao, dados, id, currentUser);

      // 2. Registra log de auditoria
      await logSystemEvent({
        userId: currentUser?.id || currentUser?.uid,
        userName: currentUser?.name || currentUser?.username,
        action: id ? 'UPDATE' : 'CREATE',
        collectionName: colecao,
        docId: res.id,
        dataSent: dados
      });

      setToastMessage({
        type: 'success',
        message: `✅ Dados salvos com sucesso em ${colecao}!`
      });

      return res;
    } catch (err: any) {
      const msg = `❌ Falha de persistência: Os dados não foram salvos no Firestore (${err.message || err})`;
      setError(msg);
      setToastMessage({
        type: 'error',
        message: msg
      });

      await logSystemEvent({
        userId: currentUser?.id || currentUser?.uid,
        userName: currentUser?.name || currentUser?.username,
        action: 'ERROR',
        collectionName: colecao,
        docId: id,
        error: err.message || String(err)
      });

      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Executa a remoção de documento com logging e tratamento de erro
   */
  const deletarComVerificacao = useCallback(async (
    colecao: string,
    id: string,
    currentUser?: any
  ) => {
    setLoading(true);
    setError(null);

    try {
      const res = await deletarDocumento(colecao, id);

      await logSystemEvent({
        userId: currentUser?.id || currentUser?.uid,
        userName: currentUser?.name || currentUser?.username,
        action: 'DELETE',
        collectionName: colecao,
        docId: id
      });

      setToastMessage({
        type: 'success',
        message: `✅ Item removido com sucesso de ${colecao}!`
      });

      return res;
    } catch (err: any) {
      const msg = `❌ Erro ao remover do Firestore (${err.message || err})`;
      setError(msg);
      setToastMessage({
        type: 'error',
        message: msg
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    toastMessage,
    clearToast,
    salvarComVerificacao,
    deletarComVerificacao,
    verificarPersistencia
  };
}
