import { useCallback, useEffect, useState, SetStateAction } from 'react';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { dbSaveSector } from '../lib/firebaseSync';
import { SectorData } from '../types';
import { initialSectors } from '../data/sectors';

/**
 * Estado dos setores, com persistência em localStorage e sincronização em
 * tempo real com o Firestore. Extraído de App.tsx — mesmo comportamento de
 * antes, só que isolado num hook próprio (inclusive a antiga duplicata do
 * efeito de persistência em localStorage, que existia em dois lugares
 * diferentes do arquivo fazendo exatamente a mesma gravação).
 *
 * `companyId` (Fase 1 — multiempresa): filtra a assinatura do Firestore só
 * pelos setores da empresa da sessão atual. Sem ele (ainda carregando),
 * o hook não abre a assinatura — evita um instante lendo dado errado.
 *
 * FASE 2 — `initialSectors` (os 10 setores da ACII) deixou de ser
 * injetado à força em todo carregamento. Antes, o próprio Firestore podia
 * dizer "este setor foi excluído" e o app continuava mostrando ele assim
 * mesmo, porque `initialSectors` sempre entrava primeiro no merge — na
 * prática, a lista da ACII funcionava como um valor FIXO do sistema,
 * exatamente o que a Fase 2 do prompt pede pra acabar ("migre a lista de
 * setores da ACII para dados configuráveis da própria ACII como tenant,
 * não como valor fixo do sistema"). Agora `initialSectors` só serve pra
 * duas coisas: (1) o catálogo inicial copiado pro Firestore de uma
 * empresa nova sem setor nenhum ainda (ver seedDatabaseIfEmpty em
 * src/lib/firebaseSync.ts) e (2) o que a tela mostra por um instante,
 * antes da primeira resposta do Firestore chegar, se não houver nada
 * ainda no cache local. Depois que o Firestore responde uma vez, ELE é
 * quem manda — inclusive pra remover um setor apagado.
 */
export function useSectorsState(authReady: boolean, companyId: string | null) {
  const [sectors, rawSetSectors] = useState<SectorData[]>(() => {
    const saved = localStorage.getItem('ms-sectors');
    if (!saved) return initialSectors;
    try {
      const parsed: SectorData[] = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialSectors;
    } catch (e) {
      return initialSectors;
    }
  });

  const setSectors = useCallback((val: SetStateAction<SectorData[]>) => {
    rawSetSectors((prev) => {
      const computed = typeof val === 'function' ? val(prev) : val;
      computed.forEach(item => {
        const original = prev.find(p => p.id === item.id);
        if (!original || JSON.stringify(original) !== JSON.stringify(item)) {
          dbSaveSector(item);
        }
      });
      return computed;
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('ms-sectors', JSON.stringify(sectors));
  }, [sectors]);

  useEffect(() => {
    if (!db || !authReady || !companyId) return;

    const unsubSectors = onSnapshot(query(collection(db, 'sectors'), where('companyId', '==', companyId)), (snapshot) => {
      const list: SectorData[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as SectorData);
      });
      // O Firestore é a fonte de verdade a partir daqui — sem mesclar com
      // initialSectors (ver comentário acima). Uma coleção vazia de
      // verdade (empresa sem nenhum setor cadastrado ainda) mostra lista
      // vazia mesmo — é um estado real, não um bug a esconder.
      rawSetSectors(list);
      localStorage.setItem('ms-sectors', JSON.stringify(list));
    }, (err) => {
      console.warn("Firestore snapshot error (sectors):", err);
    });

    return () => unsubSectors();
  }, [authReady, companyId]);

  return [sectors, setSectors] as const;
}
