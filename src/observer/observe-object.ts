import {addDependency, notifyObjectSet, isUpdating} from './dependency'
import {observeTarget} from './observe'
import {addTargetAndProxy, getObservedOf} from './target-proxy'


export function observePlainObjectTarget(object: object) {
	let proxy = new Proxy(object, proxyHandler)
	addTargetAndProxy(object, proxy)

	return proxy
}


const proxyHandler = {

	get(object: any, prop: any): any {
		let value = object[prop]

		addDependency(object)

		if (value && typeof value === 'object') {
			let observed = getObservedOf(value)
			if (observed) {
				return observed
			}
			else if (isUpdating()) {
				return observeTarget(value)
			}
		}

		return value
	},

	set(obj: any, prop: any, value: any): true {

		// After some tests I found if doesn't compare,
		// sometimes much more updating loops will happen.
		if (obj[prop] !== value) {
			obj[prop] = value
			notifyObjectSet(obj)
		}

		return true
	},

	has(obj: any, prop: any): boolean {
		addDependency(obj)
		
		return prop in obj
	},

	deleteProperty(obj: any, prop: any): boolean {
		if (obj.hasOwnProperty(prop)) {
			addDependency(obj)

			return delete obj[prop]
		}
		else {
			return true
		}
	}
}
