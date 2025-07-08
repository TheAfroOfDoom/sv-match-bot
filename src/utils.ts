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
