import { google } from "googleapis"

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
	promptSheetName,
	promptSpreadsheetId,
} from "./prompts.ts"
import type { TPlayer } from "./schema/Player.ts"
import { getTeamNames } from "./sheets.ts"

const main = async () => {
	const auth = await authorize()
	const sheets = google.sheets({ version: "v4", auth })

	const spreadsheetId = await promptSpreadsheetId()
	const sheetName = await promptSheetName()

	const teamNames = await getTeamNames(sheets, sheetName, spreadsheetId)

	const players: TPlayer[] = []
	while (true) {
		const { playerTag, playerUuid } = await promptPlayer()
		const player = await getPlayer(playerUuid)
		await savePlayerId(playerTag, playerUuid)

		players.push(player)

		const addAnotherPlayer = await promptAddPlayer()
		if (!addAnotherPlayer) {
			break
		}
	}

	const sortNewestFirst = await promptMatchSortOrder()
	const customMatches = await getMatchesFromPlayer(players[0], sortNewestFirst)
	const customMatchesWithAllPlayers = getMatchesWithAllPlayers(
		customMatches,
		players.slice(1)
	)

	console.log(`Iterating through latest matches with inputted players`)
	let nextMatchNumber = 1
	for (const match of customMatchesWithAllPlayers) {
		nextMatchNumber = await checkMatch({
			match,
			nextMatchNumber,
			sheets,
			sheetName,
			spreadsheetId,
			teamNames,
		})
	}
}

main()
