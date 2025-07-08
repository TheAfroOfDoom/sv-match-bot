import { getTeamNames } from "./sheets.ts"
import { authorize } from "./googleAuth.ts"
import { google } from "googleapis"

const main = async () => {
	const auth = await authorize()
	const sheets = google.sheets({ version: "v4", auth })

	const teamNames = await getTeamNames(sheets)
	console.log(teamNames)
}

main()
