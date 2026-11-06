import { TestBed } from '@angular/core/testing';
import { Checklist, HistoricoInspecao } from '../models/checklist.model';
import { DashboardChecklistService } from './dashboard-checklist.service';

describe('DashboardChecklistService', () => {
  let service: DashboardChecklistService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardChecklistService);
  });

  it('calculates monthly totals, completion, pending inspections and breakdowns', () => {
    const checklists: Checklist[] = [
      { codigo: 'A', descricao: 'Segurança', revisao: '01', setor: 'SESMT', metaInspecoesMensais: 3, itens: [] },
      { codigo: 'B', descricao: 'Máquinas', revisao: '02', setor: 'Produção', metaInspecoesMensais: 2, itens: [] },
      { codigo: 'C', descricao: 'Antigo', revisao: '01', setor: 'Logística', itens: [] }
    ];
    const historico: HistoricoInspecao[] = [
      { codigoChecklist: 'A', descricao: 'Segurança', dataExecucao: '2026-10-02T10:00:00.000Z', responsavel: 'Ana', respostas: [] },
      { codigoChecklist: 'A', descricao: 'Segurança', dataExecucao: '2026-10-03T10:00:00.000Z', responsavel: 'Ana', respostas: [] },
      { codigoChecklist: 'B', descricao: 'Máquinas', dataExecucao: '2026-10-04T10:00:00.000Z', responsavel: 'Bruno', respostas: [] },
      { codigoChecklist: 'A', descricao: 'Segurança', dataExecucao: '2026-09-30T23:00:00.000Z', responsavel: 'Ana', respostas: [] }
    ];

    const resultado = service.calcular(checklists, historico, '2026-10');

    expect(resultado.quantidadePrevista).toBe(5);
    expect(resultado.quantidadeRealizada).toBe(3);
    expect(resultado.realizadasComMeta).toBe(3);
    expect(resultado.percentualCumprimento).toBe(60);
    expect(resultado.pendencias).toBe(2);
    expect(resultado.porChecklist.find(item => item.codigo === 'A')?.realizada).toBe(2);
    expect(resultado.porResponsavel[0].nome).toBe('Ana');
    expect(resultado.porResponsavel[0].realizada).toBe(2);
    expect(resultado.porResponsavel[0].percentual).toBeCloseTo(200 / 3);
    expect(resultado.semMeta.map(item => item.codigo)).toEqual(['C']);
    expect(resultado.porPeriodo).toHaveLength(6);
    expect(resultado.porPeriodo[5].realizada).toBe(3);
  });

  it('returns no percentage when the month has no configured goals', () => {
    const checklist: Checklist = { codigo: 'A', descricao: 'Sem meta', revisao: '01', itens: [] };

    const resultado = service.calcular([checklist], [], '2026-10');

    expect(resultado.quantidadePrevista).toBe(0);
    expect(resultado.percentualCumprimento).toBeNull();
    expect(resultado.pendencias).toBe(0);
  });
});