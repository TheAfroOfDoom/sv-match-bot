import { getOrScrapePlayerId } from "./fetch.ts"

export const placementToReadable = (placement: number) => {
	const map = [
		"1st",
		"2nd",
		"3rd",
		"4th",
		"5th",
		"6th",
		"7th",
		"8th",
		"9th",
		"10th",
		"11th",
		"12th",
		"13th",
	]
	const idx = Number(placement) - 1
	return map[idx]
}

export const flattenPlayerStats = async ({
	matchId,
	matchNumber,
	statsPerPlayer,
}: {
	matchId: string
	matchNumber: number
	statsPerPlayer: Array<{
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
	}>
}) => {
	const flatPlayerStats: (number | string)[][] = []
	for (const playerStats of statsPerPlayer) {
		const playerId = await getOrScrapePlayerId(playerStats.player)
		const row = [
			matchId,
			playerId.getFormatted(),
			matchNumber,
			Number(playerStats.teamId),
			playerStats.teamName,
			playerStats.player,
			playerStats.placement,
			playerStats.hero,
		]
		for (const tag of sheetsHeaderStats) {
			row.push(playerStats[tag])
		}
		flatPlayerStats.push(row)
	}
	return flatPlayerStats
}

export const sheetsHeaderStats = [
	"Kills",
	"Deaths",
	"Assists",
	"HeroEffectiveDamageDone",
	"HeroEffectiveDamageTaken",
	"HealingGiven",
	"HealingGivenSelf",
] as const

export const sheetsHeader = [
	"matchId",
	"playerId",
	"matchNum",
	"teamNum",
	"teamName",
	"player",
	"placement",
	"hero",
].concat(sheetsHeaderStats)
