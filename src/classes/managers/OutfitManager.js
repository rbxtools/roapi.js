import { Cache } from "../Cache.js";
import { Outfit, OutfitPartial } from "../Outfit.js";
import { FetchableManager } from "./BaseManager.js";

/** @typedef {number | string | OutfitPartial} OutfitResolvable */

/**
 * @class
 * @extends {FetchableManager<OutfitPartial, number, OutfitResolvable, Outfit>}
 */
export class OutfitManager extends FetchableManager {
	/** @type {Cache<OutfitPartial>} */
	cache = new Cache(OutfitPartial, this.client, [OutfitPartial, Outfit])

	/**
	 * Fetches an outfit by id.
	 * @param {OutfitResolvable} outfitId 
	 * @param {boolean} forceUpdate 
	 * @returns {Promise<Map<number, Outfit> | Outfit>}
	 */
	async fetch(outfitId, forceUpdate = false) {
		outfitId = this.resolveId(outfitId)

		const cached = this.cache.rawget(outfitId)
		if (cached instanceof Outfit && !forceUpdate) {
			return cached
		}
		
		const assetInfo = await this.client.request.avatar(`/v1/outfits/${outfitId}/details`)

		return this.get(outfitId, assetInfo.json, Outfit)
	}
}