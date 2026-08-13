import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, RotateCcw, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { GuardedDocument, UserAccount } from '../types';
import {
  calculateRetentionUntil,
  computeDocumentStatus,
  daysUntilRetentionEnds,
  DOCUMENT_STATUS_CLASSES,
  DOCUMENT_STATUS_DOT
} from '../utils/guardedDocuments';
import { subscribeToExpiringDocuments } from '../lib/guardedDocumentsQuery';
import { dbSaveGuardedDocument } from '../lib/firebaseSync';

interface ExpiringDocumentsPanelProps {
  currentUser: UserAccount | null;
  mySectorId: string | null;
  // item 6 da especificação: canManageRetention cobre TANTO renovar
  // QUANTO marcar para eliminação — concede a alguém sem ser admin/gestor.
  canManageRetention?: boolean;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR');
  } catch {
    return iso;
  }
}

export default function ExpiringDocumentsPanel({
  currentUser,
  mySectorId,
  canManageRetention = false
}: ExpiringDocumentsPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [renewingDoc, setRenewingDoc] = useState<GuardedDocument | null>(null);
  const [renewYears, setRenewYears] = useState(5);
  const [docs, setDocs] = useState<GuardedDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = currentUser?.role === 'admin';
  const isGestor = currentUser?.role === 'gestor' || currentUser?.role === 'lider';
  // Admin/gestor sempre podem; canManageRetention (item 6) delega renovar
  // E marcar para eliminação a outro perfil, sem precisar ser admin/gestor.
  const canManage = isAdmin || isGestor || canManageRetention;
  const canDispose = isAdmin || canManageRetention;

  // Consulta direta ao Firestore (já filtrada por status/prazo, e por
  // setor pra quem não é admin) em vez de receber a coleção inteira e
  // filtrar em memória — ver src/lib/guardedDocumentsQuery.ts. Admin
  // enxerga vencimentos de todos os setores; quem não é admin só do
  // próprio setor (mesma regra de visibilidade de antes, agora aplicada
  // na consulta em vez de no cliente).
  useEffect(() => {
    if (!canManage) {
      setDocs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const sectorScope = isAdmin ? null : mySectorId;
    // Sem setor definido e sem ser admin: não há o que consultar ainda
    // (ex: perfil sem funcionário/setor vinculado).
    if (!isAdmin && !sectorScope) {
      setDocs([]);
      setLoading(false);
      return;
    }
    const unsubscribe = subscribeToExpiringDocuments(
      { sectorId: sectorScope },
      list => {
        setDocs(list);
        setLoading(false);
      },
      err => {
        console.warn('Falha ao carregar documentos vencendo:', err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [canManage, isAdmin, mySectorId]);

  const uploaderName = currentUser?.name || currentUser?.username || 'Usuário';

  // A consulta já traz só quem está dentro do horizonte de vencimento
  // (ver horizonDays em subscribeToExpiringDocuments); aqui só ordena
  // por proximidade e recalcula o rótulo exato (vencendo/vencido).
  const relevantDocs = useMemo(() => {
    return docs
      .map(doc => ({ doc, status: computeDocumentStatus(doc) }))
      .filter(({ status }) => status === 'vencendo' || status === 'vencido')
      .sort((a, b) => new Date(a.doc.retentionUntil).getTime() - new Date(b.doc.retentionUntil).getTime());
  }, [docs]);

  if (!canManage || loading || relevantDocs.length === 0) return null;

  const openRenew = (doc: GuardedDocument) => {
    setRenewingDoc(doc);
    setRenewYears(doc.retentionYears || 5);
  };

  const confirmRenew = async () => {
    if (!renewingDoc) return;
    const nowIso = new Date().toISOString();
    const newRetentionUntil = calculateRetentionUntil(renewingDoc.retentionUntil, renewYears);
    const updated: GuardedDocument = {
      ...renewingDoc,
      retentionUntil: newRetentionUntil,
      status: 'ativo',
      auditLog: [
        ...(renewingDoc.auditLog || []),
        {
          action: 'renew_retention' as const,
          user: uploaderName,
          date: nowIso,
          notes: `+${renewYears} ano(s) — nova data: ${formatDate(newRetentionUntil)}`
        }
      ]
    };
    setRenewingDoc(null);
    try {
      await dbSaveGuardedDocument(updated, currentUser);
      // A assinatura em tempo real (useEffect acima) reflete a mudança
      // sozinha assim que o Firestore confirmar — não precisa atualizar
      // estado local aqui.
    } catch (err) {
      console.error('Falha ao renovar guarda:', err);
      alert('Não foi possível renovar a guarda. Verifique sua conexão e tente novamente.');
    }
  };

  const handleDispose = async (doc: GuardedDocument) => {
    if (!canDispose) return;
    const confirmed = window.confirm(
      `Marcar "${doc.title}" para eliminação?\n\nIsso só sinaliza o documento como eliminado — o arquivo continua no Storage até uma exclusão física manual separada.`
    );
    if (!confirmed) return;

    const nowIso = new Date().toISOString();
    const updated: GuardedDocument = {
      ...doc,
      status: 'eliminado' as const,
      auditLog: [
        ...(doc.auditLog || []),
        { action: 'mark_for_disposal' as const, user: uploaderName, date: nowIso }
      ]
    };
    try {
      await dbSaveGuardedDocument(updated, currentUser);
    } catch (err) {
      console.error('Falha ao marcar documento para eliminação:', err);
      alert('Não foi possível marcar o documento para eliminação. Verifique sua conexão e tente novamente.');
    }
  };

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 cursor-pointer"
      >
        <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
          <AlertTriangle className="w-4 h-4" />
          Documentos a Vencer ({relevantDocs.length})
        </span>
        {expanded ? <ChevronUp className="w-4 h-4 text-amber-600" /> : <ChevronDown className="w-4 h-4 text-amber-600" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {relevantDocs.map(({ doc, status }) => {
                const days = daysUntilRetentionEnds(doc);
                return (
                  <div
                    key={doc.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">{doc.title}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${DOCUMENT_STATUS_CLASSES[status]}`}>
                          {DOCUMENT_STATUS_DOT[status]} {days < 0 ? `${Math.abs(days)}d vencido` : `${days}d restantes`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {doc.sectorName} • Guarda até {formatDate(doc.retentionUntil)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => openRenew(doc)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Renovar
                      </button>
                      {canDispose && (
                        <button
                          type="button"
                          onClick={() => handleDispose(doc)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal renovar guarda */}
      <AnimatePresence>
        {renewingDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setRenewingDoc(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-emerald-500" /> Renovar guarda
                </h3>
                <button onClick={() => setRenewingDoc(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{renewingDoc.title}</p>
              <p className="text-[11px] text-slate-400">Guarda atual até {formatDate(renewingDoc.retentionUntil)}</p>

              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Anos a somar
                </label>
                <input
                  type="number"
                  min={1}
                  value={renewYears}
                  onChange={e => setRenewYears(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400">
                  Nova data: {formatDate(calculateRetentionUntil(renewingDoc.retentionUntil, renewYears))}
                </p>
              </div>

              <div className="pt-1 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRenewingDoc(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmRenew}
                  className="px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" /> Confirmar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
