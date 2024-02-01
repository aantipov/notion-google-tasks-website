import jwt from '@tsndr/cloudflare-worker-jwt';
import type { GTokenResponseT } from '@/functions-helpers/google-api';

/**
 * Get Google token data from JWT cookie
 */
export async function decodeJWTToken(
	gJwtToken: string | null | undefined,
	JWT_SECRET: string,
): Promise<GTokenResponseT | null> {
	if (!gJwtToken) {
		return null;
	}
	const isGTokenValid = await jwt.verify(gJwtToken, JWT_SECRET);
	if (isGTokenValid) {
		const { payload: gToken } = (await jwt.decode(gJwtToken)) as unknown as {
			payload: GTokenResponseT;
		};
		return gToken;
	}
	return null;
}
