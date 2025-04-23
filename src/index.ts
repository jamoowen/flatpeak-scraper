// src/handler.ts
import { Logger } from "../lib/log"
import dotenv from 'dotenv';
import * as baseConfig from '../config.json'
import { FlatPeakInfiltrator } from "./infiltrator";
import { ImapService } from "../lib/email";
import { HttpService } from "../lib/http";
import { ScrapeConfig } from "../lib/types";

dotenv.config()

export const handler = async (event: any = {}): Promise<any> => {
	const logger = Logger.getInstance()
	logger.info("Infiltration mission started: GRAB SOME KEYS")

	const imapEmail = process.env.IMAP_EMAIL_ADDRESS
	const imapPassword = process.env.IMAP_PASSWORD
	const imapHost = process.env.IMAP_HOST
	const imapPort = process.env.IMAP_PORT
	const infiltrationEmail = process.env.INFILTRATION_EMAIL

	const config: ScrapeConfig = {
		...baseConfig,
		infiltrationEmail
	}

	const imapService = new ImapService(imapEmail, imapPassword, imapHost, +imapPort)
	const httpService = new HttpService()
	const scraper = new FlatPeakInfiltrator(config, imapService, httpService)

	const keys = await scraper.infiltrateFlatPeak()
	if (keys.ok === false) {
		logger.error(`Mission failed. We'll get em next time. `, keys.error)
		return {
			statusCode: 500,
			body: JSON.stringify({ error: keys.error.message }),
		}
	}
	logger.info(`Mission success: `, keys.value)
	return {
		statusCode: 200,
		body: JSON.stringify(keys.value),
	}
}
