import { Cache } from "../../Cache.js";
import { Collection } from "../../Collection.js";
import { BaseManager } from "../../managers/BaseManager.js";
import { EventMessage, LinkMessage, Message, MessagePartial, SentMessage, SystemMessage, TextMessage, UnknownMessage, UserMessage } from "../Message.js";

const messageTypes = {
	PlainText: TextMessage,
	Link: LinkMessage
}

/** @typedef {string | MessagePartial} ChatMessageResolvable */

/**
 * @class
 * @extends {BaseManager<MessagePartial, string, ChatMessageResolvable>}
 */
export class ChatMessageManager extends BaseManager {
	/** @type {Cache<MessagePartial>} */
	cache = new Cache(MessagePartial, this.client, [MessagePartial, Message, UnknownMessage, SystemMessage, UserMessage, EventMessage, TextMessage, SentMessage, LinkMessage])

	/**
	 * Converts the ChatMessageResolvable into a messageId.
	 * @param {ChatMessageResolvable} resolvable 
	 * @returns {string}
	 */
	resolveId(resolvable) {
		if (typeof resolvable == 'string') {
			return resolvable
		} else if (resolvable instanceof MessagePartial) {
			return resolvable.id
		}
	}

	get(id, data = {id}, overrideClass = undefined, weak = undefined) {
		const msgType = data.type ?? data.messageType
		return this.cache.get(id, data, overrideClass ?? (msgType ? messageTypes[msgType] ?? UnknownMessage : MessagePartial), weak)
	}

	async getLatest(conversations, amount = 25) {
		const returnOnly = !Array.isArray(conversations) && this.client.chat.conversations.resolveId(conversations)
		if (returnOnly) {
			conversations = [conversations]
		}
		conversations = conversations.map(convo => this.client.chat.conversations.resolveId(convo))
		const res = await this.client.request.chat(`/v2/multi-get-latest-messages?conversationIds=${conversations.join('&conversationIds=')}&pageSize=${amount}`)
		const map = new Map
		for (let conversation of res.json) {
			const pages = new Collection(`https://chat.roblox.com/v2/get-messages?conversationId=${this.id}&pageSize=${amount}`, res.json, this.client, {
				mapFunc: msg => this.client.chat.messages.get(msg.id, msg),
				nextPageFunc: pages => pages.contents[pages.contents.length - 1].id,
				prevPageFunc: () => null,
				cursorName: 'exclusiveStartMessageId',
				currentCursor: ''
			})
			map.set(conversation.id, pages)
		}
		return returnOnly ? map.get(returnOnly) : map
	}
}