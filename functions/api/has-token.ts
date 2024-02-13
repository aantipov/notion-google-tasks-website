import type { AuthDataT } from '@/functions-helpers/auth-data';

/**
 * If cookie has token, return 200
 * Otherwise, return 401 (Unauthorizeda) using _middleware
 */
export const onRequestGet: PagesFunction<CFEnvT, any, AuthDataT> = async () => {
	return Response.json({ message: 'Yes, sir' });
};
