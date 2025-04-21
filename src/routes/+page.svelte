<script>
	import { scrollLock } from '$library/scrollLock'
	import { scrollPin } from '$library/scrollPin'
	import { scrollTop } from '$library/scrollTop'
	import { sleep } from 'kitto'
	import { slide } from 'svelte/transition'
	import { onMount } from 'svelte'

	const convo = [
		'-----------------------------',
		'Alex: Hey Jamie! 14 weeks today! How are you feeling?',
		'Jamie: Hey Alex! Same here. Honestly, feeling a little more human again!',
		'Alex: Right? That first trimester fatigue was brutal.',
		'Jamie: I basically lived on crackers and naps.',
		'Alex: Same! Have you started showing yet?',
		'Jamie: A tiny bit! Just a little bump. You?',
		'Alex: Yeah, barely noticeable unless I wear tight clothes.',
		'Jamie: Are your jeans still fitting?',
		'Alex: Barely. I just ordered one of those belly bands.',
		'Jamie: Ooh, I need to get one of those!',
		'Alex: Any weird cravings kicking in?',
		"Jamie: Yes! Pickles and peanut butter. It's so bizarre.",
		"Alex: Hahaha I've been obsessed with watermelon lately.",
		'Jamie: That sounds refreshing actually.',
		'Alex: Did you go for your scan last week?',
		'Jamie: Yep! Baby was wiggling all over the place.',
		'Alex: Aw, same here. It felt so surreal to see the little arms and legs!',
		'Jamie: I cried a bit, not gonna lie.',
		"Alex: Totally valid. It's such an emotional experience.",
		'Jamie: Have you told work yet?',
		'Alex: Just did this week. They were really supportive.',
		"Jamie: That's great. I told my manager yesterday too.",
		'Alex: Starting to think about maternity clothes already?',
		'Jamie: Definitely browsing. Maternity leggings are calling my name.',
		"Alex: I swear I'm living in stretchy clothes already.",
		'Jamie: Same. Comfort is queen right now.',
		'Alex: Are you sleeping any better lately?',
		'Jamie: A bit. Still waking up to pee constantly though.',
		'Alex: The 2am bathroom visits are relentless!',
		"Jamie: And don't get me started on the dreams. So vivid!",
		'Alex: Omg yes, I dreamt I gave birth to a puppy last night.',
		'Jamie: 😂 I dreamed I was on a spaceship giving birth. What is pregnancy?!',
		'Alex: Seriously! Our brains are on another level right now.',
		'Jamie: Are you doing any pregnancy yoga or anything?',
		'Alex: I started some gentle stretches. It helps with the backache.',
		'Jamie: I should try that. My lower back is killing me already.',
		'Alex: I also started journaling—just to track this wild journey.',
		"Jamie: That's such a nice idea. I might steal that.",
		"Alex: Please do! It's kind of therapeutic.",
		'Jamie: Any names on your list yet?',
		"Alex: We've got a few. Nothing settled. You?",
		'Jamie: Same. I keep changing my mind daily.',
		'Alex: I feel like names will feel more real after we find out the gender.',
		'Jamie: Yep. Are you finding out?',
		'Alex: Yeah, we want to. Mid-May I think. You?',
		'Jamie: Same. I just want to connect more with them, you know?',
		'Alex: Totally get that.',
		'Jamie: Any weird symptoms lately?',
		'Alex: Nosebleeds. Out of nowhere!',
		"Jamie: I've been super congested. Pregnancy rhinitis, apparently.",
		'Alex: Never knew that was a thing before this.',
		'Jamie: Pregnancy is wild. Every day is a new surprise.',
		'Alex: Have you started looking at baby stuff yet?',
		"Jamie: I'm trying not to go overboard, but YES.",
		"Alex: It's hard not to. So many cute onesies!",
		'Jamie: And the tiny socks 😭',
		"Alex: My heart can't handle the cuteness.",
		'Jamie: Have you joined any pregnancy forums?',
		'Alex: A couple, but they can be overwhelming sometimes.',
		'Jamie: I get that. I like chatting with someone going through it at the same time.',
		"Alex: Same! It's comforting.",
		"Jamie: How's your partner been through all this?",
		"Alex: Super supportive, but I think it's just hitting him that this is real.",
		'Jamie: Mine too. He keeps talking to the bump already.',
		"Alex: Aw that's adorable.",
		'Jamie: I love how this whole thing makes everything more tender.',
		'Alex: Agreed. Even with the mood swings and exhaustion.',
		'Jamie: Oh yeah. I cried over a cereal commercial yesterday.',
		'Alex: Relatable. Hormones are no joke.',
		"Jamie: I keep wondering what the baby's personality will be like.",
		"Alex: I hope they're chill. Or at least a good sleeper!",
		'Jamie: Amen to that!',
		'Alex: Have you been reading any baby books?',
		"Jamie: A few. But mostly following my body's lead for now.",
		'Alex: Wise approach. Too much info can get stressful.',
		'Jamie: Yep. One day at a time.',
		'Alex: You nesting yet?',
		'Jamie: A little. I cleaned out an entire closet yesterday.',
		"Alex: Haha same! Something just kicked in and I couldn't stop organizing.",
		"Jamie: It's like some switch flips in your brain.",
		'Alex: Totally instinctual.',
		'Jamie: Do you ever just stop and think—this is really happening?',
		'Alex: All the time. Still feels unreal.',
		"Jamie: We're gonna be parents soon. That's huge.",
		'Alex: I know! Sometimes I get hit with this wave of excitement and fear at the same time.',
		'Jamie: Yep, that combo feels very familiar.',
		"Alex: But we've got this.",
		'Jamie: We really do.',
		"Alex: Let's check in next week—see how 15 weeks is treating us?",
		'Jamie: Yes! Weekly bumpdates?',
		'Alex: You read my mind.',
		'Jamie: Chat soon, mama!',
		'Alex: Take care, mama. Talk soon!'
	]

	let messages = $state(convo)
	let message = $state('')
	let blurring = $state(false)
	let main = $state(null)
	let mounted = $state(false)

	onMount(() => (mounted = true))

	function scrollToBottom() {
		if (!main) return

		main.scrollTo({
			top: main.scrollHeight,
			behavior: 'smooth'
		})
	}

	function handleFocus() {
		window.visualViewport.addEventListener('resize', () => {
			requestAnimationFrame(scrollToBottom)
		})
	}

	function handleBlur() {
		blurring = true
		setTimeout(() => (blurring = false), 750)
	}

	let fetching = $state(false)

	async function fetchMore() {
		const oldHeight = main.scrollHeight

		fetching = true
		await sleep(3000) // replace with actual fetch
		fetching = false
		await sleep(500)

		messages = [...convo, ...messages]

		requestAnimationFrame(() => (main.scrollTop = main.scrollHeight - oldHeight))
	}

	function handleSend(e) {
		e.preventDefault()
		messages = [...messages, message]
		message = ''
		requestAnimationFrame(scrollToBottom)

		requestAnimationFrame(() => {
			setTimeout(() => (messages = [...messages, convo[0]]), 1000)
			setTimeout(() => (messages = [...messages, convo[1]]), 2000)
			setTimeout(() => (messages = [...messages, convo[2]]), 3000)
		})
	}

	function handleTouchStart(e) {
		e.preventDefault()
		e.stopPropagation()
	}

	function handleTouchEnd(e) {
		e.preventDefault()
		e.stopPropagation()
		handleSend(e)
	}
</script>

<div class="feed" use:scrollLock>
	<header class="head">Header</header>
	<main class="main" class:blurring bind:this={main} use:scrollTop={[fetchMore]} use:scrollPin>
		{#if fetching}
			<span transition:slide>Fetching...</span>
		{/if}
		{#each messages as message, i}
			<div class="message">{messages.length - i}: {message}</div>
		{/each}
	</main>
	<footer class="foot" class:mounted class:blurring>
		<input type="text" placeholder="Message" bind:value={message} onfocus={handleFocus} onblur={handleBlur} />
		<button ontouchstart={handleTouchStart} ontouchend={handleTouchEnd} onclick={handleSend}>Send</button>
	</footer>
</div>

<style lang="css">
	.head {
		align-items: center;
		background-color: oklch(100% 0 0 / 0.5);
		backdrop-filter: blur(2px);
		display: flex;
		justify-content: space-between;
		inset: 0 0 auto 0;
		height: calc(50px + env(safe-area-inset-top));
		padding-block-start: env(safe-area-inset-top);
		padding-inline: 1rem;
		position: absolute;
		z-index: 1;
	}

	.main {
		background-color: lightgray;
		display: grid;
		gap: 1rem;
		height: var(--vvh, 100svh);
		padding: calc(4.5rem + env(safe-area-inset-top)) 1rem 4.5rem;
		overflow: auto;
		transition: height 0.35s ease; /* android only */

		&.blurring {
			height: 100svh;
			transition: none;
		}
	}

	.foot {
		align-items: center;
		background-color: oklch(100% 0 0 / 0.5);
		backdrop-filter: blur(2px);
		display: flex;
		justify-content: space-between;
		inset: 0 0 auto 0;
		height: 50px;
		padding-inline: 1rem;
		position: absolute;
		translate: 0 calc(var(--vvh) - 100%);
		z-index: 1;

		&.mounted {
			transition: translate 0.35s 0s ease;
		}

		&.blurring {
			translate: 0 calc(100svh - 100%);
			transition: none;
		}
	}

	/* Example code for a chat message */
	.message {
		background-color: oklch(100% 0 0 / 0.5);
		border-radius: 0.5rem;
		max-width: 75%;
		padding: 0.5rem 0.75rem;

		&:nth-of-type(even) {
			background-color: oklch(100% 0 0 / 0.25);
			margin-left: auto;
		}
	}
</style>
