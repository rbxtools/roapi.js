import { LegacyDataStore } from "./LegacyDataStore.js";

export class GlobalDataStore extends LegacyDataStore {
	constructor(place, client = place.client) {
		super('', 'u', place, client)
	}
	get(key) {
		this.name = key
		return super.get('')
	}
	set(key, value) {
		this.name = key
		return super.set('', value)
	}
	remove(key) {
		this.name = key
		return super.remove('')
	}
	increment(key) {
		this.name = key
		return super.increment('')
	}
	update(key, callback) {
		this.name = key
		return super.update('', callback)
	}
}