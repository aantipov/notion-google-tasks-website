import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Props {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
	confirmCb: () => Promise<void>;
	children: React.ReactNode;
}

export default function ModalConfirm({
	isOpen,
	setIsOpen,
	confirmCb,
	children,
}: Props) {
	return (
		<AlertDialog onOpenChange={setIsOpen} open={isOpen}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
					<AlertDialogDescription>{children}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={() => confirmCb()}>
						Continue
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
