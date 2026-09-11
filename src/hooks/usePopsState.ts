import { useCallback, useEffect, useState, SetStateAction } from 'react';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { dbSavePOP } from '../lib/firebaseSync';
import { POP } from '../types';
import { initialPOPs } from '../data/pops';

/**
 * Estado dos POPs (predefinidos + criados no sistema), com persistência em
 * localStorage e sincronização em tempo real com o Firestore. Extraído de
 * App.tsx — mesmo comportamento de antes, só que isolado num hook próprio.
 */
export function usePopsState(authReady: boolean) {
  const [pops, rawSetPOPs] = useState<POP[]>(() => {
    const saved = localStorage.getItem('ms-pops');
    if (!saved) return initialPOPs;
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return initialPOPs;
      const initialMap = new Map<string, POP>();
      initialPOPs.forEach(p => initialMap.set(p.id, p));
      parsed.forEach((p: POP) => {
        if (p && p.id) initialMap.set(p.id, p);
      });
      return Array.from(initialMap.values());
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
    if (!db || !authReady) return;

    const unsubPOPs = onSnapshot(collection(db, 'pops'), (snapshot) => {
      const list: POP[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as POP);
      });
      const map = new Map<string, POP>();
      initialPOPs.forEach(p => map.set(p.id, p));
      list.forEach(p => { if (p && p.id) map.set(p.id, p); });
      const merged = Array.from(map.values());
      rawSetPOPs(merged);
      localStorage.setItem('ms-pops', JSON.stringify(merged));
    }, (err) => {
      console.warn("Firestore snapshot error (pops):", err);
    });

    return () => unsubPOPs();
  }, [authReady]);

  return [pops, setPOPs] as const;
}
