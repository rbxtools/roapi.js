import { FileHandle } from "fs/promises"
import { FetchError, Response } from "node-fetch"
import { Stream } from "stream"
import * as Enum from "./enums"
import * as Interface from "./interfaces"

export class Client {
	headers: Headers
	token: string
	cloudToken: string
	user?: AuthenticatedUser
	weakCaches: Interface.WeakCaches
	
	request: Request

	loggingFilter: Interface.RequestLoggingFilter
	loggerOptions: Interface.RequestLoggingOptions
	loggerEnabled: boolean
	loggerMode: Enum.RequestLoggingMode

	users: UserManager
	universes: UniverseManager
	assets: AssetManager
	groups: GroupManager
	gamepasses: GamepassManager
	outfits: OutfitManager
	privateServers: PrivateServerManager
	servers: ServerInstanceManager
	chat: ChatManager
	places: PlaceManager

	constructor(options: Interface.ClientOptions)

	login(token: string): Promise<User>
	setCloudToken(token: string): Promise<void>
	download(url: string, params?: Interface.RequestParams): Promise<BaseResponse>
	invalidateToken(): Promise<void>
	logRequest(response: BaseRequested): Promise<void>
}

export class Base {
	readonly client: Client
	constructor(client: Client)
}

export class AssetLike extends Base {
	readonly id: number
	name?: string

	toString(): string
	equals(obj2: AssetLike): boolean
	_patch(obj: Interface.Dictionary, skipCase?: boolean): typeof this
}

export class Emote extends AssetPartial {
	position: number
	constructor(assetInfo: Interface.Dictionary, client: Client)
}

export class AssetVersion extends AssetLike {
	asset: AssetPartial
	versionNumber: number
	parentVersionId: number
	created: Date
	updated: Date
	
	creatorType: Enum.CreatorType
	creatorId: number
	creator: Creator

	constructor(asset: AssetPartial, versionInfo: Interface.Dictionary, client: Client)

	download(): Promise<NodeJS.ReadableStream>
	fetchCreator(doUpdate?: boolean): Promise<Creator>
}

export class AssetPartial extends AssetLike {
	client: Client

	constructor(assetInfo: Interface.Dictionary, client: Client)

	fetchDetails(doUpdate?: boolean): Promise<Asset & any>
	getVersions(): Promise<Page<AssetVersion[]>>
	download(): Promise<NodeJS.ReadableStream>
	wear(): Promise<void>
	unequip(): Promise<void>

	isFull(): this is Place | Asset
	isPlace(): this is PlacePartial
	isFullAsset(): this is Asset
	isFullPlace(): this is Place

	getFavoriteCount(): Promise<number>
	getFavorite(user?: UserResolvable): Promise<Date|null>
	favorite(): Promise<void>
	unfavorite(): Promise<void>
}

export type AssetResolvable = number | string | AssetPartial
export type UserResolvable = number | string | User | GroupChatMember
export type GroupResolvable = number | string | Group
export type BadgeResolvable = number | string | Badge
export type UniverseResolvable = number | string | UniversePartial | PlacePartial

export class Badge extends AssetLike {
	description: string
	displayName: string
	displayDescription: string
	enabled: boolean
	iconId: number
	displayIconId: number
	awardCounts: {
		pastDay: number
		total: number
		percentage: number
	}
	created: Date 
	updated: Date

	universeId: number
	universe: UniversePartial

	constructor(data: Interface.Dictionary, client: Client)

	getAwardedDate(user: UserResolvable): Promise<Date>
	remove(user?: UserResolvable): Promise<void> 

	fetchUniverse(doUpdate?: boolean): Promise<Universe>
}

export class AvatarAssetPartial extends AssetPartial {
	currentVersionId: number
	assetType: Enum.AssetType
	constructor(assetInfo: Interface.Dictionary, client: Client)
}

export class User extends AssetLike {
	displayName?: string
	inventory: Inventory
	avatar: Avatar

	constructor(data: Interface.UserInit, client: Client)
	
	getDetails(): Promise<UserDetailsResponse>

	getUsernameHistory(options: Interface.PageOptions): Promise<Page<string[]>>

	/**
	 * Gets the user's social networks as shown on their profile.
	 */
	getSocialNetworks(): Promise<Interface.SocialNetworks>

	/**
	 * Fetches a list of the user's Roblox badges (not to be confused with player badges) as shown on their profile.
	 */
	getRobloxBadges(): Promise<Interface.RobloxBadge[]>

	/**
	 * Blocks the user.
	 */
	block(): Promise<void>

	/**
	 * Unblocks the user.
	 */
	unblock(): Promise<void>
	/**
	 * Checks if the user owns the given asset. Not to be confused with the creator of the asset!
	 */
	ownsAsset(asset: AssetResolvable): Promise<boolean>

	/**
	 * Checks if the user can manage the given asset.
	 */
	canManageAsset(asset: AssetResolvable): Promise<boolean>
	
	/**
	 * Returns true if the authenticated user can invite this user to private servers.
	 */
	canInviteToPrivateServers(): Promise<boolean>

	getChat(): Promise<PrivateConversation>

	createGroupChat(otherUsers: UserResolvable | UserResolvable[], name?: string): Promise<GroupConversation>

	isGroupChatMember(): this is GroupChatMember

	fetchAlias(): Promise<string>
	setAlias(alias: string): Promise<void>
	setPendingAlias(alias: string): Promise<void>
}

type UserDetailsResponse = Interface.UserDetails & {created: Date | string}

export class AuthenticatedUser extends User {
	pin: Pin
	privacySettings: PrivacySettings
	avatar: AuthenticatedAvatar

	private constructor(data: Interface.UserInit & {pin?: Pin}, client: Client)

	static get(client: Client): Promise<AuthenticatedUser>
	getBirthdate(): Promise<Date>
	setBirthdate(date: Date, password: string): Promise<void>
	setDescription(description: string): Promise<string>
	getGender(): Promise<Enum.Gender>
	setGender(gender: Enum.Gender): Promise<void>
	getConsecutiveLoginDays(): Promise<number>
	getPhone(): Promise<Interface.VerifiedPhone>
	getSocialNetworks(): Promise<Interface.SocialNetworksAuthenticated>
	setSocialNetworks(networks: Interface.SocialNetworksAuthenticated): Promise<void>
	getEmail(): Promise<Interface.Email>
	getTheme(): Promise<'Dark'|'Light'>
	setTheme(theme: 'Dark'|'Light'): Promise<void>
	getRobux(): Promise<number>
	changeUsername(username: string, password: string): Promise<void>
}

export class Pin extends UserAPIManagerAuthenticated {
	enabled: boolean
	locked: boolean
	unlockedUntil?: number

	static get(client: Client): Promise<Pin>
	private update(method: Enum.HTTPMethod, pin?: string): Promise<any>

	/**
	 * Adds a pin to this account.
	 */
	create(pin: string): Promise<void>

	/**
	 * Changes the pin on this account. PIN must be unlocked.
	 */
	change(pin: string): Promise<void>

	/**
	 * Deletes the pin from this account. PIN must be unlocked.
	 */
	delete(): Promise<void>

	/**
	 * Locks the pin for this account. PIN must be unlocked.
	 */
	lock(): Promise<void>

	/**
	 * Unlocks the pin for this account.
	 */
	unlock(pin: string): Promise<void>
}

export class Outfit extends OutfitPartial {
	name: string
	assetIds: number[]
	assets: AvatarAssetPartial[]
	scales: Interface.AvatarScales
	avatarType: 'R6' | 'R15'
	bodyColors: Interface.BodyColors

	constructor(data: Interface.Dictionary, client: Client)
	getDetails(): Promise<Outfit>
	update(contents?: Interface.OutfitInterface): Promise<void>
	fetchAssets(doUpdate?: false): Promise<Asset[]>
}

export type Constructor<Type> = {
    new(...args: any): Type;
    name: string;
}

// eslint-disable-next-line @typescript-eslint/ban-types
export class Cache<Type extends Object> extends Base {
	static reservedKeys: {[key: string]: true}
	[id: number|string]: (Type | WeakRef<Type>) & any
	globalWeak: boolean
	private classPriority: Constructor<Type>[]
	private CreateClass
	constructor(createClass: Constructor<Type>, client: Client, classPriority?: Constructor<Type>[], globalWeak?: boolean)
	rawget(id: number|string): Type | undefined
	get(id: number|string, options?: any): typeof this.CreateClass.prototype
	get(id: number|string, options: any, overrideClass: Constructor<Type>, weak?: boolean): typeof overrideClass.prototype
	has(id: number|string): boolean
	delete(id: number|string): boolean
	clear(): void
	clearWeak(): void
	set(id: number|string, value: Type, weak?: boolean): typeof value
	isPriority(class0: Type | Constructor<Type>, class1?: Type | Constructor<Type>): boolean
	setIfPriority(key: number|string, value: Type, weak?: boolean): boolean
	markWeak(key: number|string, weak?: boolean): Type
	// eslint-disable-next-line @typescript-eslint/ban-types
	weakClass(class0: Object|Function): boolean|undefined
}

export class Asset extends AssetPartial {
	assetType?: Enum.AssetType | number
	description: string
	productId?: number
	itemStatus?: string[]
	itemRestrictions?: string[]
	price?: number
	premiumPricing?: Interface.PremiumPricing
	lowestPrice?: number
	priceStatus?: 'Offsale'
	unitsAvailable?: number
	favoriteCount?: number
	sales?: number
	offsaleDeadline?: Date
	
	creatorType: Enum.CreatorType
	creatorId: number
	creatorName: string
	creator: Creator

	constructor(assetInfo: Interface.Dictionary, client: Client)

	fetchCreator(doUpdate?: boolean): Promise<Creator>
}

export class BundlePartial extends AssetLike {
	getRecommendations(count?: number): Promise<Bundle[]>
	getFavoriteCount(): Promise<number>
	getFavorite(user?: UserResolvable): Promise<Date|null>
	favorite(): Promise<void>
	unfavorite(): Promise<void>
	wear(): Promise<void>
	fetchDetails(doUpdate?: boolean): Promise<Bundle>
}

export type Creator = User | Group | Interface.RawCreator

export class Bundle extends BundlePartial {
	description: string
	bundleType: Enum.BundleType
	items: AssetPartial[]
	product: Interface.BundleProduct

	creatorType: Enum.CreatorType
	creatorId: number
	rawCreator: Interface.RawCreator
	creator: Creator

	fetchCreator(doUpdate?: boolean): Promise<Creator>
}

export class Avatar extends UserAPIManager {
	getAll(): Promise<Interface.AvatarInfo>
	getWearing(): Promise<AssetPartial[]>
}

export class AuthenticatedAvatar extends Avatar {
	removeAsset(asset: AssetResolvable): Promise<void>
	wearAsset(asset: AssetResolvable): Promise<void>
	redrawThumbnail(): Promise<void>
	setBodyColors(colors: Interface.BodyColors): Promise<void>
	setAvatarType(avatarType: 'R6' | 'R15'): Promise<void>
	setScales(scales: Interface.AvatarScales): Promise<void>
	bulkUpdateWearing(assets: AssetResolvable[]): Promise<Interface.WornOutfit>
}

export class Group extends AssetLike {
	constructor(options: Interface.Dictionary, client: Client)
}

export class Inventory extends UserAPIManager {
	getOutfits(options: Interface.GetOutfitOptions): Promise<OutfitPartial[]>
	getBadges(options?: Interface.PageOptions): Page<Badge[]>
	getBadgeAwardedDates(badges: BadgeResolvable[]): Promise<{[badgeId: number]: Date}>
}

export class OutfitPartial extends AssetLike {
	isEditable: boolean

	constructor(data: Interface.Dictionary, client: Client)

	getDetails(force?: boolean): Promise<Outfit>

	delete(): Promise<void>
	update(contents: Interface.OutfitInterface): Promise<void>
	wear(): Promise<Interface.WornOutfit>
}

export class PlacePartial extends AssetPartial {
	fetchDetails(doUpdate?: boolean): Promise<Place>

	universeId?: number
	universe?: UniversePartial

	fetchUniverse(doUpdate?: boolean): Promise<Universe>

	getServers(serverType?: 'Public'|'Friends'|'VIP', options?: Interface.PageOptions): Promise<Page<ServerInstance[]>>

	getChat(): Promise<TeamCreateConversation>

	upload(file: FileResolvable, fileType?: Enum.PlaceFileType, versionType?: Enum.PlaceVersionType): Promise<Interface.PlaceUploadResponse>
	uploadFromPath(filePath: string, fileType?: Enum.PlaceFileType, versionType?: Enum.PlaceVersionType): Promise<Interface.PlaceUploadResponse>

	bulkDataStoreGet(queries: Interface.DataStoreBulkQuery[], type?: 'standard'|'sorted'): Promise<Interface.DataStoreBulkResponse[]>
	getDataStore(name: string, scope?: string): DataStore
	getOrderedDataStore(name: string, scope?: string): OrderedDataStore
	globalDataStore: GlobalDataStore
	getLegacyDataStore(name: string, scope?: string): LegacyDataStore

	getSettings(): Promise<Interface.PlaceSettings>
	patchSettings(settings: Interface.PlaceSettingsPatch): Promise<Interface.PlaceSettings>
}

export class PlaceAsset extends PlacePartial {
	
}

export class Place extends PlaceAsset {
	
}

export class PrivacySettings {
	constructor(client: Client)

	private get(endpoint: string, index: string): Promise<any>

	private set(endpoint: string, index: string, value: any, method: Enum.HTTPMethod): Promise<any>

	/**
	 * Gets the privacy level of the website chat for the authenticated user.
	 */
	getWebsiteChatPrivacy(): Promise<'Friends'|'NoOne'>

	/**
	 * Updates the privacy level of the website chat for the authenticated user. PIN must be unlocked.
	 */
	setWebsiteChatPrivacy(privacy: 'Friends'|'NoOne'): Promise<void>

	/**
	 * Gets the privacy level of in-game chat for the authenticated user.
	 */
	getGameChatPrivacy(): Promise<'AllUsers'|'NoOne'>
	/**
	 * Updates the privacy level of in-game chat for the authenticated user. PIN must be unlocked.
	 */
	setGameChatPrivacy(privacy: 'AllUsers'|'NoOne'): Promise<void>

	/**
	 * Gets the privacy level of the authenticated user's inventory.
	 */
	getInventoryPrivacy(): Promise<Enum.Privacy>
	/**
	 * Updates the privacy level of the authenticated user's inventory. PIN must be unlocked.
	 */
	setInventoryPrivacy(privacy: Enum.Privacy): Promise<void>

	/**
	 * Gets the privacy level of trading for the authenticated user.
	 */
	getTradePrivacy(): Promise<Enum.Privacy> 
	/**
	 * Updates the privacy level of trading for the authenticated user. PIN must be unlocked.
	 */
	setTradePrivacy(privacy: Enum.Privacy): Promise<{tradePrivacy: Enum.Privacy, inventoryPrivacy: Enum.Privacy, privacySettingResponse: string}>

	/**
	 * Gets the authenticated user's phone discovery settings
	 */
	getPhoneDiscoveryPrivacy(): Promise<Enum.Privacy>
	/**
	 * Updates the authenticated user's phone discovery settings. PIN must be unlocked.
	 */
	setPhoneDiscoveryPrivacy(privacy: Enum.Privacy): Promise<void>

	/**
	 * Gets the authenticated user's privacy message privacy settings.
	 */
	getPrivateMessagePrivacy(): Promise<Enum.Privacy>
	/**
	 * Updates the authenticated user's phone discovery settings. PIN must be unlocked.
	 */
	setPrivateMessagePrivacy(privacy: Enum.Privacy): Promise<void>
}

export class BaseRequested {
	url: string
	method: Enum.HTTPMethod
	requestHeaders: Headers
	requestBody?: any
	requestParams: Interface.RequestParams

	constructor(req: Interface.RequestParams, startUrl: string)

	isResponse(): this is BaseResponse
	isHttp(): this is RobloxResponse
	isDownload(): this is DownloadResposne
}

export class BaseResponse extends BaseRequested {
	ok: boolean
	status: number
	statusText: string
	body: string | NodeJS.ReadableStream
	headers: Headers
	redirectedTo?: string

	fetchResult: Response
	fetchError: FetchError
	
	constructor(res: Response | FetchError, body: string, req?: Interface.RequestParams, url?: string)
}

export class RobloxResponse extends BaseResponse {
	body: string
	json: any

	errors: Interface.APIError[]
	errorMessages: string
}

export class DownloadResposne extends BaseResponse {
	body: NodeJS.ReadableStream
}

export class RequestError extends Error {
	response: RobloxResponse
	name: 'FetchError'
	url: string
	constructor(response: RobloxResponse)
}

export class ServerInstance extends PartialServerInstance {
	id: string
	maxPlayers: number
	playing: number
	playerTokens?: string[]
	fps: number
	ping: number

	constructor(data: Interface.Dictionary, client: Client)
}

export class PrivateServerPartial extends AssetLike {
	edit(options: Interface.EditPrivateServerOptions): Promise<RichPrivateServer>
	setName(name: string): Promise<RichPrivateServer>
	regenCode(): Promise<string>
	setActive(active: boolean): Promise<RichPrivateServer>

	editPermissions(options: Interface.EditPrivateServerPermissionsOptions): Promise<Interface.PrivateServerPermissions>
	addUsers(users: UserResolvable|UserResolvable[]): Promise<Interface.PrivateServerPermissions>
	removeUsers(users: UserResolvable|UserResolvable[]): Promise<Interface.PrivateServerPermissions>
	setFriendsAllowed(friendsAllowed: boolean): Promise<Interface.PrivateServerPermissions>

	fetchDetails(doUpdate?: false): Promise<PrivateServer>

	editSubscription(options: Interface.EditPrivateServerSubscriptionOptions): Promise<Interface.PrivateServerSubscription>

	editVoiceSettings(options: Interface.PrivateServerVoiceSettings): Promise<Interface.PrivateServerVoiceSettings>
	setVoiceChatEnabled(enabled: boolean): Promise<Interface.PrivateServerVoiceSettings>

	isStandard(): this is PrivateServer
	isRich(): this is RichPrivateServer
}

export class PrivateServer extends PrivateServerPartial {
	accessCode: number
	ownerId: number
	owner: User
	placeId: number
	place: PlacePartial
	serverInstance?: ServerInstance

	constructor(data: Interface.Dictionary, client: Client)

	fetchRich(): Promise<RichPrivateServer>
	fetchSettings(): Promise<RichPrivateServer>
	shutdown(): Promise<void>

	fetchOwner(doUpdate?: false): Promise<User>
	fetchPlace(doUpdate?: false): Promise<Place>
}

export type PageFunc<ContentType=any,CursorType=string,ModContents=ContentType> = (collection: Collection<ContentType,CursorType,ModContents>) => CursorType

export class Collection<ContentType=any,CursorType=string,ModContents=ContentType> {
	private nextPageFunc: PageFunc<ContentType,CursorType,ModContents>
	private previousPageFunc: PageFunc<ContentType,CursorType,ModContents>
	private mapFunc: (value: any) => any
	private modFunc: (value: any) => any
	private cursorName: string
	body: ContentType
	contents: ModContents
	hasNextPage: boolean
	hasPreviousPage: boolean
	nextPageCursor?: CursorType
	currentCursor: CursorType
	previousPageCursor?: CursorType
	private url: string
	private params?: Interface.RequestParams
	client: Client
	private options: Interface.CollectionOptions<ContentType,CursorType,ModContents>

	constructor(url: string, body: any, client: Client, options: Interface.CollectionOptions<ContentType,CursorType,ModContents>)

	fromCursor(cursor: CursorType): Promise<Collection<ContentType,CursorType,ModContents>>

	nextPage(): Promise<Collection<ContentType,CursorType,ModContents>>
	prevPage(): Promise<Collection<ContentType,CursorType,ModContents>>

	/**
	 * Fetches and returns all the remaining page objects at once.
	 * Depending on the API, this may take a while due to ratelimits! 
	 */
	fetchAllPages(): Promise<Collection<ContentType,CursorType,ModContents>[]>

	/**
	 * Uses fetchAllPages to fetch all the page objects and then returns an array with all of their data.
	 * Depending on the API, this may take a while due to ratelimits! 
	 */
	fetchAllPageData(): Promise<ModContents[]>

	static first<ContentType2=any,CursorType2=string,ModContents2=ContentType2>(url: string, client: Client, options: Interface.CollectionOptions<ContentType2,CursorType2,ModContents2> & any): Promise<Collection<ContentType2,CursorType2,ModContents2>> & any
}

export class Page<ContentType=any[],PageInfo=Interface.PageCursor> extends Collection<Interface.PageRawBody<ContentType>,string,ContentType> {
	contents: ContentType
	private canDecodeCursors: boolean

	nextPageInfo?: PageInfo
	previousPageInfo?: PageInfo
	
	constructor(url: string, params: Interface.RequestParams & Interface.CursorOptions, body: Interface.PageRawBody<any>, client: Client, mapFunc?: (value: any) => any, canDecodeCursors?: boolean)

	nextPage(): Promise<Page<ContentType>>
	prevPage(): Promise<Page<ContentType>>

	static first<ContentType2>(url: string, client: Client, params: Interface.RequestParams & Interface.CursorOptions, mapFunc?: (value: any) => any, canDecode?: boolean): Promise<Page<ContentType2>>
}

export class UniversePartial extends AssetLike {
	client: Client
	rootPlaceId?: number
	rootPlace?: PlacePartial

	constructor(data: Interface.Dictionary, client: Client)

	fetchDetails(doUpdate?: false): Promise<Universe>
	fetchRootPlace(doUpdate?: false): Promise<Place>

	fetchSettings(): Interface.UniverseSettingsV1
	patchSettings(settings: Partial<Interface.UniverseSettings>): Interface.UniverseSettings
}

export class Universe extends UniversePartial {
	description: string
	price?: number
	allowedGearGenres: string[]
	allowedGearCategories: string[]
	isGenreEnforced: boolean
	copyingAllowed: boolean
	playing: number
	visits: number
	maxPlayers: number
	created: Date
	updated: Date
	studioAccessToApis: boolean
	privateServersEnabled: boolean
	universeAvatarType: Enum.UniverseAvatarType
	genre: string
	isAllGenre: boolean
	/** @deprecated NYI to Roblox API - currently always null */
	gameRating: any
	isFavorited: boolean
	favoritedCount: number
	
	creatorType: Enum.CreatorType
	creatorId: number
	rawCreator: Interface.RawCreator
	creator: Creator

	constructor(data: Interface.Dictionary, client: Client)

	fetchCreator(doUpdate?: false): Promise<Creator>
}

export class UniverseBadges extends UniverseAPIManager {
	getAll(options: Interface.PageOptions): Promise<Page<Badge[]>>
}

export class UserAPIManager extends Base {
	readonly user: User
	constructor(user: User, client: Client)
}

export class UserAPIManagerAuthenticated extends UserAPIManager {
	readonly user: AuthenticatedUser
	constructor(client: Client)
}

export class GroupAPIManager extends Base {
	readonly group: Group
	constructor(group: Group, client: Client)
}

export class UniverseAPIManager extends Base {
	readonly universe: UniversePartial
	constructor(universe: UniversePartial, client: Client)
}

export class PlaceAPIManager extends Base {
	readonly place: PlacePartial
	
	constructor(place: PlacePartial, client: Client)
}

export class RichServerPlayer extends Base {
	user?: User
	thumbnailUrl: string
	avatarId?: string
	isFinal: boolean
	constructor(data: Interface.Dictionary, client: Client)
	fetchUser(doUpdate?: boolean): Promise<User>
	equals(user: string|RichServerPlayer): boolean
}

export class RichServerInstance extends ServerInstance {
	slowGame: boolean
	canJoin: boolean
	canShutdown: boolean
	playerThumbnails: RichServerPlayer[]
	websiteDisplay: {
		friendsDescription: string
		friendsMouseOver: string
		playersCapacity: string
		joinScript: string
		mobileJoinScript: string
	}
}

export class PartialServerInstance extends Base {
	readonly id: string
	placeId: number
	place: PlacePartial

	constructor(data: Interface.Dictionary, client: Client)
	_patch(data: Interface.Dictionary): typeof this

	fetchPlace(doUpdate?: boolean): Promise<Place>

	isFull(): this is ServerInstance
	isRich(): this is RichServerInstance
	isRichPrivate(): this is RichPrivateServerInstance
}

export class RichPrivateServerInstance extends ServerInstance {
	ip: string
	playerIds: number[]
	players: User[]
	gameCode: string
	matchmakingContextId: number
	constructor(data: Interface.Dictionary, place: PlacePartial, client: Client)
	fetchPlayers(doUpdate?: boolean): Promise<User[]>
}

export class RichPrivateServer extends PrivateServer {
	constructor(data: Interface.Dictionary, place: PlacePartial, client: Client)
	universe: UniversePartial
	statusType: number
	created?: Date
	updated?: Date
	linkCode?: string
	link?: string
	lastStatusChangeReasonType?: number
	subscription: Interface.PrivateServerSubscription
	permissions: Interface.PrivateServerPermissions
	voiceSettings: Interface.PrivateServerVoiceSettings
	isOwner: boolean
	maxPlayers: number
	/** @deprecated Does not ever seem to be anything other than null */
	gameScriptManager: any
	active: boolean
	websiteJoinScript: string
	canConfigure: boolean
	canShutdown: boolean
}

export class BaseRequest extends Function {
	constructor(client: Client)

	_call(url: string, params: Interface.RequestParams): Promise<RobloxResponse>

	roblox(subdomain?: string, path?: string, params?: Interface.RequestParams): Promise<RobloxResponse>
}

export class Request extends BaseRequest {
	general(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	legacy(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	account(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	settings(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	adconfig(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	ads(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	delivery(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	auth(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	avatar(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	badges(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	billing(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	catalog(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	cdnproviders(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	chat(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	clientsettings(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	clientsettingscdn(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	contacts(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	contentstore(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	develop(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	forums(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	economy(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	economystats(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	premiumpayouts(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	followings(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	friends(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	gametranslation(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	gamejoin(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	datastores(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	games(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	groups(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	groupmod(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	inventory(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	itemconfig(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	locale(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	localizationtables(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	metrics(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	midas(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	notifications(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	realtime(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	points(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	premium(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	presence(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	messages(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	publish(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	share(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	filter(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	thumbnails(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	thumbnailsresizer(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	trades(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	translationroles(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	translations(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	twofactor(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	moderation(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	users(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	voice(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
	cloud(path: string, params: Interface.RequestParams): Promise<RobloxResponse>
}

export class UserManager extends MultiFetchableManager<User, number, UserResolvable> {
	isValidUsername(username: string, context: 'Signup'|'Unknown'|'UsernameChange', birthday?: Date): Promise<Interface.ValidUsername>
	batchFetchAlias(userId: number): Promise<string>
	batchFetchALias(userIds: number[]): Promise<Map<number, string>>
}

export class UniverseManager extends MultiFetchableManager<UniversePartial, number, UniverseResolvable, Universe> {}

export class AssetManager extends MultiFetchableManager<AssetPartial, number, AssetResolvable, Asset> {}

export class GamepassManager extends MultiFetchableManager<GamepassPartial, number, GamepassResolvable, Gamepass> {}

export class GroupManager extends MultiFetchableManager<Group, number, GroupResolvable> {}

export class OutfitManager extends FetchableManager<OutfitPartial, number, OutfitResolvable, Outfit> {}

export class PlaceManager extends MultiFetchableManager<PlacePartial, number, PlaceResolvable, Place> {}

export class PrivateServerManager extends MultiFetchableManager<PrivateServerPartial, number, PrivateServerResolvable, PrivateServer> {}

export class BundleManager extends MultiFetchableManager<BundlePartial, number, BundleResolvable, Bundle> {}

export class ServerInstanceManager extends Base {
	cache: Cache<PartialServerInstance>
	constructor(client: Client)
	resolveId(resolvable: ServerInstanceResolvable): string
	get(id: string, options?: (AssetPartial | number) & any, overrideClass?: Constructor<PartialServerInstance>, weak?: boolean): PartialServerInstance
} 

export class UserGroupManager extends UserAPIManager {
	fetchGroups(): Promise<Group[]>
}

export class ChatManager extends Base {
	messages: ChatMessageManager
	conversations: ConversationManager

	getSettings(): Promise<Interface.ChatSettings>
	getFeatureRollouts(featureName: string): Promise<boolean>
	getFeatureRollouts(featureNames: string): Promise<Map<string, boolean>>
	getMetadata(): Promise<Interface.Dictionary>
	getUnreadConversationCount(): Promise<number>
}

export class ChatMessageManager extends Base {
	cache: Cache<MessagePartial>
	resolveId(resolvable: ChatMessageResolvable): string
	get(id: string, data?: Interface.Dictionary): MessagePartial
	get(id: string, data: Interface.Dictionary, overrideClass: Constructor<MessagePartial>): typeof overrideClass.prototype
	getLatest(conversation: ConversationResolvable, amount?: number): Promise<Collection<Interface.Dictionary[], string, Message[]>>
	getLatest(conversations: ConversationResolvable[], amount?: number): Promise<Map<number, Collection<Interface.Dictionary[], string, Message[]>>>
}

export class ConversationManager extends Base {
	cache: Cache<ConversationPartial>
	resolveId(resolvable: ConversationResolvable): number
	get(id: string, data?: Interface.Dictionary): ConversationPartial
	get(id: string, data: Interface.Dictionary, overrideClass: Constructor<ConversationPartial>): typeof overrideClass.prototype
}

export class ConversationPartial extends AssetLike {
	messages: ChatMessageManager
	fetchDetails(doUpdate?: false): Promise<Conversation>
	fetchMessages(pageSize?: number): Promise<Collection<Interface.Dictionary[], string, Message[]>>
	markAsRead(): Promise<void>
	resetUniverse(): Promise<void>
	setUniverse(universe: UniverseResolvable): Promise<void>
	send(options: Interface.SendMessageOptions | string): Promise<SentMessage>
	sendGameLink(universe: UniverseResolvable, decorators?: string[]): Promise<LinkMessage>
	setTyping(isTyping: boolean): Promise<void>
}

export class Conversation extends ConversationPartial {
	static get(data: Interface.Dictionary, client: Client): Conversation
	static get(data: Interface.Dictionary & {conversationType: 'OneToOneCoversation'}, client: Client): PrivateConversation
	static get(data: Interface.Dictionary & {conversationType: 'MultiUserConversation'}, client: Client): GroupConversation
	static get(data: Interface.Dictionary & {conversationType: 'CloudEditConversation'}, client: Client): TeamCreateConversation
	initiator: User | GroupChatMember
	hasUnreadMessages?: boolean
	participants: (User | GroupChatMember)[]
	type: Enum.ConversationType
	lastUpdated: Date
	universeId?: number
	title?: Interface.ConversationTitle
	get unvierse(): UniversePartial
	fetchUniverse(): Promise<Universe>
	isGroupChat(): this is GroupConversation
	isPrivateChat(): this is PrivateConversation
	isTeamCreateChat(): this is TeamCreateConversation
}

export class GroupConversation extends Conversation {
	initiator: GroupChatMember
	participants: GroupChatMember[]
	type: Enum.ConversationType.MultiUserConversation
	addMembers(users: UserResolvable): Promise<void>
	addMembers(users: UserResolvable[]): Promise<Map<User, string>>
	removeMember(user: UserResolvable): Promise<void>
	setName(name: string): Promise<Interface.ConversationTitle>
}

export class TeamCreateConversation extends Conversation {
	type: Enum.ConversationType.CloudEditConversation
	initiator: User
	participants: User[]
}

export class GroupChatMember<ConversationType=Conversation> extends Base {
	constructor(user: User, chat: ConversationType, client: Client)
	user: User
	conversation: ConversationType
	get name(): string
	get displayName(): string
	remove(): Promise<void>
	isGroupChatMember(): this is GroupChatMember
}

export class PrivateConversation extends Conversation {
	initiator: User
	get user(): User
	type: Enum.ConversationType.OneToOneCoversation
}

export class MessagePartial extends Base {
	id: string
	conversationId: number
	get conversation(): ConversationPartial
	_patch(data: Interface.Dictionary): typeof this
	fetchConversation(doUpdate?: boolean): Promise<Conversation>
	markAsRead(): Promise<void>
	isFull(): this is Message
}

export class Message extends MessagePartial {
	authorType: Enum.MessageAuthorType
	system: boolean
	read: boolean
	created: Date
	type: Enum.MessageType
	decorators: string[]
	isFromUser(): this is UserMessage
	isText(): this is TextMessage
	isLink(): this is LinkMessage
	isSystem(): this is SystemMessage
	isEvent(): this is EventMessage
}

export class UnknownMessage extends Message {
	[key: string]: any
}

export class UserMessage extends Message {
	authorType: Enum.MessageAuthorType.User
	authorId: number
	get author(): User | GroupChatMember
	fetchAuthor(doUpdate?: boolean): Promise<User | GroupChatMember>
}

export class SystemMessage extends Message {
	authorType: Enum.MessageAuthorType.System
}

export class TextMessage extends UserManager {
	type: Enum.MessageType.PlainText
	content: string
}

export class SentMessage extends TextMessage {
	filtered: boolean
}

export class LinkMessage extends UserMessage {
	type: Enum.MessageType.Link
	link: MessageLink
}

export class EventMessage extends SystemMessage {
	event: MessageEvent
}

export class MessageExtension extends Base {
	messageId: string
	get message(): Message
}

export class MessageEvent extends MessageExtension {
	type: Enum.MessageEventType
}

export class RawMessageEvent extends MessageEvent {
	[key: string]: any
}

export class UserMessageEvent extends MessageEvent {
	actorId: number
	get actor(): User | GroupChatMember
	fetchActor(doUpdate?: boolean): Promise<User | GroupChatMember>
}

export class SetUniverseEvent extends MessageEvent {
	type: Enum.MessageEventType.SetConversationUniverse
	universeId: number
	get universe(): UniversePartial
	fetchUniverse(doUpdate?: boolean): Promise<Universe>
}

export class MessageLink extends MessageExtension {
	type: Enum.MessageLinkType
	static get(data: Interface.Dictionary, client: Client, messageId: string): MessageLink
	static get(data: Interface.Dictionary & {type: 'Game'}, client: Client, messageId: string): GameLink
}

export class UnknownLink extends MessageLink {
	[key: string]: any
}

export class GameLink extends MessageLink {
	type: Enum.MessageLinkType.Game
	universeId: number
	get universe(): UniversePartial
	fetchUniverse(doUpdate?: boolean): Promise<Universe>
}

export class BaseManager<Class, Key=number, Resolvable=GenericResolvable> extends Base {
	cache: Cache<Class>
	resolveId(resolvable: Resolvable): Key
	get?(id: Key, data?: Interface.Dictionary): Class
	get?(id: Key, data: Interface.Dictionary, overrideClass: Constructor<Class>): typeof overrideClass.prototype
}

export class FetchableManager<Class, Key=number, Resolvable=GenericResolvable, FetchClass=Class> extends BaseManager<Class, Key, Resolvable> {
	fetch(id: Resolvable, forceUpdate?: boolean): Promise<FetchClass>
}

export class MultiFetchableManager<Class, Key=number, Resolvable=GenericResolvable, FetchClass=Class> extends FetchableManager<Class, Key, Resolvable, FetchClass> {
	fetch(id: Resolvable, forceUpdate?: boolean): Promise<FetchClass>
	fetch(id: Resolvable[], forceUpdate?: boolean): Promise<Map<Key, FetchClass>>
}

export class SponsorManager extends BaseManager<SponsorshipPartial, number, SponsorResolvable> {
	stopSponsor(sponsor: SponsorResolvable): Promise<void>
}

export class UniverseSponsorManager extends UniverseAPIManager {
	fetchList(archived?: boolean): Promise<Page<Sponsorship[]>>
	get(id: number): Promise<SponsorshipPartial>
	attemptFetchId(id: SponsorResolvable, doUpdate?: false, archived?: boolean): Promise<Sponsorship>
	create(sponsorOptions: SponsorshipPartial): Promise<any>
}

export class SponsorshipPartial extends AssetLike {
	get universe(): UniversePartial
	fetchUniverse(doUpdate?: boolean): Promise<Universe>
	attemptFetchDetails(doUpdate?: boolean): Promise<Sponsorship>
	stop(): Promise<void>
}

export class Sponsorship extends SponsorshipPartial {
	adId: number
	moderationStatus: string
	status: Enum.SponsorStatus
	iconType: 'Image'
	iconId: number
	iconUrl: string
	bid: number
	dailyBudget: number
	startDate: Date
	endDate: Date
	targetGenders: Enum.SponsorTargetGender[]
	targetAges: Enum.SponsorAgeBracket[]
	targetDevices: Enum.DeviceType[]
	type: 'Universe'
	
	robuxUsed: number
	impressions: number
	clicks: number
	totalConversions: number
	impressionConversions: number
	clickConversions: number
}

export class DataStoreVersion {
	datastore: DataStore
	client: Client
	key: string
	version: string
	deleted: boolean
	size: number
	keyCreated: Date
	versionCreated: Date
	getLatest(): Promise<DataStoreValue>
	getVersion(): Promise<DataStoreValue>
	deleteVersion(): Promise<DataStoreValue>
}

export class DataStoreValue extends DataStoreVersion {
	value: any
	hash: Buffer
	attributes?: Interface.Dictionary
	userIds?: number[]
	users: User[]
	fetchUsers(doUpdate?: boolean): Promise<User[]>
	update(updateThisObject?: true): Promise<this>
	update(updateThisObject: false): Promise<DataStoreValue>
}

export class DataStore extends PlaceAPIManager {
	name: string
	scope: string
	type: 'standard'
	headers: Headers
	universeId?: number
	nameEncoded: string
	scopeEncoded: string
	constructor(name: string, scope: string | undefined, place: PlaceResolvable, client: Client)
	getUniverseId(): Promise<number>
	get(key: string): Promise<DataStoreValue>
	get(key: string, version: string): Promise<DataStoreValue>
	set(key: string, value: any, userIds?: UserResolvable[], attributes?: Interface.Dictionary): Promise<DataStoreValue>
	remove(key: string): Promise<DataStoreValue>
	remove(key: string, version: string): Promise<DataStoreValue>
	increment(key: string, amount: number, userIds?: UserResolvable[], attributes?: Interface.Dictionary): Promise<DataStoreValue>
	listVersions(key: string, startDate?: Date, endDate?: Date, maxPageSize?: number, sortOrder?: Enum.SortOrderLong): Promise<Page<DataStoreVersion,Interface.DataStoreVersionPageData>>
	listKeys(prefix?: string, maxPageSize?: number): Promise<Page<string>>
	getBulk(keys: string[]): Promise<Map<string, any>>
}

export class LegacyDataStore extends PlaceAPIManager {
	name: string
	scope: string
	type: 'standard' | 'sorted'
	headers: Headers
	nameEncoded: string
	scopeEncoded: string
	get(key: string): Promise<any>
	set(key: string, value: any): Promise<void>
	remove(key: string): Promise<any>
	increment(key: string, amount: number): Promise<number>
	update(key: string, callback: (value: any) => any): Promise<any>
	getBulk(keys: string[]): Promise<Map<string, any>>
}

export class OrderedDataStore extends LegacyDataStore {
	type: 'sorted'
	getSorted(pageSize?: number, minValue?: number, maxValue?: number, ascendingOrder?: boolean): Promise<Collection<{key: string, value: any}>>
}

export class GlobalDataStore extends LegacyDataStore {
	constructor(place: PlaceResolvable, client: Client)
	type: 'standard'
	scope: 'u'
	scopeEncoded: 'u'
}

export class FFlagManager extends Base {
	windows: FFlagChannel
	mac: FFlagChannel
	windowsStudioBootstrapper: FFlagChannel
	macStudioBootstrapper: FFlagChannel
	windowsBootstrapper: FFlagChannel
	macBootstrapper: FFlagChannel
	xbox: FFlagChannel
	android: FFlagChannel
	ios: FFlagChannel
	studio: FFlagChannel
	getUserChannel(): Promise<string>
	getBinaryVersion(binaryType?: Enum.BinaryType, channelName?: 'LIVE' | string): Promise<Interface.BinaryVersion>
}

export class FFlagChannel extends MultiFetchableManager<FFlag, string, FFlagResolvable> {
	cache: Cache<FFlag>
	channel: Enum.FFlagChannel
	get: undefined
	from(fullName: string, value: string): FFlag
	fetch(fullFlagName: string, doUpdate?: boolean, light?: boolean): Promise<FFlag>
	fetch(fullFlagNames: string[], doUpdate?: boolean, light?: boolean): Promise<Map<string, FFlag>>
	fetchAllRaw(): Promise<{[flagName: string]: string}>
	fetchAll(): Promise<Map<string, FFlag>>
}

export class FFlag extends Base {
	fullName: string
	name: string
	channel: FFlagChannel
	dynamic: boolean
	valueType: Enum.FFlagValueType
	prefix: Enum.FFlagPrefix
	shortPrefix: Enum.FFlagShortPrefix
	_patch(options: Interface.Dictionary): FFlag
	filter: string[]
	filterType: Enum.FFlagFilterType
	placeFilter: PlacePartial[]
	fetchPlaces(doUpdate?: boolean, force?: boolean): Promise<Place[]>
	toString(): string
}

export class GamepassPartial extends AssetLike {}
export class Gamepass extends GamepassPartial {}

export type ChatMessageResolvable = string | MessagePartial
export type ConversationResolvable = number | string | ConversationPartial
export type GamepassResolvable = number | string | GamepassPartial
export type OutfitResolvable = number | string | OutfitPartial
export type PlaceResolvable = number | string | PrivateServer | PlacePartial
export type PrivateServerResolvable = number | string | PrivateServerPartial
export type ServerInstanceResolvable = string | PartialServerInstance
export type BundleResolvable = number | string | BundlePartial
export type SponsorResolvable = number | string | SponsorshipPartial
export type FFlagResolvable = string | FFlag
export type GenericResolvable = number | string | AssetLike
export type FileResolvable = string | Buffer | Stream | FileHandle 

export * from "./interfaces"
export * from "./enums"