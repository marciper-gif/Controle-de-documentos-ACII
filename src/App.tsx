import React, { useState, useEffect, useMemo, useCallback, FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  BookOpen,
  Briefcase,
  Layers,
  FileText,
  Printer,
  Moon,
  Sun,
  Plus,
  Trash2,
  Edit3,
  RotateCcw,
  CheckCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  User,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  X,
  PlusCircle,
  FileCode,
  ShieldCheck,
  Building,
  Maximize2,
  Minimize2,
  Home,
  Scale,
  Users,
  LogOut,
  KeyRound,
  Zap,
  AlertTriangle,
  AlertCircle,
  Glasses,
  Cloud,
  Download,
  Loader2,
  Archive
} from 'lucide-react';

import { Sector, ATR, POP, POPStep, UserAccount, SectorData, Employee, ProfilePermissions, IT, RevisionHistoryEntry } from './types';
import { exportElementToPdf } from './utils/pdfExport';
import { initialATRs } from './data/atrs';
import { initialPOPs } from './data/pops';
import { initialITs } from './data/its';
import { initialSectors } from './data/sectors';
import FlowchartView from './components/FlowchartView';
import LoginView from './components/LoginView';
import AdminUsersModal from './components/AdminUsersModal';
import EmployeeManager from './components/EmployeeManager';
import SectorManager from './components/SectorManager';
import GoogleWorkspaceManager from './components/GoogleWorkspaceManager';
import SplashScreen from './components/SplashScreen';
import DocumentsView from './components/DocumentsView';
import ACIILogo from './components/ACIILogo';

// Firebase Integrations
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { onSnapshot, collection, doc, getDoc } from 'firebase/firestore';
import { auth, db, ensureAnonymousAuth } from './lib/firebase';
import { linkGoogleUserCallable } from './lib/functions';
import { hashPassword } from './lib/userManagement';
import {
  seedDatabaseIfEmpty,
  dbSaveSector,
  dbDeleteSector,
  dbSaveEmployee,
  dbDeleteEmployee,
  dbSaveATR,
  dbDeleteATR,
  dbSavePOP,
  dbDeletePOP,
  dbSaveIT,
  dbDeleteIT,
  dbSaveUserAccount,
  dbDeleteUserAccount,
  dbSavePermissions
} from './lib/firebaseSync';
import { getReviewStatus } from './utils/documentReview';
import { ViewType, DocType, VIEW_PATHS, computeAppPath, parseAppPath } from './lib/appRouting';
import { useTheme } from './hooks/useTheme';
import { useAtrsState } from './hooks/useAtrsState';
import { usePopsState } from './hooks/usePopsState';
import { useItsState } from './hooks/useItsState';
import { useSectorsState } from './hooks/useSectorsState';
import { useEmployeesState } from './hooks/useEmployeesState';

export { getReviewStatus };

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // Splash Screen State
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // PDF Direct Export States
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [pdfExportProgress, setPdfExportProgress] = useState<string>('');

  // User Management State
  const [users, rawSetUsers] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('ms-users');
    if (!saved) {
      const defaultUsers: UserAccount[] = [
        { id: '1', username: 'admin', name: 'Administrador Geral', password: 'admin', role: 'admin', status: 'Ativo', primeiro_acesso: false },
        { id: '2', username: 'colaborador', name: 'Colaborador Padrão', password: '123', role: 'colaborador', status: 'Ativo', primeiro_acesso: true }
      ];
      localStorage.setItem('ms-users', JSON.stringify(defaultUsers));
      return defaultUsers;
    }
    try {
      return JSON.parse(saved);
    } catch (e) {
      return [];
    }
  });

  const setUsers = useCallback((val: React.SetStateAction<UserAccount[]>) => {
    rawSetUsers((prev) => {
      const computed = typeof val === 'function' ? val(prev) : val;
      computed.forEach(item => {
        const original = prev.find(p => p.id === item.id);
        if (!original || JSON.stringify(original) !== JSON.stringify(item)) {
          dbSaveUserAccount(item);
        }
      });
      return computed;
    });
  }, []);

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    const saved = localStorage.getItem('ms-current-user');
    if (!saved) return null;
    try {
      return JSON.parse(saved);
    } catch (e) {
      return null;
    }
  });

  // Fica `true` assim que existir QUALQUER sessão do Firebase Auth (anônima
  // ponte para login por CPF/senha, ou Google). As leituras/escritas no
  // Firestore só começam depois disso, porque as regras agora exigem
  // `request.auth != null`.
  const [authReady, setAuthReady] = useState(false);

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const [profilePermissions, rawSetProfilePermissions] = useState<ProfilePermissions>(() => {
    const saved = localStorage.getItem('ms-profile-permissions');
    const defaultPermissions: ProfilePermissions = {
      colaborador: {
        canSeeAllDocs: true,
        canSeeEmployees: true,
        canSeeSectors: true,
        canEditEmployees: false,
        canEditDocs: false,
        canUploadDocuments: false,
        canManageRetention: false,
        canDeleteDocuments: false
      },
      gestor: {
        canSeeAllDocs: true,
        canSeeEmployees: true,
        canSeeSectors: true,
        canEditEmployees: true,
        canEditDocs: true,
        canUploadDocuments: true,
        canManageRetention: true,
        canDeleteDocuments: false
      },
      lider: {
        canSeeAllDocs: true,
        canSeeEmployees: true,
        canSeeSectors: true,
        canEditEmployees: true,
        canEditDocs: true,
        canUploadDocuments: true,
        canManageRetention: true,
        canDeleteDocuments: false
      }
    };
    if (!saved) {
      localStorage.setItem('ms-profile-permissions', JSON.stringify(defaultPermissions));
      return defaultPermissions;
    }
    try {
      const parsed = JSON.parse(saved);
      if (!parsed.gestor) {
        parsed.gestor = parsed.lider || defaultPermissions.gestor;
      }
      // Ensure visibility flags are defaulted to true if undefined
      if (parsed.colaborador) {
        if (parsed.colaborador.canSeeAllDocs === undefined) parsed.colaborador.canSeeAllDocs = true;
        if (parsed.colaborador.canSeeSectors === undefined) parsed.colaborador.canSeeSectors = true;
        if (parsed.colaborador.canSeeEmployees === undefined) parsed.colaborador.canSeeEmployees = true;
      }
      return parsed;
    } catch (e) {
      return defaultPermissions;
    }
  });

  const setProfilePermissions = useCallback((val: React.SetStateAction<ProfilePermissions>) => {
    rawSetProfilePermissions((prev) => {
      const computed = typeof val === 'function' ? val(prev) : val;
      dbSavePermissions(computed);
      return computed;
    });
  }, []);

  const handleUpdatePermissions = (newPerms: ProfilePermissions) => {
    setProfilePermissions(newPerms);
    localStorage.setItem('ms-profile-permissions', JSON.stringify(newPerms));
  };


  const userPermissions = useMemo(() => {
    if (!currentUser) {
      return {
        canSeeAllDocs: false,
        canSeeEmployees: false,
        canSeeSectors: false,
        canEditEmployees: false,
        canEditDocs: false,
        canUploadDocuments: false,
        canManageRetention: false,
        canDeleteDocuments: false
      };
    }
    if (currentUser.role === 'admin') {
      return {
        canSeeAllDocs: true,
        canSeeEmployees: true,
        canSeeSectors: true,
        canEditEmployees: true,
        canEditDocs: true,
        canUploadDocuments: true,
        canManageRetention: true,
        canDeleteDocuments: true
      };
    }
    const roleKey = currentUser.role === 'lider' ? 'gestor' : currentUser.role;
    return (profilePermissions as any)[roleKey] || {
      canSeeAllDocs: false,
      canSeeEmployees: false,
      canSeeSectors: false,
      canEditEmployees: false,
      canEditDocs: false,
      canUploadDocuments: false,
      canManageRetention: false,
      canDeleteDocuments: false
    };
  }, [currentUser, profilePermissions]);

  // Sync current user with updated list in case of changes
  useEffect(() => {
    if (currentUser) {
      const matched = users.find(u => 
        u.id === currentUser.id || 
        (u.username && currentUser.username && u.username.toLowerCase() === currentUser.username.toLowerCase())
      );
      if (matched) {
        if (JSON.stringify(matched) !== JSON.stringify(currentUser)) {
          setCurrentUser(matched);
          localStorage.setItem('ms-current-user', JSON.stringify(matched));
        }
      }
      // DO NOT logout currentUser when users list is updated!
    }
  }, [users]);

  const handleUpdateUsers = (newUsers: UserAccount[]) => {
    setUsers(newUsers);
    localStorage.setItem('ms-users', JSON.stringify(newUsers));
  };

  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    localStorage.setItem('ms-current-user', JSON.stringify(user));

    // A Cloud Function `login` (chamada dentro de fazerLogin, em
    // src/lib/userManagement.ts) já validou a senha no servidor e já
    // gravou auth_links/{uid} lá — o cliente não escreve mais isso
    // diretamente (ver o comentário grande em functions/index.js sobre
    // por que essa mudança fecha uma falha de segurança real).
  };

  const handleLogout = () => {
    signOut(auth);
    setCurrentUser(null);
    localStorage.removeItem('ms-current-user');
  };

  // Theme Management
  const [theme, setTheme] = useTheme();

  // Documents Management (Predefined + Local Drafts) e Setores: cada um
  // com estado + persistência em localStorage + sincronização em tempo
  // real com o Firestore isolados no próprio hook (ver src/hooks/).
  const [atrs, setATRs] = useAtrsState(authReady);
  const [pops, setPOPs] = usePopsState(authReady);
  const [its, setITs] = useItsState(authReady);
  const [sectors, setSectors] = useSectorsState(authReady);

  // Dynamic employees state - only preserving employees created in the system
  const [employees, setEmployees] = useEmployeesState(authReady);

  // (a persistência de `sectors` em localStorage já roda dentro de
  // useSectorsState — esta era mais uma gravação idêntica, removida)

  // Documentos guardados (módulo de guarda de documentos): NÃO existe
  // mais um estado global aqui com a coleção inteira. Antes,
  // guardedDocuments baixava TODOS os documentos pro navegador de cada
  // usuário (via onSnapshot sem filtro) e ainda duplicava tudo no
  // localStorage — funcionava com dezenas/centenas de documentos, mas
  // não escalaria pra uma digitalização em massa (dezenas/centenas de
  // milhares). DocumentsView.tsx agora busca só o que precisa, por
  // setor e paginado, direto do Firestore (ver
  // src/lib/guardedDocumentsQuery.ts) — sem esse estado/listener aqui.


  const currentUserEmployee = useMemo(() => {
    if (!currentUser || !currentUser.employeeId) return null;
    return employees.find(e => e.id === currentUser.employeeId);
  }, [currentUser, employees]);

  const userInitials = useMemo(() => {
    if (!currentUser?.name) return 'U';
    return currentUser.name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [currentUser]);

  // Confere se auth_links/{uid} ainda corresponde ao currentUser
  // restaurado do localStorage após recarregar a página. O cliente NÃO
  // pode mais gravar esse vínculo (só as Cloud Functions login/
  // linkGoogleUser podem — ver firestore.rules e o comentário grande em
  // functions/index.js), então isto é só uma checagem de leitura: na
  // grande maioria dos casos a sessão anônima persiste no navegador
  // entre recarregamentos e o vínculo gravado no login original continua
  // válido (nada a fazer). Se a sessão do Firebase Auth foi perdida (ex.:
  // storage do navegador parcialmente limpo) e uma sessão anônima NOVA
  // foi criada, não existe vínculo correspondente — nesse caso, em vez
  // de reconstruir o vínculo confiando cegamente no que está no
  // localStorage (que era exatamente a falha de segurança antiga),
  // pedimos um novo login.
  useEffect(() => {
    if (!authReady || !currentUser) return;
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !firebaseUser.isAnonymous) return; // sessão do Google tem seu próprio fluxo, abaixo

    getDoc(doc(db, 'auth_links', firebaseUser.uid))
      .then(snap => {
        const linked = snap.exists() ? (snap.data() as { userId?: string }) : null;
        if (linked && linked.userId === currentUser.id) return; // vínculo já válido

        console.warn('Sessão restaurada sem vínculo de autenticação correspondente — solicitando novo login.');
        setCurrentUser(null);
        localStorage.removeItem('ms-current-user');
      })
      .catch(e => console.warn('Falha ao verificar vínculo da sessão restaurada:', e));
  }, [authReady, currentUser?.id]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && firebaseUser.isAnonymous) {
        // Sessão-ponte (ver ensureAnonymousAuth): não é um login de verdade,
        // só destrava as leituras/escritas do Firestore para quem entrou
        // por CPF/senha. Não mexe em currentUser.
        //
        // Espera resolver o ID token ANTES de liberar authReady: o SDK do
        // Firestore só anexa o token corretamente às requisições depois
        // que esse round-trip termina — sem isso, as primeiras chamadas
        // onSnapshot() abertas em sequência logo a seguir (sectors,
        // employees, atrs...) saem sem autenticação e tomam
        // permission-denied, mesmo com a sessão já existindo.
        try {
          await firebaseUser.getIdToken();
        } catch (e) {
          console.warn('Falha ao resolver token da sessão anônima:', e);
        }
        setAuthReady(true);
        return;
      }

      if (firebaseUser) {
        // Logged in via Google Sign-In. Mesmo motivo do ramo da sessão
        // anônima abaixo: espera o ID token resolver antes de liberar
        // authReady, pra evitar permission-denied nas primeiras leituras
        // do Firestore.
        try {
          await firebaseUser.getIdToken();
        } catch (e) {
          console.warn('Falha ao resolver token da sessão Google:', e);
        }
        setAuthReady(true);

        // O papel (admin/gestor/colaborador) e o vínculo com o
        // funcionário/setor são resolvidos no SERVIDOR pela Cloud
        // Function linkGoogleUser — o cliente não decide mais sozinho
        // qual papel esta conta deveria ter (ver comentário grande em
        // functions/index.js). Ela também grava auth_links/{uid}.
        try {
          const result = await linkGoogleUserCallable();
          const data = result.data as { success: boolean; userId: string; userData: UserAccount };
          const googleUserAccount = data.userData;

          rawSetUsers(prev => {
            if (!prev.some(u => u.id === googleUserAccount.id)) {
              return [...prev, googleUserAccount];
            }
            return prev.map(u => (u.id === googleUserAccount.id ? { ...u, ...googleUserAccount } : u));
          });

          setCurrentUser(googleUserAccount);
          localStorage.setItem('ms-current-user', JSON.stringify(googleUserAccount));
        } catch (e) {
          console.error('Falha ao vincular sessão do Google:', e);
        }

        // Seed DB if empty
        await seedDatabaseIfEmpty();
      } else {
        // Nenhuma sessão do Firebase Auth ainda: cria uma anônima para que
        // o login por CPF/senha (que não usa Firebase Auth) consiga ler/
        // gravar no Firestore assim que terminar. O listener acima é
        // rechamado automaticamente quando essa sessão anônima é criada.
        ensureAnonymousAuth().catch(e =>
          console.error('Falha ao criar sessão anônima do Firebase Auth:', e)
        );

        // If logged out from Firebase Auth, only reset currentUser if they were a Google user
        setCurrentUser(prev => {
          if (prev && !prev.password) {
            localStorage.removeItem('ms-current-user');
            return null;
          }
          return prev;
        });
      }
    });

    return () => unsubscribe();
  }, [employees, sectors]);

  // Synchronize collections with Firestore for real-time multi-device persistence
  useEffect(() => {
    // Espera existir sessão do Firebase Auth (mesmo anônima) antes de abrir
    // qualquer listener — as Firestore Rules agora exigem request.auth.
    if (!db || !authReady) return;

    // Seed database if empty on load
    seedDatabaseIfEmpty();

    // Setores, funcionários, ATRs, POPs e ITs têm cada um seu próprio hook
    // agora (ver src/hooks/) — estado, persistência em localStorage e
    // assinatura do Firestore isolados, sem depender deste efeito nem de
    // `currentUser` (só de `authReady`, que é tudo que eles realmente
    // precisam).

    // guarded_documents NÃO tem mais um listener global aqui — ver
    // comentário na declaração do estado (removida), mais acima.
    // DocumentsView.tsx assina só o setor/página que está aberta.

    // Real-time Users subscription. A coleção inteira só é legível por
    // admin/gestor/lider agora (ver firestore.rules — antes qualquer
    // sessão autenticada, inclusive a anônima de todo visitante, lia
    // usuário e hash de senha de todo mundo). Qualquer outra sessão só
    // assina o PRÓPRIO registro logo abaixo (unsubOwnUser).
    const isAccountManager = currentUser?.role === 'admin' || currentUser?.role === 'gestor' || currentUser?.role === 'lider';

    const unsubUsers = isAccountManager
      ? onSnapshot(collection(db, 'users'), (snapshot) => {
          const list: UserAccount[] = [];
          snapshot.forEach((doc) => {
            list.push(doc.data() as UserAccount);
          });
          if (list.length > 0) {
            rawSetUsers(prev => {
              const map = new Map<string, UserAccount>();
              prev.forEach(item => map.set(item.id, item));
              list.forEach(item => {
                const existingKey = Array.from(map.keys()).find(k =>
                  k === item.id ||
                  (map.get(k)?.username && item.username && map.get(k)!.username.toLowerCase() === item.username.toLowerCase())
                );
                if (existingKey) {
                  map.delete(existingKey);
                }
                map.set(item.id, item);
              });
              const result = Array.from(map.values());
              localStorage.setItem('ms-users', JSON.stringify(result));
              return result;
            });
          }
        }, (err) => {
          console.warn("Firestore snapshot error (users):", err);
        })
      : () => {};

    const unsubOwnUser = (!isAccountManager && currentUser)
      ? onSnapshot(doc(db, 'users', currentUser.id), (docSnap) => {
          if (!docSnap.exists()) return;
          const updated = docSnap.data() as UserAccount;
          rawSetUsers(prev => {
            const map = new Map<string, UserAccount>();
            prev.forEach(item => map.set(item.id, item));
            map.set(updated.id, updated);
            const result = Array.from(map.values());
            localStorage.setItem('ms-users', JSON.stringify(result));
            return result;
          });
        }, (err) => {
          console.warn("Firestore snapshot error (own user):", err);
        })
      : () => {};

    // Real-time Permissions subscription
    const unsubPermissions = onSnapshot(doc(db, 'permissions', 'default'), (docSnap) => {
      if (docSnap.exists()) {
        rawSetProfilePermissions(docSnap.data() as ProfilePermissions);
      }
    }, (err) => {
      console.warn("Firestore snapshot error (permissions):", err);
    });

    return () => {
      unsubUsers();
      unsubOwnUser();
      unsubPermissions();
    };
  }, [currentUser, authReady]);

  // Check if a user has access to a document (Colaborador = only explicitly linked, Gestor = explicitly linked + sector/group, Admin = all)
  const userHasAccessToDoc = useCallback((doc: ATR | POP | IT, docType: 'atr' | 'pop' | 'it') => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;

    const roleKey = currentUser.role === 'lider' ? 'gestor' : currentUser.role;
    const perms = (profilePermissions as any)[roleKey];
    if (perms?.canSeeAllDocs) return true;

    const matchedEmployee = employees.find(emp => emp.id === currentUser.employeeId);
    if (!matchedEmployee) return perms?.canSeeAllDocs ?? true;

    // 1. Is it explicitly associated with the employee?
    let isExplicitlyAssociated = false;
    if (docType === 'atr') {
      isExplicitlyAssociated = matchedEmployee.associatedATRs?.includes(doc.id) || false;
    } else if (docType === 'pop') {
      isExplicitlyAssociated = matchedEmployee.associatedPOPs?.includes(doc.id) || false;
    } else if (docType === 'it') {
      isExplicitlyAssociated = matchedEmployee.associatedITs?.includes(doc.id) || false;
    }

    if (isExplicitlyAssociated) return true;

    // 2. If gestor/lider: they also have access to all documents in their group/sector
    if (currentUser.role === 'gestor' || currentUser.role === 'lider') {
      // If the document's sector matches the employee's sector
      if (doc.sector && matchedEmployee.sector && doc.sector.toLowerCase() === matchedEmployee.sector.toLowerCase()) {
        return true;
      }
    }

    return false;
  }, [currentUser, employees, profilePermissions]);

  // (persistência de `sectors` em localStorage já é feita dentro de
  // useSectorsState; a de `employees` já roda logo acima, na declaração
  // do estado — esta era uma segunda gravação idêntica, removida)

  // Helper to normalize username (e.g. "Amanda Bezerra" -> "amanda.bezerra")
  const normalizeUsername = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-z0-9\s]/g, '')     // remove special characters except spaces
      .trim()
      .replace(/\s+/g, '.');          // replace spaces with dots
  };

  // Sync employees to users: garante que todo funcionário tenha uma
  // conta de acesso com senha inicial padrão. Só roda pra quem administra
  // contas (admin/gestor/lider) — antes rodava pra qualquer sessão
  // logada, o que além de desnecessário já esbarraria na regra de
  // escrita do Firestore pra qualquer outro papel. Nunca grava a senha
  // em texto puro (só o hash) e já marca a conta como pendente de troca
  // no primeiro acesso — antes, a senha padrão "123" ficava valendo
  // indefinidamente até alguém trocar manualmente.
  useEffect(() => {
    const isAccountManager = currentUser?.role === 'admin' || currentUser?.role === 'gestor' || currentUser?.role === 'lider';
    if (!isAccountManager) return;

    let cancelled = false;

    (async () => {
      const currentUsers = [...users];
      let updated = false;

      for (const emp of employees) {
        // Check if employee already has a linked user account
        const hasAccount = currentUsers.some(u => u.employeeId === emp.id);
        if (!hasAccount) {
          // Create standard account: username = normalized name, password = '123'
          const baseUsername = normalizeUsername(emp.name);
          // Ensure username is unique
          let finalUsername = baseUsername;
          let counter = 1;
          while (currentUsers.some(u => u.username.toLowerCase() === finalUsername.toLowerCase())) {
            finalUsername = `${baseUsername}${counter}`;
            counter++;
          }

          // Determine default role based on employee's job title
          const roleLower = emp.role.toLowerCase();
          const isLeadership = roleLower.includes('gerente') ||
                              roleLower.includes('coordenador') ||
                              roleLower.includes('diretor') ||
                              roleLower.includes('supervisor') ||
                              roleLower.includes('lider') ||
                              roleLower.includes('gestor');
          const defaultRole: 'colaborador' | 'gestor' = isLeadership ? 'gestor' : 'colaborador';

          const passwordHash = await hashPassword('123');
          const newAccount: UserAccount = {
            id: `user-emp-${emp.id}`,
            username: finalUsername,
            name: emp.name,
            passwordHash,
            role: defaultRole,
            employeeId: emp.id,
            primeiro_acesso: true,
            firstAccess: true
          };
          currentUsers.push(newAccount);
          updated = true;
        } else {
          // Keep the name in sync if they changed their name in the employee card
          const matchedIndex = currentUsers.findIndex(u => u.employeeId === emp.id);
          if (matchedIndex !== -1 && currentUsers[matchedIndex].name !== emp.name) {
            currentUsers[matchedIndex] = {
              ...currentUsers[matchedIndex],
              name: emp.name
            };
            updated = true;
          }
        }
      }

      if (!cancelled && updated) {
        setUsers(currentUsers);
        localStorage.setItem('ms-users', JSON.stringify(currentUsers));
      }
    })();

    return () => { cancelled = true; };
  }, [employees, currentUser?.role]);

  // Current main view tab selection: 'portal' | 'employees' | 'sectors' | 'documentos' | 'workspace'
  // Inicializado a partir da URL carregada (link direto/compartilhado/recarregado
  // continua exatamente onde estava) — ver parseAppPath acima.
  const [currentView, setCurrentView] = useState<ViewType>(() => parseAppPath(window.location.pathname).currentView);

  // Google Workspace Preselection states
  const [preselectedDocId, setPreselectedDocId] = useState<string>('');
  const [preselectedDocType, setPreselectedDocType] = useState<'pop' | 'atr' | 'it'>('pop');

  // Active Document Selector
  const [selectedDocId, setSelectedDocId] = useState<string>(() => parseAppPath(window.location.pathname).selectedDocId);
  const [selectedDocType, setSelectedDocType] = useState<DocType>(() => parseAppPath(window.location.pathname).selectedDocType);
  const [activeTab, setActiveTab] = useState<'content' | 'flowchart'>('content');

  // ───────────────────────────────────────────────────────────────────
  // Sincronização URL ⇄ estado (ver comentário acima de computeAppPath).
  // Cada efeito só chama seu setState/navigate quando o valor calculado
  // realmente diverge do atual — por isso os dois nunca entram em loop
  // um com o outro, mesmo disparando a cada mudança de estado/URL.
  // ───────────────────────────────────────────────────────────────────

  // URL → estado: cobre o botão voltar/avançar do navegador e qualquer
  // carregamento direto de link (a inicialização acima já cobre o
  // primeiro render; este efeito cobre TODAS as mudanças de URL depois
  // dele, inclusive as que o próprio efeito abaixo provoca).
  useEffect(() => {
    const parsed = parseAppPath(location.pathname);
    setCurrentView(prev => (prev !== parsed.currentView ? parsed.currentView : prev));
    setSelectedDocId(prev => (prev !== parsed.selectedDocId ? parsed.selectedDocId : prev));
    setSelectedDocType(prev => (prev !== parsed.selectedDocType ? parsed.selectedDocType : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Estado → URL: qualquer clique que já muda currentView/selectedDocId/
  // selectedDocType (nenhum desses ~60 lugares no arquivo precisou ser
  // tocado) agora também empurra uma URL nova pro histórico do navegador.
  useEffect(() => {
    const targetPath = computeAppPath(currentView, selectedDocType, selectedDocId);
    if (targetPath !== location.pathname) {
      navigate(targetPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, selectedDocType, selectedDocId]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isReadingMode, setIsReadingMode] = useState(false);

  // Reading Mode Styles Constants
  const readingTextClass = isReadingMode
    ? 'text-base md:text-lg leading-loose text-slate-800 dark:text-slate-100 pl-5 transition-all duration-300'
    : 'text-sm text-slate-650 dark:text-slate-300 leading-relaxed pl-3.5 transition-all duration-300';

  const readingHeadingClass = isReadingMode
    ? 'text-sm md:text-base font-extrabold uppercase tracking-widest text-sky-500 dark:text-sky-400 pb-2.5 flex items-center gap-2 transition-all duration-300 border-b border-sky-500/20'
    : 'text-xs md:text-sm font-bold text-slate-950 dark:text-sky-400 uppercase tracking-wider pb-1.5 flex items-center gap-2 transition-all duration-300 border-b border-slate-200/80 dark:border-slate-800';

  const readingListClass = isReadingMode
    ? 'list-disc list-inside pl-6 text-base md:text-lg space-y-3 leading-loose text-slate-800 dark:text-slate-100 transition-all duration-300'
    : 'list-disc list-inside pl-5 text-sm space-y-1.5 text-slate-650 dark:text-slate-300 transition-all duration-300';

  const readingCardClass = isReadingMode
    ? 'space-y-4 p-6 md:p-8 bg-slate-50/80 dark:bg-slate-950/20 rounded-2xl border-2 border-slate-250 dark:border-slate-800 shadow-md relative overflow-hidden transition-all duration-300'
    : 'space-y-2.5 p-4 bg-slate-50/50 dark:bg-slate-950/10 rounded-xl border border-slate-200/50 dark:border-slate-800/60 shadow-3xs relative overflow-hidden transition-all duration-300';

  const readingCardTitleClass = isReadingMode
    ? 'font-black text-base md:text-lg text-sky-600 dark:text-sky-400 transition-all duration-300'
    : 'font-extrabold text-sm text-sky-650 dark:text-sky-400 transition-all duration-300';

  const readingCardDescClass = isReadingMode
    ? 'text-sm md:text-base text-slate-500 dark:text-slate-400 italic leading-relaxed transition-all duration-300'
    : 'text-xs text-slate-550 dark:text-slate-400 italic transition-all duration-300';

  const readingSubstepListClass = isReadingMode
    ? 'space-y-3 pl-6 border-l-2 border-sky-500/40 ml-2 transition-all duration-300'
    : 'space-y-1.5 pl-4 border-l-2 border-slate-200 dark:border-slate-800 ml-1 transition-all duration-300';

  const readingSubstepItemClass = isReadingMode
    ? 'text-base md:text-lg text-slate-700 dark:text-slate-200 flex items-start gap-3 leading-loose transition-all duration-300'
    : 'text-sm text-slate-650 dark:text-slate-300 flex items-start gap-2 transition-all duration-300';

  const readingDirectLeaderCardClass = isReadingMode
    ? 'p-5 bg-slate-50/80 dark:bg-slate-950/30 rounded-xl border-2 border-slate-250 dark:border-slate-800 transition-all duration-300'
    : 'p-3.5 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-slate-200/80 dark:border-slate-800 transition-all duration-300';

  const readingDirectLeaderLabelClass = isReadingMode
    ? 'text-[10px] font-extrabold text-slate-450 uppercase block tracking-wider mb-1'
    : 'text-[9px] font-bold text-slate-400 uppercase block tracking-wider';

  const readingDirectLeaderValueClass = isReadingMode
    ? 'text-slate-900 dark:text-slate-100 text-base mt-1 block flex items-center gap-2.5 font-black'
    : 'text-slate-850 dark:text-slate-200 text-sm mt-1 block flex items-center gap-2 font-bold';

  const readingDetailedTaskItemClass = isReadingMode
    ? 'flex items-start gap-3.5 text-base md:text-lg text-slate-800 dark:text-slate-100 leading-loose transition-all duration-300'
    : 'flex items-start gap-2.5 text-sm text-slate-650 dark:text-slate-300 transition-all duration-300';

  const readingDetailedTaskNumberClass = isReadingMode
    ? 'font-mono text-sm font-black text-sky-600 dark:text-sky-400 bg-sky-500/10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 border border-sky-500/20 mt-1'
    : 'font-mono text-xs font-black text-sky-600 dark:text-sky-400 bg-sky-500/10 w-5 h-5 rounded-full flex items-center justify-center shrink-0 border border-sky-500/20';

  const readingRequirementBoxClass = isReadingMode
    ? 'p-5 bg-slate-50/80 dark:bg-slate-950/30 rounded-xl border-2 border-slate-250 dark:border-slate-800 max-w-2xl transition-all duration-300'
    : 'p-3 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-slate-100 dark:border-slate-800/80 max-w-xl transition-all duration-300';

  const readingRequirementValueClass = isReadingMode
    ? 'text-base md:text-lg text-slate-800 dark:text-slate-100 leading-loose'
    : 'text-sm text-slate-650 dark:text-slate-300';

  const readingSkillsLabelClass = isReadingMode
    ? 'text-slate-900 dark:text-slate-100 text-sm md:text-base font-extrabold block'
    : 'text-slate-850 dark:text-slate-200 block';

  const readingSkillsTagClass = isReadingMode
    ? 'bg-sky-500/10 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 text-sm px-3 py-1.5 rounded-md border-2 border-sky-500/25 font-bold transition-all duration-300'
    : 'bg-sky-500/10 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 text-xs px-2.5 py-1 rounded-md border border-sky-500/20 font-medium transition-all duration-300';

  const readingAttitudesTagClass = isReadingMode
    ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-sm px-3 py-1.5 rounded-md border-2 border-indigo-500/25 font-bold transition-all duration-300'
    : 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-xs px-2.5 py-1 rounded-md border border-indigo-500/20 font-medium transition-all duration-300';

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<Sector | 'Todos'>('Todos');
  const [selectedType, setSelectedType] = useState<'Todos' | 'POP' | 'ATR' | 'IT'>('Todos');
  const [onlyPendingRevision, setOnlyPendingRevision] = useState(false);

  // Handle sector selection with auto-loading the first document of that sector
  const handleSectorSelect = (sector: Sector | 'Todos') => {
    setSelectedSector(sector);
    setSearchQuery(''); // Reset search when filtering by sector to avoid empty results
    setCurrentView('portal'); // Reset back to portal view if on employees or sectors tabs
    if (sector === 'Todos') {
      setSelectedDocId('');
      return;
    }
    // Respeita o filtro de tipo (POP/ATR/IT) já selecionado — antes disso
    // juntava os três tipos e pegava o primeiro por ordem alfabética do
    // ID, ignorando o filtro (ex: filtrando por POP e clicando num setor
    // abria a primeira ATR daquele setor, já que "ATR-001" vem antes de
    // "POP-001" em ordem alfabética).
    const candidates = [
      ...(selectedType === 'Todos' || selectedType === 'POP' ? pops.map(p => ({ ...p, docType: 'pop' as const })) : []),
      ...(selectedType === 'Todos' || selectedType === 'ATR' ? atrs.map(a => ({ ...a, docType: 'atr' as const })) : []),
      ...(selectedType === 'Todos' || selectedType === 'IT' ? its.map(i => ({ ...i, docType: 'it' as const })) : [])
    ];
    const firstDoc = candidates
      .filter(d => d.sector === sector)
      .sort((a, b) => a.id.localeCompare(b.id))[0];

    if (firstDoc) {
      setSelectedDocId(firstDoc.id);
      setSelectedDocType(firstDoc.docType);
      setActiveTab('content');
    } else {
      setSelectedDocId('');
    }
  };

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formDocType, setFormDocType] = useState<'pop' | 'atr' | 'it'>('pop');
  const [editingId, setFormEditingId] = useState<string | null>(null);
  const [initialContentSignature, setInitialContentSignature] = useState<string>('');

  // Form Fields
  const [formId, setFormId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formSector, setFormSector] = useState<Sector>('Administrativo');
  const [formProcess, setFormSectorProcess] = useState('');
  const [formDirectLeader, setFormDirectLeader] = useState('');
  const [formIndirectLeader, setFormIndirectLeader] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formTasks, setFormTasks] = useState('');
  const [formEducation, setFormEducation] = useState('');
  const [formTechnicalComp, setFormTechnicalComp] = useState('');
  const [formExperience, setFormExperience] = useState('');
  const [formSkills, setFormSkills] = useState('');
  const [formAttitudes, setFormAttitudes] = useState('');
  const [formEmissionDate, setFormEmissionDate] = useState('25/06/2026');
  const [formRevision, setFormRevision] = useState('00');
  const [formRevisionDescription, setFormRevisionDescription] = useState('');
  // Admin-only: quando marcado, salva as mudanças de conteúdo SEM avançar
  // o número de revisão (nem registrar entrada no histórico de revisões)
  // — por padrão (desmarcado) o comportamento continua o mesmo de sempre.
  const [keepRevisionOnEdit, setKeepRevisionOnEdit] = useState(false);

  // POP Specific Form Fields
  const [formObjective, setFormObjective] = useState('');
  const [formAppField, setFormAppField] = useState('');
  const [formResponsiblePrimary, setFormResponsiblePrimary] = useState('');
  const [formResponsibleSupport, setFormResponsibleSupport] = useState('');
  const [formInputs, setFormInputs] = useState('');
  const [formOutputs, setFormOutputs] = useState('');
  const [formIndicators, setFormIndicators] = useState('');
  const [formSteps, setFormSteps] = useState<string>(''); // Semi-colon separated steps

  // Reset database back to default
  const handleRestoreDefaults = () => {
    if (confirm('Tem certeza que deseja restaurar a base de documentos padrão? Todas as alterações manuais serão perdidas.')) {
      setATRs(initialATRs);
      setPOPs(initialPOPs);
      setITs(initialITs);
      setSelectedDocId('');
      setSelectedDocType('pop');
      alert('Base de dados restaurada com sucesso!');
    }
  };

  // Delete a document
  const handleDeleteDoc = (id: string, type: 'pop' | 'atr' | 'it') => {
    if (confirm(`Deseja realmente excluir o documento ${id}?`)) {
      if (type === 'atr') {
        dbDeleteATR(id);
        const filtered = atrs.filter(a => a.id !== id);
        setATRs(filtered);
        if (selectedDocId === id) {
          const next = filtered[0] || pops[0] || its[0];
          setSelectedDocId(next ? next.id : '');
          setSelectedDocType(next ? (next.id.startsWith('POP-') ? 'pop' : next.id.startsWith('IT-') ? 'it' : 'atr') : 'pop');
        }
      } else if (type === 'pop') {
        dbDeletePOP(id);
        const filtered = pops.filter(p => p.id !== id);
        setPOPs(filtered);
        if (selectedDocId === id) {
          const next = filtered[0] || atrs[0] || its[0];
          setSelectedDocId(next ? next.id : '');
          setSelectedDocType(next ? (next.id.startsWith('POP-') ? 'pop' : next.id.startsWith('IT-') ? 'it' : 'atr') : 'pop');
        }
      } else {
        dbDeleteIT(id);
        const filtered = its.filter(i => i.id !== id);
        setITs(filtered);
        if (selectedDocId === id) {
          const next = filtered[0] || pops[0] || atrs[0];
          setSelectedDocId(next ? next.id : '');
          setSelectedDocType(next ? (next.id.startsWith('POP-') ? 'pop' : next.id.startsWith('IT-') ? 'it' : 'atr') : 'pop');
        }
      }
    }
  };

  // Helper to generate a text signature of any document data
  const getDocContentSignature = (doc: any, type: 'pop' | 'atr' | 'it'): string => {
    const normalize = (str: string) => (str || '').trim().replace(/\s+/g, ' ').toLowerCase();
    
    if (type === 'atr') {
      const atr = doc as ATR;
      return [
        atr.title,
        atr.directLeader,
        atr.indirectLeader || '',
        atr.summary,
        atr.detailedTasks.join('\n'),
        atr.requirements.education,
        atr.requirements.technicalCompetencies.join('\n'),
        atr.requirements.experience,
        atr.requirements.skills.join(', '),
        atr.requirements.attitudes.join(', ')
      ].map(normalize).join('|');
    }
    
    if (type === 'it') {
      const it = doc as IT;
      return [
        it.title,
        it.objective,
        it.responsible,
        it.steps.join('\n')
      ].map(normalize).join('|');
    }
    
    // POP
    const pop = doc as POP;
    const popStepsStr = (pop.steps || []).map(s => {
      const subs = s.substeps ? `:${s.substeps.join(',')}` : '';
      return `${s.title}:${s.description}${subs}`;
    }).join('; ');
    
    return [
      pop.title,
      pop.process || '',
      pop.objective,
      pop.responsiblePrimary,
      pop.applicationField.join(', '),
      pop.responsibleSupport.join(', '),
      pop.inputs.join('\n'),
      pop.outputs.join('\n'),
      pop.performanceIndicators.join('\n'),
      popStepsStr
    ].map(normalize).join('|');
  };

  // Helper to generate a text signature of the current form content fields
  const getContentSignature = (): string => {
    const normalize = (str: string) => (str || '').trim().replace(/\s+/g, ' ').toLowerCase();
    
    if (formDocType === 'atr') {
      return [
        formTitle,
        formDirectLeader,
        formIndirectLeader,
        formSummary,
        formTasks,
        formEducation,
        formTechnicalComp,
        formExperience,
        formSkills,
        formAttitudes
      ].map(normalize).join('|');
    }
    
    if (formDocType === 'it') {
      return [
        formTitle,
        formObjective,
        formResponsiblePrimary,
        formSteps
      ].map(normalize).join('|');
    }
    
    // POP
    return [
      formTitle,
      formProcess,
      formObjective,
      formResponsiblePrimary,
      formAppField,
      formResponsibleSupport,
      formInputs,
      formOutputs,
      formIndicators,
      formSteps
    ].map(normalize).join('|');
  };

  // Check if content text (excluding sector and dates) has actually changed
  const getIsContentChanged = (): boolean => {
    if (editingId === null) return false;
    return getContentSignature() !== initialContentSignature;
  };

  // Submit Form (Create or Edit)
  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!formId || !formTitle) {
      alert('Por favor, preencha o Código e o Título.');
      return;
    }

    if (formDocType === 'atr') {
      const originalATR = atrs.find(a => a.id === editingId);
      let nextRev = formRevision;
      let todayStr = new Date().toLocaleDateString('pt-BR');
      let updatedHistory = originalATR?.revisionHistory;
      const isContentChanged = getIsContentChanged();

      if (editingId && originalATR) {
        if (isContentChanged && !keepRevisionOnEdit) {
          const currentRev = originalATR.revision || '00';
          const nextRevNum = parseInt(currentRev, 10);
          nextRev = isNaN(nextRevNum) ? '01' : String(nextRevNum + 1).padStart(2, '0');

          const initialHistory: RevisionHistoryEntry[] = originalATR.revisionHistory || [
            {
              revision: currentRev,
              date: originalATR.revisionDate || originalATR.emissionDate || '01/03/2025',
              description: 'Emissão Inicial',
              author: 'Sistema'
            }
          ];
          const newEntry: RevisionHistoryEntry = {
            revision: nextRev,
            date: todayStr,
            description: formRevisionDescription.trim() || 'Atualização de conteúdo',
            author: currentUser?.name || 'Administrador'
          };
          updatedHistory = [...initialHistory, newEntry];
        } else {
          // Conteúdo não mudou, OU mudou mas o admin marcou "manter
          // revisão atual" — preserva revisão e histórico sem avançar.
          nextRev = originalATR.revision || '00';
          updatedHistory = originalATR.revisionHistory;
        }
      }

      const newATR: ATR = {
        id: formId,
        title: formTitle,
        sector: formSector,
        directLeader: formDirectLeader,
        indirectLeader: formIndirectLeader || undefined,
        summary: formSummary,
        detailedTasks: formTasks.split('\n').filter(t => t.trim()),
        requirements: {
          education: formEducation,
          technicalCompetencies: formTechnicalComp.split('\n').filter(c => c.trim()),
          experience: formExperience,
          skills: formSkills.split(',').map(s => s.trim()).filter(s => s),
          attitudes: formAttitudes.split(',').map(a => a.trim()).filter(a => a)
        },
        emissionDate: formEmissionDate,
        revision: nextRev,
        revisionDate: editingId ? (isContentChanged && !keepRevisionOnEdit ? todayStr : originalATR?.revisionDate) : undefined,
        revisionHistory: updatedHistory
      };

      if (editingId) {
        setATRs(atrs.map(a => a.id === editingId ? newATR : a));
      } else {
        if (atrs.some(a => a.id === formId)) {
          alert('Já existe um documento com esse Código.');
          return;
        }
        setATRs([...atrs, newATR]);
      }
      setSelectedDocId(formId);
      setSelectedDocType('atr');

    } else if (formDocType === 'it') {
      const originalIT = its.find(i => i.id === editingId);
      let nextRev = formRevision;
      let todayStr = new Date().toLocaleDateString('pt-BR');
      let updatedHistory = originalIT?.revisionHistory;
      const isContentChanged = getIsContentChanged();

      if (editingId && originalIT) {
        if (isContentChanged && !keepRevisionOnEdit) {
          const currentRev = originalIT.revision || '00';
          const nextRevNum = parseInt(currentRev, 10);
          nextRev = isNaN(nextRevNum) ? '01' : String(nextRevNum + 1).padStart(2, '0');

          const initialHistory: RevisionHistoryEntry[] = originalIT.revisionHistory || [
            {
              revision: currentRev,
              date: originalIT.revisionDate || originalIT.emissionDate || '01/03/2025',
              description: 'Emissão Inicial',
              author: 'Sistema'
            }
          ];
          const newEntry: RevisionHistoryEntry = {
            revision: nextRev,
            date: todayStr,
            description: formRevisionDescription.trim() || 'Atualização de conteúdo',
            author: currentUser?.name || 'Administrador'
          };
          updatedHistory = [...initialHistory, newEntry];
        } else {
          // Conteúdo não mudou, OU mudou mas o admin marcou "manter
          // revisão atual" — preserva revisão e histórico sem avançar.
          nextRev = originalIT.revision || '00';
          updatedHistory = originalIT.revisionHistory;
        }
      }

      const newIT: IT = {
        id: formId,
        title: formTitle,
        sector: formSector,
        objective: formObjective,
        responsible: formResponsiblePrimary,
        steps: formSteps.split('\n').map(s => s.trim()).filter(Boolean),
        emissionDate: formEmissionDate,
        revision: nextRev,
        revisionDate: editingId ? (isContentChanged && !keepRevisionOnEdit ? todayStr : originalIT?.revisionDate) : undefined,
        revisionHistory: updatedHistory
      };

      if (editingId) {
        setITs(its.map(i => i.id === editingId ? newIT : i));
      } else {
        if (its.some(i => i.id === formId)) {
          alert('Já existe um documento com esse Código.');
          return;
        }
        setITs([...its, newIT]);
      }
      setSelectedDocId(formId);
      setSelectedDocType('it');

    } else {
      // Parse steps for POP
      const stepsList: POPStep[] = formSteps.split(';').map((stepText, sIdx) => {
        const parts = stepText.split(':');
        const title = parts[0]?.trim() || `Passo ${sIdx + 1}`;
        const desc = parts[1]?.trim() || '';
        const substeps = parts[2] ? parts[2].split(',').map(s => s.trim()).filter(Boolean) : undefined;
        return {
          title,
          description: desc,
          substeps
        };
      });

      const originalPOP = pops.find(p => p.id === editingId);
      let nextRev = formRevision;
      let todayStr = new Date().toLocaleDateString('pt-BR');
      let updatedHistory = originalPOP?.revisionHistory;
      const isContentChanged = getIsContentChanged();

      if (editingId && originalPOP) {
        if (isContentChanged && !keepRevisionOnEdit) {
          const currentRev = originalPOP.revision || '00';
          const nextRevNum = parseInt(currentRev, 10);
          nextRev = isNaN(nextRevNum) ? '01' : String(nextRevNum + 1).padStart(2, '0');

          const initialHistory: RevisionHistoryEntry[] = originalPOP.revisionHistory || [
            {
              revision: currentRev,
              date: originalPOP.revisionDate || originalPOP.emissionDate || '01/03/2025',
              description: 'Emissão Inicial',
              author: 'Sistema'
            }
          ];
          const newEntry: RevisionHistoryEntry = {
            revision: nextRev,
            date: todayStr,
            description: formRevisionDescription.trim() || 'Atualização de conteúdo',
            author: currentUser?.name || 'Administrador'
          };
          updatedHistory = [...initialHistory, newEntry];
        } else {
          // Conteúdo não mudou, OU mudou mas o admin marcou "manter
          // revisão atual" — preserva revisão e histórico sem avançar.
          nextRev = originalPOP.revision || '00';
          updatedHistory = originalPOP.revisionHistory;
        }
      }

      const newPOP: POP = {
        id: formId,
        title: formTitle,
        process: formProcess || 'ADMINISTRATIVO',
        sector: formSector,
        emissionDate: formEmissionDate,
        revision: nextRev,
        revisionDate: editingId ? (isContentChanged && !keepRevisionOnEdit ? todayStr : originalPOP?.revisionDate) : undefined,
        revisionHistory: updatedHistory,
        pages: '1 de 1',
        objective: formObjective,
        applicationField: formAppField.split(',').map(f => f.trim()).filter(Boolean),
        responsiblePrimary: formResponsiblePrimary,
        responsibleSupport: formResponsibleSupport.split(',').map(s => s.trim()).filter(Boolean),
        inputs: formInputs.split('\n').filter(i => i.trim()),
        outputs: formOutputs.split('\n').filter(o => o.trim()),
        performanceIndicators: formIndicators.split('\n').filter(i => i.trim()),
        steps: stepsList
      };

      if (editingId) {
        setPOPs(pops.map(p => p.id === editingId ? newPOP : p));
      } else {
        if (pops.some(p => p.id === formId)) {
          alert('Já existe um documento com esse Código.');
          return;
        }
        setPOPs([...pops, newPOP]);
      }
      setSelectedDocId(formId);
      setSelectedDocType('pop');
    }

    setIsModalOpen(false);
    resetForm();
  };

  // Edit existing document action
  const handleStartEdit = (doc: any, type: 'pop' | 'atr' | 'it') => {
    setFormEditingId(doc.id);
    setFormDocType(type);
    setFormId(doc.id);
    setFormTitle(doc.title);
    setFormSector(doc.sector);
    setFormEmissionDate(doc.emissionDate);
    setFormRevision(doc.revision);
    setInitialContentSignature(getDocContentSignature(doc, type));

    if (type === 'atr') {
      const atr = doc as ATR;
      setFormDirectLeader(atr.directLeader);
      setFormIndirectLeader(atr.indirectLeader || '');
      setFormSummary(atr.summary);
      setFormTasks(atr.detailedTasks.join('\n'));
      setFormEducation(atr.requirements.education);
      setFormTechnicalComp(atr.requirements.technicalCompetencies.join('\n'));
      setFormExperience(atr.requirements.experience);
      setFormSkills(atr.requirements.skills.join(', '));
      setFormAttitudes(atr.requirements.attitudes.join(', '));
    } else if (type === 'it') {
      const it = doc as IT;
      setFormObjective(it.objective);
      setFormResponsiblePrimary(it.responsible);
      setFormSteps(it.steps.join('\n'));
    } else {
      const pop = doc as POP;
      setFormSectorProcess(pop.process);
      setFormObjective(pop.objective);
      setFormAppField(pop.applicationField.join(', '));
      setFormResponsiblePrimary(pop.responsiblePrimary);
      setFormResponsibleSupport(pop.responsibleSupport.join(', '));
      setFormInputs(pop.inputs.join('\n'));
      setFormOutputs(pop.outputs.join('\n'));
      setFormIndicators(pop.performanceIndicators.join('\n'));
      // Serialize steps into Title:Description:Substep1,Substep2;
      const stepStr = pop.steps.map(s => {
        const subs = s.substeps ? `:${s.substeps.join(',')}` : '';
        return `${s.title}:${s.description}${subs}`;
      }).join('; ');
      setFormSteps(stepStr);
    }

    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormEditingId(null);
    setFormId('');
    setFormTitle('');
    setFormSector('Administrativo');
    setFormSectorProcess('');
    setFormDirectLeader('');
    setFormIndirectLeader('');
    setFormSummary('');
    setFormTasks('');
    setFormEducation('');
    setFormTechnicalComp('');
    setFormExperience('');
    setFormSkills('');
    setFormAttitudes('');
    setFormObjective('');
    setFormAppField('');
    setFormResponsiblePrimary('');
    setFormResponsibleSupport('');
    setFormInputs('');
    setFormOutputs('');
    setFormIndicators('');
    setFormSteps('');
    setFormEmissionDate('25/06/2026');
    setFormRevision('00');
    setFormRevisionDescription('');
    setKeepRevisionOnEdit(false);
  };

  // Open fresh modal
  const handleOpenCreateModal = (type: 'pop' | 'atr' | 'it') => {
    resetForm();
    setFormDocType(type);
    // Auto generate logical next ID
    if (type === 'atr') {
      const nextIdNum = Math.max(...atrs.map(a => parseInt(a.id.split('-')[1]) || 0), 0) + 1;
      setFormId(`Atr-${String(nextIdNum).padStart(3, '0')}`);
    } else if (type === 'pop') {
      const nextIdNum = Math.max(...pops.map(p => parseInt(p.id.split('-')[1]) || 0), 0) + 1;
      setFormId(`POP-${String(nextIdNum).padStart(3, '0')}`);
    } else {
      const nextIdNum = Math.max(...its.map(i => parseInt(i.id.split('-')[1]) || 0), 0) + 1;
      setFormId(`IT-${String(nextIdNum).padStart(3, '0')}`);
    }
    setIsModalOpen(true);
  };

  // Filters mapping
  const filteredATRs = atrs.filter(atr => {
    // Permission-based filter
    if (!userHasAccessToDoc(atr, 'atr')) {
      return false;
    }

    if (onlyPendingRevision && !getReviewStatus(atr).isPending) {
      return false;
    }

    const matchesSearch =
      atr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      atr.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      atr.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      atr.detailedTasks.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSector = selectedSector === 'Todos' || atr.sector === selectedSector;
    return matchesSearch && matchesSector && (selectedType === 'Todos' || selectedType === 'ATR');
  });

  const filteredPOPs = pops.filter(pop => {
    // Permission-based filter
    if (!userHasAccessToDoc(pop, 'pop')) {
      return false;
    }

    if (onlyPendingRevision && !getReviewStatus(pop).isPending) {
      return false;
    }

    const matchesSearch =
      pop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pop.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pop.objective.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pop.steps.some(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSector = selectedSector === 'Todos' || pop.sector === selectedSector;
    return matchesSearch && matchesSector && (selectedType === 'Todos' || selectedType === 'POP');
  });

  const filteredITs = its.filter(it => {
    // Permission-based filter
    if (!userHasAccessToDoc(it, 'it')) {
      return false;
    }

    if (onlyPendingRevision && !getReviewStatus(it).isPending) {
      return false;
    }

    const matchesSearch =
      it.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.objective.toLowerCase().includes(searchQuery.toLowerCase()) ||
      it.steps.some(step => step.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSector = selectedSector === 'Todos' || it.sector === selectedSector;
    return matchesSearch && matchesSector && (selectedType === 'Todos' || selectedType === 'IT');
  });

  const allFilteredDocs = [
    ...filteredPOPs.map(p => ({ ...p, docType: 'pop' as const })),
    ...filteredATRs.map(a => ({ ...a, docType: 'atr' as const })),
    ...filteredITs.map(i => ({ ...i, docType: 'it' as const }))
  ].sort((a, b) => a.id.localeCompare(b.id));

  const activeDoc =
    selectedDocType === 'pop'
      ? pops.find(p => p.id === selectedDocId)
      : selectedDocType === 'atr'
      ? atrs.find(a => a.id === selectedDocId)
      : its.find(i => i.id === selectedDocId);

  const activeDocReviewStatus = activeDoc ? getReviewStatus(activeDoc) : null;

  // Statistics
  const totalPOPs = userPermissions.canSeeAllDocs ? pops.length : filteredPOPs.length;
  const totalATRs = userPermissions.canSeeAllDocs ? atrs.length : filteredATRs.length;
  const totalITs = userPermissions.canSeeAllDocs ? its.length : filteredITs.length;
  const sectorCounts = [
    ...(userPermissions.canSeeAllDocs ? pops : filteredPOPs),
    ...(userPermissions.canSeeAllDocs ? atrs : filteredATRs),
    ...(userPermissions.canSeeAllDocs ? its : filteredITs)
  ].reduce((acc, doc) => {
    acc[doc.sector] = (acc[doc.sector] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalVisibleDocsWithoutPendingFilter = useMemo(() => {
    const visibleATRs = atrs.filter(atr => {
      if (!userHasAccessToDoc(atr, 'atr')) {
        return false;
      }
      const matchesSearch =
        atr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        atr.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        atr.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        atr.detailedTasks.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesSector = selectedSector === 'Todos' || atr.sector === selectedSector;
      return matchesSearch && matchesSector;
    });

    const visiblePOPs = pops.filter(pop => {
      if (!userHasAccessToDoc(pop, 'pop')) {
        return false;
      }
      const matchesSearch =
        pop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pop.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pop.objective.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pop.steps.some(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesSector = selectedSector === 'Todos' || pop.sector === selectedSector;
      return matchesSearch && matchesSector;
    });

    const visibleITs = its.filter(it => {
      if (!userHasAccessToDoc(it, 'it')) {
        return false;
      }
      const matchesSearch =
        it.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        it.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        it.objective.toLowerCase().includes(searchQuery.toLowerCase()) ||
        it.steps.some(step => step.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesSector = selectedSector === 'Todos' || it.sector === selectedSector;
      return matchesSearch && matchesSector;
    });

    return [...visiblePOPs, ...visibleATRs, ...visibleITs];
  }, [pops, atrs, its, searchQuery, selectedSector, userHasAccessToDoc]);

  const pendingDocsCount = useMemo(() => {
    return totalVisibleDocsWithoutPendingFilter.filter(doc => getReviewStatus(doc).isPending).length;
  }, [totalVisibleDocsWithoutPendingFilter]);

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  if (!currentUser) {
    return <LoginView onLogin={handleLogin} users={users} onUpdateUsers={handleUpdateUsers} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans transition-colors duration-200 pb-12">
      
      {/* Header Bar */}
      <header className="no-print bg-white/90 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:h-20 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Logo & Brand Info */}
          <div className="flex items-center justify-between lg:justify-start gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0 text-white font-black text-sm">
                ACII
              </div>
              <div>
                <h1 className="text-xs sm:text-sm md:text-base font-black tracking-tight text-slate-950 dark:text-white uppercase font-display leading-tight">
                  Portal de Documentos ACII
                </h1>
                <p className="text-[9px] sm:text-[10px] md:text-xs text-emerald-600 dark:text-emerald-450 font-black uppercase tracking-widest leading-none mt-0.5">
                  ACII • Associação Comercial de Imperatriz
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs, Actions, and Profile Info */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3.5 w-full lg:w-auto">
            
            {/* View Tabs with Active Indicator */}
            <div className="relative flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800 shrink-0">
              <button
                onClick={() => {
                  setCurrentView('portal');
                  setSelectedDocId('');
                }}
                className={`relative px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'portal'
                    ? 'text-sky-600 dark:text-sky-400 font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                {currentView === 'portal' && (
                  <motion.div
                    layoutId="activeNavBadge"
                    className="absolute inset-0 bg-white dark:bg-slate-900 border border-sky-500/30 rounded-lg shadow-2xs"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <BookOpen className="w-3.5 h-3.5 z-10" />
                <span className="z-10">Portal</span>
              </button>

              {userPermissions.canSeeEmployees && (
                <button
                  onClick={() => {
                    setCurrentView('employees');
                    setSelectedDocId('');
                  }}
                  className={`relative px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentView === 'employees'
                      ? 'text-indigo-600 dark:text-indigo-400 font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  {currentView === 'employees' && (
                    <motion.div
                      layoutId="activeNavBadge"
                      className="absolute inset-0 bg-white dark:bg-slate-900 border border-indigo-500/30 rounded-lg shadow-2xs"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Users className="w-3.5 h-3.5 z-10" />
                  <span className="z-10">Funcionários</span>
                </button>
              )}

              {userPermissions.canSeeSectors && (
                <button
                  onClick={() => {
                    setCurrentView('sectors');
                    setSelectedDocId('');
                  }}
                  className={`relative px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentView === 'sectors'
                      ? 'text-amber-600 dark:text-amber-450 font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  {currentView === 'sectors' && (
                    <motion.div
                      layoutId="activeNavBadge"
                      className="absolute inset-0 bg-white dark:bg-slate-900 border border-amber-500/30 rounded-lg shadow-2xs"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Building className="w-3.5 h-3.5 z-10" />
                  <span className="z-10">Setores</span>
                </button>
              )}

              <button
                onClick={() => {
                  setCurrentView('documentos');
                  setSelectedDocId('');
                }}
                className={`relative px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'documentos'
                    ? 'text-rose-600 dark:text-rose-400 font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                {currentView === 'documentos' && (
                  <motion.div
                    layoutId="activeNavBadge"
                    className="absolute inset-0 bg-white dark:bg-slate-900 border border-rose-500/30 rounded-lg shadow-2xs"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Archive className="w-3.5 h-3.5 z-10" />
                <span className="z-10">Documentos</span>
              </button>

              <button
                onClick={() => {
                  setCurrentView('workspace');
                  setSelectedDocId('');
                  setPreselectedDocId('');
                }}
                className={`relative px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'workspace'
                    ? 'text-emerald-600 dark:text-emerald-450 font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                {currentView === 'workspace' && (
                  <motion.div
                    layoutId="activeNavBadge"
                    className="absolute inset-0 bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-lg shadow-2xs"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Cloud className="w-3.5 h-3.5 z-10" />
                <span className="z-10">Workspace</span>
              </button>
            </div>

            {/* Actions: Theme Toggle, Admin, Creation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="theme-toggle p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/80 rounded-lg transition-colors cursor-pointer"
                title={theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
              >
                {theme === 'light' ? (
                  <Moon className="w-4 h-4 text-sky-500" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400" />
                )}
              </button>

              {(currentUser.role === 'admin' || currentUser.role === 'gestor' || currentUser.role === 'lider') && (
                <button
                  onClick={() => setIsAdminModalOpen(true)}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-700 rounded-lg text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer font-bold shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                  title="Gerenciar Usuários e Senhas"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Senhas</span>
                </button>
              )}

              {userPermissions.canEditDocs && (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => handleOpenCreateModal('pop')}
                    className="px-2.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs flex items-center gap-1 font-bold shadow-[0_0_10px_rgba(14,165,233,0.3)] transition-all cursor-pointer"
                    title="Criar novo POP"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>POP</span>
                  </button>
                  <button
                    onClick={() => handleOpenCreateModal('atr')}
                    className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs flex items-center gap-1 font-bold shadow-[0_0_10px_rgba(99,102,241,0.3)] transition-all cursor-pointer"
                    title="Criar nova ATR"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>ATR</span>
                  </button>
                </div>
              )}
            </div>

            {/* Profile Info & Logout with Enhanced Association Visual */}
            <div className="flex items-center gap-3 pl-3.5 border-l border-slate-200 dark:border-slate-800 shrink-0">
              
              {/* User Avatar & Info Card */}
              <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/80 rounded-xl py-1 px-2.5 shadow-xs">
                {/* Avatar with status */}
                <div className="relative w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 flex items-center justify-center border border-emerald-500/20 text-xs font-black uppercase tracking-wider">
                  {userInitials}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow-xs" />
                </div>
                
                {/* Details */}
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-black text-slate-950 dark:text-white leading-tight">
                    {currentUser.name}
                  </span>
                  
                  {/* Role & Association (Vínculo) */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[8px] font-black uppercase px-1 rounded-xs leading-none border ${
                      currentUser.role === 'admin'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        : currentUser.role === 'lider'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
                    }`}>
                      {currentUser.role === 'admin' ? 'Admin' : currentUser.role === 'lider' ? 'Líder' : 'Funcionário'}
                    </span>
                    
                    {currentUserEmployee ? (
                      <span 
                        className="text-[9px] text-indigo-600 dark:text-indigo-400 font-extrabold max-w-[120px] truncate flex items-center gap-0.5 leading-none bg-indigo-500/5 px-1 py-0.5 rounded border border-indigo-500/10" 
                        title={`Perfil vinculado: ${currentUserEmployee.name}`}
                      >
                        <User className="w-2.5 h-2.5 shrink-0" />
                        <span className="truncate">{currentUserEmployee.name}</span>
                      </span>
                    ) : (
                      currentUser.role === 'admin' && (
                        <span className="text-[8px] text-slate-500 dark:text-slate-400 font-bold leading-none">
                          • Geral
                        </span>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded-lg transition-all cursor-pointer"
                title="Sair do Sistema"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Active Screen Indicator Banner */}
      <div className="no-print bg-slate-100/80 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-800/60 py-2 px-4 sm:px-8 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-2xs font-bold uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-400 dark:text-slate-500">Tela Ativa:</span>
            <span className="text-slate-800 dark:text-slate-200 font-black flex items-center gap-1.5">
              {currentView === 'portal' && <><BookOpen className="w-3.5 h-3.5 text-sky-500" /> Portal de Documentos</>}
              {currentView === 'employees' && <><Users className="w-3.5 h-3.5 text-indigo-500" /> Gestão de Colaboradores</>}
              {currentView === 'sectors' && <><Building className="w-3.5 h-3.5 text-amber-500" /> Matriz de Setores</>}
              {currentView === 'documentos' && <><Archive className="w-3.5 h-3.5 text-rose-500" /> Guarda de Documentos</>}
              {currentView === 'workspace' && <><Cloud className="w-3.5 h-3.5 text-emerald-500" /> Google Workspace Integration</>}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-slate-400 dark:text-slate-500 text-[10px]">
            <span>ACII Imperatriz • Sistema de Controle de Processos</span>
          </div>
        </div>
      </div>

      {/* Breadcrumbs Navigation (Migalhas de Pão) */}
      <div className="no-print max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 pb-1">
        <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium overflow-x-auto py-1 scrollbar-none">
          <button
            onClick={() => {
              setCurrentView('portal');
              setSelectedDocId('');
            }}
            className="flex items-center gap-1 hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer shrink-0"
            title="Ir para o início"
          >
            <Home className="w-3.5 h-3.5 text-slate-400" />
            <span>Início</span>
          </button>

          <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 shrink-0" />

          <button
            onClick={() => {
              if (selectedDocId) {
                setSelectedDocId('');
              }
            }}
            className={`hover:text-sky-600 dark:hover:text-sky-400 transition-colors cursor-pointer shrink-0 font-bold ${
              !selectedDocId ? 'text-sky-600 dark:text-sky-400' : ''
            }`}
          >
            {currentView === 'portal' && 'Portal de Documentos'}
            {currentView === 'employees' && 'Gestão de Colaboradores'}
            {currentView === 'sectors' && 'Matriz de Setores'}
            {currentView === 'documentos' && 'Guarda de Documentos'}
            {currentView === 'workspace' && 'Google Workspace Integration'}
          </button>

          {currentView === 'portal' && selectedDocId && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 shrink-0" />
              <span className="text-slate-800 dark:text-slate-200 font-bold truncate max-w-[280px]">
                {selectedDocId}
              </span>
            </>
          )}
        </nav>
      </div>

      {/* Main Container */}
      <main className={`${isFullScreen ? 'w-full max-w-full px-4 py-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
        
        {currentView === 'employees' ? (
          <EmployeeManager 
            employees={employees}
            setEmployees={setEmployees}
            sectors={sectors}
            pops={pops}
            atrs={atrs}
            its={its}
            users={users}
            setUsers={setUsers}
            onViewDoc={(id, type) => {
              setSelectedDocId(id);
              setSelectedDocType(type);
              setCurrentView('portal');
            }}
          />
        ) : currentView === 'sectors' ? (
          <SectorManager
            sectors={sectors}
            setSectors={setSectors}
            employees={employees}
            pops={pops}
            atrs={atrs}
          />
        ) : currentView === 'documentos' ? (
          <DocumentsView
            sectors={sectors}
            currentUser={currentUser}
            currentUserEmployee={currentUserEmployee}
            userPermissions={userPermissions}
          />
        ) : currentView === 'workspace' ? (
          <GoogleWorkspaceManager
            employees={employees}
            atrs={atrs}
            pops={pops}
            its={its}
            currentUserEmail={currentUser?.email}
            preselectedDocId={preselectedDocId}
            preselectedDocType={preselectedDocType}
          />
        ) : (
          <>
            {/* Statistics Widgets */}
        {!isFullScreen && (
          <section className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <motion.div
            whileHover={{ y: -3, scale: 1.01 }}
            onClick={() => setSelectedType(selectedType === 'POP' ? 'Todos' : 'POP')}
            className={`p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between backdrop-blur-xs cursor-pointer border ${
              selectedType === 'POP'
                ? 'bg-sky-500/10 dark:bg-sky-500/5 border-sky-500 ring-2 ring-sky-500/20 shadow-[0_0_15px_rgba(14,165,233,0.15)]'
                : 'bg-white/80 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80'
            }`}
          >
            <div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total POPs</span>
              <h2 className="text-3xl font-black text-sky-600 dark:text-sky-400 font-display mt-1 tracking-tight">{totalPOPs}</h2>
              <p className="text-[10px] text-slate-450 dark:text-slate-400/80 mt-1">Procedimentos Operacionais</p>
            </div>
            <div className="p-3 bg-sky-500/10 rounded-xl text-sky-600 dark:text-sky-400 border border-sky-500/25 shadow-[0_0_12px_rgba(14,165,233,0.15)]">
              <Layers className="w-5.5 h-5.5" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -3, scale: 1.01 }}
            onClick={() => setSelectedType(selectedType === 'ATR' ? 'Todos' : 'ATR')}
            className={`p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between backdrop-blur-xs cursor-pointer border ${
              selectedType === 'ATR'
                ? 'bg-indigo-500/10 dark:bg-indigo-500/5 border-indigo-500 ring-2 ring-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                : 'bg-white/80 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80'
            }`}
          >
            <div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total ATRs</span>
              <h2 className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-display mt-1 tracking-tight">{totalATRs}</h2>
              <p className="text-[10px] text-slate-450 dark:text-slate-400/80 mt-1">Atribuições de Funções</p>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 shadow-[0_0_12px_rgba(99,102,241,0.15)]">
              <Briefcase className="w-5.5 h-5.5" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -3, scale: 1.01 }}
            className="bg-white/80 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between backdrop-blur-xs"
          >
            <div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Setores Ativos</span>
              <h2 className="text-3xl font-black text-amber-600 dark:text-amber-400 font-display mt-1 tracking-tight">8</h2>
              <p className="text-[10px] text-slate-450 dark:text-slate-400/80 mt-1">Organizados por lotes</p>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400 border border-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
              <Building className="w-5.5 h-5.5" />
            </div>
          </motion.div>

          <motion.div
            whileHover={{ y: -3, scale: 1.01 }}
            onClick={() => setOnlyPendingRevision(!onlyPendingRevision)}
            className={`p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between backdrop-blur-xs cursor-pointer border ${
              onlyPendingRevision
                ? 'bg-rose-500/10 dark:bg-rose-500/5 border-rose-500 ring-2 ring-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                : 'bg-white/80 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80'
            }`}
          >
            <div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Revisões Pendentes</span>
              <h2 className={`text-3xl font-black font-display mt-1 tracking-tight ${
                pendingDocsCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'
              }`}>{pendingDocsCount}</h2>
              <p className="text-[10px] text-slate-450 dark:text-slate-400/80 mt-1">Revisão anual pendente</p>
            </div>
            <div className={`p-3 rounded-xl border ${
              pendingDocsCount > 0
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-750'
            }`}>
              <AlertTriangle className={`w-5.5 h-5.5 ${pendingDocsCount > 0 ? 'animate-pulse text-rose-500' : ''}`} />
            </div>
          </motion.div>
        </section>
        )}

        {/* Filters and Search Bar */}
        {!isFullScreen && (
          <section className="no-print bg-white/70 dark:bg-slate-900/30 border border-slate-200/80 dark:border-slate-800/80 p-5 rounded-2xl shadow-sm mb-8 space-y-4 backdrop-blur-xs">
          <div className="flex flex-wrap items-center gap-4">
            
            {/* Search Input */}
            <div className="flex-1 min-w-[280px] relative">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por título, código, palavra-chave, tarefas..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
              />
            </div>

            {/* Selector: Type */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tipo:</span>
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800">
                {(['Todos', 'POP', 'ATR', 'IT'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      selectedType === type
                        ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 shadow-3xs border border-sky-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    {type === 'Todos' ? 'Todos' : type === 'POP' ? 'POPs' : type === 'ATR' ? 'ATRs' : 'ITs'}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Sector Tabs */}
          <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1">Setores:</span>
            {['Todos', ...sectors.map(s => s.name)].map(sec => (
              <button
                key={sec}
                onClick={() => handleSectorSelect(sec)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  selectedSector === sec
                    ? 'bg-sky-500/10 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/25 shadow-3xs font-bold'
                    : 'bg-white/50 dark:bg-slate-900/30 border-slate-200/80 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {sec === 'Juridico' ? 'Jurídico' : sec}
                {sectorCounts[sec] ? ` (${sectorCounts[sec]})` : sec === 'Todos' ? ` (${pops.length + atrs.length + its.length})` : ' (0)'}
              </button>
            ))}
          </div>
        </section>
        )}

        {/* Master-Detail Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Document list sidebar */}
          {!isFullScreen && (
            <aside className={`no-print ${selectedDocId ? 'hidden lg:flex' : 'flex'} lg:col-span-4 bg-white/70 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden h-[720px] flex flex-col backdrop-blur-xs`}>
            <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-200 dark:border-slate-850 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
                Documentos Encontrados ({allFilteredDocs.length})
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700">
              {allFilteredDocs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 dark:text-slate-600">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhum documento encontrado.</p>
                </div>
              ) : (
                allFilteredDocs.map(doc => {
                  const isSelected = selectedDocId === doc.id;
                  const isPop = doc.docType === 'pop';
                  const revStatus = getReviewStatus(doc);

                  return (
                    <motion.div
                      key={doc.id}
                      onClick={() => {
                        setSelectedDocId(doc.id);
                        setSelectedDocType(doc.docType);
                        setActiveTab('content');
                      }}
                      whileHover={{ scale: 1.005, x: 2 }}
                      whileTap={{ scale: 0.995 }}
                      className={`p-3.5 cursor-pointer transition-all flex items-start justify-between gap-3 group border-l-4 ${
                        isSelected
                          ? 'bg-sky-500/10 dark:bg-sky-500/10 border-l-sky-500'
                          : 'border-l-transparent hover:bg-slate-50/50 dark:hover:bg-sky-500/5'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border flex items-center gap-1 ${
                            doc.docType === 'pop'
                              ? 'bg-sky-500/10 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20'
                              : doc.docType === 'atr'
                              ? 'bg-indigo-500/10 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-450 border-indigo-500/20'
                              : 'bg-amber-500/10 dark:bg-amber-500/10 text-amber-700 dark:text-amber-450 border-amber-500/20'
                          }`}>
                            {doc.docType === 'pop' ? (
                              <Layers className="w-2.5 h-2.5 text-sky-500" />
                            ) : doc.docType === 'atr' ? (
                              <Briefcase className="w-2.5 h-2.5 text-indigo-500" />
                            ) : (
                              <FileText className="w-2.5 h-2.5 text-amber-500" />
                            )}
                            {doc.id}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            Rev {doc.revision}
                          </span>
                          <span className="text-3xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-450 px-1.5 py-0.5 rounded border border-slate-200/50 dark:border-slate-700/50">
                            {doc.sector === 'Juridico' ? 'Jurídico' : doc.sector}
                          </span>
                          {revStatus.isPending && (
                            <span 
                              className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-sm bg-rose-500/10 text-rose-650 dark:text-rose-400 border border-rose-500/25 flex items-center gap-0.5" 
                              title={`Pendente de revisão anual (venceu há ${revStatus.daysOverdue} dias)`}
                            >
                              <AlertCircle className="w-3 h-3 text-rose-500 shrink-0" />
                              <span className="hidden sm:inline">Pendente</span>
                            </span>
                          )}
                        </div>
                        <h4 className={`text-xs font-bold truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors ${
                          isSelected ? 'text-sky-700 dark:text-sky-400' : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {doc.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1.5 self-center">
                        {currentUser.role === 'admin' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(doc, doc.docType);
                              }}
                              className="p-1 text-slate-400 dark:text-slate-500 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-150 dark:hover:bg-slate-800 rounded transition-all cursor-pointer"
                              title="Editar documento"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDoc(doc.id, doc.docType);
                              }}
                              className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-slate-150 dark:hover:bg-slate-800 rounded transition-all cursor-pointer"
                              title="Excluir documento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </aside>
          )}

          {/* Document detailed sheet */}
          <section className={`${isFullScreen ? 'lg:col-span-12' : 'lg:col-span-8'} bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden print:border-none print:shadow-none print-container backdrop-blur-xs`}>
            <AnimatePresence mode="wait">
              {!activeDoc ? (
                <motion.div
                  key="dashboard"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 md:p-10 overflow-y-auto h-[720px] scrollbar-thin scrollbar-thumb-slate-700 flex flex-col justify-start"
                >
                {/* Hero / Banner section */}
                <div className="bg-gradient-to-br from-sky-500/10 via-indigo-500/5 to-transparent border border-sky-100 dark:border-slate-800 p-6 md:p-8 rounded-2xl mb-8 relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="relative z-10 flex-1 min-w-0">
                    <span className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
                      Portal Oficial de Documentos
                    </span>
                    <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mt-4 tracking-tight leading-tight uppercase font-display">
                      Controle de Documentos e Processos
                    </h2>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xl leading-relaxed">
                      Gerencie, visualize e exporte os Procedimentos Operacionais Padrão (POPs) e as Atribuições de Responsabilidade (ATRs) de propriedade da ACII.
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center justify-center relative z-10">
                    <div className="p-4 bg-sky-500/10 dark:bg-sky-500/20 rounded-2xl border border-sky-300/30 dark:border-sky-500/30">
                      <BookOpen className="w-12 h-12 md:w-16 md:h-16 text-sky-500 dark:text-sky-400 animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Abas de Acesso Rápido (POPs, ATRs, ITs) */}
                <div className="mb-8 bg-slate-50/50 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      Acesso Rápido por Tipo de Documento
                    </h3>
                    {userPermissions.canCreateDocs && (
                      <button
                        onClick={() => handleOpenCreateModal('it')}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Nova Instrução de Trabalho (IT)
                      </button>
                    )}
                  </div>

                  {/* Tabs headers */}
                  <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200/50 dark:border-slate-850 mb-4">
                    <button
                      onClick={() => setSelectedType('POP')}
                      className={`py-2 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        selectedType === 'POP'
                          ? 'bg-sky-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      POPs ({pops.length})
                    </button>
                    <button
                      onClick={() => setSelectedType('ATR')}
                      className={`py-2 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        selectedType === 'ATR'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                      }`}
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      ATRs ({atrs.length})
                    </button>
                    <button
                      onClick={() => setSelectedType('IT')}
                      className={`py-2 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        selectedType === 'IT'
                          ? 'bg-amber-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      ITs ({its.length})
                    </button>
                  </div>

                  {/* Preview list for active type — com um tipo específico
                      selecionado (POP/ATR/IT), mostra a lista completa
                      (rolável, o container já tem overflow-y-auto); o
                      limite de 4 é só pro modo "Todos", como amostra de
                      cada categoria. Antes o limite valia sempre, e a
                      única forma de ver o resto era navegando por setor. */}
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto pr-1 ${selectedType === 'Todos' ? 'max-h-60' : 'max-h-96'}`}>
                    {(selectedType === 'Todos' || selectedType === 'POP' ? pops : [])
                      .slice(0, selectedType === 'POP' ? undefined : 4)
                      .map(doc => (
                        <button
                          key={doc.id}
                          onClick={() => {
                            setSelectedDocId(doc.id);
                            setSelectedDocType('pop');
                          }}
                          className="p-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 hover:border-sky-500 rounded-xl text-left transition-all flex items-center justify-between gap-3 cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 bg-sky-500/10 text-sky-600 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold shrink-0">
                              POP
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 truncate font-display flex items-center gap-1.5">
                                <span className="truncate">{doc.id} - {doc.title}</span>
                                {getReviewStatus(doc).isPending && (
                                  <span className="text-[8px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1 py-0.2 rounded border border-rose-500/15 uppercase tracking-wider shrink-0">
                                    Pendente
                                  </span>
                                )}
                              </h4>
                              <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate">
                                {doc.sector}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-sky-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      ))}

                    {(selectedType === 'Todos' || selectedType === 'ATR' ? atrs : [])
                      .slice(0, selectedType === 'ATR' ? undefined : 4)
                      .map(doc => (
                        <button
                          key={doc.id}
                          onClick={() => {
                            setSelectedDocId(doc.id);
                            setSelectedDocType('atr');
                          }}
                          className="p-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 hover:border-indigo-500 rounded-xl text-left transition-all flex items-center justify-between gap-3 cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 bg-indigo-500/10 text-indigo-600 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold shrink-0">
                              ATR
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 truncate font-display flex items-center gap-1.5">
                                <span className="truncate">{doc.id} - {doc.title}</span>
                                {getReviewStatus(doc).isPending && (
                                  <span className="text-[8px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1 py-0.2 rounded border border-rose-500/15 uppercase tracking-wider shrink-0">
                                    Pendente
                                  </span>
                                )}
                              </h4>
                              <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate">
                                {doc.sector}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      ))}

                    {(selectedType === 'Todos' || selectedType === 'IT' ? its : [])
                      .map(doc => (
                        <button
                          key={doc.id}
                          onClick={() => {
                            setSelectedDocId(doc.id);
                            setSelectedDocType('it');
                          }}
                          className="p-3 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 hover:border-amber-500 rounded-xl text-left transition-all flex items-center justify-between gap-3 cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 bg-amber-500/10 text-amber-600 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold shrink-0">
                              IT
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 truncate font-display flex items-center gap-1.5">
                                <span className="truncate">{doc.id} - {doc.title}</span>
                                {getReviewStatus(doc).isPending && (
                                  <span className="text-[8px] font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1 py-0.2 rounded border border-rose-500/15 uppercase tracking-wider shrink-0">
                                    Pendente
                                  </span>
                                )}
                              </h4>
                              <p className="text-[9px] text-slate-400 dark:text-slate-500 truncate">
                                {doc.sector}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      ))}
                  </div>
                </div>

                {/* Grid of Sectors */}
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                    Navegação por Setor
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {sectors.map(sec => (
                      <button
                        key={sec.id}
                        onClick={() => handleSectorSelect(sec.name as any)}
                        className={`p-3 border rounded-xl text-center transition-all cursor-pointer group ${
                          sec.color || 'border-slate-500/20 hover:border-slate-500 bg-slate-500/5 hover:bg-slate-500/10 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <p className="text-[11px] font-extrabold truncate group-hover:scale-[1.02] transition-transform">
                          {sec.name === 'Autoridade de Registro' ? 'Aut. Registro' : sec.name === 'Juridico' ? 'Jurídico' : sec.name}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Highlight: Autoridade de Registro (AR) */}
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Destaque: Novos POPs de Autoridade de Registro (AR)
                    </h3>
                    <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase">
                      Novos
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {[
                      { id: 'POP-020', title: 'Processo de Venda de Certificados Digitais', desc: 'Passo a passo para identificação, validação e emissão de certificados A1 e A3.' },
                      { id: 'POP-021', title: 'Processo de Venda de Certificados Digitais II', desc: 'Fluxo complementar de controle operacional para venda de certificados.' },
                      { id: 'POP-022', title: 'Contratação de Segurança para a FECOIMP', desc: 'Diretrizes, orçamentos, seleção e coordenação operacional de segurança.' },
                      { id: 'POP-023', title: 'Controle de Entrada/Saída de Produtos', desc: 'Formulários, conferência e combate a sinistros ou perdas de produtos expositores.' },
                      { id: 'POP-024', title: 'Contratação e Coordenação de Limpeza', desc: 'Supervisão de escalas de limpeza, EPIS, vistorias e relatórios de execução.' }
                    ].map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => {
                          setSelectedDocId(doc.id);
                          setSelectedDocType('pop');
                        }}
                        className="p-3.5 bg-slate-50 hover:bg-sky-50 dark:bg-slate-950/40 dark:hover:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-900 rounded-xl text-left transition-all flex gap-3 cursor-pointer group"
                      >
                        <div className="w-8 h-8 bg-amber-500/10 group-hover:bg-sky-500/10 text-amber-500 group-hover:text-sky-500 rounded-lg flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:border-sky-500/20 transition-all font-mono text-[10px] font-black">
                          {doc.id.replace('POP-', '')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
                            {doc.title}
                          </h4>
                          <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5 line-clamp-2">
                            {doc.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Highlight: Gestão Financeira */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Destaque: Novos POPs de Gestão Financeira (Financeiro)
                    </h3>
                    <span className="text-[9px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full uppercase">
                      Finanças
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {[
                      { id: 'POP-028', title: 'Contas a Pagar e Conciliação', desc: 'Rotinas de lançamento, autorização, calendário de datas fixas, pagamentos e conciliação bancária.' },
                      { id: 'POP-029', title: 'Contas a Receber e Conciliação Bancária', desc: 'Identificação de receitas (SERASA, Medicor, etc.), remessas de arquivos CNAB e baixas.' },
                      { id: 'POP-030', title: 'Conferência do Caixa Semanal', desc: 'Auditoria de lançamentos, fluxos de caixa e tratamento de divergências pela gerência.' },
                      { id: 'POP-031', title: 'Faturamento de Produtos e Serviços', desc: 'Passo a passo do faturamento de SERASA, AC Celular, MEDICOR e FECOIMP.' }
                    ].map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => {
                          setSelectedDocId(doc.id);
                          setSelectedDocType('pop');
                        }}
                        className="p-3.5 bg-slate-50 hover:bg-sky-50 dark:bg-slate-950/40 dark:hover:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-900 rounded-xl text-left transition-all flex gap-3 cursor-pointer group"
                      >
                        <div className="w-8 h-8 bg-rose-500/10 group-hover:bg-sky-500/10 text-rose-500 group-hover:text-sky-500 rounded-lg flex items-center justify-center shrink-0 border border-rose-500/20 group-hover:border-sky-500/20 transition-all font-mono text-[10px] font-black">
                          {doc.id.replace('POP-', '')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
                            {doc.title}
                          </h4>
                          <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5 line-clamp-2">
                            {doc.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Highlight: Setor Jurídico / Compliance */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Destaque: Novos POPs de Jurídico & Compliance
                    </h3>
                    <span className="text-[9px] font-bold text-teal-500 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full uppercase">
                      Jurídico
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    {[
                      { id: 'POP-032', title: 'Análise de Contratos', desc: 'Objetivo, recebimento/triagem, agendamento, análise técnica detalhada (LGPD, compliance) e parecer.' },
                      { id: 'POP-033', title: 'Atendimento Parceiro SEBRAE', desc: 'Atendimento, abertura/baixa de MEI, consultas ao SERASA (Concentre/Crednet) e emissão de guias.' },
                      { id: 'POP-034', title: 'Elaboração de Contratos', desc: 'Elaboração de minutas de contratos seguindo padrões institucionais da ACII, salvaguardas e arquivamento.' }
                    ].map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => {
                          setSelectedDocId(doc.id);
                          setSelectedDocType('pop');
                        }}
                        className="p-3.5 bg-slate-50 hover:bg-sky-50 dark:bg-slate-950/40 dark:hover:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-900 rounded-xl text-left transition-all flex gap-3 cursor-pointer group"
                      >
                        <div className="w-8 h-8 bg-teal-500/10 group-hover:bg-sky-500/10 text-teal-600 group-hover:text-sky-500 rounded-lg flex items-center justify-center shrink-0 border border-teal-500/20 group-hover:border-sky-500/20 transition-all font-mono text-[10px] font-black">
                          {doc.id.replace('POP-', '')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
                            {doc.title}
                          </h4>
                          <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5 line-clamp-2">
                            {doc.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Highlight: Tecnologia da Informação (TI) */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Destaque: Novos POPs de TI (Tecnologia da Informação)
                    </h3>
                    <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
                      TI
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {[
                      { id: 'POP-035', title: 'Help Desk: Suporte Técnico', desc: 'Registro, classificação, atendimento técnico remoto/presencial e encerramento de chamados.' },
                      { id: 'POP-036', title: 'Backup de Dados', desc: 'Sincronização com o Google Drive das máquinas locais e rotinas de backup do servidor proxy mox.' },
                      { id: 'POP-040', title: 'Gestão de Segurança e Proteção de Dados', desc: 'Controle de acessos, política de senhas robustas, segurança de rede firewall e conformidade LGPD.' },
                      { id: 'POP-041', title: 'Manutenção dos Sites da ACII', desc: 'Rotina de levantamento de demandas web, execução, homologação da gerência e deploy final.' }
                    ].map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => {
                          setSelectedDocId(doc.id);
                          setSelectedDocType('pop');
                        }}
                        className="p-3.5 bg-slate-50 hover:bg-emerald-50 dark:bg-slate-950/40 dark:hover:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-900 rounded-xl text-left transition-all flex gap-3 cursor-pointer group"
                      >
                        <div className="w-8 h-8 bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-600 group-hover:text-emerald-500 rounded-lg flex items-center justify-center shrink-0 border border-emerald-500/20 group-hover:border-emerald-500/30 transition-all font-mono text-[10px] font-black">
                          {doc.id.replace('POP-', '')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-450 transition-colors truncate font-display">
                            {doc.title}
                          </h4>
                          <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-0.5 line-clamp-2">
                            {doc.desc}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={activeDoc.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full"
              >
                
                {/* Visualizer Header Actions */}
                <div className="no-print bg-slate-50/40 dark:bg-slate-900/60 px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4 backdrop-blur-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setSelectedDocId('');
                        setSelectedSector('Todos');
                      }}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/80 flex items-center gap-1.5 mr-2"
                      title="Voltar ao início"
                    >
                      <Home className="w-3.5 h-3.5 text-sky-500" />
                      <span>Voltar</span>
                    </button>
                    <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mr-2 self-center"></div>

                    <button
                      onClick={() => setActiveTab('content')}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        activeTab === 'content'
                          ? 'bg-sky-600 dark:bg-sky-600 text-white shadow-[0_0_12px_rgba(14,165,233,0.35)]'
                          : 'text-slate-600 dark:text-slate-450 hover:bg-slate-150 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      Conteúdo Escrito
                    </button>
                    {selectedDocType === 'pop' && (
                      <button
                        onClick={() => setActiveTab('flowchart')}
                        className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                          activeTab === 'flowchart'
                            ? 'bg-sky-600 dark:bg-sky-600 text-white shadow-[0_0_12px_rgba(14,165,233,0.35)]'
                            : 'text-slate-600 dark:text-slate-450 hover:bg-slate-150 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Ver Fluxograma</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsReadingMode(!isReadingMode)}
                      className={`flex items-center gap-1.5 font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all cursor-pointer border shadow-3xs ${
                        isReadingMode
                          ? 'bg-sky-600 hover:bg-sky-500 text-white border-sky-700 shadow-[0_0_10px_rgba(14,165,233,0.3)]'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/80'
                      }`}
                      title={isReadingMode ? "Desativar Modo de Leitura (Voltar ao padrão)" : "Ativar Modo de Leitura (Fonte maior, coluna mais estreita)"}
                    >
                      <Glasses className={`w-4 h-4 ${isReadingMode ? 'text-white' : 'text-sky-500'}`} />
                      <span>{isReadingMode ? 'Leitura Ativa' : 'Modo Leitura'}</span>
                    </button>

                    <button
                      onClick={() => setIsFullScreen(!isFullScreen)}
                      className={`flex items-center gap-1.5 font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all cursor-pointer border shadow-3xs ${
                        isFullScreen
                          ? 'bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-500 text-white border-amber-650'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/80'
                      }`}
                      title={isFullScreen ? "Sair de Tela Cheia" : "Ver em Tela Cheia"}
                    >
                      {isFullScreen ? (
                        <>
                          <Minimize2 className="w-4 h-4 text-white" />
                          <span>Minimizar</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-4 h-4 text-sky-500" />
                          <span>Tela Cheia</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/80 font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-3xs"
                      title="Abrir a caixa de diálogo de impressão do navegador"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Imprimir</span>
                    </button>
                    <button
                      onClick={async () => {
                        if (!activeDoc) return;
                        setIsExportingPdf(true);
                        try {
                          const docTypeTitle = selectedDocType === 'pop' ? 'POP' : selectedDocType === 'atr' ? 'ATR' : 'IT';
                          const cleanTitle = activeDoc.title.replace(/[^a-zA-Z0-9_-]/g, '_');
                          await exportElementToPdf({
                            elementId: 'document-printable-area',
                            fileName: `${docTypeTitle}_${activeDoc.id}_${cleanTitle}.pdf`,
                            documentTitle: `${docTypeTitle} ${activeDoc.id} - ${activeDoc.title}`,
                            onProgress: (msg) => setPdfExportProgress(msg)
                          });
                        } catch (err) {
                          console.error('Erro ao gerar PDF do documento:', err);
                          alert('Ocorreu um erro ao gerar o arquivo PDF. Por favor, tente novamente.');
                        } finally {
                          setIsExportingPdf(false);
                          setPdfExportProgress('');
                        }
                      }}
                      disabled={isExportingPdf}
                      className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 disabled:bg-sky-400 text-white border border-sky-700 font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-3xs"
                      title="Baixar arquivo PDF gerado diretamente no dispositivo"
                    >
                      {isExportingPdf ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{pdfExportProgress || 'Gerando PDF...'}</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Baixar PDF</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setPreselectedDocId(activeDoc.id);
                        setPreselectedDocType(selectedDocType as any);
                        setCurrentView('workspace');
                        setSelectedDocId('');
                        setIsFullScreen(false);
                      }}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-700 font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                      title="Exportar este documento para o Google Docs ou enviar e-mail por Gmail"
                    >
                      <Cloud className="w-4 h-4" />
                      <span>Exportar Workspace</span>
                    </button>
                    {currentUser.role === 'admin' && (
                      <button
                        onClick={() => handleStartEdit(activeDoc, selectedDocType)}
                        className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/80 font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-3xs"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Editar</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Printable Document Area */}
                <div id="document-printable-area" className="p-8 md:p-10 overflow-y-auto flex-1 text-slate-800 dark:text-slate-200 print:p-0 scrollbar-thin scrollbar-thumb-slate-700 bg-white dark:bg-slate-900">
                  
                  {/* Alert Banner for review status */}
                  {activeDocReviewStatus && (
                    <div className="no-print mb-6">
                      {activeDocReviewStatus.isPending ? (
                        <div className="p-4 bg-rose-500/10 dark:bg-rose-500/10 border-l-4 border-rose-500 rounded-r-xl flex items-start gap-3 shadow-xs">
                          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
                          <div>
                            <h4 className="text-xs sm:text-sm font-black text-rose-800 dark:text-rose-400">⚠️ ATENÇÃO: REVISÃO ANUAL PENDENTE</h4>
                            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                              Este documento foi revisado/emitido pela última vez em <strong className="font-bold text-slate-900 dark:text-white">{activeDocReviewStatus.lastReviewDateStr}</strong> ({activeDocReviewStatus.daysSinceLastReview} dias atrás) e excedeu o prazo de recomendação de revisão anual de 365 dias (vencido há {activeDocReviewStatus.daysOverdue} dias).
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-emerald-550/10 dark:bg-emerald-500/10 border-l-4 border-emerald-500 rounded-r-xl flex items-start gap-3 shadow-xs">
                          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-xs sm:text-sm font-black text-emerald-800 dark:text-emerald-450">✓ STATUS: REGULAR</h4>
                            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                              Este documento está com a vigência em dia. Última revisão/emissão em <strong className="font-bold text-slate-900 dark:text-white">{activeDocReviewStatus.lastReviewDateStr}</strong> ({activeDocReviewStatus.daysSinceLastReview} dias atrás). Restam {365 - activeDocReviewStatus.daysSinceLastReview} dias para a próxima revisão recomendada.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Official Header Table Block */}
                  <div className="border-2 border-slate-300 dark:border-slate-800 mb-8 rounded-xl overflow-hidden avoid-break shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-300 dark:divide-slate-800 bg-slate-50/25 dark:bg-slate-900/20">
                      
                      {/* Logo and Brand */}
                      <div className="p-4 flex justify-center items-center md:col-span-1 min-h-[90px] bg-slate-50/50 dark:bg-slate-950/20">
                        <ACIILogo className="w-44 h-auto" />
                      </div>

                      {/* Header Text / Metadata fields */}
                      <div className="p-4 md:col-span-2 flex flex-col justify-center">
                        <div className="text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-bold">Procedimento Operacional</div>
                        <h2 className="text-sm md:text-base font-black text-slate-950 dark:text-white mt-1 leading-snug">
                          {selectedDocType === 'pop' 
                            ? 'PROCEDIMENTO OPERACIONAL PADRÃO' 
                            : selectedDocType === 'atr'
                            ? 'ATRIBUIÇÕES OPERACIONAIS'
                            : 'INSTRUÇÃO DE TRABALHO'}
                        </h2>
                        <div className="text-xs font-bold text-sky-600 dark:text-sky-400 mt-1">
                          {selectedDocType === 'pop' 
                            ? `PROCESSO: ${(activeDoc as POP).process}` 
                            : selectedDocType === 'atr'
                            ? `FUNÇÃO: ${(activeDoc as ATR).title}`
                            : `SETOR: ${(activeDoc as IT).sector}`}
                        </div>
                      </div>

                      {/* Code / Identification */}
                      <div className="p-4 md:col-span-1 flex flex-col justify-between text-xs space-y-1 bg-slate-50/35 dark:bg-slate-950/10">
                        <div>
                          <span className="font-semibold text-slate-500 dark:text-slate-450">Código: </span>
                          <strong className="text-sky-600 dark:text-sky-450 font-mono text-sm">{activeDoc.id}</strong>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-500 dark:text-slate-450">Emissão: </span>
                          <span className="text-slate-900 dark:text-slate-300 font-mono">{activeDoc.emissionDate}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-slate-500 dark:text-slate-450">Revisão: </span>
                          <span className="text-slate-900 dark:text-slate-305 font-mono">{activeDoc.revision}</span>
                        </div>
                        {activeDoc.revisionDate && (
                          <div>
                            <span className="font-semibold text-slate-500 dark:text-slate-455">Data Rev.: </span>
                            <span className="text-slate-900 dark:text-slate-305 font-mono">{activeDoc.revisionDate}</span>
                          </div>
                        )}
                        <div>
                          <span className="font-semibold text-slate-500 dark:text-slate-450">Página: </span>
                          <span className="text-slate-900 dark:text-slate-300 font-mono">
                            {selectedDocType === 'pop' ? (activeDoc as POP).pages : '1 de 1'}
                          </span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Flowchart Visual View Tab */}
                  {activeTab === 'flowchart' && selectedDocType === 'pop' ? (
                    <FlowchartView pop={activeDoc as POP} />
                  ) : (
                    
                    /* Written Document Content Tab */
                    <div className={`${isReadingMode ? 'max-w-2xl mx-auto space-y-12 py-6' : 'space-y-8'} animate-fade-in print:text-black transition-all duration-300`}>
                      
                      {/* Title block */}
                      <div>
                        <h1 className={`${isReadingMode ? 'text-2xl md:text-3xl' : 'text-xl md:text-2xl'} font-black text-slate-950 dark:text-white mb-2 leading-tight tracking-tight transition-all duration-300`}>
                          {activeDoc.id} – {activeDoc.title}
                        </h1>
                        <div className="h-1 w-20 bg-sky-500 rounded-sm"></div>
                      </div>

                      {/* POP content specific fields */}
                      {selectedDocType === 'pop' ? (
                        <>
                          {/* Section 1: Objective */}
                          <div className="space-y-2">
                            <h3 className={readingHeadingClass}>
                              <span className="w-1.5 h-1.5 bg-sky-500 rounded-full"></span>
                              1. Objetivo
                            </h3>
                            <p className={readingTextClass}>
                              {(activeDoc as POP).objective}
                            </p>
                          </div>

                          {/* Section 2: Application Field */}
                          <div className="space-y-2">
                            <h3 className={readingHeadingClass}>
                              <span className="w-1.5 h-1.5 bg-sky-50 rounded-full"></span>
                              2. Campo de Aplicação
                            </h3>
                            <p className={readingTextClass}>
                              Aplica-se à {(activeDoc as POP).applicationField.join(', ')}.
                            </p>
                          </div>

                          {/* Section 3: Responsibilities */}
                          <div className="space-y-3">
                            <h3 className={readingHeadingClass}>
                              <span className="w-1.5 h-1.5 bg-sky-50 rounded-full"></span>
                              3. Responsáveis
                            </h3>
                            <div className={`${isReadingMode ? 'pl-5 space-y-3' : 'pl-3.5 space-y-2'} text-sm`}>
                              <div className={isReadingMode ? 'p-5 bg-slate-50/80 dark:bg-slate-950/20 rounded-xl border-2 border-slate-250 dark:border-slate-800/80 max-w-2xl' : 'p-3 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-slate-100 dark:border-slate-800/80 max-w-xl'}>
                                <strong className={isReadingMode ? 'text-base text-slate-800 dark:text-slate-200' : 'text-slate-800 dark:text-slate-200'}>Responsável Primário: </strong>
                                <span className={isReadingMode ? 'text-base text-sky-600 dark:text-sky-400 font-extrabold' : 'text-sky-600 dark:text-sky-400 font-bold'}>{(activeDoc as POP).responsiblePrimary}</span>
                              </div>
                              <div className={isReadingMode ? 'p-5 bg-slate-50/80 dark:bg-slate-950/20 rounded-xl border-2 border-slate-250 dark:border-slate-800/80 max-w-2xl' : 'p-3 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-slate-100 dark:border-slate-800/80 max-w-xl'}>
                                <strong className={isReadingMode ? 'text-base text-slate-800 dark:text-slate-200' : 'text-slate-800 dark:text-slate-200'}>Apoio / Colaboração: </strong>
                                <span className={isReadingMode ? 'text-base text-slate-650 dark:text-slate-300 leading-relaxed' : 'text-slate-655 dark:text-slate-300'}>{(activeDoc as POP).responsibleSupport.join(', ')}</span>
                              </div>
                            </div>
                          </div>

                          {/* Section 4: Inputs (Entradas) */}
                          <div className="space-y-2">
                            <h3 className={readingHeadingClass}>
                              <span className="w-1.5 h-1.5 bg-sky-50 rounded-full"></span>
                              4. Entradas (Insumos)
                            </h3>
                            <ul className={readingListClass}>
                              {(activeDoc as POP).inputs.map((input, idx) => (
                                <li key={idx} className="marker:text-sky-500">{input}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Section 5: Description of Procedure (Passos) */}
                          <div className="space-y-6">
                            <h3 className={readingHeadingClass}>
                              <span className="w-1.5 h-1.5 bg-sky-50 rounded-full"></span>
                              5. Descrição do Procedimento
                            </h3>
                            
                            <div className={isReadingMode ? 'space-y-6 pl-5' : 'space-y-5 pl-3.5'}>
                              {(activeDoc as POP).steps.map((step, idx) => (
                                <div key={idx} className={readingCardClass}>
                                  <div className={`absolute left-0 top-0 bottom-0 ${isReadingMode ? 'w-1.5' : 'w-1'} bg-sky-550 dark:bg-sky-500`}></div>
                                  <h4 className={readingCardTitleClass}>
                                    {step.title}
                                  </h4>
                                  <p className={readingCardDescClass}>
                                    {step.description}
                                  </p>
                                  {step.substeps && (
                                    <ul className={readingSubstepListClass}>
                                      {step.substeps.map((sub, sIdx) => (
                                        <li key={sIdx} className={readingSubstepItemClass}>
                                          <span className="text-sky-500 dark:text-sky-400 font-bold min-w-[14px]">✓</span>
                                          <span>{sub}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Section 6: Outputs (Saídas) */}
                          <div className="space-y-2">
                            <h3 className={readingHeadingClass}>
                              <span className="w-1.5 h-1.5 bg-sky-50 rounded-full"></span>
                              6. Saídas
                            </h3>
                            <ul className={readingListClass}>
                              {(activeDoc as POP).outputs.map((out, idx) => (
                                <li key={idx} className="marker:text-sky-500">{out}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Section 7: Performance Indicators */}
                          <div className="space-y-2">
                            <h3 className={readingHeadingClass}>
                              <span className="w-1.5 h-1.5 bg-sky-50 rounded-full"></span>
                              7. Indicadores de Desempenho
                            </h3>
                            <ul className={readingListClass}>
                              {(activeDoc as POP).performanceIndicators.map((ind, idx) => (
                                <li key={idx} className="marker:text-sky-500">{ind}</li>
                              ))}
                            </ul>
                          </div>
                        </>
                      ) : selectedDocType === 'atr' ? (
                        
                        /* ATR content specific fields */
                        <>
                          {/* Leaders */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-1">
                            <div className={readingDirectLeaderCardClass}>
                              <span className={readingDirectLeaderLabelClass}>Líder Direto</span>
                              <strong className={readingDirectLeaderValueClass}>
                                <User className={isReadingMode ? 'w-5 h-5 text-sky-500' : 'w-4 h-4 text-sky-500'} />
                                {(activeDoc as ATR).directLeader}
                              </strong>
                            </div>
                            {(activeDoc as ATR).indirectLeader && (
                              <div className={readingDirectLeaderCardClass}>
                                <span className={readingDirectLeaderLabelClass}>Líder Indireto</span>
                                <strong className={readingDirectLeaderValueClass}>
                                  <User className={isReadingMode ? 'w-5 h-5 text-indigo-550' : 'w-4 h-4 text-indigo-500'} />
                                  {(activeDoc as ATR).indirectLeader}
                                </strong>
                              </div>
                            )}
                          </div>

                          {/* Summary Descriptions */}
                          <div className="space-y-2">
                            <h3 className={readingHeadingClass}>
                              <span className="w-1.5 h-1.5 bg-sky-500 rounded-full"></span>
                              Descrição Sumária
                            </h3>
                            <p className={readingTextClass}>
                              {(activeDoc as ATR).summary}
                            </p>
                          </div>

                          {/* Tasks details */}
                          <div className="space-y-4">
                            <h3 className={readingHeadingClass}>
                              <span className="w-1.5 h-1.5 bg-sky-500 rounded-full"></span>
                              Tarefas Detalhadas
                            </h3>
                            <div className={isReadingMode ? 'pl-5 space-y-4' : 'pl-3.5 space-y-3'}>
                              {(activeDoc as ATR).detailedTasks.map((task, idx) => (
                                <div key={idx} className={readingDetailedTaskItemClass}>
                                  <span className={readingDetailedTaskNumberClass}>
                                    {idx + 1}
                                  </span>
                                  <span className="leading-relaxed mt-0.5">{task}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Requirements and Competencies */}
                          <div className="space-y-4 pt-4 border-t border-slate-200/80 dark:border-slate-800/80">
                            <h3 className={readingHeadingClass}>
                              <span className="w-1.5 h-1.5 bg-sky-500 rounded-full"></span>
                              Requisitos de Competência
                            </h3>

                            <div className={`${isReadingMode ? 'space-y-6 pl-5' : 'space-y-4 pl-3.5'} text-sm`}>
                              {/* Education */}
                              <div className={readingRequirementBoxClass}>
                                <strong className={isReadingMode ? 'text-base text-slate-850 dark:text-slate-100 block mb-1' : 'text-slate-850 dark:text-slate-200'}>Educação Exigida: </strong>
                                <span className={readingRequirementValueClass}>{(activeDoc as ATR).requirements.education}</span>
                              </div>

                              {/* Experience */}
                              <div className={readingRequirementBoxClass}>
                                <strong className={isReadingMode ? 'text-base text-slate-850 dark:text-slate-100 block mb-1' : 'text-slate-850 dark:text-slate-200'}>Experiência Necessária: </strong>
                                <span className={readingRequirementValueClass}>{(activeDoc as ATR).requirements.experience}</span>
                              </div>

                              {/* Technical Competencies */}
                              <div className="space-y-2">
                                <strong className={readingSkillsLabelClass}>Competências Técnicas:</strong>
                                <ul className={readingListClass}>
                                  {(activeDoc as ATR).requirements.technicalCompetencies.map((comp, idx) => (
                                    <li key={idx} className="marker:text-sky-500">{comp}</li>
                                  ))}
                                </ul>
                              </div>

                              {/* Skills */}
                              <div className="space-y-2">
                                <strong className={readingSkillsLabelClass}>Habilidades:</strong>
                                <div className={`flex flex-wrap ${isReadingMode ? 'gap-2.5 pl-3' : 'gap-1.5 pl-2'}`}>
                                  {(activeDoc as ATR).requirements.skills.map((skill, idx) => (
                                    <span key={idx} className={readingSkillsTagClass}>
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Attitudes */}
                              <div className="space-y-2">
                                <span className={isReadingMode ? 'text-sm font-extrabold text-slate-900 dark:text-white block uppercase tracking-widest mt-6 mb-2' : 'text-sm font-bold text-slate-950 dark:text-white block uppercase text-[10px] tracking-widest mt-4'}>Atitudes Desejáveis:</span>
                                <div className={`flex flex-wrap ${isReadingMode ? 'gap-2.5 pl-3' : 'gap-1.5 pl-2'}`}>
                                  {(activeDoc as ATR).requirements.attitudes.map((att, idx) => (
                                    <span key={idx} className={readingAttitudesTagClass}>
                                      {att}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        /* IT content specific fields */
                        <>
                          {/* Objective */}
                          <div className="space-y-2">
                            <h3 className={readingHeadingClass.replace('sky-550', 'amber-550').replace('sky-500', 'amber-500').replace('sky-400', 'amber-400')}>
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                              1. Objetivo da Instrução de Trabalho
                            </h3>
                            <p className={`${readingTextClass} italic`}>
                              {(activeDoc as IT).objective}
                            </p>
                          </div>

                          {/* Responsible */}
                          <div className="space-y-2 pt-2">
                            <h3 className={readingHeadingClass.replace('sky-550', 'amber-550').replace('sky-500', 'amber-500').replace('sky-400', 'amber-400')}>
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                              2. Responsável pela Execução
                            </h3>
                            <div className="pl-3.5 flex items-center gap-2">
                              <div className={isReadingMode ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm md:text-base px-4 py-2.5 rounded-xl border-2 border-amber-500/25 font-bold flex items-center gap-2.5 transition-all duration-300' : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs px-3 py-1.5 rounded-lg border border-amber-500/20 font-medium flex items-center gap-2'}>
                                <User className={isReadingMode ? 'w-5 h-5 text-amber-500' : 'w-4 h-4 text-amber-500'} />
                                {(activeDoc as IT).responsible}
                              </div>
                            </div>
                          </div>

                          {/* Sequential Steps */}
                          <div className="space-y-4 pt-2">
                            <h3 className={readingHeadingClass.replace('sky-550', 'amber-550').replace('sky-500', 'amber-500').replace('sky-400', 'amber-400')}>
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                              3. Passos para Execução da Tarefa
                            </h3>
                            <div className={isReadingMode ? 'pl-5 space-y-5' : 'pl-3.5 space-y-3'}>
                              {(activeDoc as IT).steps.map((step, idx) => (
                                <div key={idx} className={isReadingMode ? 'flex items-start gap-4 text-base md:text-lg text-slate-800 dark:text-slate-100 leading-loose transition-all duration-300' : 'flex items-start gap-3 text-sm text-slate-650 dark:text-slate-300 transition-all duration-300'}>
                                  <span className={isReadingMode ? 'font-mono text-sm font-black text-amber-600 dark:text-amber-450 bg-amber-500/10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 border border-amber-500/25 mt-1 transition-all duration-300' : 'font-mono text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 border border-amber-500/20'}>
                                    {idx + 1}
                                  </span>
                                  <span className="leading-relaxed mt-0.5">{step}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Related Employees Section */}
                      {(() => {
                        const associatedEmployees = employees.filter(emp => 
                          selectedDocType === 'pop' 
                            ? emp.associatedPOPs?.includes(activeDoc.id) 
                            : selectedDocType === 'atr'
                            ? emp.associatedATRs?.includes(activeDoc.id)
                            : emp.sector === activeDoc.sector
                        );
                        
                        return (
                          <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800/80 no-print">
                            <h3 className="text-xs md:text-sm font-bold text-slate-950 dark:text-sky-400 uppercase tracking-wider pb-3 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>
                              Colaboradores Associados a este Documento ({associatedEmployees.length})
                            </h3>
                            
                            {associatedEmployees.length === 0 ? (
                              <p className="text-xs text-slate-400 dark:text-slate-500 italic pl-3.5">
                                Nenhum colaborador está atualmente vinculado a este documento na base de funcionários.
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pl-3.5">
                                {associatedEmployees.map(emp => (
                                  <div 
                                    key={emp.id}
                                    onClick={() => {
                                      setCurrentView('employees');
                                    }}
                                    className="p-3 bg-slate-50/60 hover:bg-indigo-500/5 border border-slate-200/50 dark:border-slate-800 hover:border-indigo-500/20 rounded-xl transition-all cursor-pointer flex items-center gap-2.5 group"
                                  >
                                    <div className="w-7 h-7 bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center rounded-lg shadow-sm shrink-0 uppercase">
                                      {emp.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {emp.name}
                                      </p>
                                      <p className="text-[10px] text-slate-400 truncate">{emp.role}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })()}

                      {/* Histórico de Revisões / Controle de Alterações */}
                      {(() => {
                        const history: RevisionHistoryEntry[] = activeDoc.revisionHistory || [
                          {
                            revision: activeDoc.revision || '00',
                            date: activeDoc.revisionDate || activeDoc.emissionDate || '01/03/2025',
                            description: 'Emissão Inicial',
                            author: 'Sistema'
                          }
                        ];

                        return (
                          <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800/80 page-break-inside-avoid">
                            <h3 className="text-xs md:text-sm font-bold text-slate-950 dark:text-amber-400 uppercase tracking-wider pb-3 flex items-center gap-2 font-display">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                              Histórico de Revisões (Controle de Alterações)
                            </h3>
                            
                            <div className="pl-3.5 overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
                                    <th className="py-2.5 px-3 font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-16">Rev.</th>
                                    <th className="py-2.5 px-3 font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-28">Data</th>
                                    <th className="py-2.5 px-3 font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Descrição das Alterações</th>
                                    <th className="py-2.5 px-3 font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-36 font-sans">Responsável</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                                  {history.map((rev, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/30 dark:hover:bg-slate-950/10">
                                      <td className="py-2 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                                        {rev.revision}
                                      </td>
                                      <td className="py-2 px-3 text-slate-500 dark:text-slate-400 font-mono">
                                        {rev.date}
                                      </td>
                                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300 font-medium">
                                        {rev.description}
                                      </td>
                                      <td className="py-2 px-3 text-slate-500 dark:text-slate-400 font-medium truncate max-w-xs">
                                        {rev.author}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Aprovação e Vigência */}
                      <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800 avoid-break page-break-inside-avoid">
                        <h3 className="text-xs md:text-sm font-bold text-slate-950 dark:text-emerald-400 uppercase tracking-wider pb-3 flex items-center gap-2 font-display">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                          Aprovação e Vigência (Controle Interno)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 text-xs">
                          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between h-28 bg-slate-50/20 dark:bg-slate-950/10">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Elaborado por</span>
                            <div className="border-t border-slate-200 dark:border-slate-800 pt-2 font-bold text-slate-800 dark:text-slate-200">
                              {currentUserEmployee ? currentUserEmployee.name : currentUser.name}
                              <span className="text-[9px] block text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                                {currentUserEmployee ? currentUserEmployee.role : currentUser.role === 'admin' ? 'Administrador Geral' : 'Colaborador Técnico'}
                              </span>
                            </div>
                          </div>
                          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between h-28 bg-slate-50/20 dark:bg-slate-950/10">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Revisado por</span>
                            <div className="border-t border-slate-200 dark:border-slate-800 pt-2 font-bold text-slate-800 dark:text-slate-200">
                              Gerência Executiva ACII
                              <span className="text-[9px] block text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                                Gestão de Processos e Qualidade
                              </span>
                            </div>
                          </div>
                          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between h-28 bg-slate-50/20 dark:bg-slate-950/10">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Aprovado por</span>
                            <div className="border-t border-slate-200 dark:border-slate-800 pt-2 font-bold text-slate-800 dark:text-slate-200">
                              Diretoria Executiva ACII
                              <span className="text-[9px] block text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                                Vigência desde: {activeDoc.emissionDate}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* PDF Print Page footer notes */}
                      <div className="pt-8 border-t border-slate-150 dark:border-slate-800 flex justify-between text-[10px] text-slate-400 font-mono">
                        <span>ACII - Associação Comercial, Industrial e Serviços de Imperatriz</span>
                        <span>Aprovado por: Gerência Executiva ACII</span>
                      </div>

                    </div>
                  )}

                </div>

              </motion.div>
            )}
            </AnimatePresence>

          </section>

        </div>
        </>
        )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* Creation and Editing Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3 }}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
            >
              
              {/* Modal Header */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-850 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                    {editingId ? `Editar ${formId}` : `Criar Novo Documento: ${formDocType.toUpperCase()}`}
                  </h3>
                  <p className="text-3xs text-slate-400">Preencha os campos abaixo para salvar na base local de documentos da ACII</p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body Form */}
              <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
                
                {/* Visual Type Selector for New Documents */}
                {editingId === null && (
                  <div className="space-y-2.5">
                    <label className="block text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tipo de Documento</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      {/* POP option card */}
                      <div 
                        onClick={() => {
                          setFormDocType('pop');
                          const nextIdNum = Math.max(...pops.map(p => parseInt(p.id.split('-')[1]) || 0), 0) + 1;
                          setFormId(`POP-${String(nextIdNum).padStart(3, '0')}`);
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                          formDocType === 'pop'
                            ? 'bg-sky-500/10 border-sky-500 dark:border-sky-500 shadow-md ring-1 ring-sky-500/30'
                            : 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${formDocType === 'pop' ? 'bg-sky-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight font-display">Procedimento (POP)</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                            Descreve o fluxo operacional, etapas sequenciais de processos e indicadores de desempenho.
                          </p>
                        </div>
                      </div>
                      
                      {/* ATR option card */}
                      <div 
                        onClick={() => {
                          setFormDocType('atr');
                          const nextIdNum = Math.max(...atrs.map(a => parseInt(a.id.split('-')[1]) || 0), 0) + 1;
                          setFormId(`Atr-${String(nextIdNum).padStart(3, '0')}`);
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                          formDocType === 'atr'
                            ? 'bg-indigo-500/10 border-indigo-500 dark:border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
                            : 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${formDocType === 'atr' ? 'bg-indigo-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                          <Briefcase className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight font-display">Atribuição (ATR)</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                            Descreve as tarefas de um cargo, liderança direta/indireta, formação e competências técnicas ou atitudinais.
                          </p>
                        </div>
                      </div>

                      {/* IT option card */}
                      <div 
                        onClick={() => {
                          setFormDocType('it');
                          const nextIdNum = Math.max(...its.map(i => parseInt(i.id.split('-')[1]) || 0), 0) + 1;
                          setFormId(`IT-${String(nextIdNum).padStart(3, '0')}`);
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                          formDocType === 'it'
                            ? 'bg-amber-500/10 border-amber-500 dark:border-amber-500 shadow-md ring-1 ring-amber-500/30'
                            : 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${formDocType === 'it' ? 'bg-amber-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight font-display">Instrução de Trabalho (IT)</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                            Instruções simplificadas passo a passo de como fazer uma determinada tarefa de menor complexidade.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                 {/* ID & Title */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Código (ID)</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: POP-008 ou Atr-021"
                      value={formId}
                      onChange={e => setFormId(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Título do Documento</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Gestão de Suprimentos ou Auxiliar de Logística"
                      value={formTitle}
                      onChange={e => setFormTitle(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Sector, Date, Revision */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Setor Responsável</label>
                    <select
                      value={formSector}
                      onChange={e => setFormSector(e.target.value as Sector)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-850 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      {sectors.map(sec => (
                        <option key={sec.id} value={sec.name}>
                          {sec.name === 'Juridico' ? 'Jurídico' : sec.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Data de Emissão</label>
                    <input
                      type="text"
                      value={formEmissionDate}
                      onChange={e => setFormEmissionDate(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Revisão</label>
                    <input
                      type="text"
                      value={formRevision}
                      onChange={e => setFormRevision(e.target.value)}
                      disabled={editingId !== null && keepRevisionOnEdit}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {editingId !== null && currentUser?.role === 'admin' && (
                      <label className="flex items-start gap-2 mt-2 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={keepRevisionOnEdit}
                          onChange={e => setKeepRevisionOnEdit(e.target.checked)}
                          className="mt-0.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                          Manter revisão atual (não avançar para a próxima, mesmo alterando o conteúdo)
                        </span>
                      </label>
                    )}
                  </div>
                  {formDocType === 'pop' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Nome do Processo</label>
                      <input
                        type="text"
                        placeholder="Ex: ADMINISTRATIVO"
                        value={formProcess}
                        onChange={e => setFormSectorProcess(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* ==================== CASO SEJA ATR ==================== */}
                {formDocType === 'atr' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Líder Direto</label>
                        <input
                          type="text"
                          value={formDirectLeader}
                          onChange={e => setFormDirectLeader(e.target.value)}
                          placeholder="Ex: Gerente Executiva"
                          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-250 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Líder Indireto (Opcional)</label>
                        <input
                          type="text"
                          value={formIndirectLeader}
                          onChange={e => setFormIndirectLeader(e.target.value)}
                          placeholder="Ex: Presidente ACII"
                          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-250 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Descrição Sumária</label>
                      <textarea
                        rows={3}
                        value={formSummary}
                        onChange={e => setFormSummary(e.target.value)}
                        placeholder="Breve resumo da função..."
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-250 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Tarefas Detalhadas (Uma por linha)</label>
                      <textarea
                        rows={4}
                        value={formTasks}
                        onChange={e => setFormTasks(e.target.value)}
                        placeholder="Verificar e-mails diariamente&#10;Gerenciar cadastro de associados..."
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono text-xs text-slate-800 dark:text-slate-250 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Educação Exigida</label>
                        <input
                          type="text"
                          value={formEducation}
                          onChange={e => setFormEducation(e.target.value)}
                          placeholder="Ex: Ensino médio completo ou superior em..."
                          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-250 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Experiência Mínima</label>
                        <input
                          type="text"
                          value={formExperience}
                          onChange={e => setFormExperience(e.target.value)}
                          placeholder="Ex: 2 a 4 anos."
                          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-250 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Competências Técnicas (Uma por linha)</label>
                      <textarea
                        rows={3}
                        value={formTechnicalComp}
                        onChange={e => setFormTechnicalComp(e.target.value)}
                        placeholder="Domínio de ferramentas do Google Workspace&#10;Noções de legislação..."
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono text-xs text-slate-800 dark:text-slate-250 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Habilidades (Separadas por vírgula)</label>
                        <input
                          type="text"
                          value={formSkills}
                          onChange={e => setFormSkills(e.target.value)}
                          placeholder="Organização, Comunicação, Liderança"
                          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-250 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Atitudes (Separadas por vírgula)</label>
                        <input
                          type="text"
                          value={formAttitudes}
                          onChange={e => setFormAttitudes(e.target.value)}
                          placeholder="Proatividade, Comprometimento, Ética"
                          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-250 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ==================== CASO SEJA IT ==================== */}
                {formDocType === 'it' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Objetivo da Instrução de Trabalho</label>
                      <textarea
                        rows={3}
                        required
                        value={formObjective}
                        onChange={e => setFormObjective(e.target.value)}
                        placeholder="Ex: Definir os passos exatos para fazer o backup diário dos arquivos locais de contratos..."
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-850 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Responsável pela Execução</label>
                      <input
                        type="text"
                        required
                        value={formResponsiblePrimary}
                        onChange={e => setFormResponsiblePrimary(e.target.value)}
                        placeholder="Ex: Auxiliar Administrativo ou Técnico de TI"
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-850 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Instruções Passo a Passo (Uma por linha)</label>
                      <textarea
                        rows={5}
                        required
                        value={formSteps}
                        onChange={e => setFormSteps(e.target.value)}
                        placeholder="Passo 1: Acessar a pasta compartilhada&#10;Passo 2: Copiar os novos arquivos de contrato&#10;Passo 3: Sincronizar com o servidor em nuvem..."
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono text-xs text-slate-850 dark:text-slate-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}

                {/* ==================== CASO SEJA POP ==================== */}
                {formDocType === 'pop' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Objetivo do Processo</label>
                      <textarea
                        rows={2}
                        value={formObjective}
                        onChange={e => setFormObjective(e.target.value)}
                        placeholder="Qual o objetivo desse POP?"
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-250 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-1">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Responsável Primário</label>
                        <input
                          type="text"
                          value={formResponsiblePrimary}
                          onChange={e => setFormResponsiblePrimary(e.target.value)}
                          placeholder="Ex: Secretária Executiva"
                          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-250 focus:outline-none"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Apoio (Separados por vírgula)</label>
                        <input
                          type="text"
                          value={formResponsibleSupport}
                          onChange={e => setFormResponsibleSupport(e.target.value)}
                          placeholder="Ex: Gerente Executiva, Marketing, Financeiro"
                          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-250 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Campo de Aplicação (Separados por vírgula)</label>
                      <input
                        type="text"
                        value={formAppField}
                        onChange={e => setFormAppField(e.target.value)}
                        placeholder="Ex: Diretoria, Gerência Executiva, TI"
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-250 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Entradas (Insumos - uma por linha)</label>
                        <textarea
                          rows={3}
                          value={formInputs}
                          onChange={e => setFormInputs(e.target.value)}
                          placeholder="Convite formal ou demanda da Diretoria&#10;Calendário institucional"
                          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-250 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Saídas (Entregáveis - uma por linha)</label>
                        <textarea
                          rows={3}
                          value={formOutputs}
                          onChange={e => setFormOutputs(e.target.value)}
                          placeholder="Agenda Geral atualizada&#10;Ofícios protocolados"
                          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-250 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">
                        Etapas e Procedimento (Padrão: <span className="font-mono text-indigo-500">Título : Descrição : Subetapa1,Subetapa2</span> ; separar por ponto e vírgula)
                      </label>
                      <textarea
                        rows={4}
                        value={formSteps}
                        onChange={e => setFormSteps(e.target.value)}
                        placeholder="Ex: 5.1 Eventos:Preparação de credenciamento:Definir local,Instalar computadores; 5.2 Pequenos Eventos:Encontros internos:Enviar convites,Imprimir lista"
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono text-xs text-slate-800 dark:text-slate-250 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1.5">Indicadores de Desempenho (Um por linha)</label>
                      <textarea
                        rows={2}
                        value={formIndicators}
                        onChange={e => setFormIndicators(e.target.value)}
                        placeholder="Ex: % de eventos com cobertura publicada no prazo"
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-800 dark:text-slate-250 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Descrição da Alteração para Revisão (Apenas se for Edição) */}
                {editingId !== null && (
                  getIsContentChanged() && !keepRevisionOnEdit ? (
                    <div className="p-4 bg-amber-500/5 dark:bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-2 mt-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                        <label className="block text-xs font-bold text-slate-950 dark:text-amber-400 uppercase tracking-wider font-display">
                          Descrição da Alteração (Nova Revisão Detectada)
                        </label>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Alteração de conteúdo detectada! Ao salvar esta edição, ela será registrada como a nova revisão <strong>{
                          (() => {
                            const originalDoc = formDocType === 'atr'
                              ? atrs.find(a => a.id === editingId)
                              : formDocType === 'it'
                              ? its.find(i => i.id === editingId)
                              : pops.find(p => p.id === editingId);
                            const currentRev = originalDoc?.revision || '00';
                            const nextRevNum = parseInt(currentRev, 10);
                            return isNaN(nextRevNum) ? '01' : String(nextRevNum + 1).padStart(2, '0');
                          })()
                        }</strong>. Descreva brevemente o que foi modificado para o controle de revisões.
                      </p>
                      <input
                        type="text"
                        required
                        value={formRevisionDescription}
                        onChange={e => setFormRevisionDescription(e.target.value)}
                        placeholder="Ex: Atualizados os passos operacionais ou competências técnicas do cargo..."
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-850 dark:text-slate-200 focus:outline-none focus:border-amber-500 shadow-sm"
                      />
                    </div>
                  ) : getIsContentChanged() && keepRevisionOnEdit ? (
                    <div className="p-4 bg-sky-500/5 dark:bg-sky-500/5 border border-sky-500/20 rounded-xl space-y-2 mt-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                        <label className="block text-xs font-bold text-slate-950 dark:text-sky-400 uppercase tracking-wider font-display">
                          Revisão será mantida
                        </label>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Alteração de conteúdo detectada, mas "Manter revisão atual" está marcado — ao salvar, o conteúdo é atualizado sem avançar a revisão nem gerar entrada no histórico. A versão continua como revisão <strong>{
                          (() => {
                            const originalDoc = formDocType === 'atr'
                              ? atrs.find(a => a.id === editingId)
                              : formDocType === 'it'
                              ? its.find(i => i.id === editingId)
                              : pops.find(p => p.id === editingId);
                            return originalDoc?.revision || '00';
                          })()
                        }</strong>.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-500/5 dark:bg-slate-500/5 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 mt-4">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-display">
                          Nenhuma alteração de conteúdo detectada
                        </label>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Apenas metadados (como o setor) foram alterados ou nenhuma alteração foi realizada nos textos principais. <strong>Nenhuma nova revisão será gerada</strong> e a versão atual (revisão {
                          (() => {
                            const originalDoc = formDocType === 'atr'
                              ? atrs.find(a => a.id === editingId)
                              : formDocType === 'it'
                              ? its.find(i => i.id === editingId)
                              : pops.find(p => p.id === editingId);
                            return originalDoc?.revision || '00';
                          })()
                        }) será mantida sem alteração no histórico.
                      </p>
                    </div>
                  )
                )}

                {/* Submit Action Buttons */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex justify-end gap-3.5">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg font-medium text-xs cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow-[0_0_12px_rgba(14,165,233,0.35)] hover:shadow-[0_0_16px_rgba(14,165,233,0.5)] transition-all cursor-pointer"
                  >
                    Salvar Documento
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AdminUsersModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        users={users}
        onUpdateUsers={handleUpdateUsers}
        currentUser={currentUser}
        employees={employees}
        onUpdateEmployees={setEmployees}
        profilePermissions={profilePermissions}
        onUpdatePermissions={handleUpdatePermissions}
        pops={pops}
        atrs={atrs}
        its={its}
        onSelectDoc={(id, type) => {
          setSelectedDocId(id);
          setSelectedDocType(type);
          setActiveTab('content');
          setCurrentView('portal');
          setIsAdminModalOpen(false);
        }}
      />
    </div>
  );
}
