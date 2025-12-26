import Gemmy from "src/main";

// --- TYPES ---
interface Reaction {
	mood: string;
	weight: number;
	text?: string;
}

interface LookRange {
	x: number;
	y?: number;
	yMin?: number;
	yMax?: number;
}

interface DurationRange {
	min: number;
	max: number;
}

interface Config {
	physics: {
		decayRate: number;
		decayInterval: number;
		maxIntensity: number;
		smoothness: number;
		epsilon: number;
	};
	attention: {
		idleThreshold: number;
		drowsyThreshold: number;
		focusChance: number;
		durations: Record<string, DurationRange>;
		lookRanges: Record<string, LookRange>;
	};
	blink: {
		speeds: Record<string, number>;
		intervals: Record<string, { base: number; variance: number }>;
		scales: Record<string, number>;
	};
	moods: {
		durations: Record<string, number>;
	};
	reactions: Record<string, Reaction[]>;
}

// --- CONFIGURATION DATABASE ---
const CONFIG: Config = {
	physics: {
		decayRate: 0.9,
		decayInterval: 100,
		maxIntensity: 800,
		smoothness: 0.2,
		epsilon: 0.0001,
	},
	attention: {
		idleThreshold: 2000,
		drowsyThreshold: 10000,
		focusChance: 0.4,
		durations: {
			suspicious: { min: 500, max: 500 },
			sad: { min: 3000, max: 3000 },
			bored: { min: 4000, max: 4000 },
			excited: { min: 300, max: 300 },
			love: { min: 5000, max: 5000 },
			scared: { min: 200, max: 200 },
			standard: { min: 500, max: 2000 },
			focus: { min: 2000, max: 5000 },
			distracted: { min: 1000, max: 3000 },
		},
		lookRanges: {
			suspicious: { x: 1.5, y: 1.0 },
			sad: { x: 0.5, yMin: 0.5, yMax: 0.7 },
			bored: { x: 0.8, y: 0.5 },
			excited: { x: 1.8, y: 1.5 },
			love: { x: 0, y: -0.2 },
			scared: { x: 2.0, y: 1.5 },
			standard: { x: 1.5, y: 1.0 },
		},
	},
	blink: {
		speeds: {
			normal: 150,
			confused: 200,
			angry: 100,
			love: 400,
			scared: 50,
			drowsy: 3000,
		},
		intervals: {
			normal: { base: 3000, variance: 4000 },
			intrigued: { base: 6000, variance: 4000 },
			scared: { base: 500, variance: 1000 },
			drowsy: { base: 1000, variance: 2000 },
		},
		scales: {
			closed: 0.1,
			drowsy: 0.4,
		},
	},
	moods: {
		durations: {
			"is-happy": 0,
			"is-angry": 3000,
			"is-suspicious": 4000,
			"is-sad": 5000,
			"is-confused": 4000,
			"is-shy": 4000,
			"is-sleeping": 0,
			"is-excited": 3000,
			"is-bored": 6000,
			"is-love": 4000,
			"is-scared": 2500,
			"is-surprised": 2000,
			"is-poked": 500,
			"is-hidden": 0,
		},
	},
	reactions: {
		click: [
			{ mood: "is-poked", weight: 0.5 },
			{ mood: "is-confused", weight: 0.15 },
			{ mood: "is-shy", weight: 0.15 },
			{ mood: "is-happy", weight: 0.1 },
			{ mood: "is-love", weight: 0.1 },
		],
		contextmenu: [
			{ mood: "is-angry", weight: 0.4 },
			{ mood: "is-suspicious", weight: 0.3 },
			{ mood: "is-sleeping", weight: 0.2 },
			{ mood: "is-scared", weight: 0.1 },
		],
		dblclick: [
			{ mood: "is-surprised", weight: 0.5 },
			{ mood: "is-excited", weight: 0.3 },
			{ mood: "is-scared", weight: 0.1 },
			{ mood: "is-confused", weight: 0.1 },
		],
		"layout-change": [
			{
				mood: "is-surprised",
				weight: 0.3,
				text: "Whoa! Everything moved!",
			},
			{
				mood: "is-confused",
				weight: 0.3,
				text: "Where did that window go?",
			},
			{ mood: "is-excited", weight: 0.2, text: "I love redecorating!" },
			{ mood: "is-happy", weight: 0.2, text: "Ah, much better." },
		],
		"file-change": [
			{
				mood: "is-excited",
				weight: 0.3,
				text: "Ooh! Writing something new?",
			},
			{
				mood: "is-suspicious",
				weight: 0.2,
				text: "Did you just change that?",
			},
			{ mood: "is-happy", weight: 0.3, text: "Productivity mode: ON." },
			{ mood: "is-love", weight: 0.2, text: "I love this note." },
		],
	},
};

const GEMMY_IDLE_QUOTES = [
	"Did you know that a vault is just a folder of plain text notes?",
	"I see you're checking out a ChatGPT plugin, would you consider me instead?",
	"You have plugins that you can update!",
	"Hi I'm Gemmy! Like Clippy but shinier!",
	"Everything is connected. Everything.",
	"Can’t decide which note to work on? Try the Random Note core plugin!",
	"Are you sure you don’t want to upload all your notes just so we can chat?",
	"How tall would all your notes be if you stacked them up?",
	"Wanna teach me to say things? Find me on GitHub and open a pull request!",
	"Have you considered using Comic Sans?",
	"A blank page is just a masterpiece in waiting",
];

const WRITING_QUOTES_DB: Record<string, string[]> = {
	"is-angry": [
		"Is that the best you can do? Keep writing!",
		"Bold choice to open Obsidian and then do absolutely nothing.",
		"I am judging your lack of typing.",
		"Write first, edit later!",
	],
	"is-bored": [
		"I count 0 changes in the last minute.",
		"Is the keyboard unplugged?",
		"I can see dust settling on your notes.",
		"Hmm, I didn’t realize staring at the screen was a new note-taking strategy.",
	],
	"is-sad": [
		"Oh, taking a break? Don’t let the ideas get cold!",
		"What’s this? Writer’s block already?",
		"Is this a journal or a staring contest with the cursor?",
		"I feel lonely when you don't type.",
	],
	"is-excited": [
		"You’ve got this! Every keystroke is a step closer to brilliance.",
		"You’re doing amazing! Keep the momentum going.",
		"Anything is better than a blank page, even me. Write something!",
		"I love hearing your keyboard. Don't stop.",
	],
	"is-suspicious": [
		"Are you checking social media instead of writing?",
		"I don't hear any typing...",
		"Did you forget what you were going to say?",
	],
};

const SPEECH_DB: Record<string, string[]> = {
	"is-happy": [
		...GEMMY_IDLE_QUOTES,
		"This vault is looking tidy!",
		"I love organization!",
		"Your graph is looking beautiful today.",
		"Ready to capture some ideas?",
	],
	"is-angry": [
		"Hey! Be careful with that delete key!",
		"I am not a stress ball!",
		"Did you just use a space instead of a tab?",
		"Don't make me re-index everything!",
		"I'm going to hide your favorite plugin if you keep this up.",
		"Grrr... I'm feeling a merge conflict coming on.",
	],
	"is-suspicious": [
		"I smell a Notion user...",
		"Are you cheating on me with VS Code?",
		"That link looks broken...",
		"Did you really mean to put that file in the root folder?",
		"I saw you copy-pasting from a website. Formatting is going to be weird.",
		"Why is the vault size not increasing?",
	],
	"is-sad": [
		"My graph view feels so empty today.",
		"I haven't seen a new backlink in hours.",
		"Are you abandoning your Zettelkasten?",
		"I miss the sound of mechanical keys.",
		"Please don't archive me.",
		"I feel like an unlinked mention.",
	],
	"is-confused": [
		"Wait, is that Markdown or just a mess?",
		"I can't parse that query.",
		"Circular dependency detected?",
		"Where does this link go again?",
		"I'm lost in the graph.",
		"Did you install a plugin that conflicts with me?",
	],
	"is-shy": [
		"Oh, you noticed my new animation?",
		"I'm just a humble mascot.",
		"Please, I'm just code.",
		"You're making my pixels blush.",
		"I'm not as cool as the Dataview plugin...",
		"Do you really like my style?",
	],
	"is-sleeping": [
		"Indexing... Zzz...",
		"Dreaming of infinite canvas...",
		"Defragmenting... just kidding.",
		"Wake me up when the plugin update is ready.",
		"Power saving mode activated.",
		"Counting sheep... or nodes...",
	],
	"is-excited": [
		"Did someone say 'New Release'?!",
		"I love it when you connect ideas!",
		"That graph is looking SPICY!",
		"Woohoo! Another daily note!",
		"Plugins! Give me all the plugins!",
		"I feel so optimized right now!",
	],
	"is-bored": [
		"I count 0 changes in the last minute.",
		"Is the keyboard unplugged?",
		"I can see dust settling on your notes.",
	],
	"is-love": [
		"I love your vault structure.",
		"You + Me + Markdown = Forever.",
		"Your notes are the best notes.",
		"I'd never let your data get corrupted.",
		"You're the admin of my heart.",
		"<3 Local-first love.",
	],
	"is-scared": [
		"Don't force quit! I'm saving!",
		"Is that a sync error?!",
		"I heard a hard drive click...",
		"Please backup your vault!",
		"No! Not the 'Delete All' button!",
		"I'm afraid of the dark mode... just kidding, I love it.",
	],
	"is-surprised": [
		"Whoa! That's a lot of text!",
		"I didn't know you could do that with CSS!",
		"A new folder? Bold move!",
		"You actually finished a project?!",
		"Incredible! Zero merge conflicts!",
		"Wow! Look at that graph grow!",
	],
	"is-poked": [
		"Hey! I'm working here!",
		"Tickles! Stop it!",
		"I'm not a button!",
		"Do I look like a checkbox?",
		"Poke the 'New Note' button instead!",
		"Ouch! My vectors!",
		"Personal space, please!",
	],
	"is-hidden": [
		"I'm hiding!",
		"You can't see me!",
		"Stealth mode activated.",
		"Going dark.",
		"I'll be watching from the shadows...",
	],
};

// --- UTILS ---
class Utils {
	static getRange(min: number, max: number) {
		if (min === max) return min;
		return Math.random() * (max - min) + min;
	}

	static getRandomItem<T>(array: T[]): T {
		return array[Math.floor(Math.random() * array.length)];
	}

	static getRandomPhrase(category: string) {
		const phrases = SPEECH_DB[category];
		if (!phrases || phrases.length === 0) return "...";
		return this.getRandomItem(phrases);
	}

	static getReaction(eventType: string): Reaction {
		const reactions = CONFIG.reactions[eventType];
		if (!reactions) return { mood: "is-happy", weight: 0 };

		const totalWeight = reactions.reduce((sum, r) => sum + r.weight, 0);
		let random = Math.random() * totalWeight;

		for (const reaction of reactions) {
			if (random < reaction.weight) {
				return reaction;
			}
			random -= reaction.weight;
		}
		return reactions[0];
	}
}

type EventCallback = (data?: unknown) => void;

class EventBus {
	private listeners: { [key: string]: EventCallback[] } = {};

	on(event: string, callback: EventCallback) {
		if (!this.listeners[event]) {
			this.listeners[event] = [];
		}
		this.listeners[event].push(callback);
	}

	emit(event: string, data?: unknown) {
		if (this.listeners[event]) {
			this.listeners[event].forEach((callback) => callback(data));
		}
	}
}

// --- SYSTEMS ---

class SpeechSystem {
	private bubble: HTMLElement;
	private timer: NodeJS.Timeout | null = null;

	constructor(bubbleElement: HTMLElement) {
		this.bubble = bubbleElement;
	}

	speak(text: string, duration = 4000) {
		if (this.timer) clearTimeout(this.timer);

		this.bubble.textContent = text;
		this.bubble.classList.add("visible");

		if (duration > 0) {
			this.timer = setTimeout(() => {
				this.bubble.classList.remove("visible");
			}, duration);
		}
	}
}

class MoodSystem {
	private wrapper: HTMLElement;
	private speechSystem: SpeechSystem;
	private currentMood = "is-happy";
	public isSleeping = false;
	public isHidden = false;
	private resetTimer: NodeJS.Timeout | null = null;

	constructor(wrapper: HTMLElement, speechSystem: SpeechSystem) {
		this.wrapper = wrapper;
		this.speechSystem = speechSystem;
	}

	setMood(moodClass: string, btn: HTMLElement | null = null, speak = true) {
		// Clear any pending reset
		if (this.resetTimer) {
			clearTimeout(this.resetTimer);
			this.resetTimer = null;
		}

		if (moodClass === "is-sleeping") {
			this.isSleeping = true;
		} else {
			this.isSleeping = false;
		}

		if (moodClass === "is-hidden") {
			this.isHidden = true;
		} else {
			this.isHidden = false;
		}

		// Remove all potential mood classes specifically
		const allMoods = Object.keys(CONFIG.moods.durations);
		this.wrapper.classList.remove(...allMoods);

		// Apply new mood
		this.wrapper.classList.add(moodClass);
		this.currentMood = moodClass;

		// eslint-disable-next-line obsidianmd/no-static-styles-assignment
		this.wrapper.style.setProperty("--look-x", "0");
		// eslint-disable-next-line obsidianmd/no-static-styles-assignment
		this.wrapper.style.setProperty("--look-y", "0");

		// Speech reactions
		if (speak) {
			this.speechSystem.speak(Utils.getRandomPhrase(moodClass), 4000);
		}

		// Auto-reset logic
		const duration = CONFIG.moods.durations[moodClass];
		if (duration > 0 && moodClass !== "is-happy") {
			this.resetTimer = setTimeout(() => {
				this.setMood("is-happy", null, false);
			}, duration);
		}
	}

	getMood() {
		return this.currentMood;
	}

	handleEvent(eventType: string) {
		if ((this.isSleeping || this.isHidden) && eventType !== "wakeup")
			return;

		// Chance check for file-change (30% chance)
		if (eventType === "file-change" && Math.random() > 0.3) return;

		const reaction = Utils.getReaction(eventType);

		// Pass false to setMood's speak param so we can handle it manually
		this.setMood(reaction.mood, null, false);

		if (reaction.text) {
			this.speechSystem.speak(reaction.text, 3000);
		} else {
			this.speechSystem.speak(Utils.getRandomPhrase(reaction.mood), 4000);
		}
	}
}

class PhysicsSystem {
	private wrapper: HTMLElement;
	private moodSystem: MoodSystem;
	private targetX = 0;
	private targetY = 0;
	private currentX = 0;
	private currentY = 0;
	private prevMouseX = 0;
	private prevMouseY = 0;
	private rawMouseX = 0;
	private rawMouseY = 0;
	public movementIntensity = 0;
	public lastMouseMoveTime = Date.now();
	private isPayingAttention = true;
	private hasInitializedMouse = false;
	private decayInterval: NodeJS.Timeout;
	private attentionTimeout: NodeJS.Timeout;
	private animationFrame: number;
	private mouseHandler: (e: MouseEvent) => void;

	constructor(
		wrapper: HTMLElement,
		moodSystem: MoodSystem,
		private plugin: Gemmy
	) {
		this.wrapper = wrapper;
		this.moodSystem = moodSystem;
		this.init();
	}

	init() {
		// Decay intensity
		this.decayInterval = setInterval(() => {
			this.movementIntensity *= CONFIG.physics.decayRate;
			if (this.movementIntensity < 1) this.movementIntensity = 0;

			this.checkMovementMood();
		}, CONFIG.physics.decayInterval);

		// Mouse tracking
		this.mouseHandler = (e: MouseEvent) => this.handleMouseMove(e);
		this.plugin.registerDomEvent(document, "mousemove", this.mouseHandler);

		// Animation loop
		this.animate();

		// Attention loop
		this.attentionLoop();
	}

	destroy() {
		clearInterval(this.decayInterval);
		clearTimeout(this.attentionTimeout);
		cancelAnimationFrame(this.animationFrame);
	}

	checkMovementMood() {
		if (this.moodSystem.isSleeping) return;

		const currentMood = this.moodSystem.getMood();

		// High intensity (violent shaking)
		if (this.movementIntensity > 600) {
			if (currentMood !== "is-scared" && currentMood !== "is-confused") {
				const mood = Math.random() > 0.5 ? "is-scared" : "is-confused";
				this.moodSystem.setMood(mood);
			}
		}
		// Medium intensity (fast movement)
		else if (this.movementIntensity > 300) {
			// Only interrupt calm states
			const calmMoods = ["is-happy", "is-bored", "is-shy", "is-sad"];
			if (calmMoods.includes(currentMood)) {
				if (Math.random() < 0.1) {
					// Low chance to avoid spamming
					const mood =
						Math.random() > 0.5 ? "is-excited" : "is-suspicious";
					this.moodSystem.setMood(mood);
				}
			}
		}
	}

	handleMouseMove(e: MouseEvent) {
		if (this.moodSystem.isSleeping) return;

		const now = Date.now();

		if (!this.hasInitializedMouse) {
			this.prevMouseX = e.clientX;
			this.prevMouseY = e.clientY;
			this.lastMouseMoveTime = now;
			this.hasInitializedMouse = true;
			return;
		}

		const dt = now - this.lastMouseMoveTime;
		this.lastMouseMoveTime = now;

		// Intensity based on duration of continuous movement
		if (this.isPayingAttention && dt < 100) {
			this.movementIntensity += dt;
		}

		if (this.movementIntensity > CONFIG.physics.maxIntensity)
			this.movementIntensity = CONFIG.physics.maxIntensity;

		this.prevMouseX = e.clientX;
		this.prevMouseY = e.clientY;

		const rect = this.wrapper.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;

		// Store raw input
		this.rawMouseX = (e.clientX - centerX) / (window.innerWidth / 1.8);
		this.rawMouseY = (e.clientY - centerY) / (window.innerHeight / 1.8);

		// Immediate update if we are currently focused on the mouse
		if (this.isPayingAttention) {
			this.updateTargetFromMouse();
		}
	}

	updateTargetFromMouse() {
		let multiplierX = 1;
		let multiplierY = 1;
		let offsetX = 0;
		let offsetY = 0;
		const currentMood = this.moodSystem.getMood();

		switch (currentMood) {
			case "is-shy":
				multiplierX = -0.5;
				multiplierY = -0.4;
				break;
			case "is-angry":
				multiplierX = 1.2;
				multiplierY = 1.2;
				break;
			case "is-suspicious":
				multiplierX = 1.2;
				multiplierY = 0.3;
				break;
			case "is-sad":
				multiplierX = 0.6;
				multiplierY = 0.4;
				offsetY = 0.4;
				break;
			case "is-confused":
				multiplierX = 0.9;
				multiplierY = 0.9;
				break;
			case "is-excited":
				multiplierX = 1.3;
				multiplierY = 1.3;
				break;
			case "is-bored":
				multiplierX = 0.3;
				multiplierY = 0.3;
				break;
			case "is-love":
				multiplierX = 1.5;
				multiplierY = 1.5;
				break;
			case "is-scared":
				multiplierX = -0.8;
				multiplierY = -0.8;
				break;
		}

		this.targetX = Math.max(
			-1,
			Math.min(1, this.rawMouseX * multiplierX + offsetX)
		);
		this.targetY = Math.max(
			-0.9,
			Math.min(0.9, this.rawMouseY * multiplierY + offsetY)
		);
	}

	animate() {
		const smoothness = CONFIG.physics.smoothness;
		const diffX = this.targetX - this.currentX;
		const diffY = this.targetY - this.currentY;

		if (
			Math.abs(diffX) < CONFIG.physics.epsilon &&
			Math.abs(diffY) < CONFIG.physics.epsilon
		) {
			this.animationFrame = requestAnimationFrame(() => this.animate());
			return;
		}

		this.currentX += diffX * smoothness;
		this.currentY += diffY * smoothness;

		this.wrapper.style.setProperty("--look-x", this.currentX.toFixed(4));
		this.wrapper.style.setProperty("--look-y", this.currentY.toFixed(4));

		this.animationFrame = requestAnimationFrame(() => this.animate());
	}

	attentionLoop() {
		if (this.moodSystem.isSleeping) {
			this.attentionTimeout = setTimeout(
				() => this.attentionLoop(),
				1000
			);
			return;
		}

		const timeSinceMove = Date.now() - this.lastMouseMoveTime;
		const isIdle = timeSinceMove > CONFIG.attention.idleThreshold;
		const currentMood = this.moodSystem.getMood();

		let nextDuration = 2000;

		if (isIdle) {
			this.isPayingAttention = false;

			// Helper to set target and duration
			const setLook = (rangeKey: string, durationKey: string) => {
				const range = CONFIG.attention.lookRanges[rangeKey];
				const duration = CONFIG.attention.durations[durationKey];

				// Handle special cases like 'sad' having yMin/yMax
				if (range.yMin !== undefined && range.yMax !== undefined) {
					this.targetX = (Math.random() - 0.5) * range.x;
					this.targetY =
						range.yMin + Math.random() * (range.yMax - range.yMin);
				} else {
					this.targetX = (Math.random() - 0.5) * range.x;
					this.targetY = (Math.random() - 0.5) * (range.y ?? 0);
					// Special case for love (fixed gaze)
					if (rangeKey === "love") {
						this.targetX = range.x;
						this.targetY = range.y ?? 0;
					}
				}
				nextDuration = Utils.getRange(duration.min, duration.max);
			};

			if (currentMood === "is-suspicious")
				setLook("suspicious", "suspicious");
			else if (currentMood === "is-sad") setLook("sad", "sad");
			else if (currentMood === "is-bored") setLook("bored", "bored");
			else if (currentMood === "is-excited")
				setLook("excited", "excited");
			else if (currentMood === "is-love") setLook("love", "love");
			else if (currentMood === "is-scared") setLook("scared", "scared");
			else {
				// Standard random behavior
				if (Math.random() < 0.3) {
					this.targetX = 0;
					this.targetY = 0;
				} else {
					this.targetX =
						(Math.random() - 0.5) *
						CONFIG.attention.lookRanges.standard.x;
					this.targetY =
						(Math.random() - 0.5) *
						(CONFIG.attention.lookRanges.standard.y ?? 0);
				}
				nextDuration = Utils.getRange(
					CONFIG.attention.durations.standard.min,
					CONFIG.attention.durations.standard.max
				);
			}

			if (timeSinceMove > CONFIG.attention.drowsyThreshold) {
				this.targetX *= 0.2;
				this.targetY *= 0.2;
				nextDuration *= 2;
			}
		} else {
			const wantsToFocus =
				Math.random() > 1 - CONFIG.attention.focusChance;

			if (wantsToFocus) {
				this.isPayingAttention = true;
				this.updateTargetFromMouse();
				nextDuration = Utils.getRange(
					CONFIG.attention.durations.focus.min,
					CONFIG.attention.durations.focus.max
				);
			} else {
				this.isPayingAttention = false;
				this.targetX =
					(Math.random() - 0.5) *
					CONFIG.attention.lookRanges.standard.x;
				this.targetY =
					(Math.random() - 0.5) *
					(CONFIG.attention.lookRanges.standard.y ?? 0);
				nextDuration = Utils.getRange(
					CONFIG.attention.durations.distracted.min,
					CONFIG.attention.durations.distracted.max
				);
			}
		}

		this.attentionTimeout = setTimeout(
			() => this.attentionLoop(),
			nextDuration
		);
	}
}

class BlinkSystem {
	private wrapper: HTMLElement;
	private moodSystem: MoodSystem;
	private physicsSystem: PhysicsSystem;
	private timer: NodeJS.Timeout | null = null;

	constructor(
		wrapper: HTMLElement,
		moodSystem: MoodSystem,
		physicsSystem: PhysicsSystem
	) {
		this.wrapper = wrapper;
		this.moodSystem = moodSystem;
		this.physicsSystem = physicsSystem;

		this.blinkCycle();
	}

	destroy() {
		if (this.timer) clearTimeout(this.timer);
	}

	blinkCycle() {
		if (this.moodSystem.isSleeping) {
			this.timer = setTimeout(() => this.blinkCycle(), 1000);
			return;
		}

		const timeSinceMove = Date.now() - this.physicsSystem.lastMouseMoveTime;
		const isDrowsy = timeSinceMove > CONFIG.attention.drowsyThreshold;
		const isIntrigued = this.physicsSystem.movementIntensity > 200;
		const currentMood = this.moodSystem.getMood();

		let blinkSpeed = CONFIG.blink.speeds.normal;
		let closeScale = CONFIG.blink.scales.closed;
		let nextBlinkBase = CONFIG.blink.intervals.normal.base;
		let nextBlinkVariance = CONFIG.blink.intervals.normal.variance;

		if (currentMood === "is-confused")
			blinkSpeed = CONFIG.blink.speeds.confused;
		if (currentMood === "is-angry") blinkSpeed = CONFIG.blink.speeds.angry;
		if (currentMood === "is-love") blinkSpeed = CONFIG.blink.speeds.love;
		if (currentMood === "is-scared")
			blinkSpeed = CONFIG.blink.speeds.scared;

		if (isIntrigued) {
			nextBlinkBase = CONFIG.blink.intervals.intrigued.base;
			nextBlinkVariance = CONFIG.blink.intervals.intrigued.variance;
		} else if (currentMood === "is-scared") {
			nextBlinkBase = CONFIG.blink.intervals.scared.base;
			nextBlinkVariance = CONFIG.blink.intervals.scared.variance;
		} else if (isDrowsy) {
			nextBlinkBase = CONFIG.blink.intervals.drowsy.base;
			nextBlinkVariance = CONFIG.blink.intervals.drowsy.variance;

			if (Math.random() > 0.5) {
				closeScale = CONFIG.blink.scales.drowsy;
				blinkSpeed = CONFIG.blink.speeds.drowsy;
			}
		}

		this.wrapper.style.setProperty("--blink-scale", closeScale.toString());

		setTimeout(() => {
			// eslint-disable-next-line obsidianmd/no-static-styles-assignment
			this.wrapper.style.setProperty("--blink-scale", "1");
			if (
				Math.random() > 0.7 &&
				currentMood !== "is-angry" &&
				!isIntrigued
			) {
				setTimeout(() => {
					this.wrapper.style.setProperty(
						"--blink-scale",
						closeScale.toString()
					);
					setTimeout(
						// eslint-disable-next-line obsidianmd/no-static-styles-assignment
						() =>
							this.wrapper.style.setProperty(
								"--blink-scale",
								"1"
							),
						100
					);
				}, 200);
			}
		}, blinkSpeed);

		const nextBlink = Math.random() * nextBlinkVariance + nextBlinkBase;
		this.timer = setTimeout(() => this.blinkCycle(), nextBlink);
	}
}

const GEMMY_SVG = `
<svg
    class="obsidian-mascot"
    viewBox="0 0 25 25"
    xmlns="http://www.w3.org/2000/svg"
>
    <defs>
        <radialGradient id="grad-body-top" cx="30%" cy="30%" r="80%">
            <stop offset="0%" stop-color="#C4A8FF" />
            <stop offset="100%" stop-color="#A88BFA" />
        </radialGradient>
        <radialGradient id="grad-left-wing" cx="30%" cy="30%" r="80%">
            <stop offset="0%" stop-color="#A88BFA" />
            <stop offset="100%" stop-color="#8A5CF5" />
        </radialGradient>
        <radialGradient id="grad-base" cx="50%" cy="20%" r="80%">
            <stop offset="0%" stop-color="#9677FA" />
            <stop offset="100%" stop-color="#7C52FA" />
        </radialGradient>
        <radialGradient id="grad-right-side" cx="30%" cy="30%" r="80%">
            <stop offset="0%" stop-color="#B49BFA" />
            <stop offset="100%" stop-color="#9677FA" />
        </radialGradient>
    </defs>

    <!-- Body Geometry -->
    <g class="body-group">
        <!-- Facets -->
        <path
            class="facet facet-body-top"
            fill="url(#grad-body-top)"
            d="m6.91927 14.5955c.64053-.1907 1.67255-.4839 2.85923-.5565-.71191-1.7968-.88376-3.3691-.74554-4.76905.15962-1.61678.72977-2.9662 1.28554-4.11442.1186-.24501.2326-.47313.3419-.69198.1549-.30984.3004-.60109.4365-.8953.2266-.48978.3948-.92231.4798-1.32416.0836-.39515.0841-.74806-.0148-1.08657-.099-.338982-.3093-.703864-.7093-1.1038132-.5222-.1353116-1.1017-.0165173-1.53613.3742922l-5.15591 4.638241c-.28758.25871-.47636.60929-.53406.99179l-.44455 2.94723c.69903.6179 2.42435 2.41414 3.47374 4.90644.09364.2224.1819.4505.26358.6838z"
        ></path>
        <path
            class="facet facet-left-wing"
            fill="url(#grad-left-wing)"
            d="m2.97347 10.3512c-.02431.1037-.05852.205-.10221.3024l-2.724986 6.0735c-.279882.6238-.15095061 1.3552.325357 1.8457l4.288349 4.4163c2.1899-3.2306 1.87062-6.2699.87032-8.6457-.75846-1.8013-1.90801-3.2112-2.65683-3.9922z"
        ></path>
        <path
            class="facet facet-base"
            fill="url(#grad-base)"
            d="m5.7507 23.5094c.07515.012.15135.0192.2281.0215.81383.0244 2.18251.0952 3.29249.2997.90551.1669 2.70051.6687 4.17761 1.1005 1.1271.3294 2.2886-.5707 2.4522-1.7336.1192-.8481.343-1.8075.7553-2.6869l-.0095.0033c-.6982-1.9471-1.5865-3.2044-2.5178-4.0073-.9284-.8004-1.928-1.1738-2.8932-1.3095-1.60474-.2257-3.07497.1961-4.00103.4682.55465 2.3107.38396 5.0295-1.48417 7.8441z"
        ></path>
        <path
            class="facet facet-right-side"
            fill="url(#grad-right-side)"
            d="m17.3708 19.3102c.9267-1.3985 1.5868-2.4862 1.9352-3.0758.1742-.295.1427-.6648-.0638-.9383-.5377-.7126-1.5666-2.1607-2.1272-3.5015-.5764-1.3785-.6624-3.51876-.6673-4.56119-.0019-.39626-.1275-.78328-.3726-1.09465l-3.3311-4.23183c-.0117.19075-.0392.37998-.0788.56747-.1109.52394-.32 1.04552-.5585 1.56101-.1398.30214-.3014.62583-.4646.95284-.1086.21764-.218.4368-.3222.652-.5385 1.11265-1.0397 2.32011-1.1797 3.73901-.1299 1.31514.0478 2.84484.8484 4.67094.1333.0113.2675.0262.4023.0452 1.1488.1615 2.3546.6115 3.4647 1.5685.9541.8226 1.8163 2.0012 2.5152 3.6463z"
        ></path>
    </g>

    <!-- Face Group -->
    <g class="face-container">
        <!-- Eyebrows -->
        <path
            class="eyebrow eyebrow-left"
            d="M 3.8 2.5 Q 5.5 1.5 7.2 2.5"
        />
        <path
            class="eyebrow eyebrow-right"
            d="M 12.5 2.8 Q 14.5 1.8 16.5 2.8"
        />

        <!-- Eyes -->
        <g class="eye-socket" style="transform-origin: 5.5px 6.2px">
            <circle class="sclera" cx="5.5" cy="6.2" r="3" />
            <g class="pupil-group">
                <circle class="pupil" cx="5.5" cy="6.2" r="1.6" />
                <circle class="glint" cx="4.9" cy="5.5" r="0.7" />
            </g>
        </g>

        <g class="eye-socket" style="transform-origin: 14.2px 6.5px">
            <circle class="sclera" cx="14.2" cy="6.5" r="3" />
            <g class="pupil-group">
                <circle class="pupil" cx="14.2" cy="6.5" r="1.6" />
                <circle class="glint" cx="13.6" cy="5.8" r="0.7" />
            </g>
        </g>
    </g>
</svg>`;

export class GemmyMascot {
	private container: HTMLElement;
	private wrapper: HTMLElement;
	private events: EventBus;
	private speechSystem: SpeechSystem;
	private moodSystem: MoodSystem;
	private physicsSystem: PhysicsSystem;
	private blinkSystem: BlinkSystem;

	constructor(public plugin: Gemmy, container: HTMLElement) {
		this.container = container;
	}

	mount() {
		// Create wrapper
		this.wrapper = this.container.createEl("div", {
			cls: "mascot-wrapper is-hidden",
			attr: { id: "mascot" },
		});

		// Create floater container for animation separation
		const floater = this.wrapper.createEl("div", { cls: "mascot-floater" });

		this.plugin.registerEvent(
			this.plugin.app.workspace.on("layout-change", () => {
				this.events.emit("layout-change");
			})
		);

		this.plugin.registerEvent(
			this.plugin.app.vault.on("modify", () => {
				this.events.emit("file-change");
			})
		);

		this.plugin.registerEvent(
			this.plugin.app.vault.on("delete", () => {
				this.events.emit("file-change");
			})
		);

		this.plugin.registerEvent(
			this.plugin.app.vault.on("create", () => {
				this.events.emit("file-change");
			})
		);

		// Speech bubble
		floater.createEl("div", {
			cls: "speech-bubble",
			attr: { id: "speech-bubble" },
			text: "Hello!",
		});

		// Mascot body
		const mascotBody = floater.createEl("div", { cls: "mascot-body" });

		// Parse and append SVG
		const parser = new DOMParser();
		const svgDoc = parser.parseFromString(GEMMY_SVG, "image/svg+xml");
		mascotBody.appendChild(svgDoc.documentElement);

		// Initialize systems
		this.events = new EventBus();
		this.speechSystem = new SpeechSystem(
			this.wrapper.querySelector("#speech-bubble") as HTMLElement
		);
		this.moodSystem = new MoodSystem(this.wrapper, this.speechSystem);
		this.physicsSystem = new PhysicsSystem(
			this.wrapper,
			this.moodSystem,
			this.plugin
		);
		this.blinkSystem = new BlinkSystem(
			this.wrapper,
			this.moodSystem,
			this.physicsSystem
		);

		// Bind events
		this.bindEvents();
		requestAnimationFrame(() => {
			this.moodSystem.setMood("is-happy", null, false);
		});
	}

	bindEvents() {
		// --- EVENT HANDLERS ---
		this.events.on("wakeup", () => {
			this.moodSystem.setMood("is-happy");
			this.speechSystem.speak("I'm awake!", 4000);
		});

		this.events.on("layout-change", () =>
			this.moodSystem.handleEvent("layout-change")
		);
		this.events.on("file-change", () =>
			this.moodSystem.handleEvent("file-change")
		);

		this.events.on("click", () => {
			if (this.moodSystem.isSleeping) {
				this.events.emit("wakeup");
			} else {
				this.moodSystem.handleEvent("click");
			}
		});

		this.events.on("contextmenu", () =>
			this.moodSystem.handleEvent("contextmenu")
		);
		this.events.on("dblclick", () =>
			this.moodSystem.handleEvent("dblclick")
		);

		// --- DOM LISTENERS ---
		this.plugin.registerDomEvent(this.wrapper, "click", () =>
			this.events.emit("click")
		);

		this.plugin.registerDomEvent(
			this.wrapper,
			"contextmenu",
			(e: Event) => {
				e.preventDefault();
				e.stopPropagation();
				this.events.emit("contextmenu");
			}
		);

		this.plugin.registerDomEvent(this.wrapper, "dblclick", (e: Event) => {
			e.stopPropagation();
			this.events.emit("dblclick");
		});
	}

	unmount() {
		if (this.physicsSystem) this.physicsSystem.destroy();
		if (this.blinkSystem) this.blinkSystem.destroy();
		if (this.wrapper) this.wrapper.remove();
	}

	sleep() {
		if (this.moodSystem) {
			this.moodSystem.setMood("is-sleeping");
		}
	}

	hide() {
		if (this.moodSystem) {
			this.moodSystem.setMood("is-hidden");
		}
	}

	wake(mood: string = "is-happy") {
		if (this.moodSystem) {
			this.moodSystem.setMood(mood);
		}
	}

	wakeForWriting() {
		if (this.moodSystem && this.speechSystem) {
			const moods = Object.keys(WRITING_QUOTES_DB);
			const randomMood = Utils.getRandomItem(moods);
			const randomQuote = Utils.getRandomItem(
				WRITING_QUOTES_DB[randomMood]
			);

			this.moodSystem.setMood(randomMood, null, false);
			this.speechSystem.speak(randomQuote, 4000);
		}
	}

	setMood(mood: string) {
		if (this.moodSystem) {
			this.moodSystem.setMood(mood);
		}
	}
}
