import { Injectable } from '@angular/core';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { Checklist, ItemChecklist } from '../models/checklist.model';

const pdfMakeInstance: any = (pdfMake as any).default || pdfMake;
const pdfFontsInstance: any = (pdfFonts as any).default || pdfFonts;

if (pdfFontsInstance && pdfFontsInstance.pdfMake) {
  pdfMakeInstance.vfs = pdfFontsInstance.pdfMake.vfs;
} else if (pdfFontsInstance) {
  pdfMakeInstance.vfs = pdfFontsInstance.vfs;
}

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  gerarChecklistPdf(checklistData: Checklist, respostasData: any = {}) {
    if (!checklistData) {
      console.error('Checklist está nulo ou indefinido.');
      return;
    }

    const resp = respostasData || {};

    try {
      const docDefinition: any = {
        pageSize: 'A4',
        pageMargins: [20, 20, 20, 20],
        content: [
          {
            table: {
              widths: ['*', 80],
              body: [
                [
                  { text: `CHECK LIST DE SEGURANÇA: ${checklistData.descricao || 'DESOSSA'}`, style: 'headerTitle', alignment: 'center' },
                  { text: `Nº: ${checklistData.codigo || ''}\nRevisão: ${checklistData.revisao || '01'}`, style: 'subText', alignment: 'right' }
                ]
              ]
            },
            layout: 'box'
          },
          { text: '\n' },
          {
            table: {
              widths: ['*', 120, '*'],
              body: [
                [
                  { text: `RESPONSÁVEL PREENCHIMENTO SESMT: ${resp.respSesmt || ''}`, style: 'infoField' },
                  { text: `MAT.: ${resp.matSesmt || ''}`, style: 'infoField' },
                  { text: `DATA DO PREENCHIMENTO: ${resp.data || new Date().toLocaleDateString('pt-BR')}`, style: 'infoField' }
                ],
                [
                  { text: `SETOR: ${resp.setor || ''}`, style: 'infoField' },
                  { text: `RESPONSÁVEL PELO SETOR: ${resp.respSetor || ''}`, style: 'infoField', colSpan: 2 },
                  {}
                ]
              ]
            },
            layout: 'box'
          },
          { text: '\n' },
          ...this.construirTabelasItens(checklistData.itens, resp.respostas || {}),
          { text: '9. OUTRAS OBSERVAÇÕES IMPORTANTES DA RONDA', style: 'sectionHeader' },
          {
            table: {
              widths: ['*'],
              body: [[{ text: resp.observacoesRonda || '\n\n\n' }]]
            }
          },
          { text: '\n' },
          { text: '10. TEVE ALGUMA O.S. ABERTA? SE SIM, INFORMAR O ITEM E O NÚMERO DA OS ABAIXO.', style: 'sectionHeader' },
          {
            table: {
              widths: ['*'],
              body: [[{ text: resp.ordensServico || '\n\n\n' }]]
            }
          },
          { text: '\n\n' },
          {
            table: {
              widths: ['*', '*'],
              body: [
                [
                  { text: `RESPONSÁVEL PELO PREENCHIMENTO: ${resp.respSesmt || ''}\nMAT.: ${resp.matSesmt || ''}`, style: 'infoField' },
                  { text: `RESPONSÁVEL PELO SETOR: ${resp.respSetor || ''}\nMAT.: ${resp.matSetor || ''}`, style: 'infoField' }
                ]
              ]
            },
            layout: 'box'
          }
        ],
        styles: {
          headerTitle: { fontSize: 11, bold: true },
          subText: { fontSize: 8 },
          infoField: { fontSize: 8, bold: true },
          sectionHeader: { fontSize: 9, bold: true, margin: [0, 4, 0, 2] },
          tableHeader: { fontSize: 8, bold: true, alignment: 'center', fillColor: '#f0f0f0' },
          tableBody: { fontSize: 8 }
        }
      };

      pdfMakeInstance.createPdf(docDefinition).open();
    } catch (error) {
      console.error('Erro ao gerar o PDF:', error);
    }
  }

  private construirTabelasItens(itens: ItemChecklist[], respostas: any = {}): any[] {
    const conteudo: any[] = [];
    if (!itens || itens.length === 0) return conteudo;

    let seccaoAtualTitle = '';
    let itensDaSeccao: ItemChecklist[] = [];

    itens.forEach((item) => {
      if (!item.tipoResposta) {
        if (itensDaSeccao.length > 0) {
          conteudo.push(this.gerarTabelaGrupo(seccaoAtualTitle, itensDaSeccao, respostas));
          itensDaSeccao = [];
        }
        seccaoAtualTitle = `${item.item} - ${item.descricao}`;
      } else {
        itensDaSeccao.push(item);
      }
    });

    if (itensDaSeccao.length > 0) {
      conteudo.push(this.gerarTabelaGrupo(seccaoAtualTitle, itensDaSeccao, respostas));
    }

    return conteudo;
  }

  private gerarTabelaGrupo(tituloGrupo: string, itens: ItemChecklist[], respostas: any): any {
    const cell = (text: string, alignment = 'left', style = 'tableBody', colSpan = 1) => ({
      text,
      style,
      alignment,
      colSpan,
      verticalAlignment: 'middle'
    });

    const body: any[] = [];

    if (tituloGrupo) {
      body.push([
        {
          text: tituloGrupo,
          style: 'sectionHeader',
          colSpan: 6,
          fillColor: '#e0e0e0',
          alignment: 'left',
          verticalAlignment: 'middle'
        },
        {}, {}, {}, {}, {}
      ]);
    }

    body.push([
      cell('Item', 'center', 'tableHeader'),
      cell('Verificação', 'left', 'tableHeader'),
      cell('OK', 'center', 'tableHeader'),
      cell('NC', 'center', 'tableHeader'),
      cell('NA', 'center', 'tableHeader'),
      cell('Observação', 'left', 'tableHeader')
    ]);

    itens.forEach((item) => {
      const resp = respostas[item.item] || {};
      const valor = resp.valor || '';
      const valorNormalizado = String(valor).trim().toLocaleUpperCase('pt-BR');

      body.push([
        cell(item.item, 'center'),
        cell(item.descricao, 'left'),
        cell(valorNormalizado === 'OK' || valorNormalizado === 'CONFORME' ? 'X' : '', 'center'),
        cell(valorNormalizado === 'NC' || valorNormalizado === 'NÃO CONFORME' ? 'X' : '', 'center'),
        cell(['NA', 'N/A', 'NÃO SE APLICA'].includes(valorNormalizado) ? 'X' : '', 'center'),
        cell(resp.observacao || '', 'left')
      ]);
    });

    return {
      table: {
        headerRows: tituloGrupo ? 2 : 1,
        widths: [25, 160, 18, 18, 18, '*'],
        body: body
      },
      margin: [0, 0, 0, 6]
    };
  }
}