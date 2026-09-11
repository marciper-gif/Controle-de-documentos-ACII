import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Search, Trash2, Edit, Filter, Mail, Phone, Calendar, 
  Briefcase, Layers, User, FileText, Check, X, ShieldAlert, 
  MapPin, Clipboard, FileCheck, Info, UserCheck, AlertCircle, Home
} from 'lucide-react';
import { Employee, SectorData, POP, ATR, IT, UserAccount } from '../types';
import { dbSaveUserAccount, dbDeleteEmployee } from '../lib/firebaseSync';
import { hashPassword, getDefaultInitialPassword } from '../lib/userManagement';

interface EmployeeManagerProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  sectors: SectorData[];
  pops: POP[];
  atrs: ATR[];
  its: IT[];
  onViewDoc: (id: string, type: 'pop' | 'atr' | 'it') => void;
  canEditEmployees?: boolean;
  users?: UserAccount[];
  setUsers?: React.Dispatch<React.SetStateAction<UserAccount[]>>;
}

export default function EmployeeManager({
  employees,
  setEmployees,
  sectors,
  pops,
  atrs,
  its,
  onViewDoc,
  canEditEmployees = true,
  users = [],
  setUsers
}: EmployeeManagerProps) {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [sectorFilter, setSectorFilter] = useState<string>('Todos');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Form Fields state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formSector, setFormSector] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formAdmissionDate, setFormAdmissionDate] = useState('');
  const [formStatus, setFormStatus] = useState<'Ativo' | 'Inativo'>('Ativo');
  const [formCpf, setFormCpf] = useState('');
  const [formRegistration, setFormRegistration] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formAssociatedPOPs, setFormAssociatedPOPs] = useState<string[]>([]);
  const [formAssociatedATRs, setFormAssociatedATRs] = useState<string[]>([]);
  const [formAssociatedITs, setFormAssociatedITs] = useState<string[]>([]);

  // Open form for creating
  const handleOpenCreate = () => {
    setEditingEmployee(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormSector(sectors[0]?.name || '');
    setFormRole('');
    setFormAdmissionDate(new Date().toLocaleDateString('pt-BR'));
    setFormStatus('Ativo');
    setFormCpf('');
    setFormRegistration('');
    setFormNotes('');
    setFormAssociatedPOPs([]);
    setFormAssociatedATRs([]);
    setFormAssociatedITs([]);
    setIsFormOpen(true);
  };

  // Open form for editing
  const handleOpenEdit = (emp: Employee, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEmployee(emp);
    setFormName(emp.name);
    setFormEmail(emp.email);
    setFormPhone(emp.phone);
    setFormSector(emp.sector);
    setFormRole(emp.role);
    setFormAdmissionDate(emp.admissionDate);
    setFormStatus(emp.status);
    setFormCpf(emp.cpf || '');
    setFormRegistration(emp.registrationNumber || '');
    setFormNotes(emp.notes || '');
    setFormAssociatedPOPs(emp.associatedPOPs || []);
    setFormAssociatedATRs(emp.associatedATRs || []);
    setFormAssociatedITs(emp.associatedITs || []);
    setIsFormOpen(true);
  };

  // Delete employee
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja remover este funcionário?')) {
      dbDeleteEmployee(id);
      setEmployees(prev => prev.filter(emp => emp.id !== id));
      if (selectedEmployee?.id === id) {
        setSelectedEmployee(null);
      }
    }
  };

  // Form submit handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Required fields check: Name, CPF, Phone, and Email
    if (!formName.trim() || !formCpf.trim() || !formPhone.trim() || !formEmail.trim()) {
      alert('Nome Completo, CPF, Telefone/WhatsApp e E-mail Corporativo são campos de preenchimento obrigatório!');
      return;
    }

    const cpfLimpo = formCpf.replace(/\D/g, "");

    if (editingEmployee) {
      // Update Employee
      const updated: Employee = {
        ...editingEmployee,
        name: formName,
        email: formEmail,
        phone: formPhone,
        sector: formSector,
        role: formRole || 'Colaborador',
        admissionDate: formAdmissionDate,
        status: formStatus,
        cpf: formCpf,
        registrationNumber: formRegistration,
        notes: formNotes,
        associatedPOPs: formAssociatedPOPs,
        associatedATRs: formAssociatedATRs,
        associatedITs: formAssociatedITs
      };
      setEmployees(prev => prev.map(emp => emp.id === editingEmployee.id ? updated : emp));
      if (selectedEmployee?.id === editingEmployee.id) {
        setSelectedEmployee(updated);
      }

      // Sync name / CPF if user account exists
      if (setUsers) {
        setUsers(prev => prev.map(u => {
          if (u.employeeId === editingEmployee.id || u.id === editingEmployee.id) {
            const newUsername = cpfLimpo.length > 0 ? cpfLimpo : u.username;
            const updatedUserAcc: UserAccount = {
              ...u,
              name: formName,
              username: newUsername
            };
            dbSaveUserAccount(updatedUserAcc);
            return updatedUserAcc;
          }
          return u;
        }));
      }
    } else {
      // Create Employee
      const newEmpId = `EMP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const newEmp: Employee = {
        id: newEmpId,
        name: formName,
        email: formEmail,
        phone: formPhone,
        sector: formSector,
        role: formRole || 'Colaborador',
        admissionDate: formAdmissionDate,
        status: formStatus,
        cpf: formCpf,
        registrationNumber: formRegistration,
        notes: formNotes,
        associatedPOPs: formAssociatedPOPs,
        associatedATRs: formAssociatedATRs,
        associatedITs: formAssociatedITs
      };
      setEmployees(prev => [newEmp, ...prev]);

      // Automatically create UserAccount with CPF as login and [FirstName]123 / [CPF]123 as default initial password
      const usernameLogin = cpfLimpo.length > 0 
        ? cpfLimpo 
        : (formRegistration || newEmpId.toLowerCase());
      
      const defaultPassword = getDefaultInitialPassword(formName, formCpf);
      const passHash = await hashPassword(defaultPassword);

      const newUserAccount: UserAccount = {
        id: newEmpId,
        username: usernameLogin,
        name: formName,
        passwordHash: passHash,
        role: 'colaborador',
        employeeId: newEmpId,
        firstAccess: true,
        primeiro_acesso: true,
        accountStatus: 'ativo',
        status: 'Ativo'
      };

      if (setUsers) {
        setUsers(prev => [newUserAccount, ...prev.filter(u => u.id !== newEmpId)]);
      }
      dbSaveUserAccount(newUserAccount);
    }
    setIsFormOpen(false);
  };

  // Filtered employees list
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.registrationNumber && emp.registrationNumber.includes(searchTerm));

    const matchesSector = sectorFilter === 'Todos' || emp.sector === sectorFilter;
    const matchesStatus = statusFilter === 'Todos' || emp.status === statusFilter;

    return matchesSearch && matchesSector && matchesStatus;
  });

  // Toggle POP selection in form
  const handleTogglePOP = (id: string) => {
    setFormAssociatedPOPs(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Toggle ATR selection in form
  const handleToggleATR = (id: string) => {
    setFormAssociatedATRs(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Toggle IT selection in form
  const handleToggleIT = (id: string) => {
    setFormAssociatedITs(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase font-display tracking-tight">
              Base de Funcionários (Colaboradores)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Cadastre, edite e vincule colaboradores às suas atribuições de cargo (ATRs) e rotinas operacionais (POPs).
            </p>
          </div>
          {canEditEmployees && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
              id="btn-add-employee"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Funcionário</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome, cargo, e-mail, telefone..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:border-sky-500 text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Sector Filter */}
          <div className="relative">
            <select
              value={sectorFilter}
              onChange={e => setSectorFilter(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:border-sky-500 text-slate-800 dark:text-slate-200 appearance-none"
            >
              <option value="Todos">Setor: Todos</option>
              {sectors.map(sec => (
                <option key={sec.id} value={sec.name}>{sec.name}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
              <Filter className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl focus:outline-none focus:border-sky-500 text-slate-800 dark:text-slate-200 appearance-none"
            >
              <option value="Todos">Status: Todos</option>
              <option value="Ativo">Ativos</option>
              <option value="Inativo">Inativos</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
              <Filter className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid of employees */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {filteredEmployees.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-850">
              <User className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-4">Nenhum funcionário encontrado</p>
              <p className="text-xs text-slate-400 mt-1">Experimente alterar as palavras-chave ou os filtros ativos.</p>
            </div>
          ) : (
            filteredEmployees.map(emp => (
              <motion.div
                key={emp.id}
                layoutId={`emp-card-${emp.id}`}
                whileHover={{ y: -3 }}
                onClick={() => setSelectedEmployee(emp)}
                className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-850 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer relative flex flex-col justify-between h-[230px]"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200/50 dark:border-slate-700 text-slate-600 dark:text-slate-350 shrink-0">
                        <User className="w-5 h-5 text-indigo-500" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 dark:text-white truncate text-sm">
                          {emp.name}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold truncate mt-0.5">
                          {emp.role}
                        </p>
                      </div>
                    </div>
                    
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      emp.status === 'Ativo'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                    }`}>
                      {emp.status}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{emp.email || 'Não informado'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{emp.phone || 'Não informado'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{emp.sector}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between mt-auto">
                  <div className="flex gap-1.5 flex-wrap">
                    <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-indigo-500/15 flex items-center gap-1">
                      <Briefcase className="w-2.5 h-2.5" />
                      <span>{emp.associatedATRs?.length || 0} ATR</span>
                    </span>
                    <span className="bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-sky-500/15 flex items-center gap-1">
                      <Layers className="w-2.5 h-2.5" />
                      <span>{emp.associatedPOPs?.length || 0} POP</span>
                    </span>
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/15 flex items-center gap-1" title="Instruções de Trabalho">
                      <FileText className="w-2.5 h-2.5" />
                      <span>{emp.associatedITs?.length || 0} IT</span>
                    </span>
                  </div>

                  {canEditEmployees && (
                    <div className="flex items-center gap-1.5 opacity-80 hover:opacity-100">
                      <button
                        onClick={(e) => handleOpenEdit(emp, e)}
                        className="p-1.5 text-slate-500 hover:text-sky-600 dark:text-slate-400 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Editar funcionário"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(emp.id, e)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Excluir funcionário"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Form Dialog Modal (Create / Edit) */}
      <AnimatePresence>
        {isFormOpen && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-slate-150 dark:border-slate-800/80 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase font-display">
                    {editingEmployee ? 'Editar Ficha do Colaborador' : 'Cadastrar Novo Colaborador'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Preencha os dados abaixo e configure os vínculos do funcionário.</p>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Nome Completo */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Amanda Bezerra de Oliveira"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 transition-colors text-xs"
                    />
                  </div>

                  {/* Cargo */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Cargo / Função *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Auxiliar de Cadastro"
                      value={formRole}
                      onChange={e => setFormRole(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 transition-colors text-xs"
                      list="roles-suggestions"
                    />
                    <datalist id="roles-suggestions">
                      {Array.from(new Set(atrs.map(a => a.title))).map(title => (
                        <option key={title} value={title} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Setor */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Setor de Atuação</label>
                    <select
                      value={formSector}
                      onChange={e => setFormSector(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                    >
                      {sectors.map(sec => (
                        <option key={sec.id} value={sec.name}>{sec.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* CPF */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">CPF (Tax ID) *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: 000.000.000-00"
                      value={formCpf}
                      onChange={e => setFormCpf(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 transition-colors text-xs"
                    />
                  </div>

                  {/* Matrícula */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Matrícula (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ex: 2026-045"
                      value={formRegistration}
                      onChange={e => setFormRegistration(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 transition-colors text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">E-mail Corporativo *</label>
                    <input
                      type="email"
                      required
                      placeholder="Ex: colaborador@acii.org.br"
                      value={formEmail}
                      onChange={e => setFormEmail(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 transition-colors text-xs"
                    />
                  </div>

                  {/* Telefone */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">WhatsApp / Fone *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: (99) 98122-3344"
                      value={formPhone}
                      onChange={e => setFormPhone(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 transition-colors text-xs"
                    />
                  </div>

                  {/* Data de Admissão */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Data de Admissão</label>
                    <input
                      type="text"
                      placeholder="Ex: 25/06/2026"
                      value={formAdmissionDate}
                      onChange={e => setFormAdmissionDate(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 transition-colors text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Status */}
                  <div className="md:col-span-1">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Status Corporativo</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormStatus('Ativo')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                          formStatus === 'Ativo'
                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-3xs'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-400'
                        }`}
                      >
                        Ativo
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormStatus('Inativo')}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                          formStatus === 'Inativo'
                            ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 shadow-3xs'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 text-slate-400'
                        }`}
                      >
                        Inativo
                      </button>
                    </div>
                  </div>

                  {/* Observações */}
                  <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Notas / Histórico (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Outras observações como competências pendentes, metas específicas ou anotações."
                      value={formNotes}
                      onChange={e => setFormNotes(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 transition-colors text-xs"
                    />
                  </div>
                </div>

                               {/* VÍNCULO DE DOCUMENTOS (ATRs, POPs e ITs) */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-500" />
                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Vincular a Atribuições e Processos</h4>
                  </div>
                  <p className="text-3xs md:text-2xs text-slate-500 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-850">
                    O funcionário será associado aos documentos oficiais abaixo. Isso permite definir e monitorar de forma rápida quais colaboradores executam cada processo e respondem por cada atribuição.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* List of ATRs */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
                          Atribuições (ATRs)
                        </span>
                        <span className="text-3xs text-slate-400">({formAssociatedATRs.length} sel.)</span>
                      </div>
                      
                      <div className="max-h-[160px] overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-950/20 space-y-1.5 animate-once">
                        {atrs.map(atr => (
                          <div 
                            key={atr.id}
                            onClick={() => handleToggleATR(atr.id)}
                            className={`flex items-center gap-2.5 p-2 rounded-lg text-xs cursor-pointer border transition-colors ${
                              formAssociatedATRs.includes(atr.id)
                                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-semibold'
                                : 'bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-850 hover:bg-slate-50'
                            }`}
                          >
                            <input 
                              type="checkbox" 
                              checked={formAssociatedATRs.includes(atr.id)}
                              onChange={() => {}} // Handled by outer click
                              className="pointer-events-none rounded accent-indigo-500"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-bold text-3xs text-slate-400 uppercase tracking-widest">{atr.id} • {atr.sector}</p>
                              <p className="truncate">{atr.title}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* List of POPs */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-sky-500" />
                          Processos (POPs)
                        </span>
                        <span className="text-3xs text-slate-400">({formAssociatedPOPs.length} sel.)</span>
                      </div>
                      
                      <div className="max-h-[160px] overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-950/20 space-y-1.5">
                        {pops.map(pop => (
                          <div 
                            key={pop.id}
                            onClick={() => handleTogglePOP(pop.id)}
                            className={`flex items-center gap-2.5 p-2 rounded-lg text-xs cursor-pointer border transition-colors ${
                              formAssociatedPOPs.includes(pop.id)
                                ? 'bg-sky-500/10 border-sky-500/30 text-sky-700 dark:text-sky-300 font-semibold'
                                : 'bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-850 hover:bg-slate-50'
                            }`}
                          >
                            <input 
                              type="checkbox" 
                              checked={formAssociatedPOPs.includes(pop.id)}
                              onChange={() => {}} // Handled by outer click
                              className="pointer-events-none rounded accent-sky-500"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-bold text-3xs text-slate-400 uppercase tracking-widest">{pop.id} • {pop.sector}</p>
                              <p className="truncate">{pop.title}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* List of ITs */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-emerald-500" />
                          Instruções (ITs)
                        </span>
                        <span className="text-3xs text-slate-400">({formAssociatedITs.length} sel.)</span>
                      </div>
                      
                      <div className="max-h-[160px] overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-950/20 space-y-1.5">
                        {its.map(it => (
                          <div 
                            key={it.id}
                            onClick={() => handleToggleIT(it.id)}
                            className={`flex items-center gap-2.5 p-2 rounded-lg text-xs cursor-pointer border transition-colors ${
                              formAssociatedITs.includes(it.id)
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold'
                                : 'bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-850 hover:bg-slate-50'
                            }`}
                          >
                            <input 
                              type="checkbox" 
                              checked={formAssociatedITs.includes(it.id)}
                              onChange={() => {}} // Handled by outer click
                              className="pointer-events-none rounded accent-emerald-500"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-bold text-3xs text-slate-400 uppercase tracking-widest">{it.id} • {it.sector}</p>
                              <p className="truncate">{it.title}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit actions */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md transition-all cursor-pointer"
                  >
                    Salvar Ficha
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Detail Card View (Popup Modal) */}
      <AnimatePresence>
        {selectedEmployee && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <motion.div
              layoutId={`emp-card-${selectedEmployee.id}`}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-sm"
            >
              {/* Header profile design */}
              <div className="p-6 bg-gradient-to-r from-indigo-500/10 via-sky-500/5 to-transparent border-b border-slate-150 dark:border-slate-800 flex justify-between items-start">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-indigo-600 text-white font-black text-lg flex items-center justify-center rounded-2xl shadow-lg border-2 border-white dark:border-slate-900">
                    {selectedEmployee.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white uppercase font-display tracking-tight leading-none">
                        {selectedEmployee.name}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                        selectedEmployee.status === 'Ativo'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                      }`}>
                        {selectedEmployee.status}
                      </span>
                    </div>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase mt-1.5">{selectedEmployee.role}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-mono tracking-widest mt-1">ID: {selectedEmployee.id}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Details list */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-150 dark:border-slate-850">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Setor Operacional</span>
                    <p className="font-bold text-slate-850 dark:text-slate-150 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-sky-500" />
                      <span>{selectedEmployee.sector}</span>
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Data de Admissão</span>
                    <p className="font-bold text-slate-850 dark:text-slate-150 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-sky-500" />
                      <span>{selectedEmployee.admissionDate}</span>
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">E-mail Corporativo</span>
                    <p className="font-medium text-slate-850 dark:text-slate-150 flex items-center gap-1.5 truncate">
                      <Mail className="w-4 h-4 text-sky-500 shrink-0" />
                      <span className="truncate">{selectedEmployee.email || 'Não informado'}</span>
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">WhatsApp / Telefone</span>
                    <p className="font-bold text-slate-850 dark:text-slate-150 flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-sky-500" />
                      <span>{selectedEmployee.phone || 'Não informado'}</span>
                    </p>
                  </div>

                  {selectedEmployee.cpf && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">CPF</span>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{selectedEmployee.cpf}</p>
                    </div>
                  )}

                  {selectedEmployee.registrationNumber && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">Matrícula</span>
                      <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{selectedEmployee.registrationNumber}</p>
                    </div>
                  )}
                </div>

                {/* Observações / Notas */}
                {selectedEmployee.notes && (
                  <div className="space-y-2">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-indigo-500" />
                      Notas Históricas
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 italic bg-amber-500/5 border border-amber-500/15 p-3 rounded-xl leading-relaxed">
                      "{selectedEmployee.notes}"
                    </p>
                  </div>
                )}

                {/* VÍNCULOS OFICIAIS */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <FileCheck className="w-4 h-4 text-indigo-500" />
                    Documentos Oficiais Vinculados
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* ATRs list */}
                    <div className="space-y-2.5">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-indigo-500" />
                        Atribuições (ATRs)
                      </span>

                      {(!selectedEmployee.associatedATRs || selectedEmployee.associatedATRs.length === 0) ? (
                        <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                          Nenhum cargo ATR formal vinculado.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {selectedEmployee.associatedATRs.map(id => {
                            const atr = atrs.find(a => a.id === id);
                            return (
                              <div
                                key={id}
                                onClick={() => {
                                  onViewDoc(id, 'atr');
                                  setSelectedEmployee(null);
                                }}
                                className="p-3 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/15 hover:border-indigo-500/30 rounded-xl transition-all cursor-pointer flex justify-between items-center group"
                              >
                                <div className="min-w-0 pr-2">
                                  <span className="text-[9px] font-black font-mono uppercase bg-indigo-500/10 text-indigo-600 px-1.5 py-0.5 rounded">
                                    {id}
                                  </span>
                                  <p className="font-bold text-slate-900 dark:text-white truncate mt-1.5 text-xs">
                                    {atr ? atr.title : 'Cargo não encontrado'}
                                  </p>
                                </div>
                                <span className="text-3xs text-indigo-500 font-bold group-hover:translate-x-0.5 transition-transform shrink-0">
                                  Ver →
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* POPs list */}
                    <div className="space-y-2.5">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-sky-500" />
                        Processos (POPs)
                      </span>

                      {(!selectedEmployee.associatedPOPs || selectedEmployee.associatedPOPs.length === 0) ? (
                        <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                          Nenhum procedimento POP vinculado.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {selectedEmployee.associatedPOPs.map(id => {
                            const pop = pops.find(p => p.id === id);
                            return (
                              <div
                                key={id}
                                onClick={() => {
                                  onViewDoc(id, 'pop');
                                  setSelectedEmployee(null);
                                }}
                                className="p-3 bg-sky-500/5 hover:bg-sky-500/10 border border-sky-500/15 hover:border-sky-500/30 rounded-xl transition-all cursor-pointer flex justify-between items-center group"
                              >
                                <div className="min-w-0 pr-2">
                                  <span className="text-[9px] font-black font-mono uppercase bg-sky-500/10 text-sky-600 px-1.5 py-0.5 rounded">
                                    {id}
                                  </span>
                                  <p className="font-bold text-slate-900 dark:text-white truncate mt-1.5 text-xs">
                                    {pop ? pop.title : 'Processo não encontrado'}
                                  </p>
                                </div>
                                <span className="text-3xs text-sky-500 font-bold group-hover:translate-x-0.5 transition-transform shrink-0">
                                  Ver →
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* ITs list */}
                    <div className="space-y-2.5">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-emerald-500" />
                        Instruções (ITs)
                      </span>

                      {(!selectedEmployee.associatedITs || selectedEmployee.associatedITs.length === 0) ? (
                        <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                          Nenhuma instrução IT vinculada.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {selectedEmployee.associatedITs.map(id => {
                            const it = its.find(i => i.id === id);
                            return (
                              <div
                                key={id}
                                onClick={() => {
                                  onViewDoc(id, 'it');
                                  setSelectedEmployee(null);
                                }}
                                className="p-3 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/15 hover:border-emerald-500/30 rounded-xl transition-all cursor-pointer flex justify-between items-center group"
                              >
                                <div className="min-w-0 pr-2">
                                  <span className="text-[9px] font-black font-mono uppercase bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded">
                                    {id}
                                  </span>
                                  <p className="font-bold text-slate-900 dark:text-white truncate mt-1.5 text-xs">
                                    {it ? it.title : 'Instrução não encontrada'}
                                  </p>
                                </div>
                                <span className="text-3xs text-emerald-500 font-bold group-hover:translate-x-0.5 transition-transform shrink-0">
                                  Ver →
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-150 dark:border-slate-800 flex justify-end gap-3.5">
                {canEditEmployees && (
                  <button
                    onClick={(e) => {
                      handleOpenEdit(selectedEmployee, e);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer border border-slate-200/60 dark:border-slate-700 flex items-center gap-2"
                  >
                    <Edit className="w-3.5 h-3.5 text-sky-500" />
                    <span>Editar Ficha</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedEmployee(null)}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm"
                >
                  Fechar Ficha
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
