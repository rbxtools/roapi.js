import { AssetLike } from "../AssetLike.js";
import { Base } from "../Base.js";
import { Collection } from "../Collection.js";
import { LinkMessage, SentMessage } from "./Message.js";

export class ConversationPartial extends AssetLike {
	constructor(data, client) {
		super(data, client)
		this._patch(data)
		this.messages = this.client.chat.messages
	}

	isFull() {
		return this instanceof Conversation
	}

	fetchDetails(doUpdate = false) {
		return this.client.chat.conversations.fetch(this.id, doUpdate)
	}

	async fetchMessages(pageSize = 25) {
		const pages = await Collection.first(`https://chat.roblox.com/v2/get-messages?conversationId=${this.id}&pageSize=${pageSize}`, this.client, {
			mapFunc: msg => this.client.chat.messages.get(msg.id, {...msg, conversationId: this.id}),
			nextPageFunc: pages => pages.contents[pages.contents.length - 1]?.id,
			previousPageFunc: () => null,
			cursorName: 'exclusiveStartMessageId',
			currentCursor: ''
		})
		return pages
	}

	async markAsRead() {
		const res = await this.client.request.chat('https://chat.roblox.com/v2/mark-as-read', {method: 'POST', body: {conversationId: this.id}})
		return res.json
	}

	async resetUniverse() {
		await this.client.request.chat('/v2/reset-conversation-universe', {method: 'POST', body: {conversationId: this.id}})
		this.universeId = null
	}

	async setUniverse(universe) {
		if (!universe) {
			return this.resetUniverse()
		}
		universe = this.client.universes.resolveId(universe)
		await this.client.request.chat('/v2/set-conversation-universe', {method: 'POST', body: {universeId: universe, conversationId: this.id}})
		this.universeId = universe
	}

	async send(options) {
		if (!options) throw new Error('No message options provided')
		if (typeof options == 'string') options = {content: options}
		const res = await this.client.request.chat('/v2/send-message', {method: 'POST', body: {
			message: options.message ?? options.content, 
			decorators: options.decorators ?? [],
			conversationId: this.id
		}})
		const sent = res.json
		return this.client.chat.messages.get(sent.messageId, {
			id: sent.messageId,
			content: sent.content,
			filtered: sent.filteredForReceivers,
			sent: sent.sent,
			messageType: sent.messageType,
			decorators: options.decorators,
			senderType: 'User',
			senderTargetId: this.client.user.id,
			read: true
		}, SentMessage)
	}

	async sendGameLink(universe, decorators = []) {
		const res = await this.client.request.chat('/v2/send-game-link-message', {method: 'POST', body: {
			universeId: this.client.universes.resolveId(universe),
			decorators,
			conversationId: this.id
		}})
		const sent = res.json
		return this.client.chat.messages.get(sent.messageId, {
			id: sent.messageId,
			messageType: sent.messageType,
			sent: sent.sent,
			decorators,
			senderType: 'User',
			senderTargetId: this.client.user.id,
			read: true
		}, LinkMessage)
	}

	async setTyping(isTyping) {
		await this.client.request.chat('/v2/update-user-typing-status', {method: 'POST', body: {isTyping, conversationId: this.id}})
	}
}

export class Conversation extends ConversationPartial {
	constructor(data, client) {
		super(data, client)
		this._patch(data)
	}
	async get(data, client) {
		switch (data.conversationType) {
			case 'OneToOneConversation':
				return new PrivateConversation(data, client)
			case 'MultiUserConversation':
				return new GroupConversation(data, client)
			case 'CloudEditConversation':
				return new TeamCreateConversation(data, client)
			default:
				return new Conversation(data, client)
		}
	}
	_patch(data) {
		if (data.initiator) {
			const user = this.client.users.get(data.initiator.id, data.initiator)
			if (this instanceof GroupConversation) {
				this.initiator = new GroupChatMember(user, this, this.client)
			} else {
				this.initiator = user
			}
		}
		this.hasUnreadMessages = data.hasUnreadMessages ?? this.hasUnreadMessages

		/** @type {GroupChatMember[]} */
		this.participants = data.participants ? data.participants.map(user => {
			if (this instanceof GroupConversation) {
				return new GroupChatMember(this.client.users.get(user.id, user), this, this.client)
			} else {
				return this.client.users.get(user.id, user)
			}
		}) : this.participants

		this.type = data.conversationType ?? this.type
		this.lastUpdated = data.lastUpdated ? new Date(data.lastUpdated) : this.lastUpdated
		
		const universeId = data.universeId ?? data.universe?.universeId
		if (universeId !== undefined) {
			this.universeId = universeId
			this.client.universes.get(data.universe.universeId, {id: data.universe.universeId, rootPlaceId: data.universe.rootPlaceId})
		}
		
		this.title = data.conversationTitle ?? this.title

		return super._patch(data)
	}
	get universe() {
		return this.universeId && this.client.universes.get(this.universeId)
	}
	fetchUniverse(doUpdate = false) {
		return this.universeId && this.client.universes.fetch(this.universeId, doUpdate)
	}
	isGroupChat() {
		return this instanceof GroupConversation
	}
	isPrivateChat() {
		return this instanceof PrivateConversation
	}
	isTeamCreateChat() {
		return this instanceof TeamCreateConversation
	}
}

export class GroupConversation extends Conversation {
	/**
	 * Adds the given member(s) to this conversation
	 * @param {UserResolvable|UserResolvable[]} users 
	 * @returns {Promise<Map<User, string>|void>} A map of all the users who could not be added and why, or void if only one user was added.
	 */
	async addMembers(users) {
		const returnOnly = !Array.isArray(users) && users
		if (returnOnly) {
			users = [users]
		}
		users = users.map(user => this.client.users.resolveId(user))
		const res = await this.client.request.chat('/v2/add-to-conversation', {method: 'POST', body: {participantUserIds: users, conversationId: this.id}})
		const result = res.json

		const rejected = new Map

		if (result.rejectedParticipants?.length > 0) {
			for (let user of result.rejectedParticipants) {
				rejected.set(this.client.users.get(user.targetId, user), user.rejectedReason)
			}
			if (returnOnly) {
				throw new Error(result.rejectedParticipants[0].rejectedReason)
			}
		}

		return returnOnly ? undefined : rejected
	}

	/**
	 * Removes the given member from this group
	 * @param {UserResolvable} user 
	 * @returns {Promise<void>}
	 */
	async removeMember(user) {
		user = this.client.users.resolveId(user)
		await this.client.request.chat('/v2/remove-from-conversation', {method: 'POST', body: {participantUserId: user, conversationId: this.id}})
		this.participants = this.participants.filter(member => member.id != user)
	}

	/**
	 * Renames this group conversation
	 * @returns {Promise<ConversationTitle>}
	 */
	async setName(name) {
		const res = await this.client.request.chat('/v2/rename-group-conversation', {method: 'POST', body: {conversationId: this.id, newTitle: name}})
		this.name = res.json.conversationTitle
		this.title = res.json.title
		return res.json.title
	}
}

export class TeamCreateConversation extends Conversation {

}

export class PrivateConversation extends Conversation {
	get user() {
		return this.participants.find(user => user.id != this.client.user.id)
	}
}

export class GroupChatMember extends Base {
	constructor(user, chat, client) {
		super(client)
		/** @type {User} */
		this.user = user
		/** @type {Conversation} */
		this.conversation = chat
		this.id = user.id
	}
	get name() {
		return this.user.name
	}
	get displayName() {
		return this.user.displayName
	}
	remove() {
		return this.conversation.removeMember(this)
	}
	isGroupChatMember() {
		return true
	}
}