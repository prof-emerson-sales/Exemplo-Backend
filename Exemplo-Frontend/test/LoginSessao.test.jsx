import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import LoginSessao from "../src/Componentes/Login/LoginSessao";

function respostaApi(data, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(data),
  };
}

const usuario = {
  cpf: "12345678901",
  emailUsuario: "ana@example.com",
  nomeUsuario: "Ana Silva",
  admin: false,
};

describe("LoginSessao", () => {
  beforeEach(() => {
    // Ao abrir a tela, o componente consulta a sessão atual e, sem login,
    // verifica se há um cadastro Google pendente.
    globalThis.fetch = jest.fn()
      .mockResolvedValueOnce(respostaApi({ error: "Sem sessão" }, 401))
      .mockResolvedValueOnce(respostaApi({ error: "Sem cadastro pendente" }, 404));
  });

  test("mostra o formulário quando não existe uma sessão autenticada", async () => {
    render(<LoginSessao />);

    // Confirma que o formulário de login aparece quando não há uma sessão ativa.
    expect(await screen.findByRole("button", { name: "Entrar" })).toBeTruthy();
    // Confirma que o campo para informar o e-mail está disponível.
    expect(screen.getByLabelText("E-mail")).toBeTruthy();
    // Confirma que o campo para informar a senha está disponível.
    expect(screen.getByLabelText("Senha")).toBeTruthy();
    // Confirma que a tela consultou a sessão atual enviando o cookie do navegador.
    expect(globalThis.fetch).toHaveBeenNthCalledWith(1, "http://localhost:3000/Sessao/me", {
      credentials: "include",
    });
  });

  test("envia as credenciais e apresenta o usuário retornado pela API", async () => {
    globalThis.fetch.mockResolvedValueOnce(respostaApi({ usuario }));
    render(<LoginSessao />);

    fireEvent.change(await screen.findByLabelText("E-mail"), {
      target: { value: usuario.emailUsuario },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "senha-de-exemplo" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    // Confirma que o nome do usuário aparece após um login bem-sucedido.
    expect(await screen.findByRole("heading", { name: usuario.nomeUsuario })).toBeTruthy();
    // Confirma que o e-mail retornado pela API aparece na conta autenticada.
    expect(screen.getByText(usuario.emailUsuario)).toBeTruthy();
    // Confirma que o perfil comum é identificado como "Usuário".
    expect(screen.getByText("Usuário")).toBeTruthy();
    // Confirma que a interface informa que o login foi concluído.
    expect(screen.getByRole("status").textContent).toContain("Login concluído");
    // Confirma que a requisição de login enviou e-mail, senha e cookie de sessão.
    expect(globalThis.fetch).toHaveBeenNthCalledWith(3, "http://localhost:3000/Sessao/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emailUsuario: usuario.emailUsuario,
        senhaUsuario: "senha-de-exemplo",
      }),
    });
  });

  test("exibe a mensagem de erro enviada pela API quando o login falha", async () => {
    globalThis.fetch.mockResolvedValueOnce(respostaApi({ error: "Credenciais inválidas." }, 401));
    render(<LoginSessao />);

    fireEvent.change(await screen.findByLabelText("E-mail"), {
      target: { value: usuario.emailUsuario },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "senha-incorreta" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    // Confirma que a mensagem de credenciais inválidas da API é exibida como erro.
    expect((await screen.findByRole("alert")).textContent).toContain("Credenciais inválidas.");
  });

  test("permite verificar a rota protegida e encerrar a sessão", async () => {
    globalThis.fetch
      .mockReset()
      .mockResolvedValueOnce(respostaApi({ usuario }))
      .mockResolvedValueOnce(respostaApi([]))
      .mockResolvedValueOnce(respostaApi(null, 204));
    render(<LoginSessao />);

    fireEvent.click(await screen.findByRole("button", { name: "Testar rota protegida" }));
    await waitFor(() => {
      // Aguarda e confirma que a interface informa o resultado da rota protegida.
      expect(screen.getByRole("status").textContent).toContain("Produtos encontrados: 0");
    });
    // Confirma que a chamada para listar produtos também envia o cookie da sessão.
    expect(globalThis.fetch).toHaveBeenNthCalledWith(2, "http://localhost:3000/Sessao/produtos", {
      credentials: "include",
    });

    fireEvent.click(screen.getByRole("button", { name: "Encerrar sessão" }));
    // Confirma que, após o logout, a interface volta a mostrar o botão de login.
    expect(await screen.findByRole("button", { name: "Entrar" })).toBeTruthy();
    // Confirma que a interface informa que a sessão foi encerrada.
    expect(screen.getByRole("status").textContent).toContain("Sessão encerrada");
  });

  test("limpa a formatação do CPF antes de concluir um cadastro Google", async () => {
    globalThis.fetch
      .mockReset()
      .mockResolvedValueOnce(respostaApi({ error: "Sem sessão" }, 401))
      .mockResolvedValueOnce(respostaApi({
        usuario: { emailUsuario: usuario.emailUsuario, nomeUsuario: usuario.nomeUsuario },
      }))
      .mockResolvedValueOnce(respostaApi({ usuario }));
    render(<LoginSessao />);

    const campoCpf = await screen.findByLabelText("CPF");
    fireEvent.change(campoCpf, { target: { value: "123.456.789-01" } });
    // Confirma que a interface remove pontuação e mantém apenas os números do CPF.
    expect(campoCpf.value).toBe("12345678901");
    fireEvent.click(screen.getByRole("button", { name: "Concluir cadastro" }));

    // Confirma que, após concluir o cadastro, o nome aparece na conta autenticada.
    expect(await screen.findByRole("heading", { name: usuario.nomeUsuario })).toBeTruthy();
    // Confirma que o cadastro Google envia à API o CPF normalizado e o cookie.
    expect(globalThis.fetch).toHaveBeenNthCalledWith(3, "http://localhost:3000/Sessao/google/register", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cpf: "12345678901" }),
    });
  });
});
