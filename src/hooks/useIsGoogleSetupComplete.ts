import { useUserQuery } from '@/helpers/api';

export default function useIsGoogleSetupComplete(hasToken: boolean = false) {
	const userQ = useUserQuery(hasToken);
	const isGoogleSetUp =
		!userQ.isLoading && !userQ.isError && !!userQ.data?.tasklistId;
	return isGoogleSetUp;
}
