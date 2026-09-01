import { supabase } from "./supabase.js";

const form = document.querySelector("#login-form");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const loginButton = document.querySelector("#login-button");
const messageBox = document.querySelector("#login-message");
const forgotPasswordButton = document.querySelector(".forgot-password");

const LOGIN_DEFAULT_TEXT = "Entrar";
const LOGIN_LOADING_TEXT = "Entrando...";

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

function mostrarMensagem(mensagem) {
  messageBox.textContent = mensagem;
  messageBox.hidden = false;
}

function ocultarMensagem() {
  messageBox.textContent = "";
  messageBox.hidden = true;
}

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

function normalizarEmail(valor) {
  return valor.trim().toLowerCase();
}

async function validarContextoFuncional() {
  // Consulta isolada e explícita no schema 'api'
  const { data, error } = await supabase
    .schema("api")
    .from("v_meu_contexto")
    .select("*")
    .limit(1)
    .maybeSingle();

  // Sem console.error para evitar vazamento de metadados no DevTools
  if (error) {
    throw new Error("CONTEXT_QUERY_FAILED");
  }

  if (!data) {
    throw new Error("FUNCTIONAL_ACCESS_DENIED");
  }

  return data;
}

async function encerrarSessaoComSeguranca() {
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // Redirecionamento ocorre mesmo se a limpeza falhar
  }
}

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

    // Limpeza imediata da senha na memória do elemento DOM
    passwordInput.value = "";

    if (error || !data || !data.session || !data.user) {
      await encerrarSessaoComSeguranca();
      mostrarMensagem("Não foi possível entrar. Verifique suas credenciais.");
      passwordInput.focus();
      return;
    }

    try {
      await validarContextoFuncional();
    } catch (erroContexto) {
      await encerrarSessaoComSeguranca();

      if (erroContexto.message === "FUNCTIONAL_ACCESS_DENIED") {
        mostrarMensagem(
          "Seu usuário não possui acesso funcional ativo ao sistema."
        );
      } else {
        mostrarMensagem(
          "Não foi possível validar seu acesso. Tente novamente."
        );
      }

      return;
    }

    // Sucesso: Redireciona para a página interna protegida
    window.location.replace("./inicio.html");
  } catch {
    await encerrarSessaoComSeguranca();
    passwordInput.value = "";
    mostrarMensagem("Não foi possível concluir o acesso. Tente novamente.");
  } finally {
    definirCarregamento(false);
  }
}

async function redirecionarSessaoExistente() {
  definirCarregamento(true);

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      return;
    }

    // Confirmação obrigatória com o servidor remoto de Autenticação
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      await encerrarSessaoComSeguranca();
      return;
    }

    try {
      await validarContextoFuncional();
      window.location.replace("./inicio.html");
    } catch {
      await encerrarSessaoComSeguranca();
    }
  } catch {
    await encerrarSessaoComSeguranca();
  } finally {
    definirCarregamento(false);
  }
}

function informarRecuperacaoIndisponivel() {
  ocultarMensagem();
  mostrarMensagem("A recuperação de senha ainda não está disponível.");
}

function iniciarPaginaLogin() {
  try {
    verificarElementosDaPagina();

    form.addEventListener("submit", processarLogin);
    forgotPasswordButton.addEventListener("click", informarRecuperacaoIndisponivel);

    redirecionarSessaoExistente();
  } catch {
    document.body.textContent = "Não foi possível carregar a página de acesso.";
  }
}

iniciarPaginaLogin();
