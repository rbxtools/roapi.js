import { Cache } from "../Cache.js";
import { Bundle, BundlePartial } from "../Bundle.js";
import { MultiFetchableManager } from "./BaseManager.js";

/** @typedef {number | string | BundlePartial} BundleResolvable */

/**
 * @class 
 * @extends {MultiFetchableManager<BundlePartial, number, BundleResolvable, Bundle>}
 */
export class BundleManager extends MultiFetchableManager {
	/** @type {Cache<BundlePartial>} */
	cache = new Cache(BundlePartial, this.client, [BundlePartial, Bundle])

	/**
	 * Fetches one or more users from their userId
	 * @param {BundleResolvable | BundleResolvable[]} assetIds 
	 * @param {boolean} [forceUpdate=false] 
	 * @returns {Promise<Map<number, Bundle> | Bundle>}
	 */
	async fetch(bundleIds, forceUpdate = false) {
		const returnOnly = !Array.isArray(bundleIds) && this.resolveId(bundleIds)
		if (returnOnly) {
			bundleIds = [bundleIds]
		}
		const bundles = new Map
		bundleIds = bundleIds.map(resolvable => this.resolveId(resolvable)).filter(bundleId => {
			const cached = this.cache.rawget(bundleId)
			bundles.set(bundleId, cached)

			return !(cached && !(cached instanceof Bundle) && !forceUpdate)
		})
		if (bundleIds.length > 0) {
			const res = await this.client.request.catalog() // TODO: this monkey
			for (let passData of res.json.data) {
				bundles.set(passData.id, this.get(passData.id, passData, Bundle))
			}
		}
		return returnOnly ? bundles.get(returnOnly) : bundles
	}
}