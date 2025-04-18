# Playwright Confluence Reporter

A Playwright reporter to post test results on Confluence.

## Installation

```
npm install playwright-confluence-reporter -D
```

## Usage example

Modify your playwright.config.ts file to include the following:

```ts
reporter: [
    [
      "./node_modules/playwright-confluence-reporter",
      {
        confluenceUrl: "https://{your-confluence}.atlassian.net/wiki",
        username: "{Your e-mail address}",
        apiKey: "{Atlassian API key}",
        spaceId: "{The Space ID for the page}",
        parentPageId: "{Optional - The parent page ID}",
      },
    ],
    ... // Other reporters
  ],
```
