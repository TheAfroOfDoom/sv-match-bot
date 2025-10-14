import { google } from "googleapis"
import PrettyError from "pretty-error"

import { savePlayerId } from "./cache.ts"
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
import { getPlayerStatsData, getTeamNames, pushData } from "./sheets.ts"

const main = async () => {
	const prettyError = PrettyError.start()
	prettyError.appendStyle({
		"pretty-error > trace > item": { marginBottom: 0 },
	})

	const auth = await authorize()
	const sheets = google.sheets({ version: "v4", auth })

	const spreadsheetId = await promptSpreadsheetId()
	const sheetName = await promptSheetName()
	const rawDataSheetName = await promptRawDataSheetName()

	const teamNames = await getTeamNames(sheets, sheetName, spreadsheetId)
	const playerStatsData = await getPlayerStatsData(
		sheets,
		rawDataSheetName,
		spreadsheetId
	)

	const players: TPlayer[] = []
	while (true) {
		const { playerTag, playerUuid } = await promptPlayer()
		await savePlayerId(playerTag, playerUuid)

		if (players.length === 0) {
			await fetchNewMatchesForPlayer(playerTag)
		}

		const player = await getPlayer(playerUuid)

		players.push(player)

		const addAnotherPlayer = await promptAddPlayer()
		if (!addAnotherPlayer) {
			break
		}
	}
	await closeBrowser()

	const sortNewestFirst = await promptMatchSortOrder()
	const customMatches = await getMatchesFromPlayer(players[0], sortNewestFirst)
	const customMatchesWithAllPlayers = getMatchesWithAllPlayers(
		customMatches,
		players.slice(1)
	)

	console.log(`Iterating through latest matches with inputted players`)
	let nextMatchNumber = sortNewestFirst ? 6 : 1
	let shouldPush = false
	for (const match of customMatchesWithAllPlayers) {
		try {
			const { didTrackMatch, matchNumber } = await checkMatch({
				match,
				nextMatchNumber,
				playerStatsData,
				teamNames,
			})
			if (didTrackMatch) {
				nextMatchNumber = matchNumber + (sortNewestFirst ? -1 : 1)
				shouldPush = true
			}
		} catch (error) {
			if (error instanceof Stop) {
				break
			}
			throw error
		}
	}
	if (shouldPush) {
		await pushData({
			playerStatsData,
			rawDataSheetName,
			sheets,
			spreadsheetId,
		})
	}
}

main()
