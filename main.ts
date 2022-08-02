import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import { Metadata } from "./metadata";

interface excludeKeyMap {
	[name: string]: string;
}
interface MyPluginSettings {
	excludeKeys: excludeKeyMap;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	excludeKeys: { "e3dea0f5-37f2-4d79-ae58-490af3228069": "position" },
};

export default class MetadataPrettierPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.registerMarkdownPostProcessor((element, context) => {
			const excludeKeys = Object.values(this.settings.excludeKeys);
			const allFrontmatter = context.frontmatter || {};

			const filterFrontmatter = this.filterObj(
				allFrontmatter,
				excludeKeys
			);

			const frontmatters: NodeListOf<HTMLElement> =
				element.querySelectorAll(".frontmatter-container");

			for (let index = 0; index < frontmatters.length; index++) {
				const frontmatterEl = frontmatters.item(index);
				if (!this.isEmpty(filterFrontmatter)) {
					frontmatterEl.style = "display:block";
					context.addChild(
						new Metadata(frontmatterEl, filterFrontmatter)
					);
				} else {
					frontmatterEl.style = "display:none";
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new MetadataPrettierSettings(this.app, this));
	}

	filterObj(obj: object, excludeKeys: string[]) {
		const newObj = {};
		Object.entries(obj).forEach(([key, value]) => {
			if (!excludeKeys.includes(key)) {
				newObj[key] = value;
			}
		});
		return newObj;
	}
	isEmpty(obj: object) {
		return Object.keys(obj).length === 0;
	}

	onunload() {}

	getAllFrontmatter() {
		const file = this.app.workspace.getActiveFile();
		if (!file) {
			return undefined;
		}
		const path = file.path;
		const cache = this.app.metadataCache.getCache(path);
		console.log(cache);

		return cache?.frontmatter;
	}
	uuid(): string {
		let d = Date.now();
		if (
			typeof performance !== "undefined" &&
			typeof performance.now === "function"
		) {
			d += performance.now(); //use high-precision timer if available
		}
		return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
			/[xy]/g,
			function (c) {
				const r = (d + Math.random() * 16) % 16 | 0;
				d = Math.floor(d / 16);
				return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
			}
		);
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
}

class MetadataPrettierSettings extends PluginSettingTab {
	plugin: MetadataPrettierPlugin;

	constructor(app: App, plugin: MetadataPrettierPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", {
			text: "Meta prettier - Settings",
		});

		new Setting(containerEl)
			.setName("Add new exclude Key")
			.addButton((cb) => {
				cb.setButtonText("Add");
				cb.setCta();
				cb.onClick(() => {
					this.addNewKey();
				});
			});

		// init settingtab
		for (const [uuid, language] of Object.entries(
			this.plugin.settings.excludeKeys
		)) {
			const setting = new Setting(containerEl);
			setting
				.setName("Key")
				.setDesc("")
				.addText((text) =>
					text
						.setPlaceholder("add new key")
						.setValue(language)
						.onChange(async (value) => {
							this.plugin.settings.excludeKeys[uuid] = value;
							await this.plugin.saveSettings();
						})
				);
			this.addExtraButton(setting, uuid);
		}
	}

	addNewKey() {
		const setting = new Setting(this.containerEl);
		const uuid = this.plugin.uuid();

		setting
			.setName("key")
			.setDesc("")
			.addText((text) =>
				text.setPlaceholder("add new key").onChange(async (value) => {
					this.plugin.settings.excludeKeys[uuid] = value;
					await this.plugin.saveSettings();
				})
			);

		this.addExtraButton(setting, uuid);
	}

	addExtraButton(setting: Setting, uuid: string) {
		setting.addExtraButton((cb) => {
			cb.setIcon("cross");
			cb.setTooltip("Remove");
			cb.onClick(() => {
				delete this.plugin.settings.excludeKeys[uuid];
				this.plugin.saveSettings();
				(this.plugin.app as any).commands.removeCommand(
					`${this.plugin.manifest.id}:${uuid}`
				);
				setting.settingEl.hide();
			});
		});
	}
}
