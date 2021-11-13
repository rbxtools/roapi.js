import {Page} from './ResponsePage.js'
import { camelCase, resolvableId } from '../util.js'
import {Inventory} from './Inventory.js'
import {Avatar} from './Avatar.js'
import { AssetLike } from './AssetLike.js'
import { PrivateConversation } from './chat/Conversation.js'

export class User extends AssetLike {
	constructor(data, client) {
		super(data, client)

		this.inventory = new Inventory(this, client)
		this.avatar = new Avatar(this, client)
		
		this._patch(data)
	}

	_patch(data, skipCase = true) {
		if (!skipCase) {
			data = camelCase(data)
		}
		/**
		 * The player's display name, if known.
		 * @type {string?}
		 */
		this.displayName = data.displayName ?? this.displayName
		return super._patch(data, true)
	}
	
	async getDetails() {
		const res = await this.client.request.users(`/v1/users/${this.id}`)
		res.json.created = new Date(res.json.created)
		return res.json
	}

	async getUsernameHistory(options = {}) {
		return Page.first(`https://users.roblox.com/v1/users/${this.id}/username-history?limit=${options.limit ?? 10}&sortOrder=${options.order ?? "Asc"}`, {mapFunc: obj => obj.name, canDecodeCursors: true}, this.client)
	}

	/**
	 * Gets the user's social networks as shown on their profile.
	 */
	async getSocialNetworks() {
		const res = await this.client.request.account(`/v1/users/${this.id}/promotion-channels`)
		return res.json
	}

	/**
	 * Fetches a list of the user's Roblox badges (not to be confused with player badges) as shown on their profile.
	 */
	async getRobloxBadges() {
		const res = await this.client.request.account(`/v1/users/${this.id}/roblox-badges`)
		return res.json
	}

	/**
	 * Blocks the user.
	 */
	async block() {
		await this.client.request.account(`/v1/users/${this.id}/block`, {method: 'POST'})
	}

	/**
	 * Unblocks the user.
	 */
	async unblock() {
		await this.client.request.account(`/v1/users/${this.id}/unblock`, {method: 'POST'})
	}

	/**
	 * Checks if the user owns the given asset. Not to be confused with the creator of the asset!
	 */
	async ownsAsset(asset) {
		const assetId = resolvableId(asset)
		const res = await this.client.request.general(`/ownership/hasasset?userId=${this.id}&assetId=${assetId}`)
		return res.json
	}

	/**
	 * Checks if the user can manage the given asset.
	 */
	async canManageAsset(asset) {
		const assetId = resolvableId(asset)
		const res = await this.client.request.general(`/users/${this.id}/canmanage/${assetId}`)
		return res.json.CanManage
	}

	/**
	 * Returns true if the authenticated user can invite this user to private servers.
	 * @returns {Promise<boolean>}
	 */
	async canInviteToPrivateServers() {
		const res = await this.client.request.games(`/v1/vip-server/can-invite/${this.id}`)
		return res.json.canInvite
	}

	/**
	 * Fetches or creates a private conversation with this user
	 * @returns {Promise<PrivateConversation>}
	 */
	async getChat() {
		const res = await this.client.request.chat('/v2/start-one-to-one-conversation', {method: 'POST', body: {participantUserId: this.id}})
		const convoData = res.json.conversation
		return this.client.chat.conversations.get(convoData.id, convoData, PrivateConversation)
	}

	/**
	 * Fetches or creates a private conversation with this user
	 * @param {UserResolvable | UserResolvable[]} otherUsers
	 * @param {string} [name]
	 * @returns {Promise<GroupConversation>}
	 */
	createGroupChat(otherUsers, name) {
		if (!Array.isArray(otherUsers)) {
			otherUsers = [otherUsers]
		}
		otherUsers.push(this)
		return this.client.chat.conversations.createGroupChat(otherUsers, name)
	}

	isGroupChatMember() {
		return false
	}

	/**
	 * Gets your alias for this user, or undefined if they don't have one.
	 * 
	 * Use `client.users.batchFetchAlias` if you need to get multiple aliases at once.
	 * @returns {Promise<string?>}
	 */
	fetchAlias() {
		return this.client.users.batchFetchAlias(this.id)
	}

	/**
	 * Sets your alias for this user. They must be a friend.
	 * @param {string} alias 
	 * @returns {Promise<void>}
	 */
	async setAlias(alias) {
		await this.client.request.contacts('/v1/user/tag', {method: 'POST', body: {targetUserId: this.id, userTag: alias}})
	}

	/**
	 * Sets your pending alias for this user. They must have an active friend request.
	 * @param {string} alias
	 * @returns {Promise<void>} 
	 */
	async setPendingAlias(alias) {
		await this.client.request.contacts('/v1/user/set-pending-tag', {method: 'POST', body: {targetUserId: this.id, userTag: alias}})
	}
}