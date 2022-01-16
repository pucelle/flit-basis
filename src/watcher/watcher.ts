import {startUpdating, endUpdating, clearDependenciesOf} from '../observer'
import {enqueueUpdatableInOrder} from '../queue'
import {QueueUpdateOrder} from '../queue/helpers/ordered-queue'
import {MayContext} from '../types'


/** 
 * A watcher watchs the returned value of a function,
 * and triggers callback if this value is changed.
 * You need to know that when callback was called,
 * it doesn't ensure the watching data is truly changed,
 * especially when the returned value is object type.
 * So you may need validate it again if needed.
 * You can create a Watcher from `context.watch...` or `globalWatcherGroup.watch...`.
 */
export class Watcher<T = any> {

	/** Watch function. */
	protected readonly fn: () => T

	/** Callback to call after data may be changed. */
	protected readonly callback: (newValue: T, oldValue: T | undefined) => void

	/** To determine update order. */
	protected readonly type: MayContext

	/** Whether the watcher connected. */
	protected connected: boolean = true

	/** Last value returned from `fn`. */
	value: T

	constructor(fn: () => T, callback: (newValue: T, oldValue: T | undefined) => void, type: MayContext) {
		this.fn = fn
		this.callback = callback
		this.type = type
		this.value = this.getNewValue()
	}

	/** Get a new returned value from `fn`. */
	protected getNewValue(): T {
		startUpdating(this)
		let newValue = this.fn.call(null)
		endUpdating(this)

		return newValue
	}

	/** When detected dependencies was changed, enqueue the watch to update it later. */
	update() {
		if (!this.connected) {
			return
		}
		
		enqueueUpdatableInOrder(this, this.type, QueueUpdateOrder.Watcher)
	}

	/** Update current value immediately. keeps consitant with the same method in `Component`. */
	__updateImmediately() {
		
		// No need to update after disconnected, or the watcher will be observed and do meaningless updating.

		if (!this.connected) {
			return
		}

		let newValue = this.getNewValue()

		// Data may change, doesn't validate object sub properties.
		if (newValue !== this.value || typeof newValue === 'object') {
			let oldValue = this.value
			this.callback.call(null, this.value = newValue, oldValue)
		}
	}

	/** Gives a unique function string about the watcher. */
	toString() {
		return this.fn.toString()
	}

	/** Connect and update to collect new dependencies. */
	connect() {
		if (!this.connected) {
			this.connected = true
			this.update()
		}
	}

	/** Disconnect current watcher, drops it's denpendencies. */
	disconnect() {
		if (this.connected) {
			this.connected = false
			clearDependenciesOf(this)
		}
	}
}


/** 
 * Lazy watchers update later than normal watchers and components.
 * So data and nodes are update completed and become stable now.
 * Used by some special parts which should wait for normal data becomes stable, like `repeat` directive.
 */
export class LazyWatcher<T = any> extends Watcher<T> {

	update() {
		if (!this.connected) {
			return
		}
		
		enqueueUpdatableInOrder(this, this.type, QueueUpdateOrder.Otherwise)
	}
}
