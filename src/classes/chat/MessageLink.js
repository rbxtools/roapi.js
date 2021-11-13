import { MessageExtension } from "./MessageExtension.js";

export class MessageLink extends MessageExtension {
	constructor(data, client, messageId = data.messageId ?? data.message) {
		super(messageId, client)
		this.type = data.type
	}
	static get(data, client, messageId = data.messageId ?? data.message) {
		switch (data.type) {
			case 'Game':
				return new GameLink(data, client, messageId)
			default:
				return new UnknownLink(data, client, messageId)
		}
	}
}

export class UnknownLink extends MessageLink {
	constructor(data, client, messageId = data.messageId ?? data.message) {
		super(data, client, messageId)
		Object.assign(this, data)
	}
}

export class GameLink extends MessageLink {
	constructor(data, client, messageId = data.messageId ?? data.message) {
		super(data, client, messageId)
		this.universeId = data.game.universeId ?? data.universeId
	}
	get universe() {
		return this.client.universes.get(this.universeId)
	}
	fetchUniverse(doUpdate = false) {
		return this.client.universes.fetch(this.universeId, doUpdate)
	}
}