// https://op.gg/supervive/api/players/steam-f5fe85bdaf854667badbab0aece6ac45/matches?page=1

import * as z from "zod/v4"

// Fields that are 0 are not returned by the op.gg API
const zero = z.number().default(0)

const PlayerStats = z.object({
	Kills: zero,
	Deaths: zero,
	Knocks: zero,
	Assists: zero,
	Knocked: zero,
	Revives: zero,
	CreepKills: zero,
	DamageDone: zero,
	Resurrects: zero,
	DamageTaken: zero,
	Resurrected: zero,
	HealingGiven: zero,
	MaxKillStreak: zero,
	HeroDamageDone: zero,
	MaxKnockStreak: zero,
	GoldFromEnemies: zero,
	HealingReceived: zero,
	HeroDamageTaken: zero,
	GoldFromMonsters: zero,
	GoldFromTreasure: zero,
	HealingGivenSelf: zero,
	EffectiveDamageDone: zero,
	EffectiveDamageTaken: zero,
	ShieldMitigatedDamage: zero,
	HeroEffectiveDamageDone: zero,
	HeroEffectiveDamageTaken: zero,
})

export const PlayerAbilities = z.array(
	z.object({
		id: z.string(),
		hotkey: z.string(),
		image_url: z.url(),
	})
)

const PlayerData = z.object({
	is_virtual: z.optional(z.boolean()),
	id: z.number(),
	stats: PlayerStats,
	platform_id: z.number(),
	match_id: z.string(),
	queue_id: z.string(),
	match_start: z.string(),
	match_end: z.string(),
	team_id: z.string(),
	player_id: z.string(),
	hero_asset_id: z.string(),
	party_id: z.string(),
	is_ranked: z.boolean(),
	placement: z.number(),
	survival_duration: z.number(),
	character_level: z.number(),
	referral_code: z.nullable(z.string()),
	created_at: z.string(),
	updated_at: z.string(),
	player_id_encoded: z.string(),
	platform: z.object({
		id: z.number(),
		code: z.string(),
	}),
	hero: z.object({
		asset_id: z.string(),
		name: z.string(),
		head_image_url: z.string(),
		abilities: PlayerAbilities,
	}),
	ability_build: z.string(),
	ability_count: z.number().nonnegative(),
})

const IncompletePlayerData = PlayerData.omit({
	id: true,
	team_id: true,
	party_id: true,
	survival_duration: true,
	referral_code: true,
	created_at: true,
	updated_at: true,
	platform: true,
	ability_build: true,
	ability_count: true,
})

export const Player = z.object({
	data: z.array(z.union([PlayerData, IncompletePlayerData])),
	meta: z.object({
		current_page: z.number(),
		per_page: z.number(),
		total: z.number(),
		last_page: z.number(),
	}),
})

export type TPlayer = z.infer<typeof Player>
