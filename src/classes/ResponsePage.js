import {Collection} from "./Collection.js"

function getCursorInfo(cursor) {
	try {
		const decoded = Buffer.from(cursor, 'base64').toString().split('\n')
		const json = JSON.parse(decoded[0])
		json.hash = decoded[1]
		return json
	} catch {
		return null
	}
}

/**
 * @typedef {Object} CursorOptions
 * @prop {string} [nextPageIndex='nextPageCursor']
 * @prop {string} [prevPageIndex='prevPageCursor']
 * @prop {string} [dataIndex='data']
 * @prop {string} [cursorName='cursor']
 * @prop {boolean} [canDecodeCursors=false]
 * @prop {(any) => any} [mapFunc=x => x]
 * 
 * @typedef {CursorOptions & import("./Request.js").RequestParams} PageOptions
 */

/**
 * @template ContentType
 * @class
 * @extends Collection<ContentType>
 */
export class Page extends Collection {
	/**
	 * @param {string} url 
	 * @param {PageOptions} params 
	 * @param {Client} client 
	 * @param {(any) => any} mapFunc 
	 * @param {boolean} [canDecodeCursors=false] 
	 */
	constructor(url, params, body, client) {
		const nextPageIndex = params?.nextPageIndex ?? 'nextPageCursor'
		const previousPageIndex = params?.previousPageIndex ?? 'previousPageCursor'
		const dataIndex = params?.dataIndex ?? 'data'
		const mapFunc = params.mapFunc ?? (x => x)

		super(url, body, client, {
			nextPageFunc: coll => coll.body[nextPageIndex],
			previousPageFunc: coll => coll.body[previousPageIndex],
			modFunc: value => value,
			mapFunc: params.mapFunc,
			currentCursor: '',
			cursorName: params?.cursorName ?? 'cursor',
			requestParams: params
		})
		this.canDecodeCursors = params.canDecodeCursors ?? false

		if (Array.isArray(body[dataIndex])) {
			/** @type {ContentType} */
			this.contents = body[dataIndex].map(mapFunc)
		} else {
			this.contents = body[dataIndex]
		}

		if (this.canDecodeCursors) {
			if (this.nextPageCursor) {
				this.nextPageInfo = getCursorInfo(this.nextPageCursor)
			}
			if (this.previousPageCursor) {
				this.previousPageInfo = getCursorInfo(this.previousPageCursor)
			}
		}
	}

	nextPage() {
		return this.fromCursor(this.nextPageCursor)
	}
	prevPage() {
		return this.fromCursor(this.previousPageCursor)
	}

	async searchAllArrayPages(findFunc) {
		return this.searchAllPages(array => array.find(findFunc))
	}

	/**
	 * Fetches and returns the first page at the url
	 * @param {string} url 
	 * @param {PageOptions | (any) => any} params 
	 * @param {import('./Client').Client} client 
	 * @returns {Promise<Page<ContentType>>}
	 */
	static async first(url, params, client) {
		if (typeof params == 'function') {
			params = {mapFunc: params}
		}
		const res = await client.request(url, params)
		return new this(url, params, res.json, client)
	}
}