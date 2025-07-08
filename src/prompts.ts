import _ from "lodash"
import prompts from "prompts"

import type { Match } from "./fetch.ts"
import { type Sheets, updateSheetRows } from "./sheets.ts"
import {
	aggregateMatchStats,
	getPlayers,
	getTeamPlacement,
	sumTeamKills,
} from "./stats.ts"
import { gameNumToRange } from "./utils.ts"

export const checkMatch = async ({
	match,
	sheets,
	teamNames,
}: {
	match: Match
	sheets: Sheets
	teamNames: string[]
}) => {
	const matchStats = aggregateMatchStats(match, [
		sumTeamKills,
		getTeamPlacement,
		getPlayers,
	]) as any[]
	for (const [idx, teamStats] of matchStats.entries()) {
		teamStats.teamName = teamNames[idx]
	}

	console.log("Match info:")
	for (const teamStats of _.cloneDeep(matchStats).sort(
		(a, b) => a.placement - b.placement
	)) {
		const players = teamStats.players.join(", ")
		console.log(
			`${teamStats.placementReadable}: ${teamStats.teamName} (${players}) (${teamStats.kills} kills)`
		)
	}
	console.log()

	const matchResponse = await prompts({
		type: "confirm",
		name: "confirm",
		message: "Proceed with match?",
	})

	if (!matchResponse.confirm) {
		return
	}

	const matchNumResponse = await prompts({
		type: "number",
		name: "number",
		message: "Match number?",
	})
	await trackMatch({ matchStats, matchNumber: matchNumResponse.number, sheets })
}

export const trackMatch = async ({
	matchStats,
	matchNumber,
	sheets,
}: {
	matchStats: any
	matchNumber: number
	sheets: Sheets
}) => {
	const values = matchStats.map((team) => [team.placementReadable, team.kills])
	const range = gameNumToRange(matchNumber)
	await updateSheetRows(sheets, range, values)
	console.log(`Successfully updated match ${matchNumber}`)
}
