import chalk from "chalk"
import { google } from "googleapis"
import PrettyError from "pretty-error"

import type { Match } from "./fetch.ts"
import {
	getMatchesFromPlayer,
	getMatchesWithAllPlayers,
	getPlayer,
} from "./fetch.ts"
import { authorize } from "./googleAuth.ts"
import {
	checkMatch,
	promptAddPlayer,
	promptMatchSortOrder,
	promptPlayer,
	promptRawDataSheetName,
	promptSheetName,
	promptSpreadsheetId,
	Stop,
} from "./prompts.ts"
import type { TPlayer } from "./schema/Player.ts"
import { closeBrowser, fetchNewMatchesForPlayer } from "./scrape.ts"
import { getPreExistingMatchData, getTeamNames, pushData } from "./sheets.ts"
import { sheetsHeader } from "./stats.ts"
import { wrapLog } from "./utils.ts"

const main = async () => {
	const prettyError = PrettyError.start()
	prettyError.appendStyle({
		"pretty-error > trace > item": { marginBottom: 0 },
	})

	const auth = await authorize()
	const sheets = google.sheets({ version: "v4", auth })

	const spreadsheetId = await promptSpreadsheetId()
	const sheetName = await promptSheetName()
	const teamNamesPromise = getTeamNames(sheets, sheetName, spreadsheetId)

	const rawDataSheetName = await promptRawDataSheetName()
	const preExistingMatchDataPromise = getPreExistingMatchData(
		sheets,
		rawDataSheetName,
		spreadsheetId
	)

	let matchesPromise: Promise<Match[]>
	let refreshMatchesPromise: Promise<boolean>
	const playerPromises: Promise<TPlayer>[] = []
	while (true) {
		const { playerTag, playerUuid } = await promptPlayer()

		if (playerPromises.length === 0) {
			refreshMatchesPromise = fetchNewMatchesForPlayer(playerTag)
			const playerPromise = getPlayer(playerUuid, refreshMatchesPromise)
			matchesPromise = getMatchesFromPlayer(playerPromise)
			playerPromises.push(playerPromise)
		} else {
			playerPromises.push(getPlayer(playerUuid))
		}

		const addAnotherPlayer = await promptAddPlayer()
		if (!addAnotherPlayer) {
			break
		}
	}
	const sortNewestFirst = await promptMatchSortOrder()

	const teamNames = await wrapLog(async () => await teamNamesPromise, {
		inProgressMsg: `Reading team names from spreadsheet`,
	})

	const players: TPlayer[] = await wrapLog(
		async () => await Promise.all(playerPromises),
		{ inProgressMsg: `Fetching player pages` }
	)

	const didRefreshMatches = await refreshMatchesPromise!
	if (!didRefreshMatches) {
		console.error(
			chalk.yellow(
				`${chalk.red("×")} Failed to refresh match list -- it may be outdated`
			)
		)
	}

	const customMatches = await wrapLog(async () => await matchesPromise, {
		inProgressMsg: `Fetching matches`,
	})
	const customMatchesWithAllPlayers = getMatchesWithAllPlayers(
		customMatches,
		players.slice(1)
	)
	if (sortNewestFirst) {
		customMatchesWithAllPlayers.reverse()
	}

	console.log(`Iterating through latest matches with inputted players`)
	let nextMatchNumber = sortNewestFirst ? 6 : 1
	let shouldPush = false
	const allMatchData: (number | string)[][] = []
	for (const match of customMatchesWithAllPlayers) {
		try {
			const { didTrackMatch, matchData, matchNumber } = await checkMatch({
				match,
				nextMatchNumber,
				teamNames,
			})
			if (didTrackMatch) {
				nextMatchNumber = matchNumber + (sortNewestFirst ? -1 : 1)
				allMatchData.push(...matchData)
				shouldPush = true
			}
		} catch (error) {
			if (error instanceof Stop) {
				break
			}
			throw error
		}
	}
	closeBrowser()

	if (shouldPush) {
		const preExistingMatchData = await wrapLog(
			async () => await preExistingMatchDataPromise,
			{ inProgressMsg: `Checking for preexisting match data` }
		)
		if (preExistingMatchData.length === 0) {
			preExistingMatchData.push(sheetsHeader.slice())
		}

		await pushData({
			allMatchData: preExistingMatchData.concat(allMatchData),
			rawDataSheetName,
			sheets,
			spreadsheetId,
		})
	}
}

main()
