# Testes automatizados com Jest

Os testes estão separados por projeto e podem ser executados sem uma instância do
banco de dados.

## Executar

```powershell
cd Exemplo-Frontend
npm install
npm test

cd ..\backend
npm install
npm test
```

Os scripts usam `--runInBand` para executar os testes em sequência e deixar a
saída mais previsível durante a demonstração.

## Frontend

`Exemplo-Frontend/test/LoginSessao.test.jsx` renderiza o componente em um DOM
simulado (`jsdom`) e substitui `fetch` por respostas controladas. Assim, os
exemplos testam o que a pessoa vê e as requisições que a interface envia sem
depender de um servidor em execução.

Os casos cobrem a tela sem sessão, login com sucesso ou falha, acesso a uma rota
protegida, logout e cadastro iniciado pelo Google. Cada teste segue a sequência
de preparar as respostas, interagir com a interface e verificar o resultado.

## Backend

`backend/__tests__/auth.test.js` testa as funções de autenticação diretamente:
assinatura e validade do token, expiração, middleware e acesso administrativo.
São exemplos de testes unitários, nos quais a unidade é chamada sem iniciar o
servidor.

`backend/__tests__/sessao.test.js` envia requisições HTTP ao Express usando
Supertest. O Prisma é substituído por mocks, então os testes percorrem as rotas
de sessão sem acessar MariaDB. O agente de requisições do Supertest guarda o
cookie entre chamadas, permitindo demonstrar login, sessão autenticada e logout.
