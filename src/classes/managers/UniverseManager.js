import { Cache } from "../Cache.js";
import { Universe, UniversePartial } from "../Universe.js";
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
}

import { Place } from "../Place.js";
