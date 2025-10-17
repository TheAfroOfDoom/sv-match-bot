import chalk from "chalk"

import { getPlayerId, savePlayerId } from "./cache.ts"
import { MatchPlayers, type TMatchPlayers } from "./schema/MatchPlayers.ts"
import type { TPlayer } from "./schema/Player.ts"
import { Player } from "./schema/Player.ts"
import { scrapePlayerId } from "./scrape.ts"
import { SuperviveUUID } from "./utils.ts"

export type Match = {
	matchEnd: Date
	matchId: string
	matchPlayers: TMatchPlayers
}

export const getMatch = async (svUuid: SuperviveUUID): Promise<Match> => {
	const param = svUuid.getFormatted()
	const matchUrl = `https://op.gg/supervive/api/matches/steam-${param}`
	const response = await fetch(matchUrl)
	const matchPlayers = MatchPlayers.parse(await response.json())
	return {
		matchEnd: new Date(matchPlayers[0].match_end),
		matchId: svUuid.getFormatted(),
		matchPlayers,
	}
}

export const getPlayer = async (
	svUuid: SuperviveUUID,
	refreshMatchesPromise?: Promise<boolean>
): Promise<TPlayer> => {
	const param = svUuid.getRaw()
	const playerUrl = `https://op.gg/supervive/api/players/steam-${param}/matches`
	if (refreshMatchesPromise !== undefined) {
		await refreshMatchesPromise
	}
	const response = await fetch(playerUrl)
	const result = Player.safeParse(await response.json())
	if (!result.success) {
		console.error(chalk.red("Failed to parse player data"))
		throw new Error(result.error.message)
	}
	return result.data
}

const getMatchIdsFromPlayer = (player: TPlayer): SuperviveUUID[] => {
	const customs = player.data.filter(
		(match) => "id" in match && match.queue_id === "customgame"
	)
	return customs.map((custom) => new SuperviveUUID(custom.match_id))
}

export const getMatchesFromPlayer = async (
	playerPromise: Promise<TPlayer>
): Promise<Match[]> => {
	const matchIds = getMatchIdsFromPlayer(await playerPromise)
	const matches = await Promise.all(matchIds.map((id) => getMatch(id)))
	const sortedMatches = matches.sort(
		(a, b) => a.matchEnd.getTime() - b.matchEnd.getTime()
	)
	return sortedMatches
}

export const getMatchesWithAllPlayers = (
	matches: Match[],
	players: TPlayer[]
): Match[] =>
	matches.filter((match) =>
		players.every((player) => matchIncludesPlayer(match, player))
	)

const matchIncludesPlayer = (match: Match, player: TPlayer): boolean =>
	match.matchPlayers.some(
		(matchPlayer) =>
			matchPlayer.player_id_encoded === player.data[0].player_id_encoded
	)

export const getOrScrapePlayerId = async (
	playerTag: string
): Promise<SuperviveUUID> => {
	let playerId = await getPlayerId(playerTag)
	if (playerId !== undefined) {
		return playerId
	}
	playerId = await scrapePlayerId(playerTag)
	await savePlayerId(playerTag, playerId)
	return playerId
}
