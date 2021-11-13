// similar to Page, but uses numeric page indexes

import { Base } from "./Base.js"

/** @typedef {(collection: Collection) => string|number|null} PageFunc */

/**
 * @typedef CollectionOptions
 * @prop {PageFunc} nextPageFunc - function that returns the next page number, or null if it doesn't exist
 * @prop {PageFunc} prevPageFunc - function that returns the previous page number, or null if it doesn't exist
 * @prop {(value: any) => any} [mapFunc] - function to call with Array.map on the value
 * @prop {(value: any) => any} [modFunc] - function that modifies the value before returning it
 * @prop {string} [cursorName='cursor'] - The name of the cursor to pass in the request url
 * @prop {import('./Request').RequestParams} [requestParams] - The request parameters to pass to node-fetch
 * @prop {string} currentCursor - The starting cursor value - will typically be "" or 0
 */

/** @template ContentType,ModContents */
export class Collection extends Base {
	mapFunc = value => value
	modFunc = value => value
	cursorName = 'cursor'

	/**
	 * @param {string} url 
	 * @param {any} body 
	 * @param {import('./Client').Client} client 
	 * @param {CollectionOptions} options 
	 */
	constructor(url, body, client, options) {
		super(client)
		this.cursorName = options.cursorName ?? 'cursor'
		this.nextPageFunc = options.nextPageFunc
		this.previousPageFunc = options.previousPageFunc
		this.mapFunc = options.mapFunc ?? this.mapFunc
		this.modFunc = options.modFunc ?? this.modFunc
		this.url = url.replace(new RegExp(`${this.cursorName}=[\\w\\d-.]+(\\?|\\&|$)`, 'g'), '')
		/** @type {RequestO} */
		this.params = options.requestParams
		/** @type {CollectionOptions} */
		this.options = options
		/** @type {ContentType} */
		this.body = body

		/** @type {ModContents} */
		this.contents = this.modFunc(this.body)
		if (Array.isArray(this.contents) && this.mapFunc) {
			this.contents = this.contents.map(this.mapFunc)
		}

		this.currentCursor = options.currentCursor
		this.nextPageCursor = this.nextPageFunc(this)
		this.previousPageCursor = this.previousPageFunc(this)

		this.hasNextPage = this.nextPageCursor != null
		this.hasPreviousPage = this.previousPageCursor != null
	}

	/**
	 * @param {string} cursor 
	 * @returns {Promise<typeof this>}
	 */
	async fromCursor(cursor) {
		if (!cursor) {
			throw new TypeError('Invalid or missing cursor - make sure to check hasNextPage/hasPreviousPage')
		}
		const cursorAppend = `${this.url.includes('?') ? '&' : '?'}${this.cursorName}=${cursor}`
		const res = await this.client.request(this.url + cursorAppend, this.params)
		return new (Object.getPrototypeOf(this).constructor)(this.url, res.json, this.client, {...this.options, currentCursor: cursor})
	}

	nextPage() {
		return this.fromCursor(this.nextPageCursor)
	}
	prevPage() {
		return this.fromCursor(this.previousPageCursor)
	}

	/**
	 * Fetches and returns all the remaining page objects at once.
	 * Depending on the API, this may take a while due to ratelimits! 
	 * @returns {Promise<(typeof this)[]>}
	 */
	async fetchAllPages() {
		const pages = [this]
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		let currentPage = this
		while (currentPage.hasNextPage) {
			currentPage = await currentPage.nextPage()
			pages.push(currentPage)
		}
		return pages
	}

	/**
	 * Uses fetchAllPages to fetch all the page objects and then returns an array with all of their data.
	 * Depending on the API, this may take a while due to ratelimits! 
	 * @returns {Promise<ModContents[]>}
	 */
	async fetchAllPageData() {
		if (!Array.isArray(this.body)) {
			throw new TypeError('This page does not return an array.')
		}
		const allPages = await this.fetchAllPages()
		const data = []
		for (let page of allPages) {
			if (!Array.isArray(page.contents)) continue
			for (let entry of page.contents) {
				data.push(entry)
			}
		}
		return data
	}

	/**
	 * Uses fetchAllPages to fetch all the page objects and then returns an array with all of their data.
	 * Depending on the API, this may take a while due to ratelimits! 
	 * @param {(this) => boolean | any} findFunc
	 * @returns {Promise<this | ModContents | any>}
	 */
	async searchAllPages(findFunc) {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		let currentPage = this
		do {
			const filtered = findFunc(currentPage)
			if (filtered) {
				return typeof filtered == 'boolean' ? currentPage : filtered
			}
			currentPage = await currentPage.nextPage()
		} while (this.hasNextPage)
		return null
	}

	/**
	 * Fetches the first page from the given url and options.
	 * @param {string} url 
	 * @param {import('./Client').Client} client 
	 * @param {CollectionOptions} options 
	 * @returns {Collection}
	 */
	static async first(url, client, options) {
		const res = await client.request(url)
		return new this(url, res.json, client, options)
	}
}