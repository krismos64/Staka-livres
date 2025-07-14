import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { emailQueue, EmailJob } from "../../queues/emailQueue";
import { MailerService } from "../../utils/mailer";
import fs from "fs";

// Mock dependencies
vi.mock("../../utils/mailer", () => ({
  MailerService: {
    sendEmail: vi.fn()
  }
}));

vi.mock("fs", () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn()
  }
}));

describe("EmailQueue", () => {
  const mockMailerService = MailerService as any;
  const mockFs = fs as any;

  beforeEach(() => {
    mockMailerService.sendEmail.mockClear();
    mockFs.existsSync.mockClear();
    mockFs.readFileSync.mockClear();
    emailQueue.clear();
  });

  afterEach(() => {
    emailQueue.clear();
  });

  test("should process email job with template", async () => {
    const templateContent = `
      <h1>{{title}}</h1>
      <p>{{message}}</p>
      <p>Created: {{createdAt}}</p>
    `;
    
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(templateContent);
    mockMailerService.sendEmail.mockResolvedValue(undefined);

    const job: EmailJob = {
      to: "admin@test.com",
      template: "admin-message.hbs",
      variables: {
        title: "Test Notification",
        message: "This is a test message",
        createdAt: "2024-01-01T12:00:00Z",
        subject: "Test Subject"
      }
    };

    await emailQueue.add("sendAdminNotifEmail", job);

    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockFs.existsSync).toHaveBeenCalledWith(
      expect.stringContaining("admin-message.hbs")
    );
    expect(mockFs.readFileSync).toHaveBeenCalledWith(
      expect.stringContaining("admin-message.hbs"),
      "utf-8"
    );
    
    expect(mockMailerService.sendEmail).toHaveBeenCalledWith({
      to: "admin@test.com",
      subject: "Test Subject",
      html: expect.stringContaining("Test Notification")
    });

    // Verify template variables were replaced
    const emailCall = mockMailerService.sendEmail.mock.calls[0][0];
    expect(emailCall.html).toContain("Test Notification");
    expect(emailCall.html).toContain("This is a test message");
    expect(emailCall.html).toContain("2024-01-01T12:00:00Z");
  });

  test("should use default subject when not provided", async () => {
    const templateContent = "<h1>{{title}}</h1>";
    
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(templateContent);
    mockMailerService.sendEmail.mockResolvedValue(undefined);

    const job: EmailJob = {
      to: "admin@test.com",
      template: "admin-info.hbs",
      variables: {
        title: "Test Notification"
      }
    };

    await emailQueue.add("sendAdminNotifEmail", job);
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockMailerService.sendEmail).toHaveBeenCalledWith({
      to: "admin@test.com",
      subject: "Notification Staka Livres",
      html: expect.stringContaining("Test Notification")
    });
  });

  test("should handle missing template gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    
    mockFs.existsSync.mockReturnValue(false);

    const job: EmailJob = {
      to: "admin@test.com",
      template: "non-existent.hbs",
      variables: {}
    };

    await emailQueue.add("sendAdminNotifEmail", job);
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(consoleSpy).toHaveBeenCalledWith(
      "Email template not found: non-existent.hbs"
    );
    expect(mockMailerService.sendEmail).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  test("should handle email sending errors", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue("<h1>{{title}}</h1>");
    mockMailerService.sendEmail.mockRejectedValue(new Error("SMTP error"));

    const job: EmailJob = {
      to: "admin@test.com",
      template: "admin-error.hbs",
      variables: {
        title: "Test",
        subject: "Error Test"
      }
    };

    await emailQueue.add("sendAdminNotifEmail", job);
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to process email job:",
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });

  test("should process multiple jobs in sequence", async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue("<h1>{{title}}</h1>");
    mockMailerService.sendEmail.mockResolvedValue(undefined);

    const job1: EmailJob = {
      to: "admin1@test.com",
      template: "admin-info.hbs",
      variables: { title: "Job 1", subject: "Subject 1" }
    };

    const job2: EmailJob = {
      to: "admin2@test.com",
      template: "admin-info.hbs",
      variables: { title: "Job 2", subject: "Subject 2" }
    };

    await emailQueue.add("sendAdminNotifEmail", job1);
    await emailQueue.add("sendAdminNotifEmail", job2);

    // Wait for both jobs to process
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(mockMailerService.sendEmail).toHaveBeenCalledTimes(2);
    expect(mockMailerService.sendEmail).toHaveBeenNthCalledWith(1, {
      to: "admin1@test.com",
      subject: "Subject 1",
      html: expect.stringContaining("Job 1")
    });
    expect(mockMailerService.sendEmail).toHaveBeenNthCalledWith(2, {
      to: "admin2@test.com",
      subject: "Subject 2",
      html: expect.stringContaining("Job 2")
    });
  });

  test("should handle template variables with special characters", async () => {
    const templateContent = "<p>{{message}}</p>";
    
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(templateContent);
    mockMailerService.sendEmail.mockResolvedValue(undefined);

    const job: EmailJob = {
      to: "admin@test.com",
      template: "admin-message.hbs",
      variables: {
        message: "Message with <script>alert('xss')</script> and special chars: éàü",
        subject: "Special Characters Test"
      }
    };

    await emailQueue.add("sendAdminNotifEmail", job);
    await new Promise(resolve => setTimeout(resolve, 100));

    const emailCall = mockMailerService.sendEmail.mock.calls[0][0];
    expect(emailCall.html).toContain("Message with <script>alert('xss')</script> and special chars: éàü");
  });

  test("should track queue length correctly", () => {
    expect(emailQueue.getQueueLength()).toBe(0);

    // Note: This test checks the synchronous queue length before processing
    const job: EmailJob = {
      to: "admin@test.com",
      template: "admin-info.hbs",
      variables: { title: "Test" }
    };

    emailQueue.add("sendAdminNotifEmail", job);
    // Length should be 0 after immediate processing starts
    expect(emailQueue.getQueueLength()).toBe(0);
  });
});