jest.mock("../prisma/client", () => ({
  usuarios: {
    findUnique: jest.fn(),
  },
  produtos: {
    findMany: jest.fn(),
  },
}));

const request = require("supertest");
const app = require("../app");
const prisma = require("../prisma/client");

const usuario = {
  cpf: "12345678901",
  emailUsuario: "ana@example.com",
  nomeUsuario: "Ana Silva",
  senhaUsuario: "senha-de-exemplo",
  admin: false,
};

describe("API de sessão", () => {
  beforeEach(() => {
    prisma.usuarios.findUnique.mockReset();
    prisma.produtos.findMany.mockReset();
  });

  test("recusa a consulta de sessão quando a pessoa não fez login", async () => {
    const resposta = await request(app).get("/Sessao/me");

    // Confirma que a API exige autenticação para consultar uma sessão.
    expect(resposta.status).toBe(401);
    // Confirma que a resposta explica que não existe uma sessão autenticada.
    expect(resposta.body.error).toBe("Sessão não autenticada ou expirada.");
  });

  test("valida os campos obrigatórios antes de consultar o banco", async () => {
    const resposta = await request(app)
      .post("/Sessao/login")
      .send({ emailUsuario: usuario.emailUsuario });

    // Confirma que a API rejeita o login quando falta um campo obrigatório.
    expect(resposta.status).toBe(400);
    // Confirma que a resposta informa quais dados precisam ser enviados.
    expect(resposta.body.error).toBe("E-mail e senha são obrigatórios.");
    // Confirma que dados incompletos são rejeitados antes de consultar o banco.
    expect(prisma.usuarios.findUnique).not.toHaveBeenCalled();
  });

  test("rejeita uma senha incorreta", async () => {
    prisma.usuarios.findUnique.mockResolvedValue(usuario);

    const resposta = await request(app)
      .post("/Sessao/login")
      .send({ emailUsuario: usuario.emailUsuario, senhaUsuario: "senha-errada" });

    // Confirma que uma senha incorreta produz uma resposta de não autorizado.
    expect(resposta.status).toBe(401);
    // Confirma que a API retorna a mensagem de erro de credenciais.
    expect(resposta.body.error).toBe("Credenciais inválidas.");
  });

  test("mantém o login entre requisições e encerra a sessão no logout", async () => {
    prisma.usuarios.findUnique.mockResolvedValue(usuario);
    const navegador = request.agent(app);

    const login = await navegador
      .post("/Sessao/login")
      .send({ emailUsuario: usuario.emailUsuario, senhaUsuario: usuario.senhaUsuario });

    // Confirma que as credenciais corretas iniciam a sessão com sucesso.
    expect(login.status).toBe(200);
    // Confirma que a resposta contém os dados públicos do usuário, sem a senha.
    expect(login.body.usuario).toEqual({
      cpf: usuario.cpf,
      emailUsuario: usuario.emailUsuario,
      nomeUsuario: usuario.nomeUsuario,
      admin: false,
    });

    const sessao = await navegador.get("/Sessao/me");
    // Confirma que o cookie permite consultar a sessão em uma nova requisição.
    expect(sessao.status).toBe(200);
    // Confirma que a sessão identificou o usuário que acabou de entrar.
    expect(sessao.body.usuario.emailUsuario).toBe(usuario.emailUsuario);

    const logout = await navegador.post("/Sessao/logout");
    // Confirma que a API encerra a sessão com a resposta HTTP 204.
    expect(logout.status).toBe(204);

    const sessaoEncerrada = await navegador.get("/Sessao/me");
    // Confirma que a sessão não pode mais ser consultada depois do logout.
    expect(sessaoEncerrada.status).toBe(401);
  });

  test("protege a lista de produtos por sessão e converte o preço para texto", async () => {
    prisma.usuarios.findUnique.mockResolvedValue(usuario);
    prisma.produtos.findMany.mockResolvedValue([
      { idProdutos: 1, tipoProduto: "Livro", precoProduto: 42.5, usuario },
    ]);
    const navegador = request.agent(app);

    await navegador
      .post("/Sessao/login")
      .send({ emailUsuario: usuario.emailUsuario, senhaUsuario: usuario.senhaUsuario });
    const resposta = await navegador.get("/Sessao/produtos");

    // Confirma que uma sessão válida pode acessar a lista protegida de produtos.
    expect(resposta.status).toBe(200);
    // Confirma que o preço é convertido para texto antes de ser enviado pela API.
    expect(resposta.body[0].precoProduto).toBe("42.5");
    // Confirma que a API busca os produtos incluindo os dados do usuário associado.
    expect(prisma.produtos.findMany).toHaveBeenCalledWith({
      include: { usuario: true },
    });
  });
});
