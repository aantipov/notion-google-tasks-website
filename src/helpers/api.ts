import type {
	NDatabasesResponseT,
	NTaskT,
} from '@/functions-helpers/notion-api';
import type { KVDataT } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface GTasksListT {
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

export const userQuery = (enabled: boolean = true) =>
	useQuery({
		queryKey: ['user'],
		queryFn: async () => {
			const response = await fetch('/api/user');
			if (!response.ok) {
				throw new FetchError(response.status);
			}
			const data = (await response.json()) as Partial<KVDataT>;
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

export const tasksListsQuery = (enabled: boolean = true) =>
	useQuery({
		queryKey: ['taskslists'],
		queryFn: async () => {
			const response = await fetch('/api/tasklists');
			if (!response.ok) {
				throw new FetchError(response.status);
			}
			const data = (await response.json()) as { items: GTasksListT[] };
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

export const tasksListsMutation = (enabled: boolean = true) => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async ({ id }: { id: string }) => {
			const response = await fetch('/api/tasklists', {
				method: 'POST',
				body: JSON.stringify({ id }),
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

export async function fetchDatabases(): Promise<NDatabasesResponseT> {
	const response = await fetch('/api/databases');
	if (!response.ok) {
		const error = new Error(response.statusText) as any;
		error.code = response.status;
		throw error;
	}
	const data = (await response.json()) as NDatabasesResponseT;
	return data;
}

export const dbQuery = () =>
	useQuery({ queryKey: ['db'], queryFn: fetchDatabases });

export async function saveDatabase(id: string) {
	const response = await fetch('/api/databases', {
		method: 'POST',
		body: JSON.stringify({ id }),
		headers: { 'Content-Type': 'application/json' },
	});
	if (!response.ok) {
		throw new FetchError(response.status);
	}
	return await response.json();
}

export async function sync() {
	const response = await fetch('/api/sync', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
	});
	if (!response.ok) {
		const error = new Error(response.statusText) as any;
		error.code = response.status;
		throw error;
	}
	return await response.json();
}

export async function fetchGTasks(): Promise<GTaskT[]> {
	const response = await fetch('/api/google-tasks');
	if (!response.ok) {
		const error = new Error(response.statusText) as any;
		error.code = response.status;
		throw error;
	}
	const data = (await response.json()) as { items: GTaskT[] };
	return data.items;
}

export async function fetchNTasks(): Promise<NTaskT[]> {
	const response = await fetch('/api/notion-tasks');
	if (!response.ok) {
		const error = new Error(response.statusText) as any;
		error.code = response.status;
		throw error;
	}
	const data = (await response.json()) as { items: NTaskT[] };
	return data.items;
}
