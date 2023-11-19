import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ConnectGoogle from '@/components/ConnectGoogle';
import ConnectNotion from '@/components/ConnectNotion';
import InitialSync from './InitialSync';

const queryClient = new QueryClient();

export default function Main(props: {
	hasToken: boolean;
	isFeatureEnabled: boolean;
}) {
	return (
		<QueryClientProvider client={queryClient}>
			<div className="mt-8 w-[80%] max-w-xl rounded-xl border-2 border-gray-200 p-8">
				<ConnectGoogle
					hasToken={props.hasToken}
					isFeatureEnabled={props.isFeatureEnabled}
				/>

				<div className="mt-5">
					<ConnectNotion hasToken={props.hasToken} />
				</div>

				<div className="mt-5">
					<InitialSync hasToken={props.hasToken} />
				</div>
			</div>
		</QueryClientProvider>
	);
}
