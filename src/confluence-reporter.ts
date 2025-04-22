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
    generatePage?: boolean;
    pageTitle?: string;
    meta?: Array<{ key: string; value: string }>;
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
      this.confluenceConfig = {
        generatePage: true,
        ...options
      };
  
      this.results = {};
    }
  
    onTestEnd(test: TestCase & { _projectId?: string }, result: TestResult) {
      const suiteName = test.parent.title;
      const testTitle = test.title;
      const projectName = test._projectId || "unknown";
      const status = result.status;
      const duration = result.duration;
      const error = result.error?.message || "";
      const steps = result.steps
        .filter((step) => step.category === "test.step")
        .map((step) => step.title);
      const description =
        steps.length > 0 ? `<h6>${steps.join("</h6><h6>")}</h6>` : "";
  
      if (!this.results[suiteName]) this.results[suiteName] = {};
      if (!this.results[suiteName][testTitle])
        this.results[suiteName][testTitle] = {};
  
      this.results[suiteName][testTitle][projectName] = {
        status,
        duration,
        description,
        error,
      };
    }
  
    async onEnd(result: FullResult) {
      const { confluenceUrl, username, apiKey, spaceId, generatePage, pageTitle } = this.confluenceConfig;
  
      if (!confluenceUrl || !username || !apiKey || !spaceId) {
        console.error("❌ Missing Confluence configuration", this.confluenceConfig);
        return;
      }
      
      this.testSummary = result;
  
      if (!generatePage) {
        console.info("Skipping Confluence page generation");
        return;
      }

      const confluencePageTitle = pageTitle || new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
      const pageBody = this.generateConfluenceTable();
  
      if (!pageBody) {
        console.error("❌ Failed to generate test table");
        return;
      }
  
      await this.createConfluencePage(confluencePageTitle, pageBody);
    }
  
    generateConfluenceTable() {
      if (!this.testSummary) {
        return;
      }
  
      let html = `<p><strong>Status:</strong> ${this.testSummary.status}</p><p><strong>Duration:</strong> ${(this.testSummary.duration / 1000).toFixed(1)} sec.</p>`;

      if (this.confluenceConfig.meta) {
          html += this.confluenceConfig.meta.map((item) => `<p><strong>${item.key}:</strong> ${item.value}</p>`).join('');
      }

      html += `<table><thead><tr><th>Suite</th><th>Test</th><th>Project</th><th>Status</th><th>Duration</th><th>Steps</th></tr></thead><tbody>`;
  
      for (const suite in this.results) {
        for (const test in this.results[suite]) {
          for (const project in this.results[suite][test]) {
            const { status, description, duration, error } = this.results[suite][test][project];
            html += `
                  <tr>
                      <td><h6>${suite}</h6></td>
                      <td><h6>${test}</h6></td>
                      <td><h6>${project}</h6></td>
                      <td><h6>${status === "passed" ? "✅" : "❌"}</td>
                      <td><h6>${(duration / 1000).toFixed(1)} sec.</td>
                      <td>${description}</td>
                  </tr>
              `;
            
            if (error) {
              html += `
                  <tr>
                      <td colspan="6">
                          <h6 style="color: red;">${error}</h6>
                      </td>
                  </tr>
              `;
            }
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
        console.error("❌ Missing Confluence configuration", this.confluenceConfig);
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