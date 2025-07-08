import { authenticate } from "@google-cloud/local-auth"
import { promises as fs } from "fs"
import type { OAuth2Client } from "google-auth-library"
import { google } from "googleapis"
import path from "path"
import process from "process"

// TODO: this should be `https://www.googleapis.com/auth/drive.file`
// https://developers.google.com/identity/protocols/oauth2/scopes#sheets
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
const TOKEN_PATH = path.join(process.cwd(), "token.json")
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json")

/** Reads previously authorized credentials from the save file. */
async function loadSavedCredentialsIfExist() {
	try {
		const content = await fs.readFile(TOKEN_PATH, "utf-8")
		const credentials = JSON.parse(content)
		return google.auth.fromJSON(credentials) as unknown as OAuth2Client
	} catch {
		return null
	}
}

/** Serializes credentials to a file compatible with GoogleAuth.fromJSON. */
async function saveCredentials(client: OAuth2Client) {
	const content = await fs.readFile(CREDENTIALS_PATH, "utf-8")
	const keys = JSON.parse(content)
	const key = keys.installed || keys.web
	const payload = JSON.stringify({
		type: "authorized_user",
		client_id: key.client_id,
		client_secret: key.client_secret,
		refresh_token: client.credentials.refresh_token,
	})
	await fs.writeFile(TOKEN_PATH, payload)
}

/** Load or request or authorization to call APIs.*/
export async function authorize() {
	const credentials = await loadSavedCredentialsIfExist()
	if (credentials !== null) {
		return credentials
	}
	const client = (await authenticate({
		scopes: SCOPES,
		keyfilePath: CREDENTIALS_PATH,
	})) as unknown as OAuth2Client
	if (client.credentials) {
		await saveCredentials(client)
	}
	return client
}
