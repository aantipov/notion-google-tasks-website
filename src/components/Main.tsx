import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ConnectGoogle from '@/components/ConnectGoogle';
import ConnectNotion from '@/components/ConnectNotion';
import InitialSync from './InitialSync';

const queryClient = new QueryClient();

export default function Main(props: { hasToken: boolean }) {
	return (
		<QueryClientProvider client={queryClient}>
			<div className="mt-8 w-[80%] max-w-lg rounded-2xl border-4 border-gray-800 p-5">
				<ConnectGoogle hasToken={props.hasToken} />

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
