// Parameters you can pass in when initializing the action:
type ScrollPinParameters = {
	// How close (in pixels) to the bottom counts as still "at bottom."
	threshold?: number
	// Callback invoked whenever the pinned state toggles.
	// Receives `true` when pinned (at bottom), `false` otherwise.
	onPinStateChange?: (isPinned: boolean) => void
}

/**
 * Svelte action that keeps a scrollable container pinned to its bottom
 * when the user is near the bottom, and optionally notifies you when the
 * pinned state changes (e.g. user scrolls up).
 *
 * @param {HTMLElement} node          – The scrollable container element.
 * @param {ScrollPinParameters} [params] – Configuration object:
 *   • threshold (number): how close (px) to the bottom counts as "at bottom" (default 10)
 *   • onPinStateChange (function): callback invoked with the new pinned state
 *
 * Returns an object with:
 *   • update(newParams): update threshold and callback at runtime
 *   • destroy(): remove scroll listener and disconnect observer
 */
// -----------------------------------------------------------------------------
// The action itself. Attach via `<div use:scrollPin={…} />`.
export function scrollPin(node: HTMLElement, params: ScrollPinParameters = {}) {
	// Destructure incoming params and assign defaults
	let { threshold = 20, onPinStateChange } = params

	// Track whether we're currently pinned (start pinned)
	let isPinned = true
	// Remember the last scrollHeight to detect size changes
	let lastHeight = node.scrollHeight

	// Scroll helper: snap the container to the very bottom
	const scrollToBottom = () => {
		node.scrollTop = node.scrollHeight
	}

	// Check helper: are we within `threshold` px of the bottom?
	const isAtBottom = () => node.scrollHeight - node.clientHeight - node.scrollTop <= threshold

	// Kick things off by scrolling to bottom on init
	scrollToBottom()

	// When the user manually scrolls, update our pinned state
	const handleScroll = () => {
		const pinned = isAtBottom()
		if (pinned !== isPinned) {
			isPinned = pinned
			// Fire the callback, if given
			onPinStateChange?.(isPinned)
		}
	}

	const handleViewportResize = () => {
		if (isPinned) {
			requestAnimationFrame(scrollToBottom)
		}
	}

	// Watch for changes to content/size so we can auto-scroll if still pinned
	const observer = new MutationObserver(() => {
		if (isPinned && node.scrollHeight !== lastHeight) {
			scrollToBottom()
		}
		lastHeight = node.scrollHeight
	})

	observer.observe(node, {
		childList: true, // watch for added/removed nodes
		subtree: true, // watch all descendants
		characterData: true, // watch for text changes
		attributes: true // watch for style/attribute changes
	})

	// Listen for manual scrolls
	node.addEventListener('scroll', handleScroll, { passive: true })
	window.visualViewport?.addEventListener('resize', handleViewportResize)

	return {
		// Allow updating threshold and callback at runtime
		update(newParams: ScrollPinParameters) {
			;({ threshold = threshold, onPinStateChange = onPinStateChange } = newParams)
		},
		// Clean up listener + observer when action is destroyed
		destroy() {
			node.removeEventListener('scroll', handleScroll)
			observer.disconnect()
			window.visualViewport?.removeEventListener('resize', handleViewportResize)
		}
	}
}
