import { Injectable } from '@angular/core';
import { Checklist, HistoricoInspecao } from '../models/checklist.model';

export interface ResultadoChecklistDashboard {
  codigo: string;
  descricao: string;
  area: string;
  prevista: number | null;
  realizada: number;
  cumprimento: number | null;
  pendente: number | null;
}

export interface ResultadoResponsavelDashboard {
  nome: string;
  realizada: number;
  percentual: number;
}

export interface ResultadoPeriodoDashboard {
  periodo: string;
  rotulo: string;
  prevista: number;
  realizada: number;
}

export interface DashboardChecklistResultado {
  periodo: string;
  quantidadePrevista: number;
  quantidadeRealizada: number;
  realizadasComMeta: number;
  percentualCumprimento: number | null;
  pendencias: number;
  porChecklist: ResultadoChecklistDashboard[];
  porResponsavel: ResultadoResponsavelDashboard[];
  porPeriodo: ResultadoPeriodoDashboard[];
  semMeta: ResultadoChecklistDashboard[];
}

@Injectable({ providedIn: 'root' })
export class DashboardChecklistService {
  calcular(
    checklists: Checklist[],
    historico: HistoricoInspecao[],
    periodo: string
  ): DashboardChecklistResultado {
    const historicoDoPeriodo = historico.filter(inspecao => inspecao.dataExecucao.slice(0, 7) === periodo);
    const realizadasPorCodigo = this.contarPor(historicoDoPeriodo, inspecao => inspecao.codigoChecklist);

    const porChecklist = checklists.map(checklist => {
      const realizada = realizadasPorCodigo.get(checklist.codigo) || 0;
      const meta = Number(checklist.metaInspecoesMensais) || 0;
      const prevista = meta > 0 ? meta : null;
      return {
        codigo: checklist.codigo,
        descricao: checklist.descricao,
        area: checklist.setor || 'Área não definida',
        prevista,
        realizada,
        cumprimento: prevista ? realizada / prevista * 100 : null,
        pendente: prevista ? Math.max(0, prevista - realizada) : null
      };
    });

    const checklistsComMeta = porChecklist.filter(item => item.prevista !== null);
    const quantidadePrevista = checklistsComMeta.reduce((total, item) => total + item.prevista!, 0);
    const realizadasComMeta = checklistsComMeta.reduce((total, item) => total + item.realizada, 0);
    const quantidadeRealizada = historicoDoPeriodo.length;
    const totalResponsaveis = historicoDoPeriodo.length;
    const porResponsavel = [...this.contarPor(
      historicoDoPeriodo,
      inspecao => inspecao.responsavel?.trim() || 'Responsável não identificado'
    )].map(([nome, realizada]) => ({
      nome,
      realizada,
      percentual: totalResponsaveis ? realizada / totalResponsaveis * 100 : 0
    })).sort((a, b) => b.realizada - a.realizada || a.nome.localeCompare(b.nome));

    return {
      periodo,
      quantidadePrevista,
      quantidadeRealizada,
      realizadasComMeta,
      percentualCumprimento: quantidadePrevista ? realizadasComMeta / quantidadePrevista * 100 : null,
      pendencias: checklistsComMeta.reduce((total, item) => total + (item.pendente || 0), 0),
      porChecklist: porChecklist.sort((a, b) => a.area.localeCompare(b.area) || a.descricao.localeCompare(b.descricao)),
      porResponsavel,
      porPeriodo: this.gerarSerieMensal(checklists, historico, periodo),
      semMeta: porChecklist.filter(item => item.prevista === null)
    };
  }

  private gerarSerieMensal(
    checklists: Checklist[],
    historico: HistoricoInspecao[],
    periodo: string
  ): ResultadoPeriodoDashboard[] {
    const [ano, mes] = periodo.split('-').map(Number);
    const codigosComMeta = new Set(
      checklists
        .filter(checklist => (Number(checklist.metaInspecoesMensais) || 0) > 0)
        .map(checklist => checklist.codigo)
    );
    return Array.from({ length: 6 }, (_, indice) => {
      const data = new Date(ano, mes - 1 - (5 - indice), 1);
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      const realizadas = historico.filter(inspecao =>
        inspecao.dataExecucao.slice(0, 7) === chave && codigosComMeta.has(inspecao.codigoChecklist)
      ).length;
      return {
        periodo: chave,
        rotulo: new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(data).replace('.', ''),
        prevista: checklists.reduce((total, checklist) => total + (Number(checklist.metaInspecoesMensais) || 0), 0),
        realizada: realizadas
      };
    });
  }

  private contarPor<T>(items: T[], chave: (item: T) => string): Map<string, number> {
    const contagem = new Map<string, number>();
    items.forEach(item => {
      const valor = chave(item);
      contagem.set(valor, (contagem.get(valor) || 0) + 1);
    });
    return contagem;
  }
}