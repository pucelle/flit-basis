import {MiniHeap} from './mini-heap'
import {Updatable, MayContext} from '../../types'


export enum QueueUpdateOrder {
	
	/** Update firstly. */
	Watcher,

	/** Component will be updated after watchers. */
	Component,

	/** Update directive like `repeat` or `liveRepeat`. */
	Directive,

	/** Update at last. */
	Otherwise,
}


/** 
 * Caches updatable items,
 * Sort them in:
 * 	 - By Element order in whole document.
 *   - By `order` in a same context.
 */
export class OrderedQueue {
	
	/** Help to check whether alread in queue. */
	private set: Set<Updatable> = new Set()

	/** Dynamically sort updatable items. */
	private heap: MiniHeap<{updatable: Updatable, context: MayContext, order: QueueUpdateOrder}>

	constructor() {
		this.heap = new MiniHeap((a, b) => {
			// No context related, normally global watcher, Update at start.
			if (!a.context) {
				return -1
			}
			else if (!b.context) {
				return 1
			}

			let elA = a.context.__getAttactedDomElement()
			let elB = b.context.__getAttactedDomElement()

			if (elA !== elB) {
				return elA.compareDocumentPosition(elB) & elA.DOCUMENT_POSITION_FOLLOWING ? -1 : 1
			}
			else if (a.context !== b.context) {
				return a.context.__comparePositionWith(b.updatable)
			}
			else {
				return a.order - b.order
			}
		})
	}

	isEmpty() {
		return this.heap.isEmpty()
	}

	has(upt: Updatable): boolean {
		return this.set.has(upt)
	}

	add(updatable: Updatable, context: MayContext, order: QueueUpdateOrder) {
		this.heap.add({
			updatable,
			context,
			order,
		})

		this.set.add(updatable)
	}

	shift()                                {
		let o = this.heap.removeHead()
		let upt = o!.updatable
		this.set.delete(upt)
		
		return o?.updatable
	}

	clear() {
		this.set = new Set()
		this.heap.clear()
	}
}
