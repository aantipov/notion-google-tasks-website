import * as Sentry from '@sentry/browser';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toast/toaster';
import ConnectGoogle from '@/components/ConnectGoogle';
import ConnectNotion from '@/components/ConnectNotion';
import InitialSync from './InitialSync';
import ConnectSuccess from './ConnectSuccess';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

function AlertDestructive() {
	return (
		<Alert variant="destructive">
			<AlertCircle className="h-4 w-4" />
			<AlertTitle>Error</AlertTitle>
			<AlertDescription>
				An unexpected error occurred.
				<div>
					<Button
						onClick={() => {
							window.location.reload();
						}}
						variant="outline"
						size={'sm'}
					>
						Reload the page
					</Button>
				</div>
			</AlertDescription>
		</Alert>
	);
}

const queryClient = new QueryClient();

interface Props {
	children: ReactNode;
	fallback: ReactNode;
}

interface State {
	hasError: boolean;
	error?: Error;
	errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
	public state: State = { hasError: false };

	public static getDerivedStateFromError(_: Error): State {
		return { hasError: true };
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		this.setState({ error: error, errorInfo: errorInfo });
		Sentry.captureException(error);
	}

	render() {
		if (this.state.hasError) {
			return this.props.fallback;
		}

		return this.props.children;
	}
}

export default function Main(props: {
	hasToken: boolean;
	isFeatureEnabled: boolean;
}) {
	return (
		<ErrorBoundary fallback={<AlertDestructive />}>
			<QueryClientProvider client={queryClient}>
				<div className="notranslate mt-6 max-w-2xl sm:w-[80%]" translate="no">
					<ErrorBoundary fallback={<AlertDestructive />}>
						<ConnectGoogle hasToken={props.hasToken} />
					</ErrorBoundary>

					<div className="mt-8">
						<ErrorBoundary fallback={<AlertDestructive />}>
							<ConnectNotion hasToken={props.hasToken} />
						</ErrorBoundary>
					</div>

					<div className="sentry-mask mt-8">
						<ErrorBoundary fallback={<AlertDestructive />}>
							<InitialSync hasToken={props.hasToken} />
						</ErrorBoundary>
					</div>

					<div className="mt-12">
						<ErrorBoundary fallback={<AlertDestructive />}>
							<ConnectSuccess hasToken={props.hasToken} />
						</ErrorBoundary>
					</div>

					<Toaster />
				</div>
			</QueryClientProvider>
		</ErrorBoundary>
	);
}
