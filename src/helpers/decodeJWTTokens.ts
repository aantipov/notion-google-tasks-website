import jwt from '@tsndr/cloudflare-worker-jwt';
import type { GTokenResponseT } from '@/functions-helpers/google-api';
import type { NTokenResponseT } from '@/functions-helpers/notion-api';
interface TokensT {
	gToken: GTokenResponseT | null;
	nToken: NTokenResponseT | null;
}
/**
 * Get Google and Notion tokens data from JWT cookie
 */
export async function decodeJWTTokens(
	gJwtToken: string | null | undefined,
	nJwtToken: string | null | undefined,
	JWT_SECRET: string,
): Promise<TokensT> {
	const result: TokensT = { gToken: null, nToken: null };
	if (gJwtToken) {
		const isGTokenValid = await jwt.verify(gJwtToken, JWT_SECRET);
		if (isGTokenValid) {
			const { payload: gToken } = (await jwt.decode(gJwtToken)) as unknown as {
				payload: GTokenResponseT;
			};
			result.gToken = gToken;
		} else {
			console.error('Invalid Google token');
		}
	}
	if (nJwtToken) {
		const isNTokenValid = await jwt.verify(nJwtToken, JWT_SECRET);
		if (isNTokenValid) {
			const { payload: nToken } = (await jwt.decode(nJwtToken)) as unknown as {
				payload: NTokenResponseT;
			};
			result.nToken = nToken;
		} else {
			console.error('Invalid Notion token');
		}
	}
	return result;
}
