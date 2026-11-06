import { TestBed } from '@angular/core/testing';
import { SolicitacaoOs } from '../models/checklist.model';
import { OsPrazoService } from './os-prazo.service';

describe('OsPrazoService', () => {
  let service: OsPrazoService;
  const hoje = new Date(2026, 9, 7, 12);

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(OsPrazoService);
  });

  function criarOs(prazoCorrecao: string | null, status: SolicitacaoOs['status'] = 'EM_ANDAMENTO'): SolicitacaoOs {
    return {
      id: 'os-1',
      numero: 'OS-2026-00001',
      inspecaoId: 'inspecao-1',
      codigoChecklist: '000001',
      descricaoChecklist: 'Checklist de segurança',
      revisaoChecklist: '01',
      item: '1.1',
      pergunta: 'Equipamento limpo?',
      resposta: 'Não Conforme',
      irregularidade: 'Sujeira',
      correcaoSolicitada: 'Limpar',
      area: 'Produção',
      gestorId: 'gestor-1',
      gestorNome: 'Ana Souza',
      gestorEmail: 'ana@example.com',
      gestorWhatsapp: '+55 11 99999-9999',
      solicitante: 'Carlos TST',
      abertaEm: hoje.toISOString(),
      criadaEm: hoje.toISOString(),
      prazoCorrecao,
      status,
      notificacaoStatus: 'PENDENTE'
    };
  }

  it('classifies missing, safe, approaching, overdue and completed deadlines', () => {
    expect(service.classificar(criarOs(null), hoje)).toBe('AGUARDANDO_PRAZO');
    expect(service.classificar(criarOs('2026-10-20'), hoje)).toBe('DENTRO_DO_PRAZO');
    expect(service.classificar(criarOs('2026-10-10'), hoje)).toBe('PROXIMA_DO_VENCIMENTO');
    expect(service.classificar(criarOs('2026-10-06'), hoje)).toBe('VENCIDA');
    expect(service.classificar(criarOs('2026-10-06', 'CONCLUIDA'), hoje)).toBe('CONCLUIDA');
  });

  it('emits one reminder per OS and category each day', () => {
    const solicitacao = criarOs('2026-10-08');
    expect(service.obterLembretes([solicitacao], hoje)).toEqual([solicitacao]);
    expect(service.obterLembretes([solicitacao], hoje)).toEqual([]);
    expect(service.obterLembretes([solicitacao], new Date(2026, 9, 8, 12))).toEqual([solicitacao]);
  });
});