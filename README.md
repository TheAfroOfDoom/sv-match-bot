# SV match bot

Pulls from OP.GG API and updates a Google Sheets spreadsheet automatically with team standings + kill counts with some light user guidance

## Setup

1. Install [Node v24.3.0](https://nodejs.org/en/download/current)
   1. Check version with `node --version`
2. Install [Yarn](https://classic.yarnpkg.com/en/docs/install)
   1. `npm install --global yarn`
   2. Check version with `yarn --version`
3. Install project dependencies by running `yarn`
4. Request a credentials key from a project maintainer
   1. Place this `credentials.json` file at the root of your project (e.g. next to `package.json`)

## Usage

Run the following: `node src/main.ts`

You'll need to manually retrieve player UUIDs for match filtering. The script will prompt you for this when it needs one.

1. Go to a player's op.gg stats page (e.g. https://supervive.op.gg/players/steam-afro%23doom)
2. Open dev tools (F12)
3. Open the `Network` tab
4. Filter requests by `XHR` type in the top-right
5. Refresh the page (`CTRL+R`)
6. Double click the entry that ends with `matches?page=1`
7. The player's UUID will be listed after `steam-` in the URL
   1. e.g. for URL https://supervive.op.gg/api/players/steam-d43eabce06654c51a1186525f01ec1ac/matches?page=1, the UUID is `d43eabce06654c51a1186525f01ec1ac`

TODO make a video that visualizes this process
