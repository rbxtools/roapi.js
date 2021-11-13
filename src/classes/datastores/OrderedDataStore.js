import { Collection } from "../Collection.js"
import { LegacyDataStore } from "./LegacyDataStore.js"

export class OrderedDataStore extends LegacyDataStore {
	constructor(name, scope = 'global', place, client = place.client) {
		super(name, scope, place, client)
		this.type = 'sorted'
	}
	getSorted(pageSize = 50, minValue = undefined, maxValue = undefined, ascendingOrder = true) {
		let url = `https://gamepersistence.roblox.com/persistence/getSortedValues?scope=${this.scope}&key=${this.name}&pageSize=${pageSize}&ascending=${ascendingOrder}`
		if (minValue) {
			url += `&inclusiveMinValue=${minValue}`
		}
		if (maxValue) {
			url += `&inclusiveMaxValue=${maxValue}`
		}
		return Collection.first(url, this.client, {
			nextPageFunc: coll => coll.body.data.ExclusiveStartKey,
			prevPageFunc: () => null,
			modFunc: data => data.data.Entries,
			mapFunc: entry => {return {key: entry.Target, value: entry.Value}},
			cursorName: 'exclusiveStartKey',
			currentCursor: '',
			requestParams: {headers: this.headers}
		})
	}
}