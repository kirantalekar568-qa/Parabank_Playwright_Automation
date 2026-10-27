# ParaBank Playwright Automation Suite

End-to-end browser tests for registration and login, account management, fund transfers, transaction history, and negative scenarios. The suite uses Playwright Test with TypeScript and page objects in `pages/`.

## Prerequisites

- Node.js 20 or later and npm
- Internet access to reach the ParaBank application
- Chromium, installed using the command below

Tests use the public ParaBank demo by default. They register unique test users and change demo data, so use a dedicated ParaBank deployment if you need an isolated environment.

## Install

From the project root, install the exact dependency versions in the lockfile and the required browser:

```powershell
npm ci
npx playwright install chromium
```

## Environment variables

No environment variables are required for the default configuration.

| Variable | Required | Description |
| --- | --- | --- |
| `PARABANK_BASE_URL` | No | ParaBank application base URL. Defaults to `https://parabank.parasoft.com/parabank/`. Include the application path if your deployment uses a different one. |
| `PARABANK_USERNAME` | No | Username for the seeded-account transfer validation. |
| `PARABANK_PASSWORD` | No | Password for the seeded-account transfer validation. Set it together with `PARABANK_USERNAME`; that one test is skipped if either is absent. |
| `CI` | No | When set, Playwright forbids focused tests and retries failures twice. |

Set optional variables for the current PowerShell session before running tests:

```powershell
$env:PARABANK_BASE_URL = "https://parabank.parasoft.com/parabank/"
$env:PARABANK_USERNAME = "your-seeded-user"
$env:PARABANK_PASSWORD = "your-password"
```

## Run tests

```powershell
npm test
```

Other useful commands:

```powershell
npm run test:headed
npm run test:ui
npm run test:debug
npx playwright test --project=chromium
```

The suite runs against Chromium. The seeded-account test is the only scenario that requires login environment variables; other tests create unique users as needed.

## Manual workbook case automation

The test cases in `Manual test cases.xlsx` are organized in the existing module spec files under `tests/`. Each Playwright test title includes its workbook `TC-xx` identifier. Run the complete suite with `npm test`, or a specific module with commands such as:

```powershell
npx playwright test tests/01-registration-login.spec.ts
npx playwright test tests/02-account-management.spec.ts
npx playwright test tests/03-fund-transfer.spec.ts
npx playwright test tests/04-transaction-history.spec.ts
npx playwright test tests/05-negative-testing.spec.ts

```



## Reports and traces

Each run generates an HTML report in `playwright-report/` and test artifacts in `test-results/`. Open the latest report with:

```powershell
npm run report
```

The report is also available directly at `playwright-report/index.html`. Playwright saves traces, screenshots, and videos on failure. To open a trace, pass its `trace.zip` path from the corresponding folder in `test-results/`:

```powershell
npx playwright show-trace "test-results\<test-result-folder>\trace.zip"
```
