# SV match bot

Pulls from OP.GG API and updates a Google Sheets spreadsheet automatically with team standings + kill counts with some light user guidance

## Setup

1. Install [Node v24.3.0](https://nodejs.org/en/download/current)
   1. Check version with `node --version`
2. Install [Yarn 4.10.3](https://yarnpkg.com/getting-started/install): `yarn set version 4.10.3`
   1. Check version with `yarn --version`
3. Install project dependencies by running `yarn && yarn playwright install`
4. Request a credentials key from a project maintainer
   1. Place this `credentials.json` file at the root of your project (e.g. next to `package.json`)
   2. For maintainers: add test user here https://console.cloud.google.com/auth/audience?project=sv-match-stats
5. Setup [gsSQL](https://github.com/demmings/gsSQL) to be able to run SQL queries on the data in Google Sheets:
   1. In your sheet, go to `Extensions > Apps Script`
   2. Click the `+` next to `Libraries`
   3. Add this script ID and click `Add`: `1ZfedAgGG2K5kPLC2NPfe0Kb1xAg-0gvmliR3V8pRNk6DZMTUQyCbMW1W`
   4. Add this code to any file under `Files`:

```js
/**
 * @param {String} sqlStatement - e.g. "select * from authors"
 * @param {...any} parms - Optional ["tableName", range, "tableName2", range2,...][addTitle][bindVariables]
 * @returns {any[][]}
 * @customfunction
 */
function gsSQL(sqlStatement, ...parms) {
	return gsSqlLibrary.gsSQL(sqlStatement, ...parms)
}
```

## Usage

Run the following: `yarn main`

## Testing

Run: `yarn test`
