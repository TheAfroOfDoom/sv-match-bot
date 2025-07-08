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

export const gameNumToRange = (gameNum) => {
	// HARDCODED
	// Sheet supports games 1-8
	if (gameNum < 1 || gameNum > 8) {
		throw new Error(`Invalid gameNum: ${gameNum}`)
	}

	// HARDCODED
	const colMap = {
		1: ["C", "D"],
		2: ["E", "F"],
		3: ["G", "H"],
		4: ["I", "J"],
		5: ["K", "L"],
		6: ["M", "N"],
		7: ["O", "P"],
		8: ["Q", "R"],
	}
	const colRange = colMap[gameNum]

	// HARDCODED
	const rows = [3, 14]
	return `${colRange[0]}${rows[0]}:${colRange[1]}${rows[1]}`
}
