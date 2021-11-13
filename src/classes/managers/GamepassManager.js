import { Cache } from "../Cache.js";
import { Gamepass, GamepassPartial } from "../Gamepass.js";
import { MultiFetchableManager } from "./BaseManager.js";

/** @typedef {number | string | GamepassPartial} GamepassResolvable */

/**
 * @class 
 * @extends MultiFetchableManager<GamepassPartial,number,GamepassResolvable,Gamepass>
 */
export class GamepassManager extends MultiFetchableManager {
	/** @type {Cache<GamepassPartial>} */
	cache = new Cache(GamepassPartial, this.client, [GamepassPartial, Gamepass])

	/**
	 * Fetches one or more users from their userId
	 * @param {GamepassResolvable | GamepassResolvable[]} assetIds 
	 * @param {boolean} forceUpdate 
	 * @returns {Promise<Map<number, Gamepass> | Gamepass>}
	 */
	async fetch(gamepassIds, forceUpdate = false) {
		const returnOnly = !Array.isArray(gamepassIds) && this.resolveId(gamepassIds)
		if (returnOnly) {
			gamepassIds = [gamepassIds]
		}
		const gamepasses = new Map
		gamepassIds = gamepassIds.map(resolvable => this.resolveId(resolvable)).filter(gamepassId => {
			const cached = this.cache.rawget(gamepassId)
			gamepasses.set(gamepassId, cached)

			return !(cached && !(cached instanceof Gamepass) && !forceUpdate)
		})
		if (gamepassIds.length > 0) {
			const res = await this.client.request.catalog() // TODO: this monkey
			for (let passData of res.json.data) {
				gamepasses.set(passData.id, this.get(passData.id, passData, Gamepass))
			}
		}
		return returnOnly ? gamepasses.get(returnOnly) : gamepasses
	}
}