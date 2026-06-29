# testeTecnico

App em React Native/Expo para responder uma pergunta simples: **qual é o melhor horário de hoje para fazer uma atividade ao ar livre?**

O usuário escolhe uma cidade e uma atividade. A partir da previsão hora a hora da Open-Meteo, o app calcula uma janela recomendada e mostra por que aquele horário faz sentido.

## Rodando o projeto

```bash
npm install
npm start
```

Para validar:

```bash
npm run lint
npm run typecheck
npm test
```

## Stack

- Expo SDK 51
- React Native 0.74
- TypeScript
- React Navigation
- TanStack Query
- Zustand
- styled-components
- Jest

## Como está organizado

```text
src/
  domain/          regras da recomendação, entidades e casos de uso
  data/            chamada da Open-Meteo, DTOs, mappers e repositories
  infrastructure/  fetch e AsyncStorage
  presentation/    telas, componentes, hooks, navegação e tema
  di/              montagem das dependências
  shared/          configuração e erros comuns
```

A separação é proposital, mas sem tentar criar framework próprio. A regra de recomendação fica isolada porque é a parte mais importante do teste e precisa ser fácil de testar. A UI conversa com use cases por hooks usando React Query.

## Dados usados

Forecast:

- temperatura
- sensação térmica
- chance de chuva
- vento
- UV
- umidade
- se é dia ou noite

Geocoding:

- nome da cidade
- país/região
- latitude/longitude
- timezone

As APIs são públicas da Open-Meteo e não precisam de chave.

## Recomendação

Cada horário recebe uma nota de 0 a 100 indicando o quanto ele combina com a atividade escolhida. Essa porcentagem é calculada pelo app, não vem da API.

Entram no cálculo:

- faixa de temperatura confortável para a atividade
- tolerância a chuva
- tolerância a vento
- tolerância a UV
- umidade
- horário do dia

Os perfis mudam o peso desses fatores. Corrida, praia e piquenique não têm o mesmo comportamento, porque na prática não deveriam ter.

A melhor janela é a sequência contínua de horários bons. Em empate, vence a sequência com média melhor.

O código principal está em:

```text
src/domain/services/RecommendationService.ts
```

## Decisões de produto

- Não mostrar só clima bruto. O app precisa ajudar a decidir.
- Permitir personalizar perfis, porque “atividade ao ar livre” é muito genérico.
- Não recomendar madrugada/noite para atividades comuns.
- Mostrar uma explicação curta da recomendação, não só uma porcentagem.
- Deixar busca, loading, erro e vazio explícitos na interface.

## Testes

A suíte cobre principalmente:

- regra de recomendação
- perfis com comportamentos diferentes
- umidade e horário do dia
- casos sem janela recomendada
- mapeamento da API para o domínio
- repositories e use cases
- validações de atividade
