import { ImapService } from "../lib/email"
import { get, post } from "../lib/http"
import { EmailFilter, err, ok, Result, ScrapeConfig } from "../lib/types"

export class Scraper {
	private readonly config: ScrapeConfig
	private readonly imapService: ImapService

	constructor(config: ScrapeConfig, imapService: ImapService) {
		this.config = config
		this.imapService = imapService
	}


	public async requestOtp(): Promise<Result<any, Error>> {
		return ok(null)
	}

	public async pollForOtp(attempts: number, filter: EmailFilter): Promise<Result<any, Error>> {
		await this.imapService.connect()
		//1 min ago
		const now = Date.now() - 60 * 1000
		const otp = await this.imapService.getEmailsSince(new Date(now))
		this.imapService.disconnect()
		return otp

	}



}
