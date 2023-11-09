import { useEffect, useState } from 'react';
import * as api from '@/helpers/api';
import type { GTasksListT } from '@/functions-helpers/google-api';
import type { NDatabasesResponseT } from '@/functions-helpers/notion-api';
import { NOTION_AUTH_URL } from '@/constants';

interface MainProps {
	isUserLoggedIn: boolean;
	isNotionConnected: boolean;
	tasklistId: string | undefined;
	databaseId: string | undefined;
}

interface TaskListOptionProps {
	id: string;
	title: string;
	selected: boolean;
	onSelect: () => void;
}

interface DatabaseOptionProps {
	id: string;
	title: string;
	selected: boolean;
	onSelect: () => void;
}

function TaskListOption(props: TaskListOptionProps) {
	const { id, title, selected, onSelect } = props;

	return (
		<div>
			<input
				type="radio"
				id={id}
				name="taskList"
				value={id}
				checked={selected}
				onChange={onSelect}
			/>
			<label htmlFor={id}>{title}</label>
		</div>
	);
}

function DatabaseOption(props: DatabaseOptionProps) {
	const { id, title, onSelect, selected } = props;

	return (
		<div>
			<input
				type="radio"
				id={id}
				name="taskList"
				value={id}
				checked={selected}
				onChange={onSelect}
			/>
			<label htmlFor={id}>{title}</label>
		</div>
	);
}

export default function Main(props: MainProps) {
	const { isUserLoggedIn, isNotionConnected } = props;
	const [gTaskLists, setGTaskLists] = useState<GTasksListT[]>([]);
	const [databases, setDatabases] = useState<NDatabasesResponseT['items']>([]);
	const [selectedTaskList, setSelectedTaskList] = useState<GTasksListT | null>(
		null,
	);
	const [selectedDatabase, setSelectedDatabase] = useState<
		NDatabasesResponseT['items'][number] | null
	>(null);
	const [isTasklistIdSaved, setIsTasklistIdSaved] = useState<boolean>(false);
	const [isDatabaseIdSaved, setIsDatabaseIdSaved] = useState<boolean>(false);

	async function handleSaveTaskList() {
		if (!selectedTaskList) return;
		await api.saveTaskList(selectedTaskList.id);
		setIsTasklistIdSaved(true);
	}

	async function handleSaveDatabase() {
		if (!selectedDatabase) return;
		await api.saveDatabase(selectedDatabase.id);
		setIsDatabaseIdSaved(true);
	}

	useEffect(() => {
		async function fetchGTaskLists() {
			if (isUserLoggedIn) {
				try {
					const fetchedGTaskLists = await api.fetchTasksLists();
					setGTaskLists(fetchedGTaskLists);
					if (props.tasklistId) {
						const taskList = fetchedGTaskLists.find(
							(gTaskList) => gTaskList.id === props.tasklistId,
						);
						if (taskList) {
							setSelectedTaskList(taskList);
							setIsTasklistIdSaved(true);
						}
					}
				} catch (error: any) {
					console.error('Error fetching task lists', error);
					if (error.code !== 401) {
						// TODO: show error to user and ask them to reload the page
					}
				}
			}
		}
		fetchGTaskLists();
	}, [isUserLoggedIn]);

	useEffect(() => {
		async function fetchDatabases() {
			if (isNotionConnected) {
				try {
					const { items: databases } = await api.fetchDatabases();
					console.log('databases', JSON.stringify(databases, null, 2));
					setDatabases(databases);
					if (props.databaseId) {
						const database = databases.find(
							(gTaskList) => gTaskList.id === props.tasklistId,
						);
						if (database) {
							setSelectedDatabase(database);
							setIsDatabaseIdSaved(true);
						}
					}
				} catch (error: any) {
					console.error('Error fetching databases', error);
					if (error.code !== 401) {
						// TODO: show error to user and ask them to reload the page
					}
				}
			}
		}
		fetchDatabases();
	}, [isNotionConnected]);

	return (
		<div className="border border-rose-400">
			<div className="mt-5">
				<span>1.&nbsp;</span>
				{isUserLoggedIn ? (
					<span className="text-green-500">Google Connected</span>
				) : (
					<a
						href="/google-auth"
						className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
					>
						Connect Google
					</a>
				)}
			</div>

			<div className="mt-5">
				2.&nbsp;
				{isTasklistIdSaved ? (
					<span className="text-green-500">
						Task List Saved: "{selectedTaskList?.title}"
					</span>
				) : (
					'Choose Google Task List to sync with Notion'
				)}
			</div>

			{!isTasklistIdSaved && (
				<div className="my-5">
					{gTaskLists.map((gTaskList) => (
						<TaskListOption
							key={gTaskList.id}
							id={gTaskList.id}
							title={gTaskList.title}
							selected={selectedTaskList?.id === gTaskList.id}
							onSelect={() => setSelectedTaskList(gTaskList)}
						/>
					))}

					<button
						onClick={handleSaveTaskList}
						className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
					>
						Save Task List
					</button>
				</div>
			)}

			{isTasklistIdSaved && (
				<div className="mt-5">
					<button
						onClick={() => setIsTasklistIdSaved(false)}
						className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
					>
						Change Task List
					</button>
				</div>
			)}

			<div className="mt-5">
				<span>3.&nbsp;</span>
				{isNotionConnected ? (
					<span className="text-green-500">Notion Connected</span>
				) : (
					<a
						href={NOTION_AUTH_URL}
						className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
					>
						Connect Notion
					</a>
				)}
			</div>

			<div className="my-5">
				{databases.map((database) => (
					<DatabaseOption
						key={database.id}
						id={database.id}
						title={database.title}
						selected={selectedDatabase?.id === database.id}
						onSelect={() => setSelectedDatabase(database)}
					/>
				))}

				<button
					onClick={handleSaveDatabase}
					className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
				>
					Save Database
				</button>
			</div>
		</div>
	);
}
