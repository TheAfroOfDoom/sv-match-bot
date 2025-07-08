import type { Match } from "./fetch.ts"
import type { TMatchPlayer } from "./schema/MatchPlayers.ts"

export const sumTeamKills = <T extends { kills?: number }>(
	teamStats: T,
	matchPlayer: TMatchPlayer
) => {
	let kills = teamStats.kills ?? 0
	kills += matchPlayer.stats.Kills
	teamStats.kills = kills
}

export const getTeamPlacement = <
	T extends { placement?: number; placementReadable?: string },
>(
	teamStats: T,
	matchPlayer: TMatchPlayer
) => {
	const { placement, team_id } = matchPlayer
	if (teamStats.placement === undefined) {
		teamStats.placement = placement
		teamStats.placementReadable = placementToReadable(placement)
		return
	}

	// If already have this placement, verify data integrity
	if (teamStats.placement !== placement) {
		throw new Error(
			`Mismatch in team ${team_id} placement: had ${teamStats.placement}, received ${placement}`
		)
	}
}

const placementToReadable = (placement) => {
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

export const getPlayers = <T extends { players?: string[] }>(
	teamStats: T,
	matchPlayer: TMatchPlayer
) => {
	const { player } = matchPlayer
	teamStats.players ??= []
	teamStats.players.push(player.unique_display_name)
}

export const aggregateMatchStats = (match: Match, aggregators): any[] => {
	let maxTeamIdx = -Infinity
	// HARDCODED
	const stats = Array.from({ length: 12 }, () => ({}))
	for (const matchPlayer of match.matchPlayers) {
		const teamId = Number(matchPlayer.team_id)
		maxTeamIdx = Math.max(teamId, maxTeamIdx)

		stats[teamId] ??= {}
		for (const aggregator of aggregators) {
			aggregator(stats[teamId], matchPlayer)
		}
	}

	return stats.slice(0, maxTeamIdx + 1)
}
