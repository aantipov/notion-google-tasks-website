/**
 * Notion API helpers
 * IMPORTANT: This file is to be used by Server Functions only!
 */
import { Buffer } from 'node:buffer';
import { Client } from '@notionhq/client';

const TOKEN_URL = 'https://api.notion.com/v1/oauth/token';

export interface NTokenResponseT {
	access_token: string;
	bot_id: string;
	duplicated_template_id: string | null;
	owner: any;
	workspace_icon: string | null;
	workspace_id: string;
	workspace_name: string | null;
}

export async function fetchDatabases(token: string) {
	try {
		const notion = new Client({ auth: token });

		const response = await notion.search({
			query: '',
			filter: {
				value: 'database',
				property: 'object',
			},
			sort: {
				direction: 'ascending',
				timestamp: 'last_edited_time',
			},
		});

		const items = response.results.map((result) => {
			return {
				id: result.id,
				// @ts-ignore
				title: result.title.map((t) => t.text.content).join(''),
			};
		});

		return items;
	} catch (error) {
		console.error('Error fetching databases', error);
		throw error;
	}
}

export async function fetchToken(authCode: string, env: CFEnvT) {
	try {
		// encode in base 64
		const encoded = Buffer.from(
			`${env.NOTION_CLIENT_ID}:${env.NOTION_CLIENT_SECRET}`,
		).toString('base64');

		const tokensResp = await fetch(TOKEN_URL, {
			method: 'POST',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				Authorization: `Basic ${encoded}`,
			},
			body: JSON.stringify({
				code: authCode,
				redirect_uri: env.NOTION_REDIRECT_URI,
				grant_type: 'authorization_code',
			}),
		});

		if (!tokensResp.ok) {
			throw new Error(
				`Failed to fetch token data: ${tokensResp.status} ${tokensResp.statusText}`,
			);
		}

		// TODO: handle error response with { error } = await tokensResp.json(); Possible values: https://datatracker.ietf.org/doc/html/rfc6749#section-5.2
		const tokenData = (await tokensResp.json()) as NTokenResponseT;
		return tokenData;
	} catch (error) {
		console.error('Error fetching token data', error);
		throw error;
	}
}
