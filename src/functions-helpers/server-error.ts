export class ServerError extends Error {
	originalMessage: string;
	constructor(message: string, originalError?: any) {
		const name = 'ServerError';
		const msg =
			`${name}: ${message}` +
			(originalError ? `\nCaused by: ${originalError?.message}` : '');
		super(msg);
		this.name = name;
		this.cause = originalError; // Storing the original error
		this.originalMessage = originalError?.message;
	}
}
