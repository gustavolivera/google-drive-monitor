import {
  Controller,
  Post,
  Req,
  Res,
  HttpCode,
  Logger,
  Body,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { GoogleDriveService } from '../google-drive/google-drive.service';

@Controller('webhook')
export class WebhookController {
  private logger = new Logger(WebhookController.name);

  constructor(private readonly googleDriveService: GoogleDriveService) {}

  @Post()
  @HttpCode(200)
  async handleWebhook(@Req() req: Request, @Res() res: Response) {
    this.logger.log('Webhook recebido');

    try {
      const relevantChanges = await this.googleDriveService.getRecentChanges();

      for (const change of relevantChanges) {
        this.logger.log(
          `Arquivo alterado na pasta do cliente: ${change.clienteName} (fileId: ${change.fileId})`,
        );
      }

      if (relevantChanges.length === 0) {
        this.logger.log('Nenhuma alteração relevante detectada.');
      }
    } catch (error) {
      this.logger.error('Erro ao processar webhook: ' + error.message);
    }

    return res.send('OK');
  }

  @Post('monitor')
  async monitor(@Body() tokens: any) {
    await this.googleDriveService.setCredentials(tokens);
    await this.googleDriveService.registerWebhook(
      'https://373f97afc11b.ngrok-free.app/webhook',
    );
    return { message: 'Webhook registrado' };
  }
}
