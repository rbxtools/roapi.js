import { camelCase } from "../util.js"
import { AssetLike } from "./AssetLike.js"
import { AssetPartial, AvatarAssetPartial } from "./AssetPartial.js"

export class OutfitPartial extends AssetLike {
	isEditable = true

	_patch(data, skipCase = true) {
		if (!skipCase) {
			data = camelCase(data)
		}

		this.isEditable = data.isEditable ?? this.isEditable ?? true

		return super._patch(data, true)
	}

	getDetails(force = false) {
		return this.client.getOutfit(this.id, force)
	}

	async delete() {
		await this.client.request.avatar(`/v1/outfits/${this.id}/delete`, {method: 'POST'})
	}

	/**
	 * Updates the outfit's contents
	 */
	async update(contents) {
		await this.client.request.avatar(`/v1/outfits/${this.id}`, {method: 'PATCH', body: contents})
		if (contents.name) {
			this.name = contents.name
		}
	}

	/**
	 * Wears this outfit
	 */
	async wear() {
		const res = await this.client.request.avatar(`/v1/outfits/${this.id}/wear`, {method: 'POST'})
		const worn = res.json
		worn.invalidAssets = worn.invalidAssets.map(asset => new AvatarAssetPartial(asset, this.client))
		worn.unknownAssets = worn.invalidAssetIds.map(asset => new AssetPartial(asset, this.client))
		delete worn.invalidAssetIds
		return worn
	}
}

export class Outfit extends OutfitPartial {
	constructor(data, client) {
		super(data, client)
		this._patch(data)
	}
	getDetails() {
		return Promise.resolve(this)
	}

	/**
	 * Updates the outfit's contents to match this object's current state
	 * @param {clientp}
	 */
	async update(contents = this) {
		await this.client.request.avatar(`/v1/outfits/${this.id}/update`, {method: 'PATCH', body: contents})
	}

	/**
	 * Bulk updates this object
	 */
	_patch(data, skipCase = true) {
		if (!skipCase) {
			data = camelCase(data)
		}

		let rawAssets = data.rawAssets ?? data.assets ?? data.assetIds
		rawAssets &&= rawAssets.map(asset => typeof asset == 'number' ? {id: asset} : asset)
		rawAssets?.forEach(asset => this.client.assets.get(asset.id, asset, asset.assetType ? AvatarAssetPartial : AssetPartial))

		this.assetIds = data.assetIds ?? rawAssets?.map(asset => asset.id) ?? this.assetIds

		this.scales = data.scales ?? this.scales
		this.avatarType = data.avatarType ?? data.playerAvatarType ?? this.avatarType
		this.bodyColors = data.bodyColors ?? this.bodyColors
		return this._patch(data, true)
	}

	get assets() {
		return this.assetIds.map(assetId => this.client.assets.get(assetId))
	}

	async fetchAssets(doUpdate = false) {
		return (await this.client.assets.fetch(this.assetIds, doUpdate)).values()
	}
}