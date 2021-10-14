/** A component, watcher, or anything else that can be updated. */
export interface Updatable {
	__updateImmediately(): void
}


/** 
 * The interface for Constructor of Component,
 * Help to determine the order of updatable items.
 */
export interface UpdatableContext extends Updatable {

	/** Get the document element the component attacted. */
	__getAttactedDomElement(): Element

	/** Compare two components in same component system. */
	__comparePositionWith(com: Updatable): number
}


export type MayContext = UpdatableContext | null