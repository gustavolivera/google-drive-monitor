import { Controller, Get, Query, Res, Body, Post } from '@nestjs/common';
import { GoogleOAuthService } from './google-oauth.service';
import { Response } from 'express';

@Controller('auth/google')
export class GoogleOAuthController {
  constructor(private readonly googleOAuthService: GoogleOAuthService) {}

  // Endpoint para gerar URL de autorização
  @Get('login')
  async login() {
    const { url, codeVerifier } =
      await this.googleOAuthService.generateAuthUrl();
    // Você deve enviar o codeVerifier para o front armazenar para depois enviar na callback
    return { url, codeVerifier };
  }

  // Endpoint para receber código e trocar por token
  @Post('callback')
  async callback(@Body() body: { code: string; codeVerifier: string }) {
    const tokens = await this.googleOAuthService.callback(
      body.code,
      body.codeVerifier,
    );
    return tokens;
  }
}
