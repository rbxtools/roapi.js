import fetch, { Headers, Response } from "node-fetch"
import { BaseRequested, RequestError, RobloxResponse } from "./Response.js"
import { promisify } from "util"

const sleep = promisify(setTimeout)

const BASE_DOMAIN = 'roblox.com'

export const modes = {
	before: { beforeSend: true, both: true },
	retry: { afterResponse: true, both: true },
	complete: { afterResponse: true, afterComplete: true, both: true }
}

/** 
 * @typedef {Object} RequestP
 * @prop {any} [body]
 * @prop {number|false} [retryRatelimitAfter=15]
 * @prop {number} [retryLimit]
 * @prop {boolean} [dontRejectPromise=false]
 * @prop {boolean} [alwaysRetry=false]
 * 
 * @typedef {RequestP & import('node-fetch').RequestInit} RequestParams
 */

export class BaseRequest extends Function {
	constructor(client) {
		super('...args', 'return this._bound._call(this, ...args)')
		this._bound = this.bind(this)

		/** @type {import('./Client').Client} */
		this.client = client

		return this._bound
	}

	/**
	 * @param {BaseRequest} obj
	 * @param {string} url 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	async _call(obj, url, params = {}, retry = params.retryLimit) {
		const headers = new Headers(obj.client.headers)
		for (let [name, value] of (params.headers instanceof Headers ? params.headers : Object.entries(params.headers ?? {}))) {
			headers.set(name, value)
		}
		params.headers = headers

		if (obj.client.loggerEnabled && modes.before[obj.client.loggerMode]) {
			await obj.client.logRequest(new BaseRequested(params, headers, 'http')).catch(console.warn)
		}
		
		if (params.body != null && typeof(params.body) != 'string' && !Buffer.isBuffer(params.body)) {
			params.body = JSON.stringify(params.body)
		}
		const res = await fetch(url, params).catch(err => {
			return new RobloxResponse(err, err.message, params, url)
		})
		const retryAfter = params.retryRatelimitAfter ?? 15
		if (((params.alwaysRetry && !res.ok) || (res instanceof Response && res.status == 429) || (res instanceof RobloxResponse && res.fetchError?.code == 'EAI_AGAIN')) && retryAfter) {
			if (obj.client.loggerEnabled && modes.retry[obj.client.loggerMode]) {
				const rbxres = res instanceof RobloxResponse ? res : new RobloxResponse(res, await res.text(), params, url)
				await obj.client.logRequest(rbxres).catch(console.warn)
			}

			if (retry != null) {
				retry -= 1
			}

			if (retry == null || retry > 0) {
				await sleep(retryAfter * 1000)
				return this(url, params)
			}
		} else if (res.status == 403 && res.headers.has('x-csrf-token')) {
			if (obj.client.loggerEnabled && modes.retry[obj.client.loggerMode]) {
				await obj.client.logRequest(new RobloxResponse(res, await res.text(), params, url)).catch(console.warn)
			}

			obj.client.headers.set('x-csrf-token', res.headers.get('x-csrf-token'))
			return this(url, params)
		}
		
		const response = res instanceof RobloxResponse ? res : new RobloxResponse(res, await res.text(), params, url)

		if (obj.client.loggerEnabled && modes.complete[obj.client.loggerMode]) {
			await obj.client.logRequest(response).catch(console.warn)
		}

		if (!response.ok && !params.dontRejectPromise) {
			throw new RequestError(response)
		}

		return response
	}

	/**
	 * Sends a request to the given roblox subdomain
	 * @param {string} subdomain The subdomain to use, leave as empty string for none
	 * @param {string} path The path from the subdomain to request
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	roblox(subdomain = '', path = '', params = {}) {
		if (!path.startsWith('/')) {
			path = '/' + path
		}
		return this('https://' + subdomain + BASE_DOMAIN + path, params)
	}
}

export class Request extends BaseRequest {
	/**
	 * General-purpose API, mostly legacy endpoints
	 * https://api.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	general(path, params) {
		return this.roblox('api.', path, params)
	}

	/**
	 * All legacy endpoints not under a subdomain
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	legacy(path, params) {
		return this.roblox('', path, params)
	}

	/**
	 * All endpoints for accessing/modifying account information
	 * https://accountinformation.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	account(path, params) {
		return this.roblox('accountinformation.', path, params)
	}

	/**
	 * All endpoints for account/user settings.
	 * https://accountsettings.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	settings(path, params) {
		return this.roblox('accountsettings.', path, params)
	}

	/**
	 * Roblox Ad Configuration related endpoints.
	 * https://adconfiguration.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	adconfig(path, params) {
		return this.roblox('adconfiguration.', path, params)
	}

	/**
	 * Ads configuration endpoints.
	 * https://ads.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	ads(path, params) {
		return this.roblox('ads.', path, params)
	}

	/**
	 * Serves asset content.
	 * https://assetdelivery.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	delivery(path, params) {
		return this.roblox('assetdelivery.', path, params)
	}

	/**
	 * All endpoints that tamper with authentication sessions.
	 * https://auth.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	auth(path, params) {
		return this.roblox('auth.', path, params)
	}

	/**
	 * Endpoints relating to the customization of player avatars.
	 * https://avatar.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	avatar(path, params) {
		return this.roblox('avatar.', path, params)
	}

	/**
	 * Endpoints for badges and badge awards management.
	 * https://badges.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	badges(path, params) {
		return this.roblox('badges.', path, params)
	}

	/**
	 * Real money transactions and interaction.
	 * https://billing.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	billing(path, params) {
		return this.roblox('billing.', path, params)
	}

	/**
	 * Catalog items browsing and searching. Content and user based catalog items recommendations.
	 * https://catalog.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	catalog(path, params) {
		return this.roblox('catalog.', path, params)
	}

	/**
	 * https://cdnproviders.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	cdnproviders(path, params) {
		return this.roblox('cdnproviders.', path, params)
	}

	/**
	 * All chat and party related endpoints.
	 * https://chat.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	chat(path, params) {
		return this.roblox('chat.', path, params)
	}

	/**
	 * Used by various Roblox clients to retrieve configuration information.
	 * https://clientsettings.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	clientsettings(path, params) {
		return this.roblox('clientsettings.', path, params)
	}

	/**
	 * Used by various Roblox clients to retrieve configuration information.
	 * https://clientsettingscdn.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	clientsettingscdn(path, params) {
		return this.roblox('clientsettingscdn.', path, params)
	}

	/**
	 * Contacts and userTag management.
	 * https://contacts.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	contacts(path, params) {
		return this.roblox('contacts.', path, params)
	}

	/**
	 * ApiSite to front the TemporaryStore for files before uploading to S3
	 * https://contentstore.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	contentstore(path, params) {
		return this.roblox('contentstore.', path, params)
	}

	/**
	 * Game development configuration endpoints.
	 * https://develop.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	develop(path, params) {
		return this.roblox('develop.', path, params)
	}

	/**
	 * https://discussions.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	forums(path, params) {
		return this.roblox('discussions.', path, params)
	}

	/**
	 * Endpoints related to transactions and currency.
	 * https://economy.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	economy(path, params) {
		return this.roblox('economy.', path, params)
	}

	/**
	 * Roblox.EconomyCreatorStats.Api endpoints.
	 * https://economycreatorstats.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	economystats(path, params) {
		return this.roblox('economycreatorstats.', path, params)
	}

	/**
	 * For engagement-based payout information
	 * https://engagementpayouts.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	premiumpayouts(path, params) {
		return this.roblox('engagementpayouts.', path, params)
	}

	/**
	 * Establishes follow relationship between subscriber entities (users, groups, etc) and source entities (games, groups, assets, etc.)
	 * https://followings.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	followings(path, params) {
		return this.roblox('followings.', path, params)
	}

	/**
	 * Friends and followers management.
	 * https://friends.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	friends(path, params) {
		return this.roblox('friends.', path, params)
	}

	/**
	 * Manages internationalization of games such as translating in game content.
	 * https://gameinternationalization.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	gametranslation(path, params) {
		return this.roblox('gameinternationalization.', path, params)
	}

	/**
	 * All endpoints around launching a game.
	 * https://gamejoin.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	gamejoin(path, params) {
		return this.roblox('gamejoin.', path, params)
	}

	/**
	 * Endpoints for the in-game datastore system for storing data for games.
	 * https://github.com/AntiBoomz/BTRoblox/blob/master/README.md#datastore-apis
	 * https://gamepersistence.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	datastores(path, params) {
		return this.roblox('gamepersistence.', path, params)
	}

	/**
	 * All endpoints for game discovery, and details.
	 * https://games.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	games(path, params) {
		return this.roblox('games.', path, params)
	}

	/**
	 * Groups management.
	 * https://groups.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	groups(path, params) {
		return this.roblox('groups.', path, params)
	}

	/**
	 * Group Moderation
	 * https://groupsmoderation.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	groupmod(path, params) {
		return this.roblox('groupsmoderation.', path, params)
	}

	/**
	 * All endpoints for viewing (but not granting) ownership of items.
	 * https://inventory.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	inventory(path, params) {
		return this.roblox('inventory.', path, params)
	}

	/**
	 * Configure Items (bundles and avatar assets).
	 * https://itemconfiguration.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	itemconfig(path, params) {
		return this.roblox('itemconfiguration.', path, params)
	}

	/**
	 * User locale management.
	 * https://locale.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	locale(path, params) {
		return this.roblox('locale.', path, params)
	}

	/**
	 * Handles managing of localization tables.
	 * https://localizationtables.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	localizationtables(path, params) {
		return this.roblox('localizationtables.', path, params)
	}

	/**
	 * Record metrics across Roblox.
	 * https://metrics.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	metrics(path, params) {
		return this.roblox('metrics.', path, params)
	}

	/**
	 * Handle requests around making purchases using Midas
	 * https://midas.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	midas(path, params) {
		return this.roblox('midas.', path, params)
	}

	/**
	 * All notification stream endpoints.
	 * https://notifications.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	notifications(path, params) {
		return this.roblox('notifications.', path, params)
	}

	/**
	 * Endpoints used for real-time notification streams
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	realtime(path, params) {
		return this.roblox('realtime.', path, params)
	}

	/**
	 * The web Api for the in-game PointsService.
	 * https://points.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	points(path, params) {
		return this.roblox('points.', path, params)
	}

	/**
	 * This API is for premium features and anything pertaining to account add ons
	 * https://premiumfeatures.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	premium(path, params) {
		return this.roblox('premiumfeatures.', path, params)
	}

	/**
	 * All endpoints for managing presence.
	 * https://presence.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	presence(path, params) {
		return this.roblox('presence.', path, params)
	}

	/**
	 * All messages page endpoints.
	 * https://privatemessages.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	messages(path, params) {
		return this.roblox('privatemessages.', path, params)
	}

	/**
	 * All endpoints handling file uploads.
	 * https://publish.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	publish(path, params) {
		return this.roblox('publish.', path, params)
	}

	/**
	 * https://share.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	share(path, params) {
		return this.roblox('share.', path, params)
	}

	/**
	 * High volume text filtering.
	 * https://textfilter.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	filter(path, params) {
		return this.roblox('textfilter.', path, params)
	}

	/**
	 * Endpoints for requesting thumbnails.
	 * https://thumbnails.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	thumbnails(path, params) {
		return this.roblox('thumbnails.', path, params)
	}

	/**
	 * Validate and resize thumbnails to requested dimensions
	 * https://thumbnailsresizer.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	thumbnailsresizer(path, params) {
		return this.roblox('thumbnailsresizer.', path, params)
	}

	/**
	 * Endpoints for trading collectible items.
	 * https://trades.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	trades(path, params) {
		return this.roblox('trades.', path, params)
	}

	/**
	 * Manages translation roles of developers in game localization.
	 * https://translationroles.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	translationroles(path, params) {
		return this.roblox('translationroles.', path, params)
	}

	/**
	 * Endpoints for requesting translations.
	 * https://translations.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	translations(path, params) {
		return this.roblox('translations.', path, params)
	}

	/**
	 * Platform interface for the two step verification system.
	 * https://twostepverification.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	twofactor(path, params) {
		return this.roblox('twostepverification.', path, params)
	}

	/**
	 * Endpoints for performing actions/operations related to User Moderation
	 * https://usermoderation.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	moderation(path, params) {
		return this.roblox('usermoderation.', path, params)
	}

	/**
	 * For direct Roblox user information.
	 * https://users.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	users(path, params) {
		return this.roblox('users.', path, params)
	}

	/**
	 * APIs for Voice calls.
	 * https://voice.roblox.com/docs
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	voice(path, params) {
		return this.roblox('voice.', path, params)
	}

	/**
	 * The Open Cloud API. Requires an open cloud token via `client.setCloudToken`
	 * https://developer.roblox.com/en-us/articles/open-cloud
	 * @param {string} path 
	 * @param {RequestParams} params 
	 * @returns {Promise<RobloxResponse>}
	 */
	cloud(path, params) {
		return this.roblox('apis.', path, params)
	}
}