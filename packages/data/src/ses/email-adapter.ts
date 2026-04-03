import { SendEmailCommand } from "@aws-sdk/client-ses";
import type { SESClient } from "@aws-sdk/client-ses";
import type { EmailAdapter } from "@hr-attendance-app/core";

export class SESEmailAdapter implements EmailAdapter {
  constructor(
    private readonly ses: SESClient,
    private readonly senderAddress: string,
  ) {}

  async sendEmail(to: string, subject: string, htmlBody: string): Promise<void> {
    await this.ses.send(new SendEmailCommand({
      Source: this.senderAddress,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: { Html: { Data: htmlBody, Charset: "UTF-8" } },
      },
    }));
  }
}
