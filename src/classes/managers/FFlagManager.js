import { Base } from "../Base.js";
import { Cache } from "../Cache.js";
import { FFlag } from "../FFlag.js";
import { MultiFetchableManager } from "./BaseManager.js";

export class FFlagManager extends Base {
	get windows() {
		Object.defineProperty(this, 'windows', {value: new FFlagChannel('PCDesktopClient', this.client) })
		return this.windows
	}
	get mac() {
		Object.defineProperty(this, 'mac', {value: new FFlagChannel('MacDesktopClient', this.client) })
		return this.mac
	}
	get windowsStudioBootstrapper() {
		Object.defineProperty(this, 'windowsStudioBootstrapper', {value: new FFlagChannel('PCStudioBootstrapper', this.client) })
		return this.windowsStudioBootstrapper
	}
	get macStudioBoostrapper() {
		Object.defineProperty(this, 'macStudioBoostrapper', {value: new FFlagChannel('MacStudioBootstrapper', this.client) })
		return this.macStudioBoostrapper
	}
	get windowsBootstrapper() {
		Object.defineProperty(this, 'windowsBootstrapper', {value: new FFlagChannel('PCClientBootstrapper', this.client) })
		return this.windowsBootstrapper
	}
	get macBootstrapper() {
		Object.defineProperty(this, 'macBootstrapper', {value: new FFlagChannel('MacClientBootstrapper', this.client) })
		return this.macBootstrapper
	}
	get xbox() {
		Object.defineProperty(this, 'xbox', {value: new FFlagChannel('XboxClient', this.client) })
		return this.xbox
	}
	get android() {
		Object.defineProperty(this, 'android', {value: new FFlagChannel('AndroidApp', this.client) })
		return this.android
	}
	get ios() {
		Object.defineProperty(this, 'ios', {value: new FFlagChannel('iOSApp', this.client) })
		return this.ios
	}
	get studio() {
		Object.defineProperty(this, 'studio', {value: new FFlagChannel('StudioApp', this.client) })
		return this.studio
	}
	async getUserChannel() {
		const res = await this.client.request.clientsettings('/v2/user-channel')
		return res.json.channelName
	}
	async getBinaryVersion(binaryType = 'WindowsPlayer', channelName = undefined) {
		let url = `/v2/client-version/${binaryType}`
		if (channelName) {
			url += `/channel/${channelName}`
		}
		const res = await this.client.request.clientsettings(url)
		return {
			version: res.json.version,
			folderName: res.json.clientVersionUpload,
			boostrapperVersion: res.json.bootstrapperVersion,

			nextVersion: res.json.nextClientVersion,
			nextFolderName: res.json.nextClientVersionUpload,
		}
	}
}

export class FFlagChannel extends MultiFetchableManager {
	/** @type {Cache<FFlag>} */
	cache = new Cache(FFlag, this.client)

	constructor(channel, client) {
		super(client)
		this.channel = channel
	}
	resolveId(id) {
		if (id instanceof FFlag) {
			return id.name
		} else {
			return id.toString()
		}
	}
	from(fullName, value) {
		if (value == undefined) {
			return this.cache.rawget(fullName)
		}
		return super.get(fullName, {id: fullName, value, channel: this.channel})
	}
	async fetch(fullFlagNames, doUpdate = true, light = !doUpdate) {
		const returnOnly = !Array.isArray(fullFlagNames) && this.resolveId(fullFlagNames)
		if (returnOnly) {
			fullFlagNames = [fullFlagNames]
		}
		const flags = new Map
		if (light) {
			for (let flag of fullFlagNames) {
				if (this.cache.has(flag)) {
					flags.set(flag, this.cache.rawget(flag))
				}
			}
			if (!doUpdate && flags.size == fullFlagNames.length) {
				return returnOnly ? flags.get(returnOnly) : flags
			}
			const rawFlags = await this.fetchAllRaw()
			for (let flag of fullFlagNames) {
				if (doUpdate || !flags.has(flag)) {
					flags.set(flag, this.from(flag, rawFlags[flag]))
				}
			}
		} else {
			const allFlags = await this.fetchAll()
			for (let flag of fullFlagNames) {
				flags.set(flag, allFlags.get(flag))
			}
		}
		return returnOnly ? flags.get(returnOnly) : flags
	}
	/**
	 * Returns all the FFlags in their raw string format, including prefix names.
	 * 
	 * @example 
	 * ```json
	 * {"FFlagFutureIsBrightPhase3":"True","DFIntStreamingMaxTargetPercentage":"0","DFFlagNewRejoinMessage_PlaceFilter":"True;1034242130;2528277338"}
	 * ```
	 */
	async fetchAllRaw() {
		const res = await this.client.request.clientsettingscdn(`/v1/settings/application?applicationName=${this.channel}`)
		return res.json.applicationSettings
	}
	async fetchAll() {
		const rawFlags = await this.fetchAllRaw()
		const flags = new Map
		for (let [name, value] of Object.entries(rawFlags)) {
			flags.set(name, this.get(name, value))
		}
		return flags
	}
}