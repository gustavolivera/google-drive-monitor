import { Module } from '@nestjs/common';
import { DriveGateway } from './drive.gateway';

@Module({
  providers: [DriveGateway],
  exports: [DriveGateway],
})
export class WebsocketModule {}
