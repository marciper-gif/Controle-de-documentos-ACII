import { useMemo, useState } from 'react';
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

interface ExpiringDocumentsPanelProps {
  guardedDocuments: GuardedDocument[];
  currentUser: UserAccount | null;
  mySectorId: string | null;
  setGuardedDocuments: React.Dispatch<React.SetStateAction<GuardedDocument[]>>;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR');
  } catch {
    return iso;
  }
}

export default function ExpiringDocumentsPanel({
  guardedDocuments,
  currentUser,
  mySectorId,
  setGuardedDocuments
}: ExpiringDocumentsPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [renewingDoc, setRenewingDoc] = useState<GuardedDocument | null>(null);
  const [renewYears, setRenewYears] = useState(5);

  const isAdmin = currentUser?.role === 'admin';
  const isGestor = currentUser?.role === 'gestor' || currentUser?.role === 'lider';
  const canManage = isAdmin || isGestor;

  // "Visível para admin e gestor do setor correspondente" (item 5). Um
  // gestor só gerencia vencimentos do próprio setor; admin vê tudo que
  // já chegou (o Firestore já filtrou por setor pra quem não é admin).
  const relevantDocs = useMemo(() => {
    return guardedDocuments
      .filter(doc => isAdmin || (isGestor && doc.sectorId === mySectorId))
      .map(doc => ({ doc, status: computeDocumentStatus(doc) }))
      .filter(({ status }) => status === 'vencendo' || status === 'vencido')
      // Ordenado por proximidade do vencimento — mais urgente primeiro.
      .sort((a, b) => new Date(a.doc.retentionUntil).getTime() - new Date(b.doc.retentionUntil).getTime());
  }, [guardedDocuments, isAdmin, isGestor, mySectorId]);

  if (!canManage || relevantDocs.length === 0) return null;

  const uploaderName = currentUser?.name || currentUser?.username || 'Usuário';

  const openRenew = (doc: GuardedDocument) => {
    setRenewingDoc(doc);
    setRenewYears(doc.retentionYears || 5);
  };

  const confirmRenew = () => {
    if (!renewingDoc) return;
    const nowIso = new Date().toISOString();
    setGuardedDocuments(prev =>
      prev.map(d => {
        if (d.id !== renewingDoc.id) return d;
        const newRetentionUntil = calculateRetentionUntil(d.retentionUntil, renewYears);
        return {
          ...d,
          retentionUntil: newRetentionUntil,
          status: 'ativo',
          auditLog: [
            ...(d.auditLog || []),
            {
              action: 'renew_retention' as const,
              user: uploaderName,
              date: nowIso,
              notes: `+${renewYears} ano(s) — nova data: ${formatDate(newRetentionUntil)}`
            }
          ]
        };
      })
    );
    setRenewingDoc(null);
  };

  const handleDispose = (doc: GuardedDocument) => {
    if (!isAdmin) return;
    const confirmed = window.confirm(
      `Marcar "${doc.title}" para eliminação?\n\nIsso só sinaliza o documento como eliminado — o arquivo continua no Storage até uma exclusão física manual separada.`
    );
    if (!confirmed) return;

    const nowIso = new Date().toISOString();
    setGuardedDocuments(prev =>
      prev.map(d =>
        d.id === doc.id
          ? {
              ...d,
              status: 'eliminado' as const,
              auditLog: [
                ...(d.auditLog || []),
                { action: 'mark_for_disposal' as const, user: uploaderName, date: nowIso }
              ]
            }
          : d
      )
    );
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
                      {isAdmin && (
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
