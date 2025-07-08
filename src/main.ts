import { google } from "googleapis"

import { savePlayerId } from "./cache.ts"
import { getMatchesFromPlayer, getPlayer } from "./fetch.ts"
import { authorize } from "./googleAuth.ts"
import { checkMatch, promptPlayer } from "./prompts.ts"
import { getTeamNames } from "./sheets.ts"

const main = async () => {
	const auth = await authorize()
	const sheets = google.sheets({ version: "v4", auth })
	const teamNames = await getTeamNames(sheets)

	const { playerTag, playerUuid } = await promptPlayer()
	const player = await getPlayer(playerUuid)
	await savePlayerId(playerTag, playerUuid)

	const customMatches = await getMatchesFromPlayer(player)

	console.log(`Iterating through latest matches from player ${playerTag}`)
	let nextMatchNumber = 1
	for (const match of customMatches) {
		nextMatchNumber = await checkMatch({
			match,
			nextMatchNumber,
			sheets,
			teamNames,
		})
	}
}

main()
