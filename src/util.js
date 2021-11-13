export function resolvableId(resolvable) {
	return typeof(resolvable) == 'number' ? resolvable : resolvable.id
}

/**
 * Converts all members of an object from PascalCase to camelCase
 * @param {Dictionary}
 * @returns {Dictionary}
 */
export function camelCase(obj) {
	if (typeof obj != 'object' || !obj) return obj
	return Object.entries(obj)
		.map(([key,value]) => [key[0]?.toLowerCase() + key.substr(1), ((obj ? Object.getPrototypeOf(obj) : undefined) == Object.prototype) ? camelCase(value) : value])
		.reduce((newObject, [key, value]) => {newObject[key] = value; return newObject}, {})
}

export function pascalCase(obj) {
	if (typeof obj != 'object' || !obj) return obj
	return Object.entries(obj)
		.map(([key,value]) => [key[0]?.toUpperCase() + key.substr(1), ((obj ? Object.getPrototypeOf(obj) : undefined) == Object.prototype) ? pascalCase(value) : value])
		.reduce((newObject, [key, value]) => {newObject[key] = value; return newObject}, {})
}