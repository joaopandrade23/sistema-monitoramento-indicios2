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
    // Redirecionamento ocorre mesmo se a limpeza remota falhar.
  }
}

async function fetchFunctionalContext() {
  // Consulta isolada na camada segura de API (schema api)
  const { data, error } = await supabase
    .schema("api")
    .from("v_meu_contexto")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error || !data) {
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
  try {
    // 1. Validação remota obrigatória do Token JWT com o servidor de Auth
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("AUTH_SESSION_INVALID");
    }

    // 2. Validação do Perfil Funcional e Permissões no Banco de Dados
    const context = await fetchFunctionalContext();

    // 3. Apenas após TODAS as validações, renderiza e exibe a tela protegida
    renderContext(context, user);
    showProtectedContent();
  } catch {
    // SEGURANÇA: Falha-Fechada (Fail-Closed)
    // Se ocorrer QUALQUER erro (token inválido, perfil ausente, falha de rede),
    // a tela protegida NUNCA é exibida e o usuário é deslogado imediatamente.
    await safelySignOut();
    redirectToLogin();
  }
}

async function handleLogout() {
  if (logoutInProgress) {
    return;
  }

  logoutInProgress = true;
  logoutButton.disabled = true;
  logoutButton.textContent = "Saindo...";

  try {
    await supabase.auth.signOut({ scope: "local" });
  } finally {
    redirectToLogin();
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
    await safelySignOut();
    redirectToLogin();
  }
}

initializePage();
