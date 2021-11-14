import { Page } from "../ResponsePage.js";
import { UniverseAPIManager } from "./APIManager.js";
import { BaseManager } from "./BaseManager.js";
import { Sponsorship, SponsorshipPartial, translateSponsorData } from '../Sponsorship.js'
import { Cache } from '../Cache.js'

/** @typedef {number | string | SponsorshipPartial} SponsorshipResolvable */

export class SponsorManager extends BaseManager {
	/** @type {Cache<SponsorshipPartial>} */
	cache = new Cache(SponsorshipPartial, this.client, [SponsorshipPartial, Sponsorship])
	
	async stopSponsor(sponsor) {
		const adSetId = this.resolveId(sponsor)
		await this.client.request.adconfig('/v2/sponsored-games/stop', {method: 'POST', body: {adSetId}})
	}
}

export class UniverseSponsorManager extends UniverseAPIManager {
	fetchList(archived = false) {
		return Page.first(
			`https://adconfiguration.roblox.com/v2/sponsored-games?universeId=${this.universeId}&includeReportingStats=true&isArchived=${archived}`, 
			{ mapFunc: sponsor => this.client.sponsorships.get(sponsor.id, sponsor, Sponsorship) }, 
			this.client
		)
	}

	get(id, obj = {}, ...args) {
		obj.universeId ??= this.universeId
		return this.client.sponsorships.get(id, obj, ...args)
	}

	/**
	 * *Attempts* to fetch this sponsorship's data from the universe's list.
	 */
	async attemptFetchId(id, doUpdate = false, archived = undefined) {
		id = this.client.sponsorships.resolveId(id)
		const cached = this.client.sponsorships.rawget(id)
		if (!doUpdate && cached instanceof Sponsorship) return cached

		const pages = await this.fetchList(archived)
		const found = await pages.searchAllArrayPages(sponsor => sponsor.id == id)

		if (found) return found

		if (archived == undefined) {
			const archivedPages = await this.fetchList(true)
			return await archivedPages.searchAllArrayPages(sponsor => sponsor.id == id)
		}
	}

	async create(sponsorOptions = {}) {
		sponsorOptions.universeId ??= this.universeId

		sponsorOptions.targetGender = translateSponsorData(sponsorOptions.gender ?? sponsorOptions.genders ?? sponsorOptions.targetGender, ['Male', 'Female'])
		sponsorOptions.targetAgeBracket = translateSponsorData(sponsorOptions.age ?? sponsorOptions.ages ?? sponsorOptions.targetAgeBracket, ['AgeUnder13', 'Age13OrOver'])
		sponsorOptions.targetDeviceType = translateSponsorData(sponsorOptions.device ?? sponsorOptions.devices ?? sponsorOptions.targetDeviceType, ['Computer', 'Phone', 'Tablet', 'Console'])
		
		sponsorOptions.budgetInRobux ??= sponsorOptions.dailyBudget

		if (sponsorOptions.durationDays) {
			sponsorOptions.endDate = new Date(Date.now() + (sponsorOptions.durationDays * 24 * 60 * 60 * 1000))
			sponsorOptions.bidAmountInRobux ??= sponsorOptions.budgetInRobux * sponsorOptions.durationDays
		}

		sponsorOptions.startDate = new Date(sponsorOptions.startDate ?? Date.now()).toISOString()
		sponsorOptions.endDate = new Date(sponsorOptions.endDate ?? Date.now()).toISOString()

		sponsorOptions.bidAmountInRobux ??= sponsorOptions.bid

		const res = await this.client.request.adconfig('/v2/sponsored-games/create', {method: 'POST', body: sponsorOptions})
		return res.json
	}
}