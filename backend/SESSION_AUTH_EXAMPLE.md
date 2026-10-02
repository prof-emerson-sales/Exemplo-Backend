# Exemplo de autenticação por sessão

Este exemplo roda em paralelo à autenticação JWT existente. As rotas JWT não foram alteradas. Para testar a sessão, use `/Sessao/login`, `/Sessao/me`, `/Sessao/produtos` e `/Sessao/logout`.

## Fluxo

1. Envie e-mail e senha para `POST /Sessao/login`. O servidor valida as credenciais e responde com os dados públicos do usuário; o navegador recebe um cookie `HttpOnly` chamado `connect.sid`.
2. Envie `GET /Sessao/me` ou `GET /Sessao/produtos` com as credenciais de cookie. A rota valida a sessão guardada no servidor.
3. Envie `POST /Sessao/logout` para destruir a sessão e remover o cookie.

Com `fetch`, inclua `credentials: "include"` em todas as chamadas:

```js
const login = await fetch("http://localhost:3000/Sessao/login", {
  method: "POST",
  credentials: "include",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ emailUsuario, senhaUsuario }),
});

const produtos = await fetch("http://localhost:3000/Sessao/produtos", {
  credentials: "include",
});
```

Para outro host ou porta do frontend, defina `FRONTEND_ORIGINS` como uma lista de origens separadas por vírgula, por exemplo `http://localhost:5173,http://127.0.0.1:5173`.

## Produção

Defina `SESSION_SECRET` com um segredo longo e aleatório. Em produção, o servidor falha ao iniciar se essa variável estiver ausente e marca o cookie como `Secure`, portanto HTTPS é necessário. O exemplo usa o armazenamento em memória padrão do `express-session`, que serve para desenvolvimento, mas não para produção: sessões são perdidas ao reiniciar e não são compartilhadas entre instâncias. Em produção, substitua-o por um armazenamento persistente, como Redis ou um store compatível com o banco escolhido.