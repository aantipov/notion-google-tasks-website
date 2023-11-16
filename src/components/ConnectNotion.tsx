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
		setLinkClicked(true);
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
	const { error: userError, data: userData } = useUserQuery(props.hasToken);
	const dbsMutationQuery = useDBsMutation();
	const enabled = !userError && !!userData?.tasksListId;
	const { data: dbsData } = useDBsQuery(enabled);

	// TODO: auto select Notion database if only one is connected
	useEffect(() => {
		if (dbsData?.length === 1 && dbsData[0].id !== userData?.databaseId) {
			dbsMutationQuery.mutate(dbsData[0].id);
		}
	}, [dbsData]);

	const selectedDBName = (() => {
		if (userData?.databaseId && dbsData) {
			return dbsData.find((db) => db.id === userData.databaseId)?.title;
		}
		return null;
	})();

	return (
		<div className="mt-5">
			{!enabled && <Step enabled={false} state="not-connected" />}
			{enabled && !userData.nConnected && (
				<Step enabled={enabled} state="not-connected" />
			)}
			{enabled &&
				!!userData.nConnected &&
				(!userData.databaseId || dbsData?.length !== 1) && (
					<>
						<Step enabled={enabled} state="in-progress" />
						{dbsData && dbsData?.length > 1 && (
							<div className="mt-1 text-orange-500">
								You selected more than one database. Please update Notion
								Connection and choose only one Notion Database to be connected
								to Google Tasks
							</div>
						)}
						{dbsData && dbsData?.length === 0 && (
							<div className="mt-1 text-orange-500">
								You have not selected any Notion database. Please update Notion
								Connection and choose exactly one Notion Database to be
								connected to Google Tasks
							</div>
						)}
					</>
				)}
			{enabled &&
				!!userData.nConnected &&
				!!userData.databaseId &&
				dbsData?.length == 1 && (
					<div>
						<Step enabled={enabled} state="connected" />
						<div className="my-1 flex items-center">
							<div className="mr-1">
								Selected Notion Database: "{selectedDBName}"
							</div>
							<EditButton href={NOTION_AUTH_URL} />
						</div>
					</div>
				)}
		</div>
	);
}
