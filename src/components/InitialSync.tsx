import {
	useGTasksQuery,
	useNTasksQuery,
	useSyncMutation,
	useUserQuery,
} from '@/helpers/api';
import Button from './Button';

type SyncStateT = 'not-synced' | 'ready' | 'syncing' | 'synced';

export function Step({
	syncState: state,
	enabled,
	loading = false,
	onClick = () => {},
}: {
	syncState: SyncStateT;
	enabled: boolean;
	loading?: boolean;
	onClick?: () => void;
}) {
	return (
		<div className="flex w-full items-center">
			<span className="text-2xl">Step 3.&nbsp;</span>
			{state !== 'synced' && (
				<Button
					loading={state === 'syncing' || loading}
					disabled={!enabled || state !== 'ready'}
					onClick={onClick}
				>
					{state === 'syncing' ? 'Syncing...' : 'Perform Initial Sync'}
				</Button>
			)}
			{state === 'synced' && (
				<span className="text-xl text-green-600">Data Synced Successfully</span>
			)}
		</div>
	);
}

export default function InitialSync(props: { hasToken: boolean }) {
	const syncM = useSyncMutation();
	const userQ = useUserQuery(props.hasToken);
	const isReadyToFetchTasks =
		!userQ.error && !!userQ.data?.databaseId && !!userQ.data?.tasksListId;
	const gtasksQ = useGTasksQuery(isReadyToFetchTasks);
	const ntasksQ = useNTasksQuery(isReadyToFetchTasks);

	const readyToSync =
		!gtasksQ.error && !ntasksQ.error && !!gtasksQ.data && !!ntasksQ.data;

	const syncState = ((): SyncStateT => {
		if (syncM.status === 'success' || userQ.data?.lastSynced) return 'synced';
		if (syncM.status === 'pending') return 'syncing';
		if (syncM.status === 'idle' && readyToSync) return 'ready';
		return 'not-synced';
	})();

	const syncHandler = () => {
		if (syncState !== 'ready') return;
		syncM.mutate();
	};

	if (userQ.isError) {
		return (
			<div>
				<Step enabled={false} syncState={syncState} />
				<div className="text-red-600">Something wrong happened!</div>
			</div>
		);
	}

	if (gtasksQ.isLoading || ntasksQ.isLoading) {
		return <Step enabled={false} syncState={syncState} loading />;
	}

	if (syncState === 'synced') {
		return (
			<div>
				<Step
					enabled={readyToSync}
					syncState={syncState}
					onClick={syncHandler}
				/>
				<div>
					Congratulations! 🎉 You are all set! Automatic syncing in the
					background is setup.
				</div>
			</div>
		);
	}

	if (userQ.data && userQ.data.tasksListId && userQ.data.databaseId) {
		return (
			<div>
				<Step
					enabled={readyToSync}
					syncState={syncState}
					onClick={syncHandler}
				/>
				<div>
					Review the tasks to by synced initially between the two systems
				</div>
				<div className="flex">
					<div>
						Notion
						<div>{ntasksQ.data?.map((task) => <div>{task.title}</div>)}</div>
					</div>
					<div>Icon</div>
					<div>
						Google Tasks
						<div>{gtasksQ.data?.map((task) => <div>{task.title}</div>)}</div>
					</div>
				</div>
				,
			</div>
		);
	}

	return <Step enabled={false} syncState={'not-synced'} />;
}
