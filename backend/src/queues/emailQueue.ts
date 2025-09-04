import { MailerService } from "../utils/mailer";
import fs from "fs";
import path from "path";
import * as Handlebars from "handlebars";

// Register Handlebars helpers
Handlebars.registerHelper('eq', function(a: any, b: any) {
  return a === b;
});

Handlebars.registerHelper('formatDate', function(date: any) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris'
  });
});

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
      
      // Use Handlebars for proper template rendering
      const template = Handlebars.compile(templateContent);
      
      // Format createdAt for better display
      const templateVars = {
        ...job.variables,
        createdAt: job.variables.createdAt ? 
          new Date(job.variables.createdAt).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Paris'
          }) : ''
      };
      
      const html = template(templateVars);

      // Extract subject from template variables or use default
      const subject = job.variables.subject || "Notification Staka Livres";

      console.log(`📧 [Email Queue] Sending email to ${job.to} with template ${job.template}`);

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