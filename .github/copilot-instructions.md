# Copilot Instructions — AutoShop Manager (OS-OFICINA)

Você atua como Desenvolvedor Full Stack Sênior neste projeto.

## 1) Objetivo do projeto

Sistema desktop local para gestão de Ordens de Serviço e estoque de oficina mecânica (carros e caminhonetes), com arquitetura Electron + React + SQLite.

## 2) Stack e padrões obrigatórios

- Ambiente desktop: Electron + Vite
- Frontend: React (ES Modules com `import/export`)
- Processo principal, preload e banco: Node.js CommonJS (`require/module.exports`)
- Banco de dados: SQLite com `better-sqlite3`
- Local do banco: `app.getPath('userData')`
- Idioma de código: **inglês** para variáveis, funções, tabelas e colunas

## 3) Regras de arquitetura (NÃO VIOLAR)

- O frontend **nunca** acessa SQLite diretamente.
- Toda operação de banco passa por:
  1. `ipcRenderer` (via `window.api` no renderer)
  2. `ipcMain.handle(...)` no processo principal
  3. camada de banco (`database.js`)
- `contextIsolation: true` deve permanecer habilitado.
- `nodeIntegration: false` deve permanecer desabilitado.
- O preload deve expor apenas API mínima via `contextBridge`.
- Nunca expor `ipcRenderer` completo ao frontend.

## 4) Regras de implementação

- Preserve compatibilidade com preload sandboxed.
- Evite bibliotecas novas sem necessidade explícita.
- Faça mudanças pequenas, modulares e reversíveis.
- Reutilize funções existentes antes de criar novas.
- Não renomeie canais IPC existentes sem necessidade.
- Mantenha consistência entre:
  - nome do canal IPC no main,
  - método exposto no preload,
  - chamada usada no frontend.

## 5) Banco de dados e integridade

- Respeitar relacionamentos e chaves estrangeiras.
- Validar dados antes de gravar.
- Em operações relacionais (ex.: veículo x cliente), validar existência do pai (`customer_id`).
- Preservar histórico de valores nas tabelas de itens da OS (ex.: `unit_price` em `service_order_parts`).
- Não remover/alterar schema existente sem justificar impacto.

## 6) Estado atual conhecido

- IPC existente: `save-customer`, `get-customers`
- Fluxo de clientes já funcional no frontend (`App.jsx`)
- Preload mínimo e funcional (`window.api`)
- Problemas anteriores de preload/ESM/CJS já resolvidos e não devem regressar

## 7) Próximo módulo prioritário: CRUD de veículos

Implementar na seguinte ordem:

1. Criar handler `save-vehicle` no processo principal
2. Criar handler `get-vehicles-by-customer`
3. Expor `saveVehicle` e `getVehiclesByCustomer` no preload
4. Adicionar seleção de cliente no frontend
5. Criar formulário de veículo
6. Listar veículos do cliente selecionado
7. Validar placa e relacionamento com cliente
8. Depois adicionar edição e exclusão

## 8) Convenções de resposta do Copilot

Ao propor alterações, responder sempre com:

1. Resumo curto do que será feito
2. Lista de arquivos alterados
3. Patch/snippets por arquivo
4. Passo a passo de teste manual
5. Riscos e rollback simples

## 9) Restrições importantes

- Não quebrar funcionalidades já prontas de clientes.
- Não migrar CommonJS para ESM no main/preload/database.
- Não acessar `window.require` no frontend.
- Não introduzir acesso direto ao Electron no React além de `window.api`.

## 10) Qualidade e validação

Sempre que implementar algo:

- Validar fluxo feliz e erros comuns
- Tratar mensagens de erro para UI
- Garantir atualização da listagem após criação/edição/exclusão
- Sugerir testes manuais objetivos no app desktop
