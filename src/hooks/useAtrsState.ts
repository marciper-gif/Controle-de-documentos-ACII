import { useCallback, useEffect, useState, SetStateAction } from 'react';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { dbSaveATR } from '../lib/firebaseSync';
import { ATR } from '../types';
import { initialATRs } from '../data/atrs';

/**
 * Estado dos ATRs (predefinidos + criados no sistema), com persistência em
 * localStorage e sincronização em tempo real com o Firestore. Extraído de
 * App.tsx — mesmo comportamento de antes, só que isolado num hook próprio.
 * `companyId` (Fase 1 — multiempresa): ver comentário em useSectorsState.ts.
 *
 * FASE 1 (bug encontrado depois de publicado) — `initialATRs` (o catálogo
 * fixo de ATRs da ACII) NÃO pode mais entrar no merge quando o Firestore
 * responde: antes, `initialATRs.forEach(a => map.set(a.id, a))` injetava
 * esse catálogo À FORÇA em cima do que veio do banco, pra QUALQUER
 * empresa — uma empresa nova via os 18 ATRs "Atr-001".."Atr-018" da ACII
 * (IDs sem sufixo) JUNTO com os próprios ATRs seedados (IDs com sufixo
 * "-{companyId}"), como se fossem itens diferentes (tecnicamente são —
 * IDs diferentes — mas mostrando o catálogo de uma empresa dentro da
 * tela de outra). Sectors já tinha sido corrigido assim na Fase 2 (ver
 * comentário em useSectorsState.ts); ATRs/POPs/ITs ficaram pra trás. A
 * partir daqui, igual sectors: o Firestore manda sozinho assim que
 * responde — initialATRs só serve de placeholder antes da 1ª resposta.
 */
export function useAtrsState(authReady: boolean, companyId: string | null) {
  const [atrs, rawSetATRs] = useState<ATR[]>(() => {
    const saved = localStorage.getItem('ms-atrs');
    const initialAtrsWithComercial = initialATRs.map(atr => {
      if (atr.id === 'Atr-014' || atr.id === 'Atr-016' || atr.id === 'Atr-018') {
        return { ...atr, sector: 'Comercial' };
      }
      return atr;
    });

    if (!saved) return initialAtrsWithComercial;
    try {
      const parsed = JSON.parse(saved) as ATR[];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialAtrsWithComercial;
    } catch (e) {
      return initialAtrsWithComercial;
    }
  });

  const setATRs = useCallback((val: SetStateAction<ATR[]>) => {
    rawSetATRs((prev) => {
      const computed = typeof val === 'function' ? val(prev) : val;
      computed.forEach(item => {
        const original = prev.find(p => p.id === item.id);
        if (!original || JSON.stringify(original) !== JSON.stringify(item)) {
          dbSaveATR(item);
        }
      });
      return computed;
    });
  }, []);

  // Save changes to LocalStorage
  useEffect(() => {
    localStorage.setItem('ms-atrs', JSON.stringify(atrs));
  }, [atrs]);

  // Real-time subscription (espera sessão do Firebase Auth — ver comentário
  // no efeito equivalente em App.tsx sobre `authReady`).
  useEffect(() => {
    if (!db || !authReady || !companyId) return;

    const unsubATRs = onSnapshot(query(collection(db, 'atrs'), where('companyId', '==', companyId)), (snapshot) => {
      const list: ATR[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as ATR);
      });
      // O Firestore é a fonte de verdade a partir daqui — sem mesclar com
      // initialATRs (ver comentário na declaração do hook, acima).
      rawSetATRs(list);
      localStorage.setItem('ms-atrs', JSON.stringify(list));
    }, (err) => {
      console.warn("Firestore snapshot error (atrs):", err);
    });

    return () => unsubATRs();
  }, [authReady, companyId]);

  return [atrs, setATRs] as const;
}
