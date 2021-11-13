import { Page } from "./ResponsePage.js"
import { AssetLike } from "./AssetLike.js"
import { camelCase } from "../util.js"

let [Asset,PlacePartial,Place,AssetVersion] = []
export async function init() { // if theres a better way to do this lmk, i hate es6
	const pl = await import('./Place.js')
	Place = pl.Place
	PlacePartial = pl.PlacePartial
	Asset = (await import('./Asset.js')).Asset;
	AssetVersion = (await import('./AssetVersion.js')).AssetVersion;
}

export class AssetPartial extends AssetLike {
	fetchDetails(doUpdate = false) {
		return this.client.assets.fetch(this.id, doUpdate)
	}

	getVersions() {
		return Page.first(`https://api.roblox.com/v2/assets/${this.id}/versions`, {mapFunc: versionData => new AssetVersion(this, versionData, this.client)}, this.client)
	}

	async download() {
		return (await this.client.download(`https://assetdelivery.roblox.com/v1/asset?id=${this.id}`)).body
	}

	wear() {
		return this.client.user.avatar.wearAsset(this)
	}

	unequip() {
		return this.client.user.avatar.removeAsset(this)
	}

	isFull() {
		return this instanceof Asset || this instanceof Place
	}

	isFullAsset() {
		return this instanceof Asset
	}

	isPlace() {
		return this instanceof PlacePartial
	}

	isFullPlace() {
		return this instanceof Place
	}

	async getFavoriteCount() {
		const res = await this.client.request.catalog(`/v1/favorites/assets/${this.id}/count`)
		return res.json
	}

	async getFavorite(user = this.client.user) {
		const userId = this.client.users.resolveId(user)
		const res = await this.client.request.catalog(`/v1/favorites/users/${userId}/assets/${this.id}/favorite`)
		if (res.json) {
			return new Date(res.json.created)
		}
		return res.json
	}

	async favorite() {
		await this.client.request.catalog(`/v1/favorites/users/${this.client.user.id}/assets/${this.id}/favorite`, {method: 'POST'})
	}
	
	async unfavorite() {
		await this.client.request.catalog(`/v1/favorites/users/${this.client.user.id}/assets/${this.id}/favorite`, {method: 'DELETE'})
	}
}

export class Emote extends AssetPartial {
	/**
	 * @param {Dictionary} data 
	 * @returns 
	 */
	_patch(data, skipCase = true) {
		if (!skipCase) {
			data = camelCase(data)
		}
		this.position = data.position ?? this.position
		return super._patch(data, true)
	}
}

export class AvatarAssetPartial extends AssetPartial {
	/**
	 * @param {Dictionary} data 
	 * @returns 
	 */
	_patch(data, skipCase = true) {
		if (!skipCase) {
			data = camelCase(data)
		}

		/** 
		 * This asset's type (see AssetType enum)
		 * @type {AssetType} 
		 */
		this.assetType = data.assetType.name ?? this.assetType

		/** 
		 * The asset's current version id
		 * @type {number}
		 */
		this.currentVersionId = data.currentVersionId ?? this.currentVersionId

		return super._patch(data, true)
	}
}