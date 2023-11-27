import { Icon } from '@iconify/react';

export default function Button({
	disabled = false,
	onClick = () => {},
	children,
	loading = false,
	size = 'normal',
	fullWidth = false,
}: {
	children: React.ReactNode;
	disabled?: boolean;
	loading?: boolean;
	onClick?: () => void;
	size?: 'normal' | 'small';
	fullWidth?: boolean;
}) {
	const padding = size === 'normal' ? 'py-2 px-4' : 'py-1 px-3';
	const fullWidthClass = fullWidth ? 'w-full flex justify-center' : '';
	const loadingItem = loading ? (
		<Icon
			icon="line-md:loading-twotone-loop"
			className="ml-3 text-2xl text-gray-200"
		/>
	) : null;
	if (disabled) {
		return (
			<button
				disabled
				className={`${padding} ${fullWidthClass} flex cursor-not-allowed rounded border border-transparent bg-blue-300 px-4 py-2 font-semibold text-white`}
			>
				{children}
				{loadingItem}
			</button>
		);
	}
	return (
		<button
			onClick={onClick}
			className={`${padding} ${fullWidthClass} cursor-pointer rounded border border-transparent bg-blue-500 font-semibold text-white hover:bg-blue-700`}
		>
			{children}
			{loadingItem}
		</button>
	);
}
