import chalk from "chalk"
import _ from "lodash"
import prompts from "prompts"

import { getPlayerId, getPromptAnswer, savePromptAnswer } from "./cache.ts"
import { getPlacementColor, getPlayerColor } from "./colorMaps.ts"
import type { Match } from "./fetch.ts"
import { scrapePlayerId } from "./scrape.ts"
import { type Sheets, updateSheetRows } from "./sheets.ts"
import {
	aggregateMatchStats,
	getPlayers,
	getTeamPlacement,
	sumHunterKills,
	sumNonHunterKills,
	sumTeamKills,
} from "./stats.ts"
import { gameNumToRange, hunterIds } from "./utils.ts"

const formatConfirmationText = (response: string) => {
	const responseLower = response.toLowerCase()
	if (["stop", "s"].includes(responseLower)) {
		process.exit(0)
	} else if (["yes", "y"].includes(responseLower)) {
		return true
	} else {
		return false
	}
}

const yesNoStr = `${chalk.green("[y]es")} / ${chalk.yellow("[n]o")}`
const yesNoStopStr = `(${yesNoStr} / ${chalk.red("[s]top")})`

const validateConfirmationText = (response: string) => {
	return ["stop", "s", "yes", "y", "no", "n"].includes(response.toLowerCase())
}

export const checkMatch = async ({
	hunterId,
	isHunterSpecificTourney,
	match,
	nextMatchNumber,
	sheets,
	sheetName,
	spreadsheetId,
	teamNames,
}: {
	hunterId: string | undefined
	isHunterSpecificTourney: boolean
	match: Match
	nextMatchNumber: number
	sheets: Sheets
	sheetName: string
	spreadsheetId: string
	teamNames: string[]
}): Promise<{ didTrackMatch: boolean; matchNumber: number }> => {
	const aggregators = [getTeamPlacement, getPlayers] as any[]
	if (isHunterSpecificTourney) {
		aggregators.push(sumHunterKills(hunterId!), sumNonHunterKills(hunterId!))
	} else {
		aggregators.push(sumTeamKills)
	}

	const matchStats = aggregateMatchStats(match, aggregators)
	for (const [idx, teamStats] of matchStats.entries()) {
		teamStats.teamName = teamNames[idx]
	}

	const matchStatsSorted = _.cloneDeep(matchStats).sort(
		(a, b) => a.placement - b.placement
	)

	console.log()
	console.log("Match info:")
	for (const [teamStatsIdx, teamStats] of matchStatsSorted.entries()) {
		const {
			hunterKills = 0,
			kills,
			players,
			placementReadable,
			teamName,
		} = teamStats

		const playersStr = players
			.map((p, pIdx) => getPlayerColor(teamStatsIdx * players.length + pIdx)(p))
			.join(", ")
		const placementColor = getPlacementColor(teamStatsIdx)
		const placementStr = placementColor(placementReadable)

		console.log(
			`${placementStr}: ${teamName} (${playersStr}) (${kills + hunterKills} kills)`
		)
	}
	console.log()

	const matchResponse = await prompts(
		{
			type: "text",
			name: "confirm",
			message: `Proceed with match? ${yesNoStopStr}`,
			format: formatConfirmationText,
			validate: validateConfirmationText,
		},
		{ onCancel: () => process.exit(0) }
	)

	if (!matchResponse.confirm) {
		return { didTrackMatch: false, matchNumber: nextMatchNumber }
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
		isHunterSpecificTourney,
		matchStats,
		matchNumber: matchNumResponse.number,
		sheets,
		sheetName,
		spreadsheetId,
	})

	return { didTrackMatch: true, matchNumber: matchNumResponse.number }
}

export const trackMatch = async ({
	isHunterSpecificTourney,
	matchStats,
	matchNumber,
	sheets,
	sheetName,
	spreadsheetId,
}: {
	isHunterSpecificTourney: boolean
	matchStats: any
	matchNumber: number
	sheets: Sheets
	sheetName: string
	spreadsheetId: string
}) => {
	const values = matchStats.map((team) =>
		isHunterSpecificTourney
			? [team.placementReadable, team.hunterKills ?? 0, team.kills]
			: [team.placementReadable, team.kills]
	)
	const range = `'${sheetName}'!${gameNumToRange(matchNumber, { isHunterSpecificTourney })}`
	await updateSheetRows({ sheets, spreadsheetId, range, values })
	console.log(`Successfully updated match ${matchNumber}`)
}

const promptPlayerTag = async (): Promise<string> => {
	const message = "Enter a player that played in every match"
	const initial = await getPromptAnswer(message)
	const { playerTag } = await prompts(
		{
			type: "text",
			name: "playerTag",
			message,
			initial: initial ?? "afro#doom",
			validate: (val: string) => val.length > 0 && val.includes("#"),
		},
		{ onCancel: () => process.exit(0) }
	)
	await savePromptAnswer(message, playerTag)
	return playerTag
}

export const promptPlayer = async () => {
	const playerTag = await promptPlayerTag()
	const playerUuid =
		(await getPlayerId(playerTag)) ?? (await scrapePlayerId(playerTag))
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
			message: `Filter matches on additional players? ${yesNoStopStr}`,
			initial: "n",
			format: formatConfirmationText,
			validate: validateConfirmationText,
		},
		{ onCancel: () => process.exit(0) }
	)
	return playerIdResponse.confirm
}

export const promptSpreadsheetId = async (): Promise<string> => {
	const message = "Google Sheets spreadsheet ID:"
	const initial = await getPromptAnswer(message)
	const { id } = await prompts(
		{
			type: "text",
			name: "id",
			message,
			initial: initial ?? "1vGJwvRqUSZhF2BnJf5Kf1Rcjzcfuwg0zqVEoW32oNCI",
		},
		{ onCancel: () => process.exit(0) }
	)
	await savePromptAnswer(message, id)
	return id
}

export const promptSheetName = async (): Promise<string> => {
	const message = "Google Sheets sheet name:"
	const initial = await getPromptAnswer(message)
	const { name } = await prompts(
		{
			type: "text",
			name: "name",
			message,
			initial: initial ?? "SheetTest",
		},
		{ onCancel: () => process.exit(0) }
	)
	await savePromptAnswer(message, name)
	return name
}

export const promptMatchSortOrder = async (): Promise<boolean> => {
	const message = "Match display order? (newest/oldest)"
	const initial = await getPromptAnswer(message)
	const { sortNewestFirst } = await prompts(
		{
			type: "text",
			name: "sortNewestFirst",
			message,
			initial: initial ?? "newest",
			validate: (response: string) =>
				["newest", "oldest"].includes(response.toLowerCase()),
		},
		{ onCancel: () => process.exit(0) }
	)
	await savePromptAnswer(message, sortNewestFirst)
	return sortNewestFirst.toLowerCase() === "newest"
}

type HunterSpecificTourneyResult =
	| { isHunterSpecificTourney: true; hunterId: string }
	| { isHunterSpecificTourney: false; hunterId: undefined }

export const promptHunterSpecificTourney =
	async (): Promise<HunterSpecificTourneyResult> => {
		const message = `Hunter specific tourney? (${yesNoStr})`
		const initial = await getPromptAnswer(message)
		const { answer } = await prompts(
			{
				type: "text",
				name: "answer",
				message,
				initial: initial ?? "n",
				validate: (response: string) =>
					["yes", "y", "no", "n"].includes(response.toLowerCase()),
			},
			{ onCancel: () => process.exit(0) }
		)
		await savePromptAnswer(message, answer)
		const isHunterSpecificTourney = ["yes", "y"].includes(answer.toLowerCase())

		let hunterId
		if (isHunterSpecificTourney) {
			hunterId = await promptHunterName()
		}

		return { isHunterSpecificTourney, hunterId }
	}

const promptHunterName = async (): Promise<string> => {
	const message = "Hunter name:"
	const initial = await getPromptAnswer(message)
	const { name } = await prompts({
		type: "text",
		name: "name",
		message,
		initial: initial ?? "joule",
		validate: (response: string) =>
			Object.keys(hunterIds).includes(response.toLowerCase()),
	})
	await savePromptAnswer(message, name.toLowerCase())
	return hunterIds[name.toLowerCase()]
}
