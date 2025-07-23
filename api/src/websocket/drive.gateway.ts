import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class DriveGateway {
  @WebSocketServer()
  private server: Server;

  emitChange(message: string | Record<string, any>, data: any = {}) {
    this.server.emit('driveChange', {
      event: 'driveChange',
      cliente: data.clienteName || 'N/C',
      ano: data.ano || 'N/C',
      mes: data.mes || 'N/C',
      mensagem: message,
      timestamp: new Date().toLocaleString('pt-BR'),
    });
  }
}
