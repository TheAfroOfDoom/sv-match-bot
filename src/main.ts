import { google } from "googleapis"

import { getMatchesFromPlayer, getPlayer } from "./fetch.ts"
import { authorize } from "./googleAuth.ts"
import { checkMatch } from "./prompts.ts"
import { getTeamNames } from "./sheets.ts"
import { SuperviveUUID } from "./utils.ts"

// https://supervive.op.gg/players/steam-afro%23doom
const playerTag = "afro#doom"
const playerId = new SuperviveUUID("d43eabce-0665-4c51-a118-6525f01ec1ac")

const main = async () => {
	const auth = await authorize()
	const sheets = google.sheets({ version: "v4", auth })
	const teamNames = await getTeamNames(sheets)
	console.log(teamNames)

	const player = await getPlayer(playerId)
	const customMatches = await getMatchesFromPlayer(player)

	console.log(`Iterating through latest matches from player ${playerTag}`)
	for (const match of customMatches) {
		await checkMatch({ match, sheets, teamNames })
	}
}

main()
