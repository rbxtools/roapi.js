import { resolvableId } from "../util.js";
import { AssetPartial, AvatarAssetPartial, Emote } from "./AssetPartial.js";
import { UserAPIManager } from "./managers/APIManager.js";

export class Avatar extends UserAPIManager {
	async getAll() {
		const res = await this.client.request.avatar(`/v1/users/${this.user.id}/avatar`)
		const avatar = res.json
		avatar.assets = avatar.assets.map(asset => new AvatarAssetPartial(asset, this.client))
		avatar.emotes = avatar.emotes.map(emote => new Emote(emote, this.client))
		return avatar
	}

	async getWearing() {
		const res = await this.client.request.avatar(`/v1/users/${this.user.id}/currently-wearing`)
		return res.json.assetIds.map(id => new AssetPartial({id}, this.client))
	}
}

export class AuthenticatedAvatar extends Avatar {
	async removeAsset(asset) {
		const assetId = resolvableId(asset)
		await this.client.request.avatar(`/v1/avatar/assets/${assetId}/remove`, {method: 'POST'})
	}

	async wearAsset(asset) {
		const assetId = resolvableId(asset)
		await this.client.request.avatar(`/v1/avatar/assets/${assetId}/wear`, {method: 'POST'})
	}

	async redrawThumbnail() {
		await this.client.request.avatar('/v1/avatar/redraw-thumbnail', {method: 'POST', retryRatelimitAfter: false})
	}

	async setBodyColors(colors) {
		await this.client.request.avatar('/v1/avatar/set-body-colors', {method: 'POST', body: colors})
	}

	async setAvatarType(avatarType) {
		await this.client.request.avatar('/v1/avatar/set-player-avatar-type', {method: 'POST', body: {playerAvatarType: avatarType}})
	}

	async setScales(scales) {
		await this.client.request.avatar('/v1/avatar/set-scales', {method: 'POST', body: scales})
	}

	async bulkUpdateWearing(assets) {
		const assetIds = assets.map(asset => resolvableId(asset))
		const res = await this.client.request.avatar('/v1/avatar/set-wearing-assets', {method: 'POST', body: {assetIds}})
		const worn = res.json
		worn.invalidAssets = worn.invalidAssets.map(asset => new AvatarAssetPartial(asset, this.client))
		worn.unknownAssets = worn.invalidAssetIds.map(asset => new AssetPartial(asset, this.client))
		delete worn.invalidAssetIds
		return worn
	}
}