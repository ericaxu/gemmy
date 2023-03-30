import { App, debounce, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { NORMAL_BASE64, SPEAKING_BASE64 } from 'resources';
import EMERGE_MOTION_BASE64 from './gemmy_emerge.gif';

// Remember to rename these classes and interfaces!

interface GemmySettings {
	show: boolean;
	// in minutes
	talkFrequency: number;
	// the number of minutes you must write before Gemmy appears to mock you
	writingModeDeadline: number;
}

const DEFAULT_SETTINGS: GemmySettings = {
	show: true,
	talkFrequency: 5,
	writingModeDeadline: 0.1
};


const GEMMY_IDLE_QUOTES = [
	"Did you know that a vault is just a folder of plain text notes?",
	"I see you're checking out a ChatGPT plugin, would you consider me instead?",
	"You have plugins that you can update!",
	"Hi I'm Gemmy! Like Clippy but shinier!",
	"Everything is connected. Everything.",
	`It looks like you’re writing a note.

Would you like help?
- Get help with writing the note
- Just type the note without help
- [ ] Don’t show me this tip again`,
	'Can’t decide which note to work on? Try the Random Note core plugin!',
	'Are you sure you don’t want to upload all your notes so you can talk',
	'How tall would all your notes be if you stacked them up?'
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

// TODO: use settings for these
const TALK_FREQUENCY = 5000;
const BUBBLE_DURATION = 1000;

export default class Gemmy extends Plugin {
	settings: GemmySettings;
	gemmyEl: HTMLElement;
	imageEl: HTMLElement;
	intervalId: number;
	inWritingMode: boolean = false;
	writingModeTimeout: number;
	appeared: boolean = false;

	async onload() {
		await this.loadSettings();

		// TOOD: prettier speech bubbles
		let gemmyEl = this.gemmyEl = document.body.createDiv('gemmy-container');
		gemmyEl.setAttribute('aria-label-position', 'top');
		gemmyEl.setAttribute('aria-label-delay', '0');
		gemmyEl.setAttribute('aria-label-classes', 'gemmy-tooltip');

		let gemmyImageEl = this.imageEl = gemmyEl.createEl('img', {});
		gemmyImageEl.setAttribute('src', NORMAL_BASE64);

		gemmyEl.hide();

		this.addCommand({
			id: 'gemmy:show',
			name: 'Show Gemmy',
			callback: () => {
				this.appear();
			}
		});

		this.addCommand({
			id: 'gemmy:hide',
			name: 'Hide Gemmy',
			callback: () => {
				this.disappear();
			}
		});

		this.addCommand({
			id: 'gemmy:enter-writing-mode',
			name: 'Enter writing mode',
			callback: () => {
				this.enterWritingMode();
			}
		});

		this.addCommand({
			id: 'gemmy:exit-writing-mode',
			name: 'Exit writing mode',
			callback: () => {
				this.exitWritingMode();
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new GemmySettingTab(this.app, this));

		this.gemmyEl.addEventListener('mouseenter', () => {
			if (this.inWritingMode) {
				return;
			}

			this.saySomething(GEMMY_IDLE_QUOTES, true);
			this.intervalId && clearInterval(this.intervalId);

		});
		this.gemmyEl.addEventListener('mouseleave', () => {
			if (this.inWritingMode) {
				return;
			}

			this.imageEl.setAttribute('src', NORMAL_BASE64);
			this.restartIdleInterval();
		});

		this.restartIdleInterval();

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

		imageEl.setAttribute('src', EMERGE_MOTION_BASE64);
		setTimeout(() => {
			imageEl.setAttribute('src', NORMAL_BASE64);
			this.appeared = true;

			if (this.inWritingMode) {
				this.saySomething(WRITING_MODE_QUOTES, true);
			}
		}, 4800);

		gemmyEl.show();
	}

	disappear() {
		this.gemmyEl.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, clientX: 10, clientY: 10 }));
		this.gemmyEl.hide();
	}

	enterWritingMode() {
		let { gemmyEl } = this;
		this.inWritingMode = true;

		this.disappear();

		this.setWritingModeTimeout();
	}

	exitWritingMode() {
		this.inWritingMode = false;
		this.appear();

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

	restartIdleInterval() {
		this.intervalId = this.registerInterval(window.setInterval(() => {
			if (this.inWritingMode) {
				return;
			}

			this.saySomething(GEMMY_IDLE_QUOTES, false);
		}, TALK_FREQUENCY));
	}

	saySomething(quotes: string[], persistent: boolean) {
		if (!this.appeared) {
			return;
		}

		let randomThing = quotes[Math.floor(Math.random() * quotes.length)];

		this.gemmyEl.setAttr('aria-label', randomThing);
		this.gemmyEl.setAttr('aria-label-position', 'top');
		this.gemmyEl.dispatchEvent(new MouseEvent('mouseover', { bubbles: true, clientX: 10, clientY: 10 }))
		this.imageEl.setAttribute('src', SPEAKING_BASE64);

		if (!persistent) {
			setTimeout(() => {
				this.gemmyEl.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, clientX: 10, clientY: 10 }));
				this.imageEl.setAttribute('src', NORMAL_BASE64);
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

		containerEl.createEl('h2', { text: 'Settings for my awesome plugin.' });

		// new Setting(containerEl)
		// 	.setName('Setting #1')
		// 	.setDesc('It\'s a secret')
		// 	.addText(text => text
		// 		.setPlaceholder('Enter your secret')
		// 		.setValue(this.plugin.settings.mySetting)
		// 		.onChange(async (value) => {
		// 			console.log('Secret: ' + value);
		// 			this.plugin.settings.mySetting = value;
		// 			await this.plugin.saveSettings();
		// 		}));
	}
}
