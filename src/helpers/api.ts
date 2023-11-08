export async function saveTaskList(id: string) {
	const response = await fetch('/api/tasklists', {
		method: 'POST',
		body: JSON.stringify({ id }),
		headers: {
			'Content-Type': 'application/json',
		},
	});
	if (!response.ok) {
		throw new Error('Failed to store tasklist id');
	}
	return await response.json();
}
