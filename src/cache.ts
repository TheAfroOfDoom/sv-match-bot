import { existsSync } from "fs"
import { readFile, writeFile } from "fs/promises"
import path from "path"

import { SuperviveUUID } from "./utils.ts"

const cacheDir = "cache"
const playerIdCache = "playerIds.json"

// Create file if doesn't exist
const ensureExists = async (filePath: string, val: string) => {
	if (!existsSync(filePath)) {
		await writeFile(filePath, val)
	}
}

const readPlayerIdCache = async () => {
	const filePath = path.resolve(cacheDir, playerIdCache)
	await ensureExists(filePath, "{}")
	const content = await readFile(filePath, "utf8")

	let playerIds: { [playerTag: string]: string | undefined }
	try {
		playerIds = JSON.parse(content)
	} catch (e) {
		console.error(e)
		throw new Error("Malformed player ID cache")
	}
	return playerIds
}

export const getPlayerId = async (
	playerTag: string
): Promise<SuperviveUUID | undefined> => {
	const playerIds = await readPlayerIdCache()
	const playerUuid = playerIds[playerTag]
	if (playerUuid === undefined) {
		return
	}
	return new SuperviveUUID(playerUuid)
}

export const savePlayerId = async (
	playerTag: string,
	playerUuid: SuperviveUUID
) => {
	const playerIds = await readPlayerIdCache()
	playerIds[playerTag] = playerUuid.getFormatted()

	const filePath = path.resolve(cacheDir, playerIdCache)
	await writeFile(filePath, JSON.stringify(playerIds, null, 4))
}
