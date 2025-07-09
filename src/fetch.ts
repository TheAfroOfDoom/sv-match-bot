import { MatchPlayers, type TMatchPlayers } from "./schema/MatchPlayers.ts"
import type { TPlayer } from "./schema/Player.ts"
import { Player } from "./schema/Player.ts"
import { SuperviveUUID } from "./utils.ts"

export type Match = {
	matchEnd: Date
	matchPlayers: TMatchPlayers
}

export const getMatch = async (svUuid: SuperviveUUID): Promise<Match> => {
	const param = svUuid.getFormatted()
	const matchUrl = `https://supervive.op.gg/api/matches/steam-${param}`
	const response = await fetch(matchUrl)
	const matchPlayers = MatchPlayers.parse(await response.json())
	return {
		matchEnd: new Date(matchPlayers[0].match_end),
		matchPlayers,
	}
}

export const getPlayer = async (svUuid: SuperviveUUID): Promise<TPlayer> => {
	const param = svUuid.getRaw()
	const playerUrl = `https://supervive.op.gg/api/players/steam-${param}/matches`
	const response = await fetch(playerUrl)
	return Player.parse(await response.json())
}

const getMatchIdsFromPlayer = (player: TPlayer): SuperviveUUID[] => {
	const customs = player.data.filter((match) => match.queue_id === "customgame")
	return customs.map((custom) => new SuperviveUUID(custom.match_id))
}

export const getMatchesFromPlayer = async (
	player: TPlayer,
	sortNewestFirst: boolean
) => {
	const matchIds = getMatchIdsFromPlayer(player)
	const matches = await Promise.all(matchIds.map((id) => getMatch(id)))
	const sortedMatches = matches.sort(
		(a, b) => a.matchEnd.getTime() - b.matchEnd.getTime()
	)
	if (sortNewestFirst) {
		sortedMatches.reverse()
	}
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
