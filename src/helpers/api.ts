import type { NDatabasesResponseT } from '@/functions-helpers/notion-api';

export interface GTasksListT {
	id: string;
	title: string;
}

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

export async function saveDatabase(id: string) {
	const response = await fetch('/api/databases', {
		method: 'POST',
		body: JSON.stringify({ id }),
		headers: { 'Content-Type': 'application/json' },
	});
	if (!response.ok) {
		const error = new Error(response.statusText) as any;
		error.code = response.status;
		throw error;
	}
	return await response.json();
}

export async function fetchTasksLists(): Promise<GTasksListT[]> {
	const response = await fetch('/api/tasklists');
	if (!response.ok) {
		const error = new Error(response.statusText) as any;
		error.code = response.status;
		throw error;
	}
	const data = (await response.json()) as { items: GTasksListT[] };
	return data.items;
}

export async function saveTaskList(id: string) {
	const response = await fetch('/api/tasklists', {
		method: 'POST',
		body: JSON.stringify({ id }),
		headers: {
			'Content-Type': 'application/json',
		},
	});
	if (!response.ok) {
		const error = new Error(response.statusText) as any;
		error.code = response.status;
		throw error;
	}
	return await response.json();
}
