import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as api from '@/helpers/api';
import type { GTasksListT } from '@/functions-helpers/google-api';
import type {
	NDatabasesResponseT,
	NTaskT,
} from '@/functions-helpers/notion-api';
import { NOTION_AUTH_URL } from '@/constants';
import type { GTaskT } from '@/helpers/api';
import ConnectGoogle from '@/components/ConnectGoogle';
import ConnectNotion from '@/components/ConnectNotion';
import InitialSync from './InitialSync';

interface MainProps {
	hasToken: boolean;
}

interface DatabaseOptionProps {
	id: string;
	title: string;
	selected: boolean;
	onSelect: () => void;
}

// Create a client
const queryClient = new QueryClient();

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
	// const [gTaskLists, setGTaskLists] = useState<GTasksListT[]>([]);
	const [gTasks, setGTasks] = useState<GTaskT[]>([]);
	const [nTasks, setNTasks] = useState<NTaskT[]>([]);
	const [databases, setDatabases] = useState<NDatabasesResponseT['items']>([]);
	const [selectedTaskList, setSelectedTaskList] = useState<GTasksListT | null>(
		null,
	);
	const [selectedDatabase, setSelectedDatabase] = useState<
		NDatabasesResponseT['items'][number] | null
	>(null);
	const [isTasklistIdSaved, setIsTasklistIdSaved] = useState<boolean>(false);
	const [isDatabaseIdSaved, setIsDatabaseIdSaved] = useState<boolean>(false);

	// async function handleSaveTaskList() {
	// 	if (!selectedTaskList) return;
	// 	await api.saveTaskList(selectedTaskList.id);
	// 	setIsTasklistIdSaved(true);
	// }

	// async function handleSaveDatabase() {
	// 	if (!selectedDatabase) return;
	// 	await api.saveDatabase(selectedDatabase.id);
	// 	setIsDatabaseIdSaved(true);
	// }

	// useEffect(() => {
	// 	async function fetchGTasks() {
	// 		if (props.hasToken) {
	// 			try {
	// 				const gTasks = await api.fetchGTasks();
	// 				setGTasks(gTasks);
	// 			} catch (error: any) {
	// 				console.error('Error fetching task lists', error);
	// 				if (error.code !== 401) {
	// 					// TODO: show error to user and ask them to reload the page
	// 				}
	// 			}
	// 		}
	// 	}
	// 	fetchGTasks();
	// }, [isTasklistIdSaved]);

	// useEffect(() => {
	// 	async function fetchNTasks() {
	// 		if (props.hasToken) {
	// 			try {
	// 				const nTasks = await api.fetchNTasks();
	// 				setNTasks(nTasks);
	// 			} catch (error: any) {
	// 				console.error('Error fetching task lists', error);
	// 				if (error.code !== 401) {
	// 					// TODO: show error to user and ask them to reload the page
	// 				}
	// 			}
	// 		}
	// 	}
	// 	if (isDatabaseIdSaved) {
	// 		fetchNTasks();
	// 	} else {
	// 		setNTasks([]);
	// 	}
	// }, [isDatabaseIdSaved]);

	// useEffect(() => {
	// 	async function fetchGTaskLists() {
	// 		if (props.hasToken) {
	// 			try {
	// 				const fetchedGTaskLists = await api.fetchTasksLists();
	// 				setGTaskLists(fetchedGTaskLists);
	// 				if (props.tasklistId) {
	// 					const taskList = fetchedGTaskLists.find(
	// 						(gTaskList) => gTaskList.id === props.tasklistId,
	// 					);
	// 					if (taskList) {
	// 						setSelectedTaskList(taskList);
	// 						setIsTasklistIdSaved(true);
	// 					}
	// 				}
	// 			} catch (error: any) {
	// 				console.error('Error fetching task lists', error);
	// 				if (error.code !== 401) {
	// 					// TODO: show error to user and ask them to reload the page
	// 				}
	// 			}
	// 		}
	// 	}
	// 	fetchGTaskLists();
	// }, [props.hasToken]);

	// useEffect(() => {
	// 	async function fetchDatabases() {
	// 		if (isNotionConnected) {
	// 			try {
	// 				const { items: databases } = await api.fetchDatabases();
	// 				setDatabases(databases);
	// 				if (props.databaseId) {
	// 					const database = databases.find((db) => db.id === props.databaseId);
	// 					if (database) {
	// 						setSelectedDatabase(database);
	// 						setIsDatabaseIdSaved(true);
	// 					}
	// 				}
	// 			} catch (error: any) {
	// 				console.error('Error fetching databases', error);
	// 				if (error.code !== 401) {
	// 					// TODO: show error to user and ask them to reload the page
	// 				}
	// 			}
	// 		}
	// 	}
	// 	fetchDatabases();
	// }, [isNotionConnected]);

	return (
		<QueryClientProvider client={queryClient}>
			<div className="mt-8 w-[80%] max-w-lg  border border-rose-400">
				<ConnectGoogle hasToken={props.hasToken} />

				<div className="mt-5">
					<ConnectNotion hasToken={props.hasToken} />
				</div>

				<div className="mt-5">
					<InitialSync hasToken={props.hasToken} />
				</div>

				{/* <div className="mt-5">
					4.&nbsp;
					{isDatabaseIdSaved ? (
						<span className="text-green-500">
							Database Saved: "{selectedDatabase?.title}"
						</span>
					) : (
						'Choose Notion Database to sync with Google Tasks'
					)}
				</div> */}

				{/* {!isDatabaseIdSaved && (
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
							className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
						>
							Save Database
						</button>
					</div>
				)}

				{/* Show this button only if there are more than one database */}
				{/* {isDatabaseIdSaved && databases.length > 1 && (
					<div className="mt-5">
						<button
							onClick={() => setIsDatabaseIdSaved(false)}
							className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
						>
							Change Database
						</button>
					</div>
				)} */}

				{/* <div className="mt-5">
					<div>5.&nbsp; Initial synchronization</div>
					<div>The following open Google Tasks will be created in Notion</div>
					<div>
						<ul>
							{gTasks.map((gTask) => (
								<li key={gTask.id}>• {gTask.title}</li>
							))}
						</ul>
					</div>

					<div>The following Notion Tasks will be created in Google Tasks</div>
					<div>
						<ul>
							{nTasks.map((nTask) => (
								<li key={nTask.id}>
									• {nTask.title} Status: ${nTask.status}
								</li>
							))}
						</ul>
					</div>
					<div className="mt-5">
						<button
							onClick={() => api.sync()}
							className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
						>
							Let's SYNC
						</button>
					</div>
				</div> */}
			</div>
		</QueryClientProvider>
	);
}
