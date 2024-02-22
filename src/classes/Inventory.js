import { resolvableId } from "../util.js";
import {Badge} from "./Badge.js";
import {Page} from "./ResponsePage.js";
import { UserAPIManager } from "./managers/APIManager.js";
import { OutfitPartial } from "./Outfit.js";

export class Inventory extends UserAPIManager {
	async getOutfits(options = {}) {
		const res = await this.client.request.avatar(`/v1/users/${this.user.id}/outfits?itemsPerPage=${options.count ?? 2000}&isEditable=${options.isEditable ?? ''}`)
		return res.json.data.map(outfit => this.client.outfits.get(outfit.id, outfit, OutfitPartial))
	}

	async getBadges(options) {
		options ??= {}
		return Page.first(`https://badges.roblox.com/v1/users/${this.user.id}/badges?limit=${options.limit ?? 25}&sortOrder=${options.order ?? 'Desc'}`, {mapFunc: badge => new Badge(badge, this.client)}, this.client)
	}

	async getBadgeAwardedDates(badges) {
		const badgeIds = badges.map(badge => resolvableId(badge))
		const res = await this.client.request.badges(`/v1/users/${this.user.id}/badges/awarded-dates?badgeIds=${badgeIds.join(',')}`)
		const dates = {}
		for (let entry of res.json.data) {
			dates[entry.badgeId] = new Date(entry.awardedDate)
		}
		return dates
	}
}