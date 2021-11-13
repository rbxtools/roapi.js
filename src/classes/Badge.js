import { camelCase, resolvableId } from "../util.js"
import {AssetLike} from "./AssetLike.js"

export class Badge extends AssetLike {
	async getAwardedDate(user) {
		if (typeof(user) == 'number') {
			user = await this.client.getUser(user)
		}
		return (await user.inventory.getBadgeAwardedDates([this.id]))[this.id]
	}

	/**
	 * Removes the badge from the given, or authenticated, user's inventory
	 */
	async remove(user) {
		await this.client.request.badges(user ? `/v1/user/${resolvableId(user)}/badges/${this.id}` : `/v1/user/badges/${this.id}`, {method: 'DELETE'})
	}

	/**
	 * Partially updates this badge's values to match the passed object.
	 * @param {Object} data 
	 * @returns {Badge}
	 */
	_patch(data, skipCase = true) {
		if (!skipCase) {
			data = camelCase(data)
		}

		this.description = data.description ?? this.description
		this.displayName = data.displayName ?? data.name ?? this.displayName
		this.displayDescription = data.displayDescription ?? data.description ?? this.displayDescription
		this.enabled = data.enabled ?? this.enabled
		this.iconId = data.iconId ?? this.iconId
		this.displayIconId = data.displayIconId ?? data.iconId ?? this.iconId
		this.awardCounts = data.statistics ? {
			pastDay: data.statistics.pastDayAwardedCount,
			total: data.statistics.awardedCount,
			percentage: data.statistics.winRatePercentage
		} : this.awardCounts
		this.created = data.created ? new Date(data.created) : this.created
		this.updated = data.updated ? new Date(data.updated) : this.updated

		this.universeId = data.universeId ?? data.universe?.id ?? data.awardingUniverse?.id ?? this.universeId
		this.client.universes.get(this.universeId, data.awardingUniverse ?? data.universe ?? {id: this.universeId, name: data.universeName})

		return super._patch(data, true)
	}

	get universe() {
		return this.client.universes.get(this.universeId)
	}

	fetchUniverse(doUpdate = false) {
		return this.client.universes.fetch(this.universeId, doUpdate)
	}
}