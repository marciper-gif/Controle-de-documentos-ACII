// ─────────────────────────────────────────────────────────────────────
// Navegação por URL
// ─────────────────────────────────────────────────────────────────────
// currentView/selectedDocId/selectedDocType continuam sendo o estado
// "de verdade" do app (nenhum dos ~60 lugares que já chamam
// setCurrentView/setSelectedDocId/setSelectedDocType precisou mudar).
// O que muda: dois efeitos em App.tsx (perto da declaração desses
// estados) mantêm a URL do navegador sincronizada com esse estado nos
// dois sentidos — clicar numa aba ou abrir um documento empurra uma
// URL nova pro histórico do navegador (state → URL), e usar os botões
// voltar/avançar do navegador (ou carregar um link direto) atualiza
// esse mesmo estado a partir da URL (URL → state). Isso resolve os
// dois problemas relatados: o botão voltar do navegador passa a
// funcionar de verdade, e não existe mais como o documento aberto e a
// aba atual ficarem "dessincronizados" entre si — os dois efeitos
// sempre convergem pro mesmo valor.
export type ViewType = 'portal' | 'employees' | 'sectors' | 'documentos' | 'workspace';
export type DocType = 'pop' | 'atr' | 'it';

export const VIEW_PATHS: Record<Exclude<ViewType, 'portal'>, string> = {
  employees: '/employees',
  sectors: '/sectors',
  documentos: '/documentos',
  workspace: '/workspace'
};

/** Estado do app → URL correspondente. */
export function computeAppPath(currentView: ViewType, selectedDocType: DocType, selectedDocId: string): string {
  if (currentView === 'portal') {
    return selectedDocId ? `/portal/${selectedDocType}/${encodeURIComponent(selectedDocId)}` : '/portal';
  }
  return VIEW_PATHS[currentView];
}

/** URL → estado do app correspondente (usado tanto na carga inicial quanto no botão voltar/avançar). */
export function parseAppPath(pathname: string): { currentView: ViewType; selectedDocType: DocType; selectedDocId: string } {
  const parts = pathname.split('/').filter(Boolean);
  const first = parts[0];

  if (first === 'employees' || first === 'sectors' || first === 'documentos' || first === 'workspace') {
    return { currentView: first, selectedDocType: 'pop', selectedDocId: '' };
  }

  // '/', '/portal', '/portal/:type/:id' ou qualquer caminho desconhecido caem aqui como padrão.
  const [, docType, docId] = parts; // parts[0] seria 'portal'
  if ((docType === 'pop' || docType === 'atr' || docType === 'it') && docId) {
    return { currentView: 'portal', selectedDocType: docType, selectedDocId: decodeURIComponent(docId) };
  }
  return { currentView: 'portal', selectedDocType: 'pop', selectedDocId: '' };
}
