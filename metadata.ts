import { MarkdownRenderChild } from "obsidian";

export class Metadata extends MarkdownRenderChild {
	allFrontmatter: object;

	constructor(containerEl: HTMLElement, allFrontmatter: object) {
		super(containerEl);

		this.allFrontmatter = allFrontmatter;
	}

	onload() {
		const firstChild = this.containerEl.firstChild;
		const element = this.containerEl;
		while (element.firstChild) {
			element.removeChild(element.firstChild);
		}
		console.log("firstChild", firstChild);

		const containerEl = this.containerEl.createEl("div", {
			cls: "frontmatter-section-container",
		});

		Object.entries(this.allFrontmatter).forEach(([key, value]) => {
			let keyEl: HTMLElement;
			let valueEl: HTMLElement;
			if (key === "tags") {
				keyEl = this.containerEl.createEl("div", {
					cls: "frontmatter-section-label frontmatter-section",
					text: key,
				});
				valueEl = this.containerEl.createEl("div", {
					cls: "frontmatter-section-value frontmatter-section frontmatter-section-tags",
				});

				value.forEach((tag: string) => {
					const tagEl = this.containerEl.createEl("a", {
						text: `#${tag}`,
						cls: "tag",
						attr: { rel: "noopener", target: "_blank" },
						href: `#${tag}`,
					});
					valueEl.append(tagEl);
				});
			} else {
				keyEl = this.containerEl.createEl("div", {
					cls: "frontmatter-section-label frontmatter-section",
					text: key,
				});
				if (value.startsWith("http")) {
					valueEl = this.containerEl.createEl("div", {
						cls: "frontmatter-section-value frontmatter-section",
					});

					const aEl = this.containerEl.createEl("a", {
						text: value,
						cls: "external-link",
						attr: { rel: "noopener", target: "_blank" },
						href: value,
					});
					valueEl.append(aEl);
				} else {
					valueEl = this.containerEl.createEl("div", {
						cls: "frontmatter-section-value frontmatter-section",
						text: value,
					});
					valueEl.addEventListener("click", () => {
						// @ts-expect-error
						document.querySelector('[data-type="search"]').click();
						this.search(`"${key}: ${value}"`);
					});
				}
			}
			containerEl.append(keyEl, valueEl);
		});
		// @ts-expect-error
		this.containerEl.append(firstChild, containerEl);
	}

	search(value: string) {
		console.log(
			"el",
			document.getElementsByClassName("search-input-container")[0]
		);

		const t = document
			.getElementsByClassName("search-input-container")[0]
			.getElementsByTagName("input")[0];
		const evt = document.createEvent("HTMLEvents");
		evt.initEvent("input", true, true);
		t.value = value;
		t.dispatchEvent(evt);
	}
}
