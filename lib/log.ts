export class Logger {
	private static instance: Logger;

	private constructor() { }

	static getInstance(): Logger {
		if (!Logger.instance) {
			Logger.instance = new Logger();
		}
		return Logger.instance;
	}

	info(...args: unknown[]) {
		const timestamp = new Date().toISOString();
		console.log(`${timestamp} INFO`, ...args);
	}

	error(...args: unknown[]) {
		const timestamp = new Date().toISOString();
		console.error(`${timestamp} ERROR`, ...args);
	}
}

