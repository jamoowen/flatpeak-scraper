import { get } from "../lib/http"
import { ScrapeConfig } from "../lib/types"

export class Scraper {
	private readonly config: Record<string, any>

	constructor(config: ScrapeConfig) {
		this.config = config
	}


	public async requestTempEmail() {
		const headers = this.config.headers
		headers.origin = this.config.tempMailBaseUrl
		headers.referer = this.config.tempMailBaseUrl
		const res = await get(this.config.tempMailBaseUrl, headers)
		if (!res.ok) {
			console.error()
		}
	}
}
