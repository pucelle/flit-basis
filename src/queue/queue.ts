import {QueueUpdateOrder, OrderedQueue} from './helpers/ordered-queue'
import {InfiniteUpdatingValidator} from './helpers/infinite-updating-validator'
import {MayContext, Updatable} from '../types'


/*
There is a hard problem must be considered in advance:
Whether we should update watchers or components firstly?

We may found update parent component,
will cause child watchers get changes, and get update.

So the best way is:
  Update parent watchers.
  Update parent components.
  Update parent miscs, like directives inner watchers.
  Update child watchers.
  Update child components.
  ...
*/


/** 
 * Indicates what we are updating.
 * Updating at a stage may cause new items added into following stages.
 */
enum UpdatingStage {

	/** No updata tasks. */
	NotStarted,

	/** Will update in next animation frame. */
	Prepended,

	/** Are updating. */
	Updating,
}


/** Caches any updatable. */
const queue: OrderedQueue = new OrderedQueue()

/** To validate updatable. */
const validator: InfiniteUpdatingValidator = new InfiniteUpdatingValidator()

/** Callbacks wait to be called after all the things update. */
let renderCompleteCallbacks: (() => void)[] = []

/** What's updating right now. */
let updatingStage: UpdatingStage = UpdatingStage.NotStarted


/** 
 * When a component, a watcher, or any other updatable things should enqueue to update.
 * Updatable wil be sort by `context, order`, and then called `__updateImmediately` one by one.
 */
export function enqueueUpdatableInOrder(upt: Updatable, context: MayContext, order: QueueUpdateOrder) {
	if (queue.has(upt)) {
		return
	}

	if (!validator.validate(upt)) {
		return
	}

	queue.add(upt, context, order)
	enqueueUpdateIfNot()
}


/** 
 * Calls `callback` after all the components and watchers updated and rendered in next animation frame.
 * Called before `untilRenderComplete` but normally there is no difference.
 * Compare to `untilRenderComplete`, `onRenderComplete` is normally used in internal implementations.
 * @param callback callback to be called after render completed.
 */
export function onRenderComplete(callback: () => void) {
	renderCompleteCallbacks.push(callback)
	enqueueUpdateIfNot()
}


/** 
 * Returns a promise which will be resolved after all the components and watchers updated and rendered in next animation frame.
 * Called after `onRenderComplete` but normally there is no difference.
 * Compare to `onRenderComplete`, `untilRenderComplete` is normally used in app implementations.
 * @return A promise to be resolved after render completed.
 */
export function untilRenderComplete(): Promise<void> {
	return new Promise(resolve => {
		onRenderComplete(resolve)
	})
}


/** Enqueue a update task if not have. */
function enqueueUpdateIfNot() {

	// Why doesn't use `Promise.resolve().then` to start a micro stask normally:
	// When initialize a component from `connectedCallback`,
	// it's child nodes especially elements of child components are not ready,
	// even in the following micro task queue.
	// Wait for `requestAnimationFrame` will make child nodes prepared.

	// Otherwise it's very frequently to trigger updating since data are always in changing,
	// Uses `requestAnimationFrame` can handle less data channing and callbaks.

	// But sill need to wait for a micro tick,
	// because more components will be connected in next micro task.

	if (updatingStage === UpdatingStage.NotStarted) {
		requestAnimationFrame(update)
		updatingStage = UpdatingStage.Prepended
	}
}


/** Do updating. */
async function update() {
	updatingStage = UpdatingStage.Updating

	while (!queue.isEmpty() || renderCompleteCallbacks.length > 0) {

		// Update watchers, components and other updatable, may cause more components or watchers to be enqueued.
		while (!queue.isEmpty()) {
			do {
				let upt = queue.shift()!

				try {
					upt.__updateImmediately()
				}
				catch (err) {
					console.error(err)
				}

				// Wait for more components connect.
				// Otherwise it wait for removed elements got disconnected.
				await Promise.resolve()
			}
			while (!queue.isEmpty())
		}

		let callbackList = renderCompleteCallbacks
		renderCompleteCallbacks = []

		// Calls callbacks, all components and watchers become stable now.
		for (let callback of callbackList) {
			try {
				callback()
			}
			catch (err) {
				console.error(err)
			}
		}

		await Promise.resolve()
	}


	// Back to start stage.
	validator.clear()
	updatingStage = UpdatingStage.NotStarted
}
