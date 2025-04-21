/**
 * Svelte action that triggers a callback when the user scrolls
 * near the top of the element.
 *
 * @param {HTMLElement} node            – The DOM node to attach the scroll listener to.
 * @param {[() => void]} callbackArr    – An array containing the callback function to invoke.
 *
 * Returns an object with:
 *   • destroy(): removes the scroll listener
 *   • update(newParams): allows swapping out the callback at runtime
 */
export function scrollTop(node, [callback]) {
	let isNearTop = false
	let lastScrollTop = node.scrollTop // Initialize with current scroll position

	function handleScroll(e) {
		// Check if we're within 200px of the top
		const nearTopThreshold = 200
		const currentScrollTop = e.target.scrollTop
		const isScrollingUp = currentScrollTop < lastScrollTop

		// First update last scroll position
		lastScrollTop = currentScrollTop

		// Then check conditions
		if (isScrollingUp && !isNearTop && currentScrollTop <= nearTopThreshold) {
			isNearTop = true
			callback()
		} else if (currentScrollTop > nearTopThreshold) {
			// Reset the flag when we scroll away from top
			isNearTop = false
		}
	}

	node.addEventListener('scroll', handleScroll)

	return {
		destroy() {
			node.removeEventListener('scroll', handleScroll)
		},
		update(newParams) {
			// Allow updating the callback if needed
			callback = newParams.callback
		}
	}
}
