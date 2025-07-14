import { MailerService } from "../utils/mailer";
import fs from "fs";
import path from "path";

export interface EmailJob {
  to: string;
  template: string;
  variables: Record<string, any>;
}

class EmailQueue {
  private isProcessing = false;
  private jobs: EmailJob[] = [];

  async add(jobType: string, jobData: EmailJob): Promise<void> {
    this.jobs.push(jobData);
    if (!this.isProcessing) {
      this.processNext();
    }
  }

  private async processNext(): Promise<void> {
    if (this.jobs.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const job = this.jobs.shift()!;

    try {
      await this.processEmailJob(job);
    } catch (error) {
      console.error("Failed to process email job:", error);
    }

    // Process next job
    setImmediate(() => this.processNext());
  }

  private async processEmailJob(job: EmailJob): Promise<void> {
    try {
      const templatePath = path.join(__dirname, "../emails/templates", job.template);
      
      if (!fs.existsSync(templatePath)) {
        console.warn(`Email template not found: ${job.template}`);
        return;
      }

      const templateContent = fs.readFileSync(templatePath, "utf-8");
      
      // Simple template replacement (can be upgraded to handlebars later)
      let html = templateContent;
      Object.entries(job.variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        html = html.replace(regex, String(value));
      });

      // Extract subject from template variables or use default
      const subject = job.variables.subject || "Notification Staka Livres";

      await MailerService.sendEmail({
        to: job.to,
        subject,
        html,
      });
    } catch (error) {
      console.error("Error processing email job:", error);
      throw error;
    }
  }

  // For testing purposes
  getQueueLength(): number {
    return this.jobs.length;
  }

  // For testing purposes - clear queue
  clear(): void {
    this.jobs = [];
  }
}

export const emailQueue = new EmailQueue();