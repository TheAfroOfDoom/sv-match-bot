import _ from "lodash"
import prompts from "prompts"

import { getPlayerId } from "./cache.ts"
import type { Match } from "./fetch.ts"
import { type Sheets, updateSheetRows } from "./sheets.ts"
import {
	aggregateMatchStats,
	getPlayers,
	getTeamPlacement,
	sumTeamKills,
} from "./stats.ts"
import {
	gameNumToRange,
	insertHyphensIntoUuid,
	isValidUuid,
	playerTagToOpggUrl,
	SuperviveUUID,
} from "./utils.ts"

const formatConfirmationText = (response: string) => {
	const responseLower = response.toLowerCase()
	if (responseLower === "stop") {
		process.exit(0)
	} else if (responseLower === "y") {
		return true
	} else {
		return false
	}
}

const validateConfirmationText = (response: string) => {
	return ["stop", "y", "n"].includes(response.toLowerCase())
}

export const checkMatch = async ({
	match,
	nextMatchNumber,
	sheets,
	sheetName,
	spreadsheetId,
	teamNames,
}: {
	match: Match
	nextMatchNumber: number
	sheets: Sheets
	sheetName: string
	spreadsheetId: string
	teamNames: string[]
}): Promise<number> => {
	const matchStats = aggregateMatchStats(match, [
		sumTeamKills,
		getTeamPlacement,
		getPlayers,
	]) as any[]
	for (const [idx, teamStats] of matchStats.entries()) {
		teamStats.teamName = teamNames[idx]
	}

	console.log()
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

	const matchResponse = await prompts(
		{
			type: "text",
			name: "confirm",
			message: "Proceed with match? (y/n/stop)",
			format: formatConfirmationText,
			validate: validateConfirmationText,
		},
		{ onCancel: () => process.exit(0) }
	)

	if (!matchResponse.confirm) {
		return nextMatchNumber
	}

	const matchNumResponse = await prompts(
		{
			type: "number",
			name: "number",
			message: "Match number?",
			initial: nextMatchNumber,
		},
		{ onCancel: () => process.exit(0) }
	)
	await trackMatch({
		matchStats,
		matchNumber: matchNumResponse.number,
		sheets,
		sheetName,
		spreadsheetId,
	})

	return matchNumResponse.number + 1
}

export const trackMatch = async ({
	matchStats,
	matchNumber,
	sheets,
	sheetName,
	spreadsheetId,
}: {
	matchStats: any
	matchNumber: number
	sheets: Sheets
	sheetName: string
	spreadsheetId: string
}) => {
	const values = matchStats.map((team) => [team.placementReadable, team.kills])
	const range = `'${sheetName}'!${gameNumToRange(matchNumber)}`
	await updateSheetRows({ sheets, spreadsheetId, range, values })
	console.log(`Successfully updated match ${matchNumber}`)
}

const promptPlayerTag = async (): Promise<string> => {
	const playerTagResponse = await prompts(
		{
			type: "text",
			name: "playerTag",
			message: "Enter a player that played in every match (e.g. afro#doom)",
			validate: (val: string) => val.length > 0 && val.includes("#"),
		},
		{ onCancel: () => process.exit(0) }
	)
	return playerTagResponse.playerTag
}

const promptPlayerId = async (playerTag: string): Promise<SuperviveUUID> => {
	console.log(
		"Retrieve the player's UUID from the following URL (see README for details)"
	)
	console.log(playerTagToOpggUrl(playerTag))

	const playerIdResponse = await prompts(
		{
			type: "text",
			name: "uuid",
			message: `${playerTag}'s UUID`,
			validate: (val: string) =>
				isValidUuid(val, { hyphens: true }) ||
				isValidUuid(val, { hyphens: false }),
			format: (val: string) => {
				if (isValidUuid(val, { hyphens: false })) {
					return insertHyphensIntoUuid(val)
				}
				return val
			},
		},
		{ onCancel: () => process.exit(0) }
	)
	return new SuperviveUUID(playerIdResponse.uuid)
}

export const promptPlayer = async () => {
	const playerTag = await promptPlayerTag()
	const playerUuid =
		(await getPlayerId(playerTag)) ?? (await promptPlayerId(playerTag))
	return {
		playerTag,
		playerUuid,
	}
}

export const promptAddPlayer = async (): Promise<boolean> => {
	const playerIdResponse = await prompts(
		{
			type: "text",
			name: "confirm",
			message: "Filter matches on additional players? (y/n/stop)",
			format: formatConfirmationText,
			validate: validateConfirmationText,
		},
		{ onCancel: () => process.exit(0) }
	)
	return playerIdResponse.confirm
}

export const promptSpreadsheetId = async (): Promise<string> => {
	const { id } = await prompts(
		{
			type: "text",
			name: "id",
			message: "Google Sheets spreadsheet ID:",
			initial: "1vGJwvRqUSZhF2BnJf5Kf1Rcjzcfuwg0zqVEoW32oNCI",
		},
		{ onCancel: () => process.exit(0) }
	)
	return id
}

export const promptSheetName = async (): Promise<string> => {
	const { name } = await prompts(
		{
			type: "text",
			name: "name",
			message: "Google Sheets sheet name:",
			initial: "SheetTest",
		},
		{ onCancel: () => process.exit(0) }
	)
	return name
}
