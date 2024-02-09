import {
	useDBValidateQuery,
	useGTasksQuery,
	useNTasksQuery,
	useSyncMutation,
	useUserQuery,
} from '@/helpers/api';
import { Icon } from '@iconify/react';
import Button from './Button';
import useActualNotionDbId from '@/hooks/useActualNotionDbId';

type SyncStateT = 'not-synced' | 'ready' | 'syncing' | 'synced';

export function Step({
	syncState: state,
	onClick = () => {}, // is needed only for the 'ready' state
	isLoading = false,
	children,
}: {
	syncState: SyncStateT;
	onClick?: () => void;
	isLoading?: boolean;
	children?: React.ReactNode;
}) {
	if (state === 'not-synced') {
		return (
			<div className="flex w-full cursor-not-allowed items-center rounded border p-5 text-2xl font-semibold text-gray-400 shadow-md">
				<span className="text-xl sm:text-2xl">
					Step 3.
					<span className="ml-2">Perform Initial Sync</span>
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

	if (state === 'ready' || state === 'syncing') {
		return (
			<div className="w-full items-center rounded-lg border border-gray-200 p-5 text-gray-800 shadow-md">
				<div className="text-xl font-semibold sm:text-2xl">
					Step 3.
					<span className="ml-2">Initial Syncronization</span>
				</div>
				{children}
				<Button
					disabled={state === 'syncing'}
					onClick={onClick}
					loading={state === 'syncing'}
					fullWidth
				>
					{state === 'syncing' ? 'Syncing...' : 'Synchronize'}
				</Button>
			</div>
		);
	}

	// Synced state
	return (
		<div className="w-full items-center rounded-lg border border-gray-200 p-5 text-gray-800 shadow-md">
			<div className="text-2xl font-semibold text-green-500">
				Step 3.
				<span className="ml-2">Initial Syncronization Completed</span>
			</div>
		</div>
	);
}

export default function InitialSync(props: { hasToken: boolean }) {
	const userQ = useUserQuery(props.hasToken);
	const notionDbId = useActualNotionDbId(props.hasToken);
	const dbValidationQ = useDBValidateQuery(notionDbId);
	const isReadyToFetchTasks =
		!userQ.error &&
		!!userQ.data?.databaseId &&
		!!userQ.data?.tasklistId &&
		!!dbValidationQ.data?.success;
	const syncM = useSyncMutation();
	const gtasksQ = useGTasksQuery(isReadyToFetchTasks);
	const ntasksQ = useNTasksQuery(isReadyToFetchTasks);

	const readyToSync =
		!gtasksQ.error && !ntasksQ.error && !!gtasksQ.data && !!ntasksQ.data;

	const syncState = ((): SyncStateT => {
		if (userQ.data?.lastSynced) return 'synced';
		if (syncM.status === 'pending') return 'syncing';
		if (syncM.status === 'idle' && readyToSync) return 'ready';
		return 'not-synced';
	})();

	const syncHandler = () => {
		if (syncState !== 'ready') return;
		syncM.mutate();
	};

	if (userQ.isError || dbValidationQ.isError) {
		return <Step syncState="not-synced" />;
	}

	if (gtasksQ.isError || ntasksQ.isError) {
		return (
			<div>
				<Step syncState="not-synced" />
				<div className="mt-2 text-red-600">
					Error while loading data. Try to realod the page
				</div>
			</div>
		);
	}

	if (syncM.isError) {
		return (
			<div>
				<Step syncState="not-synced" />
				<div className="text-red-600">Error while syncing data</div>
			</div>
		);
	}

	if (gtasksQ.isLoading || ntasksQ.isLoading) {
		return <Step syncState="not-synced" isLoading />;
	}

	if (syncState === 'synced') {
		return <Step syncState="synced" />;
	}

	// Ready to sync
	if (userQ.data && userQ.data.tasklistId && userQ.data.databaseId) {
		return (
			<Step syncState={syncState} onClick={syncHandler}>
				<div className="mt-2">
					Review the tasks to be synced initially between the two systems and
					click "Synchonize" to start the process.
				</div>
				<div className="my-3 grid grid-cols-3">
					<div>
						<div className="flex font-bold">
							<Icon icon="logos:notion-icon" className="mr-1 text-2xl" />
							<span className="text-lg">Notion</span>
						</div>
						<ul className="ml-4 list-disc">
							{ntasksQ.data?.map((task) => <li key={task.id}>{task.title}</li>)}
						</ul>
					</div>
					<div className="flex items-center justify-center">
						<Icon
							icon="material-symbols-light:sync-alt-rounded"
							className="text-6xl"
						/>
					</div>
					<div>
						<div className="flex font-bold">
							<Icon icon="arcticons:google-tasks" className="mr-1 text-2xl" />
							<span className="text-lg">Google Tasks</span>
						</div>
						<ul className="ml-4 list-disc">
							{gtasksQ.data?.map((task) => <li key={task.id}>{task.title}</li>)}
						</ul>
					</div>
				</div>
			</Step>
		);
	}

	return <Step syncState="not-synced" />;
}
