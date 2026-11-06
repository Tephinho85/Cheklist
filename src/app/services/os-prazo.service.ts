import { Injectable } from '@angular/core';
import { CategoriaPrazoOs, SolicitacaoOs } from '../models/checklist.model';

@Injectable({ providedIn: 'root' })
export class OsPrazoService {
  private readonly LEMBRETES_KEY = 'os_lembretes_prazo';
  private readonly diasAntecedencia = 3;

  classificar(solicitacao: SolicitacaoOs, hoje = new Date()): CategoriaPrazoOs {
    if (solicitacao.status === 'CONCLUIDA') return 'CONCLUIDA';
    if (!solicitacao.prazoCorrecao) return 'AGUARDANDO_PRAZO';

    const dias = this.diferencaEmDias(hoje, solicitacao.prazoCorrecao);
    if (dias < 0) return 'VENCIDA';
    if (dias <= this.diasAntecedencia) return 'PROXIMA_DO_VENCIMENTO';
    return 'DENTRO_DO_PRAZO';
  }

  obterLembretes(solicitacoes: SolicitacaoOs[], hoje = new Date()): SolicitacaoOs[] {
    const dataChave = this.dataLocal(hoje);
    const chavesEnviadas = this.lerChaves();
    const lembretes = solicitacoes.filter(solicitacao => {
      const categoria = this.classificar(solicitacao, hoje);
      if (categoria !== 'PROXIMA_DO_VENCIMENTO' && categoria !== 'VENCIDA') return false;
      const chave = `${solicitacao.id}|${categoria}|${dataChave}`;
      if (chavesEnviadas.includes(chave)) return false;
      chavesEnviadas.push(chave);
      return true;
    });

    if (lembretes.length) {
      localStorage.setItem(this.LEMBRETES_KEY, JSON.stringify(chavesEnviadas.slice(-1000)));
    }
    return lembretes;
  }

  private diferencaEmDias(hoje: Date, prazo: string): number {
    const [ano, mes, dia] = prazo.slice(0, 10).split('-').map(Number);
    const diaPrazo = Date.UTC(ano, mes - 1, dia);
    const diaAtual = Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    return Math.round((diaPrazo - diaAtual) / 86_400_000);
  }

  private dataLocal(data: Date): string {
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  }

  private lerChaves(): string[] {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(this.LEMBRETES_KEY) || '[]');
      return Array.isArray(saved) ? saved.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return [];
    }
  }
}