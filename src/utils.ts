import chalk from "chalk"

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

export const playerTagToOpggUrl = (playerTag: string) =>
	`https://op.gg/supervive/players/steam-${playerTag.replace("#", "%23")}`

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

// https://stackoverflow.com/a/21231012/13789724
export const columnToLetter = (column: number) => {
	let temp: number
	let letter = ""
	while (column > 0) {
		temp = (column - 1) % 26
		letter = String.fromCharCode(temp + 65) + letter
		column = (column - temp - 1) / 26
	}
	return letter
}

export const wrapLog = async <T>(
	func: () => T,
	{
		inProgressMsg,
	}: {
		inProgressMsg: string
	}
): Promise<T> => {
	try {
		process.stdout.write(chalk.gray(chalk.yellow("…"), `${inProgressMsg} ... `))
		const result = await func()
		process.stdout.write(`\r${chalk.green("√")}\n`)
		return result
	} catch (error) {
		process.stdout.write(`\r${chalk.red("×")}\n`)
		throw error
	}
}

export const hunterIds: { [hero_asset_id: string]: string } = {
	"hero:assault": "ghost",
	"hero:backlinehealer": "zeph",
	"hero:bountyhunter": "carbine",
	"hero:burstcaster": "crysta",
	"hero:farshot": "saros",
	"hero:firefox": "felix",
	"hero:flex": "shiv",
	"hero:freeze": "celeste",
	"hero:gunner": "hudson",
	"hero:hookguy": "kingpin",
	"hero:huntress": "myth",
	"hero:reshealer": "elluna",
	"hero:rocketjumper": "bishop",
	"hero:ronin": "brall",
	"hero:shieldbot": "oath",
	"hero:sniper": "shrike",
	"hero:stalker": "jin",
	"hero:storm": "joule",
	"hero:succubus": "eva",
	"hero:beebo": "beebo",
	"hero:void": "void",
}
