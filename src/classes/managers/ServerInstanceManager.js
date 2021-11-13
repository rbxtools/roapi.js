import { Cache } from "../Cache.js";
import { AssetPartial } from "../AssetPartial.js";
import { PartialServerInstance, RichPrivateServerInstance, RichServerInstance, ServerInstance } from "../ServerInstance.js";
import { BaseManager } from "./BaseManager.js";

/** @typedef {string | PartialServerInstance} ServerInstanceResolvable */

/**
 * @class
 * @extends {BaseManager<PartialServerInstance, string, ServerInstanceResolvable>}
 */
export class ServerInstanceManager extends BaseManager {
	/** @type {Cache<PartialServerInstance>} */
	cache = new Cache(PartialServerInstance, this.client, [PartialServerInstance, ServerInstance, RichServerInstance, RichPrivateServerInstance])

	/**
	 * Converts the ServerInstanceResolvable into a jobId.
	 * @param {ServerInstanceResolvable} resolvable 
	 * @returns {string}
	 */
	resolveId(resolvable) {
		if (typeof resolvable == 'string') {
			return resolvable
		} else if (resolvable instanceof PartialServerInstance) {
			return resolvable.id
		}
	}

	get(id, options, classOverride = undefined, weak = undefined) {
		if (options instanceof AssetPartial || typeof options == 'number') {
			options = {id, place: options}
		}
		return this.cache.get(id, options, classOverride, weak)
	}
}