import { ImapProcessor } from "../lib/email";
import { EmailDetails, ok, ScrapeConfig } from "../lib/types";
import { FlatPeakInfiltrator } from "./infiltrator";

//I would generally write more tests, but i felt code coverage might be out of scope in this exercise
describe('FlatPeakInfiltrator', () => {
	let imapService: ImapProcessor;
	let httpService: MockHttpService;
	let infiltrator: FlatPeakInfiltrator;
	let config: ScrapeConfig

	beforeAll(() => {
		imapService = getMockImapService()
		httpService = getMockHttpService()
		config = getConfig()
		infiltrator = new FlatPeakInfiltrator(config, imapService, httpService)
	})

	beforeEach(() => { })

	describe('extractOtpFromEamil ', () => {
		it('It should return the otp if email in expected format', () => {
			const email: EmailDetails = {
				dateSent: new Date(),
				from: "",
				message: `Your login request to FlatPeak
466186 is your one-time code to log in to your account. Your code expires in 2 minutes.`,
				subject: ""
			}
			const otp = infiltrator.extractOtpFromEmail(email)
			if (otp.ok === false) {
				throw new Error()
			}
			expect(otp.ok).toEqual(true)
			expect(otp.value).toEqual("466186")
		})
	})
	describe('submitOtp', () => {
		it('Should correctly parse the jwt returned in the cookie', async () => {
			httpService.post.mockResolvedValue(ok(getResponseWithCookieInHeader()))
			const jwt = await infiltrator.submitOtp("dummyOtp", "dummyMethodId")
			if (jwt.ok === false) {
				console.log(jwt.error)
				throw new Error()
			}
			expect(jwt.ok).toEqual(true)
			expect(jwt.value).toContain("eyJhbGciOiJSUzI1NiIsImtpZCI6Imp3ay1saXZlLTNhY2ExMTFmLTlkMjQtNGIxOC1hZmE1LWJkMWRlNjVhYTE5YiIsInR5cCI6IkpXVCJ9")
		})
	})


})

function getConfig(additionalConfig?: any) {
	return {
		flatPeakInfo: {
			otpRequestUrl: 'https://fake-otp-request.com',
			otpSubmitUrl: 'https://fake-submit.com',
			keysUrl: 'https://fake-keys.com?batch=1',
			otpExpectedFromEmail: 'otp@example.com',
			otpMaxPollAttempts: 3,
		},
		headers: {},
		...additionalConfig
	}
}


const getMockImapService = (): jest.Mocked<ImapProcessor> => ({
	connect: jest.fn(),
	disconnect: jest.fn(),
	getEmailsSince: jest.fn()
})

type MockHttpService = {
	get: jest.Mock<any, any>
	post: jest.Mock<any, any>
}

const getMockHttpService = (): MockHttpService => ({
	get: jest.fn(),
	post: jest.fn(),
})

function getResponseWithCookieInHeader() {
	return {
		status: 200,
		headers: new Headers({
			"set-cookie": "session_jwt=eyJhbGciOiJSUzI1NiIsImtpZCI6Imp3ay1saXZlLTNhY2ExMTFmLTlkMjQtNGIxOC1hZmE1LWJkMWRlNjVhYTE5YiIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsicHJvamVjdC1saXZlLTZiYjU1MzhmLTZjNWYtNGI5Yi1iMTE5LTEzMzgzZGQ1MmRhYyJdLCJlbWFpbCI6ImphbWVzQGphbWVzc2RldnByb2plY3RzLnh5eiIsImV4cCI6MTc0NTQzMzY2MiwiaHR0cHM6Ly9zdHl0Y2guY29tL3Nlc3Npb24iOnsiaWQiOiJzZXNzaW9uLWxpdmUtZDQ4Nzg2YmUtMGUyMC00ZTEwLTliMTMtNTEzNDIzNGMwMTU5Iiwic3RhcnRlZF9hdCI6IjIwMjUtMDQtMjNUMTg6MzY6MDJaIiwibGFzdF9hY2Nlc3NlZF9hdCI6IjIwMjUtMDQtMjNUMTg6MzY6MDJaIiwiZXhwaXJlc19hdCI6IjIwMjUtMDUtMjNUMTg6MzY6MDJaIiwiYXR0cmlidXRlcyI6eyJ1c2VyX2FnZW50IjoiIiwiaXBfYWRkcmVzcyI6IiJ9LCJhdXRoZW50aWNhdGlvbl9mYWN0b3JzIjpbeyJ0eXBlIjoib3RwIiwiZGVsaXZlcnlfbWV0aG9kIjoiZW1haWwiLCJsYXN0X2F1dGhlbnRpY2F0ZWRfYXQiOiIyMDI1LTA0LTIzVDE4OjM2OjAyWiIsImVtYWlsX2ZhY3RvciI6eyJlbWFpbF9pZCI6ImVtYWlsLWxpdmUtNzI4YzlkNzgtZTY1OC00ODY5LTk1YmUtMzE4YjU1YTY0MDkyIiwiZW1haWxfYWRkcmVzcyI6ImphbWVzQGphbWVzc2RldnByb2plY3RzLnh5eiJ9fV19LCJpYXQiOjE3NDU0MzMzNjIsImlzcyI6InN0eXRjaC5jb20vcHJvamVjdC1saXZlLTZiYjU1MzhmLTZjNWYtNGI5Yi1iMTE5LTEzMzgzZGQ1MmRhYyIsIm5iZiI6MTc0NTQzMzM2MiwicmVmZXJlbmNlX2lkIjoidXNlci1saXZlLTEyN2U4YTk5LTQyMmYtNGMxZC04YjY2LWM3NWJhM2Y3OTc5YiIsInN1YiI6InVzZXItbGl2ZS0xMjdlOGE5OS00MjJmLTRjMWQtOGI2Ni1jNzViYTNmNzk3OWIifQ.iv7NcPJ9Gm2-S1pms377ImBYdDZZBlM4HzlV5G33jqTvoVuhM6AppNvOiGk-2PrYY9bxts2zKAybt9PE1UEkpwGg2rwaa-FSl_AYjvFAUgQQ4zuzkXrqPZA507yL-Qv0acF81y4pFczHVmR1o-zrgPMtcrsoW5GAW6o83P6cxWunySgb2OpdprEcDS45Fsc2nIVxgMut2wZQgq-qxriaoLBbYqOT4-wD4e9KwZ7VZ5Qid3FNevxSWXciyuvXpeMYJpKaxbglP0YrflZRHWHiYE4HHxuY58POH_f1CbN3nL2z7OlFSR4umauP0zbAUoMoN5Iea1N6tK2FeRnYek7qjw; Path=/; Expires=Fri, 23 May 2025 18:36:03 GMT; Max-Age=2592000; Secure; HttpOnly; SameSite=strict"
		})
	}
}
