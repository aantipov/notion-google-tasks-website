import { NOTION_AUTH_URL } from '@/constants';
import { useDatabasesQuery, useUserQuery } from '@/helpers/api';
import { useState } from 'react';

interface PropsT {
	hasToken: boolean;
}

export function Step({
	state = 'not-connected',
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
			{/* {state === 'in-progress' && (
				<span className="text-xl">Google Tasks Connection</span>
			)}
			{state === 'connected' && (
				<span className="text-xl text-green-600">Google Tasks Connected</span>
			)} */}
		</div>
	);
}

export default function ConnectNotion(props: PropsT) {
	const userQuery = useUserQuery(props.hasToken);
	const enabled = !userQuery.error && !!userQuery.data?.tasksListId;
	const databasesQuery = useDatabasesQuery(enabled);

	console.log('db', databasesQuery.data);

	return (
		<div className="mt-5">
			<Step enabled={enabled} />
		</div>
	);
}
