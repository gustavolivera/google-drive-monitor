import { GoogleDriveService } from './../google-drive/google-drive.service';
import { google } from 'googleapis';
import {
  Controller,
  Get,
  Query,
  Res,
  Body,
  Post,
  Logger,
} from '@nestjs/common';
import { GoogleOAuthService } from './google-oauth.service';
import { Response } from 'express';

@Controller('auth/google')
export class GoogleOAuthController {
  constructor(
    private readonly googleOAuthService: GoogleOAuthService,
    private readonly googleDriveService: GoogleDriveService,
  ) {}

  // Endpoint para gerar URL de autorização
  @Get('login')
  async login() {
    const { url, codeVerifier } = this.googleOAuthService.generateAuthUrl();
    return { url, codeVerifier };
  }

  // Endpoint para receber código e trocar por token
  @Post('callback')
  async callback(@Body() body: { code: string; codeVerifier: string }) {
    const tokens = await this.googleOAuthService.callback(
      body.code,
      body.codeVerifier,
    );

    await this.googleDriveService.setCredentials(tokens);
  }

  // Endpoint para lidar com o redirecionamento do Google após login
  @Get('callback')
  handleGoogleRedirect(@Query('code') code: string, @Res() res: Response) {
    const redirectUrl = `http://localhost:5173/auth/google/callback?code=${code}`;
    return res.redirect(redirectUrl);
  }
}
