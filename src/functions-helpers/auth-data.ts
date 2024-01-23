import type { GTokenResponseT } from '@/functions-helpers/google-api';
import type { NTokenResponseT } from '@/functions-helpers/notion-api';

export type AuthDataT = {
	gToken: GTokenResponseT;
	nToken?: NTokenResponseT;
};
