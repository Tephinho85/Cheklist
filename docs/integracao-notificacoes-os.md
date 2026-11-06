# Integração de notificações de OS

O aplicativo é cliente Ionic e não envia e-mail nem WhatsApp diretamente. Configure `osNotificationEndpoint` nos arquivos `src/environments/environment.ts` e `src/environments/environment.prod.ts` com a URL HTTPS do backend responsável pelo envio.

Ao criar uma solicitação ou tentar novamente, o app envia um `POST` JSON para essa URL:

```json
{
  "channels": ["email", "whatsapp"],
  "solicitacao": {
    "id": "os-...",
    "codigoChecklist": "000001",
    "item": "1.1",
    "gestorEmail": "gestor@example.com",
    "gestorWhatsapp": "+5511999999999"
  }
}
```

O backend deve validar a solicitação, enviar pelos dois canais usando credenciais mantidas somente no servidor e responder com HTTP `2xx` quando ambos os envios forem aceitos. Respostas não `2xx` ficam registradas como falha e podem ser reenviadas na tela de solicitações. Sem endpoint configurado, a OS permanece salva localmente com notificação pendente.

## Prazos e evidências

O prazo é informado no acompanhamento da OS e fica associado ao usuário logado que o registrou. O app classifica prazos próximos considerando os três dias anteriores ao vencimento e verifica lembretes ao abrir a tela de OS e a cada hora enquanto o app está aberto. Alertas locais não são executados com o app fechado; notificações em segundo plano exigem um serviço agendador no backend.

Fotos antes/depois são comprimidas e armazenadas no IndexedDB do dispositivo. Elas não são compartilhadas entre dispositivos nem enviadas ao backend por esta integração.