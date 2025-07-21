import chalk from "chalk"

const playerColors = [
	chalk.hex("#fd5444"),
	chalk.blueBright,
	chalk.green,
	chalk.magenta,
	chalk.yellow,
	chalk.cyanBright,
	chalk.hex("#ffa500"),
	chalk.hex("#ff85f2"),
]

export const getPlayerColor = (idx: number) =>
	playerColors[idx % playerColors.length]

const placementColors = [
	"#ffd54f",
	"#ffb74d",
	"#f48fb1",
	"#f06292",
	"#ec407a",
	"#42a5f5",
	"#ab47bc",
	"#7e57c2",
	"#1e88e5",
	"#1976d2",
	"#1565c0",
	"#0d47a1",
].map((hexCode) => chalk.hex(hexCode))

export const getPlacementColor = (idx: number) => placementColors[idx]

export const customColors = {
	cyanVeryBright: chalk.hex("#92ebf4"),
}
