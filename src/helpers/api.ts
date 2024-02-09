import type {
	NDatabasesResponseT,
	NTaskT,
	SchemaValidationResponseT,
} from '@/functions-helpers/notion-api';
import type { UserT } from '@/schema';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface GTasklistT {
	id: string;
	title: string;
}

class FetchError extends Error {
	code: number;
	constructor(status: number) {
		super(`HTTP error! status: ${status}`);
		this.code = status;
	}
}

// https://developers.google.com/tasks/reference/rest/v1/tasks#resource:-task
export interface GTaskT {
	id: string;
	title: string; // can be an empty string
	status: 'needsAction' | 'completed';
	due?: string; // ISO Date string 2023-10-31T00:00:00.000Z time portion is always 00:00:00. We can't get or set time.
	notes?: string; // == Description
	updated: string; // ISO date string '2023-10-25T11:56:22.678Z'
	parent?: string; // omitted if task is a top-level task
	completed?: string; // Complettion date of the task
	deleted?: boolean;
	hidden?: boolean;
}

export const useUserQuery = (enabled: boolean = true) =>
	useQuery({
		queryKey: ['user'],
		queryFn: async () => {
			const response = await fetch('/api/user');
			if (!response.ok) {
				throw new FetchError(response.status);
			}
			const data = (await response.json()) as UserT;
			return data;
		},
		retry(failureCount, error) {
			// @ts-ignore
			if (error?.code === 401 || error?.code === 403 || failureCount > 2) {
				return false;
			}
			return true;
		},
		enabled,
	});

export const useUserNotionDBMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (databaseId: string) => {
			const response = await fetch('/api/user', {
				method: 'POST',
				body: JSON.stringify({ databaseId }),
				headers: { 'Content-Type': 'application/json' },
			});
			if (!response.ok) {
				throw new FetchError(response.status);
			}
			const data = (await response.json()) as UserT;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(['user'], data);
		},
	});
};

export const useUserTasklistMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (tasklistId: string) => {
			const response = await fetch('/api/user', {
				method: 'POST',
				body: JSON.stringify({ tasklistId }),
				headers: { 'Content-Type': 'application/json' },
			});
			if (!response.ok) {
				throw new FetchError(response.status);
			}
			const data = (await response.json()) as UserT;
			return data;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(['user'], data);
		},
	});
};

export const useUserDeletion = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ email }: { email: string }) => {
			const response = await fetch('/api/user', {
				method: 'DELETE',
				body: JSON.stringify({ email }),
				headers: { 'Content-Type': 'application/json' },
			});
			if (!response.ok) {
				throw new FetchError(response.status);
			}
			return;
		},
		onSuccess: (data) => {
			queryClient.setQueryData(['user'], null);
		},
	});
};

export const useTasklistsQuery = (enabled: boolean = true) =>
	useQuery({
		queryKey: ['tasklists'],
		queryFn: async () => {
			const response = await fetch('/api/tasklists');
			if (!response.ok) {
				throw new FetchError(response.status);
			}
			const data = (await response.json()) as { items: GTasklistT[] };
			return data.items;
		},
		// @ts-ignore
		retry(failureCount, error) {
			console.log('failure Error', error);
			// @ts-ignore
			if (error?.code === 401 || failureCount > 2) {
				return false;
			}
			return true;
		},
		enabled,
	});

export const useDBsQuery = (enabled: boolean = true) =>
	useQuery({
		queryKey: ['databases'],
		queryFn: async () => {
			const response = await fetch('/api/databases');
			if (!response.ok) {
				throw new FetchError(response.status);
			}
			const data = (await response.json()) as NDatabasesResponseT;
			return data.items;
		},
		// @ts-ignore
		retry(failureCount, error) {
			// @ts-ignore
			if (error?.code === 401 || failureCount > 2) {
				return false;
			}
			return true;
		},
		enabled,
	});

export const useDBValidateQuery = (dbId: string | false | null | undefined) =>
	useQuery({
		queryKey: ['database-validate', dbId],
		queryFn: async () => {
			const response = await fetch(`/api/databases/validate/${dbId}`);
			if (!response.ok) {
				throw new FetchError(response.status);
			}
			const data = (await response.json()) as SchemaValidationResponseT;
			return data;
		},
		retry(failureCount, error) {
			// @ts-ignore
			if (error?.code === 401 || failureCount > 2) {
				return false;
			}
			return true;
		},
		enabled: !!dbId,
	});

export const useSyncMutation = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async () => {
			const response = await fetch('/api/sync', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
			});
			if (!response.ok) {
				throw new FetchError(response.status);
			}
			const data = await response.json();
			return data;
		},
		onSuccess: () => {
			// Invalidate and refetch
			queryClient.invalidateQueries({ queryKey: ['user'] });
		},
	});
};

export const useGTasksQuery = (enabled: boolean = true) =>
	useQuery({
		queryKey: ['gtasks'],
		queryFn: async () => {
			const response = await fetch('/api/google-tasks');
			if (!response.ok) {
				throw new FetchError(response.status);
			}
			const data = (await response.json()) as { items: GTaskT[] };
			return data.items;
		},
		// @ts-ignore
		retry(failureCount, error) {
			// @ts-ignore
			if (error?.code === 401 || failureCount > 2) {
				return false;
			}
			return true;
		},
		enabled,
	});

export const useNTasksQuery = (enabled: boolean) =>
	useQuery({
		queryKey: ['ntasks'],
		queryFn: async () => {
			const response = await fetch('/api/notion-tasks');
			if (!response.ok) {
				throw new FetchError(response.status);
			}
			const data = (await response.json()) as { items: NTaskT[] };
			return data.items;
		},
		// @ts-ignore
		retry(failureCount, error) {
			// @ts-ignore
			if (error?.code === 401 || failureCount > 2) {
				return false;
			}
			return true;
		},
		enabled,
	});
