import { camelCase } from "../util.js";
import { AssetLike } from "./AssetLike.js";
import {Badge} from "./Badge.js";
import { UniverseAPIManager } from "./managers/APIManager.js";
import {Page} from "./ResponsePage.js";

export class UniversePartial extends AssetLike {
	constructor(data, client) {
		super(data, client)
		this._patch(data)
		
		this.badges = new UniverseBadges(this, client)
	}

	_patch(data, skipCase = true) {
		if (!skipCase) {
			data = camelCase(data)
		}

		this.rootPlaceId = data.rootPlace?.id ?? data.rootPlaceId ?? data.rootPlace ?? this.rootPlaceId

		return super._patch(data, true)
	}

	/** @returns {Promise<Universe>} */
	fetchDetails(doUpdate = false) {
		return this.client.universes.fetch(this.id, doUpdate)
	}

	get rootPlace() {
		return this.client.places.get(this.rootPlaceId)
	}

	async fetchRootPlace(doUpdate = false) {
		if (!this.rootPlaceId) {
			const detailed = await this.fetchDetails(doUpdate)
			this.rootPlaceId = detailed.rootPlaceId
		}
		return this.client.places.fetch(this.rootPlaceId, doUpdate)
	}

	async fetchSettings() {
		const res = await this.client.request.develop(`/v1/universes/${this.id}/configuration`)
		this.name = res.json.name
		this.universeAvatarType = res.json.universeAvatarType
		return res.json
	}

	async patchSettings(settings) {
		const res = await this.client.request.develop(`/v2/universes/${this.id}/configuration`, {
			method: 'PATCH',
			body: settings
		})
		this.name = res.json.name
		this.description = res.json.description
		this.universeAvatarType = res.json.universeAvatarType
		return res.json
	}
}

export class DevelopUniverse extends UniversePartial {
	_patch(data, skipCase = true) {
		if (!skipCase) {
			data = camelCase(data)
		}
		this.description = data.description ?? this.description
		this.isArchived = data.isArchived ?? this.isArchived
		this.privacyType = data.privacyType ?? this.privacyType
		this.creatorType = data.creatorType?.toLowerCase() ?? data.creator?.type?.toLowerCase() ?? this.creatorType ?? 'User'
		this.creatorId = data.creatorTargetId ?? data.creatorId ?? data.creator?.id ?? this.creatorId
		if (data.creatorName) {
			const manager = this.creatorType == 'Group' ? this.client.groups : this.client.users
			manager.get(this.creatorId, {name: data.creatorName, id: this.creatorId})
		}
		this.created = data.created ? new Date(data.created) : this.created
		this.updated = data.updated ? new Date(data.updated) : this.updated
		return super._patch(data, true)
	}

	get creator() {
		switch (this.creatorType) {
			case 'user':
				return this.client.users.get(this.creatorId)
			case 'group':
				return this.client.groups.get(this.creatorId)
			default:
				return this.rawCreator ?? {type: this.creatorType, id: this.creatorId, name: this.creatorName}
		}
	}

	fetchCreator(doUpdate = false) {
		switch (this.creatorType) {
			case 'user':
				return this.client.users.fetch(this.creatorId, doUpdate)
			case 'group':
				return this.client.groups.fetch(this.creatorId, doUpdate)
			default:
				return this.rawCreator ?? {type: this.creatorType, id: this.creatorId, name: this.creatorName}
		}
	}
}

export class Universe extends DevelopUniverse {
	_patch(data, skipCase = true) {
		if (!skipCase) {
			data = camelCase(data)
		}

		this.price = data.price ?? this.price
		this.allowedGearGenres = data.allowedGearGenres ?? this.allowedGearGenres
		this.isGenreEnforced = data.isGenreEnforced ?? this.isGenreEnforced
		this.copyingAllowed = data.copyingAllowed ?? this.copyingAllowed
		this.playing = data.playing ?? this.playing
		this.visits = data.visits ?? this.visits
		this.maxPlayers = data.maxPlayers ?? this.maxPlayers
		this.studioAccessToApis = data.studioAccessToApis ?? data.studioAccessToApisAllowed ?? this.studioAccessToApis
		this.privateServersEnabled = data.privateServersEnabled ?? data.createVipServersAllowed ?? this.privateServersEnabled
		this.universeAvatarType = data.universeAvatarType ?? this.universeAvatarType
		this.genre = data.genre ?? this.genre
		this.isAllGenre = data.isAllGenre ?? this.isAllGenre
		this.isFavorited = data.isFavorited ?? data.isFavoriatedByUser ?? this.isFavorited
		this.favoritedCount = data.favoritedCount ?? this.favoritedCount

		data.creatorName ??= data.creator?.name
		
		this.rawCreator = data.creator ?? this.rawCreator
		
		/** @deprecated NYI to Roblox API - currently always null */
		this.gameRating = data.gameRating

		return super._patch(data, true)
	}
}

export class UniverseBadges extends UniverseAPIManager {
	constructor(universe, client) {
		super(client)
		this.universe = universe
	}

	getAll(options) {
		return Page.first(`https://badges.roblox.com/v1/universes/${this.universe.id}/badges?limit=${options.limit ?? 25}&sortOrder=${options.order ?? 'Desc'}`, {mapFunc: badge => new Badge(badge, this.client)}, this.client)
	}
}