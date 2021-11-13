import { Base } from "../Base.js"
import { Message } from "./Message.js"

export class MessageExtension extends Base {
	constructor(messageId, client) {
		super(client)
		this.messageId = messageId instanceof Message ? messageId.id : messageId
	}
	get message() {
		return this.client.chat.messages.get(this.messageId)
	}
}