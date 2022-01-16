/** A component, watcher, or anything else that can be updated. */
export interface Updatable {
	__updateImmediately(): void
}


/** 
 * The interface for Constructor of Component,
 * Help to determine the order of updatable items.
 */
export interface UpdatableContext extends Updatable {

	/** Get the document's element that current component attacted. */
	__getAttactedDomElement(): Element

	/** Compare two components in the same component system. */
	__comparePositionWith(com: Updatable): number
}


export type MayContext = UpdatableContext | null