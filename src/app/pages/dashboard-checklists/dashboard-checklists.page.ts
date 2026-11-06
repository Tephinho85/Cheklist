import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonBadge, IonButtons, IonButton, IonContent, IonHeader, IonIcon,
  IonInput, IonItem, IonLabel, IonList, IonMenuButton, IonTitle, IonToolbar
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import { Checklist, HistoricoInspecao } from '../../models/checklist.model';
import { ChecklistStorageService } from '../../services/checklist-storage.service';
import { DashboardChecklistResultado, DashboardChecklistService } from '../../services/dashboard-checklist.service';

@Component({
  selector: 'app-dashboard-checklists',
  templateUrl: './dashboard-checklists.page.html',
  styleUrls: ['./dashboard-checklists.page.scss'],
  standalone: true,
  imports: [
    CommonModule, IonBadge, IonButtons, IonButton, IonContent, IonHeader, IonIcon, IonInput, IonItem,
    IonLabel, IonList, IonMenuButton, IonTitle, IonToolbar
  ]
})
export class DashboardChecklistsPage {
  checklists: Checklist[] = [];
  historico: HistoricoInspecao[] = [];
  erroCarregamento = '';
  periodo = this.periodoAtual();
  resultado: DashboardChecklistResultado = {
    periodo: this.periodo,
    quantidadePrevista: 0,
    quantidadeRealizada: 0,
    realizadasComMeta: 0,
    percentualCumprimento: null,
    pendencias: 0,
    porChecklist: [],
    porResponsavel: [],
    porPeriodo: [],
    semMeta: []
  };

  private readonly storage = inject(ChecklistStorageService);
  private readonly dashboardService = inject(DashboardChecklistService);
  private dashboardRequestId = 0;

  constructor() {
    addIcons({ chevronBackOutline, chevronForwardOutline });
  }

  ionViewWillEnter(): void {
    void this.carregarDados();
  }

  private async carregarDados(): Promise<void> {
    await this.atualizarDashboard();
  }

  atualizarPeriodo(event: CustomEvent<{ value?: string | null }>): void {
    const periodoSelecionado = event.detail.value;
    if (!periodoSelecionado) return;
    this.periodo = periodoSelecionado;
    void this.atualizarDashboard();
  }

  async atualizarDashboard(): Promise<void> {
    const requestId = ++this.dashboardRequestId;
    try {
      const resultado = await this.storage.obterDashboardDaApi(this.periodo);
      if (requestId !== this.dashboardRequestId) return;
      this.resultado = resultado;
      this.erroCarregamento = '';
    } catch (error) {
      if (requestId !== this.dashboardRequestId) return;
      console.error('Erro ao buscar dashboard da API, usando cálculo de fallback:', error);
      try {
        const checklists = await this.storage.carregarChecklistsDaApi();
        const historico = await this.storage.carregarHistoricoDaApi();
        if (requestId !== this.dashboardRequestId) return;
        this.checklists = checklists;
        this.historico = historico;
        this.resultado = this.dashboardService.calcular(checklists, historico, this.periodo);
        this.erroCarregamento = 'Dashboard calculado pelo modo alternativo; confira a conexão com a API.';
      } catch (fallbackError: any) {
        console.error('Erro ao carregar dados para o dashboard:', fallbackError);
        this.erroCarregamento = fallbackError.error?.error || 'Não foi possível carregar os dados do dashboard.';
        this.resultado = {
          periodo: this.periodo,
          quantidadePrevista: 0,
          quantidadeRealizada: 0,
          realizadasComMeta: 0,
          percentualCumprimento: null,
          pendencias: 0,
          porChecklist: [],
          porResponsavel: [],
          porPeriodo: [],
          semMeta: []
        };
      }
    }
  }

  get rotuloPeriodo(): string {
    const [ano, mes] = this.periodo.split('-').map(Number);
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(ano, mes - 1, 1));
  }

  alterarMes(direcao: -1 | 1): void {
    const [anoStr, mesStr] = this.periodo.split('-');
    let ano = parseInt(anoStr, 10);
    let mes = parseInt(mesStr, 10);

    mes += direcao;

    if (mes > 12) {
      mes = 1;
      ano += 1;
    } else if (mes < 1) {
      mes = 12;
      ano -= 1;
    }

    const novoMesStr = mes.toString().padStart(2, '0');
    this.periodo = `${ano}-${novoMesStr}`;
    void this.atualizarDashboard();
  }

  larguraBarra(valor: number, previsto: number): string {
    if (previsto <= 0) return '0%';
    return `${Math.min(100, Math.max(4, (valor / previsto) * 100))}%`;
  }

  percentual(valor: number | null): string {
    return valor === null ? 'Sem meta' : `${Math.round(valor)}%`;
  }

  private periodoAtual(): string {
    const agora = new Date();
    return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
  }
}