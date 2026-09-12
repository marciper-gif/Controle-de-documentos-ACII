import { useCallback, useEffect, useState, SetStateAction } from 'react';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { dbSaveIT } from '../lib/firebaseSync';
import { IT } from '../types';
import { initialITs } from '../data/its';

/**
 * Estado das ITs (predefinidas + criadas no sistema), com persistência em
 * localStorage e sincronização em tempo real com o Firestore. Extraído de
 * App.tsx — mesmo comportamento de antes, só que isolado num hook próprio.
 * `companyId` (Fase 1 — multiempresa): ver comentário em useSectorsState.ts.
 *
 * FASE 1 (bug encontrado depois de publicado) — mesma correção de
 * useAtrsState.ts: `initialITs` não entra mais no merge quando o
 * Firestore responde (senão toda empresa via o catálogo de ITs da ACII
 * junto com o próprio, duplicado). Ver comentário completo lá.
 */
export function useItsState(authReady: boolean, companyId: string | null) {
  const [its, rawSetITs] = useState<IT[]>(() => {
    const saved = localStorage.getItem('ms-its');
    if (!saved) return initialITs;
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : initialITs;
    } catch (e) {
      return initialITs;
    }
  });

  const setITs = useCallback((val: SetStateAction<IT[]>) => {
    rawSetITs((prev) => {
      const computed = typeof val === 'function' ? val(prev) : val;
      computed.forEach(item => {
        const original = prev.find(p => p.id === item.id);
        if (!original || JSON.stringify(original) !== JSON.stringify(item)) {
          dbSaveIT(item);
        }
      });
      return computed;
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('ms-its', JSON.stringify(its));
  }, [its]);

  useEffect(() => {
    if (!db || !authReady || !companyId) return;

    const unsubITs = onSnapshot(query(collection(db, 'its'), where('companyId', '==', companyId)), (snapshot) => {
      const list: IT[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as IT);
      });
      // O Firestore é a fonte de verdade a partir daqui — sem mesclar com
      // initialITs (ver comentário na declaração do hook, acima).
      rawSetITs(list);
      localStorage.setItem('ms-its', JSON.stringify(list));
    }, (err) => {
      console.warn("Firestore snapshot error (its):", err);
    });

    return () => unsubITs();
  }, [authReady, companyId]);

  return [its, setITs] as const;
}
