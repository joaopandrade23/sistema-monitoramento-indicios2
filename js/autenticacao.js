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

/**
  Valida se o usuário autenticado possui perfil ativo na view `v_meu_contexto`
 */
async function validarContextoFuncional() {
  const { data, error } = await supabase
    .schema("api")
    .from("v_meu_contexto")
    .select("*")
    .limit(1)
    .maybeSingle();

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
    // Redirecionamento/limpeza ocorre mesmo se a chamada remota falhar
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

    // Limpeza da senha da memória do elemento DOM
    passwordInput.value = "";

    // CAMINHO 1: Falha na autenticação (E-mail não existe ou senha incorreta)
    if (error || !data || !data.session || !data.user) {
      await encerrarSessaoComSeguranca();
      mostrarMensagem("Não foi possível entrar. Verifique suas credenciais.");
      passwordInput.focus();
      return;
    }

    // Validação de Perfil Ativo
    try {
      await validarContextoFuncional();
    } catch (erroContexto) {
      await encerrarSessaoComSeguranca();

      // CAMINHO 2: Usuário existe no Auth, mas seu perfil está pendente (inativo)
      if (erroContexto.message === "FUNCTIONAL_ACCESS_DENIED") {
        window.location.replace("./cadastro.html");
        return;
      }

      mostrarMensagem("Não foi possível validar seu acesso. Tente novamente.");
      return;
    }

    // CAMINHO 3: Sucesso -> Redireciona para o sistema principal
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
    } catch (erroContexto) {
      await encerrarSessaoComSeguranca();

      // Se tentar abrir o index.html já logado mas pendente, vai para cadastro.html
      if (erroContexto.message === "FUNCTIONAL_ACCESS_DENIED") {
        window.location.replace("./cadastro.html");
      }
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
