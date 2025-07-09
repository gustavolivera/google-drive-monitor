import { Injectable, Logger } from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GoogleDriveService {
  private drive: drive_v3.Drive;
  private logger = new Logger(GoogleDriveService.name);
  private savedStartPageToken: string | null = null;

  private async initOAuthClient() {
    const credentialsPath = path.join(process.cwd(), 'credentials.json');
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    const { client_secret, client_id, redirect_uris } =
      credentials.installed || credentials.web;

    return new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  }

  public async setCredentials(tokens: any) {
    const oAuth2Client = await this.initOAuthClient();
    oAuth2Client.setCredentials(tokens);

    this.drive = google.drive({ version: 'v3', auth: oAuth2Client });
  }

  public async registerWebhook(webhookUrl: string) {
    if (!this.drive) throw new Error('Drive API não inicializada');

    const startPageTokenResponse = await this.drive.changes.getStartPageToken({
      supportsAllDrives: true,
    });

    const channelId = uuidv4(); // ID único do canal
    const startPageToken = startPageTokenResponse.data.startPageToken;

    const res = await this.drive.changes.watch({
      pageToken: startPageToken!,
      supportsAllDrives: true,
      requestBody: {
        id: channelId,
        type: 'web_hook',
        address: webhookUrl,
      },
    });

    this.logger.debug('Webhook registrado com sucesso!');
    this.logger.debug(`Resource ID: ${res.data.resourceId}`);
    this.logger.debug(`Channel ID: ${res.data.id}`);
  }

  async getStartPageToken(): Promise<string> {
    const res = await this.drive.changes.getStartPageToken({
      supportsAllDrives: true,
    });

    this.logger.log('Start page token gerado com sucesso!');

    return res.data.startPageToken!;
  }

  async getRecentChanges(): Promise<{ fileId: string; clienteName: string }[]> {
    if (!this.savedStartPageToken) {
      this.savedStartPageToken = await this.getStartPageToken();
      await this.saveStartPageToken(this.savedStartPageToken);
    }

    const res = await this.drive.changes.list({
      pageToken: this.savedStartPageToken,
      fields:
        'changes(fileId, removed, file(id, name, parents, createdTime, modifiedTime)), newStartPageToken',
      supportsAllDrives: true,
    });

    const fileCache = new Map<string, { name: string; parents: string[] }>();
    const clientesFolderId = await this.getClientesFolderId();
    const results: { fileId: string; clienteName: string }[] = [];

    for (const change of res.data.changes ?? []) {
      const fileId = change.fileId;
      if (!fileId) continue;

      if (change.removed || !change.file) continue;

      // Só considera inserções (com createdTime)
      if (change.file.createdTime != change.file.modifiedTime) continue;

      try {
        const info = await this.isInsideMovimentacaoContabil(
          fileId,
          fileCache,
          clientesFolderId,
        );
        if (info.inside && info.clienteName) {
          results.push({ fileId, clienteName: info.clienteName });
        }
      } catch (err) {
        this.logger.warn(
          `Erro verificando mudança em ${fileId}: ${err.message}`,
        );
      }
    }

    if (
      res.data.newStartPageToken &&
      res.data.newStartPageToken !== this.savedStartPageToken
    ) {
      console.log('res.data.newStartPageToken: ', res.data.newStartPageToken);
      this.savedStartPageToken = res.data.newStartPageToken;
      await this.saveStartPageToken(this.savedStartPageToken);
    }

    return results;
  }

  async isInsideMovimentacaoContabil(
    fileId: string,
    fileCache: Map<string, { name: string; parents: string[] }>,
    clientesFolderId: string,
  ): Promise<{ inside: boolean; clienteName?: string }> {
    const pathIds: string[] = [fileId];
    let currentId = fileId;

    while (true) {
      let metadata = fileCache.get(currentId);
      if (!metadata) {
        const res = await this.drive.files.get({
          fileId: currentId,
          fields: 'id, name, parents',
        });
        metadata = {
          name: res.data.name!,
          parents: res.data.parents ?? [],
        };
        fileCache.set(currentId, metadata);
      }

      if (!metadata.parents || metadata.parents.length === 0) break;

      const parentId = metadata.parents[0];
      pathIds.push(parentId);
      if (parentId === clientesFolderId) break;

      currentId = parentId;
    }

    for (let i = 0; i < pathIds.length; i++) {
      const id = pathIds[i];
      const metadata = fileCache.get(id)!;
      if (metadata.name === 'Movimentação contábil') {
        const clienteIndex = i + 1;
        if (clienteIndex < pathIds.length) {
          const clienteId = pathIds[clienteIndex];
          const clienteMetadata = fileCache.get(clienteId)!;
          return { inside: true, clienteName: clienteMetadata.name };
        }
      }
    }

    return { inside: false };
  }

  async getClientesFolderId(): Promise<string> {
    const res = await this.drive.files.list({
      q: "name = 'Clientes' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
      fields: 'files(id, name)',
    });
    if (!res.data.files || res.data.files.length === 0) {
      throw new Error('Pasta "Clientes" não encontrada');
    }
    return res.data.files[0].id ?? '';
  }

  async getFileParents(fileId: string): Promise<string[]> {
    const parents: string[] = [];
    let currentId = fileId;

    while (true) {
      const res = await this.drive.files.get({
        fileId: currentId,
        fields: 'id, name, parents',
      });

      const file = res.data;
      if (!file) break;

      if (!file.parents || file.parents.length === 0) break;

      const parentId = file.parents[0];
      parents.push(parentId);
      currentId = parentId;
    }

    return parents;
  }

  async getFileName(fileId: string): Promise<string> {
    const res = await this.drive.files.get({
      fileId,
      fields: 'name',
    });
    return res.data.name ?? 'Nome não encontrado';
  }

  async saveStartPageToken(token: string) {
    this.savedStartPageToken = token;

    this.logger.log(`Salvando start page token: ${this.savedStartPageToken}`);
  }

  async getSavedStartPageToken(): Promise<string | null> {
    return this.savedStartPageToken;
  }
}
