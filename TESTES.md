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

## Noções básicas: Jest e asserções

Jest é o programa que encontra e executa os testes. Em `test("descrição", () =>
{ ... })`, a descrição conta o comportamento esperado e a função contém os
passos do teste. `describe("grupo", () => { ... })` apenas organiza testes
relacionados. Um teste costuma preparar os dados, executar uma ação e verificar
o resultado.

Uma **asserção** é uma afirmação que o teste verifica. `expect(valor)` escolhe
qual valor será examinado; o método encadeado, chamado *matcher*, diz qual
condição esse valor precisa satisfazer. Se a condição não for verdadeira, Jest
marca o teste como falho e mostra a diferença.

Por exemplo, no primeiro teste do frontend:

```js
expect(await screen.findByRole("button", { name: "Entrar" })).toBeTruthy();
```

- `render(<LoginSessao />)` monta o componente para o teste. A biblioteca
  Testing Library cria uma página simulada usando `jsdom`.
- `screen` é a interface da Testing Library para consultar os elementos dessa
  página. É semelhante a procurar um controle que uma pessoa encontraria na
  tela.
- `findByRole` procura um elemento pela função que ele tem para acessibilidade.
  Aqui, `"button"` pede um botão. O segundo argumento, `{ name: "Entrar" }`,
  filtra pelo nome acessível do botão — neste caso, o texto visível "Entrar".
- Para encontrar esses argumentos, leia o JSX renderizado pelo componente.
  Nele, a ação de login é um `<button>` cujo texto é "Entrar". Os rótulos
  `<label>` dos campos, por exemplo, tornam "E-mail" e "Senha" seus nomes
  acessíveis. Consultar por papel e nome reflete como a página é apresentada e
  ajuda a testar também sua acessibilidade; evite inventar seletores que não
  correspondam ao HTML.
- `findByRole` é assíncrono: ele continua procurando por um curto período porque
  o componente primeiro verifica a sessão no servidor. `await` aguarda a busca
  terminar. Se o elemento não aparecer, a busca falha e Jest informa isso.
- `toBeTruthy()` verifica que o resultado encontrado é um valor verdadeiro
  (neste caso, o elemento existe). Outras consultas comuns são `getByRole`, que
  espera encontrar o elemento imediatamente, e `queryByRole`, útil quando se
  quer verificar que algo não existe. As variantes `findBy...` são apropriadas
  quando o elemento pode aparecer depois de uma operação assíncrona.

Outros matchers usados nas suítes:

- `.toBe(401)` compara valores simples, como o status HTTP.
- `.toContain("texto")` verifica se uma string contém um trecho.
- `.toEqual(objeto)` compara o conteúdo de objetos ou arrays. Já `.toBe(...)`
  compara valores simples por igualdade estrita.
- `.toBeTruthy()` verifica se o valor é verdadeiro; para testar ausência, por
  exemplo, pode-se usar `.toBeNull()`.
- `.toHaveBeenCalledWith(...)` verifica se uma função simulada recebeu aqueles
  argumentos em alguma chamada. `.toHaveBeenNthCalledWith(3, ...)` verifica os
  argumentos da terceira chamada; a contagem começa em 1. Isso permite confirmar
  que `fetch` foi chamado com a URL, o método e os dados esperados.
- `.not` inverte o matcher seguinte: `.not.toHaveBeenCalled()` verifica que a
  função não foi chamada.
- `expect.objectContaining({...})` compara apenas os campos indicados, mesmo que
  o objeto real tenha outras propriedades.

## Frontend

`Exemplo-Frontend/test/LoginSessao.test.jsx` renderiza o componente em um DOM
simulado (`jsdom`) e substitui `fetch` por respostas controladas. Assim, os
exemplos testam o que a pessoa vê e as requisições que a interface envia sem
depender de um servidor em execução.

`fireEvent` simula ações da pessoa, como digitar (`change`) e clicar (`click`).
`waitFor` repete uma verificação até ela passar ou atingir o tempo limite; é
usado quando a resposta da interface depende de uma ação assíncrona.

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
