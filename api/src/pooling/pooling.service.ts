import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { GoogleDriveService } from '../google-drive/google-drive.service';
import { DriveGateway } from '../websocket/drive.gateway';

@Injectable()
export class DrivePollingService {
  private readonly logger = new Logger(DrivePollingService.name);

  constructor(
    private readonly googleDriveService: GoogleDriveService,
    private readonly driveGateway: DriveGateway,
  ) {}

  @Interval(1 * 60 * 200)
  async checkForChanges() {
    this.logger.log('Buscando alterações...');

    try {
      const relevantChanges = await this.googleDriveService.getRecentChanges();

      for (const change of relevantChanges) {
        const message = `${change.clienteName} (Data: ${change.mes}/${change.ano})`;
        this.driveGateway.emitChange(message, change);
        this.logger.log(message);
      }

      if (relevantChanges.length === 0) {
        this.logger.log('Nenhuma alteração relevante detectada.');
      }
    } catch (error) {
      this.logger.error('Erro ao processar polling: ' + error.message);
    }
  }
}
