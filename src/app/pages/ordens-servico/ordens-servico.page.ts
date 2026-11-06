import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonBadge, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList,
  IonInput, IonMenuButton, IonModal, IonSelect, IonSelectOption, IonTextarea, IonTitle,
  IonToolbar, ToastController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cameraOutline, sendOutline, printOutline } from 'ionicons/icons';
import { AcompanhamentoOs, CategoriaPrazoOs, SolicitacaoOs, StatusSolicitacaoOs } from '../../models/checklist.model';
import { GestorOsStorageService } from '../../services/gestor-os-storage.service';
import { OsNotificationService } from '../../services/os-notification.service';
import { OsPhotoStorageService } from '../../services/os-photo-storage.service';
import { OsPrazoService } from '../../services/os-prazo.service';
import { AuthService } from '../../services/auth.service';
import { UppercaseInputDirective } from '../../directives/uppercase-input.directive';
import { normalizarTextoMaiusculo } from '../../utils/text-normalization';

@Component({
  selector: 'app-ordens-servico',
  templateUrl: './ordens-servico.page.html',
  styleUrls: ['./ordens-servico.page.scss'],
  standalone: true,
  imports: [
    CommonModule, DatePipe, ReactiveFormsModule, UppercaseInputDirective, IonBadge, IonButton, IonButtons,
    IonContent, IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList,
    IonMenuButton, IonModal, IonSelect, IonSelectOption, IonTextarea, IonTitle, IonToolbar
  ]
})
export class OrdensServicoPage implements OnInit, OnDestroy {
  solicitacoes: SolicitacaoOs[] = [];
  erroCarregamento = '';
  detalhesAbertos = false;
  solicitacaoAtual: SolicitacaoOs | null = null;
  solicitacaoImpressao: SolicitacaoOs | null = null;
  acompanhamentoForm!: FormGroup;
  urlsFoto: Record<string, string> = {};
  private temporizadorLembretes?: ReturnType<typeof setInterval>;
  private primeiraEntrada = true;

  private readonly fb = inject(FormBuilder);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly storage = inject(GestorOsStorageService);
  private readonly notificationService = inject(OsNotificationService);
  private readonly photoStorage = inject(OsPhotoStorageService);
  private readonly prazoService = inject(OsPrazoService);
  private readonly authService = inject(AuthService);
  private readonly toastController = inject(ToastController);

  constructor() {
    addIcons({ cameraOutline, sendOutline, printOutline });
  }

  ngOnInit(): void {
    this.acompanhamentoForm = this.fb.group({
      prazoCorrecao: [''],
      status: ['PENDENTE', Validators.required],
      observacao: ['']
    });

    void this.atualizarDados();
    this.temporizadorLembretes = setInterval(() => void this.atualizarDados(), 60 * 60 * 1000);
  }

  ngOnDestroy(): void {
    if (this.temporizadorLembretes) clearInterval(this.temporizadorLembretes);
    Object.values(this.urlsFoto).forEach(url => URL.revokeObjectURL(url));
  }

  // Agora é async e usa await
  async carregarSolicitacoes(): Promise<void> {
    try {
      this.solicitacoes = await this.storage.getSolicitacoes();
      this.erroCarregamento = '';
      this.changeDetector.markForCheck();
    } catch (error: any) {
      console.error('Erro ao carregar ordens de serviço:', error);
      this.solicitacoes = [];
      this.erroCarregamento = error.error?.error || 'Não foi possível carregar as ordens de serviço.';
      this.changeDetector.markForCheck();
      await this.mostrarToast(this.erroCarregamento, 'danger');
    }
  }

  // Agora é async e aguarda o carregamento
  async ionViewWillEnter(): Promise<void> {
    if (this.primeiraEntrada) {
      this.primeiraEntrada = false;
      return;
    }
    await this.atualizarDados();
  }

  private async atualizarDados(): Promise<void> {
    await this.carregarSolicitacoes();
    await this.processarLembretes();
  }

  categoriaPrazo(solicitacao: SolicitacaoOs): CategoriaPrazoOs {
    return this.prazoService.classificar(solicitacao);
  }

  quantidade(categoria: CategoriaPrazoOs): number {
    return this.solicitacoes.filter(solicitacao => this.categoriaPrazo(solicitacao) === categoria).length;
  }

  rotuloPrazo(categoria: CategoriaPrazoOs): string {
    const rotulos: Record<CategoriaPrazoOs, string> = {
      AGUARDANDO_PRAZO: 'Aguardando prazo',
      DENTRO_DO_PRAZO: 'Dentro do prazo',
      PROXIMA_DO_VENCIMENTO: 'Próxima do vencimento',
      VENCIDA: 'Vencida',
      CONCLUIDA: 'Concluída'
    };
    return rotulos[categoria];
  }

  corPrazo(categoria: CategoriaPrazoOs): string {
    const cores: Record<CategoriaPrazoOs, string> = {
      AGUARDANDO_PRAZO: 'medium',
      DENTRO_DO_PRAZO: 'success',
      PROXIMA_DO_VENCIMENTO: 'warning',
      VENCIDA: 'danger',
      CONCLUIDA: 'tertiary'
    };
    return cores[categoria];
  }

  rotuloStatus(status: StatusSolicitacaoOs): string {
    const rotulos: Record<StatusSolicitacaoOs, string> = {
      PENDENTE: 'Pendente',
      EM_ANDAMENTO: 'Em andamento',
      CONCLUIDA: 'Concluída'
    };
    return rotulos[status];
  }

  imprimirOS(solicitacao: SolicitacaoOs): void {
    this.solicitacaoImpressao = solicitacao;
    
    setTimeout(() => {
      window.print();
      
      setTimeout(() => {
        this.solicitacaoImpressao = null;
      }, 500); 
    }, 100);
  }

  abrirDetalhes(solicitacao: SolicitacaoOs): void {
    this.solicitacaoAtual = solicitacao;
    this.acompanhamentoForm.reset({
      prazoCorrecao: solicitacao.prazoCorrecao || '',
      status: solicitacao.status,
      observacao: ''
    });
    this.detalhesAbertos = true;
    void this.carregarFoto(solicitacao, 'antes');
    void this.carregarFoto(solicitacao, 'depois');
  }

  fecharDetalhes(): void {
    this.detalhesAbertos = false;
    this.solicitacaoAtual = null;
  }

  // Agora é async
  async salvarAcompanhamento(): Promise<void> {
    const atual = this.solicitacaoAtual;
    if (!atual || this.acompanhamentoForm.invalid) return;

    const dados = this.acompanhamentoForm.getRawValue();
    const usuario = normalizarTextoMaiusculo(this.authService.getUsuarioLogado()?.nome || 'Usuário não identificado');
    const agora = new Date().toISOString();
    const prazoNovo = dados.prazoCorrecao || null;
    const statusNovo = dados.status as StatusSolicitacaoOs;
    const eventos: AcompanhamentoOs[] = [];

    if (prazoNovo !== (atual.prazoCorrecao || null)) {
      eventos.push({
        id: this.criarId('evento'),
        data: agora,
        autor: usuario,
        tipo: 'PRAZO',
        descricao: prazoNovo
          ? `Prazo para correção informado: ${this.formatarPrazo(prazoNovo)}.`
          : 'Prazo para correção removido.'
      });
    }
    if (statusNovo !== atual.status) {
      eventos.push({
        id: this.criarId('evento'),
        data: agora,
        autor: usuario,
        tipo: 'STATUS',
        descricao: `Status atualizado para ${this.rotuloStatus(statusNovo)}.`
      });
    }
    const observacao = normalizarTextoMaiusculo(dados.observacao);
    if (observacao) {
      eventos.push({
        id: this.criarId('evento'),
        data: agora,
        autor: usuario,
        tipo: 'OBSERVACAO',
        descricao: observacao
      });
    }

    const observacoesExistentes = atual.observacoes || '';
    const novaObservacao = observacao
      ? `${observacoesExistentes}${observacoesExistentes ? '\n' : ''}${agora}\n${usuario}: ${observacao}`
      : observacoesExistentes;
      
    const atualizada: SolicitacaoOs = {
      ...atual,
      prazoCorrecao: prazoNovo,
      informadoPor: prazoNovo !== (atual.prazoCorrecao || null) ? usuario : atual.informadoPor || null,
      status: statusNovo,
      dataConclusao: statusNovo === 'CONCLUIDA' ? atual.dataConclusao || agora : null,
      observacoes: novaObservacao,
      historico: [...(atual.historico || []), ...eventos]
    };

    // Atualiza na API e recarrega
    await this.storage.atualizarSolicitacao(atual.id, atualizada);
    await this.carregarSolicitacoes();
    
    this.solicitacaoAtual = atualizada;
    this.acompanhamentoForm.patchValue({ observacao: '' });
    if (statusNovo === 'CONCLUIDA') this.fecharDetalhes();
  }

  async selecionarFoto(event: Event, tipo: 'antes' | 'depois'): Promise<void> {
    const arquivo = (event.target as HTMLInputElement).files?.[0];
    const solicitacao = this.solicitacaoAtual;
    if (!arquivo || !solicitacao) return;

    const fotoId = `${solicitacao.id}-${tipo}`;
    try {
      await this.photoStorage.salvar(fotoId, arquivo);
      const agora = new Date().toISOString();
      const usuario = this.authService.getUsuarioLogado()?.nome || 'Usuário não identificado';
      const evento: AcompanhamentoOs = {
        id: this.criarId('evento'),
        data: agora,
        autor: usuario,
        tipo: 'FOTO',
        descricao: `Foto ${tipo === 'antes' ? 'antes' : 'após'} a correção adicionada.`
      };
      const alteracoes = tipo === 'antes'
        ? { fotoAntesId: fotoId }
        : { fotoDepoisId: fotoId };
      const atualizada = {
        ...solicitacao,
        ...alteracoes,
        historico: [...(solicitacao.historico || []), evento]
      };
      
      await this.storage.atualizarSolicitacao(solicitacao.id, atualizada);
      this.solicitacaoAtual = atualizada;
      await this.carregarFoto(atualizada, tipo);
      await this.carregarSolicitacoes();
      
    } catch (error) {
      console.error('Erro ao armazenar foto da OS:', error);
      await this.mostrarToast('Não foi possível armazenar a foto.', 'danger');
    }
  }

  private async carregarFoto(solicitacao: SolicitacaoOs, tipo: 'antes' | 'depois'): Promise<void> {
    const id = tipo === 'antes' ? solicitacao.fotoAntesId : solicitacao.fotoDepoisId;
    const chave = `${solicitacao.id}:${tipo}`;
    if (!id) return;
    const blob = await this.photoStorage.obter(id);
    if (!blob) return;
    if (this.urlsFoto[chave]) URL.revokeObjectURL(this.urlsFoto[chave]);
    this.urlsFoto[chave] = URL.createObjectURL(blob);
  }

  // Agora busca as OS da API para verificar os prazos
  private async processarLembretes(): Promise<void> {
    const lembretes = this.prazoService.obterLembretes(this.solicitacoes);
    const vencidas = lembretes.filter(item => this.categoriaPrazo(item) === 'VENCIDA').length;
    const proximas = lembretes.length - vencidas;
    if (!lembretes.length) return;

    const partes = [];
    if (vencidas) partes.push(`${vencidas} OS vencida(s)`);
    if (proximas) partes.push(`${proximas} OS próxima(s) do vencimento`);
    await this.mostrarToast(`Alerta de prazo: ${partes.join(' e ')}.`, vencidas ? 'danger' : 'warning');
  }

  formatarPrazo(data: string): string {
    const [ano, mes, dia] = data.slice(0, 10).split('-');
    return `${dia}/${mes}/${ano}`;
  }

  private criarId(prefixo: string): string {
    return `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  // Transformado em async
  async atualizarStatus(solicitacao: SolicitacaoOs, status: StatusSolicitacaoOs): Promise<void> {
    await this.storage.atualizarStatus(solicitacao.id, status);
    await this.carregarSolicitacoes();
  }

  // Ajustado para aguardar as chamadas do storage da API
  async reenviarNotificacao(solicitacao: SolicitacaoOs): Promise<void> {
    try {
      const enviada = await this.notificationService.notificarGestor(solicitacao);
      if (enviada) {
        await this.storage.atualizarStatusNotificacao(solicitacao.id, 'ENVIADA');
      }
      await this.mostrarToast(
        enviada ? 'Notificação encaminhada ao gestor.' : 'Endpoint de notificação ainda não configurado.',
        enviada ? 'success' : 'warning'
      );
    } catch (error) {
      console.error('Erro ao reenviar notificação da OS:', error);
      await this.storage.atualizarStatusNotificacao(solicitacao.id, 'FALHOU');
      await this.mostrarToast('Não foi possível enviar a notificação.', 'danger');
    }
    await this.carregarSolicitacoes();
  }

  private async mostrarToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({ message, color, duration: 2800, position: 'top' });
    await toast.present();
  }
}