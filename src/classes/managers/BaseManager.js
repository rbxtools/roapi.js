import { AssetLike } from "../AssetLike.js";
import { Base } from "../Base.js";

/**
 * @template Class,Key,Resolvable
 * @prop {import('../Cache.js').Cache} cache
 */
export class BaseManager extends Base {
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
 * @prop {(id: Resolvable, forceUpdate: boolean?) => Promise<FetchClass>} fetch
 */
export class FetchableManager extends BaseManager {}

/**
 * @template Class,Key,Resolvable,FetchClass
 * @extends {FetchableManager<Class,Key,Resolvable,FetchClass>}
 * @prop {(id: Resolvable|Resolvable[], forceUpdate: boolean?) => Promise<FetchClass | Map<Key, FetchClass>>} fetch
 */
export class MultiFetchableManager extends FetchableManager {}