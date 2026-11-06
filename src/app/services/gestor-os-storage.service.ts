import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { GestorArea, SolicitacaoOs, StatusSolicitacaoOs } from '../models/checklist.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GestorOsStorageService {
  private apiUrl = environment.apiBaseUrl;
  private http = inject(HttpClient);

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  // Mapeia os dados dos gestores da API para o formato esperado pelo frontend
  async getGestores(): Promise<GestorArea[]> {
    try {
      const rows: any[] = await firstValueFrom(
        this.http.get<any[]>(`${this.apiUrl}/managers`, { headers: this.getHeaders() })
      );
      return rows.map(item => ({
        id: item.id,
        nome: item.nome || item.name,
        area: item.area,
        email: item.email,
        whatsapp: item.whatsapp,
        ativo: item.ativo !== undefined ? item.ativo : (item.active !== undefined ? item.active : true)
      }));
    } catch (error) {
      console.error('Erro ao buscar gestores da API:', error);
      throw error;
    }
  }

  // Envia os dados convertidos para o formato que a API do Node.js espera receber
  async salvarGestor(gestor: GestorArea): Promise<any> {
    const payload = {
      id: gestor.id,
      name: gestor.nome,
      nome: gestor.nome,
      area: gestor.area,
      email: gestor.email,
      whatsapp: gestor.whatsapp,
      active: gestor.ativo,
      ativo: gestor.ativo
    };
    return await firstValueFrom(
      this.http.put(`${this.apiUrl}/managers/${gestor.id}`, payload, { headers: this.getHeaders() })
    );
  }

  async excluirGestor(id: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(`${this.apiUrl}/managers/${id}`, { headers: this.getHeaders() })
    );
  }

  // Mapeia as Ordens de Serviço da API
  async getSolicitacoes(): Promise<SolicitacaoOs[]> {
    try {
      const rows: any[] = await firstValueFrom(
        this.http.get<any[]>(`${this.apiUrl}/service-orders`, { headers: this.getHeaders() })
      );

      return rows.map(item => ({
        id: item.id,
        numero: item.number,
        inspecaoId: item.inspection_id,
        codigoChecklist: item.checklist_code,
        descricaoChecklist: item.checklist_description,
        revisaoChecklist: item.checklist_revision,
        item: item.item_code,
        pergunta: item.question,
        resposta: item.answer,
        irregularidade: item.irregularidade,
        correcaoSolicitada: item.requested_correction,
        area: item.area,
        gestorId: item.manager_id,
        gestorNome: item.manager_name,
        gestorEmail: item.manager_email,
        gestorWhatsapp: item.manager_whatsapp,
        solicitante: item.requester,
        abertaEm: item.opened_at,
        criadaEm: item.opened_at,
        prazoCorrecao: item.correction_deadline,
        informadoPor: item.deadline_reported_by,
        dataConclusao: item.completed_at,
        status: item.status,
        notificacaoStatus: item.notification_status,
        historico: Array.isArray(item.history) ? item.history : [],
        observacoes: item.observations || '',
        fotoAntesId: item.fotoAntesId || (item.has_photo_before ? `${item.id}-antes` : null),
        fotoDepoisId: item.fotoDepoisId || (item.has_photo_after ? `${item.id}-depois` : null)
      }));
    } catch (error) {
      console.error('Erro ao buscar OS da API:', error);
      throw error;
    }
  }

  async saveSolicitacao(solicitacao: SolicitacaoOs): Promise<any> {
    return await firstValueFrom(
      this.http.post(`${this.apiUrl}/service-orders`, solicitacao, { headers: this.getHeaders() })
    );
  }

  async atualizarStatus(id: string, status: StatusSolicitacaoOs): Promise<void> {
    await this.atualizarSolicitacao(id, { status });
  }

  async atualizarSolicitacao(id: string, alteracoes: Partial<SolicitacaoOs>): Promise<void> {
    await firstValueFrom(
      this.http.patch(`${this.apiUrl}/service-orders/${id}`, alteracoes, { headers: this.getHeaders() })
    );
  }

  async atualizarStatusNotificacao(id: string, notificacaoStatus: SolicitacaoOs['notificacaoStatus']): Promise<void> {
    await this.atualizarSolicitacao(id, { notificacaoStatus });
  }

  gerarProximoNumero(): string {
    return '';
  }

  saveGestores(gestores: GestorArea[]): void {}
}