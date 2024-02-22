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

	/**
	 * Fetches thumbnails for the given outfit id(s)
	 * @param {OutfitResolvable | OutfitResolvable[]} outfitIds 
	 * @param {'420x420'|'150x150'} size 
	 * @returns {Promise<Map<number, string> | string>}
	 */
	async fetchThumbnailUrls(outfitIds, size = '420x420') {
		const returnOnly = !Array.isArray(outfitIds) && this.resolveId(outfitIds)
		if (returnOnly) {
			outfitIds = [outfitIds]
		}
		const outfits = new Map
		outfitIds = outfitIds.map(resolvable => this.resolveId(resolvable)).filter(userId => {
			const cached = this.cache.rawget(userId)
			outfits.set(userId, cached)

			return !cached || outfitIds
		})
		if (outfitIds.length > 0) {
			for (let i = 0; i < outfitIds.length; i += 50) {
				const idsBatch = outfitIds.slice(i, i + 50)
				const res = await this.client.request.thumbnails(`/v1/users/outfits?userOutfitIds=${idsBatch.join(',')}&size=${size}&format=Png`)
				for (let outfitData of res.json.data) {
					outfits.set(outfitData.targetId, outfitData.imageUrl)
				}
			}
		}
		return returnOnly ? outfits.get(returnOnly) : outfits
	}
}