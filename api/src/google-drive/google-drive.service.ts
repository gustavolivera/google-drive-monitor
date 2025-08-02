import { Injectable, Logger } from '@nestjs/common';
import { google, drive_v3 } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class GoogleDriveService {
  private drive: drive_v3.Drive;
  private logger = new Logger(GoogleDriveService.name);
  private savedStartPageToken: string | null = null;

  private processedCache = new Map<string, number>();

  private CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

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

    this.savedStartPageToken = await this.getStartPageToken();
    await this.saveStartPageToken(this.savedStartPageToken);
  }

  async getRecentChanges(): Promise<
    { fileId: string; clienteName: string; ano: string; mes: string }[]
  > {
    if (!this.drive) throw new Error('Drive não conectado!');
    const res = await this.drive.changes.list({
      pageToken: this.savedStartPageToken || '',
      fields:
        'changes(fileId, removed, file(id, name, parents, createdTime, modifiedTime)), newStartPageToken',
      supportsAllDrives: true,
    });

    const fileCache = new Map<string, { name: string; parents: string[] }>();
    const clientesFolderId = await this.getClientesFolderId();
    const results: {
      fileId: string;
      clienteName: string;
      ano: string;
      mes: string;
    }[] = [];

    const seenFileIds = new Set<string>(); // ← evita duplicatas

    for (const change of res.data.changes ?? []) {
      const fileId = change.fileId;
      if (!fileId || seenFileIds.has(fileId)) continue; // ← já viu, ignora

      if (change.removed || !change.file) continue;

      // Só considera inserções recentes
      // const created = new Date(change.file.createdTime || '');
      // const limite = new Date(Date.now() - 10000); // 10 segundos atrás
      // if (!(created > limite)) continue;

      try {
        const info = await this.isInsideMovimentacaoContabil(
          fileId,
          fileCache,
          clientesFolderId,
        );
        if (info.inside && info.clienteName) {
          results.push({
            fileId,
            clienteName: info.clienteName,
            ano: info.ano || 'N/C',
            mes: info.mes || 'N/C',
          });
          seenFileIds.add(fileId); // ← marca como processado
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
      this.savedStartPageToken = res.data.newStartPageToken;
      await this.saveStartPageToken(this.savedStartPageToken);
    }

    const filteredResults: any = [];

    const now = Date.now();

    for (const item of results) {
      const lastProcessed = this.processedCache.get(item.fileId);

      if (lastProcessed && now - lastProcessed < this.CACHE_TTL_MS) {
        // Já processado recentemente, ignora
        continue;
      }

      // Marca como processado agora
      this.processedCache.set(item.fileId, now);

      filteredResults.push(item);
    }

    // Limpa cache removendo entradas expiradas (opcional, para evitar crescimento infinito)
    for (const [fileId, timestamp] of this.processedCache) {
      if (now - timestamp > this.CACHE_TTL_MS) {
        this.processedCache.delete(fileId);
      }
    }

    return filteredResults;
  }

  async isInsideMovimentacaoContabil(
    fileId: string,
    fileCache: Map<string, { name: string; parents: string[] }>,
    clientesFolderId: string,
  ): Promise<{
    inside: boolean;
    clienteName?: string;
    ano?: string;
    mes?: string;
  }> {
    const pathIds: string[] = [fileId];
    let currentId = fileId;

    // Sobem na hierarquia até clientesFolderId
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

    // Busca "Movimentação contábil"
    for (let i = 0; i < pathIds.length; i++) {
      const id = pathIds[i];
      const metadata = fileCache.get(id)!;
      if (metadata.name === 'Movimentação contábil') {
        const clienteIndex = i + 1;
        const anoIndex = i - 1;
        const mesIndex = i - 2;

        // Cliente fica logo acima (índice +1)
        const clienteName =
          clienteIndex < pathIds.length
            ? fileCache.get(pathIds[clienteIndex])?.name
            : undefined;

        // Ano e mês ficam abaixo, ou seja, índices negativos na array que foi construída subindo a hierarquia.
        // Como pathIds foi construído subindo (do arquivo para cima), ano e mês estão antes de 'Movimentação contábil' na lista, nos índices i-1 e i-2.
        const ano =
          anoIndex >= 0 ? fileCache.get(pathIds[anoIndex])?.name : undefined;
        const mes =
          mesIndex >= 0 ? fileCache.get(pathIds[mesIndex])?.name : undefined;

        return {
          inside: true,
          clienteName,
          ano,
          mes,
        };
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

  async getStartPageToken(): Promise<string> {
    const res = await this.drive.changes.getStartPageToken({
      supportsAllDrives: true,
    });

    this.logger.log('Start page token gerado com sucesso!');

    return res.data.startPageToken!;
  }

  async saveStartPageToken(token: string) {
    this.savedStartPageToken = token;

    this.logger.log(`Salvando start page token: ${this.savedStartPageToken}`);
  }
}
