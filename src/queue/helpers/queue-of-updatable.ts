import {MiniHeap} from './mini-heap'
import {Updatable, Context} from './types'


export enum UpdatableUpdateOrder {
	
	/** Update firstly. */
	Watcher,

	/** Update secondary. */
	Component,

	/** Update directive like `repeat` or `liveRepeat`. */
	Directive,

	/** Update at last. */
	Otherwise,
}


/** Caches updatable items, get them in the order of `context, order`. */
export class QueueOfUpdatable {
	
	/** Help to check whether alread in queue. */
	private set: Set<Updatable> = new Set()

	/** Dynamically sort updatable items. */
	private heap: MiniHeap<{updatable: Updatable, context: Context, order: UpdatableUpdateOrder}>

	constructor() {
		this.heap = new MiniHeap((a, b) => {
			if (!a.context) {
				return -1
			}
			else if (!b.context) {
				return 1
			}
			else if (a.context.QueueOrder !== b.context.QueueOrder) {
				return a.context.QueueOrder - b.context.QueueOrder
			}
			else if (a.context !== b.context) {
				return a.context.comparePosition(a.updatable, b.updatable)
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

	add(updatable: Updatable, context: Context, order: UpdatableUpdateOrder) {
		this.heap.add({
			updatable,
			context,
			order,
		})

		this.set.add(updatable)
	}

	shift() {
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
