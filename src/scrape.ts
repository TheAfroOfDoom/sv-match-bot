import chalk from "chalk"
import type { Browser } from "playwright"
import { chromium } from "playwright"

import { customColors } from "./colorMaps.ts"
import {
	insertHyphensIntoUuid,
	playerTagToOpggUrl,
	SuperviveUUID,
} from "./utils.ts"

let activeBrowser: Browser | undefined
/** Returns the active browser if it has already been launched */
export const getBrowser = async () => {
	// For debugging, try `chromium.launch({ headless: false })`
	activeBrowser ??= await chromium.launch()
	return activeBrowser
}

export const closeBrowser = async () => {
	if (activeBrowser !== undefined) {
		await activeBrowser.close()
	}
}

export const scrapePlayerId = async (
	playerTag: string
): Promise<SuperviveUUID> => {
	process.stdout.write(
		chalk.gray(
			`${chalk.yellow("…")} Fetching UUID for ${customColors.cyanVeryBright(playerTag)} ... `
		)
	)

	const browser = await getBrowser()
	const url = playerTagToOpggUrl(playerTag)

	const playerDataUrl = await getPlayerDataRequestUrl(browser, url)
	const rawUuidRegexMatch = playerDataUrl.match(
		/^https:\/\/supervive.op.gg\/api\/players\/steam-([0-9a-f]{32})\/matches\?page=1$/
	)
	if (rawUuidRegexMatch === null) {
		console.log(`\r${chalk.red("×")}`)
		throw new Error(`Failed to parse UUID for ${playerTag}`)
	}
	const rawUuid = rawUuidRegexMatch[1]
	const formattedUuid = insertHyphensIntoUuid(rawUuid)
	const svUuid = new SuperviveUUID(formattedUuid)

	process.stdout.write(chalk.cyan(svUuid.getFormatted()))
	console.log(`\r${chalk.green("√")}`)

	return svUuid
}

const getPlayerDataRequestUrl = async (
	browser: Browser,
	url: string
): Promise<string> => {
	const page = await browser.newPage()

	const { promise, resolve } = makeDeferredPromise<string>()
	page.on("request", async (request) => {
		const requestUrl = request.url()
		if (!requestUrl.endsWith("/matches?page=1")) {
			return
		}
		await page.close()
		resolve(requestUrl)
	})

	await page.goto(url)
	return promise
}

const makeDeferredPromise = <T>() => {
	let deferredResolve: (value: T) => void
	let deferredReject: (reason?: any) => void
	const promise = new Promise<T>((resolve, reject) => {
		deferredResolve = resolve
		deferredReject = reject
	})

	return {
		promise,
		// @ts-expect-error ts thinks this var is undefined, but we define it in the promise above
		resolve: deferredResolve,
		// @ts-expect-error see above comment
		reject: deferredReject,
	}
}
