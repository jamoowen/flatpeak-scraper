import { Result, err, ok } from "../lib/types";


export type HttpResponse = {
	status: number;
	statusText: string | null
	body: any
}

export async function post(url: string, headers: any, payload: any): Promise<Result<HttpResponse, Error>> {
	try {
		const res = await fetch(url, {
			method: 'POST',
			headers,
			body: typeof payload === 'string' ? payload : JSON.stringify(payload),
		});

		const contentType = res.headers.get('content-type') || '';
		let body: unknown;

		if (contentType.includes('application/json')) {
			body = await res.json();
		} else {
			// fallback
			body = await res.text();
		}

		return ok({
			status: res.status,
			statusText: res.statusText ?? null,
			body
		})

	}
	catch (e) {
		return err(new Error(`Failed to make POST to ${url}: ${e}`))
	}
}


export async function get(url: string, headers: Record<string, string>): Promise<Result<HttpResponse, Error>> {
	try {
		const res = await fetch(url, {
			method: 'GET',
			headers,
		});

		const contentType = res.headers.get('content-type') || '';

		let body: unknown;

		if (contentType.includes('application/json')) {
			body = await res.json();
		} else {
			// fallback
			body = await res.text();
		}

		return ok({
			status: res.status,
			statusText: res.statusText ?? null,
			body,
		});

	} catch (e) {
		return err(new Error(`Failed to make GET to ${url}: ${(e as Error).message}`));
	}
}
