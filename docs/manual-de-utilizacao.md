# Manual do usuário — Checklist Digital

## Para que serve este manual

Este guia explica, em linguagem simples, como entrar no aplicativo, preparar os cadastros, preencher uma inspeção, abrir e acompanhar uma Ordem de Serviço (OS) e consultar os resultados. Ele foi escrito com base nas telas e nos fluxos disponíveis no projeto.

> **Importante:** algumas funções estão em demonstração ou dependem de configuração da empresa. Essas limitações estão destacadas neste manual para evitar que você confie em algo que ainda não está ativo.

## 1. Antes de começar

Você precisa de:

- Um endereço do aplicativo fornecido pela empresa.
- Um usuário e uma senha cadastrados e ativos pelo responsável pelo sistema.
- Acesso à internet e ao serviço da empresa. O aplicativo precisa se comunicar com o servidor para carregar e gravar checklists, inspeções, gestores e OS.

Não há usuário ou senha padrão recomendado neste manual. Se você não recebeu acesso, fale com o responsável pelo sistema. O link **Esqueceu a senha?** aparece na tela, mas a recuperação automática de senha ainda não está configurada.

## 2. Entrar no aplicativo

1. Abra o endereço do aplicativo no navegador indicado pela empresa.
2. Digite seu usuário e sua senha.
3. Selecione **ENTRAR NO SISTEMA**.
4. Após a autenticação, o aplicativo abrirá a tela **Cadastrar Checklist**. Use o menu para ir às outras telas.

O nome de usuário é tratado sem diferença entre letras maiúsculas e minúsculas. Se o acesso falhar, confira se digitou os dados corretamente e verifique se sua conta está ativa. Não compartilhe sua senha.

### O que aparece no menu

- **Responder Checklist:** realizar uma inspeção.
- **Cadastrar Checklist:** criar, consultar, alterar, imprimir ou clonar fichas.
- **Gerenciar Usuários:** tela de demonstração; não use para criar contas reais (veja a seção 9).
- **Gestores por Área:** cadastrar os contatos responsáveis por áreas.
- **Solicitações de OS:** acompanhar correções solicitadas.
- **Dashboard de Checklists:** consultar metas e inspeções.

Os acessos disponíveis podem depender das permissões da sua conta. Se uma tela ou ação não funcionar por falta de acesso, peça ao responsável pelo sistema para verificar suas permissões.

## 3. Entenda os cadastros

Antes de usar a inspeção e as OS, é importante entender que existem dois cadastros diferentes:

- **Checklist:** a ficha com perguntas, área, revisão e meta mensal.
- **Gestor por Área:** o contato da área que poderá ser associado a uma OS.

O gestor por área não é necessariamente o usuário que entra no aplicativo. Para que uma OS possa ser associada automaticamente, a área da ficha deve corresponder à área de um gestor ativo.

## 4. Cadastrar um gestor por área

Faça este cadastro antes de abrir uma OS para uma área nova:

1. Abra **Gestores por Área** no menu.
2. Escolha **Adicionar**.
3. Preencha o nome, a área, o e-mail e o WhatsApp com DDD.
4. Deixe **Cadastro ativo** ligado se o gestor deve aparecer para seleção.
5. Salve o cadastro.

Use o mesmo nome de área no gestor e no checklist. Um gestor inativo não poderá ser selecionado para uma nova OS. A tela permite editar e excluir gestores; excluir o contato não apaga as solicitações de OS já registradas.

## 5. Criar ou alterar um checklist

### Criar

1. Abra **Cadastrar Checklist**.
2. Preencha o código, a descrição, a revisão e a área responsável.
3. Informe a **Meta mensal de inspeções**. Se não houver meta definida, use `0`.
4. Selecione **Adicionar Linha** para cada pergunta ou título.
5. Para cada linha, informe o identificador do item (por exemplo, `1` ou `1.1`) e a descrição.
6. Escolha o tipo de resposta:
   - **Apenas Título de Seção:** exibe um título sem campo de resposta.
   - **Combobox** ou **Radiobox:** apresenta opções para escolher. Escreva as opções separadas por vírgula, por exemplo: `Conforme,Não Conforme,Não se Aplica`.
   - **Número:** permite digitar uma medição numérica.
   - **Texto Livre:** permite escrever uma resposta.
7. Marque **Resposta Obrigatória?** para exigir o preenchimento daquele item na inspeção.
8. Selecione **SALVAR NOVO CHECKLIST**.

O código deve identificar a ficha corretamente. A revisão ajuda a reconhecer a versão das perguntas.

### Pesquisar e editar

1. Na tela de cadastro, escolha **Pesquisar**.
2. Procure pelo código, descrição ou área e selecione o checklist encontrado.
3. Faça as alterações necessárias.
4. Salve para atualizar o cadastro.

Use **Novo** para limpar o formulário e começar outra ficha. Os controles da tela também permitem imprimir, clonar ou excluir um checklist. Antes de excluir, confirme com o responsável da sua área se a ficha não será mais utilizada.

## 6. Preencher e finalizar uma inspeção

1. Abra **Responder Checklist** no menu.
2. Abra a lista de fichas, pesquise pelo código ou descrição e selecione a ficha correta.
3. Preencha os campos de identificação e as respostas apresentadas.
4. Responda todos os itens marcados como obrigatórios. O indicador de progresso ajuda a ver o que falta.
5. Para uma resposta **Não Conforme** ou **NC**, registre a observação solicitada. Descreva o que foi encontrado de forma clara.
6. Se for necessária uma correção, selecione **Solicitar Ordem de Serviço** no item não conforme e siga a seção 7.
7. Revise as respostas e escolha **GRAVAR E FINALIZAR INSPEÇÃO**.

Se houver campos obrigatórios sem resposta ou uma observação pendente, o aplicativo avisará e não finalizará a inspeção até que sejam preenchidos.

### Ações úteis na tela de resposta

- **Limpar Ficha:** apaga as respostas ainda não finalizadas no formulário atual. Confira antes de usar.
- **Histórico:** permite consultar uma inspeção anterior e carregar respostas anteriores no formulário atual. Revise os dados carregados antes de finalizar; eles podem não representar a situação atual.
- **Imprimir:** abre a impressão da ficha em PDF. Na janela de impressão do navegador, escolha uma impressora ou **Salvar como PDF**.
- **Editar, clonar ou excluir:** alteram a ficha do checklist, não a inspeção já finalizada. Use com cuidado.

## 7. Abrir uma Ordem de Serviço

Uma OS registra uma irregularidade que precisa de correção. Ela pode ser iniciada em um item respondido como **Não Conforme** ou **NC**:

1. No item não conforme, selecione **Solicitar Ordem de Serviço**.
2. Confira a área indicada.
3. Escolha um gestor ativo daquela área.
4. Descreva a irregularidade: o que está errado e onde foi encontrado.
5. Escreva a correção solicitada com o máximo de clareza.
6. Revise as informações e confirme a solicitação.
7. Volte à inspeção e finalize-a com **GRAVAR E FINALIZAR INSPEÇÃO**.

Se não houver gestor para selecionar, peça que um responsável cadastre ou ative o contato em **Gestores por Área**. A solicitação e a inspeção são registros distintos: abrir a OS não substitui finalizar a inspeção.

## 8. Acompanhar uma OS

1. Abra **Solicitações de OS**.
2. Localize a solicitação pelo número, pela ficha ou pela área.
3. Observe o status e a situação do prazo.
4. Escolha **Acompanhar** na OS que deseja atualizar.
5. Informe ou ajuste o prazo de correção.
6. Atualize o status conforme o andamento: pendente, em andamento ou concluída.
7. Registre uma observação útil e salve.
8. Se necessário, anexe uma foto de **antes** e/ou de **depois** da correção.
9. Ao concluir o serviço, altere o status para **Concluída** e salve.

O sistema registra eventos de acompanhamento com data e usuário. A classificação de prazo é diferente do status:

| Situação do prazo | O que significa |
| --- | --- |
| Aguardando prazo | Ainda não foi informado um prazo de correção. |
| Dentro do prazo | O vencimento está a mais de três dias. |
| Próxima do vencimento | Faltam até três dias, incluindo o dia do vencimento. |
| Vencida | O prazo passou e a OS não foi concluída. |
| Concluída | A OS foi marcada como concluída. |

### Fotos e notificações

As fotos ficam guardadas no navegador/dispositivo onde foram adicionadas. Nesta versão, elas não são enviadas ao servidor e podem não aparecer em outro computador ou celular. Não apague os dados do navegador se precisar conservar essas evidências.

O envio de e-mail e WhatsApp depende de configuração da empresa. No ambiente atualmente configurado no projeto, esse envio não está ativo; uma notificação pendente não significa que uma mensagem chegou ao gestor. Para confirmar o recebimento, use o canal de comunicação combinado com sua empresa.

O aplicativo pode apresentar lembretes de prazo enquanto está aberto. Eles não são executados com o aplicativo fechado.

## 9. Dashboard e gerenciamento de usuários

### Consultar o dashboard

1. Abra **Dashboard de Checklists**.
2. Escolha o mês no campo **Período** ou use as setas para mudar o mês.
3. Confira as inspeções previstas, realizadas, o percentual de cumprimento e as pendências.
4. Consulte os resultados por checklist e por responsável.
5. Use a série histórica para comparar os últimos meses.

O dashboard contabiliza inspeções finalizadas. Fichas com meta `0` aparecem separadamente e não entram no cálculo de cumprimento. A meta atualmente cadastrada é usada também para a série histórica.

### Gerenciar Usuários — limitação importante

A tela **Gerenciar Usuários** ainda é apenas uma demonstração. As alterações feitas nela não criam nem alteram contas reais, não mudam as permissões de acesso e podem desaparecer ao recarregar a página. Para criar, ativar, desativar ou corrigir um usuário real, procure o administrador do sistema.

## 10. Onde os dados ficam

- Checklists, inspeções, gestores e solicitações de OS são enviados à API e gravados no banco de dados configurado para a empresa.
- As evidências fotográficas são armazenadas localmente no navegador/dispositivo e não são sincronizadas pelo fluxo atual.
- O acesso a esses dados depende de uma conexão disponível com o servidor.

Se o navegador for limpo, reinstalado ou usado em outro dispositivo, as fotos locais podem desaparecer ou não estar disponíveis. Se uma operação falhar, não repita várias vezes sem conferir se o registro foi criado; isso evita solicitações duplicadas.

## 11. Problemas comuns

| O que aconteceu | O que fazer |
| --- | --- |
| Não consigo entrar | Confira usuário e senha, conexão com a internet e se a conta está ativa. Se esqueceu a senha, solicite ajuda ao administrador; a recuperação automática ainda não está ativa. |
| A tela fica carregando ou vazia | Verifique a conexão e tente atualizar a página uma vez. Se continuar, anote a tela e a mensagem exibida e avise o suporte. |
| Não aparece um checklist | Confirme o código/área e peça ao administrador para verificar se sua conta tem acesso e se a ficha está cadastrada. |
| Não consigo abrir uma OS | Confirme que a resposta é não conforme, que o checklist tem área preenchida e que há gestor ativo para essa área. |
| A OS não envia mensagem ao gestor | O envio de e-mail/WhatsApp depende de configuração e não está ativo neste ambiente. Avise o gestor pelo canal oficial da empresa. |
| Uma foto não aparece em outro aparelho | As fotos são locais ao navegador/dispositivo e não são sincronizadas nesta versão. |
| Uma ação diz que não tenho permissão | Peça ao administrador para revisar as permissões da sua conta. |

Ao pedir ajuda, informe o que estava tentando fazer, a tela, o horário aproximado e a mensagem de erro. Nunca envie sua senha, token ou conteúdo de arquivos de configuração.

## 12. Boas práticas

- Confira a área, o código e a revisão antes de iniciar uma inspeção.
- Descreva irregularidades e correções de forma objetiva.
- Finalize a inspeção depois de abrir as OS necessárias.
- Atualize o prazo e o status da OS conforme o andamento real.
- Não compartilhe suas credenciais.
- Não considere uma notificação enviada sem confirmação no status ou no canal oficial.
- Em caso de dúvida sobre uma operação que possa apagar dados, consulte o responsável antes de continuar.
