import { Cache } from "../Cache.js";
import { DevelopUniverse, Universe, UniversePartial } from "../Universe.js";
import { MultiFetchableManager } from "./BaseManager.js";

/** @typedef {number | string | UniversePartial | Place} UniverseResolvable */

/**
 * @class
 * @extends {MultiFetchableManager<UniversePartial, number, UniverseResolvable, Universe>}
 */
export class UniverseManager extends MultiFetchableManager {
	/** @type {Cache<UniversePartial>} */
	cache = new Cache(UniversePartial, this.client, [UniversePartial, Universe])

	/**
	 * Converts the UserResolvable into a universeId.
	 * @param {UniverseResolvable} resolvable 
	 * @returns {number}
	 */
	resolveId(resolvable) {
		if (resolvable instanceof UniversePartial) {
			return resolvable.id
		} else if (resolvable instanceof Place) {
			return resolvable.universeId
		} else {
			return +resolvable
		}
	}

	/**
	 * Fetches one or more users from their userId
	 * @param {UniverseResolvable | UniverseResolvable[]} universeIds 
	 * @param {boolean} forceUpdate 
	 * @returns {Promise<Map<number, Universe> | Universe>}
	 */
	async fetch(universeIds, forceUpdate = false) {
		const returnOnly = !Array.isArray(universeIds) && this.resolveId(universeIds)
		if (returnOnly) {
			universeIds = [universeIds]
		}
		const universes = new Map
		universeIds = universeIds.map(resolvable => this.resolveId(resolvable)).filter(universeId => {
			const cached = this.cache.rawget(universeId)
			universes.set(universes, cached)

			return !(cached && !(cached instanceof Universe) && !forceUpdate)
		})
		if (universeIds.length > 0) {
			const res = await this.client.request.games(`/v1/games?universeIds=${universeIds.join(',')}`)
			for (let universeData of res.json.data) {
				universes.set(universeData.id, this.get(universeData.id, universeData, Universe))
			}
		}
		return returnOnly ? universes.get(returnOnly) : universes
	}

	/**
	 * Fetches one or more users from their userId
	 * @param {UniverseResolvable | UniverseResolvable[]} universeIds 
	 * @param {boolean} forceUpdate 
	 * @returns {Promise<Map<number, DevelopUniverse> | DevelopUniverse>}
	 */
	async fetchDevelop(universeIds, forceUpdate = false) {
		const returnOnly = !Array.isArray(universeIds) && this.resolveId(universeIds)
		if (returnOnly) {
			universeIds = [universeIds]
		}
		const universes = new Map
		universeIds = universeIds.map(resolvable => this.resolveId(resolvable)).filter(universeId => {
			const cached = this.cache.rawget(universeId)
			universes.set(universes, cached)

			return !(cached && !(cached instanceof DevelopUniverse) && !forceUpdate)
		})
		if (universeIds.length > 0) {
			const res = await this.client.request.games(`/v1/universes/multiget?ids=${universeIds.join('&ids=')}`)
			for (let universeData of res.json.data) {
				universes.set(universeData.id, this.get(universeData.id, universeData, DevelopUniverse))
			}
		}
		return returnOnly ? universes.get(returnOnly) : universes
	}

	/**
	 * Fetches a list of all the Roblox game templates.
	 * @param {boolean} [fetchFull=true] Whether to fetch the complete data for each universe (default: true - if false, some fields will be missing)
	 * @param {boolean} [forceUpdate=false] Whether to force an update of the data, or to use the cached version if it exists
	 */
	async fetchGameTemplates(fetchFull = true, forceUpdate = !fetchFull) {
		const res = await this.client.request.develop('/v1/gametemplates')
		const games = res.json.data
		if (fetchFull) {
			await this.client.universes.fetch(games.map(game => game.universe.id), forceUpdate)
		}
		for (let game of games) {
			game.universe = this.client.universes.get(game.universe.id, game.universe, DevelopUniverse)
		}
		return games
	}
}

import { Place } from "../Place.js";
