import { supabase } from "./supabase.js";

const form = document.querySelector("#login-form");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const loginButton = document.querySelector("#login-button");
const messageBox = document.querySelector("#login-message");
const forgotPasswordButton = document.querySelector(".forgot-password");

const LOGIN_DEFAULT_TEXT = "Entrar";
const LOGIN_LOADING_TEXT = "Entrando...";

function showMessage(message) {
  messageBox.textContent = message;
  messageBox.hidden = false;
}

function hideMessage() {
  messageBox.textContent = "";
  messageBox.hidden = true;
}

function setLoading(isLoading) {
  loginButton.disabled = isLoading;
  emailInput.readOnly = isLoading;
  passwordInput.readOnly = isLoading;
  loginButton.querySelector("span").textContent = isLoading
    ? LOGIN_LOADING_TEXT
    : LOGIN_DEFAULT_TEXT;
}

function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

async function validateFunctionalContext() {
  const { data, error } = await supabase
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

async function safelySignOut() {
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // Nao exibe detalhes internos ao usuario.
  }
}

async function handleLogin(event) {
  event.preventDefault();

  if (loginButton.disabled) {
    return;
  }

  hideMessage();

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const email = normalizeEmail(emailInput.value);
  const password = passwordInput.value;

  if (!email || !password) {
    showMessage("Preencha o e-mail e a senha.");
    return;
  }

  setLoading(true);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session || !data.user) {
      await safelySignOut();
      showMessage("Nao foi possivel entrar. Verifique suas credenciais.");
      return;
    }

    try {
      await validateFunctionalContext();
    } catch (contextError) {
      await safelySignOut();

      if (contextError.message === "FUNCTIONAL_ACCESS_DENIED") {
        showMessage("Seu usuario nao possui acesso funcional ativo ao sistema.");
      } else {
        showMessage("Nao foi possivel validar seu acesso. Tente novamente.");
      }

      return;
    }

    passwordInput.value = "";
    window.location.replace("inicio.html");
  } catch {
    await safelySignOut();
    showMessage("Nao foi possivel concluir o acesso. Tente novamente.");
  } finally {
    setLoading(false);
  }
}

async function redirectIfAlreadyAuthenticated() {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return;
    }

    try {
      await validateFunctionalContext();
      window.location.replace("inicio.html");
    } catch {
      await safelySignOut();
    }
  } catch {
    await safelySignOut();
  }
}

form.addEventListener("submit", handleLogin);

forgotPasswordButton.addEventListener("click", () => {
  hideMessage();
  showMessage("A recuperacao de senha ainda nao esta disponivel.");
});

redirectIfAlreadyAuthenticated();
