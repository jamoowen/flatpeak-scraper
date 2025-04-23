import { Result, err, ok } from "../lib/types";


export type HttpResponse = {
	status: number;
	statusText: string | null
	headers: Headers
	body: any
}

export interface HttpProcessor {
	get(url: string, headers: Record<string, string>): Promise<Result<HttpResponse, Error>>;
	post(url: string, headers: any, payload: any): Promise<Result<HttpResponse, Error>>;
}

export class HttpService {

	public async get(url: string, headers: Record<string, string>): Promise<Result<HttpResponse, Error>> {
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
				headers: res.headers,
				body,
			});
		} catch (e) {
			return err(new Error(`Failed to make GET to ${url}: ${(e as Error).message}`));
		}
	}

	public async post(url: string, headers: any, payload: any): Promise<Result<HttpResponse, Error>> {
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
				headers: res.headers,
				body
			})
		}
		catch (e) {
			return err(new Error(`Failed to make POST to ${url}: ${e}`))
		}
	}

}
