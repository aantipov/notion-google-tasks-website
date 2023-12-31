export default function Warning({
	children,
	title,
}: {
	children: React.ReactNode;
	title?: string;
}) {
	return (
		<div
			className="max-w-lg border-l-4 border-yellow-500 bg-yellow-100 p-3 text-base text-yellow-700"
			role="alert"
		>
			{title && <h2 className="mb-2 font-bold">{title}</h2>}
			<div className="ml-3 mt-1">{children}</div>
		</div>
	);
}
