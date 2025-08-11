import { describe, expect, it } from "vitest"

import { playerTagToOpggUrl, SuperviveUUID } from "./utils.ts"

describe("SuperviveUUID", () => {
	it("should not error when given an input with dashes", () => {
		const input = "4d7f5d72-c78b-459f-b550-f0604137dfec"
		expect(() => new SuperviveUUID(input)).to.not.throw()
	})

	it("should error when given an input without dashes", () => {
		const input = "4d7f5d72c78b459fb550f0604137dfec"
		expect(() => new SuperviveUUID(input)).to.throw("missing dashes")
	})

	describe("getRaw", () => {
		it("should return a string without dashes", () => {
			const input = "4d7f5d72-c78b-459f-b550-f0604137dfec"
			const uuid = new SuperviveUUID(input)
			expect(uuid.getRaw()).to.equal("4d7f5d72c78b459fb550f0604137dfec")
		})
	})

	describe("getFormatted", () => {
		it("should return a string with dashes", () => {
			const input = "4d7f5d72-c78b-459f-b550-f0604137dfec"
			const uuid = new SuperviveUUID(input)
			expect(uuid.getFormatted()).to.equal(input)
		})
	})
})

describe("playerTagToOpggUrl", () => {
	it("should replace the `#` in a player tag with `%23`", () => {
		const input = "player#tag"
		const expected = "https://op.gg/supervive/players/steam-player%23tag"
		expect(playerTagToOpggUrl(input)).to.equal(expected)
	})
})
