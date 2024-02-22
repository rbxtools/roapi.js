import { UserAPIManagerAuthenticated } from "./managers/APIManager.js"

export class PrivacySettings extends UserAPIManagerAuthenticated {
	async get(endpoint, index) {
		const res = await this.client.request.settings(`/v1/${endpoint}`)
		return res.json[index]
	}

	async set(endpoint, index, value, method = 'POST') {
		const body = {}
		body[index] = value
		const res = await this.client.request.settings(`/v1/${endpoint}`, {method, body})
		return res.json
	}

	/**
	 * Gets the privacy level of the website chat for the authenticated user.
	 */
	async getWebsiteChatPrivacy() {
		return this.get('app-chat-privacy', 'appChatPrivacy')
	}
	/**
	 * Updates the privacy level of the website chat for the authenticated user. PIN must be unlocked.
	 */
	async setWebsiteChatPrivacy(privacy) {
		return this.set('app-chat-privacy', 'appChatPrivacy', privacy)
	}

	/**
	 * Gets the privacy level of in-game chat for the authenticated user.
	 */
	async getGameChatPrivacy() {
		return this.get('game-chat-privacy', 'gameChatPrivacy')
	}
	/**
	 * Updates the privacy level of in-game chat for the authenticated user. PIN must be unlocked.
	 */
	async setGameChatPrivacy(privacy) {
		return this.set('game-chat-privacy', 'gameChatPrivacy', privacy)
	}

	/**
	 * Gets the privacy level of the authenticated user's inventory.
	 */
	async getInventoryPrivacy() {
		return this.get('inventory-privacy', 'inventoryPrivacy')
	}
	/**
	 * Updates the privacy level of the authenticated user's inventory. PIN must be unlocked.
	 */
	async setInventoryPrivacy(privacy) {
		return this.set('inventory-privacy', 'inventoryPrivacy', privacy)
	}

	/**
	 * Gets the privacy level of trading for the authenticated user.
	 */
	async getTradePrivacy() {
		return this.get('trade-privacy', 'tradePrivacy')
	}
	/**
	 * Updates the privacy level of trading for the authenticated user. PIN must be unlocked.
	 */
	async setTradePrivacy(privacy) {
		return this.set('trade-privacy', 'tradePrivacy', privacy)
	}

	/**
	 * Gets the authenticated user's phone discovery settings
	 */
	async getPhoneDiscoveryPrivacy() {
		return this.get('privacy', 'phoneDiscovery')
	}
	/**
	 * Updates the authenticated user's phone discovery settings. PIN must be unlocked.
	 */
	async setPhoneDiscoveryPrivacy(privacy) {
		return this.set('privacy', 'phoneDiscovery', privacy, 'PATCH')
	}

	/**
	 * Gets the authenticated user's privacy message privacy settings.
	 */
	async getPrivateMessagePrivacy() {
		return this.get('private-message-privacy', 'privateMessagePrivacy')
	}
	/**
	 * Updates the authenticated user's phone discovery settings. PIN must be unlocked.
	 */
	async setPrivateMessagePrivacy(privacy) {
		return this.set('private-message-privacy', 'privateMessagePrivacy', privacy)
	}

	/**
	 * Gets the authenticated user's visibility privacy
	 */
	async getVisibility() {
		return this.get('visibility-privacy', 'visibilityPrivacy')
	}
	/**
	 * Sets the authenticated user's visibility privacy
	 */
	async setVisibility(privacy) {
		return this.set('visibility-privacy', 'visibilityPrivacy', privacy)
	}

	/**
	 * Gets the authenticated user's content restriction level
	 */
	async getContentRestrictions() {
		return this.get('content-restriction', 'contentRestrictionLevel')
	}
	/**
	 * Gets the authenticated user's content restriction level
	 */
	async setContentRestrictions(level) {
		return this.set('content-restriction', 'contentRestrictionLevel', level)
	}
}