export class Base {
	/** @type {import('./Client').Client} */
	client
	
	constructor(client) {
		/**
		 * The client that instantiated this object
		 * @name Base#client
		 * @type {Client}
		 * @readonly
		 */
		Object.defineProperty(this, 'client', {value: client})
	}
}