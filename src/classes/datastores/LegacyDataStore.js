import { Headers } from "node-fetch"
import { PlaceAPIManager } from "../managers/APIManager.js"

export class LegacyDataStore extends PlaceAPIManager {
	/**
	 * @param {string} name 
	 * @param {string} [scope] 
	 */
	constructor(name, scope = 'global', place, client = place.client) {
		super(place, client)
		this.name = name
		this.scope = scope
		this.type = 'standard'

		this.headers = new Headers()
		this.headers.set('Roblox-Place-Id', this.placeId)
	}

	get nameEncoded() {
		return encodeURIComponent(this.name)
	}

	get scopeEncoded() {
		return encodeURIComponent(this.scope)
	}

	/**
	 * Returns data from the DataStore.
	 * @param {string} key
	 * @returns {string|number|Object}
	 */
	async get(key) {
		const response = await this.client.request.datastores(`/v1/persistence/${this.type}?key=${this.nameEncoded}&scope=${this.scopeEncoded}&target=${encodeURIComponent(key)}`, {headers: this.headers})
		return response.json
	}

	/** 
	 * Sets data at the given key to the given value.
	 * @param {string} key
	 * @param {string|number|Object} value
	 * @returns {Promise<void>}
	 */
	async set(key, value) {
		await this.client.request.datastores(`/v1/persistence/${this.type}?key=${this.nameEncoded}&scope=${this.scopeEncoded}&target=${encodeURIComponent(key)}`, {
			headers: this.headers, 
			method: 'POST',
			body: JSON.stringify(value)
		})
	}

	/**
	 * Removes the given key's value from the DataStore and returns it.
	 * @param {string} key
	 * @returns {string|number|Object} The value that was previously in the DataStore
	 */
	async remove(key) {
		const response = await this.client.request.datastores(`/v1/persistence/${this.type}/remove?key=${this.nameEncoded}&scope=${this.scopeEncoded}&target=${encodeURIComponent(key)}`, {headers: this.headers, method: 'POST'})
		return response.json
	}

	/**
	 * Increments the given value by the given amount
	 * @param {string} key The DataStore key
	 * @param {number} amount The amount to increase the value by
	 * @returns {number} The new value
	 */
	async increment(key, amount) {
		const response = await this.client.request.datastores(`/v1/persistence/${this.type}/increment?key=${this.nameEncoded}&scope=${this.scopeEncoded}&target=${encodeURIComponent(key)}&by=${amount}`, {headers: this.headers, method: 'POST'})
		return response.json
	}

	/**
	 * Uses a callback to update the value under the given key.
	 * @param {string} key 
	 * @param {(oldValue: (string|number|Object)) => string|number|Object} callback 
	 * @returns {string|number|Object} The new value
	 */
	async update(key, callback) {
		const value = await this.get(key)
		const newValue = await callback(value)
		if (newValue == null) {
			return
		}
		await this.set(key, newValue)
		return newValue
	}

	/**
	 * Gets values from this DataStore in bulk.
	 * @param {string[]} keys 
	 * @returns {Map<string,any>}
	 */
	async bulkGet(keys) {
		const values = await this.place.bulkDataStoreGet(keys.map(key  => {return {name: this.name, scope: this.scope, key}}), this.type)
		return new Map(values.map(obj => [obj.key.key, obj.value]))
	}
}