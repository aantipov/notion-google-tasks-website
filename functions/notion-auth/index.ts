import { GOOGLE_AUTH_URI, GOOGLE_SCOPES } from '@/constants';

export const onRequestGet: PagesFunction<CFEnvT> = ({ env }) => {
	// Check for jwt token in cookie
	// Redirect user to Google Auth server to provide consent and get token
	const googleAuthUrl = new URL(GOOGLE_AUTH_URI);
	googleAuthUrl.searchParams.set('scope', GOOGLE_SCOPES);
	googleAuthUrl.searchParams.set('response_type', 'code');
	googleAuthUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
	googleAuthUrl.searchParams.set('redirect_uri', env.GOOGLE_REDIRECT_URI);
	googleAuthUrl.searchParams.set('access_type', 'offline'); // to get refresh token
	googleAuthUrl.searchParams.set('prompt', 'consent'); // TODO: check if this is needed. https://developers.google.com/identity/protocols/oauth2/web-server#incrementalAuth
	// TODO: consider using state param to prevent CSRF: https://developers.google.com/identity/protocols/oauth2/web-server#httprest_1

	return Response.redirect(googleAuthUrl.toString(), 302);
};
