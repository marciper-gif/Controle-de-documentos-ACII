import { auth } from './firebase';

/**
 * HISTÓRICO: esta função gravava auth_links/{uid} diretamente do
 * navegador. Isso era uma falha de segurança séria — qualquer sessão
 * autenticada (inclusive a anônima que todo visitante recebe antes de
 * logar) podia chamar setDoc(auth_links/{uid}, {role:'admin'}) direto no
 * console do navegador e virar administrador sem nunca ter feito login,
 * porque a Cloud Function syncAuthLinkClaims espelhava esse papel
 * forjado pros Custom Claims cegamente. Ver o comentário grande em
 * functions/index.js.
 *
 * Agora auth_links só é gravado no servidor, pelas Cloud Functions
 * `login` e `linkGoogleUser` (Admin SDK, depois de validar a senha ou a
 * sessão do Google) — o cliente perdeu a permissão de escrita direta
 * nessa coleção (ver firestore.rules). Esta função ficou só com a parte
 * de espera: depois que uma dessas Cloud Functions grava auth_links, a
 * Cloud Function syncAuthLinkClaims espelha role/sectorId pros Custom
 * Claims de forma assíncrona — esperamos esse espelhamento terminar
 * (forçando refresh do ID token) antes de liberar a tela, pra que o
 * Storage já veja o papel/setor corretos na primeira tentativa de
 * upload/leitura.
 */
export async function waitForSessionClaims(
  expectedRole: string,
  expectedSectorId: string | null,
  maxAttempts = 10,
  delayMs = 2000
): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const user = auth.currentUser;
    if (!user) return;
    try {
      const result = await user.getIdTokenResult(true);
      const claimsMatch =
        result.claims.role === expectedRole && (result.claims.sectorId ?? null) === expectedSectorId;
      if (claimsMatch) return;
    } catch (e) {
      console.warn('Falha ao verificar custom claims após login:', e);
    }
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  console.warn('Custom claims não sincronizaram a tempo — seguindo com o token disponível.');
}
