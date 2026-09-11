import { useCallback, useEffect, useState, SetStateAction } from 'react';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { dbSaveIT } from '../lib/firebaseSync';
import { IT } from '../types';
import { initialITs } from '../data/its';

/**
 * Estado das ITs (predefinidas + criadas no sistema), com persistência em
 * localStorage e sincronização em tempo real com o Firestore. Extraído de
 * App.tsx — mesmo comportamento de antes, só que isolado num hook próprio.
 */
export function useItsState(authReady: boolean) {
  const [its, rawSetITs] = useState<IT[]>(() => {
    const saved = localStorage.getItem('ms-its');
    if (!saved) return initialITs;
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return initialITs;
      const initialMap = new Map<string, IT>();
      initialITs.forEach(i => initialMap.set(i.id, i));
      parsed.forEach((i: IT) => {
        if (i && i.id) initialMap.set(i.id, i);
      });
      return Array.from(initialMap.values());
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
    if (!db || !authReady) return;

    const unsubITs = onSnapshot(collection(db, 'its'), (snapshot) => {
      const list: IT[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as IT);
      });
      const map = new Map<string, IT>();
      initialITs.forEach(i => map.set(i.id, i));
      list.forEach(i => { if (i && i.id) map.set(i.id, i); });
      const merged = Array.from(map.values());
      rawSetITs(merged);
      localStorage.setItem('ms-its', JSON.stringify(merged));
    }, (err) => {
      console.warn("Firestore snapshot error (its):", err);
    });

    return () => unsubITs();
  }, [authReady]);

  return [its, setITs] as const;
}
