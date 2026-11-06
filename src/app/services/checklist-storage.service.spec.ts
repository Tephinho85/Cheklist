import { TestBed } from '@angular/core/testing';
import { ChecklistStorageService } from './checklist-storage.service';

describe('ChecklistStorageService', () => {
  let service: ChecklistStorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChecklistStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('keeps custom areas and leaves legacy checklists unassigned', () => {
    localStorage.setItem('meus_checklists', JSON.stringify([
      { codigo: '000010', revisao: '01', descricao: 'Checklist antigo', itens: [] },
      { codigo: '000011', revisao: '01', descricao: 'Checklist novo', setor: 'Logística', itens: [] }
    ]));

    const checklists = service.getChecklists();

    expect(checklists[0].setor).toBe('');
    expect(checklists[1].setor).toBe('Logística');
  });
});
