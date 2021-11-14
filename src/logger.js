import { Console } from 'console';
import { inspect } from 'util';

export const consoleColors = {
	reset: "\x1b[0m",
	bold: "\x1b[1m",
	dim: "\x1b[2m",
	underline: "\x1b[4m",
	blink: "\x1b[5m",
	invert: "\x1b[7m",
	hidden: "\x1b[8m",

	black: "\x1b[30m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	magenta: "\x1b[35m",
	cyan: "\x1b[36m",
	white: "\x1b[37m",

	blackBg: "\x1b[40m",
	redBg: "\x1b[41m",
	greenBg: "\x1b[42m",
	yellowBg: "\x1b[43m",
	blueBg: "\x1b[44m",
	magentaBg: "\x1b[45m",
	cyanBg: "\x1b[46m",
	whiteBg: "\x1b[47m"
}

const defaultInclude = {
	summary: true,
	requestBody: true,
	responseBody: true,
	requestHeaders: false,
	responseHeaders: false,
	redirect: true,
	stackTrace: false
}

const defaultHeaderFilter = {
	'x-api-key': true,
	cookie: true,
	'set-cookie': true,
	'report-to': true
}

const fakeColors = Object.keys(consoleColors).reduce((obj, key) => {obj[key] = ''; return obj}, {})

const methodColors = {
	GET: 'green',
	HEAD: 'dim',
	POST: 'cyan',
	PUT: 'blue',
	DELETE: 'red',
	PATCH: 'yellow',
	CONNECT: 'dim',
	OPTIONS: 'dim',
	TRACE: 'dim'
}

const defaultInspect = {
	depth: Infinity,
	colors: true,
}

const defaultConsole = new Console({stdout: process.stdout, inspectOptions: defaultInspect, groupIndentation: 4})

function getStatusColors(status, errorMessages) {
	if (status == -1) {
		return ['red', 'bold']
	} else if (status <= 199) {
		return 'dim'
	} else if (status <= 299) {
		return 'green'
	} else if (status <= 399) {
		return 'cyan'
	} else if ((status == 403 && errorMessages == 'Token Validation Failed') || status == 429) {
		return ['yellow', 'bold']
	} else if (status == 400 || status == 404 || status == 405 || status == 411 || status == 413 || status == 414) {
		return ['red', 'invert', 'bold']
	} else if (status <= 599) {
		return ['red', 'bold']
	} else {
		return ['magenta', 'bold']
	}
}

/**
 * @param {import('./classes/Response').BaseRequested} request 
 */
export function logger(request, {useConsoleColors = true, include: optInclude = {}, usePadding = true, headerFilter: optHeaderFilter = {}, headerFilterType = 'ignoreList', showHTML = false, customOutput: output = defaultConsole, inspectOptions = defaultInspect} = {}) {
	
	if ((inspectOptions != defaultInspect || !useConsoleColors) && !(output instanceof Console && output != defaultConsole)) {
		if (output == defaultConsole) {
			output = process.stdout
		}
		inspectOptions.colors = !useConsoleColors ? false : inspectOptions.colors ?? true
		output = new Console({stdout: output, stderr: output, inspectOptions, groupIndentation: usePadding ? 4 : 0})
	}

	/** @type {consoleColors} */
	const colors = useConsoleColors == false ? fakeColors : consoleColors

	function col(colorNames) {
		if (!Array.isArray(colorNames)) {
			colorNames = [colorNames]
		}
		return colorNames.map(name => colors[name]).join('')
	}
	
	/** @type {defaultInclude} */
	const include = {...defaultInclude, ...optInclude}

	const log = output[(!request.isResponse() || request.ok || request.status == 429 || request.errorMessages == 'Token Validation Failed') ? 'log' : 'warn']

	output.groupCollapsed()
	if (include.summary) {
		const summary = []
		summary.push(
			colors[methodColors[request.method ?? 'GET'] ?? 'reset'] +
			request.method.padEnd(6) +
			colors.reset + 
			request.url.padEnd(usePadding && request.isResponse() ? 25 : 0) +
			(usePadding ? ' ' : '')
		)
		if (request.isResponse()) {
			summary.push(
				col(getStatusColors(request.status, request.errorMessages)) +
				`${request.status} ${request.statusText}` +
				colors.reset
			)
		}
		log(...summary)
	}

	const headerFilter = {...defaultHeaderFilter, ...optHeaderFilter}

	const filteredRequestHeaders = {}
	for (let [key, value] of request.requestHeaders.entries()) {
		const filtered = headerFilter[key]
		if ((headerFilterType == 'ignoreList' && !filtered) || (headerFilterType == 'allowList' && filtered)) {
			filteredRequestHeaders[key] = value
		}
	}
	const requestHeaderEntries = Object.entries(filteredRequestHeaders)

	if ((include.requestBody && request.requestBody) || (include.requestHeaders && requestHeaderEntries.length > 0)) {
		output.groupCollapsed()
		log(
			colors.bold +
			colors.underline +
			'REQUEST'.padEnd(usePadding ? 25 : 0) +
			(usePadding ? '_' : '') +
			colors.reset + ' '
		)
		if (include.requestHeaders && requestHeaderEntries.length > 0) {
			for (let [name, value] of requestHeaderEntries) {
				log(
					((name.startsWith('x-') || name.match(/ro?bl?o?x/i)) ? colors.yellow + colors.bold : colors.green) +
					name + 
					colors.reset +
					' =',
					value
				)
			}
		}
		if (include.requestBody && request.requestBody) {
			log(
				(include.requestHeaders ? '\n' : '') +
				'Body:\n',
				Buffer.isBuffer(request.requestBody) 
					? `${colors.magenta}<${Math.round(request.requestBody.length / 100) / 10} KB Buffer>${colors.reset}` 
					: request.requestBody
			)
		}
		output.groupEnd()
	}

	if (request.isResponse()) {
		const filteredResponseHeaders = {}
		for (let [key, value] of request.headers.entries()) {
			const filtered = headerFilter[key]
			if ((headerFilterType == 'ignoreList' && !filtered) || (headerFilterType == 'allowList' && filtered)) {
				filteredResponseHeaders[key] = value
			}
		}
		const responseHeaderEntries = Object.entries(filteredResponseHeaders)
	
		console.log(request.body, responseHeaderEntries.length)
		if ((include.responseBody && request.body) || (include.responseHeaders && responseHeaderEntries.length > 0)) {
			output.groupCollapsed()
			log(
				colors.bold +
				colors.underline +
				'RESPONSE'.padEnd(usePadding ? 25 : 0) +
				(usePadding ? '_' : '') +
				colors.reset + ' '
			)
			if (include.responseHeaders && responseHeaderEntries.length > 0) {
				for (let [name, value] of responseHeaderEntries) {
					log(
						((name.startsWith('x-') || name.match(/ro?bl?o?x/i)) ? colors.yellow + colors.bold : colors.green) +
						name + 
						colors.reset +
						' =',
						value
					)
				}
				log('')
			}
			if (include.responseBody && request.body) {
				const contentType = request.headers.get('content-type')
				const contentSize = Math.round(+request.headers.get('content-length') / 100) / 10
				let responseBody = request.json
				if (!showHTML && contentType == 'text/html') {
					responseBody = colors.magenta + `<${contentSize} KB HTML page>` + colors.reset
				// } else if (contentType == 'application/octet-stream') {
				// 	responseBody = colors.magenta + `<${contentSize} KB binary file>` + colors.reset
				} else if (contentType.startsWith('image/')) {
					responseBody = colors.magenta + `<${contentSize} KB image>` + colors.reset
				} else if (contentType.startsWith('video/')) {
					responseBody = colors.magenta + `<${contentSize} KB video>` + colors.reset
				} else if (contentType.startsWith('audio/')) {
					responseBody = colors.magenta + `<${contentSize} KB audio>` + colors.reset
				} else if (request.isDownload()) {
					responseBody = colors.magenta + `<${contentSize} KB response>` + colors.reset
				}
				log(
					'Body:\n',
					responseBody
				)
			}
			output.groupEnd()
		}

		if (include.redirect && request.redirectedTo) {
			log(
				colors.cyan +
				colors.invert +
				colors.bold +
				'REDIRECTED TO:' +
				colors.reset +
				' ' +
				colors.underline +
				colors.bold +
				colors.cyan +
				request.redirectedTo +
				colors.reset
			)
		}

		if (include.stackTrace) {
			const stackTrace = inspect(new Error, inspectOptions).split('\n')
			output.groupCollapsed()
			log(
				colors.bold + colors.underline + 'STACK TRACE'.padEnd(25) + '_' + colors.reset + ' \n' +
				stackTrace.splice(4).join('\n')
			)
			output.groupEnd()
		}
	}
	log()
	output.groupEnd()
}

const defaultFilter = {
	/** @type {string[]} */
	urls: [],
	urlStartsWith: [''],
	urlContains: [''],
	urlEndsWith: [''],
	removeParamsBeforeCheck: true,
	removeProtocolBeforeCheck: true,

	redirectBehavior: 'either',
	urlContainsBehavior: 'any',
	urlEndBehavior: 'any',
	urlStartBehavior: 'any',

	/** @type {number[]} */
	statusCodes: [],
	/** @type {number[]} */
	ignoreStatusCodes: [],
	/** @type {number?} */
	minStatusCode: undefined,
	/** @type {number?} */
	maxStatusCode: undefined,

	fails: 'include',
	errors: 'include',
	successes: 'include',

	redirects: 'include',
	security: 'any',

	/** @type {string[]} */
	methods: [],
	methodFilterType: 'ignoreList',

	/** @type {string[]} */
	requestTypes: [],
	requestTypeFilterMode: 'ignoreList',

	/** @type {(string|RegExp)[]} */
	responseContains: [],
	responseContainsBehavior: 'any',
	responseFilter: () => true,

	/** @type {(string|RegExp)[]} */
	requestBodyContains: [],
	requestBodyContainsBehavior: 'any',
	requestBodyFilter: () => true,

	customFilter: () => true,
	skipDefaultFilter: false,
	noSanitize: false
}

/**
 * @param {import('./classes/Response').BaseRequested} request
 * @param {defaultFilter} options
 */
export async function filter(request, options = {}) {
	/** @type {defaultFilter} */
	const userOptions = {...defaultFilter, ...options}
	if (!options.skipDefaultFilter || !options.noSanitize) {
		for (let [key, defaultValue] of Object.entries(defaultFilter)) {
			const userValue = options[key]
			if (defaultValue == null) {
				continue
			} else if (userValue == null) {
				options[key] = defaultValue
			} else if (Array.isArray(defaultValue) && !Array.isArray(userValue)) {
				options[key] = [userValue]
			}
		}
	}
	
	if (!options.skipDefaultFilter) {
		/** @type {string} */
		let url = options.removeParamsBeforeCheck ? request.url.replace(/\?[^?]+$/, '') : request.url
		url = options.removeProtocolBeforeCheck ? url.replace(/^[\w\d-]+:\/\//, '') : url

		const urlOptions = options.removeParamsBeforeCheck ? options.urls.map(url => url.replace(/\?[^?]+$/, '')) : options.url
		if (urlOptions > 0 && !urlOptions.includes(url)) {
			return false
		}

		let expected = options.urlStartsWith.length > 0 ? options.urlStartBehavior == 'any' : false
		if (options.urlStartsWith.some(begin => url.startsWith(begin)) != expected) {
			return false
		}

		expected = options.urlEndsWith.length > 0 ? options.urlEndBehavior == 'any' : false
		if (options.urlEndsWith.some(ending => url.endsWith(ending)) != expected) {
			return false
		}

		expected = options.urlContains.length > 0 ? options.urlContainsBehavior != 'none' : false
		let arrayfunc = options.urlContainsBehavior == 'all' ? 'every' : 'some'
		if (options.urlContains[arrayfunc](pattern => url[typeof pattern == 'string' ? 'includes' : 'match'](pattern)) != expected) {
			return false
		}

		if (request.isResponse()) {
			if (options.statusCodes.length > 0 && request.isResponse() && !options.statusCodes.includes(request.status)) {
				return false
			}
	
			if (options.ignoreStatusCodes.length > 0 && request.isResponse() && !options.ignoreStatusCodes.includes(request.status)) {
				return false
			}
	
			if (options.minStatusCode != null && request.status < options.minStatusCode) {
				return false
			}
	
			if (options.maxStatusCode != null && request.status > options.maxStatusCode) {
				return false
			}

			if (options.fails != 'include' && !!request.fetchError == (options.fails == 'exclude')) {
				return false
			}

			if (options.errors != 'include' && (request.fetchResult && request.ok) == (options.errors == 'exclude')) {
				return false
			}

			if (options.successes != 'include' && request.ok == (options.successes == 'exclude')) {
				return false
			}

			if (options.redirects != 'include' && !!request.redirectedTo == options.redirects == 'exclude') {
				return false
			}

			if (options.security != 'any' && request.url.startsWith('https') == (options.security == 'http')) {
				return false
			}
		}

		expected = options.methods > 0 ? options.methodFilterType == 'allowList' : false
		if (options.methods.includes(request.method) != expected) {
			return false
		}

		expected = options.requestTypes > 0 ? options.requestTypeFilterMode == 'allowList' : false
		if (options.requestTypes.includes(request.requestType) != expected) {
			return false
		}

		if (request.isHttp()) {
			expected = options.responseContains.length > 0 ? options.responseContainsBehavior != 'none' : false
			arrayfunc = options.responseContainsBehavior == 'all' ? 'every' : 'some'
			if (options.responseContains[arrayfunc](pattern => request.body[typeof pattern == 'string' ? 'includes' : 'match'](pattern)) != expected) {
				return false
			}

			if (!await options.responseFilter(request.json)) {
				return false
			}
		}

		expected = options.requestBodyContains.length > 0 ? options.requestBodyContainsBehavior != 'none' : false
		arrayfunc = options.requestBodyContainsBehavior == 'all' ? 'every' : 'some'
		if (options.requestBodyContains[arrayfunc](pattern => request.requestBody[typeof pattern == 'string' ? 'includes' : 'match'](pattern)) != expected) {
			return false
		}

		if (!await options.requestBodyFilter(request.requestBody)) {
			return false
		}
	}

	return await options.customFilter(request, options.noSanitize ? userOptions : options)
}