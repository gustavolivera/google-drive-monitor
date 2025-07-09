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

    this.logger.log('Webhook registrado com sucesso!');
    this.logger.debug(`Resource ID: ${res.data.resourceId}`);
    this.logger.debug(`Channel ID: ${res.data.id}`);
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

  // Busca pasta "Clientes" e retorna ID dela
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

  // Verifica se fileId está dentro da pasta "Clientes" → cliente → "Movimentação contábil"
  async isInsideMovimentacaoContabil(
    fileId: string,
  ): Promise<{ inside: boolean; clienteName?: string }> {
    const clientesId = await this.getClientesFolderId();

    // Buscando caminho pai até Clientes
    let currentId = fileId;
    const pathIds = [currentId];

    while (true) {
      const res = await this.drive.files.get({
        fileId: currentId,
        fields: 'id, name, parents',
      });

      if (!res.data.parents || res.data.parents.length === 0) break;

      const parentId = res.data.parents[0];
      pathIds.push(parentId);

      if (parentId === clientesId) break;

      currentId = parentId;
    }

    // pathIds tem IDs do arquivo até Clientes

    // Verificar se no caminho tem "Movimentação contábil" e pegar nome do cliente
    for (const id of pathIds) {
      const name = await this.getFileName(id);
      if (name === 'Movimentação contábil') {
        // Cliente está logo acima na hierarquia
        const index = pathIds.indexOf(id);
        if (index + 1 < pathIds.length) {
          const clienteId = pathIds[index + 1];
          const clienteName = await this.getFileName(clienteId);
          return { inside: true, clienteName };
        }
      }
    }

    return { inside: false };
  }

  async getStartPageToken(): Promise<string> {
    const res = await this.drive.changes.getStartPageToken({
      supportsAllDrives: true,
    });
    return res.data.startPageToken!;
  }

  async getRecentChanges(): Promise<drive_v3.Schema$Change[]> {
    if (!this.savedStartPageToken) {
      this.savedStartPageToken = await this.getStartPageToken(); // pega o token inicial
      await this.saveStartPageToken(this.savedStartPageToken); // salva na persistência
    }
    this.logger.log(
      `Buscando alterações a partir do token: ${this.savedStartPageToken}`,
    );

    const res = await this.drive.changes.list({
      pageToken: this.savedStartPageToken,
      fields: 'changes(fileId, file(name, parents)), newStartPageToken',
      supportsAllDrives: true,
    });

    if (res.data.newStartPageToken) {
      this.savedStartPageToken = res.data.newStartPageToken;
      await this.saveStartPageToken(this.savedStartPageToken); // atualiza o token salvo
    }

    return res.data.changes ?? [];
  }

  async saveStartPageToken(token: string) {
    this.savedStartPageToken = token;
  }

  async getSavedStartPageToken(): Promise<string | null> {
    return this.savedStartPageToken;
  }
}
