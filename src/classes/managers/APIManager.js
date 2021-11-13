import { Base } from "../Base.js";

export class UserAPIManager extends Base {
	/** @type {number} */
	userId

	constructor(user, client) {
		super(client)
		/**
		 * The user this manager belongs to
		 * @name UserAPIManager#user
		 * @type {User}
		 * @readonly
		 */
		Object.defineProperty(this, 'userId', {value: this.client.users.resolveId(user)})
	}

	/** @type {import('../User').User} */
	get user() {
		return this.client.users.get(this.userId)
	}

	/** @returns {Promise<import('../User').User>} */
	fetchUser() {
		return this.client.users.fetch(this.userId)
	}
}

export class UserAPIManagerAuthenticated extends UserAPIManager {
	constructor(client) {
		/**
		 * The authenticated user this manager belongs to
		 * @name UserAPIManagerAuthenticated#user
		 * @type {AuthenticatedUser}
		 * @readonly
		 */
		super(client.user, client)
	}
}

export class GroupAPIManager extends Base {
	/** @type {number} */
	groupId
	
	constructor(group, client) {
		super(client)
		/**
		 * The group this manager belongs to
		 * @name GroupAPIManager#group
		 * @type {Group}
		 * @readonly
		 */
		Object.defineProperty(this, 'groupId', {value: this.client.groups.resolveId(group)})
	}

	/** @type {import('../Group').Group} */
	get group() {
		return this.client.universes.get(this.groupId)
	}

	/** @returns {Promise<import('../Group').Group>} */
	fetchGroup() {
		return this.client.universes.fetch(this.universeId)
	}
}

export class UniverseAPIManager extends Base {
	/** @type {number} */
	universeId
	
	constructor(universe, client) {
		super(client)
		/**
		 * The universe this manager belongs to
		 * @name UniverseAPIManager#universe
		 * @type {UniversePartial}
		 * @readonly
		 */
		Object.defineProperty(this, 'universeId', {value: this.client.universes.resolveId(universe)})
	}

	/** @type {import('../Universe').UniversePartial} */
	get universe() {
		return this.client.universes.get(this.universeId)
	}

	/** @returns {Promise<import('../Universe').Universe>} */
	fetchUniverse() {
		return this.client.universes.fetch(this.universeId)
	}
}

export class PlaceAPIManager extends Base {
	/** @type {number} */
	placeId

	constructor(place, client) {
		super(client)
		/**
		 * The place this manager belongs to
		 * @name UniverseAPIManager#universe
		 * @type {PlacePartial}
		 * @readonly
		 */
		Object.defineProperty(this, 'placeId', {value: this.client.places.resolveId(place)})
	}

	/** @type {import('../Place').PlacePartial} */
	get place() {
		return this.client.places.get(this.placeId)
	}

	/** @returns {Promise<import('../Place').Place>} */
	fetchPlace() {
		return this.client.places.fetch(this.placeId)
	}
}