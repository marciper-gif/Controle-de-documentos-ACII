// ─────────────────────────────────────────────────────────────────────
// Leitura da coleção `companies` (empresas-cliente do SaaS).
// ─────────────────────────────────────────────────────────────────────
// Só leitura por aqui: a criação de uma empresa nova é feita por script
// administrativo (Admin SDK, fora das Firestore Rules — ver
// scripts/create-company.mjs), conforme decidido para a Fase 3
// (onboarding ainda não é self-service). A tela de login precisa desta
// lista ANTES de saber a qual empresa o usuário pertence — por isso a
// leitura é liberada a qualquer sessão autenticada, inclusive a anônima
// (ver firestore.rules, match /companies/{companyId}).

import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { Company } from '../types';

export async function getActiveCompanies(): Promise<Company[]> {
  try {
    const snap = await getDocs(query(collection(db, 'companies'), where('status', '==', 'ativo')));
    return snap.docs
      .map(d => ({ ...(d.data() as Company), id: d.id }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  } catch (e) {
    console.warn('Falha ao carregar lista de empresas:', e);
    return [];
  }
}
