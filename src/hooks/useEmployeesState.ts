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
 *
 * Fase 5 (polimento): devolve também `loading` — diferente dos outros
 * hooks de estado (ATR/POP/IT/setores), funcionários NÃO têm nenhum
 * conteúdo de exemplo pra mostrar enquanto o Firestore ainda não
 * respondeu (a lista de exemplo desses outros já cobre esse instante
 * "sem querer"). Sem esse sinal, uma empresa nova via a mensagem "nenhum
 * funcionário cadastrado" por um instante ANTES da primeira resposta do
 * Firestore chegar — texto de estado vazio aparecendo como se fosse
 * definitivo, quando na verdade ainda está carregando. `loading` deixa
 * de ser `true` assim que a primeira resposta (mesmo vazia) chega, ou se
 * não há como carregar ainda (sem sessão/empresa).
 *
 * FASE 1 (bug encontrado depois de publicado) — o onSnapshot usava
 * `docChanges()` mesclado em cima do estado ANTERIOR (`prev`), em vez de
 * substituir pela lista inteira que o Firestore devolveu. Isso vazava
 * funcionário de UMA empresa pra tela de OUTRA: o estado inicial deste
 * hook lê `localStorage.getItem('ms-employees')` — uma chave GLOBAL do
 * navegador, sem escopo por empresa — então, ao trocar de empresa no
 * mesmo navegador, a lista antiga (de outra empresa, cacheada de uma
 * sessão anterior) entrava como `prev`; como um funcionário que nunca
 * pertenceu à consulta da empresa nova nunca gera um evento "removed",
 * ele nunca era removido do Map, e ficava aparecendo pra sempre.
 * Corrigido igual sectors/atrs/pops/its: o Firestore substitui o estado
 * inteiro a cada resposta, nunca mescla com o que já estava lá.
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
  // Já havia algo em cache local? Então não é "carregando" do zero — evita
  // mostrar skeleton por cima de dado que já se tem (só troca quando o
  // Firestore confirmar algo diferente).
  const [loading, setLoading] = useState(() => !localStorage.getItem('ms-employees'));

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
      const list: Employee[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Employee);
      });
      // O Firestore é a fonte de verdade a partir daqui — sem mesclar com
      // o estado anterior (ver comentário na declaração do hook, acima).
      rawSetEmployees(list);
      localStorage.setItem('ms-employees', JSON.stringify(list));
      setLoading(false);
    }, (err) => {
      console.warn("Firestore snapshot error (employees):", err);
      setLoading(false);
    });

    return () => unsubEmployees();
  }, [authReady, companyId]);

  return [employees, setEmployees, loading] as const;
}
