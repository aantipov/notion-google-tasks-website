import { useEffect, useState } from 'react';
import {
	useUserQuery,
	useUserMutation,
	useTasklistsQuery,
} from '@/helpers/api';
import Warning from './Warning';
import Button from './Button';

interface TaskListOptionProps {
	id: string;
	title: string;
	selected: boolean;
	onSelect: () => void;
}

export function TaskListOption(props: TaskListOptionProps) {
	const { id, title, selected, onSelect } = props;

	return (
		<div className="mt-1">
			<input
				type="radio"
				id={id}
				name="taskList"
				value={id}
				checked={selected}
				onChange={onSelect}
			/>
			<label htmlFor={id} className="ml-2">
				{title}
			</label>
		</div>
	);
}

export function Step({
	state,
	children,
}: {
	state: 'not-connected' | 'ready-to-connect' | 'in-progress' | 'connected';
	children?: React.ReactNode;
}) {
	if (state === 'not-connected') {
		return (
			<div className="flex w-full cursor-not-allowed items-center rounded border p-5 text-2xl font-semibold text-gray-400 shadow-md">
				Step 1.
				<span className="ml-2">Connect Google Tasks</span>
			</div>
		);
	}

	if (state === 'ready-to-connect') {
		return (
			<a
				className="flex w-full cursor-pointer items-center rounded bg-blue-500 p-5 text-2xl font-semibold text-white shadow-md hover:bg-blue-700"
				href={'/google-auth'}
			>
				<span className="text-2xl">Step 1.</span>
				<span className="ml-2">Connect Google Tasks</span>
			</a>
		);
	}

	if (state === 'connected') {
		return (
			<div className="w-full items-center rounded  border p-5 shadow-md">
				<div className="text-2xl font-semibold text-green-500">
					Step 1.
					<span className="ml-2">Google Tasks connected</span>
				</div>
				{children}
			</div>
		);
	}

	// In progress state
	return (
		<div className="w-full items-center rounded border border-gray-300 p-5 text-gray-800 shadow-md">
			<div className="text-2xl font-semibold">
				Step 1.
				<span className="ml-2">Google Tasks connection</span>
			</div>
			{children}
		</div>
	);
}

export default function ConnectGoogle(props: { hasToken: boolean }) {
	const userQ = useUserQuery(props.hasToken);
	const userM = useUserMutation();
	const tasklistsQ = useTasklistsQuery(props.hasToken);
	const [userSelectedTasklistId, setUserSelectedTasklistId] = useState<
		string | null
	>(null);
	const [userWantChangeTasklist, setUserWantChangeTasklist] =
		useState<boolean>(false);

	// Save tasklist if there is only one
	useEffect(() => {
		if (tasklistsQ.data?.length === 1) {
			// @ts-ignore
			userM.mutate(tasklistsQ.data[0].id);
		}
	}, [tasklistsQ.data]);

	const selectedTaskList = (() => {
		if (!userQ.error && userQ.data?.tasklistId && tasklistsQ.data) {
			return tasklistsQ.data.find(
				(taskList) => taskList.id === userQ.data.tasklistId,
			);
		}
		return null;
	})();

	if (!props.hasToken) {
		return <Step state="ready-to-connect" />;
	}

	if (userQ.isLoading || tasklistsQ.isLoading) {
		return <Step state="not-connected" />;
	}

	// @ts-ignore
	if (userQ.error && userQ.error?.code === 403) {
		return (
			<div className="w-full">
				<Step state="ready-to-connect" />
				<div className="mt-5 text-orange-500">
					Not Enough Permissions. We need to access your Google Tasks. Please
					click "Connect Google Tasks" and give us access.
				</div>
			</div>
		);
	}

	// @ts-ignore
	if (userQ.error && userQ.error?.code === 401) {
		return (
			<div className="w-full">
				<Step state="ready-to-connect" />
				<div className="mt-5 text-orange-500">
					Your session has expired. Please click "Connect Google Tasks"
				</div>
			</div>
		);
	}

	if (!userQ.error && userQ.data && !userQ.data.tasklistId && tasklistsQ.data) {
		return (
			<Step state="in-progress">
				<div className="my-2">
					<Warning>
						Multiple tasklists found. Choose the one you want to sync with
						Notion
					</Warning>
				</div>

				<div className="my-4">
					{tasklistsQ.data.map((gTaskList) => (
						<TaskListOption
							key={gTaskList.id}
							id={gTaskList.id}
							title={gTaskList.title}
							selected={userSelectedTasklistId === gTaskList.id}
							onSelect={() => setUserSelectedTasklistId(gTaskList.id)}
						/>
					))}
				</div>

				{userSelectedTasklistId && (
					<Button
						onClick={() => userM.mutate({ tasklistId: userSelectedTasklistId })}
					>
						Save selection
					</Button>
				)}
			</Step>
		);
	}

	if (!userQ.error && selectedTaskList && !userWantChangeTasklist) {
		return (
			<Step state="connected">
				<div className="mt-1 flex items-center">
					<div>
						Connected tasks list: "<span>{selectedTaskList?.title}</span>"
					</div>
					{!userQ.data?.lastSynced && (
						<button
							className="ml-2 rounded border border-gray-400 bg-gray-100 px-3 py-1 text-base font-semibold text-gray-700 shadow hover:bg-gray-200"
							onClick={() => {
								setUserSelectedTasklistId(selectedTaskList.id);
								setUserWantChangeTasklist(true);
							}}
						>
							Edit
						</button>
					)}
				</div>
			</Step>
		);
	}

	if (
		!userQ.error &&
		selectedTaskList &&
		userWantChangeTasklist &&
		tasklistsQ.data
	) {
		return (
			<Step state="in-progress">
				<div className="my-1">
					{tasklistsQ.data.map((gTaskList) => (
						<TaskListOption
							key={gTaskList.id}
							id={gTaskList.id}
							title={gTaskList.title}
							selected={userSelectedTasklistId === gTaskList.id}
							onSelect={() => setUserSelectedTasklistId(gTaskList.id)}
						/>
					))}
				</div>

				<button
					onClick={() => {
						setUserWantChangeTasklist(false);
					}}
					className="mt-1 rounded border border-blue-500 bg-transparent px-4 py-2 font-semibold text-blue-700 hover:border-transparent hover:bg-blue-500 hover:text-white"
				>
					Cancel
				</button>

				{userSelectedTasklistId && (
					<button
						onClick={() => {
							userM.mutate({ tasklistId: userSelectedTasklistId });
							setUserWantChangeTasklist(false);
						}}
						className="ml-2 mt-1 rounded border border-transparent bg-blue-500 px-4 py-2 font-semibold text-white hover:bg-blue-700"
					>
						Save selection
					</button>
				)}
			</Step>
		);
	}

	return <Step state="not-connected" />;
}
