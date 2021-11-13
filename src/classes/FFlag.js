import { Base } from "./Base.js"

const filterTypes = {
	PlaceFilter: 'places',
	DataCenterFilter: 'dataCenters',
}
const prefixes = {
	FFlag: 'bool',
	FString: 'string',
	FInt: 'int',
	FLog: 'int'
}

function findUnknownType(value) {
	let valuel = value.toLowerCase()
	if (valuel == 'true' || valuel == 'false') {
		return 'bool'
	} else if (+value) {
		return 'int'
	} else {
		return 'string'
	}
}

export class FFlag extends Base {
	constructor(options, client) {
		super(client)
		this.fullName = options.id ?? options.name
		this.name = this.fullName
		this.channel = options.channel

		/** @type {string?} */
		const hasPrefix = Object.keys(prefixes).find(key => this.name.startsWith(key) || this.name.startsWith('D'+key))
		if (hasPrefix) {
			this.dynamic = this.fullName.startsWith('D')
			let len = hasPrefix.length + this.dynamic
			this.valueType = prefixes[hasPrefix]
			this.name = this.name.substr(len)
			this.prefix = (this.dynamic ? 'D' : '') + hasPrefix
			this.shortPrefix = this.prefix.substr(1)
		}

		this._patch(options)
	}
	/**
	 * @param {string} options.value 
	 */
	_patch(options) {
		if (options.value == null) {
			if (this.value == null) {
				throw new TypeError('No value given')
			} else {
				return this
			}
		}
		
		let values = options.value.split(';')
		this.filter = values.splice(1)
		const fromName = Object.entries(filterTypes).find(kv => this.name.endsWith(kv[0]))
		this.filterType = fromName ? fromName[1] : (this.filter.length > 0 ? 'unknown' : 'none')
		let value = values[0]

		if (!this.prefix) {
			[this.valueType, value] = findUnknownType(value)
		}

		if (this.valueType == 'bool') {
			this.value = value.toLowerCase() == 'true'
		} else if (this.valueType == 'int') {
			this.value = +value || value
		} else {
			this.value = value
		}
	}
	get placeFilter() {
		if (this.filterType != filterTypes.PlaceFilter) {
			return null
		}
		return this.filter.map(id => this.client.places.get(id, undefined, undefined, this.client.weakCaches.place.fromFlagFilter))
	}
	async fetchPlaces(doUpdate = false, force = false) {
		if (!force && this.filterType != filterTypes.PlaceFilter) {
			return null
		}
		const places = await this.client.places.fetch(this.filter, doUpdate)
		return this.filter.map(id => places.get(id))
	}
	toString() {
		return `${this.fullName}=${this.value}`
	}
	[Symbol.for('nodejs.util.inspect.custom')]() {
		return `${this.prefix ?? `FFlag?${this.valueType}`}<${this.name}=${this.value}>`
	}
}