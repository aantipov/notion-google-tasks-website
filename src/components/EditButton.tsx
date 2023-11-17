export function EditButton(props: { onClick?: () => void; href?: string }) {
	const svgIcon = (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			className="h-6 w-6"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
			/>
		</svg>
	);

	if (props.onClick) {
		return (
			<button
				onClick={props.onClick}
				className="flex rounded-lg bg-yellow-500 p-1 text-white transition-all duration-300 hover:rounded-3xl hover:bg-yellow-600"
			>
				{svgIcon}
			</button>
		);
	}
	if (props.href) {
		return (
			<a
				href={props.href}
				className="flex rounded-lg bg-yellow-500 p-1 text-white transition-all duration-300 hover:rounded-3xl hover:bg-yellow-600"
			>
				{svgIcon}
			</a>
		);
	}
	return null;
}
