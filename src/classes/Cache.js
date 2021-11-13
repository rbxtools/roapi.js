import { Base } from "./Base.js"

/** @type {{[key: string]: {category: string, type: string}}} */
const classes = {
	AssetPartial: 		{ category: 'assets',		type: 'partial'	},
	AvatarAssetPartial: { category: 'assets',		type: 'partial'	},
	Emote:				{ category: 'assets',		type: 'partial'	},
	Asset: 				{ category: 'assets',		type: 'full' 	},

	BundlePartial:		{ category: 'bundles', 		type: 'partial'	},
	Bundle:				{ category: 'bundles', 		type: 'full' 	},
	
	PlacePartial:		{ category: 'places', 		type: 'partial'	},
	PlaceAsset: 		{ category: 'places', 		type: 'asset' 	},
	Place: 				{ category: 'places', 		type: 'full' 	},
	
	GamepassPartial: 	{ category: 'gamepasses', 	type: 'partial'	},
	Gamepass: 			{ category: 'gamepasses',	type: 'full'	},

	Group:				{ category: 'groups',		type: 'full'	},

	OutfitPartial:		{ category: 'outfits',		type: 'partial'	},
	Outfit:				{ category: 'outfits',		type: 'full'	},

	UniversePartial: 	{ category: 'universes',	type: 'partial' },
	Universe:			{ category: 'universes',	type: 'full'	},

	SponsorshipPartial:	{ category: 'sponsorships',	type: 'partial'	},
	Sponsorship:		{ category: 'sponsorships',	type: 'full'	},

	User:				{ category: 'users',		type: 'full'	},

	MessagePartial:		{ category: 'chatMessages',	type: 'partial'	},
	Message:			{ category: 'chatMessages',	type: 'full'	},
	UnknownMessage:		{ category: 'chatMessages',	type: 'unknown'	},
	SystemMessage:		{ category: 'chatMessages',	type: 'system'	},
	UserMessage:		{ category: 'chatMessages',	type: 'user'	},
	EventMessage:		{ category: 'chatMessages',	type: 'event'	},
	TextMessage:		{ category: 'chatMessages',	type: 'text'	},
	SentMessage:		{ category: 'chatMessages',	type: 'sent'	},
	LinkMessage:		{ category: 'chatMessages',	type: 'link'	},

	ConversationPartial: 	{ category: 'conversations',	type: 'partial'	},
	Conversation:			{ category: 'conversations',	type: 'full'	},
	PrivateConversation:	{ category: 'conversations',	type: 'private'	},
	GroupConversation:		{ category: 'conversations',	type: 'group'	},
	TeamCreateConversation:	{ category:	'conversations',	type: 'team'	},

	PrivateServerPartial:	{ category: 'privateServers',	type: 'partial'	},
	PrivateServer: 			{ category: 'privateServers',	type: 'full'	},
	RichPrivateServer:		{ category: 'privateServers',	type: 'rich'	},

	PartialServerInstance:		{ category: 'servers',		type: 'partial'	},
	ServerInstance:				{ category: 'servers',		type: 'full'	},
	RichServerInstance:			{ category: 'servers',		type: 'rich'	},
	RichPrivateServerInstance:	{ category: 'servers',		type: 'private'	},
}

/**
 * @template Value
 */
export class Cache extends Base {
	static classMap = classes
	/** @type {Map<string|number, Value>} */
	values = new Map
	/** @type {WeakMap<Value, number>} */
	weakAfter = new WeakMap
	/** @type {WeakMap<Value, number>} */
	weakTime = new WeakMap
	/**
	 * @param {Function} createClass
	 * @param {Client} client The client to use for creating the class
	 * @param {Function[]} [classPriority] Ordered array of class types - the earlier the value, the lower the priority
	 * @param {boolean|number?} [globalWeak] Whether to store members as weak references, or the number of seconds to keep them
	 */
	constructor(createClass, client, classPriority = [createClass], globalWeak = undefined) {
		super(client)
		this.CreateClass = createClass
		this.classPriority = classPriority
		this.globalWeak = globalWeak

		setInterval(this.clearWeak, 60_000)
	}
	/**
	 * Gets a member of the cache **without** creating a new entry if it doesn't exist.
	 * @param {number|string} id The id of the member to get
	 * @param {boolean} [skipWeakAfter=false] Whether to skip updating the weakAfter map
	 * @returns {Value?} The member of the cache, or undefined if it doesn't exist
	 */
	rawget(id, skipWeakAfter = false) {
		if (id == null || !this.values.has(id)) {
			return undefined
		}
		let value = this.values.get(id)
		if (value instanceof WeakRef) {
			value = value.deref()
			if (value == null) {
				delete this[id]
			}
		} else if (!skipWeakAfter && this.weakTime.has(value)) {
			this.weakAfter.set(value, Date.now() + this.weakAfter.get(value))
		}
		return value
	}
	/**
	 * Gets a member of the cache, creating it if it does not exist.
	 * @param {number|string} id 
	 * @param {Object} [options]
	 * @param {Function} [overrideClass]
	 * @param {boolean | number} [weak]
	 * @returns {Value?} The new or existing member of the cache
	 */
	get(id, options = {id}, overrideClass = this.CreateClass, weak = this.globalWeak ?? this.weakClass(overrideClass)) {
		if (id == null) {
			return undefined
		}
		const value = this.rawget(id)
		if (value && !this.isPriority(overrideClass, value)) {
			if (value._patch) {
				value._patch(options)
			}

			const weakTime = weak !== true && (typeof weak == 'number' ? weak : this.weakTime.get(value))
			if (weakTime) {
				this.markWeak(id, weakTime)
			}

			return value
		}
		const newClass = new (overrideClass ?? this.CreateClass)(options, this.client)
		this.set(id, newClass, weak)

		return newClass
	}
	/**
	 * Returns true if the given member of the cache exists
	 * @param {number|string} id The id of the member to check
	 * @returns {boolean} True if the member exists
	 */
	has(id) {
		return this.values.has(id)
	}
	/**
	 * Removes a member of the cache and returns the value if it existed 
	 * @param {number|string} id The id of the member to remove
	 * @returns {Value?} The value, if it existed
	 */
	delete(id) {
		const value = this.values.get(id)
		if (value) {
			this.weakAfter.delete(value)
			this.weakTime.delete(value)
		}
		this.values.delete(id)
		return value
	}
	/** Clears all empty weak values in the cache and updates new scheduled weak values */
	clearWeak() {
		for (let [index, value] of this.values.entries()) {
			if (value instanceof WeakRef && !value.deref()) {
				delete this[index]
			} else if (this.weakAfter.has(value) && Date.now() > this.weakAfter.get(value)) {
				this.markWeak(index)
			}
		}
	}
	/** Clears all members of the cache */
	clear() {
		this.values.clear()
		this.weakTime = new WeakMap
		this.weakAfter = new WeakMap
	}
	/**
	 * Sets a member of the cache
	 * @param {string|number} key The key to set
	 * @param {Value} value The new value
	 * @param {boolean|number} weak Whether to store the value as a weak reference, or the time to mark it as one 
	 * @returns {Cache<Value>} This cache
	 */
	set(key, value, weak = this.globalWeak ?? this.weakClass(value)) {
		if (key == null) {
			throw new TypeError('key cannot be null')
		}
		if (weak === true) {
			this.values.set(key, value instanceof WeakRef ? value : new WeakRef(value))
			this.weakTime.delete(value)
			this.weakAfter.delete(value)
		} else {
			this.values.set(key, value instanceof WeakRef ? value.deref() : value);
			(typeof weak != 'number' && this.weakTime.has(value)) && (weak = this.weakTime.get(value))
			if (typeof weak == 'number') {
				this.weakTime.set(value, weak)
				this.weakAfter.set(value, Date.now() + (weak * 1000))
			}
		}
		return this
	}
	/**
	 * Returns true if class0 has a higher priority in this cache than class1
	 * @returns {boolean} Whether class0 has a higher priority
	 */
	isPriority(class0, class1 = this.CreateClass) {
		if (class0 && !class1) return true
		if (!class0) return false
		if (!(class0 instanceof Function)) {
			class0 = Object.getPrototypeOf(class0).constructor
		}
		if (!(class1 instanceof Function)) {
			class1 = Object.getPrototypeOf(class1).constructor
		}
		const priority0 = this.classPriority.indexOf(class0)
		const priority1 = this.classPriority.indexOf(class1)
		return priority0 > priority1
	}
	/**
	 * Sets a member of the cache if the given value has class priority over the current one
	 * @param {number|string} key The key to set
	 * @param {Value} value The new value
	 * @param {boolean|number?} [weak] Whether to mark the value as weak
	 * @returns {boolean} Whether the value was set
	 */
	setIfPriority(key, value, weak = this.globalWeak ?? this.weakClass(value)) {
		if (key == null) {
			throw new TypeError('key cannot be null')
		}
		if (this.isPriority(value, this.rawget(key))) {
			this.set(key, value, weak)
			return true
		}
		return false
	}
	/**
	 * Marks whether the value associated with the given key should be weak.
	 * @param {number|string} key The key to mark as weak
	 * @param {boolean|number} [weak=true] The time to mark the value as weak, or true to mark it as weak immediately
	 * @returns {Value?} The value associated with the key, if any
	 */
	markWeak(key, weak = true) {
		if (key == null) {
			throw new TypeError('key cannot be null')
		}
		const value = this.rawget(key)
		if (!value) {
			return undefined
		}
		this.set(key, value, weak)
		return value
	}
	/**
	 * Returns a boolean indicating if the given class should be weak as per the `client.weakCaches` settings
	 * @param {Object|Function} class0 The class to check
	 * @returns {boolean|number?} Whether the class should be weak, or the time to mark it as weak
	 */
	weakClass(class0) {
		if (!class0) return false
		if (this.globalWeak != undefined) return this.globalWeak
		if (!(class0 instanceof Function)) {
			class0 = Object.getPrototypeOf(class0).constructor
		}
		const classData = Cache.classMap[class0]
		if (!classData) return undefined
		return this.client.weakCaches[classData.category][classData.type]
	}
}