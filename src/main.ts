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
	promptHunterSpecificTourney,
	promptMatchSortOrder,
	promptPlayer,
	promptSheetName,
	promptSpreadsheetId,
	remindRefreshPlayerPage,
} from "./prompts.ts"
import type { TPlayer } from "./schema/Player.ts"
import { getTeamNames } from "./sheets.ts"

const main = async () => {
	const auth = await authorize()
	const sheets = google.sheets({ version: "v4", auth })

	const spreadsheetId = await promptSpreadsheetId()
	const sheetName = await promptSheetName()

	const teamNames = await getTeamNames(sheets, sheetName, spreadsheetId)

	const { isHunterSpecificTourney, hunterId } =
		await promptHunterSpecificTourney()

	const players: TPlayer[] = []
	while (true) {
		const { playerTag, playerUuid } = await promptPlayer()
		if (players.length === 0) {
			await remindRefreshPlayerPage(playerTag)
		}

		const player = await getPlayer(playerUuid, playerTag)
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
	let nextMatchNumber = sortNewestFirst ? 6 : 1
	for (const match of customMatchesWithAllPlayers) {
		const { didTrackMatch, matchNumber } = await checkMatch({
			hunterId,
			isHunterSpecificTourney,
			match,
			nextMatchNumber,
			sheets,
			sheetName,
			spreadsheetId,
			teamNames,
		})
		if (didTrackMatch) {
			nextMatchNumber = matchNumber + (sortNewestFirst ? -1 : 1)
		}
	}
}

main()
