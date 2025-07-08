import type { sheets_v4 } from "googleapis"

export type Sheets = sheets_v4.Sheets

async function getSheetRows(
	sheets: Sheets,
	spreadsheetId: string,
	range: string
) {
	const res = await sheets.spreadsheets.values.get({
		spreadsheetId,
		range,
	})
	const vals = res.data.values
	if (vals === null || vals === undefined) {
		throw new Error("Received undefined sheet-row data")
	}
	return vals as string[][]
}

export async function getTeamNames(
	sheets: Sheets,
	sheetName: string,
	spreadsheetId: string
): Promise<string[]> {
	const range = `'${sheetName}'!B3:B14`
	const rows = await getSheetRows(sheets, spreadsheetId, range)
	return rows.map((row) => row[0])
}

export async function updateSheetRows({
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
