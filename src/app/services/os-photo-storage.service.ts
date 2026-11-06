import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class OsPhotoStorageService {
  private readonly databaseName = 'app-checklist-os';
  private readonly storeName = 'fotos';

  async salvar(id: string, arquivo: File): Promise<void> {
    const blob = await this.comprimir(arquivo);
    const database = await this.abrirBanco();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(this.storeName, 'readwrite');
      transaction.objectStore(this.storeName).put(blob, id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    database.close();
  }

  async obter(id: string): Promise<Blob | null> {
    const database = await this.abrirBanco();
    const blob = await new Promise<Blob | null>((resolve, reject) => {
      const request = database.transaction(this.storeName, 'readonly').objectStore(this.storeName).get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    database.close();
    return blob;
  }

  private abrirBanco(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.databaseName, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(this.storeName);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async comprimir(arquivo: File): Promise<Blob> {
    if (!arquivo.type.startsWith('image/')) {
      throw new Error('Selecione um arquivo de imagem.');
    }

    try {
      const imagem = await createImageBitmap(arquivo);
      const escala = Math.min(1, 1600 / Math.max(imagem.width, imagem.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(imagem.width * escala);
      canvas.height = Math.round(imagem.height * escala);
      const contexto = canvas.getContext('2d');
      if (!contexto) return arquivo;
      contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);
      imagem.close();
      return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Não foi possível processar a imagem.')), 'image/jpeg', 0.78);
      });
    } catch {
      return arquivo;
    }
  }
}