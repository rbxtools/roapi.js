import { AssetLike } from "../AssetLike.js";
import { Cache } from "../Cache.js";
import { User } from "../User.js";
import { MultiFetchableManager } from "./BaseManager.js";

/** @typedef {number | string | User | GroupChatMember} UserResolvable */

/**
 * @class
 * @extends {MultiFetchableManager<User, number, UserResolvable, User>}
 */
export class UserManager extends MultiFetchableManager {
	/** @type {Cache<User>} */
	cache = new Cache(User, this.client)

	/**
	 * Converts the UserResolvable into a userId.
	 * @param {UserResolvable} resolvable 
	 * @returns {number}
	 */
	resolveId(resolvable) {
		if (resolvable instanceof AssetLike) {
			return resolvable.id
		} else if (resolvable instanceof GroupChatMember) {
			return resolvable.user.id
		} else {
			return +resolvable
		}
	}

	/**
	 * Fetches one or more users from their userIds.
	 * @param {UserResolvable | UserResolvable[]} userIds 
	 * @param {boolean} [forceUpdate=false] 
	 * @returns {Promise<Map<number, User> | User>}
	 */
	async fetch(userIds, forceUpdate = false) {
		const returnOnly = !Array.isArray(userIds) && this.resolveId(userIds)
		if (returnOnly) {
			userIds = [userIds]
		}
		const users = new Map
		userIds = userIds.map(resolvable => this.resolveId(resolvable)).filter(userId => {
			const cached = this.cache.rawget(userId)
			users.set(userId, cached)

			return !cached || forceUpdate
		})
		if (userIds.length > 0) {
			const res = await this.client.request.users(`/v1/users`, {method: 'POST', body: {userIds, excludeBannedUsers: false}})
			for (let userData of res.json.data) {
				users.set(userData.id, this.get(userData.id, userData))
			}
		}
		return returnOnly ? users.get(returnOnly) : users
	}

	/**
	 * Checks if the given username is valid.
	 * @param {string} username
	 * @param {('Signup'|'Unknown'|'UsernameChange')} [context]
	 * @param {Date} [birthday]
	 * @returns {Promise<ValidUsername>}
	 */
	async isValidUsername(username, context = 'Unknown', birthday = undefined) {
		const res = await this.client.request.auth('/v2/usernames/validate', {method: 'POST', body: {username, context, birthday: birthday?.toISOString()}})
		return {...res.json, valid: res.json.code == 0}
	}

	/**
	 * Gets user aliases in bulk
	 * @param {UserResolvable | UserResolvable[]} userIds 
	 */
	async batchFetchAlias(userIds) {
		const returnOnly = !Array.isArray(userIds) && this.resolveId(userIds)
		if (returnOnly) {
			userIds = [userIds]
		}
		const aliases = new Map
		if (userIds.length > 0) {
			const res = await this.client.request.contacts(`/v1/user/get-tags`, {method: 'POST', body: {targetUserIds: userIds}})
			for (let aliasData of res.json) {
				aliases.set(aliasData.targetUserId, aliasData.targetUserTag)
			}
		}
		return returnOnly ? aliases.get(returnOnly) : aliases
	}
}

import { GroupChatMember } from "../chat/Conversation.js";