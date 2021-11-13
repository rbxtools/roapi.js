import { User } from "../User.js"
import { GroupChatMember } from "./Conversation.js"
import { MessageExtension } from "./MessageExtension.js"

export class MessageEvent extends MessageExtension {
	constructor(data, client, messageId = data.messageId ?? data.message) {
		super(messageId, client)
		this.type = data.type
	}
	static get(data, client, messageId = data.messageId ?? data.message) {
		switch (data.type) {
			case 'SetConversationUniverse':
				return new SetUniverseEvent(data, client, messageId)
			default:
				return new RawMessageEvent(data, client, messageId)
		}
	}
}

export class RawMessageEvent extends MessageEvent {
	constructor(data, client, messageId = data.messageId ?? data.message) {
		super(data, client, messageId)
		Object.assign(this, data)
	}
}

export class UserMessageEvent extends MessageEvent {
	constructor(data, user, client, messageId = data.messageId ?? data.message) {
		super(data, client, messageId)
		this.actorId = user instanceof User ? user.id : user
	}
	get actor() {
		const convo = this.message.conversation
		const user = this.client.users.get(this.actorId)
		if (convo.isFull() && convo.isGroupChat()) {
			return convo.participants.find(user => user.id === this.actorId) ?? new GroupChatMember(user, convo, this.client)
		} else {
			return user
		}
	}
	async fetchActor(doUpdate = false) {
		const convo = this.message.conversation
		const user = await this.client.users.fetch(this.actorId, doUpdate)
		if (convo.isFull() && convo.isGroupChat()) {
			return convo.participants.find(user => user.id === this.actorId) ?? new GroupChatMember(user, convo, this.client)
		} else {
			return user
		}
	}
}

export class SetUniverseEvent extends UserMessageEvent {
	constructor(data, client, messageId = data.messageId ?? data.message) {
		super(data, data.actorUserId, client, messageId)
		this.universeId = data.universeId
	}
	get universe() {
		return this.client.universes.get(this.universeId)
	}
	fetchUniverse(doUpdate = false) {
		return this.client.universes.fetch(this.universe.id, doUpdate)
	}
}