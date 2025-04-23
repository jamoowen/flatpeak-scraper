
// Result Types
export type Ok<T, E = never> = {
	ok: true
	value: T
}

export type Err<T = never, E = unknown> = {
	ok: false
	error: E
}

export type Result<T, E = unknown> = Ok<T, E> | Err<T, E>

// Ok Constructor
export function ok<T, E = never>(value: T): Ok<T, E> {
	return { ok: true, value }
}

// Err Constructor
export function err<T = never, E = unknown>(error: E): Err<T, E> {
	return { ok: false, error }
}

type FlatPeakInfo = {
	baseUrl: string;
	otpMaxPollAttempts: number;
	otpExpectedFromEmail: string
	otpRequestUrl: string;
	otpSubmitUrl: string;
	keysUrl: string;
	logoutUrl: string;
}

export type ScrapeConfig = {
	infiltrationEmail: string;
	flatPeakInfo: FlatPeakInfo;
	headers: Record<string, any>;
	[key: string]: any
}

export type EmailFilter = {
	fromDate: Date
	fromEmail?: string;
}

export type EmailDetails = {
	dateSent: Date;
	from: string;
	subject: string;
	message: string;
};



