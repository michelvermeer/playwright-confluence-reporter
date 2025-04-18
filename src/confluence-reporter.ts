import type {
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";

interface ConfluenceConfig {
  confluenceUrl: string;
  username: string;
  apiKey: string;
  spaceId: string;
  parentPageId?: string;
}

interface TestSummary {
  status: string;
  startTime: Date | string;
  duration: number;
}

class ConfluenceReporter implements Reporter {
  private results: any;
  private confluenceConfig: ConfluenceConfig;
  private testSummary: TestSummary | undefined;

  constructor(options: ConfluenceConfig) {
    const { confluenceUrl, username, apiKey, spaceId, parentPageId } = options;
    this.confluenceConfig = {
      confluenceUrl,
      username,
      apiKey,
      spaceId,
      parentPageId,
    };

    this.results = {};
  }

  onTestEnd(test: TestCase & { _projectId?: string }, result: TestResult) {
    const suiteName = test.parent.title;
    const testTitle = test.title;
    const projectName = test._projectId || "unknown";
    const status = result.status;
    const duration = result.duration;
    const steps = result.steps
      .filter((step) => step.category === "test.step")
      .map((step) => step.title);
    const description =
      steps.length > 0 ? `<ul><li>${steps.join("</li><li>")}</li></ul>` : "";

    if (!this.results[suiteName]) this.results[suiteName] = {};
    if (!this.results[suiteName][testTitle])
      this.results[suiteName][testTitle] = {};

    this.results[suiteName][testTitle][projectName] = {
      status,
      duration,
      description,
    };
  }

  async onEnd(result: FullResult) {
    if (!this.confluenceConfig) {
      console.log("❌ Confluence config not found");
      return;
    }

    this.testSummary = result;

    const date = new Date().toISOString().split("T");
    const time = date[1].split(":");
    const pageTitle = date[0] + " " + time[0] + ":" + time[1];
    const pageBody = this.generateConfluenceTable();

    if (!pageBody) {
      console.error("❌ Failed to generate test table");
      return;
    }

    await this.createConfluencePage(pageTitle, pageBody);
  }

  generateConfluenceTable() {
    if (!this.testSummary) {
      console.error("❌ Test summary not found");
      return;
    }

    let html = `<p>Status: ${this.testSummary.status}</p><p>Duration (ms): ${this.testSummary.duration}</p><table><thead><tr><th>Suite</th><th>Test</th><th>Project</th><th>Status</th><th>Steps</th></tr></thead><tbody>`;

    for (const suite in this.results) {
      for (const test in this.results[suite]) {
        for (const project in this.results[suite][test]) {
          const { status, duration, description } =
            this.results[suite][test][project];
          html += `
                <tr>
                    <td>${suite}</td>
                    <td>${test}</td>
                    <td>${project}</td>
                    <td>${status === "passed" ? "✅" : "❌"} (${duration})</td>
                    <td>${description}</td>
                </tr>
            `;
        }
      }
    }

    html += `</tbody></table>`;
    return html;
  }

  async createConfluencePage(title: string, body: string) {
    const { confluenceUrl, username, apiKey, spaceId, parentPageId } =
      this.confluenceConfig;

    if (!confluenceUrl || !username || !apiKey || !spaceId) {
      console.error("❌ Missing Confluence configuration");
      return;
    }

    const auth = Buffer.from(`${username}:${apiKey}`).toString("base64");

    const bodyData = {
      spaceId,
      parentId: parentPageId,
      status: "current",
      title,
      body: {
        representation: "storage",
        value: body,
      },
    };

    try {
      const request = await fetch(`${confluenceUrl}/api/v2/pages`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });
      const res = await request.json();
      const url = `${res._links.base}${res._links.webui}`;
      console.log("✅ Confluence page created", url);
    } catch (error) {
      console.error("❌ Failed to create Confluence page:", error);
    }
  }
}

export default ConfluenceReporter;
