import {
	useDBsQuery,
	useUserQuery,
	useUserMutation,
	useDBValidateQuery,
} from '@/helpers/api';
import { useEffect } from 'react';
import LinkButton from './LinkButton';
import Button from './Button';
import Warning from './Warning';
import ErrorComponent from './Error';
import type {
	DBSchemaFieldT,
	SchemaValidationResponseT,
} from '@/functions-helpers/notion-api';
import { Icon } from '@iconify/react';

export function Step({
	state,
	children,
	isLoading = false,
}: {
	state: 'not-connected' | 'ready-to-sync' | 'in-progress' | 'connected';
	isLoading?: boolean;
	children?: React.ReactNode;
}) {
	if (state === 'not-connected') {
		return (
			<div className="flex w-full cursor-not-allowed items-center rounded border p-5 shadow-md">
				<span className="text-2xl font-semibold text-gray-400">
					Step 2.
					<span className="ml-2">Connect Notion Database</span>
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

	if (state === 'ready-to-sync') {
		return (
			<a
				className="flex w-full cursor-pointer items-center rounded bg-blue-500 p-5 text-2xl font-semibold text-white shadow-md hover:bg-blue-700"
				href="/notion-auth"
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
	const dbValidationQ = useDBValidateQuery(
		!userQ.isLoading && userQ.data?.databaseId,
	);

	// Auto select Notion database if only one is connected.
	// We don't check if it has valid schema at this point.
	// We validate later - we validate the one that is saved in the user record. For simplicity.
	useEffect(() => {
		console.log('Mutate?');
		if (dbsQ.data?.length === 1 && dbsQ.data[0].id !== userQ.data?.databaseId) {
			console.log('Mutate!');
			userM.mutate({ databaseId: dbsQ.data[0].id });
		}
	}, [dbsQ.data]);

	const selectedDBName = (() => {
		if (userQ.data?.databaseId && dbsQ.data) {
			return dbsQ.data.find((db) => db.id === userQ.data.databaseId)?.title;
		}
		return null;
	})();

	if (dbsQ.isLoading || dbValidationQ.isLoading || userM.isPending) {
		return <Step state="not-connected" isLoading={true} />;
	}

	if (userQ.isError || dbsQ.isError || dbValidationQ.isError || userM.isError) {
		return (
			<Step state="not-connected">
				<div className="pt-3">
					<Warning>
						Something non-predictable happened. Try reload the page and provide
						the missing info. If the problem persists, please create an issue on
						Github
					</Warning>
				</div>
			</Step>
		);
	}

	if (!isGoogleSetUp) {
		return <Step state="not-connected" />;
	}

	// Let user connect Notion
	if (!userQ.data?.nConnected) {
		return <Step state="ready-to-sync" />;
	}

	// 1. Handle the cases of non-proper Notion connection
	// 1.1 User hasn't given access to any database
	if (dbsQ.data!.length === 0) {
		return (
			<Step state="in-progress">
				<div className="pt-3">
					<Warning>
						You have not selected any Notion database. Please update Notion
						Connection and choose exactly one Notion Database that will be
						connected to Google Tasks
					</Warning>
					<div className="mt-3">
						<LinkButton href="/notion-auth">Amend Notion Connection</LinkButton>
					</div>
				</div>
			</Step>
		);
	}

	// 1.2 User has given access to more than one database
	if (dbsQ.data!.length > 1) {
		return (
			<Step state="in-progress">
				<div className="pt-3">
					<Warning>
						You selected more than one database. Please update Notion Connection
						and choose exactly one Notion Database that will be connected to
						Google Tasks
					</Warning>
					<div className="mt-3">
						<LinkButton href="/notion-auth">Amend Notion Connection</LinkButton>
					</div>
				</div>
			</Step>
		);
	}

	// 1.3 User have access to one database (and it was automatically saved to DB)
	// which has wrong schema
	if (userQ.data.databaseId && !dbValidationQ.data?.success) {
		const dbValidationIssues = getDBValidationIssues(dbValidationQ.data!);
		if (
			dbValidationIssues.missingFields.length === 0 &&
			!dbValidationIssues.wrongStatusField
		) {
			return (
				<Step state="in-progress">
					<div className="pt-3">
						<Warning>
							Some Unexpected error. Please create an issue on Github
						</Warning>
					</div>
				</Step>
			);
		}
		return (
			<Step state="in-progress">
				<div className="pt-3">
					<Warning title="Warning">
						<div>
							The database "<span>{selectedDBName}</span>" requires
							configuration changes:
						</div>
						{dbValidationIssues.missingFields.length > 0 && (
							<div className="mt-1">
								- <span>Missing fields</span>:{' '}
								{dbValidationIssues.missingFields
									.map((field) => `"${field}"`)
									.join(', ')}
							</div>
						)}
						{dbValidationIssues.wrongStatusField && (
							<div>
								- "<span>Status</span>" field needs{' '}
								<span className="italic">Done</span> and{' '}
								<span className="italic">To Do</span> options.
							</div>
						)}
						<div className="mt-2 font-bold">Choose Your Action:</div>
						<div className="flex">
							<div className="mx-2 text-4xl leading-5">•</div>
							<div>
								<div>After making necessary updates in Notion:</div>
								<div>
									<Button
										onClick={() => dbValidationQ.refetch()}
										disabled={dbValidationQ.isFetching}
										loading={dbValidationQ.isFetching}
										size="small"
									>
										Reconnect
									</Button>
								</div>
							</div>
						</div>
						<div className="mt-1 flex">
							<div className="mx-2 text-4xl leading-5">•</div>
							<div>
								<div>Prefer a different database?</div>
								<div>
									<LinkButton href="/notion-auth" size="small">
										Choose Another Database
									</LinkButton>
								</div>
							</div>
						</div>
						<div className="mt-2">
							Select the appropriate action to proceed with the synchronization
							process.
						</div>
					</Warning>
				</div>
			</Step>
		);
	}

	if (userQ.data?.databaseId && dbsQ.data) {
		return (
			<div>
				<Step state="connected">
					<div className="my-1 flex items-center">
						<div>Connected database: "{selectedDBName}"</div>

						{!userQ.data.lastSynced && (
							<a
								href={'/notion-auth'}
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

	return (
		<Step state="not-connected">
			<ErrorComponent title="Error">
				Wow 🙀 - you reached a non-existing state. That's unexpected.
			</ErrorComponent>
		</Step>
	);
}

function getDBValidationIssues(validationRes: SchemaValidationResponseT) {
	if (validationRes.success) {
		return { missingFields: [], wrongStatusField: false };
	}
	const missingFields = validationRes.issues
		.filter((issue) => issue.message === 'Required')
		.map((issue) => {
			switch (issue.path[0] as DBSchemaFieldT) {
				case 'title':
					return 'Title';
				case 'status':
					return 'Status';
				case 'due':
					return 'Due Date';
				case 'lastEdited':
					return 'Last Edited Time';
				case 'lastEditedBy':
					return 'Last Edited By';
				default:
					return 'Unknown field';
			}
		});
	const wrongStatusField = !!validationRes.issues.find(
		(issue) => issue.message === 'status_done_or_todo',
	);
	return { missingFields, wrongStatusField };
}
