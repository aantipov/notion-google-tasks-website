import { useEffect, useState } from 'react';
import {
	useUserQuery,
	useUserMutation,
	useUserDeletion,
	useTasklistsQuery,
} from '@/helpers/api';
import Warning from './Warning';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast/use-toast';
import clsx from 'clsx';

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
	isLoading = false,
	children,
}: {
	state: 'not-connected' | 'ready-to-connect' | 'in-progress' | 'connected';
	isLoading?: boolean;
	children?: React.ReactNode;
}) {
	if (state === 'not-connected') {
		return (
			<div className="flex w-full cursor-not-allowed items-center rounded border p-5 shadow-md">
				<span className="text-xl font-semibold text-gray-400 sm:text-2xl">
					Step 1.
					<span className="ml-2">Connect Google Tasks</span>
				</span>
				{isLoading && (
					<Icon
						icon="line-md:loading-twotone-loop"
						className="ml-3 text-2xl text-gray-700"
					/>
				)}
			</div>
		);
	}

	if (state === 'ready-to-connect') {
		return (
			<a
				className="flex w-full cursor-pointer items-center rounded bg-blue-500 p-5 text-xl font-semibold text-white shadow-md hover:bg-blue-700 sm:text-2xl"
				href={'/google-auth'}
			>
				<span className="shrink-0">Step 1.</span>
				<span className="ml-2">Connect Google Tasks</span>
			</a>
		);
	}

	if (state === 'connected') {
		return (
			<div className="w-full items-center rounded  border p-5 shadow-md">
				<div className="text-xl font-semibold text-green-500 sm:text-2xl">
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
			<div className="text-xl font-semibold sm:text-2xl">
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
	const userD = useUserDeletion();
	const tasklistsQ = useTasklistsQuery(props.hasToken);
	const [userSelectedTasklistId, setUserSelectedTasklistId] = useState<
		string | null
	>(null);
	const { toast } = useToast();

	const [userWantChangeTasklist, setUserWantChangeTasklist] =
		useState<boolean>(false);
	const createGHIssue = (
		<>
			<a
				href="https://github.com/aantipov/notion-google-tasks-website/issues"
				target="_blank"
				className="underline"
			>
				create an issue
			</a>{' '}
			on Github
		</>
	);

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
		return <Step state="not-connected" isLoading />;
	}

	// @ts-ignore
	if (userQ.error && userQ.error?.code === 403) {
		return (
			<div className="w-full">
				<Step state="ready-to-connect" />
				<div className="mt-1">
					<Warning>
						Oops! Required permissions are missing. Please click 'Connect Google
						Tasks' to grant full access for proper functionality.
					</Warning>
				</div>
			</div>
		);
	}

	// @ts-ignore
	if (userQ.error && userQ.error?.code === 401) {
		return (
			<div className="w-full">
				<Step state="ready-to-connect" />
				<div className="mt-1">
					<Warning>
						Your session has expired. Please click "Connect Google Tasks"
					</Warning>
				</div>
			</div>
		);
	}

	if (userQ.error) {
		return (
			<div className="w-full">
				<Step state="ready-to-connect" />
				<div className="pt-3">
					<Warning>
						Something went wrong. Try reload the page and provide the missing
						info. If the problem persists, please {createGHIssue}
					</Warning>
				</div>
			</div>
		);
	}

	// First time select task list case
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
						disabled={userM.isPending}
						variant="cta"
						size="lg"
					>
						{userM.isPending && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						Save Selection
					</Button>
				)}
			</Step>
		);
	}

	// Everthing is set up. Show "Edit" button
	if (!userQ.error && selectedTaskList && !userWantChangeTasklist) {
		return (
			<Step state="connected">
				<div className="mt-1 ">
					<div className="flex flex-wrap items-center">
						Connected account:
						<span className="ml-1 font-semibold">{userQ.data?.email}</span>
						<a
							href="/google-auth"
							className={clsx(
								buttonVariants({ variant: 'outline', className: 'ml-2' }),
							)}
						>
							Edit
						</a>
						<Button
							onClick={() => {
								userD.mutate(
									{ email: userQ.data!.email },
									{
										onSuccess: () => {
											toast({
												variant: 'dark',
												description: `Account ${userQ.data?.email} was successfully deleted from our system. Reloading the page...`,
											});
											setTimeout(() => {
												window.location.reload();
											}, 3500);
										},
									},
								);
							}}
							disabled={userD.isPending}
							variant="destructive"
							className="ml-2"
						>
							{userD.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							{userD.isPending ? 'Resetting...' : 'Reset'}
						</Button>
					</div>

					<div className="flex flex-wrap items-center">
						Connected tasks list: "
						<span className="font-semibold">{selectedTaskList?.title}</span>"
						{!userQ.data?.lastSynced && (
							<Button
								className="ml-2"
								variant="outline"
								onClick={() => {
									setUserSelectedTasklistId(selectedTaskList.id);
									setUserWantChangeTasklist(true);
								}}
							>
								Edit
							</Button>
						)}
					</div>
				</div>
			</Step>
		);
	}

	// Change selected tasklist
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

				<div className="mt-3 flex gap-2">
					<Button
						variant="secondary"
						onClick={() => setUserWantChangeTasklist(false)}
					>
						Cancel
					</Button>

					{userSelectedTasklistId && (
						<Button
							onClick={async () => {
								await userM.mutateAsync({ tasklistId: userSelectedTasklistId });
								setUserWantChangeTasklist(false);
							}}
							disabled={userM.isPending}
						>
							{userM.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Save Selection
						</Button>
					)}
				</div>
			</Step>
		);
	}

	return <Step state="not-connected" />;
}
