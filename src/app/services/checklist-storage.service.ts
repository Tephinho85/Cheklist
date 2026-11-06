import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Checklist, HistoricoInspecao } from '../models/checklist.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ChecklistStorageService {
  private apiUrl = environment.apiBaseUrl;
  private http = inject(HttpClient);

  private checklistsCache: Checklist[] = [];
  private historicoCache: HistoricoInspecao[] = [];

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  async carregarChecklistsDaApi(): Promise<Checklist[]> {
    try {
      const rows: any[] = await firstValueFrom(
        this.http.get<any[]>(`${this.apiUrl}/checklists`, { headers: this.getHeaders() })
      );

      // Mapeia os dados do PostgreSQL para o modelo do Ionic com segurança
      this.checklistsCache = (rows || []).map(item => ({
        codigo: item.code || item.codigo,
        descricao: item.description || item.descricao,
        revisao: item.revision || item.revisao,
        setor: item.sector || item.setor || '',
        metaInspecoesMensais: item.monthly_inspection_goal ?? item.metaInspecoesMensais ?? 0,
        itens: Array.isArray(item.items || item.itens) ? (item.items || item.itens) : []
      }));

      return this.checklistsCache;
    } catch (error) {
      console.error('Erro ao buscar checklists da API:', error);
      throw error;
    }
  }

  getChecklists(): Checklist[] {
    return this.checklistsCache;
  }

  async salvarChecklistNaApi(checklist: Checklist): Promise<any> {
    const payload = {
      code: checklist.codigo,
      codigo: checklist.codigo,
      description: checklist.descricao,
      descricao: checklist.descricao,
      revision: checklist.revisao,
      revisao: checklist.revisao,
      sector: checklist.setor,
      setor: checklist.setor,
      monthly_inspection_goal: checklist.metaInspecoesMensais,
      metaInspecoesMensais: checklist.metaInspecoesMensais,
      items: checklist.itens,
      itens: checklist.itens
    };

    const salvo = await firstValueFrom(
      this.http.put(
        `${this.apiUrl}/checklists/${encodeURIComponent(checklist.codigo)}`,
        payload,
        { headers: this.getHeaders() }
      )
    );
    await this.carregarChecklistsDaApi();
    return salvo;
  }

  async excluirChecklistNaApi(codigo: string): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(`${this.apiUrl}/checklists/${encodeURIComponent(codigo)}`, { headers: this.getHeaders() })
    );
    await this.carregarChecklistsDaApi();
  }

  saveChecklists(checklists: Checklist[]): void {
    this.checklistsCache = checklists;
  }

  async carregarHistoricoDaApi(): Promise<HistoricoInspecao[]> {
    try {
      const rows: any[] = await firstValueFrom(
        this.http.get<any[]>(`${this.apiUrl}/inspections`, { headers: this.getHeaders() })
      );
      this.historicoCache = (rows || []).map(item => ({
        id: item.id,
        codigoChecklist: item.checklist_code || item.codigoChecklist,
        descricao: item.description || item.descricao,
        revisao: item.revision || item.revisao,
        dataExecucao: item.executed_at || item.dataExecucao,
        responsavel: item.inspector || item.responsavel,
        respostas: Array.isArray(item.answers || item.respostas) ? (item.answers || item.respostas) : []
      }));
      return this.historicoCache;
    } catch (error) {
      console.error('Erro ao buscar histórico de inspeções da API:', error);
      throw error;
    }
  }

  getHistorico(): HistoricoInspecao[] {
    return this.historicoCache;
  }

  async saveInspecao(inspecao: HistoricoInspecao): Promise<any> {
    const payload = {
      id: inspecao.id,
      checklist_code: inspecao.codigoChecklist,
      description: inspecao.descricao,
      revision: inspecao.revisao,
      executed_at: inspecao.dataExecucao,
      inspector: inspecao.responsavel,
      answers: inspecao.respostas
    };

    const salva = await firstValueFrom(
      this.http.post(`${this.apiUrl}/inspections`, payload, { headers: this.getHeaders() })
    );
    await this.carregarHistoricoDaApi();
    return salva;
  }

  async obterDashboardDaApi(periodo: string): Promise<any> {
    return await firstValueFrom(
      this.http.get<any>(`${this.apiUrl}/dashboard?period=${encodeURIComponent(periodo)}`, { headers: this.getHeaders() })
    );
  }
}