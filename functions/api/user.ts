import { parseRequestCookies } from '@/helpers/parseRequestCookies';
import { decodeJWTTokens } from '@/helpers/decodeJWTTokens';
import type { KVDataT } from '@/types';
import { GOOGLE_SCOPES_ARRAY } from '@/constants';
import * as googleApi from '@/functions-helpers/google-api';

/**
 * Get users KV's data
 */
export const onRequestGet: PagesFunction<CFEnvT> = async ({ env, request }) => {
	const { gToken, nToken } = await getTokensFromCookie(request, env);

	if (!gToken) {
		return new Response('Invalid token', {
			status: 401,
			headers: {
				'Set-Cookie': 'gtoken=; HttpOnly; Secure; Path=/;',
			},
		});
	}

	if (!validateScopes(gToken.scope.split(' '))) {
		return new Response('Invalid token scopes', { status: 403 });
	}

	// Check gToken is still valid/active
	try {
		await googleApi.fetchUserInfo(gToken.access_token);
	} catch (error) {
		// @ts-ignore
		if (error?.code === 401) {
			return new Response('Invalid token', {
				status: 401,
				headers: {
					'Set-Cookie': 'gtoken=; HttpOnly; Secure; Path=/;',
				},
			});
		} else {
			return new Response('Error fetching user info', { status: 500 });
		}
	}
	const userEmail = gToken.user.email;
	let kvData = await env.NOTION_GTASKS_KV.get<KVDataT>(userEmail, {
		type: 'json',
	});

	// Set KV data if it doesn't exist
	if (!kvData) {
		kvData = {
			gToken,
			...(nToken && { nToken }),
			created: new Date().toISOString(),
			modified: new Date().toISOString(),
		} as KVDataT;

		try {
			await env.NOTION_GTASKS_KV.put(userEmail, JSON.stringify(kvData));
		} catch (error) {
			return new Response('Error saving KV data', { status: 500 });
		}
	}

	// Set nToken if it doesn't exist
	if (nToken && !kvData?.nToken) {
		kvData.nToken = nToken;
		kvData.modified = new Date().toISOString();
		console.log('Updating KV with nToken');
		try {
			await env.NOTION_GTASKS_KV.put(userEmail, JSON.stringify(kvData));
		} catch (error) {
			return new Response('Error updating KV data', { status: 500 });
		}
	}

	const kvDataFiltered = { ...kvData, nToken: undefined, gToken: undefined };

	return new Response(JSON.stringify(kvDataFiltered), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};

async function getTokensFromCookie(req: Request, env: CFEnvT) {
	const { gJWTToken, nJWTToken } = parseRequestCookies(req);
	return await decodeJWTTokens(gJWTToken, nJWTToken, env.JWT_SECRET);
}

function validateScopes(userScopes: string[]): boolean {
	const requiredScopes = GOOGLE_SCOPES_ARRAY;
	return requiredScopes.every((scope) => userScopes.includes(scope));
}
