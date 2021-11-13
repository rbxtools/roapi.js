import { Asset } from "../Asset.js";
import { AssetPartial } from "../AssetPartial.js";
import { Cache } from "../Cache.js";
import { MultiFetchableManager } from "./BaseManager.js";

/** @typedef {number | string | AssetPartial} AssetResolvable */

/**
 * @class
 * @extends {MultiFetchableManager<AssetPartial, number, AssetResolvable>}
 */
export class AssetManager extends MultiFetchableManager {
	/** @type {Cache<AssetPartial>} */
	cache = new Cache(AssetPartial, this.client, [AssetPartial, PlacePartial, Asset, PlaceAsset, Place])

	/**
	 * Fetches one or more users from their userId
	 * @param {AssetResolvable | AssetResolvable[]} assetIds 
	 * @param {boolean} forceUpdate 
	 * @returns {Promise<Map<number, Asset> | Asset>}
	 */
	async fetch(assetIds, forceUpdate = false) {
		const returnOnly = !Array.isArray(assetIds) && this.resolveId(assetIds)
		if (returnOnly) {
			assetIds = [assetIds]
		}
		const assets = new Map
		assetIds = assetIds.map(resolvable => this.resolveId(resolvable)).filter(assetId => {
			const cached = this.cache.rawget(assetId)
			assets.set(assetId, cached)

			return !(cached && !(cached instanceof Asset || cached instanceof PlaceAsset) && !forceUpdate)
		})
		if (assetIds.length > 0) {
			const res = await this.client.request.catalog('/v1/catalog/items/details', {method: 'POST', body: {items: assetIds.map(id => {return {itemType: 'Asset', id}})}})
			for (let assetData of res.json.data) {
				assets.set(assetData.id, this.get(assetData.id, assetData, assetData.assetType == 9 ? PlaceAsset : Asset))
			}
		}
		return returnOnly ? assets.get(returnOnly) : assets
	}
}


import { Place, PlaceAsset, PlacePartial } from "../Place.js";
