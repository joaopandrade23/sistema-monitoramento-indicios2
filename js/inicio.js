import { supabase } from "./supabase.js";

const pageLoading = document.querySelector("#page-loading");
const protectedContent = document.querySelector("#protected-content");
const pageMessage = document.querySelector("#page-message");
const logoutButton = document.querySelector("#logout-button");

const userName = document.querySelector("#user-name");
const userProfile = document.querySelector("#user-profile");
const contextName = document.querySelector("#context-name");
const contextEmail = document.querySelector("#context-email");
const contextProfileName = document.querySelector("#context-profile-name");
const contextProfileCode = document.querySelector("#context-profile-code");

let logoutInProgress = false;
let authSubscription = null;

function validatePageElements() {
  const requiredElements = [
    pageLoading,
    protectedContent,
    pageMessage,
    logoutButton,
    userName,
    userProfile,
    contextName,
    contextEmail,
    contextProfileName,
    contextProfileCode,
  ];

  if (requiredElements.some((element) => !element)) {
    throw new Error("PAGE_STRUCTURE_INVALID");
  }
}

function firstAvailableValue(source, keys, fallback = "Não informado") {
  for (const key of keys) {
    const value = source?.[key];

    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  return fallback;
}

function showMessage(message) {
  pageMessage.textContent = message;
  pageMessage.hidden = false;
}

function hideMessage() {
  pageMessage.textContent = "";
  pageMessage.hidden = true;
}

function showProtectedContent() {
  pageLoading.hidden = true;
  protectedContent.hidden = false;
}

function redirectToLogin() {
  window.location.replace("./index.html");
}

async function safelySignOut() {
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // O redirecionamento ocorre mesmo se a limpeza remota falhar.
  }
}

async function fetchFunctionalContext() {
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

function renderContext(context, authenticatedUser) {
  const name = firstAvailableValue(context, [
    "nome_usuario",
    "nome",
    "nome_completo",
    "usuario_nome",
  ]);

  const email = firstAvailableValue(
    context,
    ["email", "email_usuario", "usuario_email"],
    authenticatedUser?.email || "Não informado"
  );

  const profileName = firstAvailableValue(context, [
    "nome_perfil",
    "perfil_nome",
    "perfil",
    "descricao_perfil",
  ]);

  const profileCode = firstAvailableValue(context, [
    "codigo_perfil",
    "perfil_codigo",
    "cod_perfil",
  ]);

  userName.textContent = name;
  userProfile.textContent = profileName;
  contextName.textContent = name;
  contextEmail.textContent = email;
  contextProfileName.textContent = profileName;
  contextProfileCode.textContent = profileCode;
}

async function protectPage() {
  hideMessage();

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      await safelySignOut();
      redirectToLogin();
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      await safelySignOut();
      redirectToLogin();
      return;
    }

    const context = await fetchFunctionalContext();

    renderContext(context, user);
    showProtectedContent();
  } catch (error) {
    if (error.message === "FUNCTIONAL_ACCESS_DENIED") {
      await safelySignOut();
      redirectToLogin();
      return;
    }

    pageLoading.hidden = true;
    protectedContent.hidden = false;
    showMessage(
      "Não foi possível validar seu acesso neste momento. Saia e tente novamente."
    );
  }
}

async function handleLogout() {
  if (logoutInProgress) {
    return;
  }

  logoutInProgress = true;
  logoutButton.disabled = true;
  logoutButton.textContent = "Saindo...";
  hideMessage();

  try {
    const { error } = await supabase.auth.signOut({ scope: "local" });

    if (error) {
      throw error;
    }

    redirectToLogin();
  } catch {
    logoutButton.disabled = false;
    logoutButton.textContent = "Sair";
    logoutInProgress = false;
    showMessage("Não foi possível encerrar a sessão. Tente novamente.");
  }
}

function monitorAuthState() {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" || !session) {
      redirectToLogin();
    }
  });

  authSubscription = data.subscription;
}

function dispose() {
  authSubscription?.unsubscribe();
}

async function initializePage() {
  try {
    validatePageElements();
    logoutButton.addEventListener("click", handleLogout);
    window.addEventListener("pagehide", dispose, { once: true });
    monitorAuthState();
    await protectPage();
  } catch {
    document.body.textContent = "Não foi possível carregar a página inicial.";
  }
}

initializePage();
