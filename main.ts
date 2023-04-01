import { App, debounce, Plugin, PluginSettingTab, Setting } from 'obsidian';
import EMERGE_MOTION from './animations/gemmy_emerge.gif';
import POP_MOTION from './animations/gemmy_pop.gif';
import DISAPPEAR_MOTION from './animations/gemmy_disappear.gif';
import ANGRY_MOTION from './animations/gemmy_angry.gif';
import LOOK_MOTION from './animations/gemmy_lookAround.gif'
import IDLE_MOTION from './animations/gemmy_idle.gif'
import DISAPPOINT_IMG from './animations/gemmy_disappoint.gif'

// Remember to rename these classes and interfaces!

interface GemmySettings {
	// how often does Gemmy talk in idle mode, in minutes
	idleTalkFrequency: number;
	// the number of minutes you must write before Gemmy appears to mock you
	writingModeDeadline: number;
}

const DEFAULT_SETTINGS: GemmySettings = {
	idleTalkFrequency: 5,
	writingModeDeadline: 5
};


const GEMMY_IDLE_QUOTES = [
	"Did you know that a vault is just a folder of plain text notes?",
	"I see you're checking out a ChatGPT plugin, would you consider me instead?",
	"You have plugins that you can update!",
	"Hi I'm Gemmy! Like Clippy but shinier!",
	"Everything is connected. Everything.",
	`It looks like you’re writing a note.,

Would you like help?
- Get help with writing the note
- Just type the note without help
- [ ] Don’t show me this tip again`,
	'Can’t decide which note to work on? Try the Random Note core plugin!',
	'Are you sure you don’t want to upload all your notes just so we can chat?',
	'How tall would all your notes be if you stacked them up?',
	'Wanna teach me to say things? Find me on GitHub and open a pull request!',
	'Have you considered using Comic Sans?'
];

const WRITING_MODE_QUOTES = [
	`Is that the best you can do? Keep writing!`,
	`Write first, editor later.`,
	`I love hearing your keyboard. Don't stop.`,
	`How about we review some old notes today?`,
	`Stuck? Try journaling what happened today and see if that gives you inspiration.`,
	`Maybe it's time to go get some water or coffee.`,
	`Anything is better than a blank page, even me. Write something!`
];

const BUBBLE_DURATION = 5000;

export default class Gemmy extends Plugin {
	settings: GemmySettings;
	gemmyEl: HTMLElement;
	imageEl: HTMLElement;
	inWritingMode: boolean = false;
	idleTimeout: number;
	writingModeTimeout: number;
	appeared: boolean = false;

	async onload() {
		await this.loadSettings();

		let gemmyEl = this.gemmyEl = createDiv('gemmy-container');
		gemmyEl.setAttribute('aria-label-position', 'top');
		gemmyEl.setAttribute('aria-label-delay', '0');
		gemmyEl.setAttribute('aria-label-classes', 'gemmy-tooltip');

		let gemmyImageEl = this.imageEl = gemmyEl.createEl('img', {});

		this.addCommand({
			id: 'show',
			name: 'Show Gemmy',
			callback: () => {
				this.appear();
			}
		});

		this.addCommand({
			id: 'hide',
			name: 'Hide Gemmy',
			callback: () => {
				this.disappear();
			}
		});

		this.addCommand({
			id: 'enter-writing-mode',
			name: 'Enter writing mode',
			callback: () => {
				this.enterWritingMode();
			}
		});

		this.addCommand({
			id: 'leave-writing-mode',
			name: 'Leave writing mode',
			callback: () => {
				this.leaveWritingMode();
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new GemmySettingTab(this.app, this));

		this.gemmyEl.addEventListener('mouseenter', () => {
			if (this.inWritingMode) {
				return;
			}

			this.saySomething(GEMMY_IDLE_QUOTES, true);
			this.idleTimeout && clearTimeout(this.idleTimeout);

		});
		this.gemmyEl.addEventListener('mouseleave', () => {
			if (this.inWritingMode) {
				return;
			}

			this.imageEl.setAttribute('src', IDLE_MOTION);
			this.startNextIdleTimeout();
		});

		this.startNextIdleTimeout();

		// debounce editor-change event on workspace
		this.registerEvent(this.app.workspace.on('editor-change', debounce(() => {
			if (!this.inWritingMode) {
				return;
			}

			this.disappear();
			this.setWritingModeTimeout();
		}, 500)));
	}

	appear() {
		let { gemmyEl, imageEl } = this;

		imageEl.setAttribute('src', EMERGE_MOTION);

		// Quick if we're in writing mode
		if (this.inWritingMode) {
			imageEl.setAttribute('src', POP_MOTION);

			setTimeout(() => {
				// imageEl.setAttribute('src', DISAPPOINT_IMG);
				// setTimeout(() => {
				// imageEl.setAttribute('src', DISAPPOINT_IMG);
				this.appeared = true;

				this.saySomething(WRITING_MODE_QUOTES, true);
				// }, 1000);
			}, 1800);
		}
		else {
			imageEl.setAttribute('src', EMERGE_MOTION);

			setTimeout(() => {
				imageEl.setAttribute('src', IDLE_MOTION);
				this.appeared = true;
			}, 3800);
		}

		document.body.appendChild(gemmyEl);
		gemmyEl.show();
	}

	disappear() {
		this.idleTimeout && window.clearTimeout(this.idleTimeout);
		this.writingModeTimeout && window.clearTimeout(this.writingModeTimeout);

		this.imageEl.setAttribute('src', DISAPPEAR_MOTION);
		// remote tooltip
		this.gemmyEl.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, clientX: 10, clientY: 10 }));
		setTimeout(() => {
			this.gemmyEl.hide();
			this.appeared = false;
		}, 1300);

	}

	enterWritingMode() {
		let { gemmyEl } = this;
		this.inWritingMode = true;

		this.disappear();

		this.setWritingModeTimeout();
	}

	leaveWritingMode() {
		this.inWritingMode = false;
		this.disappear();

		window.clearTimeout(this.writingModeTimeout);
	}

	setWritingModeTimeout() {
		if (this.writingModeTimeout) {
			window.clearTimeout(this.writingModeTimeout);
		}

		this.writingModeTimeout = window.setTimeout(() => {
			if (!this.inWritingMode) {
				return;
			}

			this.appear();
		}, this.settings.writingModeDeadline * 60000);
	}

	startNextIdleTimeout() {
		// if the set time is 5 minutes, this will set timeout to be a random time between 4-6 minutes
		// the range will be 80% - 120%
		let randomFactor = 0.8 + 0.4 * Math.random();
		let randomizedTimeout = randomFactor * this.settings.idleTalkFrequency * 60000;

		if (this.idleTimeout) {
			window.clearTimeout(this.idleTimeout);
		}

		this.idleTimeout = window.setTimeout(() => {
			if (this.inWritingMode) {
				return;
			}

			this.saySomething(GEMMY_IDLE_QUOTES, false);
			this.startNextIdleTimeout();
		}, randomizedTimeout);
	}

	saySomething(quotes: string[], persistent: boolean) {
		if (!this.appeared) {
			return;
		}

		let randomThing = quotes[Math.floor(Math.random() * quotes.length)];

		this.gemmyEl.setAttr('aria-label', randomThing);
		this.gemmyEl.setAttr('aria-label-position', 'top');
		this.gemmyEl.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: 10, clientY: 10 }))

		if (this.inWritingMode) {
			this.imageEl.setAttribute('src', ANGRY_MOTION);
			setTimeout(() => {
				this.imageEl.setAttribute('src', DISAPPOINT_IMG);
			}, 1000);
		}
		else {
			this.imageEl.setAttribute('src', LOOK_MOTION);
		}

		if (!persistent) {
			setTimeout(() => {
				this.gemmyEl.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, clientX: 10, clientY: 10 }));
				this.imageEl.setAttribute('src', IDLE_MOTION);
			}, BUBBLE_DURATION);
		}
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// TODO: proper setting tab
class GemmySettingTab extends PluginSettingTab {
	plugin: Gemmy;

	constructor(app: App, plugin: Gemmy) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Idle talk frequency')
			.setDesc('How often does Gemmy speak when idle, in minutes.')
			.addSlider(slider => slider
				.setLimits(5, 60, 5)
				.setValue(this.plugin.settings.idleTalkFrequency)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.idleTalkFrequency = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Writing mode grace period')
			.setDesc('How soon Gemmy starts to get disappointed after you stop tying in writing mode, in minutes.')
			.addSlider(slider => slider
				.setLimits(5, 60, 5)
				.setDynamicTooltip()
				.setValue(this.plugin.settings.writingModeDeadline)
				.onChange(async (value) => {
					this.plugin.settings.writingModeDeadline = value;
					await this.plugin.saveSettings();
				}));
	}
}
