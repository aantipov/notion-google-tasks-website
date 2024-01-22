import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toast/toaster';
import ConnectGoogle from '@/components/ConnectGoogle';
import ConnectNotion from '@/components/ConnectNotion';
import InitialSync from './InitialSync';
import ConnectSuccess from './ConnectSuccess';

const queryClient = new QueryClient();

export default function Main(props: {
	hasToken: boolean;
	isFeatureEnabled: boolean;
}) {
	return (
		<QueryClientProvider client={queryClient}>
			<div className="mt-6 max-w-2xl sm:w-[80%]">
				<ConnectGoogle hasToken={props.hasToken} />

				<div className="mt-8">
					<ConnectNotion hasToken={props.hasToken} />
				</div>

				<div className="mt-8">
					<InitialSync hasToken={props.hasToken} />
				</div>

				<div className="mt-12">
					<ConnectSuccess hasToken={props.hasToken} />
				</div>

				<Toaster />
			</div>
		</QueryClientProvider>
	);
}
