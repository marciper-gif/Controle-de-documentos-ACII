import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { UploadCloud, X, FileText, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { Employee, GuardedDocument, SectorData, UserAccount } from '../types';
import {
  ACCEPTED_EXTENSIONS,
  generateGuardedDocumentId,
  uploadGuardedDocumentFile,
  validateDocumentFile
} from '../lib/documentStorage';
import { calculateRetentionUntil, DEFAULT_RETENTION_YEARS_BY_TYPE, DOCUMENT_TYPE_SUGGESTIONS } from '../utils/guardedDocuments';

interface UploadDocumentModalProps {
  sectors: SectorData[];
  initialSectorId?: string | null;
  currentUser: UserAccount | null;
  currentUserEmployee?: Employee | null;
  onClose: () => void;
  onSaved: (doc: GuardedDocument) => void;
}

export default function UploadDocumentModal({
  sectors,
  initialSectorId,
  currentUser,
  currentUserEmployee,
  onClose,
  onSaved
}: UploadDocumentModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [title, setTitle] = useState('');
  const [sectorId, setSectorId] = useState(initialSectorId || sectors[0]?.id || '');
  const [documentType, setDocumentType] = useState(DOCUMENT_TYPE_SUGGESTIONS[0]);
  const [customType, setCustomType] = useState('');
  const [description, setDescription] = useState('');
  const [retentionYears, setRetentionYears] = useState(
    DEFAULT_RETENTION_YEARS_BY_TYPE[DOCUMENT_TYPE_SUGGESTIONS[0]] || 5
  );
  const [extraViewerSectorIds, setExtraViewerSectorIds] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const effectiveType = documentType === 'Outro' && customType.trim() ? customType.trim() : documentType;

  const handleFileChosen = (chosen: File | null) => {
    if (!chosen) return;
    const validationError = validateDocumentFile(chosen);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }
    setError(null);
    setFile(chosen);
    if (!title.trim()) {
      // Pré-preenche o título com o nome do arquivo, sem a extensão.
      setTitle(chosen.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleDocumentTypeChange = (value: string) => {
    setDocumentType(value);
    setRetentionYears(DEFAULT_RETENTION_YEARS_BY_TYPE[value] || 5);
  };

  const toggleExtraViewer = (id: string) => {
    setExtraViewerSectorIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError('Selecione um arquivo para enviar.');
      return;
    }
    if (!title.trim()) {
      setError('Informe um título para o documento.');
      return;
    }
    if (!sectorId) {
      setError('Selecione o setor responsável pelo documento.');
      return;
    }
    if (!effectiveType.trim()) {
      setError('Informe o tipo do documento.');
      return;
    }
    if (!retentionYears || retentionYears <= 0) {
      setError('O tempo de guarda deve ser maior que zero.');
      return;
    }

    const sector = sectors.find(s => s.id === sectorId);
    if (!sector) {
      setError('Setor inválido.');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const documentId = generateGuardedDocumentId();
      const { fileUrl, storagePath } = await uploadGuardedDocumentFile(file, sectorId, documentId, 1, setProgress);

      const nowIso = new Date().toISOString();
      const uploaderName = currentUser?.name || currentUser?.username || 'Usuário';

      const newDoc: GuardedDocument = {
        id: documentId,
        title: title.trim(),
        sectorId,
        sectorName: sector.name,
        documentType: effectiveType.trim(),
        description: description.trim() || undefined,

        fileName: file.name,
        fileUrl,
        storagePath,
        fileSize: file.size,
        fileType: file.type,

        uploadedBy: uploaderName,
        uploadedByEmployeeId: currentUserEmployee?.id,
        uploadedAt: nowIso,

        retentionYears,
        retentionUntil: calculateRetentionUntil(nowIso, retentionYears),
        status: 'ativo',

        extraViewerSectorIds: extraViewerSectorIds.length > 0 ? extraViewerSectorIds : undefined,

        version: 1,
        previousVersions: [],

        auditLog: [
          {
            action: 'upload',
            user: uploaderName,
            date: nowIso
          }
        ]
      };

      onSaved(newDoc);
      onClose();
    } catch (err: any) {
      console.error('Erro ao enviar documento:', err);
      setError(err?.message || 'Falha ao enviar o documento. Tente novamente.');
      setUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
      onClick={() => !uploading && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <UploadCloud className="w-4.5 h-4.5 text-rose-500" /> Enviar Documento
          </h3>
          {!uploading && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dropzone de arquivo */}
          <div
            onDragOver={e => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => {
              e.preventDefault();
              setIsDragging(false);
              handleFileChosen(e.dataTransfer.files?.[0] || null);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
              isDragging
                ? 'border-sky-500 bg-sky-500/5'
                : file
                ? 'border-emerald-500/40 bg-emerald-500/5'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS.join(',')}
              className="hidden"
              onChange={e => handleFileChosen(e.target.files?.[0] || null)}
            />
            {file ? (
              <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span className="text-xs font-bold truncate max-w-[280px]">{file.name}</span>
                <span className="text-[10px] text-slate-400">({(file.size / 1024).toFixed(0)} KB)</span>
              </div>
            ) : (
              <>
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Arraste um arquivo aqui, ou clique para escolher
                </p>
                <p className="text-[10px] text-slate-400 mt-1">
                  {ACCEPTED_EXTENSIONS.join(', ')} — até 20MB
                </p>
              </>
            )}
          </div>

          {/* Título */}
          <div className="space-y-1">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Título</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Contrato de locação - Sala 12"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Setor */}
            <div className="space-y-1">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Setor</label>
              <select
                value={sectorId}
                onChange={e => setSectorId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500"
              >
                {sectors.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Tipo de documento */}
            <div className="space-y-1">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tipo</label>
              <select
                value={documentType}
                onChange={e => handleDocumentTypeChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500"
              >
                {DOCUMENT_TYPE_SUGGESTIONS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {documentType === 'Outro' && (
            <div className="space-y-1">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">Especifique o tipo</label>
              <input
                type="text"
                value={customType}
                onChange={e => setCustomType(e.target.value)}
                placeholder="Ex: Laudo Técnico"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>
          )}

          {/* Tempo de guarda */}
          <div className="space-y-1">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tempo de guarda (anos)
            </label>
            <input
              type="number"
              min={1}
              value={retentionYears}
              onChange={e => setRetentionYears(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500"
            />
            <p className="text-[10px] text-slate-400">
              Sugestão automática por tipo — sempre editável.
            </p>
          </div>

          {/* Descrição opcional */}
          <div className="space-y-1">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Descrição (opcional)
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 resize-none"
            />
          </div>

          {/* Setores extras com permissão de visualização */}
          {sectors.length > 1 && (
            <div className="space-y-1.5">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Setores extras com permissão de visualização (opcional)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {sectors.filter(s => s.id !== sectorId).map(s => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => toggleExtraViewer(s.id)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                      extraViewerSectorIds.includes(s.id)
                        ? 'bg-sky-500/15 border-sky-500/40 text-sky-600 dark:text-sky-400'
                        : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {uploading && (
            <div className="space-y-1">
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-sky-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[10px] text-slate-400 text-center">Enviando... {progress}%</p>
            </div>
          )}

          <div className="pt-1 flex items-center justify-end gap-2">
            {!uploading && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={uploading}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                uploading
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Enviando...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" /> Enviar
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
