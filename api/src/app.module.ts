import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebhookController } from './webhook/webhook.controller';
import { GoogleDriveService } from './google-drive/google-drive.service';
import { GoogleOAuthController } from './auth/google-oauth.controller';
import { GoogleOAuthService } from './auth/google-oauth.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController, WebhookController, GoogleOAuthController],
  providers: [AppService, GoogleDriveService, GoogleOAuthService],
})
export class AppModule {}
