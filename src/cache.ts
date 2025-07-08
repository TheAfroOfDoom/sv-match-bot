import { existsSync } from "fs"
import { readFile, writeFile } from "fs/promises"
import path from "path"

import type { SuperviveUUID } from "./utils"

const cacheDir = "cache"
const playerIdCache = "playerIds.json"

// Create file if doesn't exist
const ensureExists = async (filePath: string) => {
	if (!existsSync(filePath)) {
		await writeFile(filePath, "")
	}
}

export const savePlayerId = async (
	playerTag: string,
	playerUuid: SuperviveUUID
) => {
	const filePath = path.resolve(cacheDir, playerIdCache)
	await ensureExists(filePath)

	const content = await readFile(filePath, "utf8")
	const playerIdsRaw = content.trim() === "" ? "{}" : content

	let playerIds: { [playerTag: string]: string }
	try {
		playerIds = JSON.parse(playerIdsRaw)
	} catch (e) {
		console.error(e)
		throw new Error("Malformed player ID cache")
	}

	playerIds[playerTag] = playerUuid.getFormatted()

	await writeFile(filePath, JSON.stringify(playerIds, null, 4))
}
