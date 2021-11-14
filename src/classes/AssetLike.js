import {Base} from "./Base.js"
import {camelCase} from "../util.js"

export class AssetLike extends Base {
	/** @type {number} */
	id
	
	constructor(assetInfo, client) {
		super(client)

		/**
		 * The id of this item
		 * @name AssetLike#id
		 * @type {number}
		 * @readonly
		 */
		Object.defineProperty(this, 'id', {value: assetInfo.id || assetInfo.assetId || assetInfo.targetId || assetInfo.userId})

		this._patch(assetInfo)
	}

	toString() {
		return this.name ?? `[Partial ${Object.getPrototypeOf(this).constructor.name} ${this.id}]`
	}

	/**
	 * @param {AssetLike} obj2 
	 * @returns {boolean}
	 */
	equals(obj2) {
		return this.id == obj2.id
	}

	/**
	 * Partially updates this object's values to match the passed object.
	 * @param {Object} obj The partial object to assign new values from
	 * @param {boolean} skipCase Whether or not to clone the passed object before editing (default: true)
	 * @returns This object
	 */
	_patch(obj, skipCase = false) {
		if (!skipCase) {
			obj = camelCase(obj)
		}
		/** 
		 * This item's name on the website, if known
		 * @type {string?} 
		 */
		this.name = obj.name ?? obj.assetName ?? obj.title ?? this.name

		return this
	}
}