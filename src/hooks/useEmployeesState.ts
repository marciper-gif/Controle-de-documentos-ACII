import { useCallback, useEffect, useState, SetStateAction } from 'react';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { dbSaveEmployee } from '../lib/firebaseSync';
import { Employee } from '../types';

/**
 * Estado dos funcionários (só os criados no sistema — não tem "dados
 * predefinidos" como ATR/POP/IT), com persistência em localStorage e
 * sincronização em tempo real com o Firestore. Extraído de App.tsx — mesmo
 * comportamento de antes, só que isolado num hook próprio.
 * `companyId` (Fase 1 — multiempresa): ver comentário em useSectorsState.ts.
 */
export function useEmployeesState(authReady: boolean, companyId: string | null) {
  const [employees, rawSetEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('ms-employees');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });

  const setEmployees = useCallback((val: SetStateAction<Employee[]>) => {
    rawSetEmployees((prev) => {
      const computed = typeof val === 'function' ? val(prev) : val;
      computed.forEach(item => {
        const original = prev.find(p => p.id === item.id);
        if (!original || JSON.stringify(original) !== JSON.stringify(item)) {
          dbSaveEmployee(item).catch((err) => {
            console.error('Falha ao salvar funcionário no Firestore:', err);
            alert(`⚠️ Não foi possível salvar "${item.name}" no banco de dados. Verifique sua conexão com a internet e tente cadastrar novamente.`);
          });
        }
      });
      return computed;
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('ms-employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    if (!db || !authReady || !companyId) return;

    const unsubEmployees = onSnapshot(query(collection(db, 'employees'), where('companyId', '==', companyId)), (snapshot) => {
      rawSetEmployees((prev) => {
        const map = new Map<string, Employee>();
        prev.forEach((e) => { if (e && e.id) map.set(e.id, e); });
        snapshot.docChanges().forEach((change) => {
          const data = change.doc.data() as Employee;
          if (change.type === 'removed') {
            map.delete(change.doc.id);
          } else {
            map.set(change.doc.id, data);
          }
        });
        const merged = Array.from(map.values());
        localStorage.setItem('ms-employees', JSON.stringify(merged));
        return merged;
      });
    }, (err) => {
      console.warn("Firestore snapshot error (employees):", err);
    });

    return () => unsubEmployees();
  }, [authReady, companyId]);

  return [employees, setEmployees] as const;
}
