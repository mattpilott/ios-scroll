// Utility: chain multiple cleanup functions into one
function chain(...fns) {
	return () => {
		for (const fn of fns) {
			try {
				fn()
			} catch {}
		}
	}
}

// Utility: walk up from `el` until you find a scrollable parent
function getScrollParent(el) {
	let node = el
	while (node && node !== document.body && node !== document.documentElement) {
		const style = getComputedStyle(node)
		const { overflow, overflowY, overflowX } = style

		if (/(auto|scroll)/.test(overflow + overflowY + overflowX)) {
			return node
		}

		node = node.parentElement
	}
	return document.documentElement
}

// @ts-ignore
const visualViewport = typeof window !== 'undefined' && window.visualViewport

/**
 * Svelte action that locks scrolling on the page or a container,
 * applying workarounds for desktop and mobile Safari quirks:
 *  - Sets a CSS variable (--vvh) to reflect visual-viewport height.
 *  - Prevents touch-driven overscroll and input-driven scrolling.
 *
 * @param {HTMLElement} node
 *   The element whose scroll/focus interactions should be locked.
 *
 * @returns {{
 *   update(): void;    // Re-applies the lock if parameters change
 *   destroy(): void;   // Removes all listeners and restores original state
 * }}
 */
export function scrollLock(node) {
	let cleanup

	const onVVHResize = () => node.style.setProperty('--vvh', `${visualViewport.height}px`)

	onVVHResize()

	visualViewport.addEventListener('resize', onVVHResize)

	function setup() {
		if (/iPhone/.test(navigator.platform)) {
			cleanup = preventScrollMobileSafari()
		} else {
			cleanup = preventScrollStandard()
		}
	}

	setup()

	return {
		update() {
			if (cleanup) {
				cleanup()
				cleanup = undefined
			}
			setup()
		},
		destroy() {
			visualViewport.removeEventListener('resize', onVVHResize)
			if (cleanup) cleanup()
		}
	}
}

// For most browsers, just hide overflow on <html> and add padding to avoid layout shift.
function preventScrollStandard() {
	return chain(
		setStyle(
			document.documentElement,
			'paddingRight',
			`${window.innerWidth - document.documentElement.clientWidth}px`
		),
		setStyle(document.documentElement, 'overflow', 'hidden')
	)
}

// iOS Safari even with overflow: hidden, still scrolls the page in many situations:
// 1. When the toolbar and address bar are collapsed, scrolling is always allowed.
// 2. When the keyboard is visible, the viewport does not resize. Instead, the
//    keyboard covers part of it, so it becomes scrollable.
// 3. When tapping on an input, the page scrolls so that the input is centered in
//    the visual viewport. This may cause fixed position elements to scroll offscreen.
// 4. When using the next/previous buttons in the keyboard to navigate between inputs,
//    the page always scrolls, even if the input is inside a nested scroll element
//    that could be scrolled instead.

// In order to work around these cases, and prevent scrolling, we need to:
// 1. Prevent default on 'touchmove' events that are not in a scrollable element.
//    This prevents touch scrolling on the window.
// 2. Prevent default on 'touchmove' events inside a scrollable element when the
//    scroll position is at the top or bottom. This avoids the whole page scrolling
//    instead, but does prevent overscrolling
// 3. Prevent default on "touchend' events on inputs and handle focus ourselves.
// 4. When focusing an input, apply a transform to trick Safari into thinking the
//    input is at the top, which prevents it from scrolling the page. After the it's
//    focussed, scroll the element into view ourselves, without scrolling the page.
// 5. Offset the body by the scroll position using a negative margin and scroll to
//    the top. This should appear the same visually, but makes the actual scroll
//    position always zero. This is required to make all of the above work or
//    Safari will still try to scroll the page when focusing an input.
// 6. As a last resort, handle window scroll events, and scroll back to the top.
//    This can happen when attempting to navigate to an input with the next/previous
//    buttons that's outside a modal.
function preventScrollMobileSafari() {
	let scrollable
	let lastY = 0

	// Store the nearest scrollable parent on touchstart
	const onTouchStart = e => {
		scrollable = getScrollParent(e.target)

		if (scrollable === document.documentElement && scrollable === document.body) {
			return
		}
		lastY = e.changedTouches[0].pageY
	}

	// Prevent window scroll, and avoid "overscroll" at nested boundaries
	const onTouchMove = e => {
		if (scrollable === document.documentElement || scrollable === document.body) {
			e.preventDefault()
			return
		}

		const y = e.changedTouches[0].pageY
		const scrollTop = scrollable.scrollTop
		const bottom = scrollable.scrollHeight - scrollable.clientHeight

		if ((scrollTop <= 0 && y > lastY) || (scrollTop >= bottom && y < lastY)) {
			e.preventDefault()
		}

		lastY = y
	}

	// Intercept taps on inputs so Safari won't scroll them into view
	const onTouchEnd = e => {
		const target = /** @type {HTMLElement} */ e.target

		if (target.tagName === 'INPUT') {
			e.preventDefault()
			// Trick Safari: move the input far up, focus, then restore
			target.style.transform = 'translateY(-2000px)'
			target.focus()

			requestAnimationFrame(() => (target.style.transform = ''))
		}
	}

	// Also handle programmatic focus (e.g. "next" keyboard button)
	const onFocus = e => {
		const target = /** @type {HTMLElement} */ e.target

		if (target.tagName === 'INPUT') {
			target.style.transform = 'translateY(-2000px)'

			requestAnimationFrame(() => {
				target.style.transform = ''
				// Scroll it into view without moving the whole page
				if (visualViewport) {
					if (visualViewport.height < window.innerHeight) {
						requestAnimationFrame(() => scrollIntoView(target))
					} else {
						visualViewport.addEventListener('resize', () => scrollIntoView(target), { once: true })
					}
				}
			})
		}
	}

	// If Safari somehow scrolls the window, snap it back to top
	const onWindowScroll = () => window.scrollTo(0, 0)

	// Save & offset the page so it visually stays put while actual scroll is zero
	const scrollX = window.scrollX
	const scrollY = window.scrollY
	const restoreStyles = chain(
		setStyle(
			document.documentElement,
			'paddingRight',
			`${window.innerWidth - document.documentElement.clientWidth}px`
		),
		setStyle(document.documentElement, 'overflow', 'hidden'),
		setStyle(document.body, 'marginTop', `-${scrollY}px`)
	)

	window.scrollTo(0, 0)

	const removeEvents = chain(
		addEvent(document, 'touchstart', onTouchStart, { passive: false, capture: true }),
		addEvent(document, 'touchmove', onTouchMove, { passive: false, capture: true }),
		addEvent(document, 'touchend', onTouchEnd, { passive: false, capture: true }),
		addEvent(document, 'focus', onFocus, true),
		addEvent(window, 'scroll', onWindowScroll)
	)

	return () => {
		restoreStyles()
		removeEvents()
		window.scrollTo(scrollX, scrollY)
	}
}

// Sets a CSS property and returns a function to revert it
function setStyle(el, style, value) {
	// @ts-ignore
	const prev = el.style[style]
	el.style[style] = value

	return () => (el.style[style] = prev)
}

// Adds an event listener and returns a remover function
function addEvent(target, event, handler, options) {
	target.addEventListener(event, handler, options)

	return () => target.removeEventListener(event, handler, options)
}

// Scroll the nearest scrollable parent so `target` is in view
function scrollIntoView(target) {
	const scrollable = getScrollParent(target)
	if (scrollable !== document.documentElement && scrollable !== document.body) {
		const top = scrollable.getBoundingClientRect().top
		const tTop = target.getBoundingClientRect().top
		if (tTop > top + target.clientHeight) {
			scrollable.scrollTop += tTop - top
		}
	}
}
