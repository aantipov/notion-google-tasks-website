import { NOTION_AUTH_URL } from '@/constants';
import { useDBsQuery, useUserQuery, useUserMutation } from '@/helpers/api';
import { useEffect } from 'react';
import LinkButton from './LinkButton';
import Warning from './Warning';

export function Step({
	state,
	children,
}: {
	state: 'not-connected' | 'ready-to-sync' | 'in-progress' | 'connected';
	children?: React.ReactNode;
}) {
	if (state === 'not-connected') {
		return (
			<div className="flex w-full cursor-not-allowed items-center rounded border p-5 shadow-md">
				<span className="text-2xl font-semibold text-gray-400">
					Step 2.
					<span className="ml-2">Connect Notion Database</span>
				</span>
			</div>
		);
	}

	if (state === 'ready-to-sync') {
		return (
			<a
				className="flex w-full cursor-pointer items-center rounded bg-blue-500 p-5 text-2xl font-semibold text-white shadow-md hover:bg-blue-700"
				href={NOTION_AUTH_URL}
			>
				<span className="text-2xl">
					Step 2.
					<span className="ml-2">Connect Notion Database</span>
				</span>
			</a>
		);
	}

	if (state === 'in-progress') {
		return (
			<div className="w-full items-center rounded border border-gray-300 p-5 text-gray-800 shadow-md">
				<div className="text-2xl font-semibold">
					Step 2.
					<span className="ml-2">Notion Database connection</span>
				</div>
				{children}
			</div>
		);
	}

	// Connected state
	return (
		<div className="w-full items-center rounded border p-5 shadow-md">
			<div className="text-2xl font-semibold text-green-500">
				Step 2.
				<span className="ml-2">Notion Database Connected</span>
			</div>
			{children}
		</div>
	);
}

export default function ConnectNotion(props: { hasToken: boolean }) {
	const userQ = useUserQuery(props.hasToken);
	const userM = useUserMutation();
	const isGoogleSetUp = !userQ.error && !!userQ.data?.tasklistId;
	const isNotionAuthorized = !userQ.error && !!userQ.data?.nConnected;
	const dbsQ = useDBsQuery(isGoogleSetUp && isNotionAuthorized);

	// TODO: auto select Notion database if only one is connected
	useEffect(() => {
		if (dbsQ.data?.length === 1 && dbsQ.data[0].id !== userQ.data?.databaseId) {
			userM.mutate({ databaseId: dbsQ.data[0].id });
		}
	}, [dbsQ.data]);

	const selectedDBName = (() => {
		if (userQ.data?.databaseId && dbsQ.data) {
			return dbsQ.data.find((db) => db.id === userQ.data.databaseId)?.title;
		}
		return null;
	})();

	if (userQ.isLoading || dbsQ.isLoading) {
		return <Step state="not-connected" />;
	}

	if (!isGoogleSetUp) {
		return <Step state="not-connected" />;
	}

	if (!userQ.data?.nConnected) {
		return <Step state="ready-to-sync" />;
	}

	if (userQ.data?.databaseId && dbsQ.data) {
		return (
			<div>
				<Step state="connected">
					<div className="my-1 flex items-center">
						<div>Connected database: "{selectedDBName}"</div>

						{!userQ.data.lastSynced && (
							<a
								href={NOTION_AUTH_URL}
								className="ml-2 rounded border border-gray-400 bg-gray-100 px-3 py-1 text-base font-semibold text-gray-700 shadow hover:bg-gray-200"
							>
								Edit
							</a>
						)}
					</div>
				</Step>
			</div>
		);
	}

	if (!dbsQ.data) {
		return <div>Loading</div>;
	}

	if (dbsQ.data.length === 1) {
		return <div>Selecting</div>;
	}

	return (
		<Step state="in-progress">
			<div className="pt-3">
				<Warning>
					{dbsQ.data.length > 1 && (
						<>
							You selected more than one database. Please update Notion
							Connection and choose exactly one Notion Database that will be
							connected to Google Tasks
						</>
					)}
					{dbsQ.data.length === 0 && (
						<>
							You have not selected any Notion database. Please update Notion
							Connection and choose exactly one Notion Database that will be
							connected to Google Tasks
						</>
					)}
				</Warning>
				<div className="mt-3">
					<LinkButton href={NOTION_AUTH_URL}>
						Amend Notion Connection
					</LinkButton>
				</div>
			</div>
		</Step>
	);
}
