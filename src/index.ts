import { Logger } from "../lib/log"
import dotenv from 'dotenv';
import * as config from '../config.json'
import { Scraper } from "./scraper";
import { ImapService } from "../lib/email";
import { sleep } from "../lib/utils";

(async () => {
	dotenv.config()
	const logger = Logger.getInstance()
	logger.info("Starting scrape...")

	const imapEmail = process.env.IMAP_EMAIL_ADDRESS
	const imapPassword = process.env.IMAP_PASSWORD
	const imapHost = process.env.IMAP_HOST
	const imapPort = process.env.IMAP_PORT

	const imapService = new ImapService(imapEmail, imapPassword, imapHost, +imapPort)
	const scraper = new Scraper(config, imapService)

	const stuff = await scraper.infiltrateFlatPeak()
	logger.info(JSON.stringify(stuff))

	/// request temp email
	//
	//inject token into request so we can poll for new messages
	//
	//request otp from flatpeak
	//
	//send their otp to server and gain access
	//
	//extract an api key
	//
	//



})()
