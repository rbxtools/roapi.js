import fetch, { Headers } from 'node-fetch'
import { AuthenticatedUser } from "./AuthenticatedUser.js"
import { promisify } from 'util'
import { modes, Request } from './Request.js'
import { AssetManager } from './managers/AssetManager.js'
import { UserManager } from './managers/UserManager.js'
import { UniverseManager } from './managers/UniverseManager.js'
import { PrivateServerManager } from './managers/PrivateServerManager.js'
import { ChatManager } from './chat/managers/ChatManager.js'
import { ServerInstanceManager } from './managers/ServerInstanceManager.js'
import { OutfitManager } from './managers/OutfitManager.js'
import { GroupManager } from './managers/GroupManager.js'
import { PlaceManager } from './managers/PlaceManager.js'
import { GamepassManager } from './managers/GamepassManager.js'
import { filter, logger } from '../logger.js'
import { DownloadResponse, RequestError, RobloxResponse } from './Response.js'
import { Launcher } from './Launcher.js'
import { BundleManager } from './managers/BundleManager.js'
import { SponsorManager } from './managers/SponsorManager.js'
import { FFlagManager } from './managers/FFlagManager.js'

const sleep = promisify(setTimeout)

const TOKEN_PREFIX = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_'

const defaultWeak = {
	users: { full: 1800 },
	assets: { partial: true, full: 600 },
	bundle: { partial: true, full: 600 },
	place: { partial: true, fromFlagFilter: true, asset: 3600, full: 3600 },
	gamepasses: { partial: true, full: 600 },
	groups: { full: 3600 },
	outfits: { partial: true, full: 600 },
	privateServers: { partial: true, full: 600, rich: 600 },
	bundles: { partial: true, full: 600 },
	sponsorships: { partial: true, full: 3600 },
	fflags: { full: 3660 },
	servers: { 
		partial: true,
		full: 1800, 
		rich: 1800, 
		private: 1800 
	},
	universes: { partial: true, full: 3600 },
	chatMessages: {
		partial: true,
		full: 600,
		unknown: 60,
		system: 60,
		user: 600,
		event: 600,
		text: 600,
		sent: 3600,
		link: 600
	},
	conversations: { 
		partial: true, 
		full: 600,
		private: 600,
		group: 600,
		team: 600
	}
}

/** 
 * @param {defaultWeakCaches} weak
 * @returns {defaultWeakCaches} 
 */
function filterWeakCache(weak = {}) {
	if (typeof weak == 'boolean') {
		weak = Object.keys(defaultWeak).reduce((obj, key) => {obj[key] = weak; return obj}, {})
	}
	for (let [key, defaultValues] of Object.entries(defaultWeak)) {
		const value = weak[key]
		if (typeof value == 'boolean') {
			weak[key] = Object.keys(defaultValues).reduce((obj, key) => {obj[key] = value; return obj}, {})
		} else if (typeof value == 'object') {
			weak[key] = Object.entries(defaultValues).reduce((obj, [key, value]) => obj[key] ??= value, value)
		} else {
			weak[key] = {...defaultValues}
		}
	}
	return weak
}

export class Client {
	headers = new Headers({'content-type': 'application/json', 'accept': 'application/json'})
	token = ''
	cloudToken = ''

	/** @type {Request} */ request
	/** @type {UserManager} */ users
	/** @type {UniverseManager} */ universes 
	/** @type {AssetManager} */ assets
	/** @type {GroupManager} */ groups
	/** @type {GamepassManager} */ gamepasses
	/** @type {OutfitManager} */ outfits
	/** @type {PrivateServerManager} */ privateServers
	/** @type {ServerInstanceManager} */ servers
	/** @type {ChatManager} */ chat
	/** @type {PlaceManager} */ places
	/** @type {Launcher} */ launcher
	/** @type {BundleManager} */ bundles
	/** @type {SponsorManager} */ sponsorships

	constructor({logger, weakCaches = undefined} = {}) {
		/** @type {RequestLoggingFilter} */
		this.loggingFilter = logger?.filter
		/** @type {FormatterOptions} */
		this.loggerOptions = logger?.loggerOptions
		/** @type {boolean} */
		this.loggerEnabled = logger?.enabled ?? false
		/** @type {RequestLoggingMode} */
		this.loggerMode = logger?.mode ?? 'afterResponse'
		/** @type {(request: BaseRequested, options: FormatterOptions) => void} */
		this.customLogger = logger?.customLogger

		/** @type {defaultWeakCaches} */
		this.weakCaches = filterWeakCache(weakCaches)

		Object.defineProperty(this, 'assets', {value: new AssetManager(this)})
		Object.defineProperties(this, {
			request: {value: new Request(this)},
			users: {value: new UserManager(this)},
			universes: {value: new UniverseManager(this)},
			groups: {value: new GroupManager(this)},
			gamepasses: {value: new GamepassManager(this)},
			outfits: {value: new OutfitManager(this)},
			privateServers: {value: new PrivateServerManager(this)},
			servers: {value: new ServerInstanceManager(this)},
			chat: {value: new ChatManager(this)},
			places: {value: new PlaceManager(this)},
			launcher: {value: new Launcher(this)},
			bundles: {value: new BundleManager(this)},
			sponsorships: {value: new SponsorManager(this)},
			fflags: {value: new FFlagManager(this)}
		})
	}
	
	/** 
	 * Authenticates with the given account token. You can include or exclude ".ROBLOSECURITY" and the security warning and it will be automatically corrected.
	 * @param {string} token
	 * @example client.login('0368C7C1EB017B4D438FA...')
	 */
	async login(token) {
		if (token.startsWith('.ROBLOSECURITY=')) {
			token = token.substr(16)
		}
		if (!token.startsWith(TOKEN_PREFIX)) {
			token = TOKEN_PREFIX + token
		}
		this.token = token
		this.headers.set('cookie', `.ROBLOSECURITY=${token}`)

		/** @type {AuthenticatedUser} */
		this.user = await AuthenticatedUser.get(this)

		return this.users.cache.set(this.user.id, this.user, false)
	}

	/**
	 * Sets the token to be used when interacting with the Open Cloud API.
	 * This does not (yet?) verify the authenticity of the given token.
	 * 
	 * 
	 * Pass `null` to remove.
	 * @param {string?} token 
	 * 
	 * @returns {Promise<void>} Asyncrhonous for forwards compatibility.
	 */
	async setCloudToken(token) {
		this.cloudToken = token
		this.headers.set('x-api-key', token)
	}

	/**
	 * Returns a download stream for the given url
	 */
	async download(url, params = {}) {
		const headers = new Headers(this.headers.raw())
		for (let [name, value] of (params.headers instanceof Headers ? params.headers : Object.entries(params.headers ?? {}))) {
			headers.set(name, value)
		}
		params.headers = headers
		const res = await fetch(url, params).catch(err => {
			return new RobloxResponse(err, err.message, params, url)
		})
		const retryAfter = params.retryRatelimitAfter ?? 15
		if (res.status == 429 && retryAfter) {
			if (this.loggerEnabled && modes.retry[this.loggerMode]) {
				await this.logRequest(new RobloxResponse(res, await res.text(), params, url)).catch(console.warn)
			}

			await sleep(retryAfter * 1000)
			return this.download(url, params)
		} else if (res.status == 403 && res.headers.has('x-csrf-token')) {
			if (this.loggerEnabled && modes.retry[this.loggerMode]) {
				await this.logRequest(new RobloxResponse(res, await res.text(), params, url)).catch(console.warn)
			}

			this.headers.set('x-csrf-token', res.headers.get('x-csrf-token'))
			return this.download(url, params)
		}
		
		const response = res instanceof RobloxResponse ? res : new DownloadResponse(res, params, url)

		if (this.loggerEnabled && modes.complete[this.loggerMode]) {
			await this.logRequest(response).catch(console.warn)
		}

		if (!response.ok && !params.dontRejectPromise) {
			throw new RequestError(response)
		}

		return response
	}

	/**
	 * Invalidates the current token's session.
	 */
	async invalidateToken() {
		await this.request.auth(`/v2/logout`, {method: 'POST'})
	}

	async logRequest(response) {
		if (await filter(response, this.loggingFilter)) {
			return (this.customLogger ?? logger)(response, this.loggerOptions)
		}
	}

	[Symbol.for('nodejs.util.inspect.custom')]() {
		return `Client <${this.user?.name ?? 'Logged out'}>`
	}
}