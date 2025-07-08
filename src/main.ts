import { google } from "googleapis"

import { authorize } from "./googleAuth.ts"
import { getTeamNames } from "./sheets.ts"

const main = async () => {
	const auth = await authorize()
	const sheets = google.sheets({ version: "v4", auth })

	const teamNames = await getTeamNames(sheets)
	console.log(teamNames)
}

main()
