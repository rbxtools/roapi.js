import { Base } from "./Base.js";
import { spawn, execFile } from "child_process"
import { AssertionError } from "assert/strict";

const optionOverrides = {
	launchmode: { binargType: 'valueOnly', prefix: '--' },
	gameinfo: { binarg: { player: '-t', studio: '-ticket' } },
	launchtime: { binargType: 'equals' },
	placelauncherurl: { binarg: '-j' },
	browsertrackerid: { lurlarg: 'browserTrackerId', binarg: { studio: '-b', player: '-browserTrackerId' } },
	robloxlocale: { urlarg: 'robloxLocale', binarg: '--rloc' },
	gamelocale: { urlarg: 'gameLocale', binarg: '--gloc' },
	placeId: { lurlarg: true, urlarg: { player: null, studio: 'placeId' }, binarg: { player: null, studio: 'placeId'} },
	
	isPlayTogetherGame: { lurlarg: true, urlarg: null, binarg: null },
	serverId: { lurlarg: 'gameId', urlarg: null, binarg: null },
	linkCode: { lurlarg: true, urlarg: null, binarg: null },
	userIdToFollow: { lurlarg: 'userId', urlarg: null, binarg: null },
	universeId: { lurlarg: true, urlarg: null, binarg: null },
	requestType: { urlarg: null, binarg: null },
	accessCode: { lurlarg: true, urlarg: null, binarg: null },
	conversationId: { lurlarg: true, urlarg: null, binarg: null }
}
const protocols = {
	player: 'roblox-player://1',
	studio: 'roblox-studio://1',
	mobile: 'roblox-mobile://1'
}

export class LauncherURL {
	constructor(type, options = {}, extraBinaryArgs = []) {
		this.type = type
		this.extraBinaryArgs = extraBinaryArgs
		this.options = options
		if (type == 'custom') {
			this.protocol = typeof options == 'string' ? options : 'roblox-player://1'
			return
		}
		this.protocol = protocols[type]
		if (!this.protocol) {
			throw new AssertionError(`Unknown type "${type}". Valid types: ${Object.keys(protocols).join(', ')}, custom`)
		}
		if (type == 'player') {
			this.requestType = options.requestType ?? 'RequestGame'
			options.launchmode ??= 'play'
		} else if (type == 'studio') {
			options.launchmode ??= 'edit'
		}
	}
	get url() {
		let url = this.protocol ?? protocols[this.type]
		for (let [name, value] of Object.entries(this.options)) {
			let overrides = value?.overrides ?? optionOverrides[name]
			value &&= value?.value ?? value
			if (!overrides) {
				name = name.toLowerCase()
				overrides = optionOverrides[name] ?? {}
			}
			const uname = overrides.urlarg ? (overrides.urlarg[this.type] === undefined ? overrides.urlarg : overrides.urlarg[this.type]) : name
			if (uname) {
				url += `+${uname}:${value ? encodeURIComponent(value) : ''}`
			}
		}
		if (this.type == 'player' && !this.options.placelauncherurl) {
			url += `+placelauncherurl:${encodeURIComponent(this.placeLauncher)}`
		}
		return url
	}
	get binaryArgs() {
		const args = []
		for (let [name, value] of Object.entries(this.options)) {
			let overrides = value?.overrides ?? optionOverrides[name]
			value &&= value?.value ?? value
			if (!overrides) {
				name = name.toLowerCase()
				overrides = optionOverrides[name] ?? {}
			}
			
			if (overrides.binargType != 'valueOnly') {
				let bname = overrides.binarg ? (overrides.binarg[this.type] ?? overrides.binarg) : `-${name}`
				if (bname) {
					args.push(`${bname}${overrides.binargType == 'equals' ? '=' : ' '}${value?.replace(/&/g, '&amp;') ?? ''}`.trim())
				}
			} else {
				args.push(`${overrides.prefix ?? '-'}${value}`)
			}
		}
		if (this.type == 'player' && !this.options.placelauncherurl) {
			args.push(`-j ${encodeURIComponent(this.placeLauncher)}`)
		}
		args.push(...this.extraBinaryArgs)
		return args
	}
	get placeLauncher() {
		let url = `https://assetgame.roblox.com/game/PlaceLauncher.ashx?request=${this.requestType}`
		for (let [name, value] of Object.entries(this.options)) {
			const override = (value?.override || optionOverrides[name])?.lurlarg
			value &&= value?.value ?? value
			if (override) {
				url += `&${typeof override == 'string' ? override : name}=${decodeURIComponent(value)}`
			}
		}
		return url
	}
	/**
	 * @param {string} name 
	 * @param {any} value 
	 * @param {Object} overrides
	 */
	addOption(name, value, overrides = value?.overrides) {
		value &&= value?.value ?? value
		this.options[name] = overrides ? {value, overrides} : value
	}
	static getCommand(platform = process.platform) {
		switch (platform) {
			case 'win32':
				return 'explorer "${url}"'
			default:
				throw new Error(`We don't know how to open the game on your platform. If you believe this is a mistake, create an issue at https://github.com/roblox-js/roapi.js/issues`)
		}
	}
	getCommand(platform = process.platform) {
		return LauncherURL.getCommand(platform).replace(/\$\{url\}/g, this.url)
	}
	open(command = this.getCommand(), spawnOptions = {shell: true}) {
		command = command.replace(/\$\{url\}/g, this.url)
		spawnOptions.shell ??= true
		return spawn(command, spawnOptions)
	}
	openBinary(path, execOptions = undefined) {
		return execFile(path, this.binaryArgs, execOptions)
	}
}

export class Launcher extends Base {
	async getAuthTicket() {
		const res = await this.client.request.auth('/v1/authentication-ticket/', {method: 'POST'})
		return res.headers.get('rbx-authentication-ticket')
	}

	async getURL(type, options) {
		options.gameinfo ??= await this.getAuthTicket()
		options.launchtime ??= Date.now()
		return new LauncherURL(type, options)
	}

	followUser(user) {
		const userIdToFollow = this.client.users.resolveId(user)
		return this.getURL('player', {userIdToFollow, requestType: 'RequestFollowUser'})
	}

	editPlace(place, universe = place, auth = false) {
		const placeId = this.client.places.resolveId(place)
		const universeId = this.client.universes.resolveId(universe ?? place)
		const options = {
			launchmode: 'edit',
			task: 'EditPlace',
			placeId: placeId,
			universeId: universeId
		}
		return auth ? this.getURL('studio', options) : new LauncherURL('studio', options)
	}

	joinPlace(place, playTogether = false) {
		const placeId = this.client.places.resolveId(place)
		return this.getURL('player', {placeId, isPlayTogetherGame: playTogether})
	}

	joinGameInstance(server, place = server, playTogether = false) {
		const serverId = this.client.servers.resolveId(server)
		const placeId = this.client.places.resolveId(place)
		return this.getURL('player', {serverId, placeId, requestType: 'RequestGameJob', isPlayTogetherGame: playTogether})
	}

	async joinPrivateServer(server, place) {
		const accessCode = typeof server == 'string' ? server : await this.client.privateServers.fetch(server)
		const placeId = this.client.places.resolveId(place ?? server)
		return await this.getURL('player', {accessCode, placeId, requestType: 'RequestPrivateGame'})
	}

	joinPrivateServerFromLink(linkCode, place) {
		const placeId = this.client.places.resolveId(place)
		return this.getURL('player', {linkCode, placeId, requestType: 'RequestPrivateGame'})
	}

	joinPlayTogether(conversation, place) {
		const conversationId = this.client.chat.conversations.resolveId(conversation)
		const placeId = this.client.places.resolveId(place)
		return this.getURL('player', {conversationId, placeId, requestType: 'RequestPlayTogetherGame'})
	}
}