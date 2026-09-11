import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  ExternalLink,
  Send,
  LogOut,
  Loader2,
  AlertCircle,
  FileCheck,
  UserCheck,
  HelpCircle
} from 'lucide-react';
import { Employee, ATR, POP, IT } from '../types';
import { auth } from '../lib/firebase';
import {
  googleSignIn,
  initAuth,
  getAccessToken,
  logoutGoogle
} from '../lib/googleAuth';
import {
  exportToGoogleDoc,
  exportDataToGoogleSheet,
  sendEmailWithGmail
} from '../lib/workspaceService';

interface GoogleWorkspaceManagerProps {
  employees: Employee[];
  atrs: ATR[];
  pops: POP[];
  its: IT[];
  currentUserEmail?: string;
  preselectedDocId?: string;
  preselectedDocType?: 'pop' | 'atr' | 'it';
}

export default function GoogleWorkspaceManager({
  employees,
  atrs,
  pops,
  its,
  currentUserEmail,
  preselectedDocId,
  preselectedDocType
}: GoogleWorkspaceManagerProps) {
  // Auth states
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [needsReauth, setNeedsReauth] = useState(false);

  // Export to Sheets state
  const [sheetsExporting, setSheetsExporting] = useState(false);
  const [sheetsResult, setSheetsResult] = useState<{ url: string; title: string } | null>(null);
  const [sheetsError, setSheetsError] = useState<string | null>(null);

  // Export to Docs state
  const [selectedDocToExport, setSelectedDocToExport] = useState<string>('');
  const [selectedDocType, setSelectedDocType] = useState<'pop' | 'atr' | 'it'>('pop');
  const [docsExporting, setDocsExporting] = useState(false);
  const [docsResult, setDocsResult] = useState<{ url: string; title: string } | null>(null);
  const [docsError, setDocsError] = useState<string | null>(null);

  // Gmail State
  const [emailRecipientId, setEmailRecipientId] = useState<string>('');
  const [emailCustomTo, setEmailCustomTo] = useState<string>('');
  const [emailDocId, setEmailDocId] = useState<string>('');
  const [emailDocType, setEmailDocType] = useState<'pop' | 'atr' | 'it'>('pop');
  const [emailCustomMessage, setEmailCustomMessage] = useState<string>('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Help Modal State
  const [showHelp, setShowHelp] = useState(false);

  // Handle external preselection props
  useEffect(() => {
    if (preselectedDocId) {
      setSelectedDocToExport(preselectedDocId);
      setEmailDocId(preselectedDocId);
    }
    if (preselectedDocType) {
      setSelectedDocType(preselectedDocType);
      setEmailDocType(preselectedDocType);
    }
  }, [preselectedDocId, preselectedDocType]);

  // Initialize Auth state
  useEffect(() => {
    const unsub = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
        setIsLoadingAuth(false);
        setNeedsReauth(false);
      },
      () => {
        // Not authenticated with Google or token missing
        const currentFirebaseUser = auth.currentUser;
        if (currentFirebaseUser && currentFirebaseUser.providerData.some(p => p.providerId === 'google.com')) {
          setGoogleUser(currentFirebaseUser);
          // We don't have the token cached yet, so we ask for re-login on Workspace action
          setNeedsReauth(true);
        } else {
          setGoogleUser(null);
          setAccessToken(null);
        }
        setIsLoadingAuth(false);
      }
    );

    // Initial token check
    getAccessToken().then(token => {
      if (token) {
        setAccessToken(token);
        setNeedsReauth(false);
      }
    });

    return () => unsub();
  }, []);

  const handleConnectGoogle = async () => {
    setIsLoadingAuth(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setAccessToken(result.accessToken);
        setNeedsReauth(false);
      }
    } catch (err) {
      console.error('Falha na autenticação Google:', err);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (confirm('Deseja desconectar sua conta Google?')) {
      await logoutGoogle();
      setGoogleUser(null);
      setAccessToken(null);
      setNeedsReauth(false);
    }
  };

  // Safe fetch of active token or trigger re-auth
  const getValidToken = async (): Promise<string | null> => {
    const token = await getAccessToken();
    if (!token) {
      // Prompt for login
      alert('Sua sessão de integração Google expirou. Por favor, conecte novamente com o Google para autorizar a operação.');
      setIsLoadingAuth(true);
      try {
        const result = await googleSignIn();
        if (result) {
          setGoogleUser(result.user);
          setAccessToken(result.accessToken);
          setNeedsReauth(false);
          return result.accessToken;
        }
      } catch (err) {
        console.error('Erro de autenticação automática:', err);
      } finally {
        setIsLoadingAuth(false);
      }
      return null;
    }
    return token;
  };

  // Google Sheets Export Handler
  const handleExportSheets = async () => {
    const token = await getValidToken();
    if (!token) return;

    // MANDATORY confirmation dialog
    const confirmed = window.confirm(
      'Exportar Painel Geral para o Google Sheets?\n\nIsso criará uma nova planilha com duas abas:\n1. Funcionários (dados de cadastro e associações)\n2. Documentos (todos os POPs, ATRs e ITs cadastrados)'
    );
    if (!confirmed) return;

    setSheetsExporting(true);
    setSheetsResult(null);
    setSheetsError(null);

    try {
      const result = await exportDataToGoogleSheet(token, employees, atrs, pops, its);
      setSheetsResult({
        url: result.spreadsheetUrl,
        title: `Planilha Geral - ${new Date().toLocaleDateString('pt-BR')}`
      });
    } catch (err: any) {
      console.error(err);
      setSheetsError(err.message || 'Erro inesperado ao exportar para o Google Sheets.');
    } finally {
      setSheetsExporting(false);
    }
  };

  // Google Docs Export Handler
  const handleExportDoc = async () => {
    if (!selectedDocToExport) {
      alert('Selecione um documento para exportar.');
      return;
    }

    const token = await getValidToken();
    if (!token) return;

    // Find document data
    let docData: any = null;
    if (selectedDocType === 'pop') {
      docData = pops.find(p => p.id === selectedDocToExport);
    } else if (selectedDocType === 'atr') {
      docData = atrs.find(a => a.id === selectedDocToExport);
    } else {
      docData = its.find(i => i.id === selectedDocToExport);
    }

    if (!docData) {
      alert('Documento não encontrado.');
      return;
    }

    // MANDATORY confirmation dialog
    const confirmed = window.confirm(
      `Deseja criar um Google Doc com as informações do documento "${docData.id} - ${docData.title}"?`
    );
    if (!confirmed) return;

    setDocsExporting(true);
    setDocsResult(null);
    setDocsError(null);

    try {
      const result = await exportToGoogleDoc(token, docData, selectedDocType);
      setDocsResult({
        url: result.documentUrl,
        title: `Documento ${docData.id} - ${docData.title}`
      });
    } catch (err: any) {
      console.error(err);
      setDocsError(err.message || 'Erro inesperado ao criar o Google Doc.');
    } finally {
      setDocsExporting(false);
    }
  };

  // Gmail Notification Send Handler
  const handleSendGmail = async () => {
    let recipientEmail = '';
    let recipientName = '';

    if (emailRecipientId === 'custom') {
      if (!emailCustomTo.trim() || !emailCustomTo.includes('@')) {
        alert('Por favor, informe um e-mail de destinatário válido.');
        return;
      }
      recipientEmail = emailCustomTo.trim();
      recipientName = recipientEmail.split('@')[0];
    } else {
      const emp = employees.find(e => e.id === emailRecipientId);
      if (!emp) {
        alert('Selecione um funcionário destinatário.');
        return;
      }
      recipientEmail = emp.email;
      recipientName = emp.name;
    }

    if (!emailDocId) {
      alert('Selecione um documento de referência.');
      return;
    }

    const token = await getValidToken();
    if (!token) return;

    // Find document
    let docData: any = null;
    if (emailDocType === 'pop') {
      docData = pops.find(p => p.id === emailDocId);
    } else if (emailDocType === 'atr') {
      docData = atrs.find(a => a.id === emailDocId);
    } else {
      docData = its.find(i => i.id === emailDocId);
    }

    if (!docData) {
      alert('Documento de referência não encontrado.');
      return;
    }

    // Build Email body
    const docTypeLabel = emailDocType.toUpperCase();
    const appUrl = window.location.origin;

    // MANDATORY confirmation
    const confirmed = window.confirm(
      `Enviar notificação por e-mail para ${recipientName} (${recipientEmail}) usando sua conta Gmail?`
    );
    if (!confirmed) return;

    setEmailSending(true);
    setEmailResult(null);
    setEmailError(null);

    const subject = `[Normatiza] Documento Disponível para Consulta: ${docData.id} - ${docData.title}`;
    const emailBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
        <h2 style="color: #10b981; margin-top: 0;">Portal de Documentos</h2>
        <p>Olá, <strong>${recipientName}</strong>,</p>
        <p>Um documento oficial relevante para suas funções está disponível para consulta e leitura no portal:</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0 0 5px 0;"><strong>Tipo:</strong> ${docTypeLabel}</p>
          <p style="margin: 0 0 5px 0;"><strong>Código:</strong> ${docData.id}</p>
          <p style="margin: 0 0 5px 0;"><strong>Título:</strong> ${docData.title}</p>
          <p style="margin: 0 0 5px 0;"><strong>Setor Responsável:</strong> ${docData.sector}</p>
          <p style="margin: 0;"><strong>Versão/Revisão:</strong> ${docData.revision}</p>
        </div>

        ${emailCustomMessage.trim() ? `
          <p><strong>Mensagem Adicional do Remetente:</strong></p>
          <p style="background-color: #fffbeb; border: 1px solid #fef3c7; padding: 10px; font-style: italic; border-radius: 4px; color: #b45309;">
            "${emailCustomMessage.replace(/\n/g, '<br>')}"
          </p>
        ` : ''}

        <p style="margin-top: 25px;">Por favor, acesse o Portal para revisar todo o conteúdo do documento e registrar sua ciência, se necessário.</p>
        
        <div style="margin: 30px 0; text-align: center;">
          <a href="${appUrl}" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Acessar Portal de Documentos</a>
        </div>

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-top: 30px;" />
        <p style="font-size: 11px; color: #64748b; text-align: center;">Normatiza • Painel Automatizado de Notificações</p>
      </div>
    `;

    try {
      await sendEmailWithGmail(token, recipientEmail, subject, emailBody);
      setEmailResult(`E-mail enviado com sucesso para ${recipientEmail}!`);
      setEmailCustomMessage(''); // clear message on success
    } catch (err: any) {
      console.error(err);
      setEmailError(err.message || 'Erro inesperado ao enviar e-mail via Gmail.');
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div id="google-workspace-manager" className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-slate-950 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-6 bg-emerald-500 rounded-full inline-block"></span>
            Integração Google Workspace
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gere planilhas de relatórios no Sheets, crie instruções formatadas no Docs e envie notificações oficiais com sua conta Gmail.
          </p>
        </div>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="self-start sm:self-auto px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Como funciona?</span>
        </button>
      </div>

      {/* Help Alert Panel */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-5 text-xs text-sky-850 dark:text-sky-300 space-y-2.5">
              <h3 className="font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400">Guia de Integração Workspace</h3>
              <p>
                O Portal conecta-se de forma direta e segura com as APIs oficiais do Google Workspace. O fluxo é inteiramente client-side, de modo que suas credenciais e chaves de acesso (tokens) permanecem salvas temporariamente na memória do seu navegador, sem expor nenhum dado privado.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 pt-2 border-t border-sky-500/10">
                <div className="space-y-1">
                  <p className="font-extrabold flex items-center gap-1"><FileSpreadsheet className="w-4 h-4" /> Google Sheets</p>
                  <p className="text-slate-500 dark:text-slate-400">Exporta de forma dinâmica o cadastro de funcionários, permissões, setores e todos os documentos ativos (POPs/ATRs/ITs) para uma planilha organizada.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-extrabold flex items-center gap-1"><FileText className="w-4 h-4" /> Google Docs</p>
                  <p className="text-slate-500 dark:text-slate-400">Transforma qualquer registro de documento em um relatório textual formal estruturado com cabeçalho, tabelas e histórico de revisões.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-extrabold flex items-center gap-1"><Mail className="w-4 h-4" /> Gmail API</p>
                  <p className="text-slate-500 dark:text-slate-400">Envia e-mails formatados em HTML com links do portal direto do seu e-mail pessoal/profissional, servindo como canal oficial de ciência.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs shrink-0 transition-all ${
            googleUser ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
          }`}>
            <UserCheck className="w-8 h-8" />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-950 dark:text-white flex items-center gap-2">
              Status da Conexão
              {googleUser ? (
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-450 text-[10px] uppercase font-black tracking-widest rounded-full border border-emerald-500/20">
                  Conectado
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] uppercase font-bold tracking-widest rounded-full">
                  Desconectado
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {googleUser 
                ? `Logado como: ${googleUser.displayName || 'Usuário'} (${googleUser.email})` 
                : 'Conecte sua conta Google para liberar as ferramentas de planilhas, relatórios e e-mails.'}
            </p>
          </div>
        </div>

        <div className="w-full md:w-auto shrink-0">
          {isLoadingAuth ? (
            <button disabled className="w-full md:w-auto px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center gap-2 text-sm font-bold border border-slate-200 dark:border-slate-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verificando...</span>
            </button>
          ) : googleUser ? (
            <button
              onClick={handleDisconnectGoogle}
              className="w-full md:w-auto px-4 py-2 bg-slate-100 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-950/20 text-slate-700 hover:text-red-600 dark:text-slate-300 dark:hover:text-red-400 rounded-xl flex items-center justify-center gap-2 text-xs font-extrabold border border-slate-250 dark:border-slate-700 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Desconectar Conta Google</span>
            </button>
          ) : (
            <button
              onClick={handleConnectGoogle}
              className="gsi-material-button w-full md:w-auto shadow-md border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all rounded-xl"
            >
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper">
                <div className="gsi-material-button-icon">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                </div>
                <span className="gsi-material-button-contents font-black text-xs">Conectar Conta Google</span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Main dashboard features - locked when not logged in */}
      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all ${
        !googleUser ? 'opacity-40 pointer-events-none select-none relative' : ''
      }`}>
        {!googleUser && (
          <div className="absolute inset-0 bg-slate-50/10 dark:bg-slate-950/10 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center p-8 text-center rounded-3xl">
            <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-sm p-6 rounded-2xl shadow-lg space-y-3">
              <AlertCircle className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase tracking-wider">Integração Necessária</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Por favor, clique no botão <strong>"Conectar Conta Google"</strong> acima para liberar o uso do Docs, Sheets e Gmail nesta seção.
              </p>
            </div>
          </div>
        )}

        {/* Column 1: Sheets Exporter */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-3xs">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-950 dark:text-white uppercase tracking-wider">Planilha Geral</h4>
                <p className="text-[11px] text-slate-500">Dados Gerais para o Google Sheets</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Exporte todos os registros do Portal em tempo real para o Google Sheets. A planilha será gerada com duas abas estruturadas, contendo listagem completa de colaboradores com dados de CPF, matrícula, e-mail e respectivos documentos associados, facilitando relatórios e auditorias de compliance.
            </p>

            <div className="pt-2">
              <button
                onClick={handleExportSheets}
                disabled={sheetsExporting}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                {sheetsExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gerando Planilha...</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Exportar Painel Geral</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 min-h-[64px]">
            {sheetsResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="truncate pr-1">
                  <p className="font-bold text-emerald-700 dark:text-emerald-400 truncate">Pronto para visualizar!</p>
                  <p className="text-[10px] text-slate-500 truncate">{sheetsResult.title}</p>
                </div>
                <a
                  href={sheetsResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1 transition-colors shrink-0 text-[10px] uppercase"
                >
                  <span>Abrir</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </motion.div>
            )}

            {sheetsError && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{sheetsError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Column 2: Docs Builder */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shadow-3xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-950 dark:text-white uppercase tracking-wider">Documento Oficial</h4>
                <p className="text-[11px] text-slate-500">Criar Relatório no Google Docs</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Gere relatórios textuais formatados de forma instantânea na sua conta do Google Drive. Selecione qualquer POP (Procedimento), ATR (Análise de Atribuições) ou IT (Instrução de Trabalho) disponível no Portal e crie um Google Doc estruturado e pronto para edição compartilhada.
            </p>

            <div className="space-y-2.5 pt-2">
              <div className="grid grid-cols-3 gap-1">
                <button
                  type="button"
                  onClick={() => { setSelectedDocType('pop'); setSelectedDocToExport(''); }}
                  className={`py-1 rounded-lg text-[10px] font-bold uppercase ${
                    selectedDocType === 'pop' 
                      ? 'bg-sky-500/15 text-sky-600 border border-sky-500/20' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  POP
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedDocType('atr'); setSelectedDocToExport(''); }}
                  className={`py-1 rounded-lg text-[10px] font-bold uppercase ${
                    selectedDocType === 'atr' 
                      ? 'bg-indigo-500/15 text-indigo-600 border border-indigo-500/20' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  ATR
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedDocType('it'); setSelectedDocToExport(''); }}
                  className={`py-1 rounded-lg text-[10px] font-bold uppercase ${
                    selectedDocType === 'it' 
                      ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/20' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  IT
                </button>
              </div>

              <select
                value={selectedDocToExport}
                onChange={(e) => setSelectedDocToExport(e.target.value)}
                className="w-full p-2 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">-- Escolha um documento --</option>
                {selectedDocType === 'pop' && pops.map(p => (
                  <option key={p.id} value={p.id}>{p.id} - {p.title}</option>
                ))}
                {selectedDocType === 'atr' && atrs.map(a => (
                  <option key={a.id} value={a.id}>{a.id} - {a.title}</option>
                ))}
                {selectedDocType === 'it' && its.map(i => (
                  <option key={i.id} value={i.id}>{i.id} - {i.title}</option>
                ))}
              </select>

              <button
                onClick={handleExportDoc}
                disabled={docsExporting || !selectedDocToExport}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                {docsExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Criando Google Doc...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Exportar para Google Docs</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 min-h-[64px]">
            {docsResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-sky-500/10 border border-sky-500/20 p-3 rounded-xl flex items-center justify-between gap-3 text-xs"
              >
                <div className="truncate pr-1">
                  <p className="font-bold text-sky-700 dark:text-sky-450 truncate">Doc criado com sucesso!</p>
                  <p className="text-[10px] text-slate-500 truncate">{docsResult.title}</p>
                </div>
                <a
                  href={docsResult.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold flex items-center gap-1 transition-colors shrink-0 text-[10px] uppercase"
                >
                  <span>Editar</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </motion.div>
            )}

            {docsError && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{docsError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Gmail Sender */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/20 text-amber-600 dark:text-amber-450 flex items-center justify-center shadow-3xs">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-slate-950 dark:text-white uppercase tracking-wider">Gmail Notificador</h4>
                <p className="text-[11px] text-slate-500">Enviar Documento por E-mail</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Comunique alterações e distribua revisões via e-mail utilizando sua conta pessoal do Gmail. O funcionário receberá um layout formatado em HTML apresentando os principais campos, código do documento e link de redirecionamento.
            </p>

            <div className="space-y-2.5 pt-2 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Destinatário</label>
                <select
                  value={emailRecipientId}
                  onChange={(e) => setEmailRecipientId(e.target.value)}
                  className="w-full p-2 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="">-- Selecione um funcionário --</option>
                  <option value="custom">Digitar e-mail manual...</option>
                  {employees.filter(e => e.status === 'Ativo').map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.role})</option>
                  ))}
                </select>
              </div>

              {emailRecipientId === 'custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="overflow-hidden"
                >
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">E-mail do Destinatário</label>
                  <input
                    type="email"
                    placeholder="exemplo@gmail.com"
                    value={emailCustomTo}
                    onChange={(e) => setEmailCustomTo(e.target.value)}
                    className="w-full p-2 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </motion.div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tipo de Doc</label>
                  <select
                    value={emailDocType}
                    onChange={(e) => { setEmailDocType(e.target.value as any); setEmailDocId(''); }}
                    className="w-full p-2 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="pop">POP</option>
                    <option value="atr">ATR</option>
                    <option value="it">IT</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Documento</label>
                  <select
                    value={emailDocId}
                    onChange={(e) => setEmailDocId(e.target.value)}
                    className="w-full p-2 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="">-- Escolha --</option>
                    {emailDocType === 'pop' && pops.map(p => (
                      <option key={p.id} value={p.id}>{p.id}</option>
                    ))}
                    {emailDocType === 'atr' && atrs.map(a => (
                      <option key={a.id} value={a.id}>{a.id}</option>
                    ))}
                    {emailDocType === 'it' && its.map(i => (
                      <option key={i.id} value={i.id}>{i.id}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mensagem Adicional (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Instruções extras, prazos ou avisos de ciência do documento..."
                  value={emailCustomMessage}
                  onChange={(e) => setEmailCustomMessage(e.target.value)}
                  className="w-full p-2 bg-slate-55 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <button
                onClick={handleSendGmail}
                disabled={emailSending || !emailDocId || (!emailRecipientId && !emailCustomTo)}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                {emailSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enviando e-mail...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Enviar E-mail Oficial</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 min-h-[64px]">
            {emailResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{emailResult}</span>
              </motion.div>
            )}

            {emailError && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{emailError}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
