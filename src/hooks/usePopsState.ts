import { useCallback, useEffect, useState, SetStateAction } from 'react';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { dbSavePOP } from '../lib/firebaseSync';
import { POP } from '../types';
import { initialPOPs } from '../data/pops';

/**
 * Estado dos POPs (predefinidos + criados no sistema), com persistência em
 * localStorage e sincronização em tempo real com o Firestore. Extraído de
 * App.tsx — mesmo comportamento de antes, só que isolado num hook próprio.
 * `companyId` (Fase 1 — multiempresa): ver comentário em useSectorsState.ts.
 *
 * FASE 1 (bug encontrado depois de publicado) — mesma correção de
 * useAtrsState.ts: `initialPOPs` não entra mais no merge quando o
 * Firestore responde (senão toda empresa via o catálogo de POPs da ACII
 * junto com o próprio, duplicado). Ver comentário completo lá.
 */
export function usePopsState(authReady: boolean, companyId: string | null) {
  const [pops, rawSetPOPs] = useState<POP[]>(() => {
    const saved = localStorage.getItem('ms-pops');
    if (!saved) return initialPOPs;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialPOPs;
    } catch (e) {
      return initialPOPs;
    }
  });

  const setPOPs = useCallback((val: SetStateAction<POP[]>) => {
    rawSetPOPs((prev) => {
      const computed = typeof val === 'function' ? val(prev) : val;
      computed.forEach(item => {
        const original = prev.find(p => p.id === item.id);
        if (!original || JSON.stringify(original) !== JSON.stringify(item)) {
          dbSavePOP(item);
        }
      });
      return computed;
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('ms-pops', JSON.stringify(pops));
  }, [pops]);

  useEffect(() => {
    if (!db || !authReady || !companyId) return;

    const unsubPOPs = onSnapshot(query(collection(db, 'pops'), where('companyId', '==', companyId)), (snapshot) => {
      const list: POP[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as POP);
      });
      // O Firestore é a fonte de verdade a partir daqui — sem mesclar com
      // initialPOPs (ver comentário na declaração do hook, acima).
      rawSetPOPs(list);
      localStorage.setItem('ms-pops', JSON.stringify(list));
    }, (err) => {
      console.warn("Firestore snapshot error (pops):", err);
    });

    return () => unsubPOPs();
  }, [authReady, companyId]);

  return [pops, setPOPs] as const;
}
