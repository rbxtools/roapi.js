import { camelCase } from "../util.js"
import { AssetLike } from "./AssetLike.js"
import { RichPrivateServerInstance, ServerInstance } from "./ServerInstance.js"
import { User } from "./User.js"

export class PrivateServerPartial extends AssetLike {
	/**
	 * Edits this private server's name, join code, and activity
	 * @param {EditPrivateServerOptions} options 
	 * @returns {Promise<RichPrivateServer>}
	 */
	async edit(options) {
		const res = await this.client.request.games(`/v1/vip-servers/${this.id}`, {method: 'PATCH', body: options})
		const server = this.client.privateServers.get(res.json.id, res.json, RichPrivateServer)
		return server
	}

	/**
	 * Changes the private server's name
	 * @param {string} name 
	 * @returns {Promise<RichPrivateServer>}
	 */
	setName(name) {
		return this.edit({name})
	}

	/**
	 * Regenerates the private server's link code
	 * @returns {Promise<string>}
	 */
	async regenCode() {
		const server = await this.edit({newJoinCode: true})
		return server.joinCode
	}

	/**
	 * Enables or disables the private server
	 * @param {boolean} active 
	 * @returns {Promise<RichPrivateServer>}
	 */
	setActive(active) {
		return this.edit({active})
	}

	/**
	 * Edits this private server's permissions
	 * @param {EditPrivateServerPermissionsOptions} options 
	 * @returns {Promise<PrivateServerPermissions>}
	 */
	async editPermissions(options) {
		options.usersToAdd &&= options.usersToAdd.map(user => this.client.users.resolveId(user))
		options.usersToRemove &&= options.usersToRemove.map(user => this.client.users.resolveId(user))
		const res = await this.client.request.games(`/v1/vip-servers/${this.id}/permissions`, {method: 'PATCH', body: options})
		res.json.users &&= res.json.users.map(user => this.client.users.get(user.id, user))
		return res.json
	}

	/**
	 * Grants the given user(s) access to the private server.
	 * @param {UserResolvable[] | UserResolvable} users 
	 * @returns {Promise<PrivateServerPermissions>}
	 */
	addUsers(users) {
		if (!Array.isArray(users)) {
			users = [users]
		}
		return this.editPermissions({usersToAdd: users})
	}

	/**
	 * Revokes the given user(s)' access to the private server.
	 * @param {UserResolvable[] | UserResolvable} users 
	 * @returns {Promise<PrivateServerPermissions>}
	 */
	removeUsers(users) {
		if (!Array.isArray(users)) {
			users = [users]
		}
		return this.editPermissions({usersToRemove: users})
	}

	/**
	 * Changes whether or not all friends are allowed in this private server.
	 * @param {boolean} friendsAllowed 
	 * @returns {Promise<PrivateServerPermissions>
	 */
	setFriendsAllowed(friendsAllowed) {
		return this.editPermissions({friendsAllowed})
	}

	fetchDetails(doUpdate = false) {
		return this.client.privateServers.fetch(this.id, doUpdate)
	}

	/**
	 * Updates the private server's subscription
	 * @param {EditPrivateServerSubscriptionOptions} options 
	 * @returns {Promise<PrivateServerSubscription>}
	 */
	async editSubscription(options) {
		const res = await this.client.request.games(`/v1/vip-servers/${this.id}/subscription`, {method: 'PATCH', body: options})
		res.json.expirationDate &&= new Date(res.json.expirationDate)
		return res.json
	}

	/**
	 * Updates voice chat settings for this private server
	 * @param {PrivateServerVoiceSettings} options 
	 * @returns {Promise<PrivateServerVoiceSettings>}
	 */
	async editVoiceSettings(options) {
		const res = await this.client.request.games(`/v1/vip-servers/${this.id}/voicesettings`, {method: 'PATCH', body: options})
		return res.json
	}

	/**
	 * Toggles voice chat in this private server
	 * @param {boolean} enabled 
	 * @returns {Promise<PrivateServerVoiceSettings>}
	 */
	setVoiceChatEnabled(enabled) {
		return this.editVoiceSettings({enabled})
	}

	isStandard() {
		return this instanceof PrivateServer
	}

	isRich() {
		return this instanceof RichPrivateServer
	}
}

export class PrivateServer extends PrivateServerPartial {
	constructor(data, client, place = data.place) {
		if (typeof data.id != 'number') {
			data.jobId = data.id
			data.id = data.vipServerId
		}

		super(data, client)

		this.placeId = place.id ?? data.placeId ?? this.placeId

		/**
		 * The userId of the server's owner
		 * @type {number}
		 */
		this.ownerId = data.owner instanceof User ? data.owner.id : data.ownerId ?? data.ownerUserId
	}

	_patch(data, skipCase = false) {
		if (!skipCase) {
			data = camelCase(data)
		}

		/**
		 * The access code used to join the server
		 * @type {string}
		 */
		this.accessCode = data.accessCode ?? this.accessCode

		const hasServerData = data.jobId !== null && data.serverInstance !== null && data.gameInstance !== null && typeof data.id == 'number'
		if (hasServerData) {
			const serverData = {...(data.serverInstance ?? data.gameInstance ?? data)}
			const jobId = data.jobId ?? serverData?.id ?? (typeof data.id == 'string' && data.id)

			console.warn('Could not find jobId in', serverData)

			this.serverInstanceId = jobId
			this.client.servers.get(jobId, data, ServerInstance)
		}

		return this._patch(data, true)
	}

	/**
	 * The current ServerInstance of this private server, if one exists
	 * @type {ServerInstance?}
	 */
	get serverInstance() {
		return this.serverInstanceId && this.client.servers.get(this.serverInstanceId)
	}

	/**
	 * The server's owner
	 * @type {User}
	 */
	get owner() {
		return this.client.users.get(this.ownerId)
	}

	fetchOwner(doUpdate = false) {
		return this.client.users.fetch(this.ownerId, doUpdate)
	}

	/** 
	 * The place this PrivateServer belongs to
	 * @type {import('./Place').Place} 
	 */
	get place() {
		return this.client.places.get(this.placeId)
	}

	fetchPlace(doUpdate = false) {
		return this.client.places.fetch(this.placeId, doUpdate)
	}

	/**
	 * Attempts to convert this into a RichPrivateServer. The promise will reject if it could not be found under the place.
	 * @returns {Promise<RichPrivateServer>}
	 */
	async fetchRich() {
		const servers = await this.place.getRichPrivateServers()
		const richServer = servers.find(server => server.id == this.id)
		if (!richServer) {
			throw new Error("Couldn't find this server under its place. Do you still have access to it?")
		}
		return richServer
	}

	/**
	 * Updates this server's settings
	 * @returns {Promise<RichPrivateServer>}
	 */
	async fetchSettings() {
		const res = await this.client.request.games(`/v1/vip-servers/${this.id}`)
		const serverData = res.json
		serverData.accessCode = this.accessCode
		serverData.place = this.place
		return this.client.privateServers.get(this.id, serverData, RichPrivateServer)
	}

	/**
	 * Shuts down the current running instance of this server
	 * @returns {Promise<void>}
	 */
	shutdown() {
		return this.client.request.legacy('/game-instances/shutdown', {
			method: 'POST', 
			body: `placeId=${this.place.id}&privateServerId=${this.id}`, 
			headers: {'content-type': 'application/x-www-form-urlencoded'}
		})
	}
}

// roblox created/updated timestamps will sometimes be strings like "/Date(123456789)/"
// no clue why
// please consider: using a time stamp thanks builgderman

function getDate(dateString) {
	const matchNumber = +dateString.match(/\d+/)
	return matchNumber ? new Date(matchNumber) : undefined
}

export class RichPrivateServer extends PrivateServer {
	constructor(data, client, place = data.place) {
		data = camelCase(data)
		const privateServer = data.privateServer ?? data

		super(data, client, place)
		
		if (privateServer.universeId) {
			/**
			 * The universe this place belongs to
			 * @type {UniversePartial}
			 */
			this.universe = this.client.universes.get(privateServer.universeId)
		} else if (data.game) {
			this.universe = this.client.universes.get(data.game.id, data)
			this.place ??= this.client.places.get(data.game.rootPlace.id, data.game.rootPlace)
		}
	}

	_patch(data, skipCase = false) {
		if (!skipCase) {
			data = camelCase(data)
		}
		const server = data.privateServer ?? data

		if (typeof server.id != 'number') {
			server.jobId = server.id
			delete server.id
		}
		this.client.users.get(server.ownerUserId, {id: server.ownerUserId, name: data.privateServerOwnerName})
		
		super._patch(server)

		/**
		 * The status type id of the server
		 * @type {number}
		 */
		this.statusType = server.statusType ?? (data.active != null && (data.active ? 1 : 2)) ?? this.statusType

		/**
		 * The date at which the server was created, if known
		 * @type {Date?}
		 */
		this.created = server.created ? getDate(server.created) : this.created

		/**
		 * The date at which the server was last configured, if known
		 * @type {Date?}
		 */
		this.updated = server.updated ? getDate(server.updated) : this.updated

		/**
		 * The private server's link code, if generated
		 * Will be `null` if you are not the private server owner
		 * @type {string?}
		 */
		this.linkCode = server.linkCode ?? data.joinCode ?? this.linkCode

		/**
		 * The private server's link, if generated
		 * Will be `null` if you are not the private server owner
		 * @type {string?}
		 */
		this.link = this.linkCode ? `https://www.roblox.com/games/${this.place.id}?privateServerLinkCode=${this.linkCode}` : this.link

		/** @type {number?} */ // needs documentation lol
		this.lastStatusChangeReasonType = data.mostRecentPrivateServerStatusChangeReasonType ?? this.lastStatusChangeReasonType

		if (data.subscription) {
			data.subscription.expirationDate = new Date(data.subscription.expirationDate)
			this.subscription = data.subscription
		} else {
			/**
			 * Information on this private server's active subscription
			 * @type {PrivateServerSubscription}
			 */
			this.subscription = {...this.subscription, 
				active: data.isPrivateServerSubscriptionActive ?? this.subscription.active,
				expirationDate: server.expirationDate ? getDate(server.expirationDate) : this.subscription.expirationDate,
				canRenew: data.canRenew ?? this.subscription.canRenew
			}
		}

		if (data.permissions) {
			data.permissions.users = data.permissions.users.map(user => user instanceof User ? user : this.client.users.get(user.id, user))
			/**
			 * Information on this private server's permissions
			 * @type {PrivateServerPermissions}
			 */
			this.permissions = data.permissions
		}

		/**
		 * Voice chat settings for this private server
		 * @type {PrivateServerVoiceSettings}
		 */
		this.voiceSettings = data.voiceSettings ?? (data.isVoiceEnabled != null && {...this.voiceSettings, enabled: data.isVoiceEnabled}) ?? this.voiceSettings

		/**
		 * Whether or not the authenticated user owns this private server
		 * @type {boolean}
		 */
		this.isOwner = data.doesBelongToUser ?? this.isOwner ?? true

		/**
		 * The maximum amount of players allowed in this private server
		 * @type {number}
		 */
		this.maxPlayers = data.placeCapacity ?? this.maxPlayers

		/** @deprecated Does not ever seem to be anything other than null */
		this.gameScriptManager = data.gameScriptManager ?? this.gameScriptManager

		/**
		 * Whether or not the private server is active (and joinable)
		 * @type {boolean}
		 */
		this.active = data.active ?? (this.statusType == 1 && data.isPlaceJoinEnabled)

		/**
		 * The script to join the private server on the website
		 * @type {string}
		 */
		this.websiteJoinScript = data.joinScript ?? this.websiteJoinScript ?? `Roblox.GameLauncher.joinPrivateGame(${this.place.id}, '${this.accessCode}', null);return false;`

		/**
		 * Whether or not the authenticated user can configure this private server
		 * @type {boolean}
		 */
		this.canConfigure = data.userCanConfigure ?? this.canConfigure ?? true

		/**
		 * Whether or not the authenticated user can shutdown this private server
		 * @type {boolean}
		 */
		this.canShutdown = data.userCanShutdown ?? this.canShutdown ?? true
		
		if (data.gameInstance) {
			this.serverInstanceId = data.gameInstance.id ?? data.gameInstance.guid ?? this.serverInstanceId
			this.client.servers.get(this.serverInstanceId, data.gameInstance, RichPrivateServerInstance)
		}
	}

	/**
	 * The current RichServerInstance of this private server, if one exists
	 * @type {RichPrivateServerInstance?}
	 */
	get serverInstance() {
		return this.client.servers.get(this.serverInstanceId)
	}

	async editPermissions(...args) {
		const permissions = await super.editPermissions(...args)
		this._patch({permissions})
		return permissions
	}

	async addUsers(...args) {
		const permissions = await super.addUsers(...args)
		this._patch({permissions})
		return permissions
	}

	async removeUsers(...args) {
		const permissions = await super.removeUsers(...args)
		this._patch({permissions})
		return permissions
	}

	async setFriendsAllowed(...args) {
		const permissions = await super.setFriendsAllowed(...args)
		this._patch({permissions})
		return permissions
	}

	async editSubscription(...args) {
		const subscription = await super.editSubscription(...args)
		this._patch({subscription})
		return subscription
	}

	async editVoiceSettings(...args) {
		const voiceSettings = await super.editVoiceSettings(...args)
		this._patch({voiceSettings})
		return voiceSettings
	}

	async setVoiceChatEnabled(...args) {
		const voiceSettings = await super.setVoiceChatEnabled(...args)
		this._patch({voiceSettings})
		return voiceSettings
	}
}