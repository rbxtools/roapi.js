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

		this.rootPlaceId = data.rootPlace?.id ?? data.rootPlace ?? this.rootPlaceId

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
}

export class Universe extends UniversePartial {
	constructor(data, client) {
		super({id: data.id, name: data.name}, client)
		this._patch(data)
	}

	_patch(data, skipCase = true) {
		if (!skipCase) {
			data = camelCase(data)
		}

		this.description = data.description ?? this.description
		this.price = data.price ?? this.price
		this.allowedGearGenres = data.allowedGearGenres ?? this.allowedGearGenres
		this.isGenreEnforced = data.isGenreEnforced ?? this.isGenreEnforced
		this.copyingAllowed = data.copyingAllowed ?? this.copyingAllowed
		this.playing = data.playing ?? this.playing
		this.visits = data.visits ?? this.visits
		this.maxPlayers = data.maxPlayers ?? this.maxPlayers
		this.created = data.created ? new Date(data.created) : this.created
		this.updated = data.updated ? new Date(data.updated) : this.updated
		this.studioAccessToApis = data.studioAccessToApis ?? data.studioAccessToApisAllowed ?? this.studioAccessToApis
		this.privateServersEnabled = data.privateServersEnabled ?? data.createVipServersAllowed ?? this.privateServersEnabled
		this.universeAvatarType = data.universeAvatarType ?? this.universeAvatarType
		this.genre = data.genre ?? this.genre
		this.isAllGenre = data.isAllGenre ?? this.isAllGenre
		this.isFavorited = data.isFavorited ?? data.isFavoriatedByUser ?? this.isFavorited
		this.favoritedCount = data.favoritedCount ?? this.favoritedCount
		
		this.creatorType = data.creator?.type?.toLowerCase() ?? this.creatorType
		this.creatorId = data.creator?.id ?? this.creatorId
		this.rawCreator = data.creator ?? this.rawCreator
		
		/** @deprecated NYI to Roblox API - currently always null */
		this.gameRating = data.gameRating

		return super._patch(data, true)
	}

	get creator() {
		switch (this.creatorType) {
			case 'user':
				return this.client.users.get(this.creatorId)
			case 'group':
				return this.client.groups.get(this.creatorId)
			default:
				return this.rawCreator
		}
	}

	fetchCreator(doUpdate = false) {
		switch (this.creatorType) {
			case 'user':
				return this.client.users.fetch(this.creatorId, doUpdate)
			case 'group':
				return this.client.groups.fetch(this.creatorId, doUpdate)
			default:
				return this.rawCreator
		}
	}
}

export class UniverseBadges extends UniverseAPIManager {
	constructor(universe, client) {
		super(client)
		this.universe = universe
	}

	async getAll(options) {
		return Page.first(`https://badges.roblox.com/v1/universes/${this.universe.id}/badges?limit=${options.limit ?? 25}&sortOrder=${options.order ?? 'Desc'}`, {mapFunc: badge => new Badge(badge, this.client)}, this.client)
	}
}