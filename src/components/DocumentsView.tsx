import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Folder,
  FolderOpen,
  ArrowLeft,
  Search,
  FileText,
  Download,
  History,
  ScrollText,
  ShieldAlert,
  X,
  Inbox,
  Building
} from 'lucide-react';
import { Employee, GuardedDocument, SectorData, UserAccount } from '../types';
import {
  computeDocumentStatus,
  DOCUMENT_STATUS_CLASSES,
  DOCUMENT_STATUS_DOT,
  DOCUMENT_STATUS_LABEL
} from '../utils/guardedDocuments';

interface DocumentsViewProps {
  sectors: SectorData[];
  guardedDocuments: GuardedDocument[];
  currentUser: UserAccount | null;
  currentUserEmployee?: Employee | null;
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR');
  } catch {
    return iso;
  }
}

export default function DocumentsView({
  sectors,
  guardedDocuments,
  currentUser,
  currentUserEmployee
}: DocumentsViewProps) {
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [historyDoc, setHistoryDoc] = useState<GuardedDocument | null>(null);
  const [auditDoc, setAuditDoc] = useState<GuardedDocument | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  // Setor do próprio usuário logado (pra dar uma dica visual de qual
  // pasta é "a dele" — a segurança de verdade já vem do Firestore: o
  // array guardedDocuments só contém o que as regras deixaram ler).
  const mySectorId = useMemo(() => {
    if (!currentUserEmployee?.sector) return null;
    const match = sectors.find(
      s => s.name === currentUserEmployee.sector || s.id === currentUserEmployee.sector
    );
    return match?.id || null;
  }, [sectors, currentUserEmployee]);

  const docsBySectorId = useMemo(() => {
    const map = new Map<string, GuardedDocument[]>();
    guardedDocuments.forEach(doc => {
      const list = map.get(doc.sectorId) || [];
      list.push(doc);
      map.set(doc.sectorId, list);
    });
    return map;
  }, [guardedDocuments]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  // Busca global (item 4.4): quando há texto digitado, ignora a pasta
  // selecionada e procura por nome/tipo em tudo que o usuário pode ver.
  const searchResults = useMemo(() => {
    if (!normalizedQuery) return null;
    return guardedDocuments.filter(
      doc =>
        doc.title.toLowerCase().includes(normalizedQuery) ||
        doc.documentType.toLowerCase().includes(normalizedQuery) ||
        doc.fileName.toLowerCase().includes(normalizedQuery)
    );
  }, [guardedDocuments, normalizedQuery]);

  const selectedSector = sectors.find(s => s.id === selectedSectorId) || null;
  const docsInSelectedSector = selectedSectorId ? (docsBySectorId.get(selectedSectorId) || []) : [];

  const renderDocumentRow = (doc: GuardedDocument) => {
    const status = computeDocumentStatus(doc);
    return (
      <motion.div
        key={doc.id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/40 hover:border-sky-500/40 transition-colors"
      >
        <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 shrink-0">
          <FileText className="w-5 h-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{doc.title}</h4>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
              {doc.documentType}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${DOCUMENT_STATUS_CLASSES[status]}`}>
              {DOCUMENT_STATUS_DOT[status]} {DOCUMENT_STATUS_LABEL[status]}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {doc.sectorName} • Enviado por {doc.uploadedBy} em {formatDate(doc.uploadedAt)} • {formatBytes(doc.fileSize)}
            {doc.version > 1 && <> • v{doc.version}</>}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
          <a
            href={doc.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Visualizar / baixar"
            className="p-2 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-500/10 dark:text-slate-400 dark:hover:text-sky-400 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            type="button"
            title="Histórico de versões"
            onClick={() => setHistoryDoc(doc)}
            className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-500/10 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            type="button"
            title="Log de auditoria"
            onClick={() => setAuditDoc(doc)}
            className="p-2 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-500/10 dark:text-slate-400 dark:hover:text-amber-400 transition-colors cursor-pointer"
          >
            <ScrollText className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Busca global */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar documento por nome ou tipo..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-medium"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {searchResults ? (
        // ── Resultado da busca global ──────────────────────────────
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {searchResults.length} resultado(s) para "{searchQuery}"
          </p>
          {searchResults.length === 0 ? (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500">
              <Inbox className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">Nenhum documento encontrado.</p>
            </div>
          ) : (
            <div className="space-y-2.5">{searchResults.map(renderDocumentRow)}</div>
          )}
        </div>
      ) : selectedSector ? (
        // ── Dentro de uma pasta ─────────────────────────────────────
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedSectorId(null)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar às pastas
            </button>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-sky-500" />
              {selectedSector.name}
            </h3>
          </div>

          {docsInSelectedSector.length === 0 ? (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Inbox className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">Nenhum documento nesta pasta ainda.</p>
              <p className="text-xs mt-1">O envio de documentos chega em breve.</p>
            </div>
          ) : (
            <div className="space-y-2.5">{docsInSelectedSector.map(renderDocumentRow)}</div>
          )}
        </div>
      ) : (
        // ── Grade de pastas por setor ───────────────────────────────
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectors.map(sector => {
            const docsInSector = docsBySectorId.get(sector.id) || [];
            const hasVencido = docsInSector.some(d => computeDocumentStatus(d) === 'vencido');
            const hasVencendo = docsInSector.some(d => computeDocumentStatus(d) === 'vencendo');
            const isMine = sector.id === mySectorId;

            return (
              <motion.button
                key={sector.id}
                type="button"
                whileHover={{ y: -2, scale: 1.01 }}
                onClick={() => setSelectedSectorId(sector.id)}
                className={`relative text-left p-5 rounded-2xl border transition-all cursor-pointer ${sector.color || 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'} ${
                  isMine ? 'ring-1 ring-sky-500/40' : ''
                }`}
              >
                {(hasVencido || hasVencendo) && (
                  <span
                    className={`absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      hasVencido ? DOCUMENT_STATUS_CLASSES.vencido : DOCUMENT_STATUS_CLASSES.vencendo
                    }`}
                    title={hasVencido ? 'Há documentos vencidos nesta pasta' : 'Há documentos vencendo nesta pasta'}
                  >
                    <ShieldAlert className="w-3 h-3" />
                    {hasVencido ? 'Vencido' : 'Vencendo'}
                  </span>
                )}

                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-current/10">
                    <Folder className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-sm truncate">{sector.name}</h4>
                    <p className="text-[11px] opacity-70 font-medium">
                      {docsInSector.length} documento{docsInSector.length === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>

                {isMine && (
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 flex items-center gap-1">
                    <Building className="w-3 h-3" /> Seu setor
                  </p>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {!isAdmin && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
          Você vê apenas documentos do seu setor (e de outros setores que tenham te dado acesso).
        </p>
      )}

      {/* Modal: histórico de versões */}
      <AnimatePresence>
        {historyDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setHistoryDoc(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-500" /> Histórico de versões
                </h3>
                <button onClick={() => setHistoryDoc(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{historyDoc.title}</p>
              {!historyDoc.previousVersions || historyDoc.previousVersions.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">
                  Só existe a versão atual (v{historyDoc.version}) até agora.
                </p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {[...historyDoc.previousVersions].reverse().map(v => (
                    <div key={v.version} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-200">v{v.version}</span>
                        <span className="text-slate-400 mx-1.5">•</span>
                        <span className="text-slate-500 dark:text-slate-400">{v.uploadedBy}</span>
                        <span className="text-slate-400 mx-1.5">•</span>
                        <span className="text-slate-500 dark:text-slate-400">{formatDate(v.uploadedAt)}</span>
                      </div>
                      <a href={v.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sky-600 dark:text-sky-400 hover:underline shrink-0 ml-2">
                        Baixar
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: log de auditoria */}
      <AnimatePresence>
        {auditDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setAuditDoc(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <ScrollText className="w-4 h-4 text-amber-500" /> Log de auditoria
                </h3>
                <button onClick={() => setAuditDoc(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{auditDoc.title}</p>
              {!auditDoc.auditLog || auditDoc.auditLog.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 py-4 text-center">Nenhum evento registrado ainda.</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {[...auditDoc.auditLog].reverse().map((entry, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-700 dark:text-slate-200 capitalize">{entry.action.replace(/_/g, ' ')}</span>
                        <span className="text-slate-400">{formatDate(entry.date)}</span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5">{entry.user}</p>
                      {entry.notes && <p className="text-slate-400 dark:text-slate-500 mt-1 italic">{entry.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
