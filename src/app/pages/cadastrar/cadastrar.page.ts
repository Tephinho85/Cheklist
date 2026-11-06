import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonButton, IonButtons, IonCheckbox, IonContent, IonFooter, IonHeader,
  IonIcon, IonInput, IonItem, IonLabel, IonList, IonMenuButton, IonModal,
  IonSearchbar, IonSelect, IonSelectOption, IonTitle, IonToolbar, ToastController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addOutline, addCircleOutline, closeOutline, printOutline, saveOutline, searchOutline, trashOutline } from 'ionicons/icons';
import { Checklist, ItemChecklist } from '../../models/checklist.model';
import { ChecklistStorageService } from '../../services/checklist-storage.service';
import { PdfService } from '../../services/pdf.service';
import { UppercaseInputDirective } from '../../directives/uppercase-input.directive';
import { normalizarTextoMaiusculo } from '../../utils/text-normalization';

@Component({
  selector: 'app-cadastrar',
  templateUrl: './cadastrar.page.html',
  styleUrls: ['./cadastrar.page.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, UppercaseInputDirective, IonButton, IonButtons, IonCheckbox,
    IonContent, IonFooter, IonHeader, IonIcon, IonInput, IonItem, IonLabel,
    IonList, IonMenuButton, IonModal, IonSearchbar, IonSelect, IonSelectOption,
    IonTitle, IonToolbar
  ]
})
export class CadastrarPage implements OnInit {
  novoChecklistForm!: FormGroup;
  modoEdicao = false;
  codigoChecklistEdicao = '';
  checklistsCadastrados: Checklist[] = [];
  exibirModalPesquisa = false;
  termoPesquisa = '';

  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly storageService = inject(ChecklistStorageService);
  private readonly pdfService = inject(PdfService);
  private readonly toastController = inject(ToastController);

  constructor() {
    addIcons({ addOutline, addCircleOutline, closeOutline, printOutline, saveOutline, searchOutline, trashOutline });
  }

  async ngOnInit(): Promise<void> {
    this.inicializarFormulario();
    this.checklistsCadastrados = await this.storageService.carregarChecklistsDaApi();

    this.route.queryParams.subscribe(params => {
      const codigo = params['codigo'];
      if (codigo) {
        const encontrado = this.checklistsCadastrados.find(c => c.codigo === codigo);
        if (encontrado) {
          this.carregarChecklistNoFormulario(encontrado);
        }
      }
    });
  }

  async ionViewWillEnter(): Promise<void> {
    this.checklistsCadastrados = await this.storageService.carregarChecklistsDaApi();
  }

  get itensArray(): FormArray {
    return this.novoChecklistForm.get('itens') as FormArray;
  }

  get checklistsFiltrados(): Checklist[] {
    const termo = this.termoPesquisa.trim().toLowerCase();
    if (!termo) return this.checklistsCadastrados;
    return this.checklistsCadastrados.filter(c =>
      c.codigo.toLowerCase().includes(termo) ||
      c.descricao.toLowerCase().includes(termo) ||
      (c.setor || '').toLowerCase().includes(termo)
    );
  }

  inicializarFormulario(): void {
    this.novoChecklistForm = this.fb.group({
      codigo: ['', Validators.required],
      descricao: ['', Validators.required],
      revisao: [new Date().toLocaleDateString('pt-BR').replace(/\//g, '-'), Validators.required],
      setor: ['', Validators.required],
      metaInspecoesMensais: [0, [Validators.required, Validators.min(0)]],
      itens: this.fb.array([])
    });
    this.adicionarItemAoCadastro();
  }

  criarGrupoItem(item?: ItemChecklist): FormGroup {
    return this.fb.group({
      item: [item?.item || '', Validators.required],
      descricao: [item?.descricao || '', Validators.required],
      tipoResposta: [item?.tipoResposta || 'Selecao'],
      opcoesTexto: [item?.opcoes ? item.opcoes.join(',') : 'Conforme,Não Conforme,N/A'],
      obrigatorio: [item?.obrigatorio ?? true]
    });
  }

  adicionarItemAoCadastro(): void {
    this.itensArray.push(this.criarGrupoItem());
  }

  removerItemDoCadastro(index: number): void {
    if (this.itensArray.length > 1) {
      this.itensArray.removeAt(index);
    }
  }

  abrirModalPesquisa(): void {
    this.termoPesquisa = '';
    this.exibirModalPesquisa = true;
  }

  fecharModalPesquisa(): void {
    this.exibirModalPesquisa = false;
  }

  filtrarChecklists(event: any): void {
    this.termoPesquisa = event.detail.value || '';
  }

  selecionarChecklistParaEdicao(checklist: Checklist): void {
    this.carregarChecklistNoFormulario(checklist);
    this.fecharModalPesquisa();
  }

  carregarChecklistNoFormulario(checklist: Checklist): void {
    this.modoEdicao = true;
    this.codigoChecklistEdicao = checklist.codigo;

    this.novoChecklistForm.patchValue({
      codigo: checklist.codigo,
      descricao: checklist.descricao,
      revisao: checklist.revisao,
      setor: checklist.setor || '',
      metaInspecoesMensais: checklist.metaInspecoesMensais ?? 0
    });

    this.itensArray.clear();
    (checklist.itens || []).forEach(item => {
      this.itensArray.push(this.criarGrupoItem(item));
    });
  }

  limparParaNovoCadastro(): void {
    this.modoEdicao = false;
    this.codigoChecklistEdicao = '';
    this.inicializarFormulario();
  }

  private montarObjetoChecklist(): Checklist {
    const raw = this.novoChecklistForm.getRawValue();
    const itens: ItemChecklist[] = (raw.itens || []).map((i: any) => {
      const possuiResposta = !!i.tipoResposta;
      const opcoes = (i.tipoResposta === 'Selecao' || i.tipoResposta === 'Radio')
        ? String(i.opcoesTexto || '')
            .split(',')
            .map((op: string) => normalizarTextoMaiusculo(op))
            .filter(Boolean)
        : undefined;

      return {
        item: normalizarTextoMaiusculo(i.item),
        descricao: normalizarTextoMaiusculo(i.descricao),
        tipoResposta: possuiResposta ? i.tipoResposta : undefined,
        opcoes,
        obrigatorio: possuiResposta ? Boolean(i.obrigatorio) : false,
        observacaoTipo: possuiResposta ? 'Texto Livre' : undefined
      };
    });

    return {
      codigo: normalizarTextoMaiusculo(raw.codigo),
      descricao: normalizarTextoMaiusculo(raw.descricao),
      revisao: normalizarTextoMaiusculo(raw.revisao),
      setor: normalizarTextoMaiusculo(raw.setor),
      metaInspecoesMensais: Number(raw.metaInspecoesMensais || 0),
      itens
    };
  }

  async salvarNovoChecklist(): Promise<void> {
    if (this.novoChecklistForm.invalid) {
      this.novoChecklistForm.markAllAsTouched();
      await this.mostrarToast('Preencha todos os campos obrigatórios do formulário.', 'warning');
      return;
    }

    const checklist = this.montarObjetoChecklist();

    try {
      await this.storageService.salvarChecklistNaApi(checklist);
      this.checklistsCadastrados = this.storageService.getChecklists();
      this.modoEdicao = true;
      this.codigoChecklistEdicao = checklist.codigo;
      await this.mostrarToast('Checklist salvo no banco de dados com sucesso!', 'success');
    } catch (error: any) {
      console.error('Erro ao salvar checklist:', error);
      await this.mostrarToast(error.error?.error || 'Erro ao salvar checklist no banco.', 'danger');
    }
  }

  imprimirChecklist(): void {
    const checklist = this.montarObjetoChecklist();
    if (!checklist.codigo || !checklist.descricao) {
      void this.mostrarToast('Carregue ou preencha um checklist antes de imprimir.', 'warning');
      return;
    }

    const respostasEmBranco = {
      respSesmt: '',
      matSesmt: '',
      respSetor: '',
      matSetor: '',
      setor: checklist.setor || '',
      data: new Date().toLocaleDateString('pt-BR'),
      observacoesRonda: '',
      ordensServico: '',
      respostas: {}
    };

    this.pdfService.gerarChecklistPdf(checklist, respostasEmBranco);
  }

  private async mostrarToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({ message, color, duration: 2800, position: 'top' });
    await toast.present();
  }
}