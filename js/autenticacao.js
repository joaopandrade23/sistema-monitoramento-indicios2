import { supabase } from "./supabase.js";

const form = document.querySelector("#login-form");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const loginButton = document.querySelector("#login-button");
const messageBox = document.querySelector("#login-message");

const LOGIN_DEFAULT_TEXT = "Entrar";
const LOGIN_LOADING_TEXT = "Entrando...";

const PERFIL_GESTOR_DADOS_SISTEMA = "GESTOR_DADOS_SISTEMA";

const PAGINA_INICIAL_PADRAO = "./inicio.html";
const PAGINA_SOLICITACOES = "./solicitacoes.html";

/**
 * Verifica se todos os elementos necessários existem no index.html.
 */
function verificarElementosDaPagina() {
  const elementosObrigatorios = [
    form,
    emailInput,
    passwordInput,
    loginButton,
    messageBox,
  ];

  if (elementosObrigatorios.some((elemento) => !elemento)) {
    throw new Error("PAGE_STRUCTURE_INVALID");
  }
}

/**
 * Exibe uma mensagem funcional na tela de login.
 */
function mostrarMensagem(mensagem) {
  messageBox.textContent = mensagem;
  messageBox.hidden = false;
}

/**
 * Oculta a mensagem funcional da tela.
 */
function ocultarMensagem() {
  messageBox.textContent = "";
  messageBox.hidden = true;
}

/**
 * Controla o estado de carregamento do formulário de login.
 */
function definirCarregamento(estaCarregando) {
  loginButton.disabled = estaCarregando;
  emailInput.readOnly = estaCarregando;
  passwordInput.readOnly = estaCarregando;

  loginButton.setAttribute("aria-busy", String(estaCarregando));

  const textoBotao = loginButton.querySelector("span");

  if (textoBotao) {
    textoBotao.textContent = estaCarregando
      ? LOGIN_LOADING_TEXT
      : LOGIN_DEFAULT_TEXT;
  }
}

/**
 * Normaliza o e-mail antes do envio.
 */
function normalizarEmail(valor) {
  return valor.trim().toLowerCase();
}

/**
 * Obtém o código do perfil a partir do contexto funcional.
 */
function obterCodigoPerfil(contexto) {
  return (
    contexto?.codigo_perfil ??
    contexto?.perfil_codigo ??
    contexto?.cod_perfil ??
    null
  );
}

/**
 * Define a página inicial adequada ao perfil funcional.
 */
function obterPaginaInicialDoPerfil(contexto) {
  const codigoPerfil = obterCodigoPerfil(contexto);

  if (codigoPerfil === PERFIL_GESTOR_DADOS_SISTEMA) {
    return PAGINA_SOLICITACOES;
  }

  return PAGINA_INICIAL_PADRAO;
}

/**
 * Redireciona o usuário para a página correspondente ao perfil.
 */
function redirecionarUsuario(contexto) {
  const paginaDestino = obterPaginaInicialDoPerfil(contexto);

  console.info("Redirecionando usuário autenticado:", {
    codigoPerfil: obterCodigoPerfil(contexto),
    paginaDestino,
  });

  window.location.replace(paginaDestino);
}

/**
 * Consulta o perfil funcional do usuário autenticado.
 */
async function validarContextoFuncional() {
  const { data, error } = await supabase
    .schema("api")
    .from("v_meu_contexto")
    .select(
      [
        "id_usuario",
        "auth_user_id",
        "codigo_usuario",
        "nome_exibicao",
        "email_institucional",
        "id_perfil_acesso",
        "nome_perfil",
        "codigo_perfil",
      ].join(",")
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Falha na consulta de api.v_meu_contexto:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });

    throw new Error("CONTEXT_QUERY_FAILED");
  }

  if (!data) {
    console.warn(
      "A autenticação foi aceita, mas api.v_meu_contexto não retornou um usuário funcional ativo."
    );

    throw new Error("FUNCTIONAL_ACCESS_DENIED");
  }

  const codigoPerfil = obterCodigoPerfil(data);

  if (!codigoPerfil) {
    console.error(
      "O contexto funcional foi localizado, mas não possui código de perfil."
    );

    throw new Error("FUNCTIONAL_PROFILE_INVALID");
  }

  console.info("Contexto funcional localizado:", {
    idUsuario: data.id_usuario,
    codigoUsuario: data.codigo_usuario,
    codigoPerfil,
    nomePerfil: data.nome_perfil ?? "não identificado",
  });

  return data;
}

/**
 * Encerra a sessão local com segurança.
 */
async function encerrarSessaoComSeguranca() {
  try {
    const { error } = await supabase.auth.signOut({
      scope: "local",
    });

    if (error) {
      console.warn(
        "Não foi possível encerrar completamente a sessão local:",
        {
          code: error.code,
          status: error.status,
          message: error.message,
        }
      );
    }
  } catch (erro) {
    console.warn(
      "Falha inesperada durante o encerramento da sessão local:",
      erro
    );
  }
}

/**
 * Apresenta uma mensagem apropriada para erros do Supabase Auth.
 */
function tratarErroDeAutenticacao(error) {
  const codigoErro = String(error?.code || "").toLowerCase();

  switch (codigoErro) {
    case "email_not_confirmed":
      mostrarMensagem(
        "Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada."
      );
      break;

    case "user_banned":
      mostrarMensagem(
        "Esta conta está bloqueada. Entre em contato com a gestão do sistema."
      );
      break;

    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      mostrarMensagem(
        "Foram realizadas muitas tentativas. Aguarde alguns minutos e tente novamente."
      );
      break;

    case "invalid_credentials":
    default:
      mostrarMensagem(
        "Não foi possível entrar. Verifique seu e-mail e sua senha."
      );
      break;
  }
}

/**
 * Processa o envio do formulário de login.
 */
async function processarLogin(evento) {
  evento.preventDefault();

  if (loginButton.disabled) {
    return;
  }

  ocultarMensagem();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const email = normalizarEmail(emailInput.value);
  const senha = passwordInput.value;

  if (!email || !senha) {
    mostrarMensagem("Preencha o e-mail e a senha.");
    return;
  }

  definirCarregamento(true);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      passwordInput.value = "";
      console.error("Falha de autenticação no Supabase Auth:", {
        code: error.code,
        status: error.status,
        message: error.message,
        name: error.name,
      });

      await encerrarSessaoComSeguranca();
      tratarErroDeAutenticacao(error);

      passwordInput.focus();
      return;
    }

    if (!data?.session || !data?.user) {
      passwordInput.value = "";
      console.error(
        "O Supabase Auth não retornou sessão ou usuário após a autenticação."
      );

      await encerrarSessaoComSeguranca();

      mostrarMensagem(
        "Não foi possível estabelecer sua sessão. Tente novamente."
      );

      return;
    }

    console.info("Autenticação aceita pelo Supabase Auth:", {
      userId: data.user.id,
      email: data.user.email,
    });

    let contextoFuncional;

    try {
      contextoFuncional = await validarContextoFuncional();
    } catch (erroContexto) {
      passwordInput.value = "";
      await encerrarSessaoComSeguranca();

      if (erroContexto.message === "FUNCTIONAL_ACCESS_DENIED") {
        mostrarMensagem(
          "Sua conta foi autenticada, mas ainda não possui acesso funcional ativo. Entre em contato com a gestão do sistema."
        );

        return;
      }

      if (erroContexto.message === "FUNCTIONAL_PROFILE_INVALID") {
        mostrarMensagem(
          "Seu cadastro funcional não possui um perfil válido. Entre em contato com a gestão do sistema."
        );

        return;
      }

      mostrarMensagem(
        "Não foi possível validar seu acesso ao sistema. Tente novamente."
      );

      return;
    }

    passwordInput.value = "";
    redirecionarUsuario(contextoFuncional);
  } catch (erro) {
    console.error("Falha inesperada durante o login:", erro);

    passwordInput.value = "";
    await encerrarSessaoComSeguranca();

    mostrarMensagem(
      "Não foi possível concluir o acesso. Verifique sua conexão e tente novamente."
    );
  } finally {
    definirCarregamento(false);
  }
}

/**
 * Verifica se já existe uma sessão ao abrir o index.html.
 */
async function redirecionarSessaoExistente() {
  definirCarregamento(true);
  ocultarMensagem();

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Falha ao consultar a sessão existente:", {
        code: sessionError.code,
        status: sessionError.status,
        message: sessionError.message,
      });

      await encerrarSessaoComSeguranca();
      return;
    }

    if (!session) {
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      if (userError) {
        console.error(
          "Falha ao validar o usuário da sessão existente:",
          {
            code: userError.code,
            status: userError.status,
            message: userError.message,
          }
        );
      }

      await encerrarSessaoComSeguranca();
      return;
    }

    console.info("Sessão existente validada no Supabase Auth:", {
      userId: user.id,
      email: user.email,
    });

    try {
      const contextoFuncional = await validarContextoFuncional();
      redirecionarUsuario(contextoFuncional);
    } catch (erroContexto) {
      await encerrarSessaoComSeguranca();

      if (erroContexto.message === "FUNCTIONAL_ACCESS_DENIED") {
        mostrarMensagem(
          "Sua conta existe, mas ainda não possui acesso funcional ativo."
        );

        return;
      }

      if (erroContexto.message === "FUNCTIONAL_PROFILE_INVALID") {
        mostrarMensagem(
          "Seu cadastro funcional não possui um perfil válido. Entre em contato com a gestão do sistema."
        );

        return;
      }

      mostrarMensagem(
        "Não foi possível validar o acesso da sessão existente. Entre novamente."
      );
    }
  } catch (erro) {
    console.error(
      "Falha inesperada ao verificar a sessão existente:",
      erro
    );

    await encerrarSessaoComSeguranca();

    mostrarMensagem(
      "Não foi possível verificar sua sessão. Entre novamente."
    );
  } finally {
    definirCarregamento(false);
  }
}


/**
 * Inicializa a tela de login.
 */
function iniciarPaginaLogin() {
  try {
    verificarElementosDaPagina();

    form.addEventListener("submit", processarLogin);


    redirecionarSessaoExistente();
  } catch (erro) {
    console.error(
      "Falha ao inicializar a página de acesso:",
      erro
    );

    document.body.textContent =
      "Não foi possível carregar a página de acesso.";
  }
}

iniciarPaginaLogin();
