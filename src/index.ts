import { Logger } from "../lib/log"
import dotenv from 'dotenv';
import * as config from '../config.json'
import { Scraper } from "./scraper";

(async () => {
	dotenv.config()
	const logger = Logger.getInstance()
	logger.info("Starting scrape...")

	const scraper = new Scraper(config)
	console.log(`config: `, JSON.stringify(config))




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
