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
    const resourceId = req.headers['x-goog-resource-id'];
    const channelId = req.headers['x-goog-channel-id'];

    try {
      const changes = await this.googleDriveService.getRecentChanges();

      for (const change of changes) {
        const fileId = change.fileId;

        const result =
          await this.googleDriveService.isInsideMovimentacaoContabil(
            fileId || '',
          );
        if (result.inside) {
          this.logger.log(
            `Arquivo alterado na pasta do cliente ${result.clienteName}`,
          );
        } else {
          this.logger.log(
            `Alteração ignorada (fora de "Movimentação contábil")`,
          );
        }
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
