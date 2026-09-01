import { supabase } from "./supabase.js";

const form = document.querySelector("#login-form");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const loginButton = document.querySelector("#login-button");
const messageBox = document.querySelector("#login-message");
const forgotPasswordButton = document.querySelector(".forgot-password");

const LOGIN_DEFAULT_TEXT = "Entrar";
const LOGIN_LOADING_TEXT = "Entrando...";

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
    forgotPasswordButton,
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
 * Consulta o perfil funcional do usuário autenticado.
 *
 * A view api.v_meu_contexto deve retornar:
 * - uma linha quando o usuário possui acesso funcional ativo;
 * - nenhuma linha quando o usuário não possui acesso funcional;
 * - erro quando houver falha de consulta, permissão ou comunicação.
 */
async function validarContextoFuncional() {
  const { data, error } = await supabase
    .schema("api")
    .from("v_meu_contexto")
    .select("*")
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

  console.info("Contexto funcional localizado:", {
    codigoPerfil:
      data.codigo_perfil ??
      data.perfil_codigo ??
      data.cod_perfil ??
      "não identificado",

    nomePerfil:
      data.nome_perfil ??
      data.perfil_nome ??
      data.perfil ??
      "não identificado",
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
      console.warn("Não foi possível encerrar completamente a sessão local:", {
        code: error.code,
        status: error.status,
        message: error.message,
      });
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
    /*
     * Primeira validação:
     * autenticação da conta no Supabase Auth.
     */
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    /*
     * Limpa a senha do elemento do formulário após a resposta.
     */
    passwordInput.value = "";

    if (error) {
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

    /*
     * Segunda validação:
     * confirmação de que o usuário possui cadastro funcional ativo.
     */
    try {
      await validarContextoFuncional();
    } catch (erroContexto) {
      /*
       * A conta existe no Auth, mas a sessão não deve permanecer ativa
       * se o usuário não possuir contexto funcional autorizado.
       */
      await encerrarSessaoComSeguranca();

      if (erroContexto.message === "FUNCTIONAL_ACCESS_DENIED") {
        mostrarMensagem(
          "Sua conta foi autenticada, mas ainda não possui acesso funcional ativo. Entre em contato com a gestão do sistema."
        );

        return;
      }

      mostrarMensagem(
        "Não foi possível validar seu acesso ao sistema. Tente novamente."
      );

      return;
    }

    /*
     * A conta foi autenticada e o perfil funcional foi validado.
     */
    window.location.replace("./inicio.html");
  } catch (erro) {
    console.error("Falha inesperada durante o login:", erro);

    await encerrarSessaoComSeguranca();

    passwordInput.value = "";

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

    /*
     * Nenhuma sessão existente.
     * O usuário permanece normalmente na tela de login.
     */
    if (!session) {
      return;
    }

    /*
     * Valida remotamente o usuário associado à sessão existente.
     */
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      if (userError) {
        console.error("Falha ao validar o usuário da sessão existente:", {
          code: userError.code,
          status: userError.status,
          message: userError.message,
        });
      }

      await encerrarSessaoComSeguranca();
      return;
    }

    console.info("Sessão existente validada no Supabase Auth:", {
      userId: user.id,
      email: user.email,
    });

    /*
     * Verifica se a sessão existente também possui acesso funcional.
     */
    try {
      await validarContextoFuncional();

      /*
       * Sessão e contexto funcional válidos.
       */
      window.location.replace("./inicio.html");
    } catch (erroContexto) {
      await encerrarSessaoComSeguranca();

      /*
       * O usuário permanece no index.html.
       * Não é enviado novamente para cadastro.html.
       */
      if (erroContexto.message === "FUNCTIONAL_ACCESS_DENIED") {
        mostrarMensagem(
          "Sua conta existe, mas ainda não possui acesso funcional ativo."
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
 * Informa que a recuperação de senha ainda não está disponível.
 */
function informarRecuperacaoIndisponivel() {
  ocultarMensagem();

  mostrarMensagem(
    "A recuperação de senha ainda não está disponível."
  );
}

/**
 * Inicializa a tela de login.
 */
function iniciarPaginaLogin() {
  try {
    verificarElementosDaPagina();

    form.addEventListener("submit", processarLogin);

    forgotPasswordButton.addEventListener(
      "click",
      informarRecuperacaoIndisponivel
    );

    /*
     * Verifica uma eventual sessão já armazenada no navegador.
     */
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
