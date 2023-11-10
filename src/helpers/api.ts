import type { NDatabasesResponseT } from '@/functions-helpers/notion-api';

export interface GTasksListT {
	id: string;
	title: string;
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
