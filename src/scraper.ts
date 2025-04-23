import { subscribe } from "diagnostics_channel"
import { ImapService } from "../lib/email"
import { get, post } from "../lib/http"
import { Logger } from "../lib/log"
import { EmailFilter, err, ok, Result, ScrapeConfig, EmailDetails } from "../lib/types"
import { sleep } from "../lib/utils"

export class Scraper {
	private readonly config: ScrapeConfig
	private readonly imapService: ImapService
	private readonly logger: Logger

	constructor(config: ScrapeConfig, imapService: ImapService) {
		this.config = config
		this.imapService = imapService
		this.logger = Logger.getInstance()
	}



	public async infiltrateFlatPeak(): Promise<Result<any, Error>> {

		//const otpSentTimestamp = new Date()
		const otpSentTimestamp = new Date("2025-04-23:14:07")
		this.logger.info(`Requesting OTP`)
		//
		//const otpReq = await this.requestFlatPeakOtp()
		//if (!otpReq.ok) {
		//	return otpReq
		//}

		const pollAttempts = this.config.flatPeakInfo.otpMaxPollAttempts
		const expectedSenderAddress = this.config.flatPeakInfo.otpExpectedFromEmail
		this.logger.info("Starting polling for OTP")
		const otpEmail = await this.pollForOtp(pollAttempts, otpSentTimestamp, expectedSenderAddress)
		this.logger.info(`Finished polling for OTP`)
		if (otpEmail.ok === false) {
			return otpEmail
		}
		if (otpEmail.value == null) {
			return err(new Error(`Could not find OTP from ${expectedSenderAddress}`))
		}
		console.log(`OTP email: `, otpEmail.value)
		const otpLine = otpEmail.value.message
			.split("\n")
			.find(line => line.includes("your one-time code"))
		if (otpLine == null) {
			return err(new Error("Couldnt find OTP line within OTP email"))
		}
		const otp = otpLine.split(" ")[0]
		return ok(otp)
		// 1: request otp
		// 1: 
	}


	private async requestFlatPeakOtp(): Promise<Result<any, Error>> {
		const res = await get(this.config.flatPeakUrls.otpRequest, this.config.headers)
		if (res.ok === false) {
			return err(new Error(`Failed to request OTP: ${res.error.message}`))
		}
		return res
	}


	public async pollForOtp(attempts: number, earliestEmailToFind: Date, senderAddress: string): Promise<Result<EmailDetails, Error>> {
		await this.imapService.connect()
		let remainingAttempts = attempts
		let otp = null
		while (remainingAttempts > 0) {
			//the imap date filter only works on date, not time so we need to filter further
			const emailsFromToday = await this.imapService.getEmailsSince(earliestEmailToFind)
			if (emailsFromToday.ok === false) {
				return emailsFromToday
			}
			const otpEmails = emailsFromToday.value
				.filter(e => e.from.includes(senderAddress))
				.filter(e => e.dateSent > earliestEmailToFind)
				.sort((a, b) => a.dateSent.getTime() - b.dateSent.getTime())
			if (otpEmails.length > 0) {
				otp = otpEmails.pop()
				break
			}
			await sleep(5)
		}
		this.imapService.disconnect()
		return ok(otp)
	}



}
