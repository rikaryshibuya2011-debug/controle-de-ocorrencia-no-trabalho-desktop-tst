# Controle de Ocorrência no Trabalho (Desktop TST)

Aplicação Electron/Vite/React para registro e investigação de acidentes e incidentes de SST: ficha de investigação com 5 Porquês, planos de ação 5W2H, indicadores (TF/TG/Pirâmide de Bird), relatórios PDF/Excel e apresentação executiva.

## Requisitos

- Node.js 20+

## Comandos

```bash
npm install        # dependências
npm run dev        # desenvolvimento (web + servidor local)
npm run build      # build de produção em dist/
```

O `GEMINI_API_KEY` é lido de variável de ambiente (`.env.local`) — ver `.env.example`. Sem a chave, o sistema usa a análise manual.

## Modo desktop

`electron-main.cjs` sobe o servidor (`dist/server.cjs`) e abre a janela carregando `dist/index.html`.

## Dados

Persistência local em `data/sst_database.json` (ignorada pelo git — não versionar dados de ocorrências).
