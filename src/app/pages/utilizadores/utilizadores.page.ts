import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { 
  IonContent, IonHeader, IonToolbar, IonTitle, IonButton, 
  IonIcon, IonItem, IonLabel, IonList, IonBadge, IonModal, 
  IonSelect, IonSelectOption, IonToggle, IonButtons, IonMenuButton, IonInput, ToastController 
} from '@ionic/angular';

import { addIcons } from 'ionicons';
import { addOutline, createOutline, powerOutline, personOutline } from 'ionicons/icons';
import { UppercaseInputDirective } from '../../directives/uppercase-input.directive';
import { normalizarTextoMaiusculo } from '../../utils/text-normalization';

@Component({
  selector: 'app-utilizadores',
  templateUrl: './utilizadores.page.html',
  styleUrls: ['./utilizadores.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    UppercaseInputDirective,
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonBadge,
    IonModal,
    IonSelect,
    IonSelectOption,
    IonToggle,
    IonButtons,
    IonMenuButton,
    IonInput
  ]
})
export class UtilizadoresPage implements OnInit {
  utilizadores: any[] = [];
  isModalOpen = false;
  userForm!: FormGroup;
  isEditing = false;
  currentUserId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private toastController: ToastController
  ) {
    addIcons({ addOutline, createOutline, powerOutline, personOutline });
  }

  ngOnInit() {
    this.initForm();
    this.carregarUtilizadores();
  }

  initForm() {
    this.userForm = this.fb.group({
      login: ['', [Validators.required]],
      nome: ['', [Validators.required]],
      setor: ['', [Validators.required]],
      perfil: ['TITULAR', [Validators.required]],
      podeAssinar: [true],
      ativo: [true]
    });
  }

  carregarUtilizadores() {
    // Dados simulados iniciais para demonstração
    this.utilizadores = [
      { id: '1', login: 'ADMIN', nome: 'Carlos TST (Titular)', setor: 'SESMT', perfil: 'TITULAR', podeAssinar: true, ativo: true },
      { id: '2', login: 'MANUT1', nome: 'Roberto (Líder Manutenção)', setor: 'MANUTENCAO', perfil: 'TITULAR', podeAssinar: true, ativo: true },
      { id: '3', login: 'ESTAGIO', nome: 'Lucas (Estagiário)', setor: 'SESMT', perfil: 'AUXILIAR', podeAssinar: false, ativo: true }
    ];
  }

  abrirModalAdicionar() {
    this.isEditing = false;
    this.currentUserId = null;
    this.userForm.reset({
      setor: '',
      perfil: 'TITULAR',
      podeAssinar: true,
      ativo: true
    });
    this.isModalOpen = true;
  }

  abrirModalEditar(user: any) {
    this.isEditing = true;
    this.currentUserId = user.id;
    this.userForm.patchValue({
      login: user.login,
      nome: user.nome,
      setor: user.setor,
      perfil: user.perfil,
      podeAssinar: user.podeAssinar,
      ativo: user.ativo ?? true
    });
    this.isModalOpen = true;
  }

  fecharModal() {
    this.isModalOpen = false;
  }

  salvarUtilizador() {
    if (this.userForm.valid) {
      const dados = this.userForm.getRawValue();
      const dadosNormalizados = {
        ...dados,
        login: normalizarTextoMaiusculo(dados.login),
        nome: normalizarTextoMaiusculo(dados.nome),
        setor: normalizarTextoMaiusculo(dados.setor)
      };
      if (this.isEditing) {
        const index = this.utilizadores.findIndex(u => u.id === this.currentUserId);
        if (index !== -1) {
          this.utilizadores[index] = { ...this.utilizadores[index], ...dadosNormalizados };
        }
        this.mostrarToast('Usuário atualizado com sucesso!', 'success');
      } else {
        const novoUser = {
          id: String(Date.now()),
          ...dadosNormalizados
        };
        this.utilizadores.push(novoUser);
        this.mostrarToast('Usuário cadastrado com sucesso!', 'success');
      }
      this.isModalOpen = false;
    }
  }

  alternarStatus(user: any) {
    user.ativo = !user.ativo;
    const statusStr = user.ativo ? 'ativado' : 'inativado';
    this.mostrarToast(`Usuário ${statusStr} com sucesso!`, 'warning');
  }

  async mostrarToast(msg: string, color: string) {
    const toast = await this.toastController.create({
      message: msg,
      duration: 2000,
      color: color,
      position: 'top'
    });
    await toast.present();
  }
}