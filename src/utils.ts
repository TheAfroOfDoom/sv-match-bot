export class SuperviveUUID {
	val: string

	constructor(val: string) {
		if (!val.includes("-")) {
			throw new Error("UUID missing dashes (-)")
		}
		this.val = val
	}

	getRaw() {
		return this.val.replaceAll("-", "")
	}

	getFormatted() {
		return this.val
	}
}

export const hunterIds = {
	ghost: "hero:assault",
	zeph: "hero:backlinehealer",
	carbine: "hero:bountyhunter",
	crysta: "hero:burstcaster",
	saros: "hero:farshot",
	felix: "hero:firefox",
	shiv: "hero:flex",
	celeste: "hero:freeze",
	hudson: "hero:gunner",
	kingpin: "hero:hookguy",
	myth: "hero:huntress",
	elluna: "hero:reshealer",
	bishop: "hero:rocketjumper",
	brall: "hero:ronin",
	oath: "hero:shieldbot",
	shrike: "hero:sniper",
	jin: "hero:stalker",
	joule: "hero:storm",
	eva: "hero:succubus",
	beebo: "hero:beebo",
	void: "hero:void",
}

// HARDCODED
// these could be converted to be dynamic with some parameters, e.g.
// rangeLength: number
const normalColMap = {
	1: ["C", "D"],
	2: ["E", "F"],
	3: ["G", "H"],
	4: ["I", "J"],
	5: ["K", "L"],
	6: ["M", "N"],
	7: ["O", "P"],
	8: ["Q", "R"],
}

const hunterSpecificColMap = {
	1: ["C", "E"],
	2: ["F", "H"],
	3: ["I", "K"],
	4: ["L", "N"],
	5: ["O", "Q"],
	6: ["R", "T"],
	7: ["U", "W"],
	8: ["X", "Z"],
}

export const gameNumToRange = (
	gameNum: number,
	{ isHunterSpecificTourney }: { isHunterSpecificTourney: boolean }
) => {
	// HARDCODED
	// Sheet supports games 1-8
	if (gameNum < 1 || gameNum > 8) {
		throw new Error(`Invalid gameNum: ${gameNum}`)
	}

	const colMap = isHunterSpecificTourney ? hunterSpecificColMap : normalColMap
	const colRange = colMap[gameNum]

	// HARDCODED
	const rows = [3, 14]
	return `${colRange[0]}${rows[0]}:${colRange[1]}${rows[1]}`
}

export const playerTagToOpggUrl = (playerTag: string) =>
	`https://supervive.op.gg/players/steam-${playerTag.replace("#", "%23")}`

export const isValidUuid = (
	val: string,
	{ hyphens = true }: { hyphens: boolean }
) => {
	const pattern = hyphens
		? /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i
		: /^[0-9A-F]{8}[0-9A-F]{4}[4][0-9A-F]{3}[89AB][0-9A-F]{3}[0-9A-F]{12}$/i
	return pattern.test(val)
}

export const insertHyphensIntoUuid = (val: string) =>
	`${val.slice(0, 8)}-${val.slice(8, 12)}-${val.slice(12, 16)}-${val.slice(16, 20)}-${val.slice(20)}`
