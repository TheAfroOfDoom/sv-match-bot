import chalk from "chalk"
import { simpleGit } from "simple-git"

import { wrapLog } from "./utils.ts"

const git = simpleGit()

export const checkForUpdates = async (): Promise<void> => {
	if (process.env.DISABLE_AUTO_UPDATE === "1") {
		return
	}
	const currentBranch = (await git.branch()).current
	if (currentBranch !== "main") {
		return
	}

	await wrapLog(
		async () => {
			await git.fetch()
			const refHead = await git.revparse("HEAD")
			const refOriginHead = await git.revparse("origin/HEAD")

			if (refHead === refOriginHead) {
				process.stdout.write(chalk.gray("up-to-date"))
				return
			}

			await stashLocalChanges()
			await git.reset(["--hard", "origin/main"])

			process.stdout.write("successfully updated -- re-run the script")
			process.stdout.write(`\r${chalk.green("√")}\n`)
			process.exit(0)
		},
		{
			inProgressMsg: `Checking for script updates`,
		}
	)
}

const stashLocalChanges = async (): Promise<void> => {
	const status = await git.status(["--untracked-files=no", "--porcelain"])
	const isClean = status.isClean()
	if (!isClean) {
		await git.stash(["-m", `auto-update stash on ${new Date().toISOString()}`])
	}
}
