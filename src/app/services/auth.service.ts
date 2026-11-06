import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { UserProfile, SectorType } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiBaseUrl}/auth`;
  private usuarioLogado: UserProfile | null = null;

  constructor(private http: HttpClient) {}

  async login(loginInput: string, senha: string): Promise<{ success: boolean; message: string }> {
    const upperLogin = loginInput.trim().toUpperCase();

    try {
      const payload = { login: upperLogin, password: senha }; 
      
      const response = await firstValueFrom(this.http.post<any>(`${this.apiUrl}/login`, payload));

      if (response && response.token) {
        this.usuarioLogado = response.user;
        
        // A LINHA MÁGICA QUE FALTAVA: Guardar o token no navegador!
        localStorage.setItem('token', response.token); 
        
        return { success: true, message: 'Login realizado com sucesso!' };
      } else {
        return { success: false, message: response.message || 'Credenciais inválidas.' };
      }
    } catch (error: any) {
      console.error('Erro na API:', error);
      return { success: false, message: error.error?.error || 'Erro de conexão com o servidor.' };
    }
  }

  getUsuarioLogado(): UserProfile | null {
    return this.usuarioLogado;
  }

  // Deixei o mock provisório na assinatura apenas para não quebrar a tela de checklists
  validarAssinaturaResponsavel(loginResponsavel: string, senha: string, setorRequerido: SectorType) {
    return { success: false, message: 'Validação em manutenção (migrando para API).' };
  }

  logout() {
    this.usuarioLogado = null;
    // Quando sair, limpamos o token por segurança
    localStorage.removeItem('token'); 
  }
}