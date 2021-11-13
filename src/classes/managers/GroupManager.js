import { Cache } from "../Cache.js";
import { Group } from "../Group.js";
import { MultiFetchableManager } from "./BaseManager.js";

/** @typedef {number | string | Group} GroupResolvable */

/**
 * @class GroupManager
 * @extends MultiFetchableManager<Group,number,GroupResolvable,Group>
 */
export class GroupManager extends MultiFetchableManager {
	/** @type {Cache<Group>} */
	cache = new Cache(Group, this.client)

	/**
	 * Fetches one or more users from their userId
	 * @param {GroupResolvable | GroupResolvable[]} groupIds 
	 * @param {boolean} forceUpdate 
	 * @returns {Promise<Map<number, Group> | Group>}
	 */
	async fetch(groupIds, forceUpdate = false) {
		const returnOnly = !Array.isArray(groupIds) && this.resolveId(groupIds)
		if (returnOnly) {
			groupIds = [groupIds]
		}
		const groups = new Map
		groupIds = groupIds.map(resolvable => this.resolveId(resolvable)).filter(groupId => {
			const cached = this.cache.rawget(groupId)
			groups.set(groupId, cached)
			
			return !cached || forceUpdate
		})
		if (groups.length > 0) {
			const res = await this.client.request.groups() // TODO: this monkey
			for (let groupData of res.json.data) {
				groups.set(groupData.id, this.get(groupData.id, groupData))
			}
		}
		return returnOnly ? groups.get(returnOnly) : groups
	}
}