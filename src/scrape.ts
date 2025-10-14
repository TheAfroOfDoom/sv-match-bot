import chalk from "chalk"
import type { Browser } from "playwright"
import { chromium } from "playwright"

import { customColors } from "./colorMaps.ts"
import {
	insertHyphensIntoUuid,
	playerTagToOpggUrl,
	SuperviveUUID,
	wrapLog,
} from "./utils.ts"

const userAgent =
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36"

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
	return wrapLog(
		async () => {
			const browser = await getBrowser()
			const url = playerTagToOpggUrl(playerTag)

			const playerDataUrl = await getPlayerDataRequestUrl(browser, url)
			const rawUuidRegexMatch = playerDataUrl.match(
				/^https:\/\/op\.gg\/supervive\/api\/players\/steam-([0-9a-f]{32})\/matches\?page=1$/
			)
			if (rawUuidRegexMatch === null) {
				throw new Error(`Failed to parse UUID for ${playerTag}`)
			}
			const rawUuid = rawUuidRegexMatch[1]
			const formattedUuid = insertHyphensIntoUuid(rawUuid)
			const svUuid = new SuperviveUUID(formattedUuid)

			process.stdout.write(chalk.cyan(svUuid.getFormatted()))

			return svUuid
		},
		{
			inProgressMsg: `Fetching UUID for ${customColors.cyanVeryBright(playerTag)}`,
		}
	)
}

const getPlayerDataRequestUrl = async (
	browser: Browser,
	url: string
): Promise<string> => {
	const page = await browser.newPage({ userAgent })

	const requestPromise = page.waitForRequest((request) =>
		request.url().endsWith("/matches?page=1")
	)
	await page.goto(url)
	const playerDataRequest = await requestPromise
	await page.close()
	return playerDataRequest.url()
}

export const fetchNewMatchesForPlayer = async (
	playerTag: string
): Promise<boolean> => {
	const browser = await getBrowser()
	const url = playerTagToOpggUrl(playerTag)
	const page = await browser.newPage({ userAgent })

	const { promise, resolve } = makeDeferredPromise<boolean>()
	page.on("response", async (response) => {
		const method = response.request().method()
		if (method !== "POST") {
			return
		}
		if (!response.request().url().endsWith("/matches/fetch")) {
			return
		}

		let result
		await response.finished()
		if (response.status() !== 200) {
			result = false
		} else {
			result = true
		}

		await page.close()
		resolve(result)
	})

	await page.goto(url)
	const button = page.getByRole("button", { name: "Fetch New Matches" })
	await button.click()

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
