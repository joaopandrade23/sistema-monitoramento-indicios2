import { supabase } from "./supabase.js";

const THEME_STORAGE_KEY = "mi-theme";
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72;

function detectRecoveryMaterial() {
  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
  const code = url.searchParams.get("code");
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  const type = hash.get("type");
  const hasPkceCode = Boolean(code);
  const hasHashTokens = Boolean(accessToken && refreshToken);

  return {
    hasRecoveryMaterial:
      hasPkceCode || (hasHashTokens && type === "recovery"),
    recoveryFlow: hasPkceCode ? "pkce" : hasHashTokens ? "implicit" : null
  };
}

const recoveryMaterial = detectRecoveryMaterial();

const state = {
  recoveryValidated: false,
  submitting: false,
  hasRecoveryMaterial: recoveryMaterial.hasRecoveryMaterial,
  recoveryFlow: recoveryMaterial.recoveryFlow
};

const elements = {
  mainContent: document.getElementById("main-content"),
  themeToggleButton: document.getElementById("theme-toggle-button"),
  themeToggleIcon: document.getElementById("theme-toggle-icon"),
  themeToggleText: document.getElementById("theme-toggle-text"),
  pageMessage: document.getElementById("page-message"),
  recoveryLoading: document.getElementById("recovery-loading"),
  loadingMessage: document.getElementById("loading-message"),
  invalidRecoveryState: document.getElementById("invalid-recovery-state"),
  invalidRecoveryMessage: document.getElementById("invalid-recovery-message"),
  passwordForm: document.getElementById("password-form"),
  newPassword: document.getElementById("new-password"),
  confirmPassword: document.getElementById("confirm-password"),
  toggleNewPassword: document.getElementById("toggle-new-password"),
  toggleConfirmPassword: document.getElementById("toggle-confirm-password"),
  newPasswordError: document.getElementById("new-password-error"),
  confirmPasswordError: document.getElementById("confirm-password-error"),
  requirementLength: document.getElementById("requirement-length"),
  requirementUppercase: document.getElementById("requirement-uppercase"),
  requirementLowercase: document.getElementById("requirement-lowercase"),
  requirementNumber: document.getElementById("requirement-number"),
  requirementSpecial: document.getElementById("requirement-special"),
  submitPasswordButton: document.getElementById("submit-password-button"),
  successState: document.getElementById("success-state"),
  goToLoginLink: document.getElementById("go-to-login-link")
};

function validatePageStructure() {
  const missing = Object.entries(elements)
    .filter(([, element]) => !element)
    .map(([name]) => name);

  if (missing.length) {
    console.error("Elementos ausentes em redefinir-senha.html:", missing);
    throw new Error("PAGE_STRUCTURE_INVALID");
  }
}

function getPreferredTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch (error) {
    console.warn("Não foi possível recuperar a preferência de tema:", error);
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme) {
  const normalized = theme === "dark" ? "dark" : "light";
  const dark = normalized === "dark";
  document.documentElement.dataset.theme = normalized;
  elements.themeToggleButton.setAttribute("aria-pressed", String(dark));
  elements.themeToggleButton.setAttribute(
    "aria-label",
    dark ? "Ativar modo claro" : "Ativar modo escuro"
  );
  elements.themeToggleButton.title = dark
    ? "Ativar modo claro"
    : "Ativar modo escuro";
  elements.themeToggleIcon.textContent = dark ? "Sol" : "Lua";
  elements.themeToggleText.textContent = dark ? "Modo claro" : "Modo escuro";
}

function toggleTheme() {
  const next = document.documentElement.dataset.theme === "dark"
    ? "light"
    : "dark";
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch (error) {
    console.warn("Não foi possível salvar a preferência de tema:", error);
  }
  applyTheme(next);
}

function showPageMessage(message, type = "error") {
  elements.pageMessage.textContent = message;
  elements.pageMessage.classList.toggle("success", type === "success");
  elements.pageMessage.hidden = false;
}

function hidePageMessage() {
  elements.pageMessage.textContent = "";
  elements.pageMessage.classList.remove("success");
  elements.pageMessage.hidden = true;
}

function showInvalidRecovery(message) {
  state.recoveryValidated = false;
  elements.recoveryLoading.hidden = true;
  elements.passwordForm.hidden = true;
  elements.successState.hidden = true;
  elements.invalidRecoveryMessage.textContent = message;
  elements.invalidRecoveryState.hidden = false;
}

function showPasswordForm() {
  state.recoveryValidated = true;
  elements.recoveryLoading.hidden = true;
  elements.invalidRecoveryState.hidden = true;
  elements.successState.hidden = true;
  elements.passwordForm.hidden = false;
  validatePasswordForm();
  window.requestAnimationFrame(() => elements.newPassword.focus());
}

function showSuccessState() {
  elements.recoveryLoading.hidden = true;
  elements.invalidRecoveryState.hidden = true;
  elements.passwordForm.hidden = true;
  elements.successState.hidden = false;
  elements.goToLoginLink.focus();
}

function getPasswordChecks(password) {
  return {
    length:
      password.length >= PASSWORD_MIN_LENGTH &&
      password.length <= PASSWORD_MAX_LENGTH,
    uppercase: /[A-ZÀ-ÖØ-Þ]/.test(password),
    lowercase: /[a-zà-öø-ÿ]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-zÀ-ÖØ-öø-ÿ0-9\s]/.test(password)
  };
}

function updateRequirement(element, valid, hasInput) {
  element.classList.toggle("is-valid", valid);
  element.classList.toggle("is-invalid", hasInput && !valid);
}

function updatePasswordRequirements(password) {
  const checks = getPasswordChecks(password);
  const hasInput = password.length > 0;
  updateRequirement(elements.requirementLength, checks.length, hasInput);
  updateRequirement(elements.requirementUppercase, checks.uppercase, hasInput);
  updateRequirement(elements.requirementLowercase, checks.lowercase, hasInput);
  updateRequirement(elements.requirementNumber, checks.number, hasInput);
  updateRequirement(elements.requirementSpecial, checks.special, hasInput);
  return Object.values(checks).every(Boolean);
}

function clearFieldError(input, errorElement) {
  input.removeAttribute("aria-invalid");
  errorElement.textContent = "";
  errorElement.hidden = true;
}

function setFieldError(input, errorElement, message) {
  input.setAttribute("aria-invalid", "true");
  errorElement.textContent = message;
  errorElement.hidden = false;
}

function validatePasswordForm({ showErrors = false } = {}) {
  const password = elements.newPassword.value;
  const confirmation = elements.confirmPassword.value;
  const passwordIsValid = updatePasswordRequirements(password);
  const passwordsMatch = password.length > 0 && password === confirmation;

  clearFieldError(elements.newPassword, elements.newPasswordError);
  clearFieldError(elements.confirmPassword, elements.confirmPasswordError);

  if (showErrors && !passwordIsValid) {
    setFieldError(
      elements.newPassword,
      elements.newPasswordError,
      "A nova senha ainda não atende a todos os requisitos."
    );
  }

  if (showErrors && !confirmation) {
    setFieldError(
      elements.confirmPassword,
      elements.confirmPasswordError,
      "Confirme a nova senha."
    );
  } else if (confirmation && !passwordsMatch) {
    setFieldError(
      elements.confirmPassword,
      elements.confirmPasswordError,
      "As senhas informadas não coincidem."
    );
  }

  const valid =
    state.recoveryValidated &&
    !state.submitting &&
    passwordIsValid &&
    passwordsMatch;

  elements.submitPasswordButton.disabled = !valid;
  elements.submitPasswordButton.setAttribute("aria-disabled", String(!valid));
  return valid;
}

function togglePasswordVisibility(button) {
  const input = document.getElementById(button.dataset.target || "");
  if (!(input instanceof HTMLInputElement)) return;
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  button.textContent = show ? "Ocultar" : "Mostrar";
  button.setAttribute("aria-pressed", String(show));
  button.setAttribute("aria-label", show ? "Ocultar senha" : "Mostrar senha");
}

function readHashSession() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  if (!accessToken || !refreshToken) return null;
  return {
    accessToken,
    refreshToken,
    type: hash.get("type")
  };
}

function getUrlAuthError() {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  return (
    query.get("error_description") ||
    hash.get("error_description") ||
    query.get("error") ||
    hash.get("error")
  );
}

function clearAuthParametersFromUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("error");
  url.searchParams.delete("error_code");
  url.searchParams.delete("error_description");
  url.hash = "";
  const query = url.searchParams.toString();
  window.history.replaceState(
    {},
    document.title,
    url.pathname + (query ? `?${query}` : "")
  );
}

async function establishRecoverySession() {
  if (getUrlAuthError()) {
    throw new Error("RECOVERY_LINK_REJECTED");
  }
  if (!state.hasRecoveryMaterial) {
    throw new Error("RECOVERY_MATERIAL_MISSING");
  }

  const url = new URL(window.location.href);
  const authCode = url.searchParams.get("code");

  if (state.recoveryFlow === "pkce" && authCode) {
    const { data, error } =
      await supabase.auth.exchangeCodeForSession(authCode);
    if (error || !data?.session?.user) {
      console.error("Falha no código PKCE de recuperação:", {
        code: error?.code,
        status: error?.status,
        message: error?.message
      });
      throw new Error("RECOVERY_SESSION_EXCHANGE_FAILED");
    }
    clearAuthParametersFromUrl();
    return data.session;
  }

  if (state.recoveryFlow === "implicit") {
    const hashSession = readHashSession();
    if (!hashSession) throw new Error("RECOVERY_TOKENS_MISSING");
    if (hashSession.type && hashSession.type !== "recovery") {
      throw new Error("INVALID_AUTH_FLOW_TYPE");
    }

    const { data, error } = await supabase.auth.setSession({
      access_token: hashSession.accessToken,
      refresh_token: hashSession.refreshToken
    });
    if (error || !data?.session?.user) {
      console.error("Falha nos tokens de recuperação:", {
        code: error?.code,
        status: error?.status,
        message: error?.message
      });
      throw new Error("RECOVERY_SESSION_EXCHANGE_FAILED");
    }
    clearAuthParametersFromUrl();
    return data.session;
  }

  throw new Error("RECOVERY_FLOW_NOT_IDENTIFIED");
}

async function safelyClearLocalSession() {
  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch (error) {
    console.warn("Não foi possível limpar a sessão local:", error);
  }
}

async function validateRecovery() {
  try {
    elements.loadingMessage.textContent = "Validando o link de recuperação...";

    if (!state.hasRecoveryMaterial) {
      await safelyClearLocalSession();
      throw new Error("RECOVERY_MATERIAL_MISSING");
    }

    await establishRecoverySession();
    clearAuthParametersFromUrl();

    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      throw error || new Error("RECOVERY_SESSION_MISSING");
    }

    showPasswordForm();
  } catch (error) {
    console.error("Falha ao validar a recuperação de senha:", {
      code: error?.code,
      status: error?.status,
      message: error?.message
    });
    await safelyClearLocalSession();
    clearAuthParametersFromUrl();
    showInvalidRecovery(
      "O link de recuperação é inválido, expirou ou já foi utilizado. Solicite um novo link."
    );
  }
}

function setSubmitting(value) {
  state.submitting = value;
  elements.newPassword.disabled = value;
  elements.confirmPassword.disabled = value;
  elements.toggleNewPassword.disabled = value;
  elements.toggleConfirmPassword.disabled = value;
  elements.submitPasswordButton.setAttribute("aria-busy", String(value));
  elements.submitPasswordButton.textContent = value
    ? "Salvando nova senha..."
    : "Definir senha e concluir acesso";
  validatePasswordForm();
}

function getPasswordUpdateMessage(error) {
  const message = String(error?.message || "").toLowerCase();
  if (message.includes("same password")) {
    return "A nova senha precisa ser diferente da senha usada anteriormente.";
  }
  if (message.includes("weak") || message.includes("password")) {
    return "A senha não foi aceita pelo serviço de autenticação. Escolha uma senha mais forte.";
  }
  if (message.includes("session") || message.includes("jwt") || error?.status === 401) {
    return "A sessão de recuperação expirou. Solicite um novo link de recuperação.";
  }
  return "Não foi possível redefinir a senha. Verifique sua conexão e tente novamente.";
}

async function handlePasswordSubmit(event) {
  event.preventDefault();
  hidePageMessage();
  if (state.submitting || !validatePasswordForm({ showErrors: true })) return;
  setSubmitting(true);

  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      throw userError || new Error("RECOVERY_SESSION_MISSING");
    }

    const { error } = await supabase.auth.updateUser({
      password: elements.newPassword.value
    });
    if (error) throw error;

    elements.newPassword.value = "";
    elements.confirmPassword.value = "";
    updatePasswordRequirements("");
    await safelyClearLocalSession();
    state.recoveryValidated = false;
    showSuccessState();
  } catch (error) {
    console.error("Falha ao redefinir a senha:", {
      code: error?.code,
      status: error?.status,
      message: error?.message
    });
    showPageMessage(getPasswordUpdateMessage(error));
  } finally {
    setSubmitting(false);
  }
}

function registerEventListeners() {
  elements.themeToggleButton.addEventListener("click", toggleTheme);
  elements.toggleNewPassword.addEventListener("click", () =>
    togglePasswordVisibility(elements.toggleNewPassword)
  );
  elements.toggleConfirmPassword.addEventListener("click", () =>
    togglePasswordVisibility(elements.toggleConfirmPassword)
  );
  elements.newPassword.addEventListener("input", () => {
    hidePageMessage();
    validatePasswordForm();
  });
  elements.confirmPassword.addEventListener("input", () => {
    hidePageMessage();
    validatePasswordForm();
  });
  elements.passwordForm.addEventListener("submit", handlePasswordSubmit);
}

async function initializePage() {
  try {
    validatePageStructure();
    applyTheme(getPreferredTheme());
    registerEventListeners();
    elements.mainContent.focus();
    await validateRecovery();
  } catch (error) {
    console.error("Falha ao inicializar a página de redefinição de senha:", error);
    if (error?.message === "PAGE_STRUCTURE_INVALID") {
      document.body.textContent = "Não foi possível carregar a estrutura da página.";
      return;
    }
    showInvalidRecovery(
      "Não foi possível iniciar a validação do link. Atualize a página ou solicite um novo link de recuperação."
    );
  }
}

document.addEventListener("DOMContentLoaded", initializePage);
