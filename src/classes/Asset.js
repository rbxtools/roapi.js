import {AssetPartial} from "./AssetPartial.js"
import {camelCase} from "../util.js"

const assetTypes = new Map([
	[1, 'Image'], [2, 'TShirt'], [3, 'Audio'],
	[4, 'Mesh'], [5, 'Lua'], [8, 'Hat'],  [12, 'Pants'], 
	[13, 'Decal'],  [17, 'Head'],  [18, 'Face'], 
	[19, 'Gear'], [21, 'Badge'], [24, 'Animation'], 
	[27, 'Torso'],  [28, 'RightArm'], [29, 'LeftArm'], 
	[30, 'LeftLeg'], [31, 'RightLeg'], [32, 'Package'], 
	[34, 'GamePass'],  [38, 'Plugin'], [40, 'MeshPart'], 
	[41, 'HairAccessory'], [42, 'FaceAccessory'], 
	[43, 'NeckAccessory'], [44, 'ShoulderAccessory'], 
	[45, 'FrontAccessory'], [46, 'BackAccessory'], 
	[47, 'WaistAccessory'], [48, 'ClimbAnimation'], 
	[49, 'DeathAnimation'], [50, 'FallAnimation'], 
	[51, 'IdleAnimation'], [52, 'JumpAnimation'], 
	[53, 'RunAnimation'], [54, 'SwimAnimation'], 
	[55, 'WalkAnimation'], [56, 'PoseAnimation'], 
	[57, 'EarAccessory'], [58, 'EyeAccessory'], 
	[61, 'EmoteAnimation'], [62, 'Video'], 
	[64, 'TShirtAccessory'], [65, 'ShirtAccessory'], 
	[66, 'PantsAccessory'], [67, 'JacketAccessory'], 
	[68, 'SweaterAccessory'], [69, 'ShortsAccessory'], 
	[70, 'LeftShoeAccessory'], [71, 'RightShoeAccessory'], 
	[72, 'DressSkirtAccessory']
])

export class Asset extends AssetPartial {
	/**
	 * @param {Dictionary} assetInfo 
	 * @param {Client} client 
	 */
	constructor(assetInfo, client) {
		assetInfo = camelCase(assetInfo)
		assetInfo.id ??= assetInfo.targetId || assetInfo.assetId || assetInfo.productId
		super(assetInfo, client)
		this.itemType = assetInfo.itemType
	}

	/**
	 * 
	 * @param {Dictionary} data 
	 * @returns 
	 */
	_patch(data, skipCase = true) {
		if (!skipCase) {
			data = camelCase(data)
		}

		this.assetType = typeof data.assetType == 'number' && assetTypes.get(data.assetType) || data.assetType || this.assetType
		this.productId = data.productId
		this.description = data.description ?? this.description
		this.itemStatus = data.itemStatus ?? this.itemStatus
		this.itemRestrictions = data.itemRestrictions ?? this.itemRestrictions
		
		this.creatorType = data.creatorType?.toLowerCase() ?? this.creatorType
		this.creatorId = data.creatorTargetId ?? this.creatorId
		this.creatorName = data.creatorName ?? this.creatorName

		switch (this.creatorType) {
			case 'user':
				this.client.users.get(this.creatorId, {name: this.creatorName, id: this.creatorId})
				break
			case 'group':
				this.client.groups.get(this.creatorId, {name: this.creatorName, id: this.creatorId})
				break
		}

		this.price = data.price ?? this.price
		this.premiumPricing = data.premiumPricing ?? this.premiumPricing
		this.lowestPrice = data.lowestPrice ?? this.lowestPrice
		if (data.priceStatus || data.price != null) {
			this.priceStatus = data.priceStatus
			this.price = data.price
		}
		this.unitsAvailable = data.unitsAvailableForConsumption ?? this.unitsAvailable
		this.sales = data.purchaseCount ?? this.sales
		if (data.offsaleDeadline !== undefined) {
			this.offsaleDeadline = data.offsaleDeadline ? new Date(data.offsaleDeadline) : this.offsaleDeadline
		}

		return super._patch(data, true)
	}

	get creator() {
		switch (this.creatorType) {
			case 'user':
				return this.client.users.get(this.creatorId)
			case 'group':
				return this.client.groups.get(this.creatorId)
			default:
				return {type: this.creatorType, name: this.creatorName, id: this.creatorId}
		}
	}

	fetchCreator(doUpdate = false) {
		switch (this.creatorType) {
			case 'user':
				return this.client.users.fetch(this.creatorId, doUpdate)
			case 'group':
				return this.client.groups.fetch(this.creatorId, doUpdate)
			default:
				return {type: this.creatorType, name: this.creatorName, id: this.creatorId}
		}
	}
}