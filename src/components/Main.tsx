import { useEffect, useState } from 'react';
import * as api from '@/helpers/api';
import type { GTasksListT } from '@/functions-helpers/google-api';
import { NOTION_AUTH_URL } from '@/constants';

interface MainProps {
	isUserLoggedIn: boolean;
	tasklistId: string | undefined;
}

interface TaskListOptionProps {
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

export default function Main(props: MainProps) {
	const { isUserLoggedIn } = props;
	const [gTaskLists, setGTaskLists] = useState<GTasksListT[]>([]);
	const [selectedTaskList, setSelectedTaskList] = useState<GTasksListT | null>(
		null,
	);
	const [isTasklistIdSaved, setIsTasklistIdSaved] = useState<boolean>(false);
	const isNotionConnected = false;

	async function handleSaveTaskList() {
		if (!selectedTaskList) return;
		await api.saveTaskList(selectedTaskList.id);
		setIsTasklistIdSaved(true);
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
		</div>
	);
}
