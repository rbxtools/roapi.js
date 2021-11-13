import { AssetLike } from "./AssetLike.js";

// translates the given gender, age, or device type to-and-from roblox's internal format to our slightly-more-readable version
export function translateSponsorData(item, parseDefault = null) {
	if (parseDefault) {
		if (Array.isArray(item)) {
			item = item.filter(item => item != 'Any')
			if (item.length == 0) item = parseDefault
			return item.join(', ')
		} else if (!item || item == 'any') {
			return parseDefault.join(', ')
		} else {
			return item
		}
	} else {
		item = item.toLowerCase()
		if (item.contains(', ')) {
			return item.split(', ')
		} else {
			return [item]
		}
	}
}

export class SponsorshipPartial extends AssetLike {
	constructor(data, client) {
		data.id ??= data.adSetId
		super(data, client)
	}
	_patch(data) {
		this.universeId = data.campaignTargetId ?? data.universeId ?? this.universeId
		data.name ??= data.adName
		return super._patch(data)
	}

	get universe() {
		return this.client.universes.get(this.universeId)
	}

	async fetchUniverse(doUpdate = false) {
		if (!this.universeId) {
			throw new Error("No known universeId")
		}
		return this.client.universes.fetch(this.universeId, doUpdate)
	}

	/**
	 * *Attempts* to fetch this sponsorship's data from the universe's list. 
	 * @throws If the universe id is unknown
	 * @param {boolean} [doUpdate=false] Whether to update the sponsorship if its details are already cached
	 */
	async attemptFetchDetails(doUpdate = false) {
		if (!this.universeId) {
			throw new Error("No known universeId")
		}
		return this.universe.sponsorships.fetch(this.universeId, this.id, doUpdate)
	}

	stop() {
		return this.client.sponsorships.stopSponsor(this)
	}
}

export class Sponsorship extends SponsorshipPartial {
	_patch(data) {
		this.adId = data.adId ?? this.adId
		this.moderationStatus = data.adStatus ?? data.moderationStatus ?? this.moderationStatus
		this.status = data.adSetStatus ?? data.status ?? this.status

		this.iconType = data.creativeType ?? data.type ?? this.type
		this.iconId = data.creativeTargetId ?? data.imageId ?? this.imageId
		this.iconUrl = data.creativeUrl ?? data.imageUrl ?? this.imageUrl

		this.bid = data.bidAmountInRobux ?? data.bidAmount ?? this.bid
		this.dailyBudget = data.budgetInRobux ?? data.budget ?? this.dailyBudget

		this.startDate = data.startDate ? new Date(data.startDate) : this.startDate
		this.endDate = data.endDate ? new Date(data.endDate) : this.endDate

		this.targetGenders = translateSponsorData(data.targetGender)
		this.targetAges = translateSponsorData(data.targetAgeBracket)
		this.targetDevices = translateSponsorData(data.targetDeviceType)
		
		this.type = data.campaignTargetType ?? data.type ?? this.type
		
		this.robuxUsed = data.totalSpendInRobux ?? data.robuxUsed ?? this.robuxUsed
		this.impressions = data.impressions ?? this.impressions
		this.clicks = data.clicks ?? this.clicks
		this.totalConversions = data.totalConversions ?? this.totalConversions
		this.impressionConversions = data.impressionConversions ?? this.impressionConversions
		this.clickConversions = data.clickConversions ?? this.clickConversions

		return super._patch(data)
	}
}