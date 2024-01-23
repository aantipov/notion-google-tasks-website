import * as notionApi from '@/functions-helpers/notion-api';
import * as googleApi from '@/functions-helpers/google-api';
import { ServerError } from '@/functions-helpers/server-error';
import { drizzle } from 'drizzle-orm/d1';
import { users, type UserRawT, type UserT } from '@/schema';
import { eq } from 'drizzle-orm';
import type { AuthDataT } from '@/functions-helpers/auth-data';

interface MailjetResponseT {
	Messages: {
		Status: 'success' | 'error';
		Errors: any[];
		To: { Email: string }[];
	}[];
}

interface NPropsMapT {
	title: { id: string; name: string; type: 'title' };
	status: { id: string; name: string; type: 'status' };
	due: { id: string; name: string; type: 'date' };
	lastEdited: { id: string; name: string; type: 'last_edited_time' };
	lastEditedBy: { id: string; name: string; type: 'last_edited_by' };
}

/**
 * Make initial sync and store mapping between Notion and Google tasks
 */
export const onRequestPost: PagesFunction<CFEnvT, any, AuthDataT> = async ({
	env,
	data,
	waitUntil,
}) => {
	const { gToken } = data;
	const email = gToken.user.email;
	const db = drizzle(env.DB, { logger: true });
	let userData: UserRawT;
	try {
		[userData] = await db
			.select()
			.from(users)
			.where(eq(users.email, email))
			.limit(1);
	} catch (error) {
		throw new ServerError('Failed to fetch user data', error);
	}

	const { nToken, databaseId, tasklistId } = userData;

	if (!databaseId || !nToken || !tasklistId) {
		return new Response('Notion is not connected or database is not selected', {
			status: 400,
		});
	}
	const nDBSchema = await notionApi.fetchDatabaseSchema(
		databaseId,
		nToken.access_token,
	);

	// TODO: ensure the user's selected database has all the required properties
	// TODO: ensure Status prop has proper values
	const nPropsMap = {
		title: Object.values(nDBSchema.properties).find((p) => p.type === 'title'),
		status: Object.values(nDBSchema.properties).find(
			(p) => p.type === 'status',
		),
		due: Object.values(nDBSchema.properties).find((p) => p.type === 'date'),
		lastEdited: Object.values(nDBSchema.properties).find(
			(p) => p.type === 'last_edited_time',
		),
		lastEditedBy: Object.values(nDBSchema.properties).find(
			(p) => p.type === 'last_edited_by',
		),
	} as NPropsMapT;

	const { items: nTasks } = await notionApi.fetchOpenTasks(
		databaseId,
		nPropsMap,
		nToken.access_token,
	);
	const { items: gTasks } = await googleApi.fetchOpenTasks(
		tasklistId,
		gToken.access_token,
	);

	const nIdTuples = await notionApi.createAllTasks(
		gTasks,
		databaseId,
		nPropsMap,
		nToken.access_token,
	);

	const gIdTuples = await googleApi.createAllTasks(
		nTasks,
		tasklistId,
		gToken.access_token,
	);

	let updUserData: UserRawT;

	try {
		[updUserData] = await db
			.update(users)
			.set({
				mapping: [...nIdTuples, ...gIdTuples],
				lastSynced: new Date(),
				modified: new Date(),
			})
			.where(eq(users.email, email))
			.returning();

		waitUntil(sendCongratsEmail(email, env));
	} catch (error) {
		throw new ServerError('Failed to update user data', error);
	}

	return new Response(JSON.stringify(getSafeUserData(updUserData)), {
		status: 200,
		headers: { 'Content-Type': 'application/json' },
	});
};

function getSafeUserData(user: UserRawT): UserT {
	const { gToken: _, nToken: __, mapping: ___, ...safeUserData } = user;
	return { ...safeUserData, nConnected: !!user.nToken };
}

async function sendCongratsEmail(email: string, env: CFEnvT): Promise<void> {
	// Use Mailjet API to send emails
	// https://dev.mailjet.com/email/guides/send-api-v31/
	const mailjetUrl = 'https://api.mailjet.com/v3.1/send';
	const emailData = {
		Globals: {
			CustomCampaign: 'Congrats on Initial Sync',
			TemplateID: Number(env.MAILJET_TEMPLATE_ID),
		},
		Messages: [{ To: [{ Email: email }] }],
	};
	const response = await fetch(mailjetUrl, {
		method: 'POST',
		headers: {
			Authorization:
				'Basic ' + btoa(`${env.MAILJET_API_KEY}:${env.MAILJET_SECRET_KEY}`),
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(emailData),
	});
	if (!response.ok) {
		console.error(
			`Mailjet API error: ${response.status} ${response.statusText}`,
		);
		throw new ServerError(
			`Mailjet API error: ${response.status} ${response.statusText}`,
		);
	}
	const responseJson = (await response.json()) as MailjetResponseT;

	if (responseJson.Messages.some((msg) => msg.Status !== 'success')) {
		console.error('Mailjet Send error', JSON.stringify(responseJson, null, 2));
		throw new ServerError(
			`Mailjet Send error: ${responseJson.Messages[0].Errors}`,
		);
	}
}
