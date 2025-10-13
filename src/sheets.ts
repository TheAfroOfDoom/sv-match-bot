import chalk from "chalk"
import type { sheets_v4 } from "googleapis"

import { deleteToken } from "./googleAuth.ts"

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
	} catch (error) {
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

export async function getTeamNames(
	sheets: Sheets,
	sheetName: string,
	spreadsheetId: string
): Promise<string[]> {
	const range = `'${sheetName}'!B3:B14`
	const rows = await getSheetRows(sheets, spreadsheetId, range, sheetName)
	if (rows.length === 0) {
		throw new Error(
			"Received undefined sheet-row data (did you remember to input team names?)"
		)
	}
	return rows.map((row) => row[0])
}

export async function updateSheetRows({
	append = false,
	sheets,
	spreadsheetId,
	range,
	values,
}: {
	append?: boolean
	sheets: Sheets
	spreadsheetId: string
	range: string
	values: any[][]
}) {
	if (append) {
		const sheetName = range.split("!")[0]
		const preExistingValues = await getSheetRows(
			sheets,
			spreadsheetId,
			range,
			sheetName
		)
		// don't duplicate header row if it exists
		if (preExistingValues.length !== 0) {
			values = preExistingValues.concat(values.slice(1))
		}
	}
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
