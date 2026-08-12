import { useState, FormEvent, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, UserPlus, Users, Trash2, Edit2, ShieldAlert, Key, 
  CheckCircle, User, ShieldCheck, Eye, EyeOff, Sliders, Shield, Award, HelpCircle,
  Briefcase, Layers, FileText, Plus, Search, Lock, History, Clock, ArrowUpRight,
  RotateCcw, Power, Check
} from 'lucide-react';
import { UserAccount, Employee, ProfilePermissions, POP, ATR, IT } from '../types';
import { dbSaveUserAccount, dbDeleteUserAccount } from '../lib/firebaseSync';
import { getDefaultInitialPassword, hashPassword } from '../lib/userManagement';

interface DocumentLogEntry {
  docId: string;
  docTitle: string;
  docType: 'POP' | 'ATR' | 'IT';
  revision: string;
  date: string;
  description: string;
  author: string;
  timestamp: number;
}

interface AdminUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserAccount[];
  onUpdateUsers: (newUsers: UserAccount[]) => void;
  currentUser: UserAccount;
  employees: Employee[];
  onUpdateEmployees: (newEmployees: Employee[]) => void;
  profilePermissions: ProfilePermissions;
  onUpdatePermissions: (newPerms: ProfilePermissions) => void;
  pops: POP[];
  atrs: ATR[];
  its: IT[];
  onSelectDoc?: (id: string, type: 'pop' | 'atr' | 'it') => void;
}

export default function AdminUsersModal({ 
  isOpen, 
  onClose, 
  users, 
  onUpdateUsers, 
  currentUser,
  employees,
  onUpdateEmployees,
  profilePermissions,
  onUpdatePermissions,
  pops,
  atrs,
  its,
  onSelectDoc
}: AdminUsersModalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'profiles' | 'content_control' | 'logs'>('content_control');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  // Search query for the collaborator grid
  const [gridSearchQuery, setGridSearchQuery] = useState('');

  // States for system logs
  const [logsSearchQuery, setLogsSearchQuery] = useState('');
  const [logsTypeFilter, setLogsTypeFilter] = useState<'Todos' | 'POP' | 'ATR' | 'IT'>('Todos');

  // Helper to parse DD/MM/YYYY into timestamp for sorting
  const parseDateToTimestamp = (dateStr: string): number => {
    if (!dateStr) return 0;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day).getTime();
    }
    const timestamp = Date.parse(dateStr);
    return isNaN(timestamp) ? 0 : timestamp;
  };

  // Compile all document logs dynamically
  const allLogs = useMemo(() => {
    const logs: DocumentLogEntry[] = [];

    const extractLogs = (docList: any[], type: 'POP' | 'ATR' | 'IT') => {
      docList.forEach(doc => {
        if (doc.revisionHistory && doc.revisionHistory.length > 0) {
          doc.revisionHistory.forEach((entry: any) => {
            logs.push({
              docId: doc.id,
              docTitle: doc.title,
              docType: type,
              revision: entry.revision,
              date: entry.date,
              description: entry.description,
              author: entry.author || 'Sistema',
              timestamp: parseDateToTimestamp(entry.date)
            });
          });
        } else {
          logs.push({
            docId: doc.id,
            docTitle: doc.title,
            docType: type,
            revision: doc.revision || '00',
            date: doc.emissionDate || '01/03/2026',
            description: 'Emissão Inicial',
            author: 'Sistema',
            timestamp: parseDateToTimestamp(doc.emissionDate || '01/03/2026')
          });
        }
      });
    };

    extractLogs(pops, 'POP');
    extractLogs(atrs, 'ATR');
    extractLogs(its, 'IT');

    return logs.sort((a, b) => {
      if (b.timestamp !== a.timestamp) {
        return b.timestamp - a.timestamp;
      }
      return b.docId.localeCompare(a.docId);
    });
  }, [pops, atrs, its]);

  // Filter logs based on search and type filters
  const filteredLogs = useMemo(() => {
    return allLogs.filter(log => {
      if (logsTypeFilter !== 'Todos' && log.docType !== logsTypeFilter) {
        return false;
      }
      if (logsSearchQuery.trim() !== '') {
        const query = logsSearchQuery.toLowerCase();
        return (
          log.docId.toLowerCase().includes(query) ||
          log.docTitle.toLowerCase().includes(query) ||
          log.author.toLowerCase().includes(query) ||
          log.description.toLowerCase().includes(query) ||
          log.revision.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [allLogs, logsTypeFilter, logsSearchQuery]);
  
  // Form fields
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'gestor' | 'colaborador' | 'lider'>('colaborador');
  const [formEmployeeId, setFormEmployeeId] = useState<string>('');
  const [formStatus, setFormStatus] = useState<'Ativo' | 'Inativo'>('Ativo');
  const [formPrimeiroAcesso, setFormPrimeiroAcesso] = useState<boolean>(false);
  const [autoLinkDocs, setAutoLinkDocs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Password visibility for each user ID
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Temporary passwords being edited before saving
  const [tempPasswords, setTempPasswords] = useState<Record<string, string>>({});

  const handleTempPasswordChange = (userId: string, value: string) => {
    setTempPasswords(prev => ({
      ...prev,
      [userId]: value
    }));
  };

  const handleSaveTempPassword = (userId: string) => {
    const passwordToSave = tempPasswords[userId];
    if (passwordToSave === undefined) return;
    
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        return { ...u, password: passwordToSave };
      }
      return u;
    });
    onUpdateUsers(updatedUsers);
    
    // Clear temp state for this user to hide the Save button
    setTempPasswords(prev => {
      const copy = { ...prev };
      delete copy[userId];
      return copy;
    });

    setSuccess('Senha alterada e salva com sucesso!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleLinkAllDocs = (employeeId: string, type: 'atr' | 'pop' | 'it' | 'all') => {
    const updatedEmployees = employees.map(emp => {
      if (emp.id === employeeId) {
        const nextEmp = { ...emp };
        if (type === 'atr' || type === 'all') {
          const allAtrIds = atrs.map(a => a.id);
          nextEmp.associatedATRs = Array.from(new Set([...(emp.associatedATRs || []), ...allAtrIds]));
        }
        if (type === 'pop' || type === 'all') {
          const allPopIds = pops.map(p => p.id);
          nextEmp.associatedPOPs = Array.from(new Set([...(emp.associatedPOPs || []), ...allPopIds]));
        }
        if (type === 'it' || type === 'all') {
          const allItIds = its.map(i => i.id);
          nextEmp.associatedITs = Array.from(new Set([...(emp.associatedITs || []), ...allItIds]));
        }
        return nextEmp;
      }
      return emp;
    });
    onUpdateEmployees(updatedEmployees);
    setSuccess('Todos os documentos foram vinculados com sucesso!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleStartEdit = (user: UserAccount) => {
    setEditingUserId(user.id);
    setIsAddingNew(true);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormPassword(user.password || '');
    setFormRole(user.role);
    setFormEmployeeId(user.employeeId || '');
    setFormStatus(user.status || 'Ativo');
    setFormPrimeiroAcesso(user.primeiro_acesso ?? false);
    setError(null);
    setSuccess(null);
  };

  const resetForm = () => {
    setIsAddingNew(false);
    setEditingUserId(null);
    setFormName('');
    setFormUsername('');
    setFormPassword('');
    setFormRole('colaborador');
    setFormEmployeeId('');
    setFormStatus('Ativo');
    setFormPrimeiroAcesso(false);
    setAutoLinkDocs(false);
    setError(null);
    setSuccess(null);
  };

  const getDefaultPasswordForName = (fullName: string): string => {
    const firstName = fullName.trim().split(' ')[0] || 'usuario';
    return firstName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '') || 'usuario';
  };

  const handleToggleUserStatus = (userId: string) => {
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        const currentStatus = u.status || 'Ativo';
        const isCurrentlyActive = currentStatus === 'Ativo' || currentStatus === 'ativo';
        const newStatus = isCurrentlyActive ? 'Inativo' : 'Ativo';
        const newAccountStatus = isCurrentlyActive ? 'inativo' : 'ativo';
        return {
          ...u,
          status: newStatus as any,
          accountStatus: newAccountStatus as any
        };
      }
      return u;
    });
    onUpdateUsers(updatedUsers);
    const targetUser = users.find(u => u.id === userId);
    if (targetUser) {
      const isNowActive = (targetUser.status || 'Ativo') !== 'Ativo';
      setSuccess(`Status do usuário "${targetUser.name}" alterado para ${isNowActive ? 'ATIVO' : 'INATIVO'}.`);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleResetUserPassword = async (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const defaultPass = getDefaultInitialPassword(targetUser.name, targetUser.username);
    const passHash = await hashPassword(defaultPass);

    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        const updatedAcc: UserAccount = {
          ...u,
          password: defaultPass,
          passwordHash: passHash,
          primeiro_acesso: true,
          firstAccess: true,
          lastPasswordChange: undefined
        };
        dbSaveUserAccount(updatedAcc);
        return updatedAcc;
      }
      return u;
    });

    onUpdateUsers(updatedUsers);
    setSuccess(`Senha do usuário "${targetUser.name}" resetada para "${defaultPass}"! O usuário deverá trocá-la no próximo acesso.`);
    setTimeout(() => setSuccess(null), 6000);
  };

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formName.trim() || !formUsername.trim()) {
      setError('Nome e Nome de Usuário são obrigatórios.');
      return;
    }

    const usernameLower = formUsername.trim().toLowerCase();

    // Check duplication for new users
    if (!editingUserId && users.some(u => u.username.toLowerCase() === usernameLower)) {
      setError('Já existe um usuário cadastrado com este nome de usuário.');
      return;
    }

    // Check duplication for editing users
    if (editingUserId && users.some(u => u.id !== editingUserId && u.username.toLowerCase() === usernameLower)) {
      setError('Já existe outro usuário cadastrado com este nome de usuário.');
      return;
    }

    let updatedList: UserAccount[];

    if (editingUserId) {
      // Editing existing user
      const targetUser = users.find(u => u.id === editingUserId);
      const newPass = formPassword.trim();
      const passHash = newPass ? await hashPassword(newPass) : targetUser?.passwordHash;

      updatedList = users.map(u => {
        if (u.id === editingUserId) {
          const updatedAcc: UserAccount = {
            ...u,
            name: formName.trim(),
            username: formUsername.trim(),
            password: newPass || u.password,
            passwordHash: passHash || u.passwordHash,
            role: formRole,
            employeeId: formEmployeeId || undefined,
            status: formStatus,
            accountStatus: formStatus === 'Ativo' ? 'ativo' : 'inativo',
            primeiro_acesso: formPrimeiroAcesso,
            firstAccess: formPrimeiroAcesso
          };
          dbSaveUserAccount(updatedAcc);
          return updatedAcc;
        }
        return u;
      });
      setSuccess(`Usuário "${formName}" atualizado com sucesso!`);
    } else {
      // Adding new user
      const initialPass = formPassword.trim() || getDefaultPasswordForName(formName);
      const passHash = await hashPassword(initialPass);

      const newUser: UserAccount = {
        id: `user-${Date.now()}`,
        name: formName.trim(),
        username: formUsername.trim(),
        password: initialPass,
        passwordHash: passHash,
        role: formRole,
        employeeId: formEmployeeId || undefined,
        status: formStatus,
        accountStatus: formStatus === 'Ativo' ? 'ativo' : 'inativo',
        primeiro_acesso: true,
        firstAccess: true
      };
      dbSaveUserAccount(newUser);
      updatedList = [...users, newUser];
      setSuccess(`Usuário "${formName}" cadastrado com sucesso (Senha inicial: "${initialPass}")!`);
    }

    onUpdateUsers(updatedList);

    // Auto link all documents if selected
    if (formEmployeeId && autoLinkDocs) {
      const updatedEmployees = employees.map(emp => {
        if (emp.id === formEmployeeId) {
          return {
            ...emp,
            associatedATRs: Array.from(new Set([...(emp.associatedATRs || []), ...atrs.map(a => a.id)])),
            associatedPOPs: Array.from(new Set([...(emp.associatedPOPs || []), ...pops.map(p => p.id)])),
            associatedITs: Array.from(new Set([...(emp.associatedITs || []), ...its.map(i => i.id)]))
          };
        }
        return emp;
      });
      onUpdateEmployees(updatedEmployees);
    }

    setTimeout(() => {
      resetForm();
    }, 1200);
  };

  const handleDeleteUser = (userId: string, name: string) => {
    if (userId === currentUser.id) {
      alert('Você não pode excluir a sua própria conta ativa.');
      return;
    }

    if (confirm(`Tem certeza que deseja excluir o usuário "${name}" do sistema? Esta ação revogará imediatamente o acesso.`)) {
      dbDeleteUserAccount(userId);
      const updatedList = users.filter(u => u.id !== userId);
      onUpdateUsers(updatedList);
      setSuccess(`Usuário "${name}" excluído.`);
      setTimeout(() => setSuccess(null), 2000);
    }
  };

  const normalizeUsername = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-z0-9\s]/g, '')     // remove special characters except spaces
      .trim()
      .replace(/\s+/g, '.');          // replace spaces with dots
  };

  const handleCreateAccount = async (emp: Employee) => {
    const cpfLimpo = (emp.cpf || "").replace(/\D/g, "");
    const baseUsername = cpfLimpo.length > 0 ? cpfLimpo : normalizeUsername(emp.name);
    let finalUsername = baseUsername;
    let counter = 1;
    while (users.some(u => u.username.toLowerCase() === finalUsername.toLowerCase())) {
      finalUsername = `${baseUsername}${counter}`;
      counter++;
    }

    const roleLower = emp.role.toLowerCase();
    const isLeadership = roleLower.includes('gerente') || 
                        roleLower.includes('coordenador') || 
                        roleLower.includes('diretor') || 
                        roleLower.includes('supervisor') || 
                        roleLower.includes('lider');
    const defaultRole: 'colaborador' | 'lider' = isLeadership ? 'lider' : 'colaborador';
    const defaultPassword = getDefaultInitialPassword(emp.name, emp.cpf);
    const passHash = await hashPassword(defaultPassword);

    const newAccount: UserAccount = {
      id: emp.id,
      username: finalUsername,
      name: emp.name,
      password: defaultPassword,
      passwordHash: passHash,
      role: defaultRole,
      employeeId: emp.id,
      status: 'Ativo',
      accountStatus: 'ativo',
      primeiro_acesso: true,
      firstAccess: true
    };
    dbSaveUserAccount(newAccount);
    onUpdateUsers([...users, newAccount]);
    setSuccess(`Conta de acesso criada para ${emp.name}! Login: ${finalUsername}, Senha inicial: "${defaultPassword}"`);
    setTimeout(() => setSuccess(null), 5000);
  };

  const handleUpdatePassword = (employeeId: string, newPassword: string) => {
    const updatedUsers = users.map(u => {
      if (u.employeeId === employeeId) {
        return { ...u, password: newPassword };
      }
      return u;
    });
    onUpdateUsers(updatedUsers);
  };

  const handleAddDoc = (employeeId: string, type: 'atr' | 'pop' | 'it', docId: string) => {
    const updatedEmployees = employees.map(emp => {
      if (emp.id === employeeId) {
        if (type === 'atr') {
          const current = emp.associatedATRs || [];
          if (!current.includes(docId)) {
            return { ...emp, associatedATRs: [...current, docId] };
          }
        } else if (type === 'pop') {
          const current = emp.associatedPOPs || [];
          if (!current.includes(docId)) {
            return { ...emp, associatedPOPs: [...current, docId] };
          }
        } else if (type === 'it') {
          const current = emp.associatedITs || [];
          if (!current.includes(docId)) {
            return { ...emp, associatedITs: [...current, docId] };
          }
        }
      }
      return emp;
    });
    onUpdateEmployees(updatedEmployees);
  };

  const handleRemoveDoc = (employeeId: string, type: 'atr' | 'pop' | 'it', docId: string) => {
    const updatedEmployees = employees.map(emp => {
      if (emp.id === employeeId) {
        if (type === 'atr') {
          return { ...emp, associatedATRs: (emp.associatedATRs || []).filter(id => id !== docId) };
        } else if (type === 'pop') {
          return { ...emp, associatedPOPs: (emp.associatedPOPs || []).filter(id => id !== docId) };
        } else if (type === 'it') {
          return { ...emp, associatedITs: (emp.associatedITs || []).filter(id => id !== docId) };
        }
      }
      return emp;
    });
    onUpdateEmployees(updatedEmployees);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.3 }}
            className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
          >
        {/* Header */}
        <div className="p-6 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-450 border border-emerald-500/25">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Gerenciador Geral de Usuários e Senhas
              </h2>
              <p className="text-2xs text-slate-500 dark:text-slate-450 uppercase font-bold tracking-wider mt-0.5">
                Conceder, alterar e revogar credenciais do sistema
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Subtabs inside Modal */}
          <div className="grid grid-cols-2 sm:grid-cols-4 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/80 mb-4 gap-1">
            <button
              onClick={() => setActiveSubTab('content_control')}
              className={`py-2 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeSubTab === 'content_control'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 font-black shadow-3xs border border-emerald-500/15'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Quadro de Acessos</span>
            </button>
            <button
              onClick={() => setActiveSubTab('users')}
              className={`py-2 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeSubTab === 'users'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 font-black shadow-3xs border border-emerald-500/15'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Credenciais</span>
            </button>
            <button
              onClick={() => setActiveSubTab('profiles')}
              className={`py-2 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeSubTab === 'profiles'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 font-black shadow-3xs border border-emerald-500/15'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Perfis Padrão</span>
            </button>
            <button
              onClick={() => setActiveSubTab('logs')}
              className={`py-2 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeSubTab === 'logs'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 font-black shadow-3xs border border-emerald-500/15'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Logs do Sistema</span>
            </button>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs flex items-center gap-2.5 font-semibold">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 p-3 rounded-xl text-xs flex items-center gap-2.5 font-semibold">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {activeSubTab === 'content_control' ? (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl text-[11px] leading-relaxed text-slate-750 dark:text-slate-300 flex gap-2.5">
                <Sliders className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-450 block mb-0.5">Quadro de Controle de Acessos e Conteúdos:</span>
                  Como Administrador Geral ou Gestor, gerencie abaixo o login e senha de entrada de cada colaborador e determine exatamente quais Atribuições (ATRs), Processos (POPs) e Instruções (ITs) eles podem visualizar. Alterações de logins, senhas e vínculos de documentos são atualizadas instantaneamente.
                </div>
              </div>

              {/* Search Bar for the Grid */}
              <div className="flex bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 items-center gap-2">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={gridSearchQuery}
                  onChange={(e) => setGridSearchQuery(e.target.value)}
                  placeholder="Pesquisar colaborador por nome, cargo ou setor..."
                  className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                />
                {gridSearchQuery && (
                  <button 
                    type="button"
                    onClick={() => setGridSearchQuery('')}
                    className="text-2xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 uppercase font-black tracking-wider cursor-pointer"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* Grid of Employees */}
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {(() => {
                  const filtered = employees.filter(emp => {
                    const query = gridSearchQuery.toLowerCase();
                    return (
                      emp.name.toLowerCase().includes(query) ||
                      emp.role.toLowerCase().includes(query) ||
                      emp.sector.toLowerCase().includes(query)
                    );
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-8 text-slate-400 text-xs italic">
                        Nenhum colaborador encontrado para a busca "{gridSearchQuery}".
                      </div>
                    );
                  }

                  return filtered.map(emp => {
                    const userAcc = users.find(u => u.employeeId === emp.id);
                    const associatedATRs = emp.associatedATRs || [];
                    const associatedPOPs = emp.associatedPOPs || [];
                    const associatedITs = emp.associatedITs || [];

                    return (
                      <div 
                        key={emp.id} 
                        className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors animate-once"
                      >
                        {/* Colaborador Info & Password */}
                        <div className="flex items-start gap-3 min-w-[220px]">
                          <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 flex items-center justify-center font-black text-xs border border-emerald-500/20 shrink-0">
                            {emp.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-extrabold text-slate-900 dark:text-white text-xs truncate">{emp.name}</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-450 font-medium truncate">{emp.role} • {emp.sector}</p>
                            
                            {/* Account Info & Password direct control */}
                            <div className="mt-2 pl-0.5 space-y-2">
                              {userAcc ? (
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[9px] font-black uppercase text-slate-450 dark:text-slate-500">Login:</span>
                                    <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">{userAcc.username}</span>
                                    <span className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded-full uppercase ${
                                      userAcc.role === 'admin' 
                                        ? 'bg-rose-500/10 text-rose-550 dark:text-rose-450 border border-rose-500/20' 
                                        : userAcc.role === 'lider' || userAcc.role === 'gestor'
                                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' 
                                        : 'bg-sky-500/10 text-sky-650 dark:text-sky-400 border border-sky-500/20'
                                    }`}>
                                      {userAcc.role === 'admin' ? 'administrador' : userAcc.role === 'lider' || userAcc.role === 'gestor' ? 'gestor' : 'colaborador'}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[9px] font-black uppercase text-slate-450 dark:text-slate-500">Senha:</span>
                                    <div className="flex items-center gap-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-0.5 focus-within:border-emerald-500 transition-colors w-[120px]">
                                      <Lock className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                      <input
                                        type="text"
                                        value={tempPasswords[userAcc.id] !== undefined ? tempPasswords[userAcc.id] : (userAcc.password || '')}
                                        onChange={(e) => handleTempPasswordChange(userAcc.id, e.target.value)}
                                        className="w-full bg-transparent text-[11px] text-slate-850 dark:text-slate-155 focus:outline-none font-mono"
                                        placeholder="Senha"
                                        title="Digite a nova senha e salve"
                                      />
                                    </div>
                                    {tempPasswords[userAcc.id] !== undefined && tempPasswords[userAcc.id] !== userAcc.password && (
                                      <button
                                        type="button"
                                        onClick={() => handleSaveTempPassword(userAcc.id)}
                                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer shadow-xs shrink-0"
                                      >
                                        Salvar
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleCreateAccount(emp)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-extrabold uppercase tracking-wider transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <UserPlus className="w-2.5 h-2.5" />
                                  <span>Criar Conta</span>
                                </button>
                              )}

                              {/* Master Action: Link all docs at once */}
                              <button
                                type="button"
                                onClick={() => handleLinkAllDocs(emp.id, 'all')}
                                className="w-full py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-500/15 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1"
                                title="Vincular todas as ATRs, POPs e ITs existentes para este colaborador"
                              >
                                <Plus className="w-2.5 h-2.5" />
                                <span>Vincular Todos os Docs</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Right Side: Document-level Access Determination (Quadro) */}
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 pl-0 md:pl-4 border-t md:border-t-0 md:border-l border-slate-200/60 dark:border-slate-800/80 pt-3 md:pt-0">
                          {/* ATRs column */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                                <Briefcase className="w-3 h-3 text-indigo-500" />
                                <span>ATRs</span>
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] text-slate-400 font-bold">({associatedATRs.length})</span>
                                <button
                                  type="button"
                                  onClick={() => handleLinkAllDocs(emp.id, 'atr')}
                                  className="text-[9px] text-indigo-600 dark:text-indigo-400 hover:underline font-extrabold cursor-pointer"
                                  title="Vincular todas as ATRs"
                                >
                                  [Todas]
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 max-h-[60px] overflow-y-auto">
                              {associatedATRs.length === 0 ? (
                                <p className="text-[10px] text-slate-400 italic">Nenhuma ATR associada.</p>
                              ) : (
                                associatedATRs.map(id => {
                                  const doc = atrs.find(a => a.id === id);
                                  return (
                                    <span 
                                      key={id}
                                      className="inline-flex items-center gap-0.5 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 rounded-md px-1 py-0.2 text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400 group"
                                      title={doc ? doc.title : 'Ficha Técnica'}
                                    >
                                      <span className="truncate max-w-[50px]">{id}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveDoc(emp.id, 'atr', id)}
                                        className="text-indigo-400 hover:text-rose-500 font-extrabold cursor-pointer ml-1 text-[11px]"
                                        title="Remover acesso a este documento"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  );
                                })
                              )}
                            </div>
                            <div className="relative inline-block mt-1">
                              <select
                                value=""
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val) handleAddDoc(emp.id, 'atr', val);
                                }}
                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                              >
                                <option value="" disabled>+ Vincular</option>
                                {atrs.filter(a => !associatedATRs.includes(a.id)).map(a => (
                                  <option key={a.id} value={a.id}>{a.id} - {a.title}</option>
                                ))}
                              </select>
                              <button className="px-2 py-0.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/15 rounded text-[9px] font-extrabold text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer">
                                + Vincular ATR
                              </button>
                            </div>
                          </div>

                          {/* POPs column */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black text-sky-600 dark:text-sky-400 uppercase tracking-wider flex items-center gap-1">
                                <Layers className="w-3 h-3 text-sky-500" />
                                <span>POPs</span>
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] text-slate-400 font-bold">({associatedPOPs.length})</span>
                                <button
                                  type="button"
                                  onClick={() => handleLinkAllDocs(emp.id, 'pop')}
                                  className="text-[9px] text-sky-600 dark:text-sky-400 hover:underline font-extrabold cursor-pointer"
                                  title="Vincular todos os POPs"
                                >
                                  [Todos]
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 max-h-[60px] overflow-y-auto">
                              {associatedPOPs.length === 0 ? (
                                <p className="text-[10px] text-slate-400 italic">Nenhum POP associado.</p>
                              ) : (
                                associatedPOPs.map(id => {
                                  const doc = pops.find(p => p.id === id);
                                  return (
                                    <span 
                                      key={id}
                                      className="inline-flex items-center gap-0.5 bg-sky-500/5 dark:bg-sky-500/10 border border-sky-500/20 rounded-md px-1 py-0.2 text-[9px] font-extrabold text-sky-600 dark:text-sky-400 group"
                                      title={doc ? doc.title : 'Procedimento'}
                                    >
                                      <span className="truncate max-w-[50px]">{id}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveDoc(emp.id, 'pop', id)}
                                        className="text-sky-400 hover:text-rose-500 font-extrabold cursor-pointer ml-1 text-[11px]"
                                        title="Remover acesso a este documento"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  );
                                })
                              )}
                            </div>
                            <div className="relative inline-block mt-1">
                              <select
                                value=""
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val) handleAddDoc(emp.id, 'pop', val);
                                }}
                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                              >
                                <option value="" disabled>+ Vincular</option>
                                {pops.filter(p => !associatedPOPs.includes(p.id)).map(p => (
                                  <option key={p.id} value={p.id}>{p.id} - {p.title}</option>
                                ))}
                              </select>
                              <button className="px-2 py-0.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/15 rounded text-[9px] font-extrabold text-sky-600 dark:text-sky-400 transition-colors cursor-pointer">
                                + Vincular POP
                              </button>
                            </div>
                          </div>

                          {/* ITs column */}
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-450 uppercase tracking-wider flex items-center gap-1">
                                <FileText className="w-3 h-3 text-emerald-500" />
                                <span>ITs</span>
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-[9px] text-slate-400 font-bold">({associatedITs.length})</span>
                                <button
                                  type="button"
                                  onClick={() => handleLinkAllDocs(emp.id, 'it')}
                                  className="text-[9px] text-emerald-600 dark:text-emerald-450 hover:underline font-extrabold cursor-pointer"
                                  title="Vincular todas as ITs"
                                >
                                  [Todas]
                                </button>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 max-h-[60px] overflow-y-auto">
                              {associatedITs.length === 0 ? (
                                <p className="text-[10px] text-slate-400 italic">Nenhuma IT associada.</p>
                              ) : (
                                associatedITs.map(id => {
                                  const doc = its.find(i => i.id === id);
                                  return (
                                    <span 
                                      key={id}
                                      className="inline-flex items-center gap-0.5 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-md px-1 py-0.2 text-[9px] font-extrabold text-emerald-600 dark:text-emerald-450 group"
                                      title={doc ? doc.title : 'Instrução'}
                                    >
                                      <span className="truncate max-w-[50px]">{id}</span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveDoc(emp.id, 'it', id)}
                                        className="text-emerald-400 hover:text-rose-500 font-extrabold cursor-pointer ml-1 text-[11px]"
                                        title="Remover acesso a este documento"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  );
                                })
                              )}
                            </div>
                            <div className="relative inline-block mt-1">
                              <select
                                value=""
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val) handleAddDoc(emp.id, 'it', val);
                                }}
                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                              >
                                <option value="" disabled>+ Vincular</option>
                                {its.filter(i => !associatedITs.includes(i.id)).map(i => (
                                  <option key={i.id} value={i.id}>{i.id} - {i.title}</option>
                                ))}
                              </select>
                              <button className="px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/15 rounded text-[9px] font-extrabold text-emerald-600 dark:text-emerald-450 transition-colors cursor-pointer">
                                + Vincular IT
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          ) : activeSubTab === 'profiles' ? (
            <div className="space-y-6">
              <div className="bg-sky-500/10 border border-sky-500/20 p-4 rounded-xl text-[11px] leading-relaxed text-slate-700 dark:text-slate-350 flex gap-2.5">
                <Sliders className="w-5 h-5 text-sky-500 shrink-0" />
                <div>
                  <span className="font-extrabold text-sky-600 dark:text-sky-400 block mb-0.5">Customização de Perfis de Acesso:</span>
                  Como Administrador Geral, defina abaixo o escopo exato do que os perfis padrão (Funcionários e Líderes) podem visualizar ou modificar no sistema. O perfil de **Administrador Geral (Senha Master)** sempre terá acesso irrestrito de forma integral.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Colaborador Profile Card */}
                <div className="p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="p-1.5 bg-sky-500/10 rounded-lg text-sky-600 dark:text-sky-400">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">Perfil: Colaborador</h4>
                      <p className="text-[10px] text-slate-450 uppercase font-mono tracking-wider">Acesso da Equipe Operacional</p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <label className="flex items-start gap-2.5 cursor-pointer group">
                      <input 
                        type="checkbox"
                        checked={profilePermissions.colaborador.canSeeAllDocs}
                        onChange={(e) => {
                          onUpdatePermissions({
                            ...profilePermissions,
                            colaborador: {
                              ...profilePermissions.colaborador,
                              canSeeAllDocs: e.target.checked
                            }
                          });
                        }}
                        className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 transition-colors">Visualizar todos os POPs e ATRs</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Se desativado, o colaborador vê exclusivamente os documentos vinculados à sua ficha (Sua ATR e POPs participativos).</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer group">
                      <input 
                        type="checkbox"
                        checked={profilePermissions.colaborador.canSeeEmployees}
                        onChange={(e) => {
                          onUpdatePermissions({
                            ...profilePermissions,
                            colaborador: {
                              ...profilePermissions.colaborador,
                              canSeeEmployees: e.target.checked
                            }
                          });
                        }}
                        className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 transition-colors">Acessar Aba de Funcionários</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Permite visualizar a lista completa de colaboradores da empresa.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer group">
                      <input 
                        type="checkbox"
                        checked={profilePermissions.colaborador.canSeeSectors}
                        onChange={(e) => {
                          onUpdatePermissions({
                            ...profilePermissions,
                            colaborador: {
                              ...profilePermissions.colaborador,
                              canSeeSectors: e.target.checked
                            }
                          });
                        }}
                        className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 transition-colors">Acessar Aba de Setores</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Permite visualizar os departamentos e estatísticas de setores.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer group">
                      <input 
                        type="checkbox"
                        checked={profilePermissions.colaborador.canEditEmployees}
                        onChange={(e) => {
                          onUpdatePermissions({
                            ...profilePermissions,
                            colaborador: {
                              ...profilePermissions.colaborador,
                              canEditEmployees: e.target.checked
                            }
                          });
                        }}
                        className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 transition-colors">Cadastrar/Editar Funcionários</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Permite gerenciar cadastros de funcionários e definir seus vínculos.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer group">
                      <input 
                        type="checkbox"
                        checked={profilePermissions.colaborador.canEditDocs}
                        onChange={(e) => {
                          onUpdatePermissions({
                            ...profilePermissions,
                            colaborador: {
                              ...profilePermissions.colaborador,
                              canEditDocs: e.target.checked
                            }
                          });
                        }}
                        className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 transition-colors">Criar/Editar POPs e ATRs</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Permite criar, editar ou excluir documentos e fichas técnicas.</p>
                      </div>
                    </label>

                    <div className="pt-2.5 mt-1 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-3xs font-black uppercase tracking-widest text-rose-500/80">Guarda de Documentos</span>
                    </div>

                    <label className="flex items-start gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={profilePermissions.colaborador.canUploadDocuments || false}
                        onChange={(e) => {
                          onUpdatePermissions({
                            ...profilePermissions,
                            colaborador: {
                              ...profilePermissions.colaborador,
                              canUploadDocuments: e.target.checked
                            }
                          });
                        }}
                        className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 transition-colors">Enviar documentos / novas versões</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Permite enviar documentos ao módulo de guarda e reenviar novas versões, mesmo sem ser gestor.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={profilePermissions.colaborador.canManageRetention || false}
                        onChange={(e) => {
                          onUpdatePermissions({
                            ...profilePermissions,
                            colaborador: {
                              ...profilePermissions.colaborador,
                              canManageRetention: e.target.checked
                            }
                          });
                        }}
                        className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 transition-colors">Renovar guarda / marcar para eliminação</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Permite gerenciar documentos vencendo/vencidos do próprio setor no painel de vencimentos.</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Gestor Profile Card */}
                <div className="p-5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-600 dark:text-amber-400">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200">Perfil: Gestor</h4>
                      <p className="text-[10px] text-slate-450 uppercase font-mono tracking-wider">Acesso de Gestores e Coordenadores</p>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <label className="flex items-start gap-2.5 cursor-pointer group">
                      <input 
                        type="checkbox"
                        checked={profilePermissions.gestor?.canSeeAllDocs || profilePermissions.lider?.canSeeAllDocs || false}
                        onChange={(e) => {
                          const updatedGestor = {
                            ...(profilePermissions.gestor || profilePermissions.lider || {
                              canSeeAllDocs: false,
                              canSeeEmployees: true,
                              canSeeSectors: true,
                              canEditEmployees: true,
                              canEditDocs: false
                            }),
                            canSeeAllDocs: e.target.checked
                          };
                          onUpdatePermissions({
                            ...profilePermissions,
                            gestor: updatedGestor,
                            lider: updatedGestor
                          });
                        }}
                        className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 transition-colors">Visualizar todos os POPs e ATRs do Sistema</span>
                        <p className="text-[10px] text-slate-450 mt-0.5">Se desativado, o gestor vê exclusivamente os documentos vinculados à sua ficha e os de todos do seu grupo/setor.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer group">
                      <input 
                        type="checkbox"
                        checked={profilePermissions.gestor?.canSeeEmployees || profilePermissions.lider?.canSeeEmployees || false}
                        onChange={(e) => {
                          const updatedGestor = {
                            ...(profilePermissions.gestor || profilePermissions.lider || {
                              canSeeAllDocs: false,
                              canSeeEmployees: true,
                              canSeeSectors: true,
                              canEditEmployees: true,
                              canEditDocs: false
                            }),
                            canSeeEmployees: e.target.checked
                          };
                          onUpdatePermissions({
                            ...profilePermissions,
                            gestor: updatedGestor,
                            lider: updatedGestor
                          });
                        }}
                        className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 transition-colors">Acessar Aba de Funcionários</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Permite visualizar a lista completa de colaboradores da empresa.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer group">
                      <input 
                        type="checkbox"
                        checked={profilePermissions.gestor?.canSeeSectors || profilePermissions.lider?.canSeeSectors || false}
                        onChange={(e) => {
                          const updatedGestor = {
                            ...(profilePermissions.gestor || profilePermissions.lider || {
                              canSeeAllDocs: false,
                              canSeeEmployees: true,
                              canSeeSectors: true,
                              canEditEmployees: true,
                              canEditDocs: false
                            }),
                            canSeeSectors: e.target.checked
                          };
                          onUpdatePermissions({
                            ...profilePermissions,
                            gestor: updatedGestor,
                            lider: updatedGestor
                          });
                        }}
                        className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 transition-colors">Acessar Aba de Setores</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Permite visualizar os departamentos e estatísticas de setores.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer group">
                      <input 
                        type="checkbox"
                        checked={profilePermissions.gestor?.canEditEmployees || profilePermissions.lider?.canEditEmployees || false}
                        onChange={(e) => {
                          const updatedGestor = {
                            ...(profilePermissions.gestor || profilePermissions.lider || {
                              canSeeAllDocs: false,
                              canSeeEmployees: true,
                              canSeeSectors: true,
                              canEditEmployees: true,
                              canEditDocs: false
                            }),
                            canEditEmployees: e.target.checked
                          };
                          onUpdatePermissions({
                            ...profilePermissions,
                            gestor: updatedGestor,
                            lider: updatedGestor
                          });
                        }}
                        className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 transition-colors">Cadastrar/Editar Funcionários</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Permite gerenciar cadastros de funcionários e definir seus vínculos.</p>
                      </div>
                    </label>

                    <div className="pt-2.5 mt-1 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-3xs font-black uppercase tracking-widest text-rose-500/80">Guarda de Documentos</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Gestor/Líder já pode enviar e gerenciar vencimentos no próprio setor por padrão. Desative aqui se quiser restringir.</p>
                    </div>

                    <label className="flex items-start gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={profilePermissions.gestor?.canUploadDocuments ?? profilePermissions.lider?.canUploadDocuments ?? true}
                        onChange={(e) => {
                          const updatedGestor = {
                            ...(profilePermissions.gestor || profilePermissions.lider || {
                              canSeeAllDocs: false,
                              canSeeEmployees: true,
                              canSeeSectors: true,
                              canEditEmployees: true,
                              canEditDocs: false
                            }),
                            canUploadDocuments: e.target.checked
                          };
                          onUpdatePermissions({
                            ...profilePermissions,
                            gestor: updatedGestor,
                            lider: updatedGestor
                          });
                        }}
                        className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 transition-colors">Enviar documentos / novas versões</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Permite enviar documentos ao módulo de guarda e reenviar novas versões.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={profilePermissions.gestor?.canManageRetention ?? profilePermissions.lider?.canManageRetention ?? true}
                        onChange={(e) => {
                          const updatedGestor = {
                            ...(profilePermissions.gestor || profilePermissions.lider || {
                              canSeeAllDocs: false,
                              canSeeEmployees: true,
                              canSeeSectors: true,
                              canEditEmployees: true,
                              canEditDocs: false
                            }),
                            canManageRetention: e.target.checked
                          };
                          onUpdatePermissions({
                            ...profilePermissions,
                            gestor: updatedGestor,
                            lider: updatedGestor
                          });
                        }}
                        className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-emerald-500 transition-colors">Renovar guarda / marcar para eliminação</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Permite gerenciar documentos vencendo/vencidos do próprio setor no painel de vencimentos.</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ) : activeSubTab === 'logs' ? (
            <div className="space-y-5">
              {/* Banner */}
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-[11px] leading-relaxed text-slate-750 dark:text-slate-300 flex gap-2.5">
                <History className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="font-extrabold text-amber-700 dark:text-amber-450 block mb-0.5">Logs de Alterações do Sistema:</span>
                  Histórico cronológico detalhado contendo todas as ações de criação, emissão e revisões efetuadas nos documentos (ATRs, POPs e ITs) da Associação Comercial, Industrial e de Serviços de Imperatriz (ACII).
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-500 tracking-wider">Total de Eventos</span>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1 flex items-baseline gap-1">
                    {allLogs.length}
                    <span className="text-3xs font-medium text-slate-400">registros</span>
                  </div>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-500 tracking-wider">Revisões / Edições</span>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1 flex items-baseline gap-1">
                    {allLogs.filter(l => l.revision !== '00' && l.revision !== '0').length}
                    <span className="text-3xs font-medium text-slate-400">revisões</span>
                  </div>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-500 tracking-wider">Última Atividade</span>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1.5 truncate">
                    {allLogs[0] ? `${allLogs[0].date} - ${allLogs[0].author}` : 'Nenhum registro'}
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="flex-1 flex bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 items-center gap-2">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={logsSearchQuery}
                    onChange={(e) => setLogsSearchQuery(e.target.value)}
                    placeholder="Pesquisar por código, título, autor ou descrição..."
                    className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                  {logsSearchQuery && (
                    <button 
                      type="button"
                      onClick={() => setLogsSearchQuery('')}
                      className="text-2xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                <div className="flex bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl p-1 gap-1">
                  {(['Todos', 'POP', 'ATR', 'IT'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setLogsTypeFilter(type)}
                      className={`px-3 py-1 text-2xs font-black uppercase rounded-lg cursor-pointer transition-all ${
                        logsTypeFilter === type
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-450 border border-amber-500/15'
                          : 'text-slate-500 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeline list */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/20 dark:bg-slate-950/10">
                <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850 scrollbar-thin scrollbar-thumb-slate-700 p-2 space-y-2">
                  {filteredLogs.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-2">
                      <History className="w-8 h-8 opacity-40 animate-pulse text-amber-500" />
                      <p className="text-xs font-bold uppercase tracking-wider">Nenhum log de alteração encontrado</p>
                      <p className="text-[10px] text-slate-450">Tente ajustar seus termos de pesquisa ou filtros.</p>
                    </div>
                  ) : (
                    filteredLogs.map((log, index) => {
                      const isPop = log.docType === 'POP';
                      const isAtr = log.docType === 'ATR';
                      
                      const typeBadgeClass = isPop
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : isAtr
                        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
                        : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20';
                      
                      const isEmission = log.revision === '00' || log.revision === '0' || log.description === 'Emissão Inicial';
                      const revBadgeClass = isEmission
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-450 border border-amber-500/20';

                      return (
                        <div 
                          key={`${log.docId}-${log.revision}-${index}`}
                          className="p-3.5 hover:bg-slate-100/50 dark:hover:bg-slate-900/40 rounded-xl transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-3 group border-l-4 border-l-slate-300 dark:border-l-slate-700 hover:border-l-amber-500 dark:hover:border-l-amber-500"
                        >
                          <div className="space-y-1.5 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.2 rounded ${typeBadgeClass}`}>
                                {log.docType}
                              </span>
                              <span 
                                onClick={() => onSelectDoc?.(log.docId, log.docType.toLowerCase() as any)}
                                className="text-[11px] font-extrabold text-slate-900 dark:text-white cursor-pointer hover:underline flex items-center gap-1 font-mono tracking-tight"
                                title="Ver documento no Portal"
                              >
                                {log.docId}
                                <span className="text-slate-400 font-sans font-medium text-[10px] group-hover:text-amber-500 transition-colors">
                                  ({log.docTitle})
                                </span>
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.1 rounded font-mono ${revBadgeClass}`}>
                                Rev. {log.revision}
                              </span>
                            </div>

                            <p className="text-[11px] font-semibold text-slate-750 dark:text-slate-300 leading-relaxed italic">
                              &ldquo;{log.description}&rdquo;
                            </p>

                            <div className="flex items-center gap-3 text-[10px] text-slate-450 dark:text-slate-500">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400 shrink-0" />
                                Autor: <strong className="font-bold text-slate-650 dark:text-slate-400">{log.author}</strong>
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                Data: <strong className="font-bold text-slate-650 dark:text-slate-400">{log.date}</strong>
                              </span>
                            </div>
                          </div>

                          {onSelectDoc && (
                            <button
                              onClick={() => onSelectDoc(log.docId, log.docType.toLowerCase() as any)}
                              className="self-end sm:self-center px-2.5 py-1.5 bg-slate-100 hover:bg-amber-500 hover:text-white dark:bg-slate-800 dark:hover:bg-amber-500 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 group/btn"
                            >
                              <span>Acessar Doc</span>
                              <ArrowUpRight className="w-3 h-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* New User / Edit Form */}
              {isAddingNew ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-slate-50 dark:bg-slate-950/30 border border-slate-250 dark:border-slate-850 p-5 rounded-2xl space-y-4"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200/60 dark:border-slate-800">
                    <h3 className="text-xs font-black uppercase text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-emerald-500" />
                      {editingUserId ? 'Alterar Credenciais de Usuário' : 'Conceder Novo Acesso'}
                    </h3>
                    <button
                      onClick={resetForm}
                      className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer underline"
                    >
                      Cancelar
                    </button>
                  </div>

                  <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-3xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 pl-1">Vincular Colaborador correspondente</label>
                      <select
                        value={formEmployeeId}
                        onChange={e => {
                          const empId = e.target.value;
                          setFormEmployeeId(empId);
                          // Auto-populate name if not already set
                          if (empId) {
                            const matchedEmp = employees.find(emp => emp.id === empId);
                            if (matchedEmp && (!formName || formName === '')) {
                              setFormName(matchedEmp.name);
                            }
                          }
                        }}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-250 focus:outline-none cursor-pointer"
                      >
                        <option value="">Nenhum (Usuário sem ficha corporativa)</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name} ({emp.role} - {emp.sector})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-3xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 pl-1">Nome de Exibição</label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        placeholder="Ex: João da Silva"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-3xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 pl-1">Nome de Usuário (Login)</label>
                      <input
                        type="text"
                        required
                        value={formUsername}
                        onChange={e => setFormUsername(e.target.value)}
                        placeholder="Ex: joao.silva"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-3xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 pl-1">Senha de Entrada</label>
                      <input
                        type="text"
                        required
                        value={formPassword}
                        onChange={e => setFormPassword(e.target.value)}
                        placeholder="Defina uma senha"
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-3xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 pl-1">Nível de Permissão</label>
                      <select
                        value={formRole === 'lider' ? 'gestor' : formRole}
                        onChange={e => setFormRole(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-250 focus:outline-none cursor-pointer"
                      >
                        <option value="colaborador">Colaborador</option>
                        <option value="gestor">Gestor</option>
                        <option value="admin">Administrador Geral</option>
                      </select>
                    </div>

                    {formEmployeeId && (
                      <div className="md:col-span-2 flex items-center gap-2.5 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                        <input
                          type="checkbox"
                          id="autoLinkCheckbox"
                          checked={autoLinkDocs}
                          onChange={e => setAutoLinkDocs(e.target.checked)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer h-4 w-4 shrink-0"
                        />
                        <label htmlFor="autoLinkCheckbox" className="text-[11px] text-slate-700 dark:text-slate-300 font-bold cursor-pointer leading-tight">
                          Vincular todos os documentos de uma vez (ATRs, POPs, ITs) a este colaborador ao salvar
                        </label>
                      </div>
                    )}

                    <div className="md:col-span-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-950 transition-colors cursor-pointer"
                      >
                        Descartar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-extrabold uppercase tracking-wider shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>{editingUserId ? 'Salvar Alterações' : 'Salvar Perfil de Acesso'}</span>
                      </button>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <div className="flex justify-between items-center">
                  <span className="text-2xs font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-wider">
                    Lista de Credenciais Concedidas ({users.length})
                  </span>
                  <button
                onClick={() => setIsAddingNew(true)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Conceder Nova Senha</span>
              </button>
            </div>
          )}

          {/* User List table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold uppercase text-[9px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Funcionário / Nome</th>
                    <th className="px-4 py-3">Usuário Login</th>
                    <th className="px-4 py-3">Senha de Entrada</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Permissão</th>
                    <th className="px-4 py-3">Última Troca de Senha</th>
                    <th className="px-4 py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map(u => {
                    const isSelf = u.id === currentUser.id;
                    const isPassVisible = visiblePasswords[u.id] || false;
                    const isUserActive = (u.status || 'Ativo') === 'Ativo' || (u.accountStatus || 'ativo') === 'ativo';
                    const isFirstAccessPending = u.primeiro_acesso === true || u.firstAccess === true;

                    return (
                      <tr key={u.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-extrabold text-xs">
                              {u.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                                {u.name}
                                {isSelf && (
                                  <span className="text-[8px] bg-sky-500/10 text-sky-600 dark:text-sky-400 px-1.5 py-0.2 rounded-full border border-sky-500/20 font-black uppercase">
                                    Você
                                  </span>
                                )}
                              </p>
                              {u.employeeId ? (
                                <p className="text-[10px] text-indigo-500 font-bold mt-0.5 flex items-center gap-1">
                                  <User className="w-2.5 h-2.5" />
                                  <span>Vínculo: {employees.find(e => e.id === u.employeeId)?.name || 'Ficha Excluída'}</span>
                                </p>
                              ) : (
                                <p className="text-[9px] text-slate-400 font-mono">ID: {u.id}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                          {u.username}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono bg-slate-100 dark:bg-slate-950 border border-slate-200/50 dark:border-slate-800/80 px-2.5 py-1 rounded-lg text-slate-700 dark:text-slate-350">
                              {isPassVisible ? u.password : '••••••••'}
                            </span>
                            <button
                              onClick={() => togglePasswordVisibility(u.id)}
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer rounded"
                              title={isPassVisible ? "Esconder Senha" : "Mostrar Senha"}
                            >
                              {isPassVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => !isSelf && handleToggleUserStatus(u.id)}
                            disabled={isSelf}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all border ${
                              isSelf ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:scale-105'
                            } ${
                              isUserActive 
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            }`}
                            title={isSelf ? "Não é possível inativar seu próprio usuário logado" : "Clique para alterar o status da conta"}
                          >
                            <span className={`w-2 h-2 rounded-full ${isUserActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span>{isUserActive ? 'Ativo' : 'Inativo'}</span>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          {u.role === 'admin' ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              <ShieldCheck className="w-3 h-3" />
                              Administrador
                            </span>
                          ) : u.role === 'gestor' || u.role === 'lider' ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                              <Award className="w-3 h-3" />
                              Gestor
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full">
                              <User className="w-3 h-3" />
                              Colaborador
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-[11px]">
                          {isFirstAccessPending ? (
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md text-[9px] uppercase">
                              <Clock className="w-3 h-3 shrink-0" />
                              1º Acesso Pendente
                            </span>
                          ) : u.lastPasswordChange ? (
                            <span className="font-mono text-slate-600 dark:text-slate-300">
                              {u.lastPasswordChange}
                            </span>
                          ) : (
                            <span className="italic text-slate-400 text-[10px]">
                              Não alterada pelo usuário
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleResetUserPassword(u.id)}
                              className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded transition-all cursor-pointer"
                              title="Resetar senha para valor inicial (primeiro nome) e forçar troca no próximo login"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleStartEdit(u)}
                              className="p-1.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-200/60 dark:hover:bg-slate-850 rounded transition-all cursor-pointer"
                              title="Editar usuário e senha"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              disabled={isSelf}
                              className={`p-1.5 rounded transition-all cursor-pointer ${
                                isSelf
                                  ? 'text-slate-300 dark:text-slate-800 cursor-not-allowed'
                                  : 'text-slate-400 hover:text-red-500 hover:bg-slate-200/60 dark:hover:bg-slate-850'
                              }`}
                              title={isSelf ? "Não é possível excluir você mesmo" : "Excluir acesso"}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          </>
          )}
          
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-[11px] leading-relaxed text-slate-700 dark:text-slate-350">
            <span className="font-extrabold text-amber-600 dark:text-amber-400 block mb-1">Nota Importante de Segurança:</span>
            Como Administrador Geral, as credenciais que você concede acima dão acesso imediato a este Portal de Documentos. Certifique-se de instruir seus colaboradores a manterem suas senhas seguras e individuais.
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Fechar Painel
          </button>
        </div>
      </motion.div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}
