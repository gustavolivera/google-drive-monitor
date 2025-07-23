import { Injectable, OnModuleInit } from '@nestjs/common';

import { Issuer, Client, generators } from 'openid-client';

const {
  randomPKCECodeVerifier,
  calculatePKCECodeChallenge,
} = require('openid-client');

@Injectable()
export class GoogleOAuthService implements OnModuleInit {
  private client: Client;

  async onModuleInit() {
    const issuer = await Issuer.discover('https://accounts.google.com');

    this.client = new issuer.Client({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uris: [process.env.GOOGLE_REDIRECT_URI || ''],
      response_types: ['code'],
    });
  }

  generateAuthUrl() {
    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);

    const url = this.client.authorizationUrl({
      scope: 'openid email profile https://www.googleapis.com/auth/drive',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      access_type: 'offline',
      prompt: 'consent',
    });

    return { url, codeVerifier: codeVerifier };
  }

  async callback(code: string, codeVerifier: string) {
    const tokenSet = await this.client.callback(
      process.env.GOOGLE_REDIRECT_URI,
      { code },
      { code_verifier: codeVerifier },
    );

    return tokenSet;
  }
}
