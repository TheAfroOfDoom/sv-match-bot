import { existsSync } from "fs"
import { mkdir, readFile, writeFile } from "fs/promises"
import path from "path"

import { SuperviveUUID } from "./utils.ts"

const cacheDir = "cache"
const playerIdCachePath = "playerIds.json"

// Create file if doesn't exist
const ensureExists = async (filePath: string, defaultVal: string) => {
	if (!existsSync(path.resolve(cacheDir))) {
		await mkdir(path.resolve(cacheDir))
	}

	if (!existsSync(filePath)) {
		await writeFile(filePath, defaultVal)
	}
}

const readCache = async (cachePath: string) => {
	const filePath = path.resolve(cacheDir, cachePath)
	await ensureExists(filePath, "{}")
	const content = await readFile(filePath, "utf8")

	let cacheResult
	try {
		cacheResult = JSON.parse(content)
	} catch (e) {
		console.error(e)
		throw new Error(`Malformed cache: ${filePath}`)
	}
	return cacheResult
}

const writeCache = async (cachePath: string, val: unknown) => {
	const filePath = path.resolve(cacheDir, cachePath)
	await writeFile(filePath, JSON.stringify(val, null, 4))
}

const readPlayerIdCache = async (): Promise<{
	[playerTag: string]: string | undefined
}> => await readCache(playerIdCachePath)

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
	await writeCache(playerIdCachePath, playerIds)
}
