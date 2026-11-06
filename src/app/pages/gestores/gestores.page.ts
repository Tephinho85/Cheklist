import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AlertController, IonBadge, IonButton, IonButtons, IonContent, IonHeader, IonIcon,
  IonInput, IonItem, IonLabel, IonList, IonMenuButton, IonModal,
  IonTitle, IonToggle, IonToolbar, ToastController
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addOutline, createOutline, personOutline, trashOutline } from 'ionicons/icons';
import { GestorArea } from '../../models/checklist.model';
import { GestorOsStorageService } from '../../services/gestor-os-storage.service';
import { UppercaseInputDirective } from '../../directives/uppercase-input.directive';
import { normalizarTextoMaiusculo } from '../../utils/text-normalization';

@Component({
  selector: 'app-gestores',
  templateUrl: './gestores.page.html',
  styleUrls: ['./gestores.page.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, UppercaseInputDirective, IonBadge, IonButton, IonButtons, IonContent,
    IonHeader, IonIcon, IonInput, IonItem, IonLabel, IonList, IonMenuButton,
    IonModal, IonTitle, IonToggle, IonToolbar
  ]
})
export class GestoresPage implements OnInit {
  gestores: GestorArea[] = [];
  carregando = true;
  erroCarregamento = '';
  isModalOpen = false;
  gestorEmEdicao: string | null = null;
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);
  private readonly storage = inject(GestorOsStorageService);
  private readonly toastController = inject(ToastController);
  private readonly alertController = inject(AlertController);
  private carregamentoGestores: Promise<void> | null = null;
  private primeiraEntrada = true;

  gestorForm = this.fb.group({
    nome: ['', Validators.required],
    area: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    whatsapp: ['', [Validators.required, Validators.pattern(/^\+?[\d\s().-]{10,20}$/)]],
    ativo: [true]
  });

  constructor() {
    addIcons({ addOutline, createOutline, personOutline, trashOutline });
  }

  ngOnInit(): void {
    void this.carregarGestores();
  }

  ionViewWillEnter(): void {
    if (this.primeiraEntrada) {
      this.primeiraEntrada = false;
      return;
    }
    void this.carregarGestores();
  }

  async carregarGestores(): Promise<boolean> {
    if (this.carregamentoGestores) {
      await this.carregamentoGestores;
      return !this.erroCarregamento;
    }

    this.carregando = true;
    this.carregamentoGestores = this.buscarGestores();
    try {
      await this.carregamentoGestores;
      return !this.erroCarregamento;
    } finally {
      this.carregando = false;
      this.carregamentoGestores = null;
      this.changeDetector.markForCheck();
    }
  }

  private async buscarGestores(): Promise<void> {
    try {
      this.gestores = await this.storage.getGestores();
      this.erroCarregamento = '';
    } catch (error: any) {
      console.error('Erro ao carregar gestores:', error);
      this.gestores = [];
      this.erroCarregamento = error.error?.error || 'Não foi possível carregar os gestores da API.';
      await this.mostrarToast(this.erroCarregamento, 'danger');
    } finally {
      this.changeDetector.markForCheck();
    }
  }

  abrirNovoGestor(): void {
    this.gestorEmEdicao = null;
    this.gestorForm.reset({ area: '', ativo: true, nome: '', email: '', whatsapp: '' });
    this.isModalOpen = true;
  }

  abrirEdicao(gestor: GestorArea): void {
    this.gestorEmEdicao = gestor.id;
    this.gestorForm.reset({
      nome: gestor.nome,
      area: gestor.area,
      email: gestor.email,
      whatsapp: gestor.whatsapp,
      ativo: gestor.ativo
    });
    this.isModalOpen = true;
  }

  fecharModal(): void {
    this.isModalOpen = false;
  }

  async salvarGestor(): Promise<void> {
    if (this.gestorForm.invalid) {
      this.gestorForm.markAllAsTouched();
      return;
    }

    const dados = this.gestorForm.getRawValue();
    const eraEdicao = !!this.gestorEmEdicao;
    const id = this.gestorEmEdicao || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const gestor: GestorArea = {
      id,
      nome: normalizarTextoMaiusculo(dados.nome),
      area: normalizarTextoMaiusculo(dados.area),
      email: dados.email!.trim(),
      whatsapp: dados.whatsapp!.trim(),
      ativo: dados.ativo ?? true
    };

    try {
      await this.storage.salvarGestor(gestor);
      if (!(await this.carregarGestores())) return;
      this.fecharModal();
      await this.mostrarToast(eraEdicao ? 'Gestor atualizado no banco.' : 'Gestor cadastrado no banco.', 'success');
    } catch (error: any) {
      console.error('Erro ao salvar gestor:', error);
      await this.mostrarToast(error.error?.error || 'Erro ao salvar gestor na API.', 'danger');
    }
  }

  async excluirGestor(gestor: GestorArea): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Excluir gestor',
      message: `Deseja excluir o cadastro de ${gestor.nome}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: async () => {
            try {
              await this.storage.excluirGestor(gestor.id);
              if (!(await this.carregarGestores())) return;
              await this.mostrarToast('Gestor excluído.', 'success');
            } catch (error: any) {
              console.error('Erro ao excluir gestor:', error);
              await this.mostrarToast(error.error?.error || 'Erro ao excluir gestor.', 'danger');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  private async mostrarToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({ message, color, duration: 2200, position: 'top' });
    await toast.present();
  }
}