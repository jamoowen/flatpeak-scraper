import { ImapProcessor } from "../lib/email"
import { HttpProcessor } from "../lib/http"
import { Logger } from "../lib/log"
import { err, ok, Result, ScrapeConfig, EmailDetails } from "../lib/types"
import { sleep } from "../lib/utils"

export class FlatPeakInfiltrator {
	private readonly imapService: ImapProcessor
	private readonly httpService: HttpProcessor
	private readonly config: ScrapeConfig
	private readonly logger: Logger

	constructor(config: ScrapeConfig, imapService: ImapProcessor, httpService: HttpProcessor) {

		this.imapService = imapService
		this.httpService = httpService
		this.config = config
		this.logger = Logger.getInstance()
	}

	//this function coordinates all of the scraping
	public async infiltrateFlatPeak(): Promise<Result<any, Error>> {
		const otpSentTimestamp = new Date()

		this.logger.info(`Requesting OTP...`)
		const methodId = await this.requestOtp(this.config.infiltrationEmail)
		if (methodId.ok === false) {
			return methodId
		}
		this.logger.info("OTP successfully requested.")

		const emailPollAttempts = this.config.flatPeakInfo.otpMaxPollAttempts
		const expectedSenderAddress = this.config.flatPeakInfo.otpExpectedFromEmail
		const otpEmail = await this.pollForOtp(emailPollAttempts, otpSentTimestamp, expectedSenderAddress)

		if (otpEmail.ok === false) {
			return otpEmail
		}

		this.logger.info(`Extracting OTP from email...`)
		const otp = this.extractOtpFromEmail(otpEmail.value)
		if (otp.ok === false) {
			return otp
		}
		this.logger.info("OTP successfully extracted from email.")

		this.logger.info(`Submitting OTP...`)
		const jwt = await this.submitOtp(otp.value, methodId.value)
		if (jwt.ok === false) {
			return jwt
		}
		this.logger.info("OTP successfully submitted.")
		await sleep(5)

		this.logger.info(`Grabbing keys...`)
		const keys = await this.grabKeys(jwt.value)
		if (keys.ok === false) {
			return keys
		}
		this.logger.info(`Keys successfully retrieved.`)
		await sleep(2)

		this.logger.info("Signing out...")
		const signOut = await this.signOut(jwt.value)
		if (signOut.ok === false) {
			this.logger.error(`Failed to sign out: ${signOut.error}`)

		} else this.logger.info("Successfully signed out.")

		return ok(keys.value)
	}

	private async requestOtp(email: string): Promise<Result<string, Error>> {
		const headers = { ...this.config.headers }
		const url = this.config.flatPeakInfo.baseUrl + this.config.flatPeakInfo.otpRequestUrl
		const payload = {
			0: {
				json: {
					email,
				}
			}
		}

		const res = await this.httpService.post(url, headers, payload)
		if (res.ok === false) {
			return err(new Error(`Failed to request OTP: ${res.error.message}`))
		}
		const body = res.value.body
		if (!Array.isArray(body) || body.length < 1) {
			return err(new Error("Unexpected body from otp request response"))
		}
		const methodId = body[0].result.data.json.methodId
		if (!methodId) {
			return err(new Error("Failed to extract methodId from response"))
		}
		return ok(methodId)
	}

	//left public for testing
	public extractOtpFromEmail(email: EmailDetails): Result<string, Error> {
		const line = email.message
			.split("\n")
			.find(line => line.includes("your one-time code"))
		if (line == null) {
			return err(new Error("Couldnt find OTP line within OTP email"))
		}
		const otp = line.split(" ")[0]
		if (otp.length < 5) {
			return err(new Error("Couldnt find OTP within line"))
		}
		return ok(otp)
	}


	public async pollForOtp(maxAttempts: number, earliestEmailToFind: Date, senderAddress: string): Promise<Result<EmailDetails, Error>> {
		await this.imapService.connect()
		const connected = await this.imapService.connect()
		if (connected.ok === false) {
			return connected
		}
		let otp = null
		for (let i = 0; i < maxAttempts; i++) {
			this.logger.info(`Polling email for OTP. attempt: ${i + 1}`)
			await sleep(5)
			//the imap date filter only works on date, not time so we need to filter further
			const emailsFromToday = await this.imapService.getEmailsSince(earliestEmailToFind)
			if (emailsFromToday.ok === false) {
				this.imapService.disconnect()
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
		}
		this.imapService.disconnect()
		if (otp == null) {
			return err(new Error(`Exausted email polling attempts... Could not find OTP from ${senderAddress}`))
		}
		return ok(otp)
	}

	public async submitOtp(otp: string, methodId: string): Promise<Result<string, Error>> {
		const payload = {
			0: {
				json: {
					code: otp,
					methodId
				}
			}
		}
		const headers = { ...this.config.headers }
		//headers.referer = "https://dashboard.flatpeak.com/otp?id=email-live-728c9d78-e658-4869-95be-318b55a64092&value=james%40jamessdevprojects.xyz"
		const url = this.config.flatPeakInfo.baseUrl + this.config.flatPeakInfo.otpSubmitUrl
		const res = await this.httpService.post(url, headers, payload)
		if (res.ok === false) {
			return err(new Error(`Failed to request OTP: ${res.error.message}`))
		}
		if (res.value.status !== 200) {
			return err(new Error(`Bad response from ${url}: ${res.value.status}`))
		}
		const rawCookie = res.value.headers.get('set-cookie')
		const jwt = rawCookie?.match(/session_jwt=([^;]+)/)?.[1];
		if (!jwt || jwt.length < 10) {
			return err(new Error(`Failed to parse JWT from cookie`))
		}
		return ok(jwt)
	}

	public async grabKeys(jwt: string): Promise<Result<{ testKey: string; liveKey: string }, Error>> {
		const headers = { ...this.config.headers }
		headers.cookie = `session_jwt=${jwt}`
		const encodedInput = encodeURIComponent(JSON.stringify({
			0: { json: null, meta: { values: ["undefined"] } },
			1: { json: null, meta: { values: ["undefined"] } },
		}));

		const url = this.config.flatPeakInfo.baseUrl + this.config.flatPeakInfo.keysUrl + "&input=" + encodedInput
		const batchResponse = await this.httpService.get(url, headers)
		if (batchResponse.ok === false) {
			return err(new Error(`Failed to request OTP: ${batchResponse.error.message}`))
		}
		if (batchResponse.value.status !== 200) {
			return err(new Error(`Bad response from ${url}: ${batchResponse.value.status}`))
		}
		if (!Array.isArray(batchResponse.value.body) || batchResponse.value.body.length < 1) {
			return err(new Error(`No items returned from keys request`))
		}
		const keysResponse = batchResponse.value.body.find(item =>
			Array.isArray(item?.result?.data?.json) &&
			item.result.data.json[0]?.key
		);
		if (!keysResponse) {
			return err(new Error("No valid keys response found"));
		}
		const keys = keysResponse.result.data.json
		if (!Array.isArray(keys) || keys.length < 1) {
			return err(new Error(`No items returned from keys request`))
		}
		const testKey = keys.find(k => k.live_mode === false)?.key
		const liveKey = keys.find(k => k.live_mode === true)?.key
		return ok({ testKey, liveKey })

	}

	public async signOut(jwt: string): Promise<Result<void, Error>> {
		const headers = { ...this.config.headers }
		headers.cookie = `session_jwt=${jwt}`
		const payload = {
			"0": {
				json: null,
				meta: {
					values: ["undefined"],
				},
			},
		};

		const url = this.config.flatPeakInfo.baseUrl + this.config.flatPeakInfo.logoutUrl
		const res = await this.httpService.post(url, headers, payload)
		if (res.ok === false) {
			return res
		}
		return ok(undefined)

	}



}
