import { NOTION_AUTH_URI } from '@/constants';

export const onRequestGet: PagesFunction<CFEnvT> = ({ env }) => {
	// Redirect user to Notion Auth server to provide consent and get token
	const notionAuthUrl = new URL(NOTION_AUTH_URI);
	notionAuthUrl.searchParams.set('response_type', 'code');
	notionAuthUrl.searchParams.set('owner', 'user');
	notionAuthUrl.searchParams.set('client_id', env.NOTION_CLIENT_ID);
	notionAuthUrl.searchParams.set('redirect_uri', env.NOTION_REDIRECT_URI);

	return Response.redirect(notionAuthUrl.toString(), 302);
};
