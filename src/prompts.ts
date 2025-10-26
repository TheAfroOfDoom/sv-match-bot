import chalk from "chalk"
import prompts from "prompts"

import { getPromptAnswer, savePromptAnswer } from "./cache.ts"
import { customColors, getPlacementColor, getPlayerColor } from "./colorMaps.ts"
import { getOrScrapePlayerId, type Match } from "./fetch.ts"
import { flattenPlayerStats, placementToReadable } from "./stats.ts"
import { hunterIds } from "./utils.ts"

export class Stop extends Error {}

const formatConfirmationText = (response: string) => {
	const responseLower = response.toLowerCase()
	if (["stop", "s"].includes(responseLower)) {
		return "stop"
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
interface StatsPerPlayer {
	player: string
	teamId: string
	teamName: string
	placement: number
	hero: string
	Kills: number
	Deaths: number
	Assists: number
	HeroEffectiveDamageDone: number
	HeroEffectiveDamageTaken: number
	HealingGiven: number
	HealingGivenSelf: number
}

export const checkMatch = async ({
	match,
	nextMatchNumber,
	teams,
}: {
	match: Match
	nextMatchNumber: number
	teams: { captain: string; teamId: string; teamTag: string }[]
}): Promise<{
	didTrackMatch: boolean
	matchData: (number | string)[][]
	matchNumber: number
}> => {
	// Map every match-team-idx to a team using captains
	const unfoundCaptains = new Set(teams.map((team) => team.captain))
	const matchTeamIdxToTeamMap: {
		[matchTeamIdx: string]: { captain: string; teamId: string; teamTag: string }
	} = {}
	for (const { player, team_id } of match.matchPlayers) {
		const team = teams.find(
			(team) => team.captain === player.unique_display_name
		)
		if (!team) {
			continue
		}
		matchTeamIdxToTeamMap[team_id] = team
		unfoundCaptains.delete(team.captain)
	}

	const matchStatsPerTeam: {
		[team_id: string]: {
			kills: number
			placement: number
			players: Array<string>
			teamName: string
		}
	} = {}

	const statsPerPlayer: Array<StatsPerPlayer> = []
	for (const {
		team_id,
		placement,
		stats,
		player,
		hero_asset_id,
	} of match.matchPlayers) {
		const team = matchTeamIdxToTeamMap[team_id]

		matchStatsPerTeam[team_id] ??= {
			kills: 0,
			placement: placement,
			players: [],
			teamName: team?.teamTag ?? "",
		}
		matchStatsPerTeam[team_id].kills += stats.Kills
		matchStatsPerTeam[team_id].players.push(player.unique_display_name)

		const entry = {
			hero: hunterIds[hero_asset_id] ?? hero_asset_id,
			player: player.unique_display_name,
			teamId: team?.teamId ?? -1,
			teamName: team?.teamTag ?? "",
			placement,
			...stats,
		}
		statsPerPlayer.push(entry)
	}

	const matchStatsSortedByPlacement = Object.values(matchStatsPerTeam).sort(
		(a, b) => a.placement - b.placement
	)

	console.log("\nMatch info:")
	for (const [
		teamStatsIdx,
		teamStats,
	] of matchStatsSortedByPlacement.entries()) {
		const { kills, placement, players, teamName } = teamStats

		const playersStr = players
			.map((p, pIdx) => getPlayerColor(teamStatsIdx * players.length + pIdx)(p))
			.join(", ")
		const placementColor = getPlacementColor(teamStatsIdx)
		const placementStr = placementColor(placementToReadable(placement))

		console.log(`${placementStr}: ${teamName} (${playersStr}) (${kills} kills)`)
	}
	console.log()

	if (unfoundCaptains.size > 0) {
		console.log(
			`${chalk.yellow("WARNING: ")} failed to find captains in match: ${customColors.cyanVeryBright([...unfoundCaptains].join(", "))}\n (you probably want to skip this or else the script will break)`
		)
	}

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

	if (matchResponse.confirm === "stop") {
		throw new Stop()
	} else if (!matchResponse.confirm) {
		return { didTrackMatch: false, matchData: [], matchNumber: nextMatchNumber }
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
	const playerStatsFlat = await flattenPlayerStats({
		matchId: match.matchId,
		matchNumber: matchNumResponse.number,
		statsPerPlayer,
	})

	return {
		didTrackMatch: true,
		matchData: playerStatsFlat,
		matchNumber: matchNumResponse.number,
	}
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
			validate: (val: string) => val.includes("#"),
		},
		{ onCancel: () => process.exit(0) }
	)
	await savePromptAnswer(message, playerTag)
	return playerTag
}

export const promptPlayer = async () => {
	const playerTag = await promptPlayerTag()
	const playerUuid = await getOrScrapePlayerId(playerTag)
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
	if (playerIdResponse.confirm === "stop") {
		process.exit(0)
	}
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
	const message = "Google Sheets team names sheet name:"
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

export const promptRawDataSheetName = async (): Promise<string> => {
	const message = "Google Sheets raw data sheet name:"
	const initial = await getPromptAnswer(message)
	const { name } = await prompts(
		{
			type: "text",
			name: "name",
			message,
			initial: initial ?? "Raw Data",
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
