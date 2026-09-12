import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Trash2, Edit, X, LayoutGrid, CheckCircle2, 
  HelpCircle, AlertTriangle, Building, BookOpen, Users, FolderOpen
} from 'lucide-react';
import { SectorData, Employee, POP, ATR } from '../types';
import { dbDeleteSector } from '../lib/firebaseSync';

interface SectorManagerProps {
  sectors: SectorData[];
  setSectors: React.Dispatch<React.SetStateAction<SectorData[]>>;
  employees: Employee[];
  pops: POP[];
  atrs: ATR[];
  companyId?: string | null;
  canEditSectors?: boolean;
}

// Predefined stylish tailwind colors for sector cards
const COLOR_PALETTES = [
  { name: 'Sky Blue', value: 'border-sky-500/20 hover:border-sky-500 bg-sky-500/5 hover:bg-sky-500/10 text-sky-600 dark:text-sky-400' },
  { name: 'Emerald Green', value: 'border-emerald-500/20 hover:border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-450' },
  { name: 'Amber Gold', value: 'border-amber-500/20 hover:border-amber-500 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  { name: 'Indigo Purple', value: 'border-indigo-500/20 hover:border-indigo-500 bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
  { name: 'Rose Red', value: 'border-rose-500/20 hover:border-rose-500 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-455' },
  { name: 'Purple Violet', value: 'border-purple-500/20 hover:border-purple-500 bg-purple-500/5 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  { name: 'Teal Aqua', value: 'border-teal-500/20 hover:border-teal-500 bg-teal-500/5 hover:bg-teal-500/10 text-teal-600 dark:text-teal-400' },
  { name: 'Slate Steel', value: 'border-slate-500/20 hover:border-slate-500 bg-slate-500/5 hover:bg-slate-500/10 text-slate-600 dark:text-slate-400' }
];

export default function SectorManager({
  sectors,
  setSectors,
  employees,
  pops,
  atrs,
  companyId = null,
  canEditSectors = true
}: SectorManagerProps) {
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<SectorData | null>(null);
  
  // Form Fields
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState(COLOR_PALETTES[0].value);

  // Open modal for creating
  const handleOpenCreate = () => {
    setEditingSector(null);
    setFormName('');
    setFormDescription('');
    setFormColor(COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)].value);
    setIsFormOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (sec: SectorData) => {
    setEditingSector(sec);
    setFormName(sec.name);
    setFormDescription(sec.description || '');
    setFormColor(sec.color || COLOR_PALETTES[0].value);
    setIsFormOpen(true);
  };

  // Delete a sector with dependency check
  const handleDeleteSector = (sec: SectorData) => {
    // Check if sector is used in POPs, ATRs, or Employees
    const matchingPOPs = pops.filter(p => p.sector.toLowerCase() === sec.name.toLowerCase());
    const matchingATRs = atrs.filter(a => a.sector.toLowerCase() === sec.name.toLowerCase());
    const matchingEmployees = employees.filter(e => e.sector.toLowerCase() === sec.name.toLowerCase());

    const isUsed = matchingPOPs.length > 0 || matchingATRs.length > 0 || matchingEmployees.length > 0;

    if (isUsed) {
      let warningMessage = `Não é possível remover o setor "${sec.name}" porque ele possui os seguintes vínculos:\n`;
      if (matchingPOPs.length > 0) warningMessage += `- ${matchingPOPs.length} POP(s)\n`;
      if (matchingATRs.length > 0) warningMessage += `- ${matchingATRs.length} ATR(s)\n`;
      if (matchingEmployees.length > 0) warningMessage += `- ${matchingEmployees.length} Funcionário(s) cadastrado(s)\n`;
      
      warningMessage += `\nPor favor, remova ou altere esses vínculos antes de excluir o setor.`;
      alert(warningMessage);
      return;
    }

    if (window.confirm(`Tem certeza que deseja remover o setor "${sec.name}"?`)) {
      dbDeleteSector(sec.id, sec.companyId ?? companyId);
      setSectors(prev => prev.filter(s => s.id !== sec.id));
    }
  };

  // Submit sector form
  const handleSaveSector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Nome do setor é obrigatório!');
      return;
    }

    // Check duplicate name
    const exists = sectors.some(s => 
      s.name.toLowerCase() === formName.trim().toLowerCase() && 
      (!editingSector || s.id !== editingSector.id)
    );

    if (exists) {
      alert(`Já existe um setor cadastrado com o nome "${formName}". Escolha outro nome.`);
      return;
    }

    if (editingSector) {
      // Update
      const updated: SectorData = {
        ...editingSector,
        name: formName.trim(),
        description: formDescription.trim(),
        color: formColor
      };
      setSectors(prev => prev.map(s => s.id === editingSector.id ? updated : s));
    } else {
      // Create — código sempre limpo, sem sufixo: o endereço real no
      // Firestore (que evita colisão entre empresas) é resolvido à parte
      // por tenantDocPath (ver dbSaveSector em firebaseSync.ts), nunca
      // aparece aqui.
      const newSec: SectorData = {
        id: `SEC-${Math.floor(100 + Math.random() * 900)}`,
        name: formName.trim(),
        description: formDescription.trim(),
        color: formColor
      };
      setSectors(prev => [...prev, newSec]);
    }

    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase font-display tracking-tight">
              Base de Setores e Departamentos
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Cadastre novos departamentos da empresa, forneça escopos descritivos e organize seus fluxogramas e equipes por área.
            </p>
          </div>
          {canEditSectors && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              id="btn-add-sector"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Novo Setor</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Sector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {sectors.map(sec => {
            const numPOPs = pops.filter(p => p.sector.toLowerCase() === sec.name.toLowerCase()).length;
            const numATRs = atrs.filter(a => a.sector.toLowerCase() === sec.name.toLowerCase()).length;
            const numEmployees = employees.filter(e => e.sector.toLowerCase() === sec.name.toLowerCase()).length;

            return (
              <motion.div
                key={sec.id}
                layoutId={`sec-card-${sec.id}`}
                whileHover={{ y: -3 }}
                className={`border rounded-2xl p-5 flex flex-col justify-between h-[220px] transition-all bg-white dark:bg-slate-900/60 shadow-xs ${sec.color || COLOR_PALETTES[0].value}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-500/10 flex items-center justify-center border border-slate-200/40 text-slate-700 dark:text-slate-300">
                        <Building className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm tracking-tight truncate max-w-[150px] text-slate-900 dark:text-white uppercase">
                          {sec.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-mono tracking-wider">ID: {sec.id}</p>
                      </div>
                    </div>

                    {canEditSectors && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleOpenEdit(sec)}
                          className="p-1.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Editar Setor"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSector(sec)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-450 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Excluir Setor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-3.5 line-clamp-3 leading-relaxed">
                    {sec.description || 'Nenhuma descrição detalhada fornecida para este setor.'}
                  </p>
                </div>

                <div className="pt-4 mt-auto border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
                  <div className="bg-slate-100/60 dark:bg-slate-950/30 p-1.5 rounded border border-slate-150/45 dark:border-slate-850 text-slate-650 dark:text-slate-400 flex flex-col justify-center">
                    <span className="text-xs font-black text-slate-900 dark:text-white leading-tight">{numEmployees}</span>
                    <span className="text-[9px] text-slate-400 font-normal uppercase leading-tight mt-0.5">Equipe</span>
                  </div>
                  <div className="bg-slate-100/60 dark:bg-slate-950/30 p-1.5 rounded border border-slate-150/45 dark:border-slate-850 text-slate-650 dark:text-slate-400 flex flex-col justify-center">
                    <span className="text-xs font-black text-slate-900 dark:text-white leading-tight">{numPOPs}</span>
                    <span className="text-[9px] text-slate-400 font-normal uppercase leading-tight mt-0.5">POPs</span>
                  </div>
                  <div className="bg-slate-100/60 dark:bg-slate-950/30 p-1.5 rounded border border-slate-150/45 dark:border-slate-850 text-slate-650 dark:text-slate-400 flex flex-col justify-center">
                    <span className="text-xs font-black text-slate-900 dark:text-white leading-tight">{numATRs}</span>
                    <span className="text-[9px] text-slate-400 font-normal uppercase leading-tight mt-0.5">ATRs</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Form modal */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase font-display">
                    {editingSector ? 'Editar Departamento' : 'Criar Novo Setor'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Defina a nomenclatura, responsabilidade e estilo visual do setor.</p>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSector} className="p-6 space-y-4 text-sm">
                {/* Nome do setor */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Nome do Setor *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Comercial ou Ouvidoria"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors text-xs"
                  />
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Descrição do Escopo (Opcional)</label>
                  <textarea
                    rows={3}
                    placeholder="Quais são as principais responsabilidades, metas e o escopo de atuação desta área na empresa?"
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors text-xs"
                  />
                </div>

                {/* Escolha de Cor/Tema */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Paleta Visual (Tema)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {COLOR_PALETTES.map(col => {
                      const isSelected = formColor === col.value;
                      return (
                        <button
                          key={col.name}
                          type="button"
                          onClick={() => setFormColor(col.value)}
                          className={`p-2.5 rounded-lg border text-center text-[10px] font-semibold transition-all cursor-pointer ${col.value} ${
                            isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 shadow-sm font-bold' : ''
                          }`}
                        >
                          {col.name.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Submit actions */}
                <div className="pt-4 border-t border-slate-150 dark:border-slate-800 flex justify-end gap-3 mt-5">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all cursor-pointer"
                  >
                    Salvar Setor
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
