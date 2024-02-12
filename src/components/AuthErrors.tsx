import { useToast } from '@/components/ui/toast/use-toast';
import { useEffect } from 'react';

export default function AuthErrors() {
	const { toast } = useToast();

	useEffect(() => {
		const authErrorCookie = document.cookie
			.split('; ')
			.find((row) => row.startsWith('auth-error'));

		if (authErrorCookie) {
			const error = authErrorCookie.split('=')[1];
			document.cookie = 'auth-error=; Max-Age=0;';
			if (error === 'gaccess_denied' || error === 'naccess_denied') {
				const isGoogle = error === 'gaccess_denied';
				toast({
					variant: 'destructive',
					title: isGoogle
						? 'Google Connection Denied'
						: 'Notion Connection Denied',
					description: (
						<div>
							To use our synchronization service, you need to grant access to
							your <strong>Google Tasks</strong> and{' '}
							<strong>Notion database</strong>.
						</div>
					),
				});
			} else if (error === 'gaccess_error' || error === 'naccess_error') {
				const isGoogle = error === 'gaccess_error';
				toast({
					variant: 'destructive',
					title: isGoogle
						? 'Google Connection Error'
						: 'Notion Connection Error',
					description: (
						<div>
							To use our synchronization service, you need to grant access to
							both your Google Tasks and Notion database.
							<div className="mt-1">
								Please try again. If the problem persists, contact us{' '}
								<a
									href="mailto:info@notion-google-tasks-sync.com"
									target="_blank"
									className="underline"
								>
									via email
								</a>{' '}
								or{' '}
								<a
									href="https://github.com/aantipov/notion-google-tasks-website/issues"
									target="_blank"
									className="underline"
								>
									create an issue
								</a>{' '}
								on Github.
							</div>
						</div>
					),
				});
			}
		}
	}, []);

	return null;
}
