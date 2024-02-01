import { drizzle } from 'drizzle-orm/d1';
import { users } from '@/schema';
import type { NTokenResponseT } from './notion-api';
import { eq } from 'drizzle-orm';

export async function storeNotionToken(
	email: string,
	nToken: NTokenResponseT,
	env: CFEnvT,
) {
	const db = drizzle(env.DB, { logger: true });
	const [userData] = await db
		.update(users)
		.set({
			nToken,
			modified: new Date(),
		})
		.where(eq(users.email, email))
		.returning();
	return userData;
}
