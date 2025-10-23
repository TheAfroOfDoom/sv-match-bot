// https://op.gg/supervive/api/matches/steam-4d7f5d72-c78b-459f-b550-f0604137dfec

import * as z from "zod/v4"

import { PlayerAbilities } from "./Player.ts"

const MatchStats = z.object({
	Kills: z.number(),
	Deaths: z.number(),
	Assists: z.number(),
	HeroEffectiveDamageDone: z.number(),
	HeroEffectiveDamageTaken: z.number(),
	HealingGiven: z.number(),
	HealingGivenSelf: z.number(),
})

const InventoryItem = z.object({
	identifier: z.string(),
	index: z.number(),
	slot: z.string(),
	star_level: z.number(),
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
	ability_events: z.array(
		z.object({
			hotkey: z.string(),
			id: z.string(),
			level: z.number(),
		})
	),
	inventory: z.object({
		Boots: z.array(InventoryItem),
		Inventory: z.array(InventoryItem),
		MinorUtility: z.array(InventoryItem),
		Shield: z.array(InventoryItem),
		Utility: z.array(InventoryItem),
	}),
})

export const MatchPlayers = z.array(MatchPlayer)

export type TMatchPlayers = z.infer<typeof MatchPlayers>
export type TMatchPlayer = TMatchPlayers[number]
export type TMatchPlayerStats = TMatchPlayer["stats"]
