import { Result, err, ok } from "../lib/types";

export async function post(url: string, headers: any, body: any): Promise<Result<any, Error>> {
	try {
		const res = await fetch(url, {
			method: 'POST',
			headers,
			body: typeof body === 'string' ? body : JSON.stringify(body),
		});
		return ok(res)
	}
	catch (e) {
		return err(new Error(`Failed to make POST to ${url}: ${e}`))
	}
}

export async function get(url: string, headers: any): Promise<Result<any, Error>> {
	try {
		const res = await fetch(url);
		const data = await res.text();
		return ok(data);
	}
	catch (e) {
		return err(new Error(`Failed to make GET to ${url}: ${e}`))
	}
}
