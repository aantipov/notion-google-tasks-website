/**
 * Get Google and Notion JWT tokens from request cookies
 * @param req
 * @returns
 */
export function parseRequestCookies(req: Request) {
	const cookieHeader = req.headers.get('Cookie') || '';
	const cookies = cookieHeader.split('; ').reduce(
		(acc, cookie) => {
			const [name, value] = cookie.split('=');
			acc[name] = value;
			return acc;
		},
		{} as { [key: string]: string },
	);

	return {
		gJWTToken: cookies['gtoken'] || null,
		nJWTToken: cookies['ntoken'] || null,
	} as const;
}
