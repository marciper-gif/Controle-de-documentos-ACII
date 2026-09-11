import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  X,
  Inbox,
  Building,
  UploadCloud,
  FileUp,
  AlertCircle,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { DocumentVersion, Employee, GuardedDocument, ProfilePermissionItem, SectorData, UserAccount } from '../types';
import {
  computeDocumentStatus,
  DOCUMENT_STATUS_CLASSES,
  DOCUMENT_STATUS_DOT,
  DOCUMENT_STATUS_LABEL
} from '../utils/guardedDocuments';
import { uploadGuardedDocumentFile, validateDocumentFile } from '../lib/documentStorage';
import { dbSaveGuardedDocument } from '../lib/firebaseSync';
import {
  GUARDED_DOCS_PAGE_SIZE,
  SEARCH_RESULTS_PER_SECTOR,
  getSectorDocumentCount,
  normalizeForSearch,
  subscribeToSectorDocuments,
  subscribeToSectorDocumentsByTitlePrefix
} from '../lib/guardedDocumentsQuery';
import UploadDocumentModal from './UploadDocumentModal';
import ExpiringDocumentsPanel from './ExpiringDocumentsPanel';
import { DEFAULT_COMPANY_ID } from '../lib/tenant';

interface DocumentsViewProps {
  sectors: SectorData[];
  currentUser: UserAccount | null;
  currentUserEmployee?: Employee | null;
  userPermissions?: ProfilePermissionItem;
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
  currentUser,
  currentUserEmployee,
  userPermissions
}: DocumentsViewProps) {
  // Fase 1 (multiempresa): toda consulta/upload de documento guardado é
  // escopada por companyId — ver src/lib/tenant.ts.
  const companyId = currentUser?.companyId || DEFAULT_COMPANY_ID;
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [historyDoc, setHistoryDoc] = useState<GuardedDocument | null>(null);
  const [auditDoc, setAuditDoc] = useState<GuardedDocument | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // ── Contagem por pasta (item 4.1) ──────────────────────────────────
  // Consulta de agregação (COUNT), não baixa os documentos em si — ver
  // src/lib/guardedDocumentsQuery.ts. Setores sem permissão de leitura
  // pro usuário atual (Firestore Rules) falham silenciosamente e ficam
  // com contagem 0, em vez de estourar erro na tela.
  const [sectorCounts, setSectorCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    sectors.forEach(sector => {
      getSectorDocumentCount(companyId, sector.id)
        .then(count => {
          if (!cancelled) setSectorCounts(prev => ({ ...prev, [sector.id]: count }));
        })
        .catch(() => {
          if (!cancelled) setSectorCounts(prev => ({ ...prev, [sector.id]: 0 }));
        });
    });
    return () => {
      cancelled = true;
    };
  }, [sectors, companyId]);

  // ── Pasta aberta: lista paginada, em tempo real ────────────────────
  const [openDocs, setOpenDocs] = useState<GuardedDocument[]>([]);
  const [openLoading, setOpenLoading] = useState(false);
  const [openPageLimit, setOpenPageLimit] = useState(GUARDED_DOCS_PAGE_SIZE);

  useEffect(() => {
    setOpenPageLimit(GUARDED_DOCS_PAGE_SIZE);
  }, [selectedSectorId]);

  useEffect(() => {
    if (!selectedSectorId) {
      setOpenDocs([]);
      return;
    }
    setOpenLoading(true);
    const unsubscribe = subscribeToSectorDocuments(
      companyId,
      selectedSectorId,
      openPageLimit,
      docs => {
        setOpenDocs(docs);
        setOpenLoading(false);
      },
      err => {
        console.warn('Falha ao carregar documentos do setor:', err);
        setOpenLoading(false);
      }
    );
    return () => unsubscribe();
  }, [selectedSectorId, openPageLimit, companyId]);

  // Só mostra "Carregar mais" se a última página veio cheia — sinal de
  // que provavelmente existe mais além do limite atual.
  const openHasMore = openDocs.length === openPageLimit;

  // ── Busca global (item 4.4) ────────────────────────────────────────
  // Firestore não tem busca de texto livre nativa: isto é busca por
  // PREFIXO do título (não por qualquer palavra no meio do texto nem
  // por tipo/nome de arquivo, como era antes). Dispara uma consulta por
  // setor em paralelo (todas limitadas), então o total de leituras por
  // busca fica limitado a nº de setores × SEARCH_RESULTS_PER_SECTOR —
  // previsível mesmo com a base inteira na casa das centenas de
  // milhares de documentos. Ignora a pasta aberta, igual ao
  // comportamento original.
  const normalizedQuery = useMemo(() => normalizeForSearch(searchQuery.trim()), [searchQuery]);
  const [searchResults, setSearchResults] = useState<GuardedDocument[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    if (!normalizedQuery) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const resultsBySector = new Map<string, GuardedDocument[]>();
    const mergeAndPublish = () => {
      // dedupe por id: cada consulta é escopada por setor, mas o
      // onSnapshot de um setor pode disparar mais de uma vez pro mesmo
      // resultado (ex: uma entrega "do cache" seguida da confirmação
      // "do servidor") — sem isso, o mesmo documento podia aparecer
      // repetido na lista combinada.
      const byId = new Map<string, GuardedDocument>();
      for (const docs of resultsBySector.values()) {
        for (const doc of docs) byId.set(doc.id, doc);
      }
      const merged = Array.from(byId.values()).sort((a, b) => a.title.localeCompare(b.title));
      setSearchResults(merged);
    };
    const unsubscribes = sectors.map(sector =>
      subscribeToSectorDocumentsByTitlePrefix(
        companyId,
        sector.id,
        normalizedQuery,
        SEARCH_RESULTS_PER_SECTOR,
        docs => {
          resultsBySector.set(sector.id, docs);
          mergeAndPublish();
          setSearchLoading(false);
        },
        () => {
          // Setor sem permissão de leitura pro usuário atual — ignora
          // silenciosamente (mesmo raciocínio da contagem por pasta acima).
          resultsBySector.set(sector.id, []);
          setSearchLoading(false);
        }
      )
    );
    return () => unsubscribes.forEach(unsub => unsub());
  }, [normalizedQuery, sectors, companyId]);

  // Reenvio de nova versão (item 4.5 da especificação)
  const versionInputRef = useRef<HTMLInputElement>(null);
  const [versionTargetDoc, setVersionTargetDoc] = useState<GuardedDocument | null>(null);
  const [versionUploading, setVersionUploading] = useState(false);
  const [versionProgress, setVersionProgress] = useState(0);
  const [versionError, setVersionError] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';
  const isGestor = currentUser?.role === 'gestor' || currentUser?.role === 'lider';
  // Admin/gestor sempre podem (regra própria do storage.rules); além
  // disso, qualquer perfil com canUploadDocuments concedido explicitamente
  // (item 6 da especificação) também ganha o botão — a garantia real
  // continua nas Firestore/Storage Rules, isso é só a UI.
  const canUpload = isAdmin || isGestor || !!userPermissions?.canUploadDocuments;

  const uploaderName = currentUser?.name || currentUser?.username || 'Usuário';

  const triggerNewVersion = (doc: GuardedDocument) => {
    setVersionTargetDoc(doc);
    setVersionError(null);
    // O input é o mesmo pra todas as linhas — versionTargetDoc guarda o
    // alvo, lido no onChange quando o usuário escolher o arquivo.
    setTimeout(() => versionInputRef.current?.click(), 0);
  };

  const handleVersionFileSelected = async (file: File | null) => {
    if (!file || !versionTargetDoc) return;

    const validationError = validateDocumentFile(file);
    if (validationError) {
      setVersionError(validationError);
      return;
    }

    const doc = versionTargetDoc;
    setVersionUploading(true);
    setVersionProgress(0);
    setVersionError(null);

    try {
      const newVersionNumber = doc.version + 1;
      const { fileUrl, storagePath } = await uploadGuardedDocumentFile(
        file,
        doc.companyId || companyId,
        doc.sectorId,
        doc.id,
        newVersionNumber,
        setVersionProgress
      );

      const nowIso = new Date().toISOString();
      const archivedVersion: DocumentVersion = {
        version: doc.version,
        fileUrl: doc.fileUrl,
        storagePath: doc.storagePath,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        uploadedBy: doc.uploadedBy,
        uploadedAt: doc.uploadedAt
      };

      const updated: GuardedDocument = {
        ...doc,
        fileName: file.name,
        fileUrl,
        storagePath,
        fileSize: file.size,
        fileType: file.type,
        uploadedBy: uploaderName,
        uploadedByEmployeeId: currentUserEmployee?.id,
        uploadedAt: nowIso,
        version: newVersionNumber,
        previousVersions: [...(doc.previousVersions || []), archivedVersion],
        auditLog: [
          ...(doc.auditLog || []),
          {
            action: 'upload' as const,
            user: uploaderName,
            date: nowIso,
            notes: `Nova versão enviada (v${newVersionNumber})`
          }
        ]
      };

      await dbSaveGuardedDocument(updated, currentUser);
      // A pasta aberta (ou os resultados de busca) atualiza sozinha via
      // onSnapshot assim que o Firestore confirmar a gravação.
      setVersionTargetDoc(null);
    } catch (err: any) {
      console.error('Erro ao enviar nova versão:', err);
      setVersionError(err?.message || 'Falha ao enviar nova versão. Tente novamente.');
    } finally {
      setVersionUploading(false);
    }
  };

  const handleDownloadClick = (doc: GuardedDocument) => {
    const nowIso = new Date().toISOString();
    const updated: GuardedDocument = {
      ...doc,
      auditLog: [...(doc.auditLog || []), { action: 'download' as const, user: uploaderName, date: nowIso }]
    };
    dbSaveGuardedDocument(updated, currentUser).catch(err => {
      // Não bloqueia o download em si (o link já abriu) — só o registro
      // de auditoria que pode falhar silenciosamente aqui.
      console.warn('Falha ao registrar download no log de auditoria:', err);
    });
  };

  // Setor do próprio usuário logado (pra dar uma dica visual de qual
  // pasta é "a dele" — a segurança de verdade já vem do Firestore: cada
  // consulta só retorna o que as regras deixaram ler).
  const mySectorId = useMemo(() => {
    if (!currentUserEmployee?.sector) return null;
    const match = sectors.find(
      s => s.name === currentUserEmployee.sector || s.id === currentUserEmployee.sector
    );
    return match?.id || null;
  }, [sectors, currentUserEmployee]);

  const selectedSector = sectors.find(s => s.id === selectedSectorId) || null;

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
            onClick={() => handleDownloadClick(doc)}
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
          {canUpload && (
            <button
              type="button"
              title="Enviar nova versão"
              onClick={() => triggerNewVersion(doc)}
              className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-500/10 dark:text-slate-400 dark:hover:text-rose-400 transition-colors cursor-pointer"
            >
              <FileUp className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Painel de vencimentos (item 5 da especificação) */}
      <ExpiringDocumentsPanel
        currentUser={currentUser}
        mySectorId={mySectorId}
        canManageRetention={!!userPermissions?.canManageRetention}
      />

      {/* Busca global + Enviar Documento */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar documento pelo início do título..."
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

        {canUpload && (
          <button
            type="button"
            onClick={() => setShowUploadModal(true)}
            className="shrink-0 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" /> Enviar Documento
          </button>
        )}
      </div>

      {searchResults !== null ? (
        // ── Resultado da busca global ──────────────────────────────
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
            {searchLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {searchResults.length} resultado(s) para "{searchQuery}" (por início do título)
          </p>
          {searchResults.length === 0 && !searchLoading ? (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500">
              <Inbox className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">Nenhum documento encontrado.</p>
              <p className="text-[11px] mt-1">A busca considera o começo do título — tente um termo mais curto.</p>
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
            {openLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
          </div>

          {openDocs.length === 0 && !openLoading ? (
            <div className="text-center py-16 text-slate-400 dark:text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <Inbox className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium">Nenhum documento nesta pasta ainda.</p>
              {canUpload && (
                <button
                  type="button"
                  onClick={() => setShowUploadModal(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5" /> Enviar o primeiro documento
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-2.5">{openDocs.map(renderDocumentRow)}</div>
              {openHasMore && (
                <div className="flex justify-center pt-1">
                  <button
                    type="button"
                    disabled={openLoading}
                    onClick={() => setOpenPageLimit(prev => prev + GUARDED_DOCS_PAGE_SIZE)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {openLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    Carregar mais
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        // ── Grade de pastas por setor ───────────────────────────────
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sectors.map(sector => {
            const count = sectorCounts[sector.id] ?? 0;
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
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-current/10">
                    <Folder className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-sm truncate">{sector.name}</h4>
                    <p className="text-[11px] opacity-70 font-medium">
                      {count} documento{count === 1 ? '' : 's'}
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
              {canUpload && (
                <button
                  type="button"
                  onClick={() => {
                    const doc = historyDoc;
                    setHistoryDoc(null);
                    if (doc) triggerNewVersion(doc);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 transition-all cursor-pointer"
                >
                  <FileUp className="w-4 h-4" /> Enviar nova versão
                </button>
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

      {/* Modal: enviar documento */}
      <AnimatePresence>
        {showUploadModal && (
          <UploadDocumentModal
            sectors={sectors}
            initialSectorId={selectedSectorId}
            currentUser={currentUser}
            currentUserEmployee={currentUserEmployee}
            onClose={() => setShowUploadModal(false)}
            onSaved={newDoc => {
              dbSaveGuardedDocument(newDoc, currentUser).catch(err => {
                console.error('Falha ao salvar documento no Firestore:', err);
                alert(`⚠️ Não foi possível salvar "${newDoc.title}" no banco de dados. Verifique sua conexão com a internet e tente novamente.`);
              });
              // Se o documento acabou de entrar na pasta que já está
              // aberta, o onSnapshot da pasta pega a novidade sozinho.
              // Se a contagem da pasta ainda não tiver sido atualizada
              // (a consulta de agregação não é em tempo real), soma 1
              // localmente pra não parecer que "sumiu" até recarregar.
              setSectorCounts(prev => ({ ...prev, [newDoc.sectorId]: (prev[newDoc.sectorId] ?? 0) + 1 }));
            }}
          />
        )}
      </AnimatePresence>

      {/* Input escondido usado por "Enviar nova versão" em qualquer linha */}
      <input
        ref={versionInputRef}
        type="file"
        className="hidden"
        onChange={e => {
          handleVersionFileSelected(e.target.files?.[0] || null);
          e.target.value = '';
        }}
      />

      {/* Indicador de progresso/erro do envio de nova versão */}
      <AnimatePresence>
        {(versionUploading || versionError) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-4 right-4 z-50 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4"
          >
            {versionError ? (
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400">Falha ao enviar nova versão</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{versionError}</p>
                </div>
                <button onClick={() => setVersionError(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" /> Enviando nova versão...
                </p>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 transition-all" style={{ width: `${versionProgress}%` }} />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
