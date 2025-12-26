import { App, debounce, Plugin, PluginSettingTab, Setting } from "obsidian";
import { GemmyMascot } from "./mascot";

interface GemmySettings {
	// how often does Gemmy talk in idle mode, in minutes
	idleTalkFrequency: number;
	// the number of minutes you must write before Gemmy appears to mock you
	writingModeGracePeriod: number;
}

const DEFAULT_SETTINGS: GemmySettings = {
	idleTalkFrequency: 5,
	writingModeGracePeriod: 5,
};

export default class Gemmy extends Plugin {
	mascot: GemmyMascot;
	settings: GemmySettings;
	inWritingMode: boolean = false;
	writingModeTimeout: number;
	idleTimeout: number;

	async onload() {
		await this.loadSettings();

		this.addSettingTab(new GemmySettingTab(this.app, this));
		this.mascot = new GemmyMascot(this, document.body);
		this.mascot.mount();

		this.startNextIdleTimeout();

		this.addCommand({
			id: "show",
			name: "Show Gemmy",
			callback: () => {
				this.appear();
			},
		});

		this.addCommand({
			id: "hide",
			name: "Hide Gemmy",
			callback: () => {
				this.disappear();
			},
		});

		this.addCommand({
			id: "stealth-mode",
			name: "Stealth Mode",
			callback: () => this.mascot.hide(),
		});

		this.addCommand({
			id: "enter-writing-mode",
			name: "Enter writing mode",
			callback: () => {
				this.enterWritingMode();
			},
		});

		this.addCommand({
			id: "leave-writing-mode",
			name: "Leave writing mode",
			callback: () => {
				this.leaveWritingMode();
			},
		});

		// debounce editor-change event on workspace
		this.registerEvent(
			this.app.workspace.on(
				"editor-change",
				debounce(() => {
					if (!this.inWritingMode) {
						return;
					}

					this.disappear();
					this.setWritingModeTimeout();
				}, 500)
			)
		);
	}

	appear() {
		if (this.inWritingMode) {
			this.mascot.wakeForWriting();
		} else {
			this.mascot.wake();
		}
	}

	disappear() {
		Math.random() < 0.9 ? this.mascot.hide() : this.mascot.sleep();
		if (this.writingModeTimeout) {
			window.clearTimeout(this.writingModeTimeout);
		}
		if (this.idleTimeout) {
			window.clearTimeout(this.idleTimeout);
		}
	}

	enterWritingMode() {
		this.inWritingMode = true;
		this.disappear();
		this.setWritingModeTimeout();
	}

	leaveWritingMode() {
		this.inWritingMode = false;
		this.disappear();
		if (this.writingModeTimeout) {
			window.clearTimeout(this.writingModeTimeout);
		}
		this.startNextIdleTimeout();
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
			setTimeout(() => {
				this.setWritingModeTimeout();
			}, Math.random() * 3000 + 2000); // repeat every 2-5 seconds
		}, this.settings.writingModeGracePeriod * 1000);
	}

	startNextIdleTimeout() {
		// if the set time is 5 minutes, this will set timeout to be a random time between 4-6 minutes
		// the range will be 80% - 120%
		let randomFactor = 0.8 + 0.4 * Math.random();
		let randomizedTimeout =
			randomFactor * this.settings.idleTalkFrequency * 60000;

		if (this.idleTimeout) {
			window.clearTimeout(this.idleTimeout);
		}

		this.idleTimeout = window.setTimeout(() => {
			if (this.inWritingMode) {
				return;
			}

			this.mascot.setMood("is-happy");
			this.startNextIdleTimeout();
		}, randomizedTimeout);
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	onunload() {
		this.mascot.unmount();
	}
}

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
			.setName("Idle talk frequency")
			.setDesc("How often does Gemmy speak when idle, in minutes.")
			.addSlider((slider) =>
				slider
					.setLimits(5, 60, 5)
					.setValue(this.plugin.settings.idleTalkFrequency)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.idleTalkFrequency = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Writing mode grace period")
			.setDesc(
				"How soon Gemmy starts to get disappointed after you stop typing in writing mode, in seconds."
			)
			.addSlider((slider) =>
				slider
					.setLimits(5, 180, 5)
					.setDynamicTooltip()
					.setValue(this.plugin.settings.writingModeGracePeriod)
					.onChange(async (value) => {
						this.plugin.settings.writingModeGracePeriod = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
