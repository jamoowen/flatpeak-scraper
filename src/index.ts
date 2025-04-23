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

	const imapEmail = process.env.GMAIL_EMAIL_ADDRESS
	const imapPassword = process.env.GMAIL_APP_PASSWORD
	const imapHost = "imap.gmail.com"
	const imapPort = 993

	const imapService = new ImapService(imapEmail, imapPassword, imapHost, imapPort)
	const scraper = new Scraper(config, imapService)

	const now = new Date()
	const otpReq = await scraper.requestOtp()
	logger.info("Waiting for email...")
	await sleep(10)
	const emailFilter = {
		fromDate: now
	}
	logger.info("fetching otp now...")
	const otpResp = await scraper.pollForOtp(10, emailFilter)

	logger.info(JSON.stringify(otpResp))



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
