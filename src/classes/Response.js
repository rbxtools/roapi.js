import { Response, Headers } from "node-fetch"

const emptyHeaders = new Headers

export class BaseRequested {
	constructor(req = {method: 'GET', headers: {}, requestType: 'http'}, startUrl = req.url) {
		this.method = req.method ?? 'GET'
		this.url = startUrl

		this.requestHeaders = new Headers(req.headers)
		this.requestBody = req.body
		this.requestParams = req
		this.requestType = req.requestType ?? 'http'
	}
	/** @returns {this is BaseResponse} */
	isResponse() {
		return this instanceof BaseResponse
	}
	/** @returns {this is RobloxResponse} */
	isHttp() {
		return this instanceof RobloxResponse
	}
	/** @returns {this is DownloadResponse} */
	isDownload() {
		return this instanceof DownloadResponse
	}
	[Symbol.for('nodejs.util.inspect.custom')]() {
		return `${this.requestType}Request: ${this.method} ${this.url}`
	}
}

export class BaseResponse extends BaseRequested {
	/**
	 * @param {Response|FetchError} res 
	 * @param {string|NodeJS.ReadableStream} body
	 * @param {RequestParams} [req]
	 * @param {string} [startUrl]
	 */
	constructor(res, body, req, startUrl) {
		super(req, startUrl)
		const httpSuccess = res instanceof Response
		this.ok = httpSuccess ? res.ok : false
		this.status = httpSuccess ? res.status : -1
		this.statusText = httpSuccess ? res.statusText : res.code
		this.body = body
		this.headers = httpSuccess ? res.headers : emptyHeaders
		this.redirectedTo = res.redirected ? res.url : undefined

		/** @type {Response?} */
		this.fetchResult = httpSuccess ? res : undefined
		/** @type {FetchError?} */
		this.fetchError = !httpSuccess ? res : undefined
	}
	[Symbol.for('nodejs.util.inspect.custom')]() {
		return `${this.requestType}Response: ${this.method} ${this.url} -> ${this.status} ${this.statusText}`
	}
}

function parseError(err) {
	if (err == null) {
		return undefined
	} else if (typeof err == 'string') {
		return {code: -1, message: err, userFacingMessage: 'Something went wrong'}
	} else if (typeof err == 'number') {
		return {code: err, message: `Something went wrong (Code: ${err})`, userFacingMessage: err}
	} else if (err.message) {
		let message = err.message ?? 'Something went wrong'
		if (message.startsWith('Status(')) {
			[,message] = message.match(/Detail="([^"\\]*(?:\\.[^"\\]*)*)"/) ?? [message,message]
		}
		return {code: err.code ?? -1, message, userFacingMessage: err.userFacingMessage ?? 'Something went wrong'}
	}
}

function getErrors(json) {
	if (json.errors) {
		return json.errors.map(parseError)
	} else if (json.rejectedParticipants) {
		return json.errors.map(entry => {
			const message =  `Couldn't add @${entry.name ?? entry.targetId}: ${entry.rejectedReason}`
			return {code: -1, message, userFacingMessage: message}
		})
	} else {
		return json
	}
}

export class RobloxResponse extends BaseResponse {
	/**
	 * @param {Response} res 
	 * @param {string} body
	 * @param {RequestParams} [req]
	 * @param {string} [startUrl]
	 */
	constructor(res, body, req, startUrl) {
		super(res, body, req, startUrl)
		/** @type {string} */
		this.body;
		try {
			this.json = JSON.parse(body)
			if (Array.isArray(this.json?.errors)) {
				this.errors = getErrors(this.json)
				this.errorMessages = this.errors.map(error => error.message?.replace(/[.!?,;]$/, '') || 'Something went wrong').join(', ')
			} else {
				this.errorMessages = !this.ok ? body : ''
				this.errors = !this.ok ? [{code: -1, message: body, userFacingMessage: 'Something went wrong'}] : []
			}
		} catch(err) {
			this.json = body
			if (!this.ok) {
				this.errorMessages = body
				this.errors = [{code: -1, message: body, userFacingMessage: 'Something went wrong'}]
			}
		}
	}
}

export class DownloadResponse extends BaseResponse {
	/**
	 * @param {Response} res 
	 * @param {RequestParams} [req]
	 * @param {string} [startUrl]
	 */
	constructor(res, req, startUrl) {
		super(res, res.body, req, startUrl)
		/** @type {NodeJS.ReadableStream} */
		this.body;
	}
}

export class RequestError extends Error {
	name = 'RequestError'
	/**
	 * @param {BaseResponse} response 
	 */
	constructor(response) {
		super(response.errorMessages ?? `${response.status} ${response.statusText}`)
		/** @type {BaseResponse} */
		this.response = response
		/** @type {string} */
		this.url = response.url
	}
	toString() {
		return `Request to ${this.url} failed: ${this.message}`
	}
}