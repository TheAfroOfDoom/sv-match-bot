import type { sheets_v4 } from "googleapis"

type Sheets = sheets_v4.Sheets

// https://docs.google.com/spreadsheets/d/1vGJwvRqUSZhF2BnJf5Kf1Rcjzcfuwg0zqVEoW32oNCI/edit?gid=439191577#gid=439191577
const spreadsheetId = "1vGJwvRqUSZhF2BnJf5Kf1Rcjzcfuwg0zqVEoW32oNCI"

async function getSheetRows(sheets: Sheets, range: string) {
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

export async function getTeamNames(sheets: Sheets): Promise<string[][]> {
	const range = "B3:B14"
	return await getSheetRows(sheets, range)
}

export async function updateSheetRows(
	sheets: Sheets,
	range: string,
	values: any[][]
) {
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
