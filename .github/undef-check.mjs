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

/* A gate that reports "clean" without having looked is the 26.11.23 failure
 * repeating one level up, so establish that the file was actually analysed
 * before trusting a zero count. Two ways it silently was not:
 *
 * 1. ESLint skips paths outside the project root and says so in a *warning*,
 *    not an error - so linting a file in /tmp scored a clean pass on a build
 *    with an undefined call in it. isPathIgnored is the documented check.
 * 2. A parse error is reported with `ruleId: null`, which the no-undef filter
 *    below discards. The parser here is pinned to ecmaVersion 2023 while
 *    `node --check` accepts whatever the runtime does, so syntax newer than
 *    2023 clears the syntax gate and then disables this one: measured with an
 *    ES2024 `v`-flag regex, which reported clean while an undefined call sat
 *    two tokens away. Fatal messages therefore fail the build on their own. */
if (await eslint.isPathIgnored(file))
{
	console.log(`::error::${file} is outside the linted project root - nothing was checked`);
	process.exit(1);
}

const results = await eslint.lintFiles([file]);

if (results.length === 0)
{
	console.log(`::error::no lint results for ${file} - nothing was checked`);
	process.exit(1);
}

let count = 0;
let fatal = 0;
for (const result of results)
{
	for (const message of result.messages)
	{
		if (message.fatal)
		{
			fatal++;
			console.log(`::error file=${file},line=${message.line}::${message.message}`);
			continue;
		}

		if (message.ruleId !== "no-undef")
			continue;

		count++;
		console.log(`::error file=${file},line=${message.line}::${message.message}`);
	}
}

if (fatal)
{
	console.log(`no-undef: not run - ${fatal} parse error(s); the file was never analysed`);
	process.exit(1);
}

console.log(count ? `no-undef: ${count} problem(s)` : "no-undef: clean");
process.exit(count ? 1 : 0);
