import { AssetLike } from "../AssetLike.js";
import { Place, PlacePartial } from "../Place.js";
import { PrivateServer } from '../PrivateServer.js'
import { MultiFetchableManager } from "./BaseManager.js";

/** @typedef {number | string | PrivateServer | PlacePartial} PlaceResolvable */

/**
 * @class
 * @extends {MultiFetchableManager<PlacePartial, number, PlaceResolvable, Place>}
 */
export class PlaceManager extends MultiFetchableManager {
	/** @type {Cache<PlacePartial>} */
	cache = this.client.assets.cache

	/**
	 * Converts the PlaceResolvable into a placeId.
	 * @param {PlaceResolvable} resolvable 
	 * @returns {number}
	 */
	resolveId(resolvable) {
		if (resolvable instanceof PrivateServer) {
			return resolvable.placeId
		} else if (resolvable instanceof AssetLike) {
			return resolvable.id
		} else {
			return +resolvable
		}
	}

	get(id, options = {id}, overrideClass = PlacePartial, weak = undefined) {
		options.name ??= this.cache.rawget(id)?.name
		
		return this.cache.get(id, options, overrideClass, weak)
	}

	/**
	 * Fetches one or more places from their placeIds.
	 * @param {PlaceResolvable | PlaceResolvable[]} placeIds 
	 * @param {boolean} forceUpdate 
	 * @returns {Promise<Map<number, Place> | Place>}
	 */
	async fetch(placeIds, forceUpdate = false) {
		const returnOnly = !Array.isArray(placeIds) && this.resolveId(placeIds)
		if (returnOnly) {
			placeIds = [placeIds]
		}
		const places = new Map
		placeIds = placeIds.map(resolvable => this.resolveId(resolvable)).filter(placeId => {
			const cached = this.cache.rawget(placeId)
			places.set(placeId, cached)

			return !(cached && !(cached instanceof Place) && !forceUpdate)
		})
		if (placeIds.length > 0) {
			const res = await this.client.request.games() // TODO: this monkey
			for (let placeData of res.json.data) {
				places.set(placeData.id, this.get(placeData.id, placeData, Place))
			}
		}
		return returnOnly ? places.get(returnOnly) : places
	}
}