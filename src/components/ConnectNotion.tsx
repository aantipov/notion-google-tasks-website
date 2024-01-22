import {
	useDBsQuery,
	useUserQuery,
	useUserMutation,
	useDBValidateQuery,
} from '@/helpers/api';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import Warning from './Warning';
import ErrorComponent from './Error';
import Modal from './Modal';
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
			<div className="w-full cursor-not-allowed rounded border p-5 shadow-md">
				<div className="flex w-full items-center">
					<span className="text-xl font-semibold text-gray-400 sm:text-2xl">
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
				{children}
			</div>
		);
	}

	if (state === 'ready-to-sync') {
		return (
			<a
				className="flex w-full cursor-pointer items-center rounded bg-blue-500 p-5 text-2xl font-semibold text-white shadow-md hover:bg-blue-700"
				href="/notion-auth"
			>
				<span className="text-xl sm:text-2xl">
					Step 2.
					<span className="ml-2">Connect Notion Database</span>
				</span>
			</a>
		);
	}

	if (state === 'in-progress') {
		return (
			<div className="w-full items-center rounded border border-gray-300 p-5 text-gray-800 shadow-md">
				<div className="text-xl font-semibold sm:text-2xl">
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
			<div className="text-xl font-semibold text-green-500 sm:text-2xl">
				Step 2.
				<span className="ml-2">Notion Database Connected</span>
			</div>
			{children}
		</div>
	);
}

export default function ConnectNotion(props: { hasToken: boolean }) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const userQ = useUserQuery(props.hasToken);
	const userM = useUserMutation();
	const isGoogleSetUp = !userQ.error && !!userQ.data?.tasklistId;
	const isNotionAuthorized = !userQ.error && !!userQ.data?.nConnected;
	const dbsQ = useDBsQuery(isGoogleSetUp && isNotionAuthorized);
	const dbValidationQ = useDBValidateQuery(
		!userQ.isLoading && userQ.data?.databaseId,
	);
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

	// Auto select Notion database if only one is connected.
	// We don't check if it has valid schema at this point.
	// We validate later - we validate the one that is saved in the user record. For simplicity.
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

	if (dbsQ.isLoading || dbValidationQ.isLoading || userM.isPending) {
		return <Step state="not-connected" isLoading={true} />;
	}

	if (userQ.isError || userM.isError || dbsQ.isError) {
		return (
			<div className="w-full">
				<Step state="not-connected">
					<div className="pt-3">
						<Warning>
							Something wrong happened. Try reload the page and provide the
							missing info. If the problem persists, please {createGHIssue}
						</Warning>
					</div>
				</Step>
			</div>
		);
	}

	if (dbValidationQ.isError) {
		return (
			<div className="w-full">
				<Step state="in-progress">
					<div className="pt-3">
						<Warning>
							Something wrong happened. Try choose a different Notion database
							or reload the page. If the problem persists, please{' '}
							{createGHIssue}
						</Warning>
						<div className="mt-3">
							<a
								href="/notion-auth"
								className={clsx(
									buttonVariants({ variant: 'cta', class: 'ml-2', size: 'lg' }),
								)}
							>
								Amend Notion Connection
							</a>
						</div>
					</div>
				</Step>
			</div>
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
						<a
							href="/notion-auth"
							className={clsx(buttonVariants({ variant: 'cta', size: 'lg' }))}
						>
							Amend Notion Connection
						</a>
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
						<a
							href="/notion-auth"
							className={clsx(buttonVariants({ variant: 'cta', size: 'lg' }))}
						>
							Amend Notion Connection
						</a>
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
						<Warning>Some Unexpected error. Please {createGHIssue}</Warning>
					</div>
				</Step>
			);
		}
		return (
			<Step state="in-progress">
				<div className="pt-3">
					<Warning title="Warning">
						<div>
							The database "<span>{selectedDBName}</span>" needs configuration
							changes:
						</div>
						{dbValidationIssues.missingFields.length > 0 && (
							<div className="mt-1">
								- <span>Missing fields</span>: {/*  */}
								{dbValidationIssues.missingFields.map((field, index) => (
									<>
										"<span className="font-mono">{field}</span>"
										{index < dbValidationIssues.missingFields.length - 1
											? ', '
											: ''}
									</>
								))}
							</div>
						)}
						{dbValidationIssues.wrongStatusField && (
							<div>
								- "<span className="font-mono">Status</span>" field should have
								"<span className="font-mono">Done</span>" and "
								<span className="font-mono">To&nbsp;Do</span>" options.
							</div>
						)}

						<div className="mt-2 font-bold">Choose Your Action:</div>
						<div className="flex flex-col gap-2">
							<div className="flex">
								<div className="mx-2 text-4xl leading-5">•</div>
								<div>
									<div>
										change database configuration in Notion (
										<a
											className="underline"
											href="#"
											onClick={(e) => {
												e.preventDefault();
												setIsModalOpen(true);
											}}
										>
											see How
										</a>
										) and then:
									</div>
									<div>
										<Button
											variant="cta"
											onClick={() => dbValidationQ.refetch()}
											disabled={dbValidationQ.isFetching}
										>
											{dbValidationQ.isFetching && (
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											)}
											Reconnect
										</Button>
									</div>
								</div>
							</div>

							<div className="mt-1 flex">
								<div className="mx-2 text-4xl leading-5">•</div>
								<div>
									<div>
										<a
											href="/notion-auth"
											className={clsx(buttonVariants({ variant: 'outline' }))}
										>
											Choose Another Database
										</a>
									</div>
								</div>
							</div>
						</div>

						<div className="mt-2">
							Select the appropriate action to proceed with the synchronization
							process.
						</div>

						<Modal
							isOpen={isModalOpen}
							setIsModalOpen={setIsModalOpen}
							title="How to configure database fields"
						>
							<div style={{ padding: '65% 0 0 0', position: 'relative' }}>
								<iframe
									src="https://player.vimeo.com/video/904933059?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479"
									allow="autoplay; fullscreen; picture-in-picture"
									style={{
										position: 'absolute',
										top: 0,
										left: 0,
										width: '100%',
										height: '100%',
									}}
									title="How to configure Notion Database for Notion-Google Tasks Sync app (Copy)"
								></iframe>
							</div>
						</Modal>
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
								className={clsx(buttonVariants({ variant: 'outline' }), 'ml-2')}
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
					return 'Date';
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
