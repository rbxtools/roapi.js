import {User} from './User.js'
import {Pin} from './Pin.js'
import {PrivacySettings} from './PrivacySettings.js'
import { AuthenticatedAvatar } from './Avatar.js'

export class AuthenticatedUser extends User {
	constructor(data, client) {
		super(data, client)
		this.pin = data.pin
		this.privacySettings = new PrivacySettings(client)
		this.avatar = new AuthenticatedAvatar(this, client)
	}

	/** @param {Client} client */
	static async get(client) {
		const data = (await client.request.users('/v1/users/authenticated')).json
		data.pin ??= await Pin.get(client)
		return new this(data, client)
	}

	/**
	 * Gets the authenticated user's birthdate as a Date object
	 */
	async getBirthdate() {
		const res = await this.client.request.account(`/v1/birthdate`)
		return new Date(res.json.birthYear, res.json.birthMonth, res.json.birthDay)
	}

	/**
	 * Updates the authenticated user's birthdate. PIN must be unlocked.
	 */
	async setBirthdate(date, password) {
		const body = {
			birthMonth: date.getUTCMonth(),
			birthDay: date.getUTCDay(),
			birthYear: date.getUTCFullYear(),
			password: password
		}
		await this.client.request.account(`/v1/birthdate`, {method: 'POST', body})
	}

	/**
	 * Updates the authenticated user's description (aka About Me). PIN must be unlocked.
	 */
	async setDescription(description) {
		const res = await this.client.request.account(`/v1/description`, {method: 'POST', body: {description}})
		return res.json.description
	}

	/**
	 * Gets the authenticated user's gender.
	 */
	async getGender() {
		const res = await this.client.request.account(`/v1/gender`)
		return this.getGenderName(res.json.gender)
	}

	/**
	 * Updates the authenticated user's gender. PIN must be unlocked.
	 */
	async setGender(gender) {
		gender = typeof(gender) != 'number' ? await this.getGenderId(gender) : gender
		await this.client.request.account(`/v1/gender`, {method: 'POST', body: {gender}})
	}

	/**
	 * Returns number of consecutive login days for xbox users
	 */
	async getConsecutiveLoginDays() {
		const res = await this.client.request.account(`/v1/xbox-live/consecutive-login-days`)
		return res.json.count
	}

	/**
	 * Gets the (censored) verified phone number for the authenticated user
	 */
	async getPhone() {
		const res = await this.client.request.account(`/v1/phone`)
		return res.json
	}

	/**
	 * Gets the authenticated user's social networks as shown on their profile, plus their visibility setting.
	 */
	async getSocialNetworks() {
		const res = await this.client.request.account(`/v1/promotion-channels`)
		const networks = res.json
		networks.privacy = networks.promotionChannelsVisibilityPrivacy
		delete networks.promotionChannelsVisibilityPrivacy
		return networks
	}

	/**
	 * Updates the authenticated user's social networks to be shown on their profile.
	 */
	async setSocialNetworks(networks) {
		networks = {promotionChannelsVisibilityPrivacy: networks.privacy, ...networks}
		delete networks.privacy
		await this.client.request.account(`/v1/promotion-channels`, {method: 'POST', body: networks})
	}

	/**
	 * Gets the authenticated user's (censored) email address and its status
	 */
	async getEmail() {
		const res = await this.client.request.account(`/v1/email`)
		return res.json
	}

	/**
	 * Gets the authenticated user's current theme
	 */
	async getTheme() {
		const res = await this.client.request.settings(`/v1/themes/User/`)
		return res.json.themeType
	}
	/**
	 * Gets the authenticated user's current theme. PIN must be unlocked.
	 */
	async setTheme(theme) {
		await this.client.request.settings(`/v1/themes/User`, {method: 'POST', body: {themeType: theme}})
	}

	/** 
	 * Gets the authenticated user's robux balance
	 */
	async getRobux() {
		const res = await this.client.request.general(`/currency/balance`)
		return res.json.robux
	}

	/**
	 * Attempts to change the authenticated user's username. PIN must be unlocked.
	 */
	async changeUsername(username, password) {
		await this.client.request.auth(`/v2/username`, {method: 'POST', body: {username, password}})
	}
}