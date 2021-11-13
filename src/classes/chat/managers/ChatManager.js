import { Base } from "../../Base.js";
import { ChatMessageManager } from "./ChatMessageManager.js";
import { ConversationManager } from "./ConversationManager.js";

export class ChatManager extends Base {
	/** @type {ChatMessageManager} */
	messages = new ChatMessageManager(this.client)

	/** @type {ConversationManager} */
	conversations = new ConversationManager(this.client)

	async getSettings() {
		return (await this.client.request.chat('/v2/chat-settings')).json
	}

	/**
	 * Gets the rollout status for the requested feature(s)
	 * @param {string[]|string} featureNames 
	 * @returns {Promise<Map<string,boolean>|boolean>}
	 */
	async getFeatureRollouts(featureNames) {
		const returnOnly = !Array.isArray(featureNames) && featureNames
		if (returnOnly) {
			featureNames = [featureNames]
		}
		const res = await this.client.request.chat(`/v2/get-rollout-settings?featureNames=${featureNames.join('&featureNames=')}`)
		const features = res.json.rolloutFeatures.reduce((map, feature) => map.set(feature.featureName, feature.isRolloutEnabled), new Map)
		return returnOnly ? features.get(returnOnly) : features
	}

	async getMetadata() {
		return (await this.client.request.chat('/v2/metadata')).json
	}

	/**
	 * Fetches the number of unread conversations for the authenticated user.
	 * @returns {Promise<number>}
	 */
	async getUnreadConversationCount() {
		return (await this.client.request.chat('https://chat.roblox.com/v2/get-unread-conversation-count')).json.count
	}
}