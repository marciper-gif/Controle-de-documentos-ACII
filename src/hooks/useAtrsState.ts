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
      const migrated = parsed.map(atr => {
        if (atr.id === 'Atr-014' || atr.id === 'Atr-016' || atr.id === 'Atr-018') {
          return { ...atr, sector: 'Comercial' };
        }
        return atr;
      });
      const initialIds = new Set(initialAtrsWithComercial.map(x => x.id));
      const customAtrs = migrated.filter((x: any) => !initialIds.has(x.id));
      return [...initialAtrsWithComercial, ...customAtrs];
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
      const map = new Map<string, ATR>();
      initialATRs.forEach(a => map.set(a.id, a));
      list.forEach(a => { if (a && a.id) map.set(a.id, a); });
      const merged = Array.from(map.values());
      rawSetATRs(merged);
      localStorage.setItem('ms-atrs', JSON.stringify(merged));
    }, (err) => {
      console.warn("Firestore snapshot error (atrs):", err);
    });

    return () => unsubATRs();
  }, [authReady, companyId]);

  return [atrs, setATRs] as const;
}
