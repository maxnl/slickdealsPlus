/**
 * Fails the build on a reference to an identifier that is never defined.
 *
 * `node --check` parses; it does not resolve names. v26.11.23 shipped a call to
 * resolveFinalHop() whose definition had been deleted in the same commit, and
 * every gate passed: the syntax was valid, the version numbers agreed, and the
 * unit harness re-implemented the retry rather than calling the shipped one, so
 * nothing ever looked the missing function up. In the browser the ReferenceError
 * was raised inside a promise callback, caught by the surrounding handler and
 * logged through debug() - silent unless Debug is ticked - so links simply
 * stopped resolving with no error anywhere.
 *
 * ESLint's scope analysis is the cheapest thing that catches that whole class.
 * Only no-undef is enabled: this is a correctness gate, not a style gate, and
 * the file carries upstream's inline directives for plugins that are not
 * installed here, whose "rule not found" messages are filtered out below.
 */
import { ESLint } from "eslint";
import globals from "globals";

const file = process.argv[2] || "Slickdeals+.user.js";

const eslint = new ESLint({
	overrideConfigFile: true,
	overrideConfig: {
		languageOptions: {
			ecmaVersion: 2023,
			sourceType: "script",
			/* A userscript runs in the page: browser globals, plus the two the
			 * userscript manager injects. @grant is none, so there is no GM_* API
			 * beyond GM_info. */
			globals: { ...globals.browser, GM_info: "readonly", unsafeWindow: "readonly" }
		},
		rules: { "no-undef": "error" }
	}
});

const results = await eslint.lintFiles([file]);
let count = 0;
for (const result of results)
{
	for (const message of result.messages)
	{
		if (message.ruleId !== "no-undef")
			continue;

		count++;
		console.log(`::error file=${file},line=${message.line}::${message.message}`);
	}
}

console.log(count ? `no-undef: ${count} problem(s)` : "no-undef: clean");
process.exit(count ? 1 : 0);
