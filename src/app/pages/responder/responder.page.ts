import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { 
  IonHeader, IonContent, IonFooter, IonSelect, IonSelectOption, 
  IonInput, IonRadio, IonRadioGroup, IonItem, IonToolbar, IonTitle, 
  IonButtons, IonMenuButton, IonProgressBar, IonButton, IonIcon, IonSpinner, IonNote, IonLabel,
  IonModal, IonList, IonTextarea, IonSearchbar,
  AlertController, ToastController 
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { copyOutline, createOutline, trashOutline, saveOutline, chevronDownOutline, printOutline, timeOutline, searchOutline, closeOutline } from 'ionicons/icons';
import { PdfService } from '../../services/pdf.service';
import { ChecklistStorageService } from '../../services/checklist-storage.service';
import { Checklist, GestorArea, HistoricoInspecao, ItemChecklist, SolicitacaoOs } from '../../models/checklist.model';
import { GestorOsStorageService } from '../../services/gestor-os-storage.service';
import { OsNotificationService } from '../../services/os-notification.service';
import { AuthService } from '../../services/auth.service';
import { UppercaseInputDirective } from '../../directives/uppercase-input.directive';
import { normalizarTextoMaiusculo } from '../../utils/text-normalization';

@Component({
  selector: 'app-responder',
  templateUrl: './responder.page.html',
  styleUrls: ['./responder.page.scss'],
  standalone: true,
  imports: [
    DatePipe,
    CommonModule,
    ReactiveFormsModule,
    UppercaseInputDirective,
    IonHeader, IonContent, IonFooter, IonSelect, IonSelectOption, 
    IonInput, IonRadio, IonRadioGroup, IonItem, IonToolbar, IonTitle,
    IonButtons, IonMenuButton, IonProgressBar, IonButton, IonIcon, IonSpinner, IonNote, IonLabel,
    IonModal, IonList, IonTextarea, IonSearchbar
  ],
})
export class ResponderPage implements OnInit {
  checklistForm!: FormGroup;
  checklistSelecionado = '000001';
  carregando = true;
  exibirModalHistorico = false;
  exibirModalSolicitacaoOs = false;
  exibirModalPesquisa = false;
  termoPesquisa = '';
  historicoInspecoes: HistoricoInspecao[] = [];
  checklistsCollection: Checklist[] = [];
  gestores: GestorArea[] = [];
  itemOsSelecionado: ItemChecklist | null = null;
  solicitacaoOsForm!: FormGroup;
  private readonly inspecoesEmAndamento = new Map<string, string>();
  private carregamentoDados: Promise<void> | null = null;

  private toastController = inject(ToastController);
  private changeDetector = inject(ChangeDetectorRef);
  private alertController = inject(AlertController);
  private fb = inject(FormBuilder);  
  private router = inject(Router);
  private pdfService = inject(PdfService);
  private storageService = inject(ChecklistStorageService);
  private gestorOsStorage = inject(GestorOsStorageService);
  private osNotificationService = inject(OsNotificationService);
  private authService = inject(AuthService);
  
  constructor() {
    addIcons({ copyOutline, createOutline, trashOutline, saveOutline, chevronDownOutline, printOutline, timeOutline, searchOutline, closeOutline });
  }

  async ionViewWillEnter() {
    await this.carregarDadosDoBanco();
  }

  ngOnInit() {
    this.inicializarFormularioSolicitacaoOs();
    void this.carregarDadosDoBanco();
  }

  inicializarFormularioSolicitacaoOs() {
    this.solicitacaoOsForm = this.fb.group({
      gestorId: ['', Validators.required],
      irregularidade: ['', Validators.required],
      correcaoSolicitada: ['', Validators.required]
    });
  }

  imprimirPDF() {
    if (!this.checklistAtual) return;
    const formValues = this.checklistForm ? this.checklistForm.value : {};
    const mapaRespostas: any = {};

    this.checklistAtual.itens.forEach((item) => {
      if (item.tipoResposta) {
        const kResp = this.obterChaveSanitizada('resposta', this.checklistAtual!.codigo, item.item);
        const kObs = this.obterChaveSanitizada('observacao', this.checklistAtual!.codigo, item.item);

        mapaRespostas[item.item] = {
          valor: typeof formValues[kResp] === 'string'
            ? normalizarTextoMaiusculo(formValues[kResp])
            : formValues[kResp] || '',
          observacao: normalizarTextoMaiusculo(formValues[kObs])
        };
      }
    });

    const respostasAtivas = {
      respSesmt: '',
      matSesmt: '',
      respSetor: '',
      matSetor: '',
      setor: '',
      data: new Date().toLocaleDateString('pt-BR'),
      observacoesRonda: '',
      ordensServico: '',
      respostas: mapaRespostas
    };

    this.pdfService.gerarChecklistPdf(this.checklistAtual, respostasAtivas);
  }

  async carregarDadosDoBanco(): Promise<void> {
    if (this.carregamentoDados) return this.carregamentoDados;

    this.carregando = true;
    this.carregamentoDados = this.buscarDadosDoBanco();
    try {
      await this.carregamentoDados;
    } finally {
      this.carregando = false;
      this.carregamentoDados = null;
      this.changeDetector.markForCheck();
    }
  }

  private async buscarDadosDoBanco(): Promise<void> {
    try {
      this.checklistsCollection = await this.storageService.carregarChecklistsDaApi();
      if (!this.checklistAtual && this.checklistsCollection.length > 0) {
        this.checklistSelecionado = this.checklistsCollection[0].codigo;
      }
      this.construirFormularioExecucao();
      this.changeDetector.markForCheck();
      try {
        this.gestores = await this.gestorOsStorage.getGestores();
        this.changeDetector.markForCheck();
      } catch (error: any) {
        console.error('Erro ao carregar gestores para solicitações de OS:', error);
        this.gestores = [];
        this.changeDetector.markForCheck();
        await this.exibirToastAviso(error.error?.error || 'Não foi possível carregar os gestores da API.');
      }
    } catch (error: any) {
      console.error('Erro ao carregar checklists:', error);
      this.checklistsCollection = [];
      this.construirFormularioExecucao();
      this.changeDetector.markForCheck();
      await this.exibirToastAviso(error.error?.error || 'Não foi possível carregar os checklists da API.');
    }
  }

  get checklistAtual(): Checklist | undefined {
    return this.checklistsCollection.find(c => c.codigo === this.checklistSelecionado);
  }

  get gestoresDaArea(): GestorArea[] {
    const area = this.normalizarArea(this.checklistAtual?.setor || '');
    return this.gestores.filter(gestor => gestor.ativo && this.normalizarArea(gestor.area) === area);
  }

  get checklistsFiltrados(): Checklist[] {
    if (!this.termoPesquisa.trim()) {
      return this.checklistsCollection;
    }
    const termoLower = this.termoPesquisa.toLowerCase();
    return this.checklistsCollection.filter(c => 
      c.codigo.toLowerCase().includes(termoLower) || 
      c.descricao.toLowerCase().includes(termoLower)
    );
  }

  abrirPesquisa() {
    this.termoPesquisa = '';
    this.exibirModalPesquisa = true;
  }

  fecharPesquisa() {
    this.exibirModalPesquisa = false;
  }

  selecionarChecklistPelaPesquisa(codigo: string) {
    this.checklistSelecionado = codigo;
    this.construirFormularioExecucao();
    this.fecharPesquisa();
  }

  filtrarChecklists(event: any) {
    this.termoPesquisa = event.detail.value || '';
  }

  obterChaveSanitizada(prefixo: string, codigoCl: string, itemNum: string): string {
    return `${prefixo}_${codigoCl}_${itemNum}`.replace(/\./g, '_');
  }

  construirFormularioExecucao() {
    const group: any = {};
    this.checklistsCollection.forEach(checklist => {
      checklist.itens.forEach((item) => {
        if (item.tipoResposta) {
          const validadores = item.obrigatorio ? [Validators.required] : [];
          const chaveResposta = this.obterChaveSanitizada('resposta', checklist.codigo, item.item);
          const chaveObservacao = this.obterChaveSanitizada('observacao', checklist.codigo, item.item);
          group[chaveResposta] = ['', validadores];
          group[chaveObservacao] = [''];
        }
      });
    });
    this.checklistForm = this.fb.group(group);
  }

  obterProgresso(): number {
    if (!this.checklistAtual || !this.checklistForm) return 0;

    const itensObrigatorios = this.checklistAtual.itens.filter((i) => i.tipoResposta && i.obrigatorio);
    if (itensObrigatorios.length === 0) return 1;

    let respondidos = 0;
    itensObrigatorios.forEach((item) => {
      const chave = this.obterChaveSanitizada('resposta', this.checklistAtual!.codigo, item.item);
      const controle = this.checklistForm.get(chave);
      if (controle && controle.value !== null && controle.value !== undefined && controle.value.toString().trim() !== '') {
        respondidos++;
      }
    });

    return respondidos / itensObrigatorios.length;
  }

  limparRespostas() {
    if (!this.checklistAtual) return;

    this.checklistAtual.itens.forEach((item) => {
      if (item.tipoResposta) {
        const chaveResp = this.obterChaveSanitizada('resposta', this.checklistAtual!.codigo, item.item);
        const chaveObs = this.obterChaveSanitizada('observacao', this.checklistAtual!.codigo, item.item);
        
        const controleResp = this.checklistForm.get(chaveResp);
        const controleObs = this.checklistForm.get(chaveObs);

        if (controleResp) {
          controleResp.setValue('');
          controleResp.markAsUntouched();
        }
        if (controleObs) {
          controleObs.setValue('');
          controleObs.clearValidators();
          controleObs.updateValueAndValidity();
          controleObs.markAsUntouched();
        }
      }
    });
  }

  async confirmarExclusaoChecklist() {
    if (!this.checklistAtual) return;

    const alert = await this.alertController.create({
      header: 'Excluir Formulário',
      message: `Tem certeza que deseja apagar o checklist [${this.checklistAtual.codigo}] permanentemente?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => {
            void this.excluirChecklistAtual();
          }
        }
      ]
    });
    await alert.present();
  }

  async excluirChecklistAtual() {
    const codigoParaRemover = this.checklistSelecionado;
    try {
      await this.storageService.excluirChecklistNaApi(codigoParaRemover);
      this.checklistsCollection = this.storageService.getChecklists();
      this.checklistSelecionado = this.checklistsCollection[0]?.codigo || '';
      this.construirFormularioExecucao();

      const toast = await this.toastController.create({
        message: 'Formulário removido com sucesso!',
        duration: 2000,
        color: 'success',
        position: 'top'
      });
      await toast.present();
    } catch (error: any) {
      await this.exibirToastAviso(error.error?.error || 'Erro ao excluir checklist no banco.');
    }
  }

  verificarObrigatoriedadeObservacao(itemNum: string, valorSelecionado: any) {
    if (!this.checklistAtual) return;
    const codigoCl = this.checklistAtual.codigo;
    const chaveObs = this.obterChaveSanitizada('observacao', codigoCl, itemNum);
    const controleObs = this.checklistForm.get(chaveObs);
    
    if (controleObs) {
      if (valorSelecionado === 'Não Conforme' || valorSelecionado === 'NC') {
        controleObs.setValidators([Validators.required]);
      } else {
        controleObs.clearValidators();
      }
      controleObs.updateValueAndValidity();
    }
  }

  isRespostaNaoConforme(itemNum: string): boolean {
    if (!this.checklistAtual || !this.checklistForm) return false;
    const chaveResposta = this.obterChaveSanitizada('resposta', this.checklistAtual.codigo, itemNum);
    const resposta = String(this.checklistForm.get(chaveResposta)?.value || '').trim().toLowerCase();
    return resposta === 'não conforme' || resposta === 'nao conforme' || resposta === 'nc';
  }

  async abrirSolicitacaoOs(item: ItemChecklist): Promise<void> {
    const checklist = this.checklistAtual;
    if (!checklist || !this.isRespostaNaoConforme(item.item)) return;

    const area = checklist.setor?.trim() || '';
    if (!area) {
      await this.exibirToastAviso('Defina a área responsável no cadastro deste checklist antes de solicitar uma OS.');
      return;
    }

    this.gestores = await this.gestorOsStorage.getGestores();
    const gestoresDaArea = this.gestores.filter(gestor => gestor.ativo && this.normalizarArea(gestor.area) === this.normalizarArea(area));
    
    if (gestoresDaArea.length === 0) {
      await this.exibirToastAviso(`Cadastre um gestor ativo para a área ${area} antes de solicitar a OS.`);
      return;
    }

    const chaveObservacao = this.obterChaveSanitizada('observacao', checklist.codigo, item.item);
    this.itemOsSelecionado = item;
    this.solicitacaoOsForm.reset({
      gestorId: gestoresDaArea.length === 1 ? gestoresDaArea[0].id : '',
      irregularidade: this.checklistForm.get(chaveObservacao)?.value || '',
      correcaoSolicitada: ''
    });
    this.exibirModalSolicitacaoOs = true;
  }

  fecharModalSolicitacaoOs(): void {
    this.exibirModalSolicitacaoOs = false;
    this.itemOsSelecionado = null;
  }

  async salvarSolicitacaoOs(): Promise<void> {
    const checklist = this.checklistAtual;
    const item = this.itemOsSelecionado;
    if (!checklist || !item || this.solicitacaoOsForm.invalid) {
      this.solicitacaoOsForm.markAllAsTouched();
      return;
    }

    const dados = this.solicitacaoOsForm.getRawValue();
    const gestor = this.gestores.find(candidato =>
      candidato.id === dados.gestorId && candidato.ativo &&
      this.normalizarArea(candidato.area) === this.normalizarArea(checklist.setor || '')
    );
    if (!gestor) {
      await this.exibirToastAviso('Selecione um gestor ativo da área responsável.');
      return;
    }

    const chaveResposta = this.obterChaveSanitizada('resposta', checklist.codigo, item.item);
    const abertaEm = new Date().toISOString();
    const solicitante = this.authService.getUsuarioLogado()?.nome || 'Usuário não identificado';
    const solicitacao: SolicitacaoOs = {
      id: this.criarId('os'),
      numero: this.gestorOsStorage.gerarProximoNumero(),
      inspecaoId: this.obterInspecaoEmAndamentoId(checklist.codigo),
      codigoChecklist: checklist.codigo,
      descricaoChecklist: normalizarTextoMaiusculo(checklist.descricao),
      revisaoChecklist: normalizarTextoMaiusculo(checklist.revisao),
      item: item.item,
      pergunta: normalizarTextoMaiusculo(item.descricao),
      resposta: normalizarTextoMaiusculo(String(this.checklistForm.get(chaveResposta)?.value || '')),
      irregularidade: normalizarTextoMaiusculo(dados.irregularidade),
      correcaoSolicitada: normalizarTextoMaiusculo(dados.correcaoSolicitada),
      area: normalizarTextoMaiusculo(checklist.setor),
      gestorId: gestor.id,
      gestorNome: normalizarTextoMaiusculo(gestor.nome),
      gestorEmail: gestor.email,
      gestorWhatsapp: gestor.whatsapp,
      solicitante: normalizarTextoMaiusculo(solicitante),
      abertaEm,
      criadaEm: abertaEm,
      prazoCorrecao: null,
      informadoPor: null,
      dataConclusao: null,
      status: 'PENDENTE',
      notificacaoStatus: 'PENDENTE',
      historico: [{
        id: this.criarId('evento'),
        data: abertaEm,
        autor: normalizarTextoMaiusculo(solicitante),
        tipo: 'ABERTURA',
        descricao: `OS aberta a partir do checklist ${checklist.codigo}, item ${item.item}.`
      }],
      observacoes: '',
      fotoAntesId: null,
      fotoDepoisId: null
    };

    await this.gestorOsStorage.saveSolicitacao(solicitacao);
    this.fecharModalSolicitacaoOs();

    let notificacaoEnviada = false;
    try {
      notificacaoEnviada = await this.osNotificationService.notificarGestor(solicitacao);
      if (notificacaoEnviada) {
        await this.gestorOsStorage.atualizarStatusNotificacao(solicitacao.id, 'ENVIADA');
      }
    } catch (error) {
      console.error('Erro ao notificar gestor da OS:', error);
      await this.gestorOsStorage.atualizarStatusNotificacao(solicitacao.id, 'FALHOU');
    }

    const mensagem = notificacaoEnviada
      ? 'Solicitação de OS registrada e encaminhada ao gestor.'
      : 'Solicitação de OS registrada; notificação pendente de integração com o backend.';
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 3500,
      color: notificacaoEnviada ? 'success' : 'warning',
      position: 'top'
    });
    await toast.present();
  }

  private obterInspecaoEmAndamentoId(codigoChecklist: string): string {
    let id = this.inspecoesEmAndamento.get(codigoChecklist);
    if (!id) {
      id = this.criarId('inspecao');
      this.inspecoesEmAndamento.set(codigoChecklist, id);
    }
    return id;
  }

  private criarId(prefixo: string): string {
    return `${prefixo}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  private normalizarArea(area: string): string {
    return area.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
  }
  
  editarChecklistAtual() {
    if (!this.checklistAtual) return;
    this.router.navigate(['/cadastrar'], { queryParams: { codigo: this.checklistAtual.codigo } });
  }  

  async clonarChecklistAtual() {
    if (!this.checklistAtual) return;

    const sugestaoCodigo = (this.checklistsCollection.length + 1).toString().padStart(6, '0');

    const alert = await this.alertController.create({
      header: 'Clonar Estrutura',
      subHeader: `Criar cópia com base no Cód: ${this.checklistAtual.codigo}`,
      message: 'Insira o código exclusivo para a nova cópia identificadora:',
      inputs: [
        {
          name: 'novoCodigo',
          type: 'text',
          placeholder: 'Ex: 000003',
          value: sugestaoCodigo
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Duplicar',
          handler: (data) => {
            if (!data.novoCodigo || data.novoCodigo.trim() === '') {
              void this.exibirToastAviso('O código não pode ser vazio.');
              return false;
            }
            
            const codigoFormatado = normalizarTextoMaiusculo(data.novoCodigo);
            
            const jaExiste = this.checklistsCollection.some(c => c.codigo === codigoFormatado);
            if (jaExiste) {
              void this.exibirToastAviso(`O código ${codigoFormatado} já está em uso por outro procedimento.`);
              return false;
            }

            void this.executarClonagem(codigoFormatado);
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  private async executarClonagem(novoCodigo: string) {
    if (!this.checklistAtual) return;
    const estruturaClonada: Checklist = JSON.parse(JSON.stringify(this.checklistAtual));
    estruturaClonada.codigo = novoCodigo;
    estruturaClonada.descricao = `${estruturaClonada.descricao} (CÓPIA)`;

    try {
      await this.storageService.salvarChecklistNaApi(estruturaClonada);
      this.checklistsCollection = this.storageService.getChecklists();
      this.construirFormularioExecucao();
      this.checklistSelecionado = novoCodigo;
      await this.exibirToastSucesso(`Checklist duplicado com sucesso para o código [${novoCodigo}]!`);
    } catch (error: any) {
      await this.exibirToastAviso(error.error?.error || 'Erro ao clonar checklist no banco.');
    }
  }

  private async exibirToastAviso(msg: string) {
    const toast = await this.toastController.create({ message: msg, duration: 3000, color: 'warning', position: 'top' });
    await toast.present();
  }

  private async exibirToastSucesso(msg: string) {
    const toast = await this.toastController.create({ message: msg, duration: 2500, color: 'success', position: 'top' });
    await toast.present();
  }

  async salvarChecklist() {
    const currentChecklist = this.checklistAtual;
    if (!currentChecklist) return;

    let formularioValido = true;
    let mensagemErro = 'Por favor, preencha todos os campos obrigatórios marcados com (*)';

    currentChecklist.itens.forEach((item) => {
      if (item.tipoResposta) {
        const chaveResp = this.obterChaveSanitizada('resposta', currentChecklist.codigo, item.item);
        const chaveObs = this.obterChaveSanitizada('observacao', currentChecklist.codigo, item.item);
        
        const controleResp = this.checklistForm.get(chaveResp);
        const controleObs = this.checklistForm.get(chaveObs);

        if (item.obrigatorio && controleResp) {
          const valor = controleResp.value;
          if (valor === null || valor === undefined || valor.toString().trim() === '') {
            formularioValido = false;
            controleResp.markAsTouched();
          }
        }

        if (controleObs && controleObs.invalid) {
          formularioValido = false;
          controleObs.markAsTouched();
          mensagemErro = `A observação é obrigatória para o item ${item.item} marcado como "Não Conforme"`;
        }
      }
    });

    if (!formularioValido) {
      const toast = await this.toastController.create({ message: mensagemErro, duration: 4000, color: 'danger', position: 'top' });
      await toast.present();
      return;
    }

    const formValues = this.checklistForm.value;
    const resultadoInspecao: HistoricoInspecao = {
      id: this.obterInspecaoEmAndamentoId(currentChecklist.codigo),
      codigoChecklist: currentChecklist.codigo,
      descricao: currentChecklist.descricao,
      revisao: currentChecklist.revisao,
      dataExecucao: new Date().toISOString(),
      responsavel: normalizarTextoMaiusculo(this.authService.getUsuarioLogado()?.nome || 'Usuário não identificado'),
      respostas: currentChecklist.itens
        .filter((item) => item.tipoResposta)
        .map((item) => {
          const kResp = this.obterChaveSanitizada('resposta', currentChecklist.codigo, item.item);
          const kObs = this.obterChaveSanitizada('observacao', currentChecklist.codigo, item.item);
          const resposta = formValues[kResp];
          const observacao = formValues[kObs];
          return {
            item: item.item,
            pergunta: normalizarTextoMaiusculo(item.descricao),
            resposta: typeof resposta === 'string' ? normalizarTextoMaiusculo(resposta) : resposta,
            observacao: typeof observacao === 'string' ? normalizarTextoMaiusculo(observacao) || null : observacao || null
          };
        })
    };

    try {
      await this.storageService.saveInspecao(resultadoInspecao);
      this.inspecoesEmAndamento.delete(currentChecklist.codigo);
      const toast = await this.toastController.create({ message: 'Inspeção gravada e finalizada com sucesso!', duration: 2500, color: 'success', position: 'top' });
      await toast.present();
      
      this.limparRespostas();
    } catch (error) {
      console.error('Erro ao gravar inspeção:', error);
      const toast = await this.toastController.create({ message: 'Erro ao salvar inspeção no banco de dados.', duration: 3000, color: 'danger', position: 'top' });
      await toast.present();
    }
  }

  isCampoInvalido(tipo: string, codigo: string, item: string): boolean {
    const control = this.checklistForm.get(this.obterChaveSanitizada(tipo, codigo, item));
    return !!(control && control.touched && control.invalid);
  }

  async abrirModalHistorico() {
    this.historicoInspecoes = await this.storageService.carregarHistoricoDaApi();
    this.exibirModalHistorico = true;
  }

  fecharModalHistorico() {
    this.exibirModalHistorico = false;
  }

  restaurarInspecaoDoHistorico(inspecao: HistoricoInspecao) {
    this.checklistSelecionado = inspecao.codigoChecklist;
    if (inspecao.id) this.inspecoesEmAndamento.set(inspecao.codigoChecklist, inspecao.id);
    this.construirFormularioExecucao();

    inspecao.respostas.forEach(r => {
      const chaveResp = this.obterChaveSanitizada('resposta', inspecao.codigoChecklist, r.item);
      const chaveObs = this.obterChaveSanitizada('observacao', inspecao.codigoChecklist, r.item);

      const controleResp = this.checklistForm.get(chaveResp);
      const controleObs = this.checklistForm.get(chaveObs);

      if (controleResp) {
        controleResp.setValue(r.resposta);
      }
      if (controleObs && r.observacao) {
        controleObs.setValue(r.observacao);
      }
    });

    this.fecharModalHistorico();
    void this.exibirToastSucesso(`Inspeção do checklist [${inspecao.codigoChecklist}] carregada no formulário!`);
  }
}