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
	"matchNum",
	"teamNum",
	"teamName",
	"player",
	"placement",
	"hero",
].concat(sheetsHeaderStats)
