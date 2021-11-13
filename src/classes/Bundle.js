import { camelCase } from "../util.js";
import { AssetLike } from "./AssetLike.js";

export class BundlePartial extends AssetLike {
	async getRecommendations(count = 10) {
		const res = await this.client.request.catalog(`/v1/bundles/${this.id}/recommendations?numItems=${count}`)
		return res.json.data.map(bundle => this.client.bundles.get(bundle.id, bundle, Bundle))
	}
	async getFavoriteCount() {
		const res = await this.client.request.catalog(`/v1/favorites/bundles/${this.id}/count`)
		return res.json
	}
	async getFavorite(user = this.client.user) {
		const userId = this.client.users.resolveId(user)
		const res = await this.client.request.catalog(`/v1/favorites/users/${userId}/bundles/${this.id}/favorite`)
		if (res.json) {
			return new Date(res.json.created)
		}
		return res.json
	}
	async favorite() {
		await this.client.request.catalog(`/v1/favorites/users/${this.client.user.id}/bundles/${this.id}/favorite`, {method: 'POST'})
	}
	async unfavorite() {
		await this.client.request.catalog(`/v1/favorites/users/${this.client.user.id}/bundles/${this.id}/favorite`, {method: 'DELETE'})
	}
	async wear() {
		await this.client.request.catalog(`/v1/bundles/${this.id}/unpack`, {method: 'POST'})
	}
	async fetchDetails(doUpdate = true) {
		return this.client.bundles.fetch(this.id, doUpdate)
	}
}

export class Bundle extends BundlePartial {
	_patch(data, skipCase = true) {
		if (!skipCase) {
			data = camelCase(data)
		}

		this.description = data.description ?? this.description
		this.bundleType = data.bundleType ?? this.bundleType
		this.items = data.items?.map(item => this.client.assets.get(item.id, item)) ?? this.items
		
		if (data.creator) {
			this.creatorId = data.creator.id ?? this.creatorId
			this.creatorType = data.creator.type ?? this.creatorType
			this.rawCreator = data.creator
			
			switch (this.creatorType) {
				case 'user':
					this.client.users.get(this.creatorId, this.rawCreator)
					break
				case 'group':
					this.client.groups.get(this.creatorId, this.rawCreator)
					break
			}
		}

		this.product = data.product ?? this.product

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