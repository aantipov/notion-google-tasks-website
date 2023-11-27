export default function ErrorComponent({
	children,
	title,
}: {
	children: React.ReactNode;
	title?: string;
}) {
	return (
		<div
			className="mx-auto mt-10 max-w-lg border-l-4 border-red-500 bg-red-100 p-6 text-red-700"
			role="alert"
		>
			{title && <h2 className="mb-2 font-bold">{title}</h2>}
			<div className="ml-3 mt-1">{children}</div>
		</div>
	);
}
