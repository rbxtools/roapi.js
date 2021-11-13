import { createHash } from "crypto"
import { Headers } from "node-fetch"
import { PlaceAPIManager } from "../managers/APIManager.js"
import { Page } from "../ResponsePage.js"

export class DataStoreVersion {
	/**
	 * @param {DataStore} datastore 
	 * @param {string} key
	 */
	constructor(datastore, key, options) {
		/** The DataStore object this was retrieved from */
		this.datastore = datastore
		this.client = datastore.client
		/** The key this was retrieved from */
		this.key = key
		/** The version id associated with this data */
		this.version = options.version
		/** Whether this specific version has been deleted from the DataStore */
		this.deleted = options.deleted ?? false
		/** The expected size of this data when retrieved */
		this.size = +options.size ?? +options.contentLength ?? 0
		/** The date and time at which this key was first created */
		this.keyCreated = new Date(options.keyCreated ?? options.objectCreatedTime)
		/** The date and time at which this specific version was created */
		this.versionCreated = new Date(options.versionCreated ?? options.createdTime)
	}
	/** Attempts to fetch this latest version of the data from the DataStore */
	getLatest() {
		return this.datastore.get(this.key)
	}
	/** Attempts to fetch this specific version of the data from the DataStore */
	getVersion() {
		return this.datastore.get(this.key, this.version)
	}
	/** Deletes this version of the data from the DataStore */
	async deleteVersion() {
		const res = await this.datastore.deleteVersion(this.key, this.version)
		this.deleted = true
		return res
	}
}

export class DataStoreValue extends DataStoreVersion {
	/**
	 * @param {DataStore} datastore 
	 * @param {string} key
	 * @param {import('../Response').RobloxResponse | Object} res 
	 */
	constructor(datastore, key, res) {
		super(datastore, key, {
			version: res.headers.get('roblox-object-version-id'),
			keyCreated: res.headers.get('roblox-object-created-time'),
			versionCreated: res.headers.get('roblox-object-version-created-time'),
			size: +res.headers.get('content-length'),
		})
		/** The parsed value associated with the key */
		this.value = res.json
		/** The base64-encoded MD5 hash of the expected value */
		this.hash = Buffer.from(res.headers.get('content-md5'), 'base64')
		/** The attributes associated with this key */
		this.attributes = JSON.parse(res.headers.get('roblox-object-attributes') ?? 'null')
		/** The user ids associated with this key */
		this.userIds = JSON.parse(res.headers.get('roblox-object-userids') ?? 'null')
	}
	set value(value) {
		if (value == null) {
			throw new TypeError('Value cannot be null')
		}
		const stringValue = JSON.stringify(value)
		this.hash = createHash('md5').update(stringValue).digest('base64')
		this.size = stringValue.length
	}
	/** The users associated with this key in object form */
	get users() {
		return this.userIds?.map(id => this.client.users.get(id)) ?? []
	}
	set users(users) {
		this.userIds = users
	}
	/** Fetches the complete user objects for all users associated with this key */
	async fetchUsers(doUpdate = false) {
		return (await this.client.users.fetch(this.userIds, doUpdate)).values()
	}
	/** Updates the DataStore to reflect this object's values */
	async update(updateThisObject = true) {
		const version = await this.datastore.set(this.key, this.value, this.attributes, this.userIds)
		if (updateThisObject) {
			this.version = version.version
			this.versionCreated = version.versionCreated
			return this
		} else {
			return version
		}
	}
}

export class DataStore extends PlaceAPIManager {
	/**
	 * @param {string} name 
	 * @param {string} [scope='global'] Leave undefined for global scope, use '' for AllScopes
	 * @param {import('../Place').PlacePartial} place
	 */
	constructor(name, scope = 'global', place, client = place.client) {
		super(place, client)
		this.name = name
		this.scope = scope
		this.type = 'standard'

		this.headers = new Headers()
		this.headers.set('Roblox-Place-Id', this.placeId)
		this.universeId = this.place.universeId
	}

	get nameEncoded() {
		return encodeURIComponent(this.name)
	}

	get scopeEncoded() {
		if (this.scope == '') return ''
		return encodeURIComponent(this.scope.endsWith('/') ? this.scope : `${this.scope}/`)
	}

	/**
	 * Primarily for internal use.
	 * @returns {Promise<number>}
	 */
	async getUniverseId() {
		return this.universeId ?? (this.universeId = (await this.fetchPlace()).universeId)
	}

	/**
	 * Returns data from the DataStore.
	 * @param {string} key
	 * @param {string} [version] The version of the data to return. Defaults to the latest version.
	 * @returns {Promise<DataStoreValue>}
	 */
	async get(key, version = undefined) {
		const response = await this.client.request.datastores(`/v2/persistence/${await this.getUniverseId()}/datastores/objects/object?datastore=${this.nameEncoded}&objectKey=${this.scopeEncoded}${encodeURIComponent(key)}&version=${version ?? ''}`, {headers: this.headers})
		return new DataStoreValue(this, key, response)
	}

	/** 
	 * Sets data at the given key to the given value.
	 * @param {string} key
	 * @param {string|number|Object} value
	 * @param {import("../managers/UserManager").UserResolvable[]} [userIds] The users to associate with this key, if any. **If unspecified, any existing userIds associated with this key will be removed.**
	 * @param {Object} [attributes] The attributes to associate with this key, if any. **If unspecified, any existing attributes associated with this key will be removed.**
	 * @returns {Promise<DataStoreVersion>}
	 */
	async set(key, value, userIds, attributes) {
		const headers = new Headers(this.headers)
		userIds &&= JSON.stringify(userIds.map(id => this.client.users.resolveId(id)))
		attributes &&= JSON.stringify(attributes)
		if (userIds) headers.set('roblox-object-userids', userIds)
		if (attributes) headers.set('roblox-object-attributes', attributes)
		const stringValue = JSON.stringify(value)
		const hash = createHash('md5').update(stringValue).digest('base64')
		headers.set('content-md5', hash)
		headers.set('content-length', stringValue.length)
		const res = await this.client.request.datastores(`/v2/persistence/${await this.getUniverseId()}/datastores/objects/object?datastore=${this.nameEncoded}&objectKey=${this.scopeEncoded}${encodeURIComponent(key)}`, {
			headers, 
			method: 'POST',
			body: stringValue
		})
		res.headers.set('content-length', stringValue.length)
		res.headers.set('content-md5', hash)
		if (attributes) res.headers.set('roblox-object-attributes', attributes)
		if (userIds) res.headers.set('roblox-object-userids', userIds)
		return DataStoreValue(this, key, res)
	}

	/**
	 * Removes the given key's value from the DataStore and returns it.
	 * @param {string} key
	 * @param {string} [version] The version of the data to remove. If blank, the current value will be removed.
	 * @returns {Promise<DataStoreValue>} The value that was previously in the DataStore
	 */
	async remove(key, version = undefined) {
		const response = await this.client.request.datastores(`/v2/persistence/${await this.getUniverseId()}/datastores/objects/object?datastore=${this.nameEncoded}&objectKey=${this.scopeEncoded}${encodeURIComponent(key)}&version=${version ?? ''}`, {headers: this.headers, method: 'DELETE'})
		return new DataStoreValue(this, key, response)
	}

	/**
	 * Increments the given value by the given amount
	 * @param {string} key The DataStore key
	 * @param {number} amount The amount to increase the value by
	 * @param {import("../managers/UserManager").UserResolvable[]} [userIds] The users to associate with this key, if any. **If unspecified, any existing userIds associated with this key will be removed.**
	 * @param {Object} [attributes] The attributes to associate with this key, if any. **If unspecified, any existing attributes associated with this key will be removed.**
	 * @returns {Promise<DataStoreValue>} The new value
	 */
	async increment(key, amount, userIds, attributes) {
		const headers = new Headers(this.headers)
		userIds &&= JSON.stringify(userIds.map(id => this.client.users.resolveId(id)))
		attributes &&= JSON.stringify(attributes)
		if (userIds) headers.set('roblox-object-userids', userIds)
		if (attributes) headers.set('roblox-object-attributes', attributes)
		const stringValue = JSON.stringify(amount)
		const hash = createHash('md5').update(stringValue).digest('base64')
		headers.set('content-md5', hash)
		headers.set('content-length', stringValue.length)
		const res = await this.client.request.datastores(`/v2/persistence/${await this.getUniverseId()}/datastores/objects/object/increment?datastore=${this.nameEncoded}&objectKey=${this.scopeEncoded}${encodeURIComponent(key)}&incrementBy=${stringValue}`, {headers, method: 'POST'})
		res.headers.set('content-length', stringValue.length)
		res.headers.set('content-md5', hash)
		if (attributes) res.headers.set('roblox-object-attributes', attributes)
		if (userIds) res.headers.set('roblox-object-userids', userIds)
		return DataStoreValue(this, key, res)
	}

	/**
	 * Gets paginated version history for the given key
	 * @param {string} key The DataStore key
	 * @param {Date} startDate The earliest date to include in the results
	 * @param {Date} endDate The latest date to include in the results
	 * @param {number} [maxPageSize=50] The *maximum* number of versions to return per page.  This is not guaranteed to be the number of versions returned.
	 * @returns {Promise<Page<DataStoreVersion[]>>}
	 */
	async listVersions(key, startDate, endDate, maxPageSize = 50, sortOrder = 'Ascending') {
		return await Page.first(`https://gamepersistence.roblox.com/v2/persistence/${await this.getUniverseId()}/datastores/objects/object/versions?datastore=${this.nameEncoded}&objectKey=${this.scopeEncoded}${encodeURIComponent(key)}&sortOrder=${sortOrder}&startTime=${startDate?.toISOString() ?? ''}&endTime=${endDate?.toISOString() ?? ''}&maxItemsToReturn=${maxPageSize}`, {
			cursorName: 'exclusiveStartKey',
			nextPageIndex: 'lastReturnedKey',
			dataIndex: 'versions',
			mapFunc: res => new DataStoreVersion(this, key, res),
			headers: this.headers,
			canDecodeCursors: true
		})
	}

	/**
	 * Gets paginated version history for the given key
	 * @param {string} [prefix] The prefix to filter the results by, if any
	 * @param {number} [maxPageSize] The *maximum* number of keys to return per page. This is not guaranteed to be the number of keys returned.
	 * @returns {Promise<Page<string[]>>}
	 */
	async listKeys(prefix, maxPageSize = 50) {
		return await Page.first(`https://gamepersistence.roblox.com/v2/persistence/${await this.getUniverseId()}/datastores/objects/object/versions?datastore=${this.nameEncoded}&prefix=${this.scopeEncoded}${encodeURIComponent(prefix)}&maxItemsToReturn=${maxPageSize ?? ''}`, {
			cursorName: 'exclusiveStartKey',
			nextPageIndex: 'lastReturnedKey',
			dataIndex: 'keys',
			headers: this.headers,
			canDecodeCursors: true
		})
	}
}