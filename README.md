# Playwright Confluence Reporter

A Playwright reporter to post test results on Confluence.

![Example](https://github.com/michelvermeer/playwright-confluence-reporter/blob/main/example.png?raw=true)

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
        pageTitle: "E2E test results",
        generatePage: true,
        meta: [
          {
            key: "Scope",
            value: "Web, Mobile"
          }
        ]
      },
    ],
    ... // Other reporters
  ],
```

Options

| Option        | Type                    | Required | Default | Description                                                     |
| ------------- | ----------------------- | -------- | ------- | --------------------------------------------------------------- |
| confluenceUrl | _string_                | yes      |         | Your Confluence URL, probably ending with `.atlassian.net/wiki` |
| username      | _string_                | yes      |         | Your Confluence username / e-mail                               |
| apiKey        | _string_                | yes      |         | API key obtained from Atlassian                                 |
| spaceId       | _string_                | yes      |         | The ID of the Space where the page will be created              |
| parentPageId  | _string_                | no       |         | The parent page ID                                              |
| pageTitle     | _string_                | no       | date    | Custom page title for the test results                          |
| generatePage  | _boolean_               | no       | true    | Set to false if you don't want to create a page                 |
| meta          | _Array[{ key, value }]_ | no       |         | Custom information send with the test results                   |
