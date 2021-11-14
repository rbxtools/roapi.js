import { IncomingHttpHeaders } from "http";
import { Writable } from "stream";
import { InspectOptions } from "util";
import { CollisionType, DeviceType, FilterBehavior, FilterInclusion, FilterType, HTTPMethod, JointPositioningType, MutualFilterBehavior, Privacy, RedirectFilterBehavior, RequestLoggingMode, RequestType, SecurityType, SocialSlotType, SortOrder, UniverseAnimationType, UniverseAvatarType } from "./enums";
import {AvatarAssetPartial, AssetPartial, Asset, Emote, PageFunc, User, UserResolvable, BaseRequested} from "./index"

export interface WornOutfit {
	invalidAssets: AvatarAssetPartial[]
	unknownAssets: AssetPartial[]
	success: boolean
}

export interface OutfitInterface {
	name?: string
	assets?: (Asset | AvatarAssetPartial)[]
	scales?: AvatarScales
	playerAvatarType?: 'R6' | 'R15'
	bodyColors?: BodyColors
}

export interface PageCursor {
	key: number;
	sortOrder: "Asc" | "Desc";
	pagingDirection: "Forward" | "Backward";
	pageNumber: number;
	discriminator: string;
	count: number;
	hash: string;
}

export interface RequestParams extends RequestInit {
	retryRatelimitAfter?: number | false
	retryLimit?: number
	dontRejectPromise?: boolean
	body?: any
	alwaysRetry?: boolean
}

export interface CursorOptions {
	nextPageIndex?: string
	prevPageIndex?: string
	cursorName?: string
}

export interface PageOptions<PageLimit=10|25|50|100> {
	limit?: PageLimit,
	order?: SortOrder
}

export interface APIError {
	code: number | string
	message: string
	userFacingMessage?: string
}

export interface Dictionary {[index: string]: any}

export interface UserDetails {
	description: string;
	created: Date;
	isBanned: boolean;
	externalAppDisplayName?: string;
	id: number;
	name: string;
	displayName: string;
}

export interface Phone {
	countryCode: string
	prefix: string
	phone: string
}
export interface VerifiedPhone extends Phone {
	isVerified: boolean
	verificationCodeLength: number
}

export interface SocialNetworks {
	facebook?: string
	twitter?: string
	youtube?: string
	twitch?: string
}
export interface SocialNetworksAuthenticated extends SocialNetworks {
	privacy: Privacy
}

export interface RobloxBadge {
	id: number
	name: string
	description: string
	imageUrl: string
}

export interface Email {
	emailAddress: string
	verified: boolean
}

export interface AvatarInfo {
	scales: AvatarScales
	playerAvatarType: 'R6' | 'R15'
	bodyColors: BodyColors
	assets: AvatarAssetPartial[]
	defaultShirtApplied: boolean
	defaultPantsApplied: boolean
	emotes: Emote[]
}

export interface BodyColors {
	headColorId: number
	torsoColorId: number
	rightArmColorId: number
	leftArmColorId: number
	rightLegColorId: number
	leftLegColorId: number
}

export interface AvatarScales {
	height: number
	width: number
	head: number
	depth: number
	proportion: number
	bodyType: number
}

export interface UserInit {
	id?: number,
	userId?: number,
	name?: string,
	username?: string,
	displayName?: string,
}

export interface GetOutfitOptions {
	count?: number
	isEditable?: boolean
}

export interface PageRawBody<ContentType> extends Dictionary {
	data: ContentType
	nextPageCursor?: string
	previousPageCursor?: string
}

export interface CollectionOptions<ContentType=any,CursorType=string,ModContents=ContentType> {
	nextPageFunc: PageFunc<ContentType,CursorType,ModContents>
	previousPageFunc: PageFunc<ContentType,CursorType,ModContents>
	mapFunc?: (value: any) => any
	modFunc?: (value: any) => any
	cursorName?: string
	requestParams?: RequestParams
	currentCursor: CursorType
}

export interface ValidUsername {
	code: number
	message: string
	valid: boolean
}

export interface EditPrivateServerOptions {
	name?: string
	newJoinCode?: boolean
	active?: boolean
}

export interface PrivateServerSubscription {
	/** Whether the private server is currently being paid for */
	active: boolean
	/** Whether the private server has expired */
	expired?: boolean
	/** The set expiration date for this private server */
	expirationDate: Date
	/** The monthly price of this private server, if any */
	price?: number
	/** Can the private server be renewed */
	canRenew: boolean
	/** Was the private server cancelled due to the owner having insufficient robux funds for the subscription */
	hasInsufficientFunds?: boolean
	hasRecurringProfile?: boolean
	/** Was the private server cancelled due to the game developer changing the private server cost */
	hasPriceChanged?: boolean
}

export interface PrivateServerPermissions {
	/** @deprecated Clans have been removed */
	clanAllowed: boolean
	/** @deprecated Clans have been removed */
	enemyClanId?: number
	/** Are all friends of the owner allowed to join */
	friendsAllowed: boolean
	/** All users manually added to the server */
	users: User[]
}

export interface PrivateServerVoiceSettings {
	enabled: boolean
}

export interface EditPrivateServerPermissionsOptions {
	/** @deprecated Clans have been removed */
	clanAllowed?: boolean
	/** @deprecated Clans have been removed */
	enemyClanId?: number
	friendsAllowed?: boolean
	usersToAdd: UserResolvable[]
	usersToRemove: UserResolvable[]
}

export interface EditPrivateServerSubscriptionOptions {
	active?: boolean
	price?: number
}

export interface BundleProduct {
	id: number
	type: string
	isPublicDomain: boolean
	isForSale: boolean
	priceInRobux?: number
	isFree: boolean
	noPriceText?: string
	premiumPricing?: PremiumPricing
}

export interface PremiumPricing {
	premiumDiscountPercentage: number
	premiumPriceInRobux: number
}

export interface ConversationTitle {
	titleForViewer: string,
	isDefaultTitle: boolean
}

export interface RawCreator {
	type: string
	id: number
	name?: string
}

export interface PlaceUploadResponse {
	versionNumber: number
}

export interface RequestLoggingFilter extends Dictionary {
	/** The exact url(s) to match */
	urls?: string | string[]
	/** 
	 * Filters to request urls that start with these string(s).
	 * Does not need to contain "https://", but will still work regardless
	 * @example "badges." // filters to requests sent to the Roblox badges api 
	 */
	urlStartsWith?: string | string[]
	/**
	 * Filters to request urls that match these string(s) or regular expression(s).
	 * @example 
	 * /^[^\d]+$/ // filters to request urls without any numbers 
	 * "4560236409" // filters to request urls containing this placeId
	 */
	urlContains?: RegExp | string | (RegExp | string)[]
	/**
	 * Filters to request urls that end with these string(s).
	 * Does not need to contain "https://"
	 * @example "mark-as-read" // filters to requests with 
	 */
	urlEndsWith?: string | string[]
	/**
	 * Whether or not to remove URL parameters before checking the url
	 * 
	 * Default: `true`
	 * @example 
	 * // when disabled
	 * url = "https://games.roblox.com/v1/games?universeIds=12345"
	 * // when enabled
	 * url = "https://games.roblox.com/v1/games"
	 */
	removeParamsBeforeCheck?: boolean
	/**
	 * Whether or not to remove the protocol before checking the url
	 * 
	 * Default: `true`
	 * @example
	 * // when disabled
	 * url = "https://roblox.com"
	 * // when enabled
	 * url = "roblox.com"
	 */
	removeProtocolBeforeCheck?: boolean

	/** 
	 * How to handle URL filtering when a redirect has taken place
	 * @default "either" // Logs if either one of the URLs qualify
	 */
	redirectBehavior?: RedirectFilterBehavior
	/**
	 * How to handle multiple regular expressions or strings
	 * being passed to `filter.urlContains`
	 * @default "any" // qualifies if the url contains anything in filter.urlContains
	 */
	urlContainsBehavior?: FilterBehavior
	/**
	 * How to handle multiple strings being passed to `filter.urlEndsWith`
	 * @default "any" // qualifies if the url ends with anything in filter.urlEndsWith
	 */
	urlEndBehavior?: MutualFilterBehavior
	/**
	 * How to handle multiple strings being passed to `filter.urlStartsWith`
	 * @default "any" // qualifies if the url starts with anything in filter.urlStartsWith
	 */
	urlStartBehavior?: MutualFilterBehavior

	/**
	 * The exact status code(s) to log
	 * @example 200 // logs all successful HTTP requests with content
	 */
	statusCodes?: number | number[]
	/**
	 * The exact status code(s) to ignore 
	 * @example 429 // ignores all ratelimit responses
	 */
	ignoreStatusCodes?: number | number[]
	/**
	 * Logs all status codes equal to or above this one
	 * @example 500 // logs all server error responses (>=500)
	 */
	minStatusCode?: number
	/**
	 * Logs all status codes equal to or below this one
	 * @example 299 // logs all successful and informational responses
	 */
	maxStatusCode?: number

	/**
	 * Should failed requests be logged?
	 * @default "include" // Log these requests
	 */
	fails?: FilterInclusion
	/**
	 * Should with non-2XX status codes be logged?
	 * @default "include" // Log these requests
	 */
	errors?: FilterInclusion
	/**
	 * Should successful requests be logged?
	 * @default "include" // Log these requests
	 */
	successes?: FilterInclusion

	/**
	 * Excludes or includes redirects from logging
	 * @default "include" // Log these requests 
	 */
	redirects?: FilterInclusion
	/**
	 * Filters by request encryption (http/https)
	 * @default "any" // Always pass this filter 
	 */
	security?: SecurityType

	/**
	 * The HTTP method(s) to filter
	 * 
	 * See `methodFilterType` to change between allowList/ignoreList
	 */
	methods?: HTTPMethod | HTTPMethod[]
	/**
	 * How to handle the `methodFilter`
	 * 
	 * @default
	 * "ignoreList" // logs everything EXCEPT methods included in the filter
	 */
	methodFilterType?: FilterType

	/**
	 * The request types to filter
	 */
	requestTypes?: RequestType | RequestType[]
	/**
	 * The type of filter to use for `requestType`
	 * 
	 * @default
	 * "ignoreList" // log everything EXCEPT types listed in requestType
	 */
	requestTypeFilterMode?: FilterType

	/**
	 * Filters to raw response bodies that match these string(s) or regular expression(s).
	 * @example '"userId":113781265'
	 */
	responseContains?: RegExp | string | (RegExp | string)[]
	/**
	 * Defines the behavior of the `responseContains` filter
	 * 
	 * @default
	 * "any" // log if the response body matches any of the given strings or regex
	 */
	reponseContainsBehavior: FilterBehavior,
	/**
	 * Runs after most other filters. Process the parsed response body 
	 * and return a boolean indicating whether it should be logged.
	 * @example response => response.userId == 113781265
	 */
	responseFilter: (body: any) => boolean | Promise<boolean>
	
	/**
	 * Filters to raw request bodies that match these string(s) or regular expression(s).
	 * Not to be confused with `responseContains`, which checks the **response** body.
	 * @example '"userId":113781265'
	 */
	requestBodyContains?: RegExp | string | (RegExp | string)[]
	/**
	 * Defines the behavior of the `requestBodyContains` filter
	 * 
	 * @default
	 * "any" // log if the request body matches any of the given strings or regex
	 */
	requestBodyContainsBehavior: FilterBehavior,
	/**
	 * Runs after most other filters. Process the request's body
	 * and return a boolean indicating whether the request should be logged.
	 * Not to be confused with `responseFilter`, which checks the **response** body.
	 * @example body => body.price > 0
	 */
	requestBodyFilter?: (body: any) => boolean | Promise<boolean>

	/**
	 * Runs after most other filters. Process the request's params and response (if known)
	 * and return a boolean indicating whether the request should be logged.
	 * @example request => !request.isHttp() || request.errorMessages != 'Token validation failed'
	 */
	customFilter?: (request: BaseRequested, options: RequestLoggingFilter & Dictionary) => boolean | Promise<boolean>

	/**
	 * If `true`, skip all default filters and only use the specified customFilter
	 * 
	 * Default: `false`
	 */
	skipDefaultFilter?: boolean

	/**
	 * If `true`, these filter options will not be sanitized before being passed to the customFilter
	 * 
	 * Default: `false`
	 */
	noSanitize?: boolean
}

export interface FormatterOptions extends Dictionary {
	/**
	 * Whether or not to use console colors.
	 * If you log your errors outside of the console, you should probably disable this,
	 * as it would result in strange unicode characters being added to your output.
	 * @default true
	 */
	useConsoleColors?: boolean
	/**
	 * When converting the format to a string, what should the "space" argument be?
	 * 
	 * Only used if `asString` is enabled.
	 * 
	 * Default: `"\t"`
	 */
	stringifySpace?: string | number | null
	/**
	 * Whether or not to pad formatting with spaces to keep the layout consistent
	 * 
	 * Default: `true`
	 */
	usePadding?: boolean
	/**
	 * The information to include in the format
	 * 
	 * Default: url, method, status code, request body, response body, redirect
	 */
	include?: {
		/** 
		 * A summary at the start of the log containing
		 * the request's url, method, and status code
		 * 
		 * Example: `GET https://roblox.com/ 200`
		 * 
		 * Default: `true`
		 */
		summary?: boolean
		/** 
		 * The body sent with the outbound request, if any
		 * 
		 * Example: `{"userId":113781265}`
		 * 
		 * Default: `true`
		 */
		requestBody?: boolean
		/** 
		 * The body included with the response, if any
		 * 
		 * Example: `{"result":"Success"}`
		 * 
		 * Default: `true`
		 */
		responseBody?: boolean
		/** 
		 * The headers sent with the outbound request, if any
		 * 
		 * Default: `false`
		 */
		requestHeaders?: boolean
		/** 
		 * The headers included with the response, if any
		 * 
		 * Default: `false`
		 */
		responseHeaders?: boolean
		/** 
		 * Redirect information, if any
		 * 
		 * Default: `true`
		 */
		redirect?: boolean
		/**
		 * A stack trace pointing to where the request originated from
		 * 
		 * Default: `false`
		 */
		stackTrace?: boolean
	}
	/** 
	 * A dictionary of header names to ignore
	 * 
	 * Keeping "cookie", "x-api-key" and "set-cookie" set to true is recommended
	 * to prevent unwanted flooding of the console with massive tokens.
	 * 
	 * Defualt (ignore list): `cookie, set-cookie, x-api-key, report-to`
	 */
	headerFilter?: {
		'x-api-key'?: boolean
		'x-rblx-origin'?: boolean
		'roblox-machine-id'?: boolean
		'x-roblox-id'?: boolean
		'roblox-place-id'?: boolean
		'x-csrf-token'?: boolean
		'roblox-usn'?: boolean
		'report-to'?: boolean
		'x-frame-options'?: boolean
	} & IncomingHttpHeaders & {[name: string]: boolean}
	/**
	 * Whether to treat the headerFilter as an allowList or ignoreList
	 * 
	 * Default: `ignoreList`
	 */
	headerFilterType?: FilterType
	/**
	 * Whether to show HTML response bodies
	 */
	showHTML: boolean
	/**
	 * Changes the options passed to util.inspect when stringifying results
	 * 
	 * Default: [Default for console]
	 */
	inspectOptions?: InspectOptions
	/**
	 * Changes the console, writable stream, or file path to output to.
	 * 
	 * Obsolete if a `customLogger` function is defined.
	 * 
	 * Default: `process.stdout`
	 */
	customOutput?: Writable | Console
}

export interface RequestLoggingOptions {
	/**
	 * A comprehensive filter of requests
	 */
	filter?: RequestLoggingFilter
	/**
	 * When to log requests
	 * @default "afterResponse" // Log after a response is received
	 */
	mode?: RequestLoggingMode
	/**
	 * Whether to log requests right now
	 * @default false
	 */
	enabled: boolean
	/**
	 * Options for the formatter.
	 * 
	 * Unless you want to implement your own options, this is obsolete if you've defined your own `customLogger` function.
	 */
	loggerOptions?: FormatterOptions
	/**
	 * Formats and logs the request/response data 
	 * 
	 * See default logger function in /src/logger.js
	 */
	customLogger?: (request: BaseRequested, options: FormatterOptions) => void
}

export type WCValue = number | boolean

export interface WeakCaches {
	users?: { full?: WCValue } | WCValue,
	assets?: { partial?: WCValue, full?: WCValue } | WCValue,
	place?: { partial?: WCValue, fromFlagFilter?: WCValue, asset?: WCValue, full?: WCValue } | WCValue,
	gamepasses?: { partial?: WCValue, full?: WCValue } | WCValue,
	groups?: { full?: WCValue } | WCValue,
	outfits?: { partial?: WCValue, full?: WCValue } | WCValue,
	privateServers?: { partial?: WCValue, full?: WCValue, rich?: WCValue } | WCValue,
	bundles?: { partial?: WCValue, full?: WCValue } | WCValue,
	sponsorships?: { partial?: WCValue, full?: WCValue } | WCValue,
	fflags?: { full?: WCValue } | WCValue,
	servers?: { 
		partial?: WCValue, 
		full?: WCValue, 
		rich?: WCValue, 
		private?: WCValue 
	} | WCValue,
	universes?: { partial?: WCValue, full?: WCValue } | WCValue,
	chatMessages?: {
		partial?: WCValue,
		full?: WCValue,
		unknown?: WCValue,
		system?: WCValue,
		user?: WCValue,
		event?: WCValue,
		text?: WCValue,
		sent?: WCValue,
		link?: WCValue
	} | WCValue,
	conversations?: { 
		partial?: WCValue, 
		full?: WCValue,
		private?: WCValue,
		group?: WCValue,
		team?: WCValue
	} | WCValue
}

export interface ClientOptions {
	logger: RequestLoggingOptions
	weakCaches: WeakCaches
}

export interface ChatSettings {
	chatEnabled: boolean
	isActiveChatUser: boolean
	isConnectTabEnabled: boolean
}

export interface SendMessageOptions {
	content: string
	decorators?: string[]
}

export interface DataStoreVersionPageData {
	inlineVersion: boolean
	lastVersion: string
	CursorVersion: number
}

export interface DataStoreBulkQuery {
	name: string
	key: string
	scope?: string
}

export interface DataStoreBulkResponse {
	key: DataStoreBulkQuery
	value: any
}

export interface BinaryVersion {
	version: string
	folderName: string
	boostrapperVersion: string
	nextVersion?: string
	nextFolderName?: string
}

export interface PlaceSettingsPatch {
	name?: string
	description?: string
	maxPlayerCount?: number
	socialSlotType?: SocialSlotType
	customSocialSlotsCount?: number
	allowCopying?: boolean
}

export interface PlaceSettings {
	maxPlayerCount: number
	socialSlotType: SocialSlotType
	customSocialSlotsCount: number
	allowCopying: boolean
	currentSavedVersion: number
	id: number
	universeId: number
	name: string
	description: string
	isRootPlace: boolean
}

export interface UniverseSettingsV1 {
	id: number
	name: string
	universeAvatarType: UniverseAvatarType
	universeAnimationType: UniverseAnimationType
	universeCollisionType: CollisionType
	universeJointPositioningType: JointPositioningType
	/** @deprecated Exclusive to V1 */
	universeScaleType?: 'AllScales'
	/** @deprecated Exclusive to V1 */
	universeBodyType?: 'Standard'
	isArchived: boolean
	isFriendsOnly: boolean
	genre: string
	playableDevices: DeviceType[]
	isForSale: boolean
	price: number
}

export interface UniverseSettings extends UniverseSettingsV1 {
	allowPrivateServers: boolean
	privateServerPrice?: number
	optInRegions: any[]
	optOutRegions?: any[]
	description: string
	universeAvatarAssetOverrides: AvatarAssetOverride[]
	universeAvatarMinScales: AvatarScales
	universeAvatarMaxScales: AvatarScales
	studioAccessToApisAllowed: boolean
	permissions: {
		IsThirdPartyTeleportAllowed: boolean
		IsThirdPartyAssetAllowed: boolean
		IsThirdPartyPurchaseAllowed: boolean
	}
}

export interface AvatarAssetOverride {
	assetID: number
	assetTypeID: number
	isPlayerChoice: boolean
}