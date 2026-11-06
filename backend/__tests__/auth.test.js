const {
  authMiddleware,
  requireAdmin,
  signUserToken,
  verifyToken,
} = require("../auth");

const usuario = {
  cpf: "12345678901",
  emailUsuario: "ana@example.com",
  nomeUsuario: "Ana Silva",
  admin: false,
};

function criarRespostaMock() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  };
  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);
  return res;
}

describe("autenticação por token", () => {
  test("assina um usuário e recupera suas informações verificadas", () => {
    const token = signUserToken(usuario);

    // Confirma que o token tem as três partes esperadas: cabeçalho, dados e assinatura.
    expect(token.split(".")).toHaveLength(3);
    // Confirma que a verificação recupera os dados esperados do usuário.
    expect(verifyToken(token)).toEqual(expect.objectContaining({
      cpf: usuario.cpf,
      emailUsuario: usuario.emailUsuario,
      nomeUsuario: usuario.nomeUsuario,
      admin: false,
    }));
  });

  test("recusa um token cuja assinatura foi alterada", () => {
    const token = signUserToken(usuario);
    const [header, payload, assinatura] = token.split(".");
    const assinaturaAlterada = `${assinatura.slice(0, -1)}${assinatura.endsWith("a") ? "b" : "a"}`;

    // Confirma que uma assinatura adulterada faz o token ser recusado.
    expect(verifyToken(`${header}.${payload}.${assinaturaAlterada}`)).toBeNull();
  });

  test("recusa um token após a data de expiração", () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-01-01T12:00:00Z"));

    try {
      const token = signUserToken(usuario);
      jest.setSystemTime(new Date("2025-01-01T12:31:00Z"));

      // Confirma que o token deixa de ser válido depois do prazo de 30 minutos.
      expect(verifyToken(token)).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  test("interrompe a requisição sem token e responde com status 401", () => {
    const req = { headers: {} };
    const res = criarRespostaMock();
    const next = jest.fn();

    authMiddleware(req, res, next);

    // Confirma que a requisição sem token recebe o status HTTP 401.
    expect(res.status).toHaveBeenCalledWith(401);
    // Confirma que a resposta explica que nenhum token foi informado.
    expect(res.json).toHaveBeenCalledWith({ error: "Token não informado." });
    // Confirma que o middleware interrompeu o fluxo e não chamou o próximo handler.
    expect(next).not.toHaveBeenCalled();
  });

  test("anexa o usuário à requisição antes de seguir para a próxima etapa", () => {
    const req = { headers: { authorization: `Bearer ${signUserToken(usuario)}` } };
    const res = criarRespostaMock();
    const next = jest.fn();

    authMiddleware(req, res, next);

    // Confirma que o usuário validado foi anexado à requisição.
    expect(req.user).toEqual(expect.objectContaining({ cpf: usuario.cpf }));
    // Confirma que o middleware permite continuar após validar o token.
    expect(next).toHaveBeenCalledTimes(1);
    // Confirma que uma requisição autenticada não recebe uma resposta de erro.
    expect(res.status).not.toHaveBeenCalled();
  });

  test("permite uma rota administrativa somente a administradores", () => {
    const req = { user: { admin: false } };
    const res = criarRespostaMock();
    const next = jest.fn();

    requireAdmin(req, res, next);

    // Confirma que um usuário comum recebe o status HTTP 403 ao acessar a rota administrativa.
    expect(res.status).toHaveBeenCalledWith(403);
    // Confirma que o acesso foi bloqueado antes de executar a rota protegida.
    expect(next).not.toHaveBeenCalled();
  });
});
