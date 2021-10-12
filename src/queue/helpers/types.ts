/** A component, watcher, or anything else that can be updated. */
export interface Updatable {
	__updateImmediately(): void
}


/** 
 * The interface for constructor of Component,
 * Component should support compare 
 */
interface UpdatableContext {

	/** The order used when sort across different component system. */
	QueueOrder: number

	/** Compare two components in same component system. */
	comparePosition(u1: Updatable, u2: Updatable): number
}


export type Context = UpdatableContext | null