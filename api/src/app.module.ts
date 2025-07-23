import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GoogleDriveService } from './google-drive/google-drive.service';
import { GoogleOAuthController } from './auth/google-oauth.controller';
import { GoogleOAuthService } from './auth/google-oauth.service';
import { ConfigModule } from '@nestjs/config';
import { WebsocketModule } from './websocket/websocket.module';
import { DriveGateway } from './websocket/drive.gateway';
import { ScheduleModule } from '@nestjs/schedule';
import { DrivePollingService } from './pooling/pooling.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WebsocketModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController, GoogleOAuthController],
  providers: [
    AppService,
    GoogleDriveService,
    GoogleOAuthService,
    DriveGateway,
    DrivePollingService,
  ],
})
export class AppModule {}
