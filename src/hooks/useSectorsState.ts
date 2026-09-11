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
 */
export function useSectorsState(authReady: boolean, companyId: string | null) {
  const [sectors, rawSetSectors] = useState<SectorData[]>(() => {
    const saved = localStorage.getItem('ms-sectors');
    if (!saved) return initialSectors;
    try {
      const parsed: SectorData[] = JSON.parse(saved);
      const map = new Map<string, SectorData>();
      initialSectors.forEach(s => map.set(s.id, s));
      parsed.forEach(s => {
        const matchingInit = initialSectors.find(i => i.id === s.id || i.name.toLowerCase() === s.name.toLowerCase());
        if (matchingInit) {
          map.set(matchingInit.id, {
            ...s,
            id: matchingInit.id,
            description: s.description && s.description.length > matchingInit.description.length ? s.description : matchingInit.description
          });
        } else {
          map.set(s.id, s);
        }
      });
      return Array.from(map.values());
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
      const map = new Map<string, SectorData>();
      initialSectors.forEach(s => map.set(s.id, s));
      list.forEach(s => { if (s && s.id) map.set(s.id, s); });
      const merged = Array.from(map.values());
      rawSetSectors(merged);
      localStorage.setItem('ms-sectors', JSON.stringify(merged));
    }, (err) => {
      console.warn("Firestore snapshot error (sectors):", err);
    });

    return () => unsubSectors();
  }, [authReady, companyId]);

  return [sectors, setSectors] as const;
}
