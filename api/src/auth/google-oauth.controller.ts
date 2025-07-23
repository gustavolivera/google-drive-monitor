import { GoogleDriveService } from './../google-drive/google-drive.service';
import { google } from 'googleapis';
import { Controller, Get, Query, Res, Body, Post } from '@nestjs/common';
import { GoogleOAuthService } from './google-oauth.service';
import { Response } from 'express';

let lastGoogleCode: string | null = null; // variável em memória

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

  @Get('callback')
  handleGoogleRedirect(@Query('code') code: string, @Res() res: Response) {
    lastGoogleCode = code;
    res.send('✅ Login feito com sucesso. Pode fechar esta janela.');
  }

  @Get('lastcode')
  getLastCode() {
    return { code: lastGoogleCode };
  }
}
