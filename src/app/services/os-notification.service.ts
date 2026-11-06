import { Injectable } from '@angular/core';
import { SolicitacaoOs } from '../models/checklist.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OsNotificationService {
  async notificarGestor(solicitacao: SolicitacaoOs): Promise<boolean> {
    const endpoint = environment.osNotificationEndpoint.trim();
    if (!endpoint) return false;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channels: ['email', 'whatsapp'],
        solicitacao
      })
    });

    if (!response.ok) {
      throw new Error(`Falha ao notificar gestor: HTTP ${response.status}`);
    }

    return true;
  }
}