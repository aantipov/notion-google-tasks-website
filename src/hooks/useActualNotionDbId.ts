import { useDBsQuery, useUserQuery } from '@/helpers/api';
import useIsGoogleSetupComplete from './useIsGoogleSetupComplete';

// Provide latest actual saved Notion DB Id the user has given permission to. Otherwise, return null.
export default function useActualNotionDbId(
	hasToken: boolean = false,
): false | null | undefined | string {
	const userQ = useUserQuery(hasToken);
	const isGoogleSetUp = useIsGoogleSetupComplete(hasToken);
	const isNotionAuthorized = !userQ.error && !!userQ.data?.nConnected;
	const dbsQ = useDBsQuery(isGoogleSetUp && isNotionAuthorized);
	const permissionedDB = dbsQ.data?.length === 1 && dbsQ.data[0].id;
	const notionDbId =
		isGoogleSetUp &&
		!dbsQ.isLoading &&
		userQ.data?.databaseId === permissionedDB &&
		userQ.data?.databaseId;
	return notionDbId;
}
