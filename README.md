# OS Oficina

## Sobre o projeto

O OS Oficina nasceu com um objetivo simples: ajudar meu pai na organização da
oficina mecânica dele.

Este é um projeto que estou desenvolvendo junto com ele, acompanhando de perto
a rotina e as necessidades reais do negócio. A ideia é construir, sob demanda,
uma ferramenta que facilite o controle das informações da oficina e contribua
para uma organização mais prática, clara e eficiente.

Mais do que um exercício técnico, este projeto representa uma solução feita a
partir de problemas reais. Cada nova funcionalidade é pensada em conjunto,
considerando o que pode gerar valor para o dia a dia da oficina.

O sistema está em desenvolvimento e será evoluído conforme as necessidades do
negócio forem identificadas.

## Funcionalidades atuais

- Cadastro, consulta e edição de clientes;
- Cadastro, consulta, edição e exclusão protegida de veículos;
- Cadastro, consulta, edição e desativação de funcionários;
- Cadastro, consulta e edição de peças e estoque;
- Abertura de ordens de serviço vinculadas a clientes e veículos;
- Associação opcional de um funcionário responsável à OS;
- Inclusão e remoção de peças e mão de obra nas ordens;
- Preservação do preço histórico das peças utilizadas;
- Baixa e restauração automática do estoque;
- Controle de status, conclusão e cancelamento de ordens;
- Persistência local dos dados em banco SQLite.

## Parte técnica

O OS Oficina é uma aplicação desktop construída com:

- [Electron](https://www.electronjs.org/), para executar a aplicação no desktop;
- [React](https://react.dev/), para construir a interface;
- [Vite](https://vite.dev/), para desenvolvimento e build do frontend;
- [SQLite](https://www.sqlite.org/), acessado por meio do
  [better-sqlite3](https://github.com/WiseLibs/better-sqlite3), para armazenar os
  dados localmente;
- Electron IPC e preload, para conectar a interface ao processo principal com
  isolamento entre as camadas.

O frontend React nunca acessa o SQLite diretamente. As operações seguem o
fluxo `window.api` -> `preload` -> IPC -> processo principal -> SQLite. O
processo principal e o preload usam CommonJS para compatibilidade com o
preload sandboxed do Electron; o renderer React usa ES Modules.

A estrutura principal do projeto é dividida entre:

- `src/main`: processo principal do Electron e regras de negócio;
- `src/preload`: ponte segura entre o frontend e o processo principal;
- `src/renderer`: interface construída com React;
- `src/main/database.js`: configuração e acesso ao banco de dados.

As tabelas principais são `customers`, `employees`, `vehicles`, `parts`,
`service_orders`, `service_order_parts` e `service_order_labor`. O banco é
salvo no diretório de dados do usuário para que os registros sobrevivam a
atualizações e reinstalações do aplicativo.

## Como executar

### Pré-requisitos

- Node.js instalado;
- npm instalado.

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

### Build

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

### Qualidade

```bash
npm run lint
npm run build
```

Para gerar uma pasta executável sem instalador:

```bash
npm run build:unpack
```

## Ferramentas recomendadas

- [VS Code](https://code.visualstudio.com/);
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint);
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode).
