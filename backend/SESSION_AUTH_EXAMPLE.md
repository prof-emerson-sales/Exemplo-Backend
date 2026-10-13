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

## Login com Google (OAuth 2.0)

A tela `/login/sessao` também oferece login com Google. O exemplo usa o `fetch` nativo (Node.js 18+). No Google Cloud Console, crie um cliente OAuth do tipo **Aplicativo da Web**, cadastre `http://localhost:3000/Sessao/google/callback` como URI de redirecionamento autorizado e configure no arquivo `backend/.env`:

```env
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/Sessao/google/callback
FRONTEND_URL=http://localhost:5173/login/sessao
```

O fluxo usa `state` vinculado à sessão para proteger contra CSRF e consulta o perfil no endpoint OpenID Connect do Google. Apenas e-mails verificados são aceitos. No primeiro acesso, a tela pede o CPF e cria a conta com nome e e-mail verificados pelo Google; essa conta recebe perfil comum (não administrador) e uma senha aleatória que não é exibida nem enviada ao navegador. O servidor não guarda tokens do Google. Para produção, configure as URLs HTTPS correspondentes no Google Cloud e no ambiente do servidor; nunca exponha o segredo OAuth no frontend.

### OAuth do Google não é a sessão da aplicação

Este exemplo combina dois mecanismos com papéis diferentes:

1. **OAuth 2.0 / OpenID Connect com Google:** o usuário autoriza o acesso aos escopos `openid email profile`. O backend troca o código temporário recebido no callback por tokens do Google. Ele usa o `access_token` somente para consultar o endpoint `userinfo`, confirmar a identidade e obter os dados do perfil. Como o fluxo pede o escopo `openid`, essa autenticação é feita sobre OAuth 2.0 com a camada de identidade OpenID Connect.
2. **Autenticação da aplicação por sessão:** depois de validar o perfil e encontrar ou criar o usuário local, o backend cria uma sessão própria (`req.session.usuario`). O navegador recebe o cookie `connect.sid`, que contém um identificador opaco da sessão; os dados autenticados ficam no servidor. As chamadas seguintes à API enviam esse cookie, e as rotas `/Sessao/me` e `/Sessao/produtos` verificam a sessão local.

| Credencial | Emitida por | Para que serve neste exemplo | Usada nas chamadas seguintes à API? |
| --- | --- | --- | --- |
| Código OAuth | Google, para o callback | Ser trocado uma vez por tokens | Não |
| `access_token` do Google | Google | Autorizar a consulta do perfil no Google | Não; é descartado após essa etapa |
| Cookie `connect.sid` | Nossa aplicação | Identificar a sessão local guardada pelo backend | Sim, enviado automaticamente pelo navegador |

Portanto, o `access_token` do Google **não é** o token de acesso da API desta aplicação: ele é destinado aos recursos do Google e não é enviado às rotas protegidas locais. Também não é o cookie de sessão. O backend usa a resposta do Google para decidir qual conta local autenticou e, em seguida, emite sua própria sessão.

Isso difere da autenticação JWT já presente no projeto: nela, `/Usuarios/login` emite um JWT próprio da aplicação, e o cliente o envia como `Authorization: Bearer ...` às rotas protegidas. Na autenticação por sessão, o navegador envia o cookie `connect.sid`. São duas formas alternativas de manter a autenticação **na nossa API**; o login Google deste exemplo inicia a sessão por cookie, não substitui essa sessão por um token Google.

## Produção

Defina `SESSION_SECRET` com um segredo longo e aleatório. Em produção, o servidor falha ao iniciar se essa variável estiver ausente e marca o cookie como `Secure`, portanto HTTPS é necessário. O exemplo usa o armazenamento em memória padrão do `express-session`, que serve para desenvolvimento, mas não para produção: sessões são perdidas ao reiniciar e não são compartilhadas entre instâncias. Em produção, substitua-o por um armazenamento persistente, como Redis ou um store compatível com o banco escolhido.