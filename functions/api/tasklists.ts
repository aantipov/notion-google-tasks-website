import * as googleApi from '@/helpers/google-api';
import jwt from '@tsndr/cloudflare-worker-jwt';
import type { JWTTokenPayloadT } from 'google-auth/callback';
import type { KVDataPartialT } from '@/types';

interface BodyT {
	id: string;
}

/**
 * Store user-selected tasklist id in KV
 */
export const onRequestPost: PagesFunction<CFEnvT> = async ({
	env,
	request,
	params,
}) => {
	// Check for jwt token in cookie
	const cookieHeader = request.headers.get('Cookie') || '';
	const cookies = cookieHeader.split('; ').reduce(
		(acc, cookie) => {
			const [name, value] = cookie.split('=');
			acc[name] = value;
			return acc;
		},
		{} as { [key: string]: string },
	);
	const jwtToken = cookies['token'];

	const requestBody = (await request.json()) as BodyT;
	const tasklistId = requestBody.id;

	if (!tasklistId) {
		return new Response('Invalid request', { status: 400 });
	}

	let email;

	try {
		await jwt.verify(jwtToken, env.JWT_SECRET, { throwError: true });
		const jwtData = await jwt.decode(jwtToken);
		const payload = jwtData.payload as JWTTokenPayloadT;
		email = payload.email;

		// Validate if token is still valid by fetching user info
		await googleApi.fetchUserInfo(payload.accessToken);
	} catch (error: any) {
		console.error('Token Validation Error', error);
		return new Response('Invalid token', { status: 401 });
	}

	const kvData = await env.NOTION_GTASKS_KV.get<KVDataPartialT>(email, {
		type: 'json',
	});

	// Update KV with tasklist id
	const kvDataUpdated = {
		...kvData,
		gTasksListId: tasklistId,
	};

	console.log('Updating KV with tasklist id', kvDataUpdated);

	await env.NOTION_GTASKS_KV.put(email, JSON.stringify(kvDataUpdated));

	return new Response(JSON.stringify({ message: 'OK' }), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};
