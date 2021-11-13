import { Base } from "../Base.js"

export class MessagePartial extends Base {
	constructor(data, client) {
		super(client)
		this.id = data.id
		this._patch(data)
	}

	_patch(data) {
		this.conversationId = data.conversation instanceof Conversation ? data.conversation.id : data.conversationId ?? data.conversation ?? this.conversationId
		return this
	}

	get conversation() {
		return this.client.chat.conversations.get(this.conversationId)
	}

	fetchConversation(doUpdate = false) {
		return this.client.chat.conversations.fetch(this.conversationId, doUpdate)
	}

	async markAsRead() {
		await this.client.request.chat('/v2/mark-as-read', {method: 'POST', body: {conversationId: this.conversationId, endMessageId: this.id}})
	}

	isFull() {
		return this instanceof Message
	}
}

export class Message extends MessagePartial {
	_patch(data) {
		this.authorType = data.senderType ?? data.authorType ?? this.authorType
		this.system = data.senderType ? data.senderType != 'User' : this.system
		this.read = data.read ?? this.read
		this.created = (data.sent && new Date(data.sent)) ?? this.created
		this.type = data.messageType ?? this.type ?? 'PlainText'
		this.decorators = data.decorators ?? this.decorators

		return super._patch(data)
	}
	isFromUser() {
		return this instanceof UserMessage
	}
	isText() {
		return this instanceof TextMessage
	}
	isLink() {
		return this instanceof LinkMessage
	}
	isSystem() {
		return this instanceof SystemMessage
	}
	isEvent() {
		return this instanceof EventMessage
	}
}

export class UnknownMessage extends Message {
	_patch(data) {
		super._patch(data)

		delete data.messageType
		delete data.sent
		delete data.senderType
		Object.assign(this, data)

		return this
	}
}

export class UserMessage extends Message {
	_patch(data) {
		this.authorId = data.authorId ?? data.senderTargetId
		return super._patch(data)
	}

	get author() {
		if (this.conversation.isGroupChat()) {
			return new GroupChatMember(this.client.users.get(this.authorId), this.conversation, this.client)
		} else {
			return this.client.users.get(this.authorId)
		}
	}

	async fetchAuthor(doUpdate = false) {
		if (this.conversation.isGroupChat()) {
			return new GroupChatMember(await this.client.users.fetch(this.authorId, doUpdate), this.conversation, this.client)
		} else {
			return this.client.users.fetch(this.authorId, doUpdate)
		}
	}
}

export class SystemMessage extends Message {
	// yea	
}

export class TextMessage extends UserMessage {
	_patch(data) {
		this.content = data.content ?? this.content
		return super._patch(data)
	}
}

export class SentMessage extends TextMessage {
	_patch(data) {
		data.filtered = data.filtered ?? data.filteredForReceivers ?? this.filtered
		return super._patch(data)
	}
}

export class LinkMessage extends UserMessage {
	_patch(data) {
		this.link = data.link ? MessageLink.get(data.link, this.client, this.id) : this.link
		return super._patch(data)
	}
}

export class EventMessage extends SystemMessage {
	_patch(data) {
		this.event = data.eventBased ? MessageEvent.get(data.eventBased, this.client, this.id) : this.event
		return super._patch(data)
	}
}

import { Conversation, GroupChatMember } from "./Conversation.js"
import { MessageEvent } from "./MessageEvent.js"
import { MessageLink } from "./MessageLink.js"