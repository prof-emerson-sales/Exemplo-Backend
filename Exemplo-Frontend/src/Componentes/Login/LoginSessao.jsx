import { useEffect, useState } from "react";
import "./Login.css";

const SESSION_API_URL = "http://localhost:3000/Sessao";

async function getResponseData(response) {
  return response.json().catch(() => ({}));
}

function LoginSessao() {
  const oauthResult = new URLSearchParams(window.location.search).get("oauth");
  const [form, setForm] = useState({
    emailUsuario: "",
    senhaUsuario: "",
  });
  const [usuario, setUsuario] = useState(null);
  const [cadastroGoogle, setCadastroGoogle] = useState(null);
  const [cpfGoogle, setCpfGoogle] = useState("");
  const [erro, setErro] = useState(() => {
    return oauthResult === "error" ? "Não foi possível concluir o login com Google." : "";
  });
  const [status, setStatus] = useState(() => (
    oauthResult === "success"
      ? "Login com Google concluído."
      : oauthResult === "registration-required"
        ? "Complete o cadastro informando seu CPF."
        : ""
  ));
  const [processando, setProcessando] = useState(false);
  const [verificandoSessao, setVerificandoSessao] = useState(true);

  useEffect(() => {
    let cancelado = false;

    if (oauthResult) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    async function carregarSessao() {
      try {
        const response = await fetch(`${SESSION_API_URL}/me`, {
          credentials: "include",
        });
        const data = await getResponseData(response);

        if (!response.ok && response.status !== 401) {
          throw new Error(data.error || "Não foi possível verificar a sessão.");
        }

        if (!response.ok && response.status === 401) {
          const pendingResponse = await fetch(`${SESSION_API_URL}/google/pending`, {
            credentials: "include",
          });

          if (pendingResponse.ok) {
            const pendingData = await getResponseData(pendingResponse);
            if (!cancelado) {
              setCadastroGoogle(pendingData.usuario);
            }
          } else if (pendingResponse.status !== 404) {
            const pendingData = await getResponseData(pendingResponse);
            throw new Error(pendingData.error || "Não foi possível carregar o cadastro Google.");
          }
        }

        if (!cancelado && response.ok) {
          setUsuario(data.usuario);
          if (oauthResult !== "success") {
            setStatus("Sessão existente confirmada pelo servidor.");
          }
        }
      } catch (error) {
        if (!cancelado) {
          setErro(error.message || "Não foi possível conectar ao servidor.");
        }
      } finally {
        if (!cancelado) {
          setVerificandoSessao(false);
        }
      }
    }

    carregarSessao();
    return () => {
      cancelado = true;
    };
  }, [oauthResult]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleGoogleRegistration(event) {
    event.preventDefault();
    setProcessando(true);
    setErro("");
    setStatus("");

    try {
      const response = await fetch(`${SESSION_API_URL}/google/register`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: cpfGoogle }),
      });
      const data = await getResponseData(response);

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível concluir o cadastro.");
      }

      setUsuario(data.usuario);
      setCadastroGoogle(null);
      setStatus("Cadastro e login com Google concluídos.");
    } catch (error) {
      setErro(error.message || "Não foi possível conectar ao servidor.");
    } finally {
      setProcessando(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setProcessando(true);
    setErro("");
    setStatus("");

    try {
      const response = await fetch(`${SESSION_API_URL}/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const data = await getResponseData(response);

      if (!response.ok) {
        throw new Error(data.error || "Erro ao fazer login.");
      }

      setUsuario(data.usuario);
      setForm((prev) => ({ ...prev, senhaUsuario: "" }));
      setStatus("Login concluído. O servidor criou uma sessão autenticada.");
    } catch (error) {
      setErro(error.message || "Não foi possível conectar ao servidor.");
    } finally {
      setProcessando(false);
    }
  }

  async function verificarSessao() {
    setProcessando(true);
    setErro("");
    setStatus("");

    try {
      const response = await fetch(`${SESSION_API_URL}/me`, {
        credentials: "include",
      });
      const data = await getResponseData(response);

      if (!response.ok) {
        setUsuario(null);
        throw new Error(data.error || "Sessão não autenticada ou expirada.");
      }

      setUsuario(data.usuario);
      setStatus("Sessão válida: usuário confirmado pelo servidor.");
    } catch (error) {
      setErro(error.message || "Não foi possível conectar ao servidor.");
    } finally {
      setProcessando(false);
    }
  }

  async function testarRotaProtegida() {
    setProcessando(true);
    setErro("");
    setStatus("");

    try {
      const response = await fetch(`${SESSION_API_URL}/produtos`, {
        credentials: "include",
      });
      const data = await getResponseData(response);

      if (!response.ok) {
        if (response.status === 401) {
          setUsuario(null);
        }
        throw new Error(data.error || "Não foi possível acessar a rota protegida.");
      }

      setStatus(`Acesso autorizado pela sessão. Produtos encontrados: ${data.length}.`);
    } catch (error) {
      setErro(error.message || "Não foi possível conectar ao servidor.");
    } finally {
      setProcessando(false);
    }
  }

  async function encerrarSessao() {
    setProcessando(true);
    setErro("");
    setStatus("");

    try {
      const response = await fetch(`${SESSION_API_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await getResponseData(response);
        throw new Error(data.error || "Não foi possível encerrar a sessão.");
      }

      setUsuario(null);
      setStatus("Sessão encerrada no servidor.");
    } catch (error) {
      setErro(error.message || "Não foi possível conectar ao servidor.");
    } finally {
      setProcessando(false);
    }
  }

  return (
    <main className="login-session-page">
      <section className="login-session-card">
        <p className="login-session-eyebrow">Autenticação do servidor</p>
        <h1>Login por sessão</h1>
        <p className="login-session-intro">
          Entre para testar o cookie de sessão e as rotas protegidas da API.
        </p>

        {verificandoSessao ? (
          <p className="login-session-feedback" role="status">
            Verificando sessão existente...
          </p>
        ) : usuario ? (
          <section className="login-session-account" aria-label="Sessão autenticada">
            <p className="login-session-badge">Sessão autenticada</p>
            <h2>{usuario.nomeUsuario}</h2>
            <p>{usuario.emailUsuario}</p>
            <dl>
              <div>
                <dt>CPF</dt>
                <dd>{usuario.cpf}</dd>
              </div>
              <div>
                <dt>Perfil</dt>
                <dd>{usuario.admin ? "Administrador" : "Usuário"}</dd>
              </div>
            </dl>

            <div className="login-session-actions">
              <button type="button" onClick={verificarSessao} disabled={processando}>
                Verificar sessão
              </button>
              <button type="button" onClick={testarRotaProtegida} disabled={processando}>
                Testar rota protegida
              </button>
              <button
                className="login-session-logout"
                type="button"
                onClick={encerrarSessao}
                disabled={processando}
              >
                Encerrar sessão
              </button>
            </div>
          </section>
        ) : cadastroGoogle ? (
          <form onSubmit={handleGoogleRegistration} className="login-session-form">
            <p>
              Conta Google: <strong>{cadastroGoogle.emailUsuario}</strong>
            </p>
            <p>Nome: {cadastroGoogle.nomeUsuario}</p>
            <label>
              CPF
              <input
                type="text"
                name="cpf"
                value={cpfGoogle}
                onChange={(event) => setCpfGoogle(event.target.value.replace(/\D/g, "").slice(0, 11))}
                placeholder="Digite os 11 números do CPF"
                inputMode="numeric"
                autoComplete="off"
                maxLength={11}
                pattern="[0-9]{11}"
                required
              />
            </label>
            <button type="submit" disabled={processando}>
              {processando ? "Concluindo cadastro..." : "Concluir cadastro"}
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="login-session-form">
              <label>
                E-mail
                <input
                  type="email"
                  name="emailUsuario"
                  value={form.emailUsuario}
                  onChange={handleChange}
                  placeholder="Digite o e-mail"
                  autoComplete="username"
                  required
                />
              </label>

              <label>
                Senha
                <input
                  type="password"
                  name="senhaUsuario"
                  value={form.senhaUsuario}
                  onChange={handleChange}
                  placeholder="Digite a senha"
                  autoComplete="current-password"
                  required
                />
              </label>

              <button type="submit" disabled={processando}>
                {processando ? "Entrando..." : "Entrar"}
              </button>
            </form>
            <div className="login-session-oauth">
              <span>ou</span>
              <a href={`${SESSION_API_URL}/google`}>Entrar com Google</a>
            </div>
          </>
        )}

        {status && <p className="login-session-feedback" role="status">{status}</p>}
        {erro && <p className="login-session-error" role="alert">{erro}</p>}
        <p className="login-session-note">
          As requisições enviam o cookie HttpOnly; nenhum token é salvo no navegador.
        </p>
      </section>
    </main>
  );
}

export default LoginSessao;
