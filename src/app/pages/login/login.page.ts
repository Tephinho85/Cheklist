import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

// Componentes Ionic Standalone
import { IonContent, IonInput, IonIcon, IonButton, ToastController } from '@ionic/angular';

// Ícones
import { addIcons } from 'ionicons';
import { shieldCheckmarkOutline, personOutline, lockClosedOutline, logInOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { UppercaseInputDirective } from '../../directives/uppercase-input.directive';

// Serviço de Autenticação
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    UppercaseInputDirective,
    IonContent,
    IonInput,
    IonIcon,
    IonButton
  ]
})
export class LoginPage implements OnInit {
  loginForm!: FormGroup;
  mostrarSenha = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private toastController: ToastController,
    private authService: AuthService
  ) {
    addIcons({ shieldCheckmarkOutline, personOutline, lockClosedOutline, logInOutline, eyeOutline, eyeOffOutline });
  }

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required]], 
      senha: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  // Mantém a regra de conversão automática para maiúsculo
  converterParaMaiusculo(event: any) {
    const valor = event.target.value;
    if (valor) {
      this.loginForm.patchValue(
        { email: valor.toUpperCase() }, 
        { emitEvent: false }
      );
    }
  }

  alternarVisibilidadeSenha(): void {
    this.mostrarSenha = !this.mostrarSenha;
  }

  async avisarContatoTi(): Promise<void> {
    const toast = await this.toastController.create({
      message: 'Para redefinir sua senha, contate o setor de TI.',
      duration: 3000,
      color: 'medium',
      position: 'top'
    });
    await toast.present();
  }

  async fazerLogin() {
    if (this.loginForm.valid) {
      const loginInput = this.loginForm.value.email;
      const senha = this.loginForm.value.senha;

      // Adicionamos o 'await' porque o serviço agora faz um pedido real à API
      const resultado = await this.authService.login(loginInput, senha);

      if (resultado.success) {
        this.router.navigate(['/cadastrar']);

        const toast = await this.toastController.create({
          message: resultado.message,
          duration: 2000,
          color: 'success',
          position: 'top'
        });
        await toast.present();
      } else {
        const toast = await this.toastController.create({
          message: resultado.message,
          duration: 3000,
          color: 'danger',
          position: 'top'
        });
        await toast.present();
      }
    }
  }
}
