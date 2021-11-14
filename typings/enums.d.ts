export const enum Gender {
	/** The user has chosen not to share their gender, or their gender cannot be accurately represented by male or female. */
	Unset = 1,
	Male = 2,
	Female = 3,
	/** The API returned an unknown gender ID. Will be treated as Unset */
	Unknown = 1
}

export const enum Privacy {
	/** Nobody can view this */
	NoOne = 'NoOne',
	/** Only friends can view this */
	Friends = 'Friends',
	/** Only friends and people you follow can view this */
	FriendsAndFollowing = 'FriendsAndFollowing',
	/** Only friends, people you follow, and people who follow you can view this */
	FriendsFollowingAndFollowers = 'FriendsFollowingAndFollowers',
	/** Anyone can view this */
	AllUsers = 'AllUsers'
}

export const enum SortOrder {
	/** Ascending order */
	Asc = 'Asc', 
	/** Descending order */
	Desc = 'Desc'
}

export const enum SortOrderLong {
	Ascending = 'Ascending',
	Descending = 'Descending'
}

export const enum AssetType {
	/** The actual image asset for a decal, group emblem, etc. */
	Image = 1, 
	/** A 2D decal T-Shirt */
	TShirt = 2,
	/** Audio to be played in a game */
	Audio = 3, 
	Mesh = 4, /** The actual mesh for a MeshPart */
	Lua = 5, /** Lua code, such as ModuleScript. */
	Hat = 8,
	Place = 9,
	/** A toolbox model */
	Model = 10, 
	/** A 2D full-torso shirt */
	Shirt = 11, 
	/** 2D full-body pants */
	Pants = 12, 
	/** A toolbox decal - downloading will return an rbxm */
	Decal = 13, 
	/** An avatar's head */
	Head = 17, 
	/** The 2D face on an avatar */
	Face = 18, 
	/** An weapon or social item to be used in-game (legacy) */
	Gear = 19, 
	/** 
	 * A player badge to be awarded by experiences.
	 * @deprecated Badges have moved to an independent assetId system.
	 */
	Badge = 21, 
	/** A developer-created animation, not to be confused with official animations */
	Animation = 24, 
	/** A torso body part from a package */
	Torso = 27,
	/** A right arm body part from a package */
	RightArm = 28,
	/** A left arm body part from a package */
	LeftArm = 29,
	/** A left leg body part from a package */
	LeftLeg = 30,
	/** A right leg body part from a package */
	RightLeg = 31,
	/** A package, such as an official rthro costume or animation package */
	Package = 32,
	/** 
	 * A gamepass to be purchased in experiences.
	 * @deprecated Gamepasses have moved to an independent assetId system.
	 */
	GamePass = 34,
	/** A studio plugin */
	Plugin = 38,
	/** A MeshPart object, containing references to its mesh and texture */
	MeshPart = 40,
	HairAccessory = 41,
	/** An accessory welded to the face of a character, such as glasses. */
	FaceAccessory = 42,
	/** An accessory welded to the neck of a character, such as a necklace or bowtie. */
	NeckAccessory = 43,
	/** An accessory welded to the shoulders of a character. */
	ShoulderAccessory = 44,
	/** An accessory welded to the front of a character, such as a pin. */
	FrontAccessory = 45,
	/** An accessory welded to the back of a character, such as wings. */
	BackAccessory = 46,
	/** An accessory welded to the waist of a character, such as a belt. */
	WaistAccessory = 47,
	/** An official, purchasable animation used to modify the character's climbing animation. */
	ClimbAnimation = 48,
	/** 
	 * An official, purchasable animation used to modify the character's climbing animation. 
	 * @deprecated These are not used.
	 */
	DeathAnimation = 49,
	/** An official, purchasable animation used to modify the character's falling animation. */
	FallAnimation = 50,
	/** An official, purchasable animation used to modify the character's idle animation. */
	IdleAnimation = 51,
	/** An official, purchasable animation used to modify the character's jumping animation. */
	JumpAnimation = 52,
	/** An official, purchasable animation used to modify the character's running animation. */
	RunAnimation = 53,
	/** An official, purchasable animation used to modify the character's swimming animation. */
	SwimAnimation = 54,
	/** An official, purchasable animation used to modify the character's walking animation. */
	WalkAnimation = 55,
	/** An official, purchasable animation used to modify the character's pose in full-body thumbnails. */
	PoseAnimation = 56,
	/** An accessory welded to an ear of a character, such as earrings. (Layered clothing) */
	EarAccessory = 57,
	/** An accessory welded to an eye of a character, such as contacts. (Layered clothing) */
	EyeAccessory = 58,
	/** An official, purchasable animation that can be triggered in-game. */
	EmoteAnimation = 61,
	/** A toolbox video to be played in-game. */
	Video = 62,
	/** A 3D T-Shirt (Layered clothing) */
	TShirtAccessory = 64,
	/** A 3D shirt (Layered clothing) */
	ShirtAccessory = 65,
	/** 3D pants (Layered clothing) */
	PantsAccessory = 66,
	/** A 3D jacket (Layered clothing) */
	JacketAccessory = 67,
	/** A 3D sweater (Layered clothing) */
	SweaterAccessory = 68,
	/** 3D shorts (Layered clothing) */
	ShortsAccessory = 69,
	/** A 3D left shoe (Layered clothing) */
	LeftShoeAccessory = 70,
	/** A 3D right shoe (Layered clothing) */
	RightShoeAccessory = 71,
	/** A 3D dress skirt (Layered clothing) */
	DressSkirtAccessory = 72
}

export const enum BundleType {
	BodyParts = 1,
	AvatarAnimations = 2,
	Shoes = 3
}

export const enum AppStore {
	GooglePlay = 'GooglePlay',
	Amazon = 'Amazon',
	iOS = 'iOS',
	Xbox = 'Xbox'
}

export const enum PlaceFileType {
	RBXL = 'RBXL',
	RBXLX = 'RBXLX'
}

export const enum PlaceVersionType {
	Saved = 'Saved',
	Published = 'Published'
}

export const enum RequestLoggingMode {
	/** 
	 * Log immediately before the request is sent.
	 * 
	 * Response data will not be available.
	 */
	beforeSend = 'beforeSend',
	/** Log after a response is received */
	afterResponse = 'afterResponse',
	/** 
	 * Log only after a request is fully completed,
	 * silencing automatic re-requests for CSRF and ratelimits.
	 */
	afterComplete = 'afterComplete',
	/**
	 * Log both before the request is sent and after a response is recieved.
	 * 
	 * A custom logger and/or formatter is recommended for this option.
	 */
	both = 'both'
}

export const enum RedirectFilterBehavior {
	/** Only checks the initial URL */
	initialOnly = 'initialOnly',
	/** Only checks the final URL */
	finalOnly = 'finalOnly',
	/** Logs if either one of the URLs qualify */
	either = 'either',
	/** Logs if both of the URLs qualify */
	both = 'both'
}

export const enum MutualFilterBehavior {
	/** Logs if the request qualifies for all of the relevant options */
	none = 'none',
	/** Logs if the request qualifies for any of the relevant options */
	any = 'any'
}

export const enum FilterBehavior {
	/** Logs if the request qualifies for all of the relevant options */
	none = 'none',
	/** Logs if the request qualifies for at least one of the relevant options */
	any = 'any',
	/** Logs if the request qualifies for all of the relevant options */
	all = 'all'
}

export const enum FilterInclusion {
	/** Log these requests */
	include = 'include',
	/** Don't log these requests */
	exclude = 'exclude',
	/** Only log these requests */
	only = 'only'
}

export const enum SecurityType {
	/** Only logs if the request is secure */
	https = 'https',
	/** Only logs if the request is insecure */
	http = 'http',
	/** Always pass this filter */
	any = 'any'
}

export const enum FilterType {
	/** ONLY items listed in the filter will be used */
	allowList = 'allowList',
	/** Everything EXCEPT the items listed in the filter will be used */
	ignoreList = 'ignoreList'
}

export const enum HTTPMethod {
	GET = 'GET',
	HEAD = 'HEAD',
	POST = 'POST',
	PUT = 'PUT',
	DELETE = 'DELETE',
	PATCH = 'PATCH',
	CONNECT = 'CONNECT',
	OPTIONS = 'OPTIONS',
	TRACE = 'TRACE'
}

export const enum RequestType {
	download = 'download',
	http = 'http',
	socket = 'socket'
}

export const enum ConsoleColor {
	reset = "\x1b[0m",
	bold = "\x1b[1m",
	dim = "\x1b[2m",
	underline = "\x1b[4m",
	blink = "\x1b[5m",
	invert = "\x1b[7m",
	hidden = "\x1b[8m",

	black = "\x1b[30m",
	red = "\x1b[31m",
	green = "\x1b[32m",
	yellow = "\x1b[33m",
	blue = "\x1b[34m",
	magenta = "\x1b[35m",
	cyan = "\x1b[36m",
	white = "\x1b[37m",

	blackBg = "\x1b[40m",
	redBg = "\x1b[41m",
	greenBg = "\x1b[42m",
	yellowBg = "\x1b[43m",
	blueBg = "\x1b[44m",
	magentaBg = "\x1b[45m",
	cyanBg = "\x1b[46m",
	whiteBg = "\x1b[47m"
}

export const enum ConversationType {
	/** A private chat between the authenticated user and another user */
	OneToOneCoversation = 'OneToOneCoversation',
	/** A group chat */
	MultiUserConversation = 'MultiUserConversation',
	/** The chat for a team create session */
	CloudEditConversation = 'CloudEditConversation'
}

export const enum MessageAuthorType {
	/** The message was sent by a user */
	User = 'User',
	/** The message was sent by the system */
	System = 'System'
}

export const enum MessageType {
	PlainText = 'PlainText',
	Link = 'Link',
}

export const enum MessageEventType {
	SetConversationUniverse = 'SetConversationUniverse',
}

export const enum MessageLinkType {
	Game = 'Game',
}

export const enum CreatorType {
	user = 'user',
	group = 'group'
}

export const enum SponsorTargetGender {
	Male = 'Male',
	Female = 'Female',
	Any = 'Any'
}

export const enum SponsorAgeBracket {
	'AgeUnder13' = 'AgeUnder13',
	'Age13OrOver' = 'Age13OrOver',
	Any = 'Any'
}

export const enum DeviceType {
	Computer = 'Computer',
	Phone = 'Phone',
	Tablet = 'Tablet',
	Console = 'Console',
	Any = 'Any'
}

export const enum SponsorStatus {
	Running = 'Running',
	Completed = 'Completed'
}

export const enum FFlagFilterType {
	places = 'places',
	dataCenters = 'dataCenters',
	unknown = 'unknown',
	none = 'none'
}

export const enum BinaryType {
	WindowsPlayer = 'WindowsPlayer', 
	WindowsStudio = 'WindowsStudio', 
	MacPlayer = 'MacPlayer',
	MacStudio = 'MacStudio'
}

export const enum FFlagChannel {
	PCDesktopClient = 'PCDesktopClient',
	MacDesktopClient = 'MacDesktopClient',
	PCStudioBootstrapper = 'PCStudioBootstrapper',
	MacStudioBootstrapper = 'MacStudioBootstrapper',
	PCClientBootstrapper = 'PCClientBootstrapper',
	MacClientBootstrapper = 'MacClientBootstrapper',
	XboxClient = 'XboxClient',
	AndroidApp = 'AndroidApp',
	iOSApp = 'iOSApp',
	StudioApp = 'StudioApp',
}

export const enum FFlagPrefix {
	FFlag = 'FFlag',
	DFFlag = 'DFFlag',
	FString = 'FString',
	DFString = 'DFString',
	FInt = 'FInt',
	DFInt = 'DFInt',
	FLog = 'FLog',
	DFLog = 'DFLog',
}

export const enum FFlagShortPrefix {
	Flag = 'Flag',
	String = 'String',
	Int = 'Int',
	Log = 'Log',
}

export const enum FFlagValueType {
	bool = 'bool',
	string = 'string',
	int = 'int',
}