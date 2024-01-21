import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';

interface Props {
	setIsModalOpen: (isModalOpen: boolean) => void;
	isOpen: boolean;
	title: string;
	children: React.ReactNode;
}

export default function Modal({
	setIsModalOpen,
	isOpen,
	title,
	children,
}: Props) {
	return (
		<Dialog open={isOpen} onOpenChange={setIsModalOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{children}</DialogDescription>
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);
}
