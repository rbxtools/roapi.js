import { AssetLike } from "../AssetLike.js";
import { Base } from "../Base.js";

/**
 * @template Class,Key,Resolvable
 */
export class BaseManager extends Base {
	/** @type {import('../Cache.js').Cache} */ cache;

	/**
	 * @param {Resolvable} resolvable 
	 * @returns {Key}
	 */
	resolveId(resolvable) {
		if (resolvable instanceof AssetLike) {
			return resolvable.id
		} else {
			return +resolvable
		}
	}

	/** 
	 * @param {Key} id
	 * @param {any} [options]
	 * @param {Constructor<Class>} [override]
	 * @param {number|boolean} [weak]
	 * @param {...any} [args]
	 * @returns {Class} 
	 */
	get(id, options, override, weak, ...args) {
		return this.cache.get(id, options, override, weak, ...args)
	}
}

/**
 * @template Class,Key,Resolvable,FetchClass
 * @extends {BaseManager<Class,Key,Resolvable>}
 */
export class FetchableManager extends BaseManager {
	/** @type {(id: Resolvable, forceUpdate: boolean?) => Promise<FetchClass>} */ fetch;
}

/**
 * @template Class,Key,Resolvable,FetchClass
 * @extends {FetchableManager<Class,Key,Resolvable,FetchClass>}
 */
export class MultiFetchableManager extends FetchableManager {
	/** @type {(id: Resolvable|Resolvable[], forceUpdate: boolean?) => Promise<FetchClass | Map<Key, FetchClass>>} */ fetch;
}