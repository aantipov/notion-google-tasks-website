export default function Warning({ children }: { children: React.ReactNode }) {
	return (
		<div
			className="mx-auto max-w-lg border-l-4 border-yellow-500 bg-yellow-100 p-3 text-base text-yellow-700"
			role="alert"
		>
			<div className="ml-3 mt-1">{children}</div>
		</div>
	);
}
