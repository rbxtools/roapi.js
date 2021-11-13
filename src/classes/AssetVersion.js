import { camelCase } from "../util.js"
import { AssetLike } from "./AssetLike.js"

export class AssetVersion extends AssetLike {
	constructor(asset, versionInfo, client) {
		versionInfo.name ??= versionInfo.Name ?? asset.name
		super(camelCase(versionInfo), client)
		this.asset = asset
	}

	async download() {
		return (await this.client.download(`https://assetdelivery.roblox.com/v1/asset?id=${this.asset.id}&version=${this.versionNumber}`)).body
	}

	/**
	 * Partially updates this AssetVersion's values to match the passed object.
	 * @param {Object} data 
	 * @returns {Badge}
	 */
	_patch(data, skipCase = false) {
		if (!skipCase) {
			data = camelCase(data)
		}

		this.versionNumber = data.versionNumber ?? this.versionNumber
		this.created = data.created ? new Date(data.created) : this.created
		this.updated = data.updated ? new Date(data.updated) : this.updated

		this.creatorType = data.creatorType?.toLowerCase() ?? this.creatorType
		this.creatorId = data.creatorTargetId ?? this.creatorId
		
		return super._patch(data, true)
	}

	get creator() {
		switch (this.creatorType) {
			case 'user':
				return this.client.users.get(this.creatorId)
			case 'group':
				return this.client.groups.get(this.creatorId)
			default:
				return {id: this.creatorId, type: this.creatorType}
		}
	}

	fetchCreator(doUpdate = false) {
		switch (this.creatorType) {
			case 'user':
				return this.client.users.fetch(this.creatorId, doUpdate)
			case 'group':
				return this.client.groups.fetch(this.creatorId, doUpdate)
			default:
				return {type: this.creatorType, id: this.creatorId}
		}
	}
}