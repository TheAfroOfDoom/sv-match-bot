// https://op.gg/supervive/api/matches/steam-4d7f5d72-c78b-459f-b550-f0604137dfec

import * as z from "zod/v4"

const MatchStats = z.object({
	Kills: z.number(),
	Deaths: z.number(),
	Assists: z.number(),
	HeroEffectiveDamageDone: z.number(),
	HeroEffectiveDamageTaken: z.number(),
	HealingGiven: z.number(),
	HealingGivenSelf: z.number(),
})

const MatchPlayer = z.object({
	match_end: z.string(),
	team_id: z.string(),
	hero_asset_id: z.string(),
	is_ranked: z.boolean(),
	placement: z.number(),
	survival_duration: z.number(),
	character_level: z.number(),
	stats: MatchStats,
	player_id_encoded: z.string(),
	player: z.object({
		display_name: z.string(),
		unique_display_name: z.string(),
	}),
	hero: z.object({
		head_image_url: z.string(),
		name: z.string(),
	}),
})

export const MatchPlayers = z.array(MatchPlayer)

export type TMatchPlayers = z.infer<typeof MatchPlayers>
export type TMatchPlayer = TMatchPlayers[number]
export type TMatchPlayerStats = TMatchPlayer["stats"]
