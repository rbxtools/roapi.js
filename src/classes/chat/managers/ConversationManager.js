import { Cache } from "../../Cache.js";
import { Collection } from "../../Collection.js";
import { MultiFetchableManager } from "../../managers/BaseManager.js";
import { Conversation, ConversationPartial, GroupConversation, PrivateConversation, TeamCreateConversation } from "../Conversation.js";

const convoTypes = {
	OneToOneConversation: PrivateConversation,
	GroupConversation,
	CloudEditConversation: TeamCreateConversation
}

/** @typedef {number | string | ConversationPartial} ConversationResolvable */

/**
 * @class
 * @extends {MultiFetchableManager<ConversationPartial, number, ConversationResolvable, Conversation>}
 */
export class ConversationManager extends MultiFetchableManager {
	/** @type {Cache<ConversationPartial>} */
	cache = new Cache(ConversationPartial, this.client, [ConversationPartial, Conversation, PrivateConversation, GroupConversation, TeamCreateConversation])

	get(id, data = {id}, overrideClass = undefined, weak = undefined) {
		const convoType = data.type ?? data.conversationType
		return this.cache.get(id, data, overrideClass ?? (convoType ? convoTypes[convoType] ?? Conversation : ConversationPartial), weak)
	}

	/**
	 * Marks the given conversation(s) as seen
	 * @param {ConversationResolvable|ConversationResolvable[]} conversations 
	 * @returns {Promise<Dictionary>}
	 */
	async markAsSeen(conversations) {
		if (!Array.isArray(conversations)) {
			conversations = [conversations]
		}
		const res = await this.client.request.chat('https://chat.roblox.com/v2/mark-as-seen', {method: 'POST', body: {conversationsToMarkSeen: conversations.map(conv => this.resolveId(conv))}})
		return res.json
	}

	async fetchAll(pageSize = 10, startPage = 1) {
		return Collection.first(`https://chat.roblox.com/v2/get-user-conversations?pageNumber=${startPage}&pageSize=${pageSize}`, this.client, {
			mapFunc: convo => this.get(convo.id, convo),
			nextPageFunc: pages => pages.currentCursor + 1,
			prevPageFunc: pages => (pages.currentCursor > 1) ? (pages.currentCursor - 1) : null,
			cursorName: 'pageNumber',
			currentCursor: 0
		})
	}

	/**
	 * Creates a new group chat with the given users.
	 * @param {UserResolvable | UserResolvable[]} users 
	 * @param {string} [name] 
	 * @returns {Promise<GroupConversation>}
	 */
	async createGroupChat(users, name) {
		if (!Array.isArray(users)) {
			users = [users]
		}
		users = users.map(user => this.client.users.resolveId(user))
		const res = await this.client.request.chat('/v2/start-group-conversation', {
			method: 'POST',
			body: {
				participantUserIds: users,
				title: name
			}
		})
		const convoData = res.json.conversation
		return this.client.chat.conversations.get(convoData.id, convoData, GroupConversation)
	}

	/**
	 * Fetches one or more users from their userId
	 * @param {AssetResolvable | AssetResolvable[]} assetIds 
	 * @param {boolean} [forceUpdate=false] 
	 * @returns {Promise<Map<number, Conversation> | Conversation>}
	 */
	async fetch(conversationIds, forceUpdate = false) {
		const returnOnly = !Array.isArray(conversationIds) && this.resolveId(conversationIds)
		if (!returnOnly) {
			conversationIds = [conversationIds]
		}
		const conversations = new Map
		conversationIds = conversationIds.map(resolvable => this.resolveId(resolvable)).filter(conversationId => {
			const cached = this.cache.rawget(conversationId)
			conversations.set(conversationId, cached)

			return !(cached && !(cached instanceof Conversation) && !forceUpdate)
		})
		if (conversationIds.length > 0) {
			const res = await this.client.request.chat(`/v2/get-conversations?conversationIds=${conversationIds.join('&conversationIds=')}`)
			for (let conversationData of res.json) {
				conversations.set(conversationData.id, this.get(conversationData.id, conversationData))
			}
		}
		return returnOnly ? conversations.get(returnOnly) : conversations
	}
}