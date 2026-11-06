import { TestBed } from '@angular/core/testing';
import { GestorArea, SolicitacaoOs } from '../models/checklist.model';
import { GestorOsStorageService } from './gestor-os-storage.service';

describe('GestorOsStorageService', () => {
  let service: GestorOsStorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(GestorOsStorageService);
  });

  it('persists managers and OS requests with their statuses', () => {
    const gestor: GestorArea = {
      id: 'gestor-1',
      nome: 'Ana Souza',
      area: 'Produção',
      email: 'ana@example.com',
      whatsapp: '+55 11 99999-9999',
      ativo: true
    };
    const solicitacao: SolicitacaoOs = {
      id: 'os-1',
      numero: 'OS-2026-00001',
      inspecaoId: 'inspecao-1',
      codigoChecklist: '000001',
      descricaoChecklist: 'Checklist de segurança',
      revisaoChecklist: '01',
      item: '1.1',
      pergunta: 'Equipamento limpo?',
      resposta: 'Não Conforme',
      irregularidade: 'Acúmulo de sujeira',
      correcaoSolicitada: 'Realizar limpeza',
      area: 'SESMT',
      gestorId: gestor.id,
      gestorNome: gestor.nome,
      gestorEmail: gestor.email,
      gestorWhatsapp: gestor.whatsapp,
      solicitante: 'Carlos TST',
      abertaEm: new Date().toISOString(),
      criadaEm: new Date().toISOString(),
      prazoCorrecao: null,
      informadoPor: null,
      dataConclusao: null,
      status: 'PENDENTE',
      notificacaoStatus: 'PENDENTE',
      historico: [],
      observacoes: '',
      fotoAntesId: null,
      fotoDepoisId: null
    };

    service.saveGestores([gestor]);
    service.saveSolicitacao(solicitacao);
    service.atualizarStatus(solicitacao.id, 'EM_ANDAMENTO');
    service.atualizarStatusNotificacao(solicitacao.id, 'ENVIADA');

    expect(service.getGestores()).toEqual([gestor]);
    expect(service.getSolicitacoes()[0]).toEqual({
      ...solicitacao,
      status: 'EM_ANDAMENTO',
      notificacaoStatus: 'ENVIADA'
    });
  });
});