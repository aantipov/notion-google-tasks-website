import { NOTION_AUTH_URL } from '@/constants';
import { useDBsMutation, useDBsQuery, useUserQuery } from '@/helpers/api';
import { useEffect, useState } from 'react';
import { EditButton } from './EditButton';

export function Step({
	state,
	enabled,
}: {
	state?: 'not-connected' | 'in-progress' | 'connected';
	enabled: boolean;
}) {
	const [linkClicked, setLinkClicked] = useState<boolean>(false);
	const linkOpacity = linkClicked ? 'opacity-40' : '';
	const elementOpacity = !enabled ? 'opacity-40' : '';
	const linkHover = enabled ? 'hover:bg-blue-500' : '';
	const linkCursor = enabled ? 'cursor-pointer' : 'cursor-not-allowed';
	const handleClick = (event: any) => {
		if (enabled) {
			setLinkClicked(true);
		}
		if (!enabled || linkClicked) {
			event.preventDefault();
		}
	};
	return (
		<div className={`${elementOpacity} flex w-full items-center`}>
			<span className="text-2xl">Step 2.&nbsp;</span>
			{state === 'not-connected' && (
				<a
					href={NOTION_AUTH_URL}
					onClick={handleClick}
					className={`${linkOpacity} ${linkHover} ${linkCursor} rounded bg-blue-500 px-4 py-2 font-bold text-white `}
				>
					Connect Notion Database
				</a>
			)}
			{state === 'in-progress' && (
				<a
					href={NOTION_AUTH_URL}
					onClick={handleClick}
					className={`${linkOpacity} ${linkHover} ${linkCursor} rounded bg-blue-500 px-4 py-2 font-bold text-white `}
				>
					Amend Notion Connection
				</a>
			)}
			{state === 'connected' && (
				<span className="text-xl text-green-600">
					Notion Database Connected
				</span>
			)}
		</div>
	);
}

export default function ConnectNotion(props: { hasToken: boolean }) {
	const userQ = useUserQuery(props.hasToken);
	const dbsMutationQ = useDBsMutation();
	const isGoogleSetUp = !userQ.error && !!userQ.data?.tasksListId;
	const isNotionAuthorized = !userQ.error && !!userQ.data?.nConnected;
	const dbsQ = useDBsQuery(isGoogleSetUp && isNotionAuthorized);

	// TODO: auto select Notion database if only one is connected
	useEffect(() => {
		if (dbsQ.data?.length === 1 && dbsQ.data[0].id !== userQ.data?.databaseId) {
			dbsMutationQ.mutate(dbsQ.data[0].id);
		}
	}, [dbsQ.data]);

	const selectedDBName = (() => {
		if (userQ.data?.databaseId && dbsQ.data) {
			return dbsQ.data.find((db) => db.id === userQ.data.databaseId)?.title;
		}
		return null;
	})();

	if (userQ.isLoading || dbsQ.isLoading) {
		return <Step enabled={false} state="not-connected" />;
	}

	if (!isGoogleSetUp) {
		return <Step enabled={false} state="not-connected" />;
	}

	if (!userQ.data?.nConnected) {
		return <Step enabled={isGoogleSetUp} state="not-connected" />;
	}

	if (!userQ.data.databaseId || dbsQ.data?.length !== 1) {
		return (
			<>
				<Step enabled={isGoogleSetUp} state="in-progress" />
				{dbsQ.data && dbsQ.data?.length > 1 && (
					<div className="mt-1 text-orange-500">
						You selected more than one database. Please update Notion Connection
						and choose only one Notion Database to be connected to Google Tasks
					</div>
				)}
				{dbsQ.data && dbsQ.data?.length === 0 && (
					<div className="mt-1 text-orange-500">
						You have not selected any Notion database. Please update Notion
						Connection and choose exactly one Notion Database to be connected to
						Google Tasks
					</div>
				)}
			</>
		);
	}

	return (
		<div>
			<Step enabled={isGoogleSetUp} state="connected" />
			<div className="my-1 flex items-center">
				<div className="mr-1">Selected Notion Database: "{selectedDBName}"</div>
				<EditButton href={NOTION_AUTH_URL} />
			</div>
		</div>
	);
}
