import Imap from "node-imap";
import { simpleParser, ParsedMail } from "mailparser";
import { Result, err, ok } from "../lib/types"

type SimplifiedEmail = {
	dateSent: Date;
	from: string;
	subject: string;
	message: string;
};



export class ImapService {
	private readonly imap: Imap;
	private isConnected: boolean = false;

	constructor(user: string, password: string, host: string, port: number) {
		this.imap = new Imap({
			user,
			password,
			host,
			port,
			tls: true,
		});
	}

	public connect(): Promise<void> {
		if (this.isConnected) return Promise.resolve();

		return new Promise((resolve, reject) => {
			this.imap.once("ready", () => {
				this.isConnected = true;
				resolve();
			});
			this.imap.once("error", reject);
			this.imap.connect();
		});
	}

	public disconnect(): void {
		if (this.isConnected) {
			this.imap.end();
			this.isConnected = false;
		}
	}

	public async getEmailsSince(fromDate: Date): Promise<Result<SimplifiedEmail[], Error>> {
		if (!this.isConnected) {
			return err(new Error("IMAP is not connected"));
		}

		const rawEmails = await this.getEmailData(fromDate); // however you're getting them
		if (rawEmails.ok === false) {
			return rawEmails
		}
		const simplifiedEmails: SimplifiedEmail[] = rawEmails.value.map(email => ({
			dateSent: new Date(email.date),
			from: email.from?.text ?? '', // or `.value[0].address` if that's your structure
			subject: email.subject ?? 'no subject',
			message: email.text ?? 'no text in email', // fallback in case one is missing
		}));

		return ok(simplifiedEmails);
	}

	// very messy, refactor needed
	public async getEmailData(fromDate: Date): Promise<Result<ParsedMail[], Error>> {
		if (!this.isConnected) {
			return err(new Error("IMAP is not connected"));
		}

		return new Promise<Result<ParsedMail[], Error>>((resolve) => {
			this.imap.openBox("INBOX", true, (error, _box) => {
				if (error) return resolve(err(error));

				const searchCriteria = [["SINCE", fromDate]];
				const fetchOptions = { bodies: "", markSeen: false };

				this.imap.search(searchCriteria, (searchError, results) => {
					if (searchError) return resolve(err(searchError));
					if (!results.length) return resolve(ok([]));

					const parsedMails: ParsedMail[] = [];
					let pending = results.length;

					const f = this.imap.fetch(results, fetchOptions);

					f.on("message", (msg) => {
						let buffer = "";
						msg.on("body", (stream) => {
							stream.on("data", (chunk) => {
								buffer += chunk.toString("utf8");
							});
							stream.once("end", async () => {
								try {
									const mail = await simpleParser(buffer);
									parsedMails.push(mail);
									if (--pending === 0) resolve(ok(parsedMails));
								} catch (parseError) {
									resolve(err(parseError as Error));
								}
							});
						});
					});

					f.once("error", (fetchError) => {
						resolve(err(fetchError));
					});
				});
			});
		});
	}
}
