import { UserAPIManagerAuthenticated } from "./managers/APIManager.js"

export class Pin extends UserAPIManagerAuthenticated {
	locked = true

	constructor(data, client) {
		super(client)

		const untilNow = data.unlockedUntil

		this.enabled = data.isEnabled
		this.locked = data.isEnabled && !untilNow
		this.unlockedUntil = untilNow

		if (untilNow) {
			setTimeout(() => {
				if (this.unlockedUntil == untilNow) {
					this.locked = true
					delete this.unlockedUntil
				}
			}, untilNow * 1000)
		}
	}

	static async get(client) {
		const res = await client.request.auth('/v1/account/pin')
		return new Pin(res.json, client)
	}

	async update(method, pin) {
		const res = await this.client.request.auth('/v1/account/pin', {method, body: pin ? {pin} : undefined})
		return res.json
	}

	/**
	 * Adds a pin to this account.
	 */
	async create(pin) {
		await this.update('POST', pin)
		this.enabled = true
		this.locked = true
	}

	/**
	 * Changes the pin on this account. PIN must be unlocked.
	 */
	async change(pin) {
		await this.update('PATCH', pin)
		this.enabled = true
		this.locked = true
	}

	/**
	 * Deletes the pin from this account. PIN must be unlocked.
	 */
	async delete() {
		await this.update('DELETE')
		this.enabled = false
		this.locked = false
	}

	/**
	 * Locks the pin for this account. PIN must be unlocked.
	 */
	async lock() {
		await this.client.request.auth('/v1/account/pin/lock', {method: 'POST'})
		this.locked = true
		delete this.unlockedUntil
	}

	/**
	 * Unlocks the pin for this account.
	 */
	async unlock(pin) {
		await this.client.request.auth('/v1/account/pin/unlock', {method: 'POST', body: {pin}})
		this.locked = false
		const untilNow = this.unlockedUntil
		setTimeout(() => {
			if (this.unlockedUntil == untilNow) {
				this.locked = true
				delete this.unlockedUntil
			}
		}, untilNow * 1000)
	}
}