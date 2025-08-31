# SV match bot

Pulls from OP.GG API and updates a Google Sheets spreadsheet automatically with team standings + kill counts with some light user guidance

## Setup

1. Install [Node v24.3.0](https://nodejs.org/en/download/current)
   1. Check version with `node --version`
2. Install [Yarn](https://classic.yarnpkg.com/en/docs/install)
   1. `npm install --global yarn`
   2. Check version with `yarn --version`
3. Install project dependencies by running `yarn && yarn playwright install`
4. Request a credentials key from a project maintainer
   1. Place this `credentials.json` file at the root of your project (e.g. next to `package.json`)
   2. For maintainers: add test user here https://console.cloud.google.com/auth/audience?project=sv-match-stats

## Usage

Run the following: `yarn main`

## Testing

Run: `yarn test`
