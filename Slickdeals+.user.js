// ==UserScript==
// @name         Slickdeals+ (maxnl)
// @author       maxnl (fork of Slickdeals+ by V@no)
// @namespace    V@no
// @description  Various enhancements, such as ad-block, price difference and more.
// @match        https://slickdeals.net/*
// @version      26.11.13
// @license      MIT
// @homepageURL  https://github.com/maxnl/slickdealsPlus
// @supportURL   https://github.com/maxnl/slickdealsPlus/issues
// @downloadURL  https://github.com/maxnl/slickdealsPlus/releases/latest/download/Slickdeals.user.js
// @updateURL    https://github.com/maxnl/slickdealsPlus/releases/latest/download/Slickdeals.user.js
// @run-at       document-start
// @inject-into  auto
// @grant        none
// ==/UserScript==

((css, api) =>
{
"use strict";

console.log("Slickdeals+ is starting");
const VERSION = "26.11.13";
/* Display only, deliberately kept out of VERSION.
 *
 * VERSION is not just a label: resolveUrl() sends it as a path segment to the
 * third-party resolver (`api + VERSION + "/" + id`). Upstream sends a plain
 * dotted number there and we know ours is accepted, but we do not know whether
 * the service parses that segment or merely logs it - and the failure mode if
 * it parses is a silent 404 that stops every link resolving. So the fork is
 * marked here, where nothing but the menu reads it, and VERSION stays numeric.
 *
 * The other fork markers - @name and @author - are metadata only. Settings and
 * the link cache are keyed by the literals in LocalStorageName, not by script
 * identity, so renaming the script cannot orphan them. */
const FORK = "maxnl fork";
const CHANGES = `! links inside forum posts could resolve to the deal's own destination
! every cached link left its cache key on <html> as a class`;
const linksData = {}; //Object containing data for links.
const processedMarker = "℗"; //class name indicating that the element has already been processed

/**
 * A function that reads and writes data to the browser's local storage.
 * @function
 * @param {string} id - The ID of the data to read or write.
 * @param {*} [value] - The value to write to the specified ID. If not provided, the function will read the value at the specified ID.
 * @returns void
 */
const SETTINGS = (() =>
{
	const LocalStorageName = "slickdeals+";
	const LocalStorageNameLinks = LocalStorageName + "links";
	/* Upper bound on cached link resolutions. The cache had no TTL and no cap, so
	 * it grew until a quota failure forced eviction - and that path was broken
	 * until recently. Capping on write is cheaper and more predictable than
	 * relying on the failure path at all.
	 *
	 * Sizing: entries observed around 100-150 characters, and browsers account
	 * localStorage in UTF-16 code units, so budget ~2 bytes per character - about
	 * 900KB at this cap, against a typical 5MB origin quota shared with the
	 * settings blob and whatever slickdeals.net itself stores. An organically
	 * grown cache reached 566 entries, so this is generous.
	 *
	 * Eviction is FIFO, not LRU: Map preserves insertion order and re-setting an
	 * existing key does not move it, so this drops first-seen rather than
	 * least-recently-used. True LRU would cost a delete+set on every cache read,
	 * which is not worth it for destinations that rarely change. */
	const LINKS_MAX = 3000;
	// upgrade from v1.12
	const oldData = localStorage.getItem("linksCache");
	if (oldData)
	{
		localStorage.setItem(LocalStorageName, oldData);
		localStorage.removeItem("linksCache");
	}
	const sColor = "Background color";
	const defaultSettings = {
		freeOnly: { /* show free only */
			default: 0,
			name: "Free Only",
			description: "Only show free items",
		},
		diffOnly: { /* show highlighted difference only */
			default: 0,
			name: "Difference Only",
			description: "Only show highlighted price diff items",
		},
		ratingOnly: { /* show rating only */
			default: 0,
			name: "Score Only",
			description: "Only show highlighted score items",
		},
		hideSideColumn: {
			default: 0,
			name: "Hide Side Column",
			description: "Hide side column on main page (popular, trending deals, etc)",
		},
		unwrapLinks: { /* use the destination already present in the link */
			default: 1,
			name: "Unwrap tracking links",
			description: "Use the destination the link already contains\n* stays on your device, nothing is sent anywhere",
			onChange: () => updateLinks()
		},
		resolveLinks: { /* ask the 3rd party service for destinations not in the link */
			default: 1,
			name: "Resolve links",
			description: "Look up destinations that aren't in the link\n* link and page url will be sent to 3nd party service",
			onChange: () => updateLinks()
		},
		noAds: { /* remove ads */
			default: 1,
			name: "Block ads",
			description: "Block ads (require page reload)",
		},
		debug: { /* debug mode: 0 = off, 1 = on, 2 = off and hide menu */
			/* Fork change: upstream ships 2, which is off *and* hidden - the menu
			 * item only renders when SETTINGS.debug < 2, so the diagnostic that
			 * identifies an over-blocking filter is not reachable from the UI at
			 * all. 0 is equally silent but leaves the switch visible. */
			default: 0,
			name: "Debug",
			description: "Show debug messages in the console",
		},
		highlightRating: { /* highlight deals with this minimum score */
			default: 0,
			type: "number",
			name: "Highlight score ≥",
			description: "Highlight items with minimum of this score",
			min: 0,
			onChange: () => highlightCards(),
		},
		css: {
			// eslint-disable-next-line unicorn/no-null
			default: null, // null = hidden
			type: "textarea",
			name: "Custom CSS",
			description: "Add custom CSS to the page",
			onChange: () => customCSS()
		},
		colorFreeBG: {
			default: "",
			type: "color",
			description: sColor,
			onChange: () => setColors()
		},
		colorRatingBG: {
			default: "",
			type: "color",
			description: sColor,
			onChange: () => setColors()
		},
		colorDiffBG: {
			default: "",
			type: "color",
			description: sColor,
			onChange: () => setColors()
		},
		priceFirst: {
			default: 0,
			name: "Price first",
			description: "Show price before title",
		},
		showDiff: {
			default: 1,
			name: "Price difference",
			description: "Show price/percent difference between current and original prices",
		},
		highlightDiff: { /* highlight deals with this minimum price difference percent */
			default: 0,
			name: "Highlight price diff ≥",
			description: "Highlight items with minimum of this price difference percent",
			type: "number",
			min: 0,
			max: 100,
			onChange: () => highlightCards(),
		},
		version: { /* placeholder */
			default: ""
		}
	};

	const settings = new Map();
	const links = new Map();
	for(const i in defaultSettings)
		settings.set(i, defaultSettings[i].default);

	try
	{
		const data = JSON.parse(localStorage.getItem(LocalStorageName));
		for(const i in data)
			settings.set(i, data[i]);
	}
	catch{}
	const isLink = /^\d/;
	try
	{
		const data = JSON.parse(localStorage.getItem(LocalStorageNameLinks));
		for(const i in data)
		{
			if (isLink.test(i))
				links.set(i, data[i]);
		}
		/* An existing cache can already be over the cap, and trimming only on
		 * write would leave it oversized until something new resolves. */
		while (links.size > LINKS_MAX)
			links.delete(links.keys().next().value);
	}
	catch{}
	/**
	 * Compares two version strings and returns -1, 0, or 1
	 * depending on whether the first version is less than, equal to, or greater than the second version.
	 *
	 * @function
	 * @see {@link https://jsfiddle.net/vanowm/p7uvtbor/ jsFiddle}
	 * @param {string} a - The first version string to compare.
	 * @param {string} b - The second version string to compare.
	 * @returns {number} -1 if a < b,
	 *                    0 if a == b,
	 *                    1 if a > b.
	 */
	const compareVersion = ((prep, length, i, result) =>
		(a, b) =>
		{
			a = prep(a);
			b = prep(b);
			length = Math.max(a.length, b.length);
			i = 0;
			result = i;
			while (!result && i < length)
				result = ~~a[i] - ~~b[i++];

			if (result < 0)
				return -1;

			return result ? 1 : 0;
		})(t => ("" + t)
		.replace(/[^\d.]+/g, c => "." + (c.replace(/[\W_]+/, "").toUpperCase().charCodeAt() - 65_536) + ".")
		.replace(/(?:\.0+)*(\.-\d+(?:\.\d+)?)\.*$/g, "$1")
		.split("."));

	const previousVersion = settings.get("version");
	const updated = !GM_info.isIncognito && previousVersion !== VERSION;
	if (updated && previousVersion)
	{
		//show debug option only if it was manually enabled in previous version
		if (compareVersion(previousVersion, "1.18.3") < 0)
		{
			/* `settings` is a Map: `settings.debug = …` set an own property that
			 * nothing ever reads, so this upgrade silently did nothing. Every
			 * other branch in this block already uses get/set. */
			settings.set("debug", settings.get("debug") ? 1 : 2);
		}
		if (compareVersion(previousVersion, "1.15") < 0 && settings.has("resolvedClick"))
		{
			settings.set("resolveLinks", settings.get("resolvedClick"));
		}
		if (compareVersion(previousVersion, "23.10.4-205802") < 0)
		{
			if (settings.get("css") === "")
				// eslint-disable-next-line unicorn/no-null
				settings.set("css", null);

			if (settings.has("thumbsUp"))
				settings.set("highlightRating", settings.get("thumbsUp"));

		}
		if (compareVersion(previousVersion, "23.12.3-012211") < 0)
		{
			for(const [id,value] of settings)
			{
				if (isLink.test(id))
					links.set(id, value);
			}
		}
		/* Changing the default alone would reach nobody: existing installs have 2
		 * stored, so the menu item stays hidden for exactly the people who
		 * already have the script. Promote a stored 2 to 0 once - both mean
		 * "logging off", so this only reveals the switch, it never starts
		 * logging. A deliberate 1 is left alone. */
		if (compareVersion(previousVersion, "26.9.4") < 0 && settings.get("debug") === 2)
			settings.set("debug", 0);
	}
	/* clean up old/invalid settings */
	for(const [id] of settings)
	{
		if (!Object.prototype.hasOwnProperty.call(defaultSettings, id))
			settings.delete(id);
		else if (defaultSettings[id].default !== null && typeof settings.get(id) !== typeof defaultSettings[id].default)
			settings.set(id, defaultSettings[id].default);
	}

	settings.set("version", VERSION);
	/**
	 * Initializes the user's settings by adding the appropriate class names to the HTML element.
	 * @function
	 * @returns {void}
	 */
	const settingsInit = () =>
	{
		const elHtml = document.documentElement;
		if (!elHtml)
			return document.addEventListener("DOMContentLoaded", settingsInit);

		for(const i in defaultSettings)
		{
			if (i === "version")
				continue;

			const value = settings.get(i);
			elHtml.classList.toggle(i, !!value);
			// elHtml.dataset[i] = value;
		}

		elHtml.classList.toggle("updated", updated);
		if (!updated || !previousVersion)
			return;

		// notification popup
		const elPopup = document.createElement("div");
		elPopup.textContent = GM_info.script.name + " updated from v" + previousVersion + " to v" + VERSION;
		elPopup.className = "sdp-updated";
		elPopup.addEventListener("click", () =>
		{
			const elMenu = document.querySelector(".sdp-menu");
			const elFooter = elMenu.querySelector(".footer");
			elFooter.click();
			elMenu.firstElementChild.focus();
		});
		const onClick = () =>
		{
			window.removeEventListener("click", onClick, true);
			elPopup.remove();
		};
		window.addEventListener("click", onClick, true);
		if (!document.body)
			return document.addEventListener("DOMContentLoaded", () =>
			{
				document.body.append(elPopup);
			});

		document.body.append(elPopup);
	};
	settingsInit();

	/**
	 * Returns a read-only proxy object that retrieves the value of a specific key from the default settings object.
	 *
	 * @param {string} key - The key to retrieve from the default settings object.
	 * @returns {Object} - A read-only proxy object that retrieves the value of the specified key from the default settings object.
	 */
	const settingsGetData = key => new Proxy(defaultSettings, {
		get: (target, name) => Reflect.get(target[name], key),
		set: () => true, //read-only
	});

	/**
	 * Resets all settings to their default values, except for the version number.
	 * @function
	 * @name settingsReset
	 */
	const settingsReset = () =>
	{
		for(const i in defaultSettings)
		{
			if (i !== "version")
				settings.set(i, defaultSettings[i].default);
		}

		settingsSave();
	};
	const defaultKeys = Object.keys(defaultSettings);
	/**
	 * Object containing various settings commands for the Slickdeals+ script.
	 * @typedef {Object} SettingsCommands
	 * @property {*} $default - The default value for the setting.
	 * @property {string} $type - The type of the setting.
	 * @property {string} $name - The name of the setting.
	 * @property {string} $description - The description of the setting.
	 * @property {*} $min - The minimum value for the setting.
	 * @property {*} $max - The maximum value for the setting.
	 * @property {function} $onChange - The function to be called when the setting is changed.
	 * @property {*} $keys - The default keys for the setting.
	 * @property {function} $reset - The function to reset the setting to its default value.
	 */
	const settingsCommands = {
		$default: settingsGetData("default"),
		$type: settingsGetData("type"),
		$name: settingsGetData("name"),
		$description: settingsGetData("description"),
		$min: settingsGetData("min"),
		$max: settingsGetData("max"),
		$onChange: settingsGetData("onChange"),
		$keys: defaultKeys,
		$links: new Proxy(links, {
			get: (target, name) => target.get(name),
			set: () => true, //read-only
		}),
		$reset: () => settingsReset()
	};
	let timer;
	let timeout;

	/**
	 * Saves the data in the cache to the browser's local storage.
	 * @function
	 * @param {number} [attempt=0] - The number of times the function has attempted to save the data.
	 */
	const settingsSave = (attempt = 0) =>
	{
		clearTimeout(timeout);
		const now = Date.now();
		if (timer + 300 > now)
		{
			timeout = setTimeout(() => settingsSave(attempt), 300);
			return;
		}
		try
		{
			// try save settings, if it fails, remove previous items until it succeeds
			localStorage.setItem(LocalStorageName, JSON.stringify(Object.fromEntries(settings)));
			localStorage.setItem(LocalStorageNameLinks, JSON.stringify(Object.fromEntries(links)));
		}
		catch
		{
			/* The inner do…while here ran the iterator to exhaustion and then
			 * deleted `undefined`, so every pass freed exactly nothing and the
			 * handler recursed up to 10,000 times against an unchanged cache. */
			if (links.size === 0)
				return; //nothing of ours left to free; the quota failure is not ours to fix

			//removing in batches exponentially
			for(let i = 0, keys = links.keys(), count = ++attempt ** 2; i < count; i++)
			{
				//Map.keys() yields insertion order, so this evicts oldest-first
				const key = keys.next().value;
				if (key === undefined)
					break;

				links.delete(key);
			}

			if (attempt < 10_000)
				return settingsSave(attempt);

		}
		timer = now;
	};

	if (updated)
		settingsSave();

	/**
	 * Gets or sets a setting value and updates the UI accordingly.
	 * @param {string} id - The ID of the setting to get or set.
	 * @param {*} [value] - The value to set the setting to. If not provided, the current value of the setting is returned.
	 * @returns {boolean|*} - Returns `true` if the setting was successfully set, otherwise returns the current value of the setting.
	 */
	const settingsFunction = (id, value) =>
	{
		const storageData = isLink.test(id) ? links : settings;
		if (value === undefined)
			return storageData.get(id);

		/* Only the link cache can be deleted from, and only with an explicit
		 * null - a destination that turns out to belong to a different link has
		 * to go, or it is read back and reapplied on every page load. Settings
		 * are untouched by this: `css` is legitimately stored as null. */
		if (storageData === links && value === null)
		{
			if (!links.delete(id))
				return false;

			settingsSave();
			return true;
		}

		storageData.set(id, value);
		//trim oldest-first so the cache cannot grow past the cap
		while (storageData === links && links.size > LINKS_MAX)
			links.delete(links.keys().next().value);

		if (defaultSettings[id]?.onChange instanceof Function)
			defaultSettings[id].onChange(value);

		/* Settings only. This ran for every id, so each resolved link left a
		 * `0…crc` cache key on <html> as a class - one per link, for the life of
		 * the page, nothing reading them. settingsInit() has always iterated
		 * `defaultSettings` rather than the stored data, so the startup path
		 * never had this problem and no setting depends on the link branch: the
		 * test is the same `isLink` routing that chose `storageData` above, and
		 * every settings key begins with a letter. */
		if (storageData === settings)
			document.documentElement.classList.toggle(id, !!value);

		settingsSave();
		return true;
	};
	return new Proxy((id, value) => settingsFunction(id, value),
		{
			get: (target, id) =>
			{
				if (Object.prototype.hasOwnProperty.call(settingsCommands, id))
					return settingsCommands[id];

				return target(id);

			},
			set: (target, id, value) => target(id, value)
		});
})();

/**
 * Creates a shallow copy of an object.
 *
 * @param {Object} object - The object to be cloned.
 * @returns {Object} - The cloned object.
 */
const CLONE = object => Object.assign({}, object);

/**
 * A function that does nothing and returns undefined.
 * @returns {undefined}
 */
const fVoid = () => {};

/**
 * Logs debug information to the console if debug mode is enabled.
 * @function
 * @property {function} trace - Outputs a stack trace to the console.
  * @param {...*} args - The arguments to log to the console.
 */
const debug = Object.assign(SETTINGS.debug === 1 ? console.log.bind(console) : fVoid
	, {trace: console.trace.bind(console)});
const debugPrefix = "%cSlickdeals+ ";

/**
 * Converts input into a string and trims whitespace.
 * @function
 * @param {string} t - The string to trim.
 * @returns {string} The trimmed string.
 */
const trim = t => ("" + t).trim();

/*------------[ ad blocking ]------------*/
/**
 * This code block defines a function that blocks ads on a webpage.
 * It overrides the `setAttribute`, `fetch`, and `open` methods to intercept requests and block ads if necessary.
 * It also overrides the specified properties and methods of a prototype to intercept requests and block ads if necessary.
 * The function checks if the `isNoAds` setting is enabled and if the element's `src` or `href` attribute matches an ad pattern.
 * If it does, the element is removed from the DOM.
 * The function also intercepts `fetch` and `XMLHttpRequest` requests and returns a 403 response if an ad is detected.
 * @function
 * @param {HTMLElement} parent - The HTML element to check for ads.
 * @returns {void}
 */
const noAds = (() =>
{
	const isNoAds = SETTINGS.noAds;
	const setAttributeProperty = Object.getOwnPropertyDescriptor(Element.prototype, "setAttribute");
	Object.defineProperty(Element.prototype, "setAttribute", Object.assign(Object.assign({}, setAttributeProperty), {
		value: function (name, value)
		{
			if (isNoAds && (name === "src" && (this instanceof HTMLScriptElement
											|| this instanceof HTMLIFrameElement
											|| this instanceof HTMLImageElement))
						|| (name === "href" && this instanceof HTMLLinkElement))
			{
				const blocked = isNoAds ? isAds(value) : false;

				if (blocked)
				{
					debug(debugPrefix + (blocked ? "blocked" : "allowed") + "%c " + name,
						colors[~~blocked],
						colors[(this.tagName.toLowerCase() || "") + name],
						CLONE(isAds.result),
						value,
						this);

					this.remove();
					return;
				}
			}
			setAttributeProperty.value.call(this, name, value);
			if (name !== "href" || !(this instanceof HTMLAnchorElement))
				return;

			if (this._hrefResolved && this.href !== this._hrefResolved && this.href !== this._hrefOrig)
				linkUpdate(this, this.href, true);
			else if (SETTINGS.resolveLinks && !this.classList.contains("overlayUrl"))
				processLinks([this], true);
		},
	}));

	if (!isNoAds)
		return fVoid;

	const fetch = window.fetch;
	const open = XMLHttpRequest.prototype.open;

	/**
	 * Overrides the `fetch` method to intercept requests and block ads if necessary.
	 */
	window.fetch = function (...args)
	{
		const blocked = isNoAds ? isAds(args[0]) : false;
		if (blocked)
		{
			debug(debugPrefix + (blocked ? "blocked" : "allowed") + "%c fetch",
				colors[~~blocked],
				colors.fetch,
				CLONE(isAds.result),
				args,
			);

			return Promise.resolve(new Response("", {status: 403, statusText: "Blocked"}));
		}
		return Reflect.apply(fetch, this, args);
	};

	/**
	 * Overrides the `open` method of `XMLHttpRequest` to intercept requests and block ads if necessary.
	 */
	XMLHttpRequest.prototype.open = function (...args)
	{
		const blocked = isNoAds ? isAds(args[1]) : false;
		if (blocked)
		{
			debug(debugPrefix + (blocked ? "blocked" : "allowed") + "%c XHR",
				colors[~~blocked],
				colors.xhr,
				CLONE(isAds.result),
				args,
			);

			this.send = this.abort;
		}
		Reflect.apply(open, this, args);
	};

	/**
	 * Overrides the specified properties of a prototype to intercept requests and block ads if necessary.
	 * @function
	 * @param {Object} prototype - The prototype to override.
	 * @param {(string|string[])} aName - The name(s) of the property to override.
	 */
	const setProperty = (prototype, aName) =>
	{
		if (!Array.isArray(aName))
			aName = [aName];

		for (let i = 0; i < aName.length; i++)
		{
			const name = aName[i];
			const property = Object.getOwnPropertyDescriptor(prototype, name);

			Object.defineProperty(prototype, name, {
				get ()
				{
					return property.get.call(this);
				},
				set (value)
				{
					const _isNoAds = isNoAds && !this.closest(".dealCard");
					const isSource = name === "src";
					/* blockText patterns are meant for script/iframe payloads. Applying them to
					 * every innerHTML/outerHTML assignment silently drops legitimate markup:
					 * the old front page's Quick View HTML (/ajax/getDeal.php, inserted via
					 * jQuery .after() -> buildFragment -> innerHTML) carries
					 * facebook_url="...utm_source=facebook" on the vote widget, which matches
					 * /facebook/ and kills the whole insertion with no error, so deals never
					 * expand. Only run the text filter on markup that can actually execute. */
					const skipCheck = !isSource
						&& typeof value === "string"
						&& !/<\s*(?:script|iframe)\b/i.test(value);
					const blocked = _isNoAds && !skipCheck ? isAds(isSource ? value : undefined, isSource ? undefined : value) : false;
					if (blocked)
					{
						debug(debugPrefix + (blocked ? "blocked" : "allowed") + " %c" + (isSource ? this.tagName.toLowerCase() + " " : "") + name,
							colors[~~blocked],
							colors[(name === "src" ? this.tagName.toLowerCase() : "") + name],
							CLONE(isAds.result),
							value,
							this
						);

						return;
					}
					property.set.call(this, value);
				},
				enumerable: property.enumerable || true,
				configurable: property.configurable || true
			});
		}
	};

	/**
	 * Returns a function that intercepts requests and blocks ads if necessary.
	 * @function
	 * @param {string} name - The name of the function.
	 * @param {Function} _function - The function to intercept.
	 * @returns {Function} The intercepted function.
	 */
	const getPrototypeFunction = (name, _function) => function (...args)
	{
		if (isNoAds && (args[0] instanceof HTMLImageElement
						|| args[0] instanceof HTMLScriptElement
						|| args[0] instanceof HTMLIFrameElement
						|| args[0] instanceof HTMLLinkElement))
		{
			for(let i = 0; i < args.length; i++)
			{
				const node = args[i];
				if (!node)// || (i && node instanceof HTMLHeadElement))
					continue;

				const blocked = isAds(node.src || node.href, node.innerHTML);

				if (blocked)
				{
					debug(debugPrefix + (blocked ? "blocked" : "allowed") + "%c DOM_" + name,
						colors[~~blocked],
						colors.dom,
						CLONE(isAds.result),
						node,
						this,
					);
					node.remove();
					args.splice(i--, 1);
				}
			}
		}
		try
		{
			return Reflect.apply(_function, this, args);
		}
		catch(error)
		{
			/* A bare catch here meant that when a patched DOM method threw, the
			 * page broke with no console output at all. Combined with the
			 * innerHTML setter returning silently when it blocks, that is the
			 * single biggest reason the Quick View bug took so long to isolate.
			 * debug() is fVoid unless SETTINGS.debug === 1, so this costs nothing
			 * when logging is off. */
			debug(debugPrefix + "%cDOM_" + name + " failed",
				colors[1],
				colors.dom,
				error,
				args,
				this
			);
		}
	};

	/**
	 * Overrides the specified methods of a prototype to intercept requests and block ads if necessary.
	 * @function
	 * @param {Object} prototype - The prototype to override.
	 * @param {Object} names - An object containing the names of the methods to override.
	 */
	const setPrototype = (prototype, names) =>
	{
		for (let i = 0; i < names.length; i++)
		{
			const name = names[i];
			const property = Object.getOwnPropertyDescriptor(prototype, name);
			Object.defineProperty(prototype, name, {
				value: getPrototypeFunction(name, prototype[name]),
				enumerable: property.enumerable || true,
				configurable: property.configurable || true
			});
		}
	};
	setProperty(Element.prototype, ["innerHTML", "outerHTML"]);
	setProperty(HTMLScriptElement.prototype, "src");
	setProperty(HTMLIFrameElement.prototype, "src");
	setProperty(HTMLImageElement.prototype, "src");
	setProperty(HTMLLinkElement.prototype, "href");
	setProperty(HTMLAnchorElement.prototype, "href");
	setPrototype(Element.prototype, [
		"append",
		"prepend",
		"after",
		"before",
		"replaceWith",
		"replaceChildren",
		"insertAdjacentElement"
	]);
	setPrototype(Node.prototype, [
		"replaceChild",
		"insertBefore",
		"appendChild"
	]);

	// allow* supersedes block*
	const list = {
		allowUrlFull: new Set([]),

		/* Intentionally empty. A /:\/\/slickdeals\.net\// entry lived here, but
		 * check() tests it against a bare hostname ("slickdeals.net"), which can
		 * never contain "://" - so it never matched and first-party requests have
		 * always been filtered like any other. Deleting it makes that explicit.
		 * Repairing it instead would be a real loosening: allowHostname is checked
		 * before every block list, so first-party URLs matching /click\./,
		 * /analytic/, /adsystem/ and /\/ad-\// would start being allowed through. */
		allowHostname: [],
		allowUrl: [
			/google\.com\/recaptcha\//,
			/fonts\.googleapis\.com/,
			// /accounts\.google\.com\//
			// /.*/,
		],
		allowText: [
			/vue\.createssrapp/i,
			/frontpagecontroller/i, //Personalized Frontpage
			/^\(window\.vuerangohooks = window\.vuerangohooks/i, //See expired deals
			/SECURITYTOKEN/, //voting
			/__NUXT__/,
			// /.*/,
		],

		blockUrlFull: new Set([
			"/ad-stats/1/ad-events",
			"https://v.clarity.ms/collect"
		]),
		blockHostname: [
			/google/,
			/videoplayerhub/i,
			/btttag/,
			/schemaapp\.com/,
		],
		blockUrl: [
			/\/providerv/,
			/\/ad-\//,
			/\.ad\./,
			/\/ads(srvr|\/)/,
			/\.quantcount/,
			/btttag/,
			/connect\.facebook/,
			/heapanalytics/,
			/click\./,
			/adsystem/,
			/bat\.bing/,
			/\.clarity\./,
			/hamburger\./,
			/liadm\.com/,
			/analytic/,
			/adsafe/,
			/pinterest\.com/,
			/s\.pinimg\.com/,
			/s\.yimg\.com/,
			/doubleclick/,
			/google\.com/,
			/clicktrue/
		],
		blockText: [
			/[.:-]ads(loader|[.:-])/i,
			/google\.com/,
			/facebook/,
			/heapanalytics/,
			/demdex/,
			/\.geq/,
			// /hydration/, //kills pagination
			/qualtrics/,
			/adsrvr\./,
			/announcementBar/ //top banner
		],
	};

	const colors = {
		0: "color:green", //allowed
		1: "color:red", //blocked
		fetch: "color:cyan",
		xhr: "color:#88f",
		script: "color:orange",
		scriptsrc: "color:orange",
		iframe: "color:#08f",
		iframesrc: "color:#08f",
		imgsrc: "color:#0f8",
		linkhref: "color:#0f8",
		dom: "color:#576",
		innerHTML: "color:#357",
		outerHTML: "color:#056",
		tracker: "color:#656",
	};

	/**
	 * Checks if the given text matches any of the regular expressions in the specified type's list.
	 * @function
	 * @param {string} text - The text to check.
	 * @param {string} type - The type of list to check against.
	 * @returns {boolean} True if the text matches any of the regular expressions in the list, false otherwise.
	 */
	const check = (text, type) =>
	{
		for(let i = 0, regex = list[type]; i < regex.length; i++)
		{
			const match = regex[i].exec(text);
			if (!match)
				continue;

			isAds.result.result = match;
			isAds.result.type = type;
			isAds.result.filter = regex[i];
			return true;
		}
		return false;
	};

	/**
	 * Determines if a URL or text content is an advertisement.
 	 * @function
	 * @param {string} url - The URL to check.
	 * @param {string} textContent - The text content to check.
	 * @returns {boolean} Whether the URL or text content is an advertisement.
	 */
	const isAds = Object.assign((_url, textContent) =>
	{
		let hostname = "";
		const url = _url instanceof Request ? _url.url : _url;
		try
		{
			hostname = url ? new URL(url).hostname : "";
		}
		catch
		{
			try
			{
				hostname = new URL(location.protocol + "//" + location.host + url).hostname;
			}
			catch(error)
			{
				debug.trace(url, error);
			}
		}
		const result = Object.assign(isAds.result, {filter: "", result: "", type: ""});

		if (list.allowUrlFull.has(url))
		{
			result.filter = url;
			result.result = url;
			result.type = "allowUrlFull";
			return false;
		}

		if (list.blockUrlFull.has(url))
		{
			result.filter = url;
			result.result = url;
			result.type = "blockUrlFull";
			return true;
		}

		if (hostname)
		{

			if (check(hostname, "allowHostname"))
				return false;

			if (check(url, "allowUrl"))
				return false;

			if (check(hostname, "blockHostname"))
				return true;

			if (check(url, "blockUrl"))
				return true;
		}
		if (check(textContent, "allowText"))
			return false;

		if (check(textContent, "blockText"))
			return true;

		result.result = "";
		result.filter = "";
		result.type = "";
		return false;
	}, {result: {filter:"", result: "", type: ""}});

	return parent =>
	{
		const nodes = [parent, ...parent.querySelectorAll("script,iframe,link,img")];
		for(let i = 0; i < nodes.length; i++)
		{
			const node = nodes[i];
			isAds.result.result = "";
			isAds.result.filter = "";
			isAds.result.type = "";
			if (node instanceof HTMLIFrameElement)
			{
				if (node.src && isAds(node.src))
				{
					debug(debugPrefix + "blocked%c iframe" + (isAds.result.type === "blockText" ? "" : " src"),
						colors[1],
						colors.iframe,
						CLONE(isAds.result),
						node.src,
						node
					);
					node.remove();
					continue;
				}
				// debug(debugPrefix + "allowed%c iframe", colors[0], colors.iframe, node.src, CLONE(isAds.result), node);
			}
			else if (node instanceof HTMLScriptElement && node.type !== "application/json")
			{
				const url = node.src;
				const textContent = node.textContent;
				if (isAds(url, textContent))
				{
					debug(debugPrefix + "blocked%c script" + (isAds.result.type === "blockText" ? "" : " src"),
						colors[1],
						colors.script,
						CLONE(isAds.result),
						url,
						[node],
						textContent,
					);
					node.remove();
					continue;
				}
				// debug(debugPrefix + "allowed%c script", colors[0], colors.script, url, textContent, CLONE(isAds.result));
			}
			else if (node instanceof HTMLLinkElement || node instanceof HTMLImageElement)
			{
				/* HTMLImageElement has no `href` property, so the old `node.href` test
				 * was always undefined and images were never swept here. That is the
				 * gap the innerHTML text-filter gate opens: a tracking pixel injected
				 * as markup is no longer caught by blockText, and this sweep - the
				 * remaining line of defence - skipped every img. Images carry the URL
				 * on `src`; link elements still use `href`. */
				const url = node.src || node.href;
				if (url && isAds(url))
				{
					debug(debugPrefix + "blocked%c tracker" + (isAds.result.type === "blockText" ? "" : " src"),
						colors[1],
						colors.tracker,
						CLONE(isAds.result),
						url,
						node
					);
					node.remove();
					continue;
				}
			}

			if (!node.matches)
				continue;

			if (node.matches(".ablock,.adunit"))
			{
				if (node.parentElement.matches(".subBoxContent"))
					node.parentElement.parentElement.remove();

				node.parentElement.remove();
			}
			else if (node.matches("[data-role=rightRailBanner],[class*=bannerAd],[class*=Banner],[class*=ad-],[class*=contentAd],[data-adlocation],[class*=_leftAd],[class*=_rightAd]"))
			{
				if (node.parentElement.matches(".searchPage__main") && node.matches("[class*=Banner]"))
					setTimeout(() => node.remove(), 0);
				else
					node.remove();
			}
		}
	};
})();
noAds(document);

const style = document.createElement("style");
style.innerHTML = css;
if (document.head)
	document.head.append(style);

// if (document.head)
// 	noAds(document.head);

// if (document.body)
// 	noAds(document.body);

/*------------[ end ad blocking ]------------*/

/**
 * Initializes the Slickdeals+ menu.
 * @function
 * @param {HTMLElement} elNav - The navigation element to use as the menu container.
 */
const initMenu = elNav =>
{
	if (initMenu._inited)
		return;

	/* _inited used to be set before this check, so the retry scheduled below hit
	 * the guard above and returned immediately: the "wait for the header to
	 * finish rendering" path never retried even once, and a nav that was not yet
	 * populated simply never got a menu. Claim _inited only when actually
	 * building. _pending stops the MutationObserver, which fires repeatedly
	 * during render, from stacking a timer per call. */
	if (elNav.children.length < 4 && --initMenu.counter)
	{
		if (!initMenu._pending)
		{
			initMenu._pending = true;
			setTimeout(() =>
			{
				initMenu._pending = false;
				initMenu(elNav);
			}, 0);
		}
		return;
	}
	initMenu._inited = true;

	/**
	 * Creates a menu item for a user setting.
	 * @function
	 * @param {string} id - The ID of the setting to create a menu item for.
	 * @returns {Element} The menu item element.
	 */
	const createMenuItem = (id, options = {}) =>
	{
		const type = SETTINGS.$type[id];
		const label = SETTINGS.$name[id];
		const description = SETTINGS.$description[id];
		const elStyle = document.createElement("style");
		const types = {
			text : "input",
			color : "input",
			number : "input",
			textarea : "textarea",
			checkbox : "a",
			radio : "a"
		};
		const elSetting = document.createElement(types[type] || "a");
		const elLi = elLiDefault.cloneNode(true);
		let elLabelBefore;
		let elLabelAfter;
		const events = {};
		switch (type)
		{
			case "number": {
				elSetting.value = SETTINGS(id);
				elSetting.type = "number";
				elSetting.min = SETTINGS.$min[id] || 0;
				elSetting.step = 1;
			//only allow positive round numbers
				events.keypress = evt =>
				{
					if (evt.charCode < 48 || evt.charCode > 57)
					{
						evt.preventDefault();
						evt.stopPropagation();
					}
				};
				events.input = () => SETTINGS(id, ~~elSetting.value);
				if (SETTINGS.$max[id] !== undefined)
				{
					elSetting.max = SETTINGS.$max[id];
					const length_ = ("" + elSetting.max).length;
					elSetting.style.width = (length_ * 2) + "ch";
				}

				elLabelBefore = document.createElement("span");
				elLabelBefore.textContent = label;
				elLi.classList.add("input");

				break;
			}
			case "text": {
				elSetting.type = "text";
				elSetting.value = SETTINGS(id);
				elLabelBefore = document.createElement("span");
				elLabelBefore.textContent = label;
				elLi.classList.add("input");
				let timer;
				events.input = () =>
				{
					clearTimeout(timer);
					timer = setTimeout(() => SETTINGS(id, elSetting.value.trim()), 500);
				};

				break;
			}
			case "color": {
				// elSetting.type = "color";
				const settingValue = SETTINGS(id);
				if (settingValue)
				{
					elSetting.value = settingValue;
					elSetting.type = "color";
				}
				else
				{
					elSetting.type = "_color";
					elSetting.placeholder = "default color";
					elSetting.disabled = true;
				}

				if (label)
				{
					elLabelBefore = document.createElement("span");
					elLabelBefore.textContent = label;
				}
				elLi.classList.add("input");
				const elColorClose = $$("colorClose") || document.createElement("span");
				if (!elColorClose.parentNode)
				{
					elColorClose.id = "colorClose";
					elColorClose.addEventListener("mousedown", evt =>
					{
						evt.preventDefault();
						evt.stopPropagation();
						document.body.classList.remove("colorClose");
					});
					elUl.prepend(elColorClose);
				}
				events.click = () =>
				{
					document.body.classList.add("colorClose");
				};
				elLabelAfter = document.createElement("label");
				elLabelAfter.setAttribute("for", id);
				elLabelAfter.classList.add("reset");
				elLabelAfter.title = "Reset to default";
				const resetHide = state => elLabelAfter.classList.toggle("hidden", state);
				events.reset = evt =>
				{
					evt.preventDefault();
					evt.stopPropagation();
					if (evt.isTrusted)
						SETTINGS(id, "");

					elSetting.value = setColors.get(id);
					elSetting.type = "color";
					elSetting.disabled = false;
					elSetting.dataset.default = elSetting.value;
					resetHide(SETTINGS(id) === "");
				};
				elLabelAfter.addEventListener("click", events.reset);
				let timer;
				events.input = () =>
				{
					clearTimeout(timer);
					let value = elSetting.value.trim();
					if (elSetting.dataset.default === value)
						value = "";

					resetHide(value === "");

					timer = setTimeout(() => SETTINGS(id, value), 500);
				};
				resetHide(SETTINGS(id) === "");
				break;
			}
			case "textarea": {
				elSetting.setAttribute("autocorrect", "false");
				elSetting.setAttribute("spellcheck", "false");

				elLabelBefore = document.createElement("div");
				elLabelBefore.textContent = label;
				elSetting.value = SETTINGS(id);
				events.input = () => SETTINGS(id, elSetting.value.trim());

				break;
			}
			default: { //checkbox
				elSetting.value = SETTINGS(id);
				elSetting.textContent = label;
				events.click = () => SETTINGS(id, ~~!SETTINGS(id));
				events.keypress = evt =>
				{
					if (evt.key === " " || evt.key === "Enter")
					{
						evt.preventDefault();
						evt.stopPropagation();
						SETTINGS(id, ~~!SETTINGS(id));
					}
				};
				elStyle.textContent = `html.${id} #${id}::before{content:"☑";}`;
				elSetting.classList.add("slickdealsHeaderDropdownItem__link");
			}
		}
		options = Object.assign({events}, options);

		for(const eventType in options.events)
		{
			elSetting.addEventListener(eventType, options.events[eventType]);
		}
		// elSetting.value = SETTINGS(id);
		elSetting.id = id;
		elSetting.setAttribute("tabindex", 0);
		if (dataset)
			elSetting.dataset[dataset] = "";

		elLi.classList.add(id);
		elLi.title = description;

		if (options.labelBefore)
		{
			if (!elLabelBefore)
				elLabelBefore = document.createElement("span");

			elLabelBefore.textContent = options.labelBefore;
		}
		if (elLabelBefore)
			elLi.append(elLabelBefore);

		elLi.append(elSetting);

		if (options.labelAfter)
		{
			if (!elLabelAfter)
				elLabelAfter = document.createElement("span");

			elLabelAfter.textContent = options.labelAfter;
		}
		if (elLabelAfter)
			elLi.append(elLabelAfter);

		document.head.append(elStyle);
		return elLi;
	};//createMenuItem

	const elMenu = elNav.lastElementChild.cloneNode(true);
	initMenu.elMenu = elMenu;
	datasets.__target.push(elMenu.dataset, elMenu.querySelector(".slickdealsHeader__navItemText").dataset);
	initMenu.elHeader = elNav;
	const elHeader = elNav.closest("header");
	const elOverlay = document.createElement("div");
	initMenu.elOverlay = elOverlay;
	for (const i in elMenu.dataset)
	{
		if (/^v-\d|^v[A-F]/.test(i))
			elOverlay.dataset[i] = elMenu.dataset[i];
	}
	initMenu.elOverlay.className = "slickdealsHeader__overlay";

	elMenu.classList.add("sdp-menu");
	elMenu.dataset.qaHeaderDropdownButton = "slickdeals-plus";
	elMenu.querySelector("p").textContent = "Slickdeals+";
	const elUl = elMenu.querySelector("ul");
	const elButton = elMenu.querySelector("div[role='button']");

	elButton.addEventListener("focus", () => elHeader.after(elOverlay), true);
	elButton.addEventListener("blur", () => elOverlay.remove(), true);
	elMenu.addEventListener("mousedown", evt =>
	{
		const isMenu = evt.target === elButton || evt.target.parentElement === elButton;
		const isMenuOpen = (document.activeElement.closest(".sdp-menu > div[role='button']") || {}) === elButton;

		if (isMenu && isMenuOpen)
		{
			evt.preventDefault();
			evt.stopPropagation();
			elOverlay.click();
		}
	});
	elOverlay.addEventListener("click", () =>
	{
		elButton.focus();
		elButton.blur();
		elOverlay.remove();
	});
	const loading = document.documentElement.dataset.loading;

	elUl.dataset.qaHeaderDropdownList = "slickdeals-plus";
	const elLiDefault = elUl.querySelector("li").cloneNode(true);
	/* Blueprint's li carries the page's Vue scope attribute, and the fallback host
	 * supplies data-v-1 for the same reason. If a future layout ships neither this
	 * was undefined, and every `dataset[dataset] = ""` below then wrote a literal
	 * data-undefined attribute onto the menu. Guard the writes instead. */
	const dataset = Object.keys(elLiDefault.firstElementChild.dataset)[0];
	elUl.innerHTML = "";
	elLiDefault.innerHTML = "";
	elNav.append(elMenu);

	const elFreeOnly = createMenuItem("freeOnly");
	elFreeOnly.append(createMenuItem("colorFreeBG"));
	elUl.append(elFreeOnly);
	elUl.append(createMenuItem("unwrapLinks"));
	const elMenuItem = createMenuItem("resolveLinks");
	if (loading)
	{
		elMenu.dataset.loading = loading;
		elMenuItem.dataset.loading = loading;
	}
	elUl.append(elMenuItem);
	elUl.append(createMenuItem("priceFirst"));
	elUl.append(createMenuItem("showDiff"));
	// elUl.append(createMenuItem("diffOnly"));
	const elHighlightDiff = createMenuItem("highlightDiff", {labelAfter: "%"});
	elHighlightDiff.append(createMenuItem("colorDiffBG"));
	elUl.append(elHighlightDiff);
	// elUl.append(createMenuItem("ratingOnly"));
	const elHighlightRating = createMenuItem("highlightRating");
	elHighlightRating.append(createMenuItem("colorRatingBG"));
	elUl.append(elHighlightRating);
	elUl.append(createMenuItem("noAds"));
	elUl.append(createMenuItem("hideSideColumn"));
	if (SETTINGS.debug < 2)
		elUl.append(createMenuItem("debug"));

	if (SETTINGS.css !== null)
	{
		elUl.append(createMenuItem("css", {
			events: {
				input: evt =>
				{
					clearTimeout(customCSS.timeout);
					customCSS.timeout = setTimeout(() =>
					{
						SETTINGS.css = evt.target.value;
					}, 1000);
				},
				keydown: evt =>
				{
					if (evt.key !== "Tab")
						return;

					const target = evt.target;
					evt.preventDefault();
					let start = target.selectionStart;
					const end = target.selectionEnd;
					target.value = target.value.slice(0, start)	+ "\t" + target.value.slice(end);
					target.selectionStart = ++start;
					target.selectionEnd = start;
				}
			}
		}));
	}

	const elFooter = document.createElement("label");
	elFooter.className = "slickdealsHeaderDropdownItem footer";
	elFooter.setAttribute("for", "sdpChanges");
	elFooter.dataset.label = "v" + VERSION + " · " + FORK;
	elFooter.title = "Changes";
	if (dataset)
		elFooter.dataset[dataset] = "";


	const elFooterCheckbox = document.createElement("input");
	elFooterCheckbox.id = "sdpChanges";
	elFooterCheckbox.type = "checkbox";

	const elChanges = document.createElement("span");
	elChanges.className = "changes";
	const changes = CHANGES.split("\n");
	const types = {
		"!": "fixed",
		"*": "changed",
		"+": "added",
		"-": "removed",
		"#": "comment",
		"?": "help"
	};
	for(let i = 0, elDiv = document.createElement("div"); i < changes.length; i++)
	{
		if (changes[i] === "")
			continue;

		const type = types[changes[i][0]] ? changes[i][0] : "+";
		const className = types[type];
		const text = changes[i][0] === type ? changes[i].slice(1) : " " + changes[i];
		elDiv = elDiv.cloneNode(false);
		elDiv.className = className;
		if (className)
			elDiv.title = className[0].toUpperCase() + className.slice(1);

		elDiv.textContent = text;
		elChanges.append(elDiv);
	}

	const elChangesLink = document.createElement("a");
	elChangesLink.className = "changesLink";
	elChangesLink.href = "https://github.com/maxnl/slickdealsPlus/commits/master";
	elChangesLink.target = "_blank";
	elChangesLink.textContent = "more";

	elChanges.append(elChangesLink);
	elUl.append(elFooterCheckbox, elFooter, elChanges);
	if (document.readyState === "complete")
		setColors.update();
	else
		document.addEventListener("readystatechange", () =>
		{
			if (document.readyState === "complete")
				setColors.update();
		}, false);
};
initMenu.counter = 1000;

/**
 * Set dataset values to multiple elements at once.
 *
 * @type {Proxy}
 */
const datasets = new Proxy([document.documentElement.dataset], {
	get: (target, property) => (property === "__target" ? target : target[0][property]),
	set: (target, property, value) =>
	{
		for(let i = 0; i < target.length; i++)
			target[i][property] = value;

		return true;
	},
	deleteProperty: (target, property) =>
	{
		for(let i = 0; i < target.length; i++)
		{
			if (property in target[i])
				delete target[i][property];
		}

		return true;
	}
});

/**
 * Returns the first element that is a descendant of node that matches selectors.
 * @function
 * @param {string} id - The ID of the element to find.
 * @param {HTMLElement} node - The root node to search for the element.
 * @param {boolean} all - Whether to return all elements that match the selector.
 * @returns {HTMLElement|NodeList} The first element that matches the selector, or a NodeList of all elements that match the selector.
 */
const $$ = (id, node, all) =>
{
	try
	{
		if (!node)
			node = document;

		if (!all && /\w/.test(id[0]))
		{
			/* getElementById exists on Document, not on Element. Scoped to an
			 * element this threw, and the bare catch below turned that into a
			 * silent undefined - a lookup that looks like it simply found nothing.
			 * No current caller passes a bare word with an element, so this is a
			 * trap for the next edit rather than a live bug. An id selector is
			 * what the caller meant either way. */
			return node.getElementById
				? node.getElementById(id)
				: node.querySelector("#" + CSS.escape(id));
		}

		if (all)
			return node.querySelectorAll(id);

		return node.querySelector(id);
	}
	catch
	{}
};

const setColors = (ids =>
{
	const elHidden = document.createElement("div");
	elHidden.style.display = "none";
	for(let i = 0; i < ids.length; i++)
	{
		const elColor = document.createElement("div");
		elColor.className = ids[i];
		elHidden.append(elColor);
	}
	document.addEventListener("DOMContentLoaded", () => document.body.append(elHidden), false);
	return Object.assign(() =>
	{
		for(let i = 0; i < ids.length; i++)
		{
			const id = ids[i];
			const value = SETTINGS(id);
			if (value === "" || value === undefined)
				document.body.style.removeProperty("--" + id);
			else
				document.body.style.setProperty("--" + id, value);

		}
	},
	{
		get: id => getComputedStyle(elHidden.querySelector("." + id))
			.getPropertyValue("--backgroundColor"),

		update: () =>
		{
			for(let i = 0; i < ids.length; i++)
			{
				const id = ids[i];
				//only trusted reset event triggers the reset, otherwise it simply updates the color
				$$(id).dispatchEvent(new Event("reset"));
			}
		},
	});
})(["colorFreeBG", "colorRatingBG", "colorDiffBG"]);

/**
 * Builds a host with the DOM shape initMenu() expects, for the classic layout
 * (/, /deals/, /f/*, /coupons/, /blog/, /newsearch.php), which has no Blueprint
 * header to clone from. Lets initMenu() run unmodified.
 *
 * Three constraints, all load-bearing:
 * - at least 4 children. initMenu() sets _inited before testing
 *   `children.length < 4`, so its deferred retry returns immediately and a
 *   smaller host would never build a menu at all.
 * - a <header> ancestor. initMenu() does elNav.closest("header") and calls
 *   .after() on it; closest() matches self, so the host is the header.
 * - data-v-1, not a friendlier name. fixCSS() resolves the script's own
 *   [data-v-ID] selectors by matching dataset keys against /^v([A-F]|-\d)/,
 *   and "v-1" is the shape that satisfies it.
 * @returns {HTMLElement} the element to hand to initMenu()
 */
const createFallbackMenuHost = () =>
{
	const elHost = document.createElement("header");
	elHost.className = "sdp-fallbackHost";
	elHost.innerHTML = "<span></span><span></span><span></span>"
		+ "<div class=\"slickdealsHeader__dropdown\" data-v-1=\"\">"
		+ "<div role=\"button\" tabindex=\"0\">"
		+ "<p>Slickdeals+</p>"
		+ "<span class=\"slickdealsHeader__navItemText\" data-v-1=\"\"></span>"
		+ "</div>"
		+ "<ul data-v-1=\"\"><li class=\"slickdealsHeaderDropdownItem\"><a data-v-1=\"\"></a></li></ul>"
		+ "</div>";

	return elHost;
};

/**
 * Mounts the settings menu, preferring the Blueprint header and falling back to
 * the classic top bar. On the classic layout the button is placed immediately
 * left of the avatar/username cluster.
 * @returns {void}
 */
const mountMenu = () =>
{
	if (initMenu.elMenu)
		return;

	const elNav = $$(".slickdealsHeader__hamburgerDropdown .slickdealsHeader__linkSection");
	if (elNav)
		return initMenu(elNav);

	const elBar = $$("top_userbar");
	if (!elBar)
		return;

	/* The avatar sits just left of the username block, so it - not the username -
	 * is the anchor that puts the button left of the whole cluster. Whichever
	 * comes first in document order wins, so this survives them being reordered. */
	const elUser = elBar.querySelector(".username.user_dd, #user_account_trigger");
	const elAvatar = elBar.querySelector("img[src*='useravatar']");
	let elAnchor = elUser && elAvatar
		? (elAvatar.compareDocumentPosition(elUser) & Node.DOCUMENT_POSITION_FOLLOWING ? elAvatar : elUser)
		: (elUser || elAvatar);

	/* Climb out of inline wrappers so the button is never nested inside the
	 * profile <a> - a focusable div inside a link breaks both. */
	while (elAnchor
		&& elAnchor.parentElement
		&& elAnchor.parentElement !== elBar
		&& /^(?:A|SPAN|B|I|EM|STRONG|LABEL|FONT)$/.test(elAnchor.parentElement.tagName))
		elAnchor = elAnchor.parentElement;

	const elHost = createFallbackMenuHost();
	if (elAnchor && elAnchor.parentNode)
		elAnchor.parentNode.insertBefore(elHost, elAnchor);
	else
		/* logged out: no avatar or username to anchor to */
		(elBar.querySelector(".top_userbar_container") || elBar).append(elHost);

	initMenu(elHost);
	/* fixCSS() may already have run for this page; re-resolve so the menu's own
	 * [data-v-ID] rules bind to the host's data-v-1 instead of dead-ending. */
	fixCSS();
};

mountMenu();

/**
 * MutationObserver callback function that tracks changes in the DOM.
 * @function
 * @param {MutationRecord[]} mutations - An array of MutationRecord objects representing the changes in the DOM.
 */
new MutationObserver(mutations =>
{
	for (let i = 0; i < mutations.length; i++)
	{
		for (let n = 0; n < mutations[i].addedNodes.length; n++)
		{
			const node = mutations[i].addedNodes[n];

			if (!node.classList)
				continue;

			// remove ads
			if (SETTINGS.noAds && !node.closest(".dealCard"))
				noAds(node);

			//have we already processed this node?
			if (node.classList.contains(processedMarker))
				continue;

			// create menu and attach to the header
			if (node.matches(".slickdealsHeader__hamburgerDropdown .slickdealsHeader__linkSection"))
			{
				initMenu(node);
				continue;
			}
			processCards(node);
			processLinks(node);
		}
		// for some reason attached menu is being removed...reattach it back if necessary
		for(let n = 0; n < mutations[i].removedNodes.length; n++)
		{
			if (mutations[i].removedNodes[n] === initMenu.elMenu)
				initMenu.elHeader.append(initMenu.elMenu);

		}
	}
}).observe(document, {
	subtree: true,
	childList: true
});

/**
 * Divides a price by a specified divider and formats it as a string with a dollar sign and two decimal places.
 * @function
 * @param {string} _text - The text to prepend to the formatted price.
 * @param {string} divider - The value to divide the price by.
 * @param {string} price - The price to divide and format.
 * @returns {string} The formatted price with the specified text prepended to it.
 */
const priceDivide = (_text, divider, price) => "$" + (Number.parseFloat(price.replace(/,/g, "") / Number.parseFloat(divider))).toFixed(2);

/**
 * Extracts pricing information from a given node and its children.
 * @function
 * @param {HTMLElement|NodeList} node - The root node or NodeList to search for pricing information.
 * @param {boolean} [force=false] - Whether to force processing of already processed items.
 * @returns void
 */
const processCards = (node, force) =>
{
	const processed = force ? "" : ":not(." + processedMarker + ")";
	const nlItems = node instanceof NodeList
		? node
		: $$(	`.salePrice${processed},` +
				`.itemPrice${processed},` +
				`.price${processed},` + //search
				`.bp-p-dealCard_price${processed},` + // https://slickdeals.net/deals/watches/
				`.dealCard__price${processed},` +
				`.dealDetailsMainDesktopBlock__finalPrice${processed},` +
				`.dealPrice${processed},` +
				/* Classic layout. Its price carries no class at all - it is a bare
				 * <b> inside <span class="dealblocktext"><strong>. The shipping line
				 * ("+ Free S/H") is a sibling <b> in the same <strong>, and it must
				 * not be picked up: rePriceFree below is /free/, so "+ Free S&H"
				 * would flag every free-shipping deal as a free item, and being the
				 * later match it would win. Every card surveyed puts the price in
				 * the first <b> of a single <strong>, so :first-of-type is exact. */
				`.dealblocktext strong > b:first-of-type${processed}`
		, node, true) || [];

	if (nlItems.length === 0)
		return;

	const rePrice = /^[\s\w]*~?\$/;
	const rePriceFrom = /^(?:from\s)?(\d+)\sfor\s\$?([\d,.]+)/g;
	const rePriceCommas = /,/g;
	const rePriceTrim = /[\s\w]*~?\$([\d,.]+)(?:\s.*)?/;
	const rePriceFree = /free/;
	const rePricePrice = /^[\s\w]*~?\$([\d,.]+)/;
	const rePriceOff = /(?:\$?([\d,.]+))?\soff(?:\s\$?([\d,.]+))?$/;
	for (let i = 0; i < nlItems.length; i++)
	{
		const elPrice = nlItems[i];
		elPrice.title = elPrice.textContent;
		let elParent = elPrice.parentNode;
		const price = trim(elPrice.textContent).toLowerCase();
		let priceNew = Number.NaN;
		if (price)
		{
			if (price === "free")
				priceNew = 0;
			else if (rePrice.test(price))
			{
				priceNew = Number.parseFloat(price
					.replace(rePriceFrom, priceDivide) // 2 for $10
					.replace(rePriceTrim, "$1") // remove everything after first number ($xx off $yy)
					.replace(rePriceCommas, "")); // remove commas
			}

		}
		const elPriceRetail = $$(".retailPrice", elParent);
		const elPriceOld = $$(".oldListPrice, .dealCard__originalPrice, .bp-p-dealCard_originalPrice, .dealDetailsMainDesktopBlock__listPrice", elParent);
		// make sure price element is in it's own wrapper
		if (elParent.matches(".bp-c-card_content, .dealDetailsPriceInfo"))
		{
			const elWrapper = document.createElement("div");
			elWrapper.className = "cardPriceInfo";
			elWrapper.append(elPrice);
			if (elPriceOld)
				elWrapper.append(elPriceOld);

			if (elPriceRetail)
				elWrapper.append(elPriceRetail);

			elParent.prepend(elWrapper);
			elParent = elWrapper;
		}
		const priceRetail = Number.parseFloat(trim((elPriceRetail || {}).textContent)
			.replace(rePricePrice, "$1")
			.replace(rePriceCommas, ""));

		const priceOld = Number.parseFloat(trim((elPriceOld || {}).textContent)
			.replace(rePricePrice, "$1")
			.replace(rePriceCommas, ""));

		const off = price.match(rePriceOff);
		const priceOrig = Number.parseFloat(off && off[2]);
		const priceBase = priceRetail || priceOld || priceOrig;
		if (priceBase && off)
			priceNew = priceBase - priceNew;

		const priceFree = price && price.match(rePriceFree) || priceNew === 0;
		const priceDifference = priceBase - priceNew;
		const priceDealPercent = Math.round(priceDifference * 100 / priceBase);
		/* div.dealitem is the classic layout's card. Nothing here matched it, and
		 * its ancestors are div/td/tr with no li anywhere, so closest("li") missed
		 * too - which left elCard null and silently disabled the free and
		 * price-difference highlighting on those pages, not just the score. */
		const elCard = elParent.closest(
			"li," +
			"div[data-type='fpdeal']," +
			"div.resultRow," +
			"div[data-role='frontpageDealContent']," +
			"div.dealitem"
		);

		if (!Number.isNaN(priceDealPercent))
		{
			const diff = priceDifference.toFixed(2).replace(/\.00$/, "");
			elParent.dataset.dealDiff = diff;
			elParent.dataset.dealPercent = priceDealPercent;
			if (elCard)
			{
				elCard.dataset.dealDiff = diff;
				elCard.dataset.dealPercent = priceDealPercent;
			}
			elParent.title = "Save $" + diff + " (" + priceDealPercent + "%)";
		}
		elPrice.classList.add(processedMarker);

		if (elCard)
		{
			elCard.classList.toggle("free", priceFree);
			highlightCards(elCard);
		}
	}
};

/**
 * Highlights the cards with a certain number of votes.
 * @function
 * @param {NodeList|Element} node - The node or NodeList to search for cards.
 * @returns {void}
 */
/**
 * Reads a vote count as rendered on the page.
 *
 * parseInt handles the leading "+" of the classic layout's "+75", but stops at
 * the first non-digit: a thousand-plus count shown as "1,234" reads as 1, and a
 * "1.2k" also reads as 1. That would silently mis-score exactly the deals with
 * the most votes - the ones highlighting is for. No count above 999 has been
 * observed, so the grouped and abbreviated forms are precautionary.
 * @function
 * @param {string} text - The element's text, e.g. "+75", "1,234", "1.2k".
 * @returns {number} the count, or NaN if there is no number in it
 */
const parseVotes = text =>
{
	const match = /^\s*\+?\s*([\d,.]+)\s*([km])?/i.exec(text || "");
	if (!match)
		return Number.NaN;

	const value = Number.parseFloat(match[1].replace(/,/g, ""));
	if (!match[2] || Number.isNaN(value))
		return value;

	return Math.round(value * (match[2].toLowerCase() === "k" ? 1000 : 1_000_000));
};

const highlightCards = node =>
{
	let nlItems;
	if (node instanceof NodeList)
		nlItems = node;
	else if (node instanceof Element)
		nlItems = [node];
	else
		nlItems = $$(	"li.frontpageGrid__feedItem," + //front page
						"li.carousel__slide," + // front page carousel
						"li.categoryPageDealGrid__feedItem," + // https://slickdeals.net/deals/
						"li.bp-p-dealCard," + // https://slickdeals.net/deals/watches/
						"div.resultRow," + //search result
						"div.dealitem" //classic layout, both #deal_list and #deal_list_featured
		, node, true);

	if (nlItems.length === 0)
		return;

	const highlightDiff = SETTINGS.highlightDiff;
	for(let i = 0; i < nlItems.length; i++)
	{
		const elCard = nlItems[i];
		const elVotes = elCard.querySelector(
			".dealCardSocialControls__voteCount," + //front page
			".bp-p-votingThumbsPopup_voteCount," + // https://slickdeals.net/deals/watches/
			".ratingCol.stats>.num," + //search result
			".ratingCol>.ratingNum," + //search result
			".fp_votebar>.rating" //classic layout, renders as "+75"
		);
		if (elVotes && elVotes.textContent !== "")
		{
			const votes = parseVotes(elVotes.textContent);
			elCard.classList.toggle("highlightRating", SETTINGS.highlightRating && votes > 0 && votes >= SETTINGS.highlightRating);
		}
		if (elCard.dataset.dealPercent)
		{
			const dealPercent = ~~elCard.dataset.dealPercent;
			elCard.classList.toggle("highlightDiff", highlightDiff && dealPercent >= highlightDiff);
		}
	}
};

/**
 * Fixes links on a given node by replacing the href with a new URL based on the deal ID and type.
 * @function
 * @param {HTMLElement|NodeList} node - The root node or NodeList to search for links to fix.
 * @param {boolean} [force=false] - Whether to force processing of already processed links.
 * @returns {void}
 */
const processLinks = (node, force) =>
{
	const processed = force ? "" : `:not(.${processedMarker})`;
	const nlLinks = node instanceof NodeList || Array.isArray(node) ? node : $$(`a:not([href=""])${processed}:not(.overlayUrl)`, node, true) || [];
	for(let i = 0; i < nlLinks.length; i++)
	{
		const elLink = nlLinks[i];

		if (!elLink.href || (elLink._hrefResolved && !force))
			continue;

		elLink.classList.add(processedMarker);
		// const {id, type} = getUrlInfo(elLink.href) || {};
		const urlObject = new URL(elLink.href);
		/* Two keys, deliberately. `id` is what the resolver is addressed with and
		 * what its response is XOR'd with, so it has to be the shape the service
		 * recognises. `key` is ours: it is collision-free per link, which `id` is
		 * not, and it is what the local cache and the link grouping use. */
		const id = getUrlId(urlObject);
		if (!id)
			continue;

		const key = getCacheKey(urlObject);
		const queryObject = new URLSearchParams(urlObject.search);
		if (!elLink._elHover)
		{
			const elHover = document.createElement("a");
			elHover.classList.add(processedMarker, "overlayUrl", "hidden");
			elHover.title = "Original link";
			elHover.target = elLink.target;
			elLink._elHover = elHover;
			elLink.append(elHover);
		}
		elLink._hrefOrig = elLink.href;
		elLink._elHover.href = elLink.href;
		// const u2 = elLink.href.match(/(?:\?|&(?:amp;)?)u2=([^#&]*)/i);
		/* URLSearchParams.get() already percent-decodes. The decodeURIComponent()
		 * that wrapped this decoded a second time: a destination carrying %2520
		 * collapsed to a literal space, and one carrying a bare % threw URIError.
		 * That throw was uncaught and propagated out of the loop, so a single deal
		 * linking to something like ".../100%" aborted link processing for every
		 * remaining link - the same failure shape as the return-vs-continue bug.
		 * Leftover from when u2 was extracted with a regex, which did hand back
		 * the raw encoded value and so needed decoding. */
		let url = queryObject.has("u2") ? queryObject.get("u2") : SETTINGS(key);

		const aLinks = linksData[key] || [elLink];
		const isInited = aLinks.resolved !== undefined;
		if (isInited)
		{
			/* Drop links that have left the document. Nothing else ever removed
			 * entries here, so every anchor the script had seen stayed referenced
			 * for the life of the page - detached nodes included, kept alive by
			 * this array alone - and updateLinks() walked all of them. Infinite
			 * scroll and in-page navigation replace cards constantly. */
			for (let n = aLinks.length - 1; n >= 0; n--)
			{
				if (!aLinks[n].isConnected)
					aLinks.splice(n, 1);
			}
			if (!aLinks.includes(elLink))
				aLinks.push(elLink);
		}
		else
		{
			aLinks.resolved = false;
			linksData[key] = aLinks;
		}

		// if (!elLink._hrefResolved)
		// {
		// 	elLink.classList.add("alert");
		// }
		if (url)
		{
			if (Array.isArray(url))
				url = url[0];

			/* Record where this destination came from, so the two settings can
			 * govern their own path. A u2 value is read straight out of the link
			 * and costs nothing; anything else came from the resolver, either just
			 * now or from the cache - only resolver responses are ever written to
			 * it, so the distinction stays clean. */
			const isLocal = queryObject.has("u2");
			/* u2 is the destination the link carries, so there is nothing to check
			 * it against and nothing to gain by trying. A cached one came from the
			 * resolver and can be an id collision that was written before this
			 * check existed, so drop it rather than keep handing it out - leaving
			 * it in place would keep the wrong destination on this link forever. */
			if (!isLocal && !isDestinationPlausible(urlObject, url))
			{
				debug(debugPrefix + "%ccached destination discarded, wrong site for this link",
					"color:red",
					"color:#656",
					key,
					elLink.href,
					url
				);
				// eslint-disable-next-line unicorn/no-null
				SETTINGS(key, null);
				url = "";
			}
			else
			{
				elLink._hrefLocal = isLocal;
				aLinks.resolved = true;
				linkUpdate(elLink, url, force);
				continue;
			}
		}
		/* `return` here aborted the whole loop, so as soon as two links on a page
		 * shared an id every remaining link went unprocessed. */
		if (isInited && !force)
			continue;

		elLink.classList.add("notResolved");
		if (!SETTINGS.resolveLinks)
			continue;

		if (datasets.loading === undefined)
			datasets.loading = 0;

		datasets.loading++;
		/* Count requests in flight for this group, so updateLinks() can tell a
		 * group that is merely still waiting from one that has finished and has
		 * nothing left to show. See the reclaim condition there. */
		aLinks.pending = (aLinks.pending || 0) + 1;

		/**
		 * Resolves a URL
		 * @function
		 * @param {string} id - The ID of the deal to resolve.
		 * @param {string} url - The URL to resolve.
		 * @returns {Promise<Object>} A Promise that resolves to an object containing the resolved URL and other data.
		 */
		resolveUrl(id, elLink._hrefOrig)
			.then(response =>
			{
				if (!response || response instanceof Response || response.byteLength === 0)
					throw new Error("URL not resolved " + (response instanceof Response ? response.headers.get("error") : "")/* + " id:" + id + " original:" + elLink._hrefOrig*/);

				response = new Uint8Array(response);
				const k = new TextEncoder().encode(id);
				const r = new Uint8Array(response.length)
					.map((_, i) => response[i] ^ response[i - 1] ^ k[i % k.length]);

				response = new TextDecoder().decode(r.slice(r.indexOf(0) + 1));
				// console.log(id, response);
				try
				{
					if (!/^https?:\/\//.test(response))
						return;

					/* The service answers an ambiguous id with one destination for
					 * every link that shares it. Neither cache nor apply it when
					 * the link itself says it goes somewhere else: the link keeps
					 * its original href and stays notResolved, which is what it
					 * would do if the service had no answer at all. */
					if (!isDestinationPlausible(urlObject, response))
					{
						debug(debugPrefix + "%cresolved destination discarded, wrong site for this link",
							"color:red",
							"color:#656",
							id,
							elLink._hrefOrig,
							response
						);
						return response;
					}

					SETTINGS(key, response);
					for(let i = 0; i < aLinks.length; i++)
						linkUpdate(aLinks[i], response);

					aLinks.resolved = true;
				}
				catch(error)
				{
					/* A decode or link-update failure used to vanish here, leaving
					 * the link silently unresolved with no way to tell why.
					 * Literal styles, not the `colors` map - that is scoped inside
					 * the noAds IIFE and unreachable here, and debug()'s arguments
					 * evaluate eagerly, so referencing it would throw inside the
					 * error handler itself even with logging off. */
					debug(debugPrefix + "%cresolve failed",
						"color:red",
						"color:#656",
						error,
						id,
						response
					);
				}
				return response;
			})
			.finally(() =>
			{
				aLinks.pending--;
				if (!--datasets.loading)
					delete datasets.loading;

			})
			.catch(error =>
			{
				/* console.error, so every link the service could not resolve printed
				 * a red stack trace. That is not an error condition: a page carries
				 * hundreds of links, plenty of them are not resolvable, and the
				 * outcome is already visible - the link keeps its original href and
				 * its notResolved class. The noise buried the failures that do
				 * matter and made the console useless for diagnosing anything else.
				 *
				 * Route it through debug() like every other diagnostic here: silent
				 * unless Debug is ticked, and identical in shape to the inner
				 * handler above, including the literal styles (the colors map is
				 * scoped inside the noAds IIFE and unreachable from here). */
				debug(debugPrefix + "%cresolve failed",
					"color:red",
					"color:#656",
					error,
					id,
					elLink._hrefOrig
				);
			});
	}
};

/**
 * Updates a link with a new URL and styling to indicate that it has been resolved.
 * @function
 * @param {HTMLAnchorElement} elA - The link to update.
 * @param {string} url - The new URL to set on the link.
 * @returns {void}
 */
const linkUpdate = (elA, url, update) =>
{
	// elA.classList.remove("alert");
	if (elA._hrefResolved && !update)
		return;

	if (url)
		elA._hrefResolved = url;

	elA.classList.toggle("notResolved", !elA._hrefResolved);
	const elHover = elA.querySelector("a.overlayUrl");
	/* Destinations read out of the link itself are governed by unwrapLinks;
	 * destinations obtained from the third-party service by resolveLinks. Keeping
	 * them separate is the point: unwrapping is free and private, resolving is
	 * neither, and previously one switch turned off both. */
	if ((elA._hrefLocal ? SETTINGS.unwrapLinks : SETTINGS.resolveLinks) && elA._hrefResolved)
	{
		if (elHover)
		{
			elHover.title = "Original link";
			elHover.href = elA._hrefOrig;
			elHover.classList.remove("hidden");
		}
		elA.href = elA._hrefResolved;
		elA.classList.add("resolved");
		elA.classList.remove("tracked");
	}
	else
	{
		if (elHover)
		{
			elHover.classList.toggle("hidden", !elA._hrefResolved);
			elHover.title = "Resolved link";
			elHover.href = elA._hrefResolved;
		}
		elA.href = elA._hrefOrig;
		elA.classList.add("tracked");
		elA.classList.remove("resolved");
	}
	// a.title = a._hrefResolved;
};

/**
 * Updates links on the page based on the current settings.
 * If resolveLinks is enabled, it processes all unresolved links on the page.
 * Otherwise, it updates all links in the linksData object.
 */
const updateLinks = () =>
{
	if (SETTINGS.resolveLinks)
	{
		const nlList = $$(".notResolved", document.body, true);
		if (nlList.length > 0)
			processLinks(nlList, true);
	}
	for(const id in linksData)
	{
		const aLinks = linksData[id];
		//iterate backwards so pruning does not skip the next entry
		for(let i = aLinks.length - 1; i >= 0; i--)
		{
			if (aLinks[i].isConnected)
				linkUpdate(aLinks[i], undefined, true);
			else
				aLinks.splice(i, 1);
		}
		/* Never while a request is in flight: it still holds this array in its
		 * closure, and re-creating it underneath would split the group in two.
		 * Otherwise the entry is finished with - either it resolved, in which case
		 * the destination survives in the cache and a later link with this id just
		 * re-reads it, or it failed and nothing is coming.
		 *
		 * Testing `resolved` alone was the leak: a group whose resolution failed
		 * never sets it, so once its links left the page the emptied array stayed
		 * in linksData for the life of the tab and this loop kept walking it.
		 * Infinite scroll replaces cards constantly, so those accumulate. */
		if (aLinks.length === 0 && !aLinks.pending)
			delete linksData[id];
	}
};

/**
 * Resolves a given URL by fetching data from the Slickdeals API and updating all links with the same deal ID.
 * @function
 * @param {string} id - The ID of the deal to resolve.
 * @param {string} type - The type of the deal to resolve.
 * @param {string} url - The URL to resolve.
 * @returns {Promise} A Promise that resolves with the data returned from the Slickdeals API.
 */
const resolveUrl = (id, url) => fetch(api + VERSION + "/" + id, {method: "SD", body: JSON.stringify([url,location.href]), referrerPolicy: "unsafe-url"})
	.then(r => r && r.ok && r.arrayBuffer() || r)
	.catch(fVoid);

/**
* Extracts the ID and type of a deal from a given URL.
 * @function
 * @param {string} url - The URL to parse.
 * @returns {string} - ID of the resource
 */
const getUrlId = (() =>
{
	const ids = ["pno", "sdtid", "tid", "pcoid", "lno"];
	const count = ids.length;
	return urlObject =>
	{
		if (urlObject.hostname !== "slickdeals.net")
			return false;

		const queryObject = new URLSearchParams(urlObject.search);

		let id = "";
		for (let i = 0; i < count; i++)
		{
			const key = ids[i];
			if (queryObject.has(key))
				id += queryObject.get(key) + key;
		}
		/* This value is not ours to choose. It is sent to the resolver as a path
		 * segment and is the key the response is XOR'd with, and the service only
		 * recognises ids in this exact shape - measured: the upstream id returns
		 * 200 with a body, while a differently-derived id for the same link and
		 * the same version returns 404 with error 7.122. Redefining it, as an
		 * earlier change did to make it collision-free, silently broke every
		 * resolution. Collision-freedom now lives in getCacheKey() instead.
		 *
		 * An empty id also means "nothing to resolve here", which is what keeps
		 * ordinary navigation off the resolver. */
		if (/^\d+lno$/.test(id) || id === "" && urlObject.pathname === "/click")
		{
			queryObject.delete("u3");
			// prepend 0 if hex string used,
			// otherwise it will be ignored.
			id = 0 + crc32(queryObject.toString()) + "crc";
		}
		return id;
	};
})();

/**
 * Key under which a link's resolved destination is cached locally, and under
 * which links sharing a destination are grouped.
 *
 * Deliberately separate from getUrlId(). The resolver id has to match what the
 * service expects, and it collides: `lno` is the link index within a post, so
 * it restarts at 1 in every post and the first link of every post in a thread
 * shares one id. Using that as the cache key made links inherit whichever
 * destination resolved first. This key is derived from the whole request, minus
 * the parameters that describe the visit rather than the destination, so it is
 * unique per link and stable across page loads.
 * @function
 * @param {URL} urlObject - The link to key.
 * @returns {string} cache key, always starting with a digit
 */
const getCacheKey = (() =>
{
	/* adobeRef carries a per-pageview prefix with a per-link counter and peid is
	 * a per-pageview uuid - both confirmed to change between two loads of the
	 * same page. hash, auuid and sdtrk are session or page scoped. u3 is opaque.
	 * A denylist, not an allowlist: over-stripping only merges links that share
	 * a destination, while missing a distinguishing parameter would bring back
	 * the collision this key exists to prevent. */
	const volatile = ["u3", "adobeRef", "peid", "hash", "auuid", "sdtrk"];
	const count = volatile.length;
	return urlObject =>
	{
		const queryObject = new URLSearchParams(urlObject.search);
		for (let i = 0; i < count; i++)
			queryObject.delete(volatile[i]);

		queryObject.sort();
		return 0 + crc32(urlObject.pathname + "?" + queryObject.toString()) + "crc";
	};
})();

/**
 * Checks a destination against the one the link itself records in `trd`.
 *
 * getCacheKey() stops links sharing a resolver id from inheriting each other's
 * destination locally, but it cannot help when the wrong destination is already
 * wrong on arrival - and it arrives wrong for links inside forum posts. `lno` is
 * the link index within a post and restarts at 1 in every post, so the first
 * link of every post in a thread is sent to the resolver as the same id
 * (`19854408sdtid1lno` for thread 19854408), and the service answers all of them
 * with one destination: the thread's own product page. A post linking to
 * rei.com came back as the deal's amazon.com page, carrying an `ascsubtag` from
 * an entirely different pageview. The id shape is not ours to change - see
 * getUrlId() - so the answer has to be checked instead.
 *
 * `trd` is what makes that possible. Slickdeals writes the outbound URL into it
 * with every run of non-alphanumeric characters collapsed to `+`, cut at 32
 * characters: `https://www.rei.com/learn/expert-c…` is stored as
 * `https+www+rei+com+learn+expert+c`. Lossy, and the tail is usually half a
 * word, but the host survives whole for any host short enough to fit.
 *
 * Only the host is compared, because only the host is reliable. The resolver
 * legitimately hands back a different path from the one `trd` recorded - an
 * Amazon `/dp/` link comes back as `/gp/product/`, affiliate parameters get
 * appended - but it does not hand back a different site. The scheme and a
 * leading `www` are dropped from both sides so that normalising either is not
 * read as a mismatch, and a link with no `trd` is passed through untouched.
 * @function
 * @param {URL} urlObject - The original link.
 * @param {string} url - The destination to check.
 * @returns {boolean} false only when the link says where it goes and this is not it
 */
const isDestinationPlausible = (() =>
{
	const fingerprint = value => ("" + value).toLowerCase().replace(/[^a-z\d]+/g, "+").replace(/^\++|\++$/g, "");
	const ignored = ["http", "https", "www"];
	const tokens = value =>
	{
		const result = fingerprint(value).split("+");
		while (result.length > 1 && ignored.includes(result[0]))
			result.shift();

		return result;
	};
	return (urlObject, url) =>
	{
		/* URLSearchParams.get() turns the `+` separators into spaces; tokens()
		 * splits on non-alphanumerics, so both spellings land on the same list. */
		const trd = new URLSearchParams(urlObject.search).get("trd");
		if (!trd)
			return true; //the link records nothing to check against

		let host;
		try
		{
			host = new URL(url).hostname;
		}
		catch
		{
			return false;
		}
		const aTrd = tokens(trd);
		const aHost = tokens(host);
		const count = Math.min(aTrd.length, aHost.length);
		for (let i = 0; i < count; i++)
		{
			/* `trd` is cut at 32 characters, so its final token can be the front
			 * of a longer word - `…+expert+c` for `expert-clothing`. Compare that
			 * one as a prefix; every earlier token is whole. */
			if (i === aTrd.length - 1 ? !aHost[i].startsWith(aTrd[i]) : aHost[i] !== aTrd[i])
				return false;
		}
		return true;
	};
})();

/**
 * Injects custom CSS into the document.
 *
 * @function
 * @returns {void}
 */
const customCSS = (elStyle => () =>
{
	elStyle.textContent = SETTINGS.css;
	document.body.append(elStyle);
})(document.createElement("style"));

/**
 * This function fixes the CSS by replacing the data-v-ID attribute with a data-* attribute that matches the ID of the element.
 * @function
 * @returns {void}
 */
const fixCSS = () =>
{
	const reCssFindId = /^v([A-F]|-\d)/;
	const cssFindId = reCssFindId.test.bind(reCssFindId);
	style.innerHTML = css.replace(/^(.*)\[data-v-ID]/gm, (txt, query) =>
	{
		const element = document.body.querySelector(query);
		if (element)
		{
			const keys = Object.keys(element.dataset);
			const id = keys.find(cssFindId);
			if (id)
				return query + "[data-" + id.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase() + "]";
		}
		return query;
	});

};

// crc32.js
// Copyright (c) 2014 Stephan Brumme. All rights reserved.
// see http://create.stephan-brumme.com/disclaimer.html
//
const crc32 = text =>
{
  // CRC32b polynomial
	const Polynomial = 0xED_B8_83_20;
  // start value
	let crc = 0xFF_FF_FF_FF;
	for (let i = 0; i < text.length; i++)
	{
		// XOR next byte into state
		crc ^= text.charCodeAt(i);
		// process 8 bits
		for (let bit = 0; bit < 8; bit++)
		{
		// look at lowest bit
			crc = (crc & 1) === 0 ? crc >>> 1 : (crc >>> 1) ^ Polynomial;
		}
	}
	// return hex string
	let what = ~crc;
	// adjust negative numbers
	if (what < 0)
		what = 0xFF_FF_FF_FF + what + 1;

	return what;
	// // convert to hexadecimal string
	// const result = what.toString(16);
	// // add leading zeros
	// return ("0000000" + result).slice(-8);
};

/**
 * The main function that initializes the Slickdeals+ script.
 * @function
 * @returns {void}
 */
const init = () =>
{
	document.removeEventListener("DOMContentLoaded", init, false);

	const darkModeClasses = ["bp-s-darkMode", "midnight"];
	const _isDarkMode = () => darkModeClasses.some(className => document.body.classList.contains(className));
	document.body.classList.toggle("darkMode", _isDarkMode());
	const observer = new MutationObserver(mutations =>
	{
		for (const mutation of mutations)
		{
			if (mutation.type === "attributes")
			{
				document.body.classList.toggle("darkMode", _isDarkMode());
			}
		}
	});
	observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

	fixCSS();
	window.addEventListener("load", fixCSS, false);
	/* The top-level call runs at document-start, before any bar exists. Retry once
	 * the page is up: on Blueprint the MutationObserver has usually mounted the
	 * menu already and mountMenu() no-ops on initMenu.elMenu, so there is never a
	 * second menu. mountMenu() re-runs fixCSS() itself, so listener order with the
	 * line above does not matter. */
	window.addEventListener("load", mountMenu, false);
	document.head.append(style);

	//for some reason observer failed to process everything while page is still loading, so we do it manually
	const elPageContent = $$("pageContent");
	if (elPageContent)
	{
		processCards(elPageContent);
		processLinks(elPageContent);
	}
	/* Score highlighting otherwise only runs from processCards(), i.e. only for
	 * cards whose price element was recognised. On the classic layout the vote
	 * count is readable even when the price markup is not, so drive it once
	 * directly rather than making it a hostage of price parsing. */
	highlightCards();
	customCSS();
	setColors();
	debug(GM_info.script.name, "v" + VERSION, "initialized");
};//init()

document.addEventListener("DOMContentLoaded", init, false);
})(`:root
{
	--colorMix: in srgb;
}

a.resolved:not(.seeDealButton):not(.button.success):not(.dealDetailsOutclickButton)
{
	color: #00b309;
}

.dealDetailsOutclickButton[data-v-ID].resolved,
body.bp-s-darkMode .dealDetailsOutclickButton[data-v-ID].resolved,
.seeDealButton.resolved
{
	--buttonBackgroundColor: #0c9144;
	--dealDetailsOutclickButtonBgColor: #0c9144;
	--dealDetailsOutclickButtonBgColorHover: #0b7b1d;
	--dealDetailsOutclickButtonBgColorActive: #06551a;
}

.seeDealButton.resolved:hover
{
	--buttonBackgroundColor: #0b7b1d;
}

.seeDealButton.resolved:active
{
	--buttonBackgroundColor: #06551a;
}

div.colorRatingBG,
li.colorRatingBG,
li.highlightRating .dealCard[data-v-ID],
div.highlightRating,
li.highlightRating
{
	--colorRating: var(--colorRatingBG, #E4FFDD);
	--backgroundColor: var(--colorRating);
	--cardBackgroundColor: var(--colorRating);
}

div.colorDiffBG,
li.colorDiffBG,
li.highlightDiff .dealCard[data-v-ID],
div.highlightDiff,
li.highlightDiff
{
	--colorDiff: var(--colorDiffBG, #ddefff);
	--backgroundColor: var(--colorDiff);
	--cardBackgroundColor: var(--colorDiff);
}

div.colorFreeBG,
li.colorFreeBG,
li.free .dealCard[data-v-ID],
div.free,
li.free
{
	--colorFree: var(--colorFreeBG, #ffdde0);
	--backgroundColor: var(--colorFree);
	--cardBackgroundColor: var(--colorFree);
	--highlightColor: #FF5D6A;
}

/* div.free,
li.free:not(.input),
div.highlightRating,
li.highlightRating:not(.input),
div.highlightDiff,
li.highlightDiff:not(.input)
{
	animation: pulse .5s infinite alternate;
} */

body.darkMode div.colorRatingBG,
body.darkMode li.colorRatingBG,
body.darkMode li.highlightRating .dealCard[data-v-ID],
body.darkMode div.highlightRating,
body.darkMode li.highlightRating
{
	--colorRating: var(--colorRatingBG, #243f22);
	--backgroundColor: var(--colorRating);
	--cardBackgroundColor: var(--colorRating);
	--highlightColor: var(--colorRating);
}

body.darkMode div.colorDiffBG,
body.darkMode li.colorDiffBG,
body.darkMode li.highlightDiff .dealCard[data-v-ID],
body.darkMode div.highlightDiff,
body.darkMode li.highlightDiff
{
	--colorDiff: var(--colorDiffBG, #1C2E4A);
	--backgroundColor: var(--colorDiff);
	--cardBackgroundColor: var(--colorDiff);
	--highlightColor: var(--colorDiff);
}

body.darkMode div.colorFreeBG,
body.darkMode li.colorFreeBG,
body.darkMode li.free .dealCard[data-v-ID],
body.darkMode div.free,
body.darkMode li.free
{
	--colorFree: var(--colorFreeBG, #4e131f);
	--backgroundColor: var(--colorFree);
	--cardBackgroundColor: var(--colorFree);
	--highlightColor: var(--colorFree);
}

/* search results */
.resultRow.free,
.resultRow.highlightDiff,
.resultRow.highlightRating
{
	background-color: var(--backgroundColor);
}

/* Classic layout. Everywhere else the highlight works by redefining
 * --backgroundColor / --cardBackgroundColor and letting the page's own Vue
 * stylesheets consume them. The classic (vBulletin) pages predate those
 * variables and consume nothing, so setting the custom property there painted
 * exactly nothing - the div.free/div.highlightDiff/div.highlightRating rules
 * above were already matching, they just had no reader. Consume it explicitly,
 * the same way the search results do. */
div.dealitem.free,
div.dealitem.highlightDiff,
div.dealitem.highlightRating
{
	background-color: var(--backgroundColor);
}

/* The price sits in a bare <strong> with no class, so none of the
 * [data-deal-diff] selectors above reach it. Same treatment: block-level so the
 * saving lands on its own line under the price rather than beside the shipping
 * note. */
html.showDiff .dealblocktext strong[data-deal-diff]::after
{
	display: block;
	width: 100%;
	content: "($" attr(data-deal-diff) " | " attr(data-deal-percent) "%)";
	font-style: italic;
}

/* stylelint-disable-next-line no-descending-specificity */
li.highlightRating.highlightDiff,
li.highlightRating.highlightDiff .dealCard[data-v-ID],
body.darkMode li.highlightRating.highlightDiff,
body.darkMode li.highlightRating.highlightDiff .dealCard[data-v-ID]
{
	--backgroundColor: color-mix(var(--colorMix), var(--colorRating), var(--colorDiff));
	--cardBackgroundColor: var(--backgroundColor);
}

/* stylelint-disable-next-line no-descending-specificity */
li.highlightRating.free,
li.highlightRating.free .dealCard[data-v-ID],
body.darkMode li.highlightRating.free,
body.darkMode li.highlightRating.free .dealCard[data-v-ID]
{
	--backgroundColor: color-mix(var(--colorMix), var(--colorRating), var(--colorFree));
	--cardBackgroundColor: var(--backgroundColor);
}

/* stylelint-disable-next-line no-descending-specificity */
li.free.highlightDiff,
li.free.highlightDiff .dealCard[data-v-ID],
body.darkMode li.free.highlightDiff,
body.darkMode li.free.highlightDiff .dealCard[data-v-ID]
{
	--backgroundColor: color-mix(var(--colorMix), var(--colorFree), var(--colorDiff));
	--cardBackgroundColor: var(--backgroundColor);
}

/* stylelint-disable-next-line no-descending-specificity */
li.free.highlightRating.highlightDiff,
li.free.highlightRating.highlightDiff .dealCard[data-v-ID],
body.darkMode li.free.highlightRating.highlightDiff,
body.darkMode li.free.highlightRating.highlightDiff .dealCard[data-v-ID]
{
	--backgroundColor: color-mix(var(--colorMix), color-mix(var(--colorMix), var(--colorRating), var(--colorFree)), color-mix(var(--colorMix), var(--colorFree), var(--colorDiff)));
	--cardBackgroundColor: var(--backgroundColor);
}



.dealDetailsPriceInfo[data-deal-diff],
.resultRow.free
{
	position: relative; /* allow box-shadow overlap item below */
}

/* end search results */

/* @keyframes pulse
{
	from{ box-shadow: 0 0 1em var(--highlightColor); }
	to{ box-shadow: 0 0 0.5em var(--highlightColor); }
} */

#fpMainContent .gridCategory .fpGridBox.list.free,
#fpMainContent .gridCategory .fpGridBox.simple.free
{
	margin: 0.5em;
}

#fpMainContent .gridCategory .grid .fpItem .itemInfoLine .avatarBox,
#fpMainContent .gridCategory ul.gridDeals .fpGridBox .itemInfoLine .avatarBox,
#fpMainContent .gridCategory .grid .fpItem.isPersonalizedDeal .itemBottomRow .comments
{
	display: initial !important;
}

#fpMainContent .gridCategory ul.gridDeals .fpGridBox .itemInfoLine .avatarBox
{
	position: initial;
	float: right;
}

#fpMainContent .gridCategory ul.gridDeals .fpGridBox .fpItem .itemBottomRow .comments
{
	position: absolute;
	right: -2.5em;
	bottom: 5em;
	display: initial !important;
}

a.overlayUrl
{
	position: relative;
	display: none;
	height: 1em;
}

a.overlayUrl::before,
a.overlayUrl::after
{
	position: absolute;
	top: -0.1em;
	height: 1.3em;
	content: "";

}

a.overlayUrl::after
{
	width: 2.2em;
}

a.overlayUrl::before
{
	left: .1em;
	width: 1.3em;
	padding: 0.5em 1em;
	border-radius: 0.5em;
	background-color: #ffffff9f;
	background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9ImN1cnJlbnRDb2xvciIgcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pbllNaW4gbWVldCIgdmlld0JveD0iMCAwIDEwIDExIj4KICA8cGF0aCBmaWxsPSJpbmhlcml0IiBkPSJtOC40NjUuNTQ2Ljk5Ljk5YTEuODcgMS44NyAwIDAgMS0uMDAyIDIuNjRsLTEuMzIgMS4zMmExLjQxMiAxLjQxMiAwIDAgMS0xLjUyNS4zMDMuNDY3LjQ2NyAwIDAgMSAuMzU3LS44NjJjLjE3NC4wNy4zNzQuMDMuNTA5LS4xMDJsMS4zMjEtMS4zMTdhLjkzMy45MzMgMCAwIDAgMC0xLjMybC0uOTktLjk5YS45MzMuOTMzIDAgMCAwLTEuMzIgMGwtMS4zMiAxLjMyYS40NjcuNDY3IDAgMCAwLS4xLjUwNi40NjcuNDY3IDAgMSAxLS44NjMuMzU3IDEuNDAzIDEuNDAzIDAgMCAxIC4zMDMtMS41MjZsMS4zMi0xLjMyYTEuODcgMS44NyAwIDAgMSAyLjY0IDBaIi8+CiAgPHBhdGggZmlsbD0iaW5oZXJpdCIgZD0iTTMuMDIgNi45OGEuNDcuNDcgMCAwIDAgLjY2IDBsMy42My0zLjYzYS40NjcuNDY3IDAgMCAwLS42Ni0uNjZMMy4wMiA2LjMyYS40NjcuNDY3IDAgMCAwIDAgLjY2WiIvPgogIDxwYXRoIGZpbGw9ImluaGVyaXQiIGQ9Ik01LjE5IDYuMzU3YS40NjcuNDY3IDAgMCAwLS4yNTMuNjEuNDY3LjQ2NyAwIDAgMS0uMTAyLjUwOGwtMS4zMiAxLjMyYS45MzMuOTMzIDAgMCAxLTEuMzIgMGwtLjk5LS45OWEuOTMzLjkzMyAwIDAgMSAwLTEuMzJsMS4zMjItMS4zMmEuNDczLjQ3MyAwIDAgMSAuNTEtLjEuNDY3LjQ2NyAwIDAgMCAuMzU1LS44NjQgMS40MTYgMS40MTYgMCAwIDAtMS41MjUuMzA1TC41NDYgNS44MjZhMS44NyAxLjg3IDAgMCAwIDAgMi42NGwuOTkuOTljLjcyOS43MjggMS45MS43MjggMi42NCAwbDEuMzItMS4zMmMuNC0uNDAxLjUyLTEuMDAzLjMwMy0xLjUyN2EuNDY3LjQ2NyAwIDAgMC0uNjEtLjI1MloiLz4KPC9zdmc+");
	background-position: center;
	background-repeat: no-repeat;
	opacity: 0.5;
}

a.overlayUrl:hover::before
{
	background-color: #fff;
	opacity: 1;
}

a:hover > a.overlayUrl
{
	display: inline;
}

.bp-p-adBlock,
.hidden
{
	display: none !important;
}

.sdp-menu
{
	-webkit-user-select: none;
	user-select: none;
}

.sdp-menu li
{
	white-space: nowrap;
}

.sdp-menu ul[data-v-ID] li > li
{
	padding: 0 0 0 calc(2em + 4px);
}

.sdp-menu ul[data-v-ID] > li.slickdealsHeaderDropdownItem,
.sdp-menu ul[data-v-ID] > li.slickdealsHeaderDropdownItem.input
{
	padding: 0.35em 0;
}

.dealCard__priceContainer > span:last-of-type
{
	margin-right: 4px;
}

.sdp-menu ul[data-v-ID] li > input + span
{
	margin-right: 0.8em;
	margin-left: 0.3em;
}

.sdp-menu ul[data-v-ID] li > span:first-child
{
	margin-right: 0.3em;
	margin-left: 0.8em;
}

html.hideSideColumn #pageContent #sideColumn, /* side column */
html.hideSideColumn aside.slickdealsSidebar.redesignFrontpageDesktop__sidebar, /* side column */
.displayAdContainer, /* ads */
.mobileAdFluid, /* ads */
#colorClose,
#sdpChanges,
.sdp-menu .changes,
html.freeOnly .frontpageRecommendationCarousel li:not(.free),
html.freeOnly .dealTiles li:not(.free),
html.freeOnly .deals li:not(.free), /* mobile */
html.freeOnly .frontpageMobileRecommendationCarousel__list li:not(.free), /* mobile */
html.freeOnly .categoryPage__main li:not(.free), /* https://slickdeals.net/deals/*** */
html.freeOnly .bp-p-categoryPage_main li:not(.free), /* https://slickdeals.net/deals/*** */
html.freeOnly .frontpageGrid li:not(.free),

html.diffOnly.highlightDiff .frontpageRecommendationCarousel li:not(.highlightDiff),
html.diffOnly.highlightDiff .dealTiles li:not(.highlightDiff),
html.diffOnly.highlightDiff .deals li:not(.highlightDiff), /* mobile */
html.diffOnly.highlightDiff .frontpageMobileRecommendationCarousel__list li:not(.highlightDiff), /* mobile */
html.diffOnly.highlightDiff .categoryPage__main li:not(.highlightDiff), /* https://slickdeals.net/deals/*** */
html.diffOnly.highlightDiff .bp-p-categoryPage_main li:not(.highlightDiff), /* https://slickdeals.net/deals/*** */
html.diffOnly.highlightDiff .frontpageGrid li:not(.highlightDiff),

html.ratingOnly.highlightRating .frontpageRecommendationCarousel li:not(.highlightRating),
html.ratingOnly.highlightRating .dealTiles li:not(.highlightRating),
html.ratingOnly.highlightRating .deals li:not(.highlightRating), /* mobile */
html.ratingOnly.highlightRating .frontpageMobileRecommendationCarousel__list li:not(.highlightRating), /* mobile */
html.ratingOnly.highlightRating .categoryPage__main li:not(.highlightRating), /* https://slickdeals.net/deals/*** */
html.ratingOnly.highlightRating .bp-p-categoryPage_main li:not(.highlightRating), /* https://slickdeals.net/deals/*** */
html.ratingOnly.highlightRating .frontpageGrid li:not(.highlightRating),

html.freeOnly.diffOnly.highlightDiff .frontpageRecommendationCarousel li:not(.highlightDiff,.free),
html.freeOnly.diffOnly.highlightDiff .dealTiles li:not(.highlightDiff,.free),
html.freeOnly.diffOnly.highlightDiff .deals li:not(.highlightDiff,.free), /* mobile */
html.freeOnly.diffOnly.highlightDiff .frontpageMobileRecommendationCarousel__list li:not(.highlightDiff,.free), /* mobile */
html.freeOnly.diffOnly.highlightDiff .categoryPage__main li:not(.highlightDiff,.free), /* https://slickdeals.net/deals/*** */
html.freeOnly.diffOnly.highlightDiff .bp-p-categoryPage_main li:not(.highlightDiff,.free), /* https://slickdeals.net/deals/*** */
html.freeOnly.diffOnly.highlightDiff .frontpageGrid li:not(.highlightDiff,.free),

html.freeOnly.ratingOnly.highlightRating .frontpageRecommendationCarousel li:not(.highlightRating,.free),
html.freeOnly.ratingOnly.highlightRating .dealTiles li:not(.highlightRating,.free),
html.freeOnly.ratingOnly.highlightRating .deals li:not(.highlightRating,.free), /* mobile */
html.freeOnly.ratingOnly.highlightRating .frontpageMobileRecommendationCarousel__list li:not(.highlightRating,.free), /* mobile */
html.freeOnly.ratingOnly.highlightRating .categoryPage__main li:not(.highlightRating,.free), /* https://slickdeals.net/deals/*** */
html.freeOnly.ratingOnly.highlightRating .bp-p-categoryPage_main li:not(.highlightRating,.free), /* https://slickdeals.net/deals/*** */
html.freeOnly.ratingOnly.highlightRating .frontpageGrid li:not(.highlightRating,.free),

html.ratingOnly.highlightRating.diffOnly.highlightDiff .frontpageRecommendationCarousel li:not(.highlightDiff,.highlightRating),
html.ratingOnly.highlightRating.diffOnly.highlightDiff .dealTiles li:not(.highlightDiff,.highlightRating),
html.ratingOnly.highlightRating.diffOnly.highlightDiff .deals li:not(.highlightDiff,.highlightRating), /* mobile */
html.ratingOnly.highlightRating.diffOnly.highlightDiff .frontpageMobileRecommendationCarousel__list li:not(.highlightDiff,.highlightRating), /* mobile */
html.ratingOnly.highlightRating.diffOnly.highlightDiff .categoryPage__main li:not(.highlightDiff,.highlightRating), /* https://slickdeals.net/deals/*** */
html.ratingOnly.highlightRating.diffOnly.highlightDiff .bp-p-categoryPage_main li:not(.highlightDiff,.highlightRating), /* https://slickdeals.net/deals/*** */
html.ratingOnly.highlightRating.diffOnly.highlightDiff .frontpageGrid li:not(.highlightDiff,.highlightRating),

html.freeOnly.ratingOnly.highlightRating.diffOnly.highlightDiff .frontpageRecommendationCarousel li:not(.highlightDiff,.highlightRating,.free),
html.freeOnly.ratingOnly.highlightRating.diffOnly.highlightDiff .dealTiles li:not(.highlightDiff,.highlightRating,.free),
html.freeOnly.ratingOnly.highlightRating.diffOnly.highlightDiff .deals li:not(.highlightDiff,.highlightRating,.free), /* mobile */
html.freeOnly.ratingOnly.highlightRating.diffOnly.highlightDiff .frontpageMobileRecommendationCarousel__list li:not(.highlightDiff,.highlightRating,.free), /* mobile */
html.freeOnly.ratingOnly.highlightRating.diffOnly.highlightDiff .categoryPage__main li:not(.highlightDiff,.highlightRating,.free), /* https://slickdeals.net/deals/*** */
html.freeOnly.ratingOnly.highlightRating.diffOnly.highlightDiff .bp-p-categoryPage_main li:not(.highlightDiff,.highlightRating,.free), /* https://slickdeals.net/deals/*** */
html.freeOnly.ratingOnly.highlightRating.diffOnly.highlightDiff .frontpageGrid li:not(.highlightDiff,.highlightRating,.free),
.searchPage__headerContent:empty /* search results */
{
	display: none;
}

/* Classic layout and search results.
 *
 * Every rule above filters an li inside one of seven named containers. Both
 * of these layouts express a card as a div that is itself the card -
 * div.dealitem on the classic pages, div.resultRow on /newsearch.php - so none
 * of those selectors could ever match and "Free Only" silently did nothing on
 * either page. The classes are already applied there (both paint their
 * highlight correctly), so only the hide rule was missing.
 *
 * :is() rather than twelve more lines: these two selectors are identical
 * except for the class, and the combination matrix above is already long
 * enough to hide a gap like this one in. Multi-argument :not() is used
 * throughout the block above, so this needs no wider browser support than the
 * file already assumes.
 *
 * diffOnly and ratingOnly are unreachable from the menu today - their
 * createMenuItem() calls are commented out - but they are kept in step with
 * freeOnly so that re-enabling them does not reopen this same gap on exactly
 * these two layouts. */
html.freeOnly :is(div.dealitem, div.resultRow):not(.free),
html.diffOnly.highlightDiff :is(div.dealitem, div.resultRow):not(.highlightDiff),
html.ratingOnly.highlightRating :is(div.dealitem, div.resultRow):not(.highlightRating),
html.freeOnly.diffOnly.highlightDiff :is(div.dealitem, div.resultRow):not(.highlightDiff,.free),
html.freeOnly.ratingOnly.highlightRating :is(div.dealitem, div.resultRow):not(.highlightRating,.free),
html.ratingOnly.highlightRating.diffOnly.highlightDiff :is(div.dealitem, div.resultRow):not(.highlightDiff,.highlightRating),
html.freeOnly.ratingOnly.highlightRating.diffOnly.highlightDiff :is(div.dealitem, div.resultRow):not(.highlightDiff,.highlightRating,.free)
{
	display: none;
}

.changes .fixed::before,
.changes .changed::before,
.changes .removed::before,
.changes .added::before,
.changes .help::before
{
	display: inline-block;
	width: 0.7em;
	margin-left: -1em;
	font-family: monospace;
	font-size: 1.2em;
	font-weight: bold;
	line-height: 1em;
	vertical-align: middle;
}


.changes .fixed::before
{
	color: orange;
	content: "!";
}

.changes .changed::before
{
	height: 1em;
	color: lightblue;
	content: "*";
	line-height: 1.2em;
}

.changes .removed::before
{
	color: red;
	content: "-";
}

.changes .added::before
{
	color: green;
	content: "+";
}

.changes .help
{
	opacity: 0.7;
}

.changes .help::before
{
	color: grey;
	content: "?";
}


.changes > div
{
	padding-left: 1em;
}

.changes > *
{
	color: var(--mainNavTextColor);
}

.changes > div:not(:last-of-type)
{
	padding: 0.2em 0 0.2em 1em;
	margin-bottom: 0.1em;
}

.changes > div.comment
{
	padding-left: 0;
	margin-left: -.2em;
	font-style: italic;
	opacity: 0.5;
}

/* .changes > div.comment:not(:last-of-type)
{
} */

.sdp-menu .reset::before
{
	position: absolute;
	top: 0;
	left: 0.2em;
	content: "\u00D7";
	line-height: 1em;
}

.sdp-menu .reset
{
	position: relative;
	display: inline-block;
	width: 1.5em;
	height: 2em;
	cursor: pointer;
	opacity: 0.3;
	vertical-align: middle;
}

.sdp-menu input[type="_color"],
.sdp-menu input[type="color"]
{
	/* width: 2em; */
	height: 2em;
	padding: 0;
	border-color: transparent;
	margin: 0;
	cursor: pointer;
	vertical-align: middle;
}

.sdp-menu input[type="color"]::-webkit-color-swatch-wrapper
{
	padding: 0;
}

.sdp-menu input[type="color"]::-webkit-color-swatch
{
	border-radius: 3px;
}

.sdp-menu input[type="_color"]
{
	width: 7em;
	height: 2.86em;
	border: 1px solid grey;
	cursor: wait;
	font-size: 0.7em;
	font-style: italic;
	line-height: 2.86em;
	opacity: 0.5;
	text-align: center;
}


/* setting checkbox */
.sdp-menu .slickdealsHeaderDropdownItem
{
	color: var(--hamburgerTextColor);
	cursor: pointer;
}

.sdp-menu .slickdealsHeaderDropdownItem__link[data-v-ID]
{
	padding: 0 0.8em;
	column-gap: 4px;
	line-height: 2em;
}

body[data-view="mobile"] .sdp-menu .slickdealsHeaderDropdownItem__link[data-v-ID]
{
	padding-right: 0;
}

.sdp-menu .slickdealsHeaderDropdownItem > a:first-child::before
{
	width: 1em;
	height: 1em;
	content: "☐";
	font-size: 1.3em;
	line-height: 1.1em;
}

/* end setting checkbox */

/* setting input */


.sdp-menu ul[data-v-ID],
.sdp-menu .slickdealsHeaderDropdownItem.input,
.sdp-menu .footer
{
	cursor: default;
	row-gap: 0;
}

.sdp-menu textarea
{
	width: 100%;
	height: 5em;
	background-color: transparent;
}

.sdp-menu .footer
{
	height: auto;
	margin-top: 0;
	text-align: right;
}

body.colorClose .slickdealsHeader__dropdown[data-v-ID],
body.colorClose .slickdealsHeader__mainNav[data-v-ID]
{
	transform: initial !important;
}

body[data-view="mobile"] .sdp-menu .slickdealsHeader__dropdown[data-v-ID] /* mobile */
{
	/* min-width: 72vw; */
	max-width: 72vw;
	padding-left: 0;
	font-size: 13px;
}

.sdp-menu input[type="checkbox"]:checked + label.footer::before, /* mobile */
.sdp-menu input[type="checkbox"] + label::before, /* mobile don't show a checkbox */
.sdp-menu .footer::before,
.sdp-menu .footer::after
{
	/* unset = for mobile view */
	position: unset;
	width: auto;
	height: unset;
	padding: unset;
	border: unset;
	margin: unset;
	background: unset;
	cursor: pointer;
	font-family: unset !important;
	font-size: x-small;
	opacity: 0.5;
	vertical-align: unset;
}

.sdp-menu input[type="checkbox"]:checked + label.footer::before, /* mobile */
.sdp-menu input[type="checkbox"]:checked + label.footer::after, /* mobile */
.sdp-menu .reset:hover
{
	opacity: 1;
}

.sdp-menu .footer::after
{
	content: attr(data-label);
	float: right;
	/* The label is display:inline, so this float's containing block is the panel
	 * itself and it lands hard against the panel's padding - close enough to the
	 * border to read as clipped. Inset it on both sides; the classic panel, whose
	 * padding is ours and therefore known, tunes these exactly below.
	 *
	 * On the float rather than the panel's padding-bottom: the changelog expands
	 * below this line, and padding there would open a gap under the changelog
	 * too, which is not what needs fixing. */
	margin-right: 1em;
	margin-bottom: 1em;
}

/* Equal 15px from the glyphs - not from the line box - to both panel edges.
 *
 * Matching the boxes is not the same as matching what the eye sees, which is
 * why the previous attempt still looked off. The label has no descenders
 * ("v26.11.10 · maxnl fork"), so 4px of empty descender space sits inside its
 * line box below the last visible pixel, while the right side gives up only
 * 0.19px of side bearing. Equal margins therefore render as 17px of visible
 * space to the right and 21px underneath.
 *
 * The panel contributes 1px border + 6px padding = 7px on both sides, so:
 *   right:  7 + margin + 0.19 bearing = 15  ->  margin 8px
 *   bottom: 7 + margin + 4 descender  = 15  ->  margin 4px
 *
 * Scoped to the classic host because the arithmetic depends on that 6px
 * padding, which is ours. The Blueprint panel is styled by the page, so it
 * keeps the relative 1em above rather than px tuned for a different box.
 * Measured by rendering the label and scanning for its last inked pixel. */
.sdp-fallbackHost .sdp-menu .footer::after
{
	margin-right: 8px;
	margin-bottom: 4px;
}

.sdp-menu input[type="checkbox"]:checked + label.footer::before /* mobile */
{
	content: attr(title);
	float: left;
}

body:not([data-view="mobile"]) .sdp-menu input[type="checkbox"]:checked + label.footer::before /* mobile */
{
	margin-left: 1em;
}

.changesLink
{
	position: absolute;
	right: 0.8em;
	display: block;
	font-size: 0.8em;
}

body[data-view="mobile"] .changesLink
{
	right: 0;
}

#sdpChanges:checked ~ .changes
{
	display: block;
	margin: 0.6em;
	text-align: left;
}

.sdp-menu li > input
{
	display: inline-block;
	width: 5em;
	height: 2em;
	padding: revert;
	border: 1px solid;
	border-radius: 3px;
	margin: revert;
	background-color: inherit;
	color: inherit;
	line-height: 2em;
}

/* end setting input */

html[data-loading] .sdp-menu::before,
html[data-loading] .sdp-menu::after,
html[data-loading] .sdp-menu .slickdealsHeader__navItemText::before,
html[data-loading] .sdp-menu .slickdealsHeader__navItemText::after
{
	position: absolute;
	z-index: 1;
	pointer-events: none;
}

/* update popup */
html.updated .sdp-updated
{
	position: fixed;
	z-index: 9999;
	top: 0;
	left: 0;
	width: 100%;

	/* height: 1.5rem; */
	animation: shrink 60s ease 600s forwards;
	background-color: darkred;
	color: white;
	cursor: pointer;
	font-size: 1rem;
	line-height: 1.5rem;
	text-align: center;
}

@keyframes shrink
{
	90%
{
		font-size: 0.5rem;
		opacity: 1;
	}

	100%
	{
		display: none;
		font-size: 0;
		opacity: 0;
	}
}

/* end update popup */

@media (width >= 1024px)
{
	html[data-loading] .sdp-menu
	{
		position: relative;
	}

	html[data-loading] .sdp-menu::before
	{
		right: 0.1em;
		animation: spin 1s linear infinite;
		content: "⌛";
		line-height: 2.5em;
	}

	html[data-loading] .sdp-menu::after
	{
		top: 0.8em;
		right: 0.1em;
		width: 1em;
		color: black;
		content: attr(data-loading);
		line-height: 1em;
		text-align: center;
		text-shadow: 1px 0 0 #fff,
			0 1px 0 #fff,
			-1px 0 0 #fff,
			0 -1px 0 #fff,
			0 0 0 #fff;

	}

	.sdp-menu .slickdealsHeaderDropdownItem
	{
		color: var(--dropdownTextColor);
	}

}

@media (width <= 1023px)
{
	html[data-loading] .sdp-menu .slickdealsHeader__navItemText
	{
		position: relative;
		overflow: unset !important;
	}

	html[data-loading] .sdp-menu .slickdealsHeader__navItemText::before
	{
		right: -1.5em;
		animation: spin 1s linear infinite;
		content: "⌛";
		line-height: 2.0em;
	}

	html[data-loading] .sdp-menu .slickdealsHeader__navItemText::after
	{
		top: 0.5em;
		right: -1.5em;
		width: 1em;
		height: 1em;
		color: black;
		content: attr(data-loading);
		line-height: 1em;
		text-align: center;
		text-shadow: 1px 0 0 #fff,
			0 1px 0 #fff,
			-1px 0 0 #fff,
			0 -1px 0 #fff,
			0 0 0 #fff;
	}
}

@keyframes spin
{
	100%
 	{
		transform: rotate(360deg);
	}
}

.blueprint .bp-p-dealCard_priceContainer, /* mobile */
.dealCard__priceContainer[data-v-ID]
{
	display: flex;
	overflow: hidden;
	height: min-content;
	flex-wrap: wrap;
	justify-content: flex-start;
	text-align: left;
}

.cardPriceInfo /* added price wrapper for https://slickdeals.net/deals/*** */
{
	display: inline-flex;
	flex-wrap: wrap;
	align-items: center;
	gap: inherit;
	grid-area: price;
}

html.showDiff .bp-p-dealCard_priceContainer[data-deal-diff]::after, /* mobile */
html.showDiff .dealDetailsMainDesktopBlock__priceBlock[data-deal-diff]::after, /* deal details page */
html.showDiff .dealDetailsPriceInfo[data-deal-diff]::after, /* deal details page */
html.showDiff .cardPriceInfo[data-deal-diff]::after, /* https://slickdeals.net/deals/* */
html.showDiff .priceCol > .prices[data-deal-diff]::after, /* search result */
html.showDiff .searchPage > .pricingInfo > .prices[data-deal-diff]::after, /* search result mobile */
html.showDiff a[data-deal-diff]::after /* deal list page */
{
	display: block;
	width: 100%; /* force on new line */
	content: "($" attr(data-deal-diff) " | " attr(data-deal-percent) "%)";
	font-style: italic;
}

html.showDiff .bp-p-dealCard_priceContainer[data-deal-diff]::after /* mobile */
{
	padding-left: 8px;
}

.dealCard--priceTitleVariant .dealCard__content[data-v-ID]
{
	grid-template-areas:
		"image      image          image"
		"title      title          title"
		"price      originalPrice  fireIcon"
		"extraInfo  extraInfo      extraInfo"
		"store      store          store";
	grid-template-rows: auto 2.5em auto 1fr 20px;
}

html.priceFirst .dealCard__content[data-v-ID],
html.priceFirst .dealCard--priceTitleVariant .dealCard__content[data-v-ID]
{
	grid-template-areas:
		"image      image          image"
		"price      originalPrice  fireIcon"
		"title      title          title"
		"extraInfo  extraInfo      extraInfo"
		"store      store          store";
	grid-template-rows: auto 1.5em auto 1fr 20px;
}

html.priceFirst.showDiff .dealCard__content[data-v-ID],
html.priceFirst.showDiff .dealCard--priceTitleVariant .dealCard__content[data-v-ID]
{
	grid-template-rows: auto 3em auto 1fr 20px;
}

html.priceFirst.showDiff body[data-view="mobile"] .dealCard__content[data-v-ID], /* mobile firefox */
html.priceFirst.showDiff body[data-view="mobile"] .dealCard--mini .dealCard__content[data-v-ID]  /* mobile */
{
	grid-template-rows: auto 2.5em auto 1fr 20px;
}

html:not(.priceFirst) .blueprint .bp-p-socialDealCard--priceTitleVariant
{
	grid-template-areas:
		"image  title     title          title title title"
		"image  fireIcon  originalPrice  price price price"
		"image  info      info           info info info"
		"image  icons     icons          icons icons icons";
}

@media (width >= 768px)
{
	.dealCard__content[data-v-ID],
	.dealCard--priceTitleVariant .dealCard__content[data-v-ID],
	.blueprint .bp-p-socialDealCard .bp-c-card_content /* mobile */
 	{
		grid-template-rows:auto 4.5em auto 1fr 20px;
	}

	.blueberry .bp-p-blueberryDealCard .bp-c-card_content
	{
		grid-template:
			"image image image image image" auto
			". title title title ." auto
			". price originalPrice fireIcon ." auto
			". store store store ." 1fr
			". timeSensitivityBadge timeSensitivityBadge timeSensitivityBadge ." 1fr
			". whowhen whowhen whowhen ." auto/8px auto auto 1fr 8px;
	}

	html.priceFirst .blueberry .bp-p-blueberryDealCard .bp-c-card_content
	{
		grid-template:
			"image image image image image" auto
			". price originalPrice fireIcon ." auto
			". title title title ." auto
			". store store store ." 1fr
			". timeSensitivityBadge timeSensitivityBadge timeSensitivityBadge ." 1fr
			". whowhen whowhen whowhen ." auto/8px auto auto 1fr 8px;
	}

	html.priceFirst .blueprint .bp-p-socialDealCard .bp-c-card_content
	{
		grid-template-areas:
			"image      image          image"
			"price      originalPrice  fireIcon"
			"title      title          title"
			"extraInfo  extraInfo      extraInfo"
			"store      store          store";
		grid-template-rows:auto 2.5em auto 1fr 20px;
	}

}

@media (width < 768px)
{
	.blueberry .bp-p-blueberryDealCard--priceTitleVariant
	{
		grid-template:
			"image . title title title ." auto
			"image . price   originalPrice fireIcon ." auto
			"image . store   store         store ." auto
			"image . timeSensitivityBadge  timeSensitivityBadge   timeSensitivityBadge ." auto
			"image . whowhen whowhen       whowhen ." 1fr
			"image . footer  footer        footer ." auto
			"extraFooter extraFooter extraFooter extraFooter extraFooter extraFooter" auto/118px 12px auto auto 1fr 12px;
	}

	html.priceFirst .blueberry .bp-p-blueberryDealCard--priceTitleVariant
	{
		grid-template:
			"image . price   originalPrice fireIcon ." auto
			"image . title title title ." auto
			"image . store   store         store ." auto
			"image . timeSensitivityBadge  timeSensitivityBadge   timeSensitivityBadge ." auto
			"image . whowhen whowhen       whowhen ." 1fr
			"image . footer  footer        footer ." auto
			"extraFooter extraFooter extraFooter extraFooter extraFooter extraFooter" auto/118px 12px auto auto 1fr 12px;
	}

}

/* carousel height */
.carousel__track
{
	margin: 0;
}

.carousel
{
	overflow: hidden;
}

.frontpageRecommendationCarousel[data-v-ID]
{
	min-height: unset;
}

/* always show carousel's buttons */
.baseCarousel[data-v-ID] .carousel__prev--disabled,
.baseCarousel[data-v-ID] .carousel__next--disabled
{
	display: flex;
}

.pageContent--reserveMegabanner,
.pageContent--reserveAnnouncementBar
{ /* top banner */
	padding-top: 0 !important;
}

body.colorClose #colorClose
{
	position: fixed;
	z-index: 101;
	display: block;
	background-color: transparent;
	inset: 0;
}

html.hideSideColumn #pageContent #mainColumn,
html.hideSideColumn .redesignFrontpageDesktop__main
{
	width: 100%;
}

html.hideSideColumn .redesignFrontpageDesktop[data-v-ID]
{
	column-gap: 0;
	grid-template-columns: minmax(0, 1fr) 0;
}

@media (width >= 1203px)
{
	html.hideSideColumn .redesignFrontpageDesktop[data-v-ID]
	{
		width: 1105px;
	}
}

@media (width >= 1371px)
{
	html.hideSideColumn .redesignFrontpageDesktop[data-v-ID]
	{
		width: 1322px;
	}
}

@media (width >= 1539px)
{
	html.hideSideColumn .redesignFrontpageDesktop[data-v-ID]
	{
		width: 1538px;
	}
}

@media (width >= 768px)
{
	html.hideSideColumn .carousel li
	{
		max-width: 217px;
	}

}

/* ---- classic-layout fallback menu ---- */

/* float:left, matching .username.user_dd. Floats are strictly source-ordered
   among themselves, and the host is inserted ahead of the user block, so the
   button is guaranteed to sit left of the username. The inline avatar may
   reflow to the right of the name as a result; if that looks wrong, swapping
   this to display:inline-block with vertical-align:middle leaves the avatar
   put, at the cost of that guarantee. */
/* No font shorthand here. It used to carry 700 11px to match the bar, but
   shorthand inherits, so every label in the dropdown came out bold 11px. The
   button sets its own font below; the panel sets its own. */
.sdp-fallbackHost
{
	position: relative;
	z-index: 1000;
	float: left;
	margin-right: 8px;
}

/* the padding children and the template initMenu() cloned from */
.sdp-fallbackHost > :not(.sdp-menu)
{
	display: none;
}

/* initMenu() inserts this next to the host on focus and removes it on blur, so
   a click anywhere else closes the panel. Blueprint supplies its styling; the
   classic layout has no such rule, so it arrived as a plain block div sitting
   in the user bar - which is what made opening the menu grow the bar and push
   the avatar out of it. Give it the out-of-flow styling it is meant to have.
   Below the host's z-index so the panel stays clickable above it. */
.sdp-fallbackHost + .slickdealsHeader__overlay
{
	position: fixed;
	z-index: 999;
	background: transparent;
	inset: 0;
}

.sdp-fallbackHost .sdp-menu > div[role="button"]
{
	display: flex;
	align-items: center;
	padding: 3px 8px;
	border: 1px solid #ffffff2e;
	border-radius: 3px;
	background: #ffffff14;
	color: #ddd;
	column-gap: 4px;
	cursor: pointer;
	font: 700 11px arial, sans-serif;
	line-height: 16px;
	text-shadow: none;
	white-space: nowrap;
}

/* The loading indicator (html[data-loading] .sdp-menu::before/::after, showing
   how many link resolutions are still in flight) is absolutely positioned at
   right:0.1em of .sdp-menu - exactly where this button draws its arrow, so the
   count sat on top of the caret. Reserve that corner for it. */
html[data-loading] .sdp-fallbackHost .sdp-menu > div[role="button"]
{
	padding-right: 3.9em;
}

/* The shared rule pins this to width:1em and parks it on top of the hourglass.
   That is fine for the single-digit tail of the countdown, but the front page
   starts near a thousand links and a four-digit count overflowed the button.
   Size it to its content and sit it beside the hourglass rather than over it. */
html[data-loading] .sdp-fallbackHost .sdp-menu::after
{
	top: 50%;
	right: 1.3em;
	width: auto;
	transform: translateY(-50%);
	line-height: 1;
	text-align: right;
}

html[data-loading] .sdp-fallbackHost .sdp-menu::before
{
	top: 50%;
	line-height: 1;
	transform: translateY(-50%);
}

.sdp-fallbackHost .sdp-menu > div[role="button"]:hover
{
	background: #ffffff2e;
	color: #fff;
}

.sdp-fallbackHost .sdp-menu > div[role="button"] p
{
	margin: 0;
}

.sdp-fallbackHost .sdp-menu > div[role="button"]::after
{
	content: "▾";
	font-size: 10px;
	opacity: 0.8;
}

.sdp-fallbackHost .sdp-menu > ul
{
	position: absolute;
	z-index: 2147483000;
	top: calc(100% + 5px);
	right: 0;
	display: none;
	overflow-y: auto;
	min-width: 264px;
	/* Grow to whatever the content needs, stopping only at the window edge. The
	   panel opens just under the bar, so subtract that plus a small gap. 80vh
	   made it scroll while a fifth of the window sat empty below it, and this is
	   a small, infrequently opened menu - scrolling should be the last resort,
	   not the default. overflow-y stays auto for the genuinely-too-tall case. */
	max-height: calc(100vh - 3.5rem);
	padding: 6px;
	border: 1px solid #0000002e;
	border-radius: 5px;
	margin: 0;
	background: #fff;
	box-shadow: 0 6px 20px #00000038;
	color: #222;
	font: normal 12px/1.5 arial, helvetica, sans-serif;
	list-style: none;
	text-align: left;
	text-shadow: none;
}

/* The classic bar sets bold and a white text-shadow on its descendants, and the
   panel lives inside that bar, so it inherited both - the halo that made the
   labels hard to read. The page's own selectors out-specify a bare inherited
   value, so reset explicitly on the elements that carry text. */
/* !important, not more selectors. The panel is mounted inside #top_userbar, so
   the page styles its text through an ID selector - specificity (1,0,1). The
   plain version of this rule is (0,3,1): three classes and a type still lose to
   one ID, which is why the labels stayed bold and haloed. An !important author
   declaration wins regardless of specificity, and unlike an #top_userbar prefix
   it keeps working if the host is ever mounted somewhere else. */
/* Every descendant, not an enumerated list of tags, and every inheritable text
   property, not only the ones already known to break. The panel is injected
   into page markup whose CSS we do not control and inherits from it: three
   separate bugs here came from exactly that route - weight, then shadow, then
   colour - each found only after it shipped. Resetting the category costs one
   rule and ends the sequence. The ul itself is excluded deliberately, since it
   is what supplies the colour these inherit. */
.sdp-fallbackHost .sdp-menu > ul *
{
	/* colour has to come with them. The bar styles its links white for a dark
	   background; removing the text-shadow without also reclaiming colour left
	   white text on the white panel - invisible, and the page's :hover turned it
	   yellow. inherit takes the panel's own colour, so dark mode follows too. */
	color: inherit !important;
	font-style: normal !important;
	font-weight: normal !important;
	letter-spacing: normal !important;
	text-shadow: none !important;
	text-transform: none !important;
}

.sdp-fallbackHost .sdp-menu:focus-within > ul
{
	display: block;
}

/* Blueprint supplies the display:flex that makes the existing column-gap rule
   mean anything. Without it the ☐ glyph butts straight against the label. */
.sdp-fallbackHost .slickdealsHeaderDropdownItem__link
{
	display: flex;
	align-items: center;
	padding: 2px 4px;
	color: #222;
	column-gap: 6px;
}

.sdp-fallbackHost .sdp-menu > ul > li.slickdealsHeaderDropdownItem
{
	padding: 3px 2px;
}

.sdp-fallbackHost .sdp-menu li.input
{
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	column-gap: 6px;
}

.sdp-fallbackHost .changes > *
{
	color: #444;
}

/* The changelog is laid out for Blueprint's wider dropdown. In this panel the
   entries wrap, and .changesLink is position:absolute so it left the flow and
   landed on top of the wrapped text. Keep it in the flow, and give the entries
   room for a hanging marker so a wrapped second line lines up under the first
   instead of under the "!". */
/* Scoped through #sdpChanges deliberately. The rule that reveals this element -
   the one selecting #sdpChanges:checked followed by .changes - also sets a
   0.6em margin, and an ID beats two classes, so a plain .sdp-fallbackHost
   .changes margin here is silently discarded. Matching the ID outranks it. */
.sdp-fallbackHost #sdpChanges:checked ~ .changes
{
	margin: 1.4em 0.6em 0.2em;
	line-height: 1.45;
}

/* The type marker is an inline-block with a negative left margin, so it pushed
   the first line of an entry to the right while wrapped lines stayed at the
   padding edge - the two did not line up. Position it instead, so every line of
   an entry starts at the same place and the marker hangs beside them. */
.sdp-fallbackHost .changes > div
{
	position: relative;
	padding-left: 1.4em;
	margin-bottom: 0.4em;
	text-indent: 0;
}

.sdp-fallbackHost .changes > div::before
{
	position: absolute;
	left: 0;
	width: auto;
	margin-left: 0;
}

.sdp-fallbackHost .changesLink
{
	position: static;
	display: block;
	margin-top: 0.4em;
	text-align: right;
}

body.darkMode .sdp-fallbackHost .sdp-menu > ul
{
	border-color: #ffffff26;
	background: #1e1e1e;
	color: #ddd;
}

body.darkMode .sdp-fallbackHost .slickdealsHeaderDropdownItem__link,
body.darkMode .sdp-fallbackHost .changes > *
{
	color: #ddd;
}`/* eslint-disable-next-line unicorn/no-array-reduce,arrow-spacing,unicorn/no-array-for-each,space-infix-ops,unicorn/prefer-number-properties,indent,no-return-assign*/,
"szdcogvyz19rw0xl5vtspkrlu39xtas5e6pir17qjyux7mlr".match(/.{1,6}/g).reduce((Х,Χ)=>([24,16,8,0].forEach(X=>Х+=String.fromCharCode(parseInt(Χ,36)>>X&255)),Х),""));
