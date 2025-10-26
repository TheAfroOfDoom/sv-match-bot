import chalk from "chalk"
import type { sheets_v4 } from "googleapis"

import { deleteToken } from "./googleAuth.ts"
import { sheetsHeader } from "./stats.ts"
import { columnToLetter, validateTeamData, wrapLog } from "./utils.ts"

export type Sheets = sheets_v4.Sheets

async function getSheetRows(
	sheets: Sheets,
	spreadsheetId: string,
	range: string,
	sheetName: string
) {
	let res
	try {
		res = await sheets.spreadsheets.values.get({
			spreadsheetId,
			range,
			valueRenderOption: "UNFORMATTED_VALUE",
		})
	} catch (error: any) {
		if (error.message === "Requested entity was not found.") {
			const msg = `${chalk.red("Failed to access Google Sheets spreadsheet with ID: ")}${chalk.yellow(spreadsheetId)}`
			console.error(msg)
			process.exit(1)
		} else if (error.message.includes("Unable to parse range")) {
			const msg =
				chalk.red("Failed to access Google Sheets sheet name/range: ") +
				chalk.yellow(sheetName) +
				chalk.red(" / ") +
				chalk.cyan(range)
			console.error(msg)
			process.exit(1)
		} else if (
			error.message === "invalid_grant" ||
			error.message === "invalid_client"
		) {
			await deleteToken()

			const reason =
				error.message === "invalid_grant"
					? `has ${chalk.yellow("expired")}`
					: `is ${chalk.yellow("invalid")}`

			const msg = chalk.red(
				`Your Google OAuth token ${reason}. ` +
					`Please ${chalk.yellow("re-authenticate")} (re-run the script)`
			)
			console.error(msg)
			process.exit(1)
		}
		throw error
	}
	const vals = res.data.values ?? []
	return vals as string[][]
}

export async function getTeams(
	sheets: Sheets,
	sheetName: string,
	spreadsheetId: string
): Promise<{ captain: string; teamId: string; teamTag: string }[]> {
	const range = `'${sheetName}'!B18:C29`
	const rows = await getSheetRows(sheets, spreadsheetId, range, sheetName)
	if (rows.length === 0) {
		throw new Error(
			"Received undefined sheet-row data (did you remember to input team names?)"
		)
	}
	const pairs = rows.map((row) => ({ captain: row[1], teamTag: row[0] }))
	return validateTeamData(pairs)
}

export async function getPreExistingMatchData(
	sheets: Sheets,
	rawDataSheetName: string,
	spreadsheetId: string
): Promise<(number | string)[][]> {
	const colEnd = columnToLetter(sheetsHeader.length)
	const range = `'${rawDataSheetName}'!A:${colEnd}`
	const rows = await getSheetRows(
		sheets,
		spreadsheetId,
		range,
		rawDataSheetName
	)
	return rows
}

async function updateSheetRows({
	sheets,
	spreadsheetId,
	range,
	values,
}: {
	sheets: Sheets
	spreadsheetId: string
	range: string
	values: any[][]
}) {
	const res = await sheets.spreadsheets.values.update({
		spreadsheetId,
		range,
		valueInputOption: "RAW",
		requestBody: {
			values,
		},
	})
	return res
}

export async function pushData({
	allMatchData,
	rawDataSheetName,
	sheets,
	spreadsheetId,
}: {
	allMatchData: (number | string)[][]
	rawDataSheetName: string
	sheets: Sheets
	spreadsheetId: string
}): Promise<void> {
	return wrapLog(
		async () => {
			const colStart = "A"
			const colEnd = columnToLetter(sheetsHeader.length)
			await updateSheetRows({
				sheets,
				spreadsheetId,
				range: `${rawDataSheetName}!${colStart}:${colEnd}`,
				values: allMatchData,
			})
		},
		{ inProgressMsg: `Pushing data to Google Sheets` }
	)
}
