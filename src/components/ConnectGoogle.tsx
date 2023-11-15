import { useEffect, useState } from 'react';
import {
	useUserQuery,
	useTasksListsQuery,
	useTasksListsMutation,
} from '@/helpers/api';

interface MainProps {
	hasToken: boolean;
}

interface TaskListOptionProps {
	id: string;
	title: string;
	selected: boolean;
	onSelect: () => void;
}

export function TaskListOption(props: TaskListOptionProps) {
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

export function Step({
	state = 'not-connected',
}: {
	state?: 'not-connected' | 'in-progress' | 'connected';
}) {
	const [linkClicked, setLinkClicked] = useState<boolean>(false);
	const linkOpacity = linkClicked ? 'opacity-40' : '';
	return (
		<div className="flex w-full items-center">
			<span className="text-2xl">Step 1.&nbsp;</span>
			{state === 'not-connected' && (
				<a
					href="/google-auth"
					onClick={() => setLinkClicked(true)}
					className={`${linkOpacity} rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700`}
				>
					Connect Google Tasks
				</a>
			)}
			{state === 'in-progress' && (
				<span className="text-xl">Google Tasks Connection</span>
			)}
			{state === 'connected' && (
				<span className="text-xl text-green-600">Google Tasks Connected</span>
			)}
		</div>
	);
}

export default function ConnectGoogle(props: MainProps) {
	const userQuery = useUserQuery(props.hasToken);
	const tasksListsQuery = useTasksListsQuery(props.hasToken);
	const tasksListsMutation = useTasksListsMutation();
	const [userSelectedTaskListId, setUserSelectedTaskListId] = useState<
		string | null
	>(null);
	const [userWantChangeTasklist, setUserWantChangeTasklist] =
		useState<boolean>(false);

	// Save tasklist if there is only one
	useEffect(() => {
		if (tasksListsQuery.data?.length === 1) {
			// @ts-ignore
			tasksListsMutation.mutate(tasksListsQuery.data[0].id);
		}
	}, [tasksListsQuery.data]);

	const selectedTaskList = (() => {
		if (userQuery.data?.tasksListId && tasksListsQuery.data) {
			return tasksListsQuery.data.find(
				(taskList) => taskList.id === userQuery.data.tasksListId,
			);
		}
		return null;
	})();

	return (
		<div className="mt-5">
			{!props.hasToken && <Step />}

			{/* Handle user has not given enough rights */}
			{/* @ts-ignore */}
			{props.hasToken && userQuery.error && userQuery.error?.code === 403 && (
				<div className="w-full">
					<Step />
					<div className="mt-5 text-orange-500">
						Not Enough Permissions. We need to access your Google Tasks. Please
						click "Connect Google Tasks" and give us access.
					</div>
				</div>
			)}

			{userQuery.data &&
				!userQuery.data.tasksListId &&
				tasksListsQuery.data && (
					// @ts-ignore
					<div className="w-full">
						<Step state="in-progress" />

						<div className="mt-1 text-orange-500">
							Multiple taskslists found. Choose the one you want to sync with
							Notion
						</div>

						<div className="my-1">
							{tasksListsQuery.data.map((gTaskList) => (
								<TaskListOption
									key={gTaskList.id}
									id={gTaskList.id}
									title={gTaskList.title}
									selected={userSelectedTaskListId === gTaskList.id}
									onSelect={() => setUserSelectedTaskListId(gTaskList.id)}
								/>
							))}

							{userSelectedTaskListId && (
								<button
									onClick={() => {
										tasksListsMutation.mutate({ id: userSelectedTaskListId });
									}}
									className="mt-1 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
								>
									Save selection
								</button>
							)}
						</div>
					</div>
				)}

			{selectedTaskList && !userWantChangeTasklist && (
				<div className="w-full">
					<div>
						<span className="text-2xl">Step 1.&nbsp;</span>
						<span className="text-xl text-green-600">
							Google Tasks Connected
						</span>
					</div>
					<div className="my-1">
						Selected tasks list: "{selectedTaskList?.title}"
					</div>

					<button
						onClick={() => {
							setUserSelectedTaskListId(selectedTaskList.id);
							setUserWantChangeTasklist(true);
						}}
						className="rounded bg-gray-500 px-3 py-1 font-bold text-white hover:bg-blue-700"
					>
						Change Selected Tasks List
					</button>
				</div>
			)}

			{selectedTaskList && userWantChangeTasklist && tasksListsQuery.data && (
				<div className="w-full">
					<Step state="connected" />

					<div className="my-1">
						{tasksListsQuery.data.map((gTaskList) => (
							<TaskListOption
								key={gTaskList.id}
								id={gTaskList.id}
								title={gTaskList.title}
								selected={userSelectedTaskListId === gTaskList.id}
								onSelect={() => setUserSelectedTaskListId(gTaskList.id)}
							/>
						))}

						{userSelectedTaskListId && (
							<button
								onClick={() => {
									tasksListsMutation.mutate({ id: userSelectedTaskListId });
									setUserWantChangeTasklist(false);
								}}
								className="mt-1 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
							>
								Save selection
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
