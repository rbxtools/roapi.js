import { createReadStream } from "fs"
import { Headers } from "node-fetch"
import { init, AssetPartial } from "./AssetPartial.js"
import { TeamCreateConversation } from "./chat/Conversation.js"
import { DataStore } from "./datastores/DataStore.js"
import { GlobalDataStore } from "./datastores/GlobalDataStore.js"
import { LegacyDataStore } from "./datastores/LegacyDataStore.js"
import { OrderedDataStore } from "./datastores/OrderedDataStore.js"
import { Page } from "./ResponsePage.js"
import { ServerInstance } from "./ServerInstance.js"

export class PlacePartial extends AssetPartial {
	_patch(data) {
		this.universeId = data.universeId ?? data.universe?.id ?? data.gameId ?? this.universeId
		return super._patch(data)
	}

	async fetchDetails(doUpdate = false) {
		return this.client.places.fetch(this.id, doUpdate)
	}

	get universe() {
		return this.client.universes.get(this.universeId)
	}

	async fetchUniverse(doUpdate = false) {
		if (!this.universeId) {
			const newPlace = await this.fetchDetails(doUpdate)
			this.universeId = newPlace.universeId
		}
		return this.client.universes.fetch(this.universeId, doUpdate)
	}

	/**
	 * Gets a list of servers for this game. This method uses the developer-facing api, but returns limited information.
	 */
	async getServers(serverType = 'Public', options = {}) {
		return Page.first(`https://games.roblox.com/v1/games/${this.id}/servers/${serverType}?sortOrder=${options.order ?? 'Desc'}&limit=${options.limit ?? 25}`, {mapFunc: serverData => new ServerInstance(serverData, this.client)}, this.client)
	}

	async getPublicServers() {
		return
	}

	async getChat() {
		const res = await this.client.request.chat('/v2/start-cloud-edit-conversation', {method: 'POST', body: {placeId: this.id}})
		const convoData = res.json.conversation
		return this.client.chat.conversations.get(convoData.id, convoData, TeamCreateConversation)
	}

	/** 
	 * Uploads a new version of the place via the Open Cloud API. 
	 * You must have an api key set via `client.
	 * @param {FileResolvable} file
	 * @param {PlaceFileType} [fileType]
	 * @param {PlaceVersionType} [versionType]
	 * @returns {Promise<PlaceUploadResponse>}
	 */
	async upload(file, fileType = 'RBXL', versionType = 'Saved') {
		if (!this.universeId) {
			await this.fetchUniverse()
		}
		if (file.createReadStream) { // fs/promises doesn't export the FileHandle type for some reason
			file = file.createReadStream()
		}
		const {json} = await this.client.request.cloud(`/universes/v1/${this.universeId}/places/${this.id}/versions?versionType=${versionType}`, {
			headers: {'content-type': fileType == 'RBXLX' ? 'application/xml' : 'application/octet-stream'},
			body: file
		})
		return json
	}

	/** 
	 * Uploads a new version of the place fetched via the Open Cloud API.
	 * You must have an api key set via `client.
	 * @param {string} filePath
	 * @param {PlaceFileType} [fileType]
	 * @param {PlaceVersionType} [versionType]
	 * @returns {Promise<PlaceUploadResponse>}
	 */
	uploadFromPath(filePath, fileType = 'RBXL', versionType = 'Saved') {
		return this.uploadPlace(typeof filePath == 'string' ? createReadStream(filePath, {encoding: fileType == 'RBXL' ? null : 'utf-8'}) : filePath, fileType, versionType)
	}

	get studioURL() {
		return `roblox-studio://1+launchmode:edit+task:EditPlace+placeId:${this.id}+universeId:${this.universeId ?? 1}`
	}

	/**
	 * Bulk queries values from multiple DataStores, keys, and scopes
	 * @param {{name: string, key?: string, scope?: string}[]} queries 
	 * @param {"standard"|"sorted"} [type='standard']
	 * @returns {Promise<{key:{name: string, key: string, scope: string}, value: (number|string|Object)}[]>}
	 */
	async bulkDataStoreGet(queries, type = 'standard') {
		const results = []
		for (let i = 0; i < queries.length; i += 100) {
			const response = await this.client.request.datastores(`/persistence/getV2?type=${type}`, {
				headers: { 'Roblox-Place-Id': this.id },
				method: 'POST',
				body: queries.slice(i, i + 100).map(query => {
					return {
						scope: query.scope ?? (query.key ? 'global' : 'u'),
						target: query.key,
						key: query.name
					}
				})
			})
			results.concat(response.json.data)
		}
		return results.map(value => {
			return {
				key: {
					key: value.Key.Target, 
					scope: value.Key.Scope, 
					name: value.Key.Key
				}, 
				value: JSON.parse(value.Value)
			}}
		)
	}

	/**
	 * Returns a DataStore object.
	 * @param {string} name The name of the DataStore to use.
	 * @param {string} [scope='global']  Leave undefined for global scope, pass an empty string for AllScopes
	 * @returns {DataStore}
	 */
	getDataStore(name, scope) {
		return new DataStore(name, scope, this, this.client)
	}

	/**
	 * Returns an OrderedDataStore object.
	 * @param {string} name The name of the OrderedDataStore to use.
	 * @param {string} [scope='global'] The DataStore scope. Leave undefined for the default ("global") scope.
	 * @returns {OrderedDataStore}
	 */
	getOrderedDataStore(name, scope = 'global') {
		return new OrderedDataStore(name, scope, this, this.client)
	}

	/**
	 * The GlobalDataStore object used to manage data created via `DataStoreService:GetGlobalDataStore()` in-game.
	 * @type {GlobalDataStore}
	 */
	get globalDataStore() {
		Object.defineProperty(this, 'globalDataStore', {value: new GlobalDataStore(this, this.client)})
		return this.globalDataStore
	}

	/**
	 * Returns a `LegacyDataStore` object, which uses the V1 APIs to manage data in a named DataStore.
	 * @deprecated You shouldn't be using this unless you have a specific reason. Use `getDataStore` instead.
	 * @param {string} name The name of the DataStore to use.
	 * @param {string} [scope='global']  Leave undefined for global scope, pass an empty string for AllScopes
	 * @returns {LegacyDataStore}
	 */
	getLegacyDataStore(name, scope = 'global') {
		return new LegacyDataStore(name, scope, this, this.client)
	}

	/**
	 * Gets the developer-configured settings for the place. You must be a developer of the place to use this.
	 * @returns 
	 */
	async getSettings() {
		const res = await this.client.request.develop(`/v2/places/${this.id}`)
		this.universeId = res.json.universeId
		this.name = res.json.name
		return res.json
	}

	/**
	 * Updates the developer-configured settings for the place. You must be a developer of the place to use this.
	 * @returns 
	 */
	async patchSettings(settings) {
		const res = await this.client.request.develop(`/v2/places/${this.id}`, {
			method: 'PATCH',
			body: settings
		})
		this.universeId = res.json.universeId
		this.name = res.json.name
		return res.json
	}
}

export class PlaceAsset extends PlacePartial {
	
}

export class Place extends PlaceAsset {
	
}

init()