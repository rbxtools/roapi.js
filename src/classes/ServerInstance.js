import { camelCase } from "../util.js"
import { Base } from "./Base.js"

export class PartialServerInstance extends Base {
	/** 
	 * The JobId of this server
	 * @type {string}
	 * @readonly
	 */
	id

	constructor(data, client) {
		super(client)
		if (!data.place?.id && !data.placeId) {
			throw new TypeError('No place.id or placeId specified in constructor')
		}

		/**
		 * The JobId of this server
		 * @name PartialServerInstance#id
		 * @type {string}
		 * @readonly
		 */
		Object.defineProperty(this, 'id', {value: data.id})

		this._patch(data)
	}
	_patch(data) {
		this.placeId = data.place?.id ?? data.placeId ?? data.place ?? this.placeId

		return this
	}

	get place() {
		return this.client.places.get(this.placeId)
	}

	fetchPlace(doUpdate = false) {
		return this.client.places.fetch(this.placeId, doUpdate)
	}

	isFull() {
		return this instanceof ServerInstance
	}

	isRich() {
		return this instanceof RichServerInstance
	}

	isRichPrivate() {
		return this instanceof RichPrivateServerInstance
	}
}

export class ServerInstance extends PartialServerInstance {
	constructor(data, client, place = data.place) {
		data = camelCase(data)
		data.id ??= data.jobId ?? data.guid
		data.place ??= place
		super(data, client)
	}
	_patch(data, skipCase = false) {
		if (!skipCase) {
			data = camelCase(data)
		}
		
		/**
		 * The maximum amount of players allowed in this server
		 * @type {number}
		 */
		this.maxPlayers = data.maxPlayers ?? data.capacity ?? this.maxPlayers

		/**
		 * The amount of players currently in this server
		 * @type {number}
		 */
		this.playing = data.playing ?? this.playing

		// if someone knows what these playerTokens are feel free to PR with docs
		/**
		 * @type {string[]?}
		 */
		this.playerTokens = data.playerTokens ?? this.playerTokens

		/**
		 * The FPS of the server, presumably for physics
		 * @type {number}
		 */
		this.fps = data.fps ?? this.fps

		/**
		 * The server's ping in milliseconds
		 * @type {number}
		 */
		this.ping = data.ping ?? this.ping

		return super._patch(data)
	}
}

export class RichServerPlayer extends Base {
	constructor(data, client, skipCase = false) {
		super(client)
		if (skipCase) {
			data = camelCase(data)
		}
		if (data.id) {
			this.userId = data.id
		}

		/**
		 * The player's thumbnail URL
		 * @type {string}
		 */
		this.thumbnailUrl = data.thumbnail.url

		const avatarId = this.url.match(/rbxcdn\.com\/([\w\d-]+)\//)
		/**
		 * The player's avatar hash extracted from their thumbnailUrl
		 * @type {string}
		 */
		this.avatarId = avatarId ? avatarId[1] : undefined

		/**
		 * Whether or not the thumbnail is ready for use
		 * @type {boolean}
		 */
		this.isFinal = data.thumbnail.isFinal
	}

	/**
	 * A user object representing this player, if their id is known
	 * @type {User?}
	 */
	get user() {
		return this.client.users.get(this.userId)
	}

	fetchUser(doUpdate = false) {
		if (!this.userId) {
			return null
		}
		return this.client.users.fetch(this.userId, doUpdate)
	}

	equals(user) {
		if (typeof user == 'string') {
			return this.avatarId == user || this.thumbnailUrl == user
		} else if (user instanceof RichServerPlayer) {
			return this.avatarId == user.avatarId || this.thumbnailUrl == user.thumbnailUrl
		}
		return false
	}
}

export class RichServerInstance extends ServerInstance {
	constructor(data, client, place = data.place) {
		super(data, client, place)
		this._patch(data)
	}
	_patch(data, skipCase = false) {
		if (!skipCase) {
			data = camelCase(data)
		}
		
		this.slowGame = data.showSlowGameMessage ?? data.slowGame ?? this.slowGame
		this.canJoin = data.userCanJoin ?? data.canJoin ?? this.canJoin
		this.canShutdown = data.showShutdownButton ?? data.canShutdown ?? this.canShutdown
		this.websiteDisplay = data.joinScript ? {
			friendsDescription: data.friendsDescription,
			friendsMouseOver: data.friendsMouseOver,
			playersCapacity: data.playersCapacity,
			joinScript: data.joinScript,
			mobileJoinScript: data.robloxAppJoinScript
		} : this.websiteDisplay
		this.playerThumbnails = data.currentPlayers ? data.currentPlayers.map(plr => new RichServerPlayer(plr, this.client)) : this.playerThumbnails

		return super._patch(data, true)
	}
}

export class RichPrivateServerInstance extends ServerInstance {
	constructor(data, client, place = data.place) {
		super(data, client, place)
		this._patch(data)
	}
	_patch(data, skipCase = false) {
		if (!skipCase) {
			data = camelCase(data)
		}
		
		this.ip = data.serverIp
		this.playerIds = data.playerIds ?? this.playerIds
		this.gameCode = data.gameCode
		this.matchmakingContextId = data.matchmakingContextId

		this._patch(data, true)
	}
	get players() {
		return this.playerIds.map(userId => this.client.users.get(userId))
	}
	async fetchPlayers(doUpdate = false) {
		return (await this.client.users.fetch(this.playerIds, doUpdate)).values()
	}
}