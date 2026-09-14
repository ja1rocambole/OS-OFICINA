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

- Cadastro de clientes;
- Consulta dos clientes cadastrados;
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

A estrutura principal do projeto é dividida entre:

- `src/main`: processo principal do Electron e regras de negócio;
- `src/preload`: ponte segura entre o frontend e o processo principal;
- `src/renderer`: interface construída com React;
- `src/main/database.js`: configuração e acesso ao banco de dados.

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

## Ferramentas recomendadas

- [VS Code](https://code.visualstudio.com/);
- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint);
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode).
