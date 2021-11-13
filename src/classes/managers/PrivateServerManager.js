import { AssetLike } from "../AssetLike.js";
import { Cache } from "../Cache.js";
import { PrivateServer, PrivateServerPartial, RichPrivateServer } from "../PrivateServer.js";
import { MultiFetchableManager } from "./BaseManager.js";

/** @typedef {number | string | PrivateServerPartial} PrivateServerResolvable */

/**
 * @class
 * @extends {MultiFetchableManager<PrivateServerPartial, number, PrivateServerResolvable, PrivateServer>}
 */
export class PrivateServerManager extends MultiFetchableManager {
	/** @type {Cache<PrivateServerPartial>} */
	cache = new Cache(PrivateServerPartial, this.client, [PrivateServerPartial, PrivateServer, RichPrivateServer])

	async resolveAccessCode(resolvable) {
		if (resolvable instanceof PrivateServer) {
			return resolvable.accessCode
		} else if (resolvable instanceof AssetLike || typeof resolvable == 'number') {
			const server = await this.fetch(resolvable)
			return server.accessCode
		} else {
			return resolvable
		}
	}

	/**
	 * Fetches one or more users from their userId
	 * @param {PrivateServerResolvable | PrivateServerResolvable[]} serverIds 
	 * @param {boolean} forceUpdate 
	 * @returns {Promise<Map<number, PrivateServer> | PrivateServer>}
	 */
	async fetch(serverIds, forceUpdate = false) {
		const returnOnly = !Array.isArray(serverIds) && this.resolveId(serverIds)
		if (returnOnly) {
			serverIds = [serverIds]
		}
		const servers = new Map
		serverIds = serverIds.map(resolvable => this.resolveId(resolvable)).filter(serverId => {
			const cached = this.cache.rawget(serverId)
			servers.set(serverId, cached)

			return !(cached && !(cached instanceof PrivateServer) && !forceUpdate)
		})
		if (serverIds.length > 0) {
			const res = await this.client.request.games(`/v1/private-servers?privateServerIds=${serverIds.join(',')}`)
			for (let serverData of res.json.data) {
				this.cache.set(serverData.vipServerId, this.get(serverData.vipServerId, serverData, PrivateServer))
			}
		}
		return returnOnly ? servers.get(returnOnly) : servers
	}
}