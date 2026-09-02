import { supabase } from "./supabase.js";

const THEME_STORAGE_KEY = "mi-theme";
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 72;
const SESSION_WAIT_TIMEOUT_MS = 10000;

const state = {
  invitationValidated: false,
  submitting: false,
  authSubscription: null
};

const elements = {
  mainContent: document.getElementById("main-content"),
  themeToggleButton: document.getElementById("theme-toggle-button"),
  themeToggleIcon: document.getElementById("theme-toggle-icon"),
  themeToggleText: document.getElementById("theme-toggle-text"),
  pageMessage: document.getElementById("page-message"),
  invitationLoading: document.getElementById("invitation-loading"),
  loadingMessage: document.getElementById("loading-message"),
  invalidInvitationState: document.getElementById("invalid-invitation-state"),
  invalidInvitationMessage: document.getElementById("invalid-invitation-message"),
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

  if (missing.length > 0) {
    console.error("Elementos ausentes em definir-senha.html:", missing);
    throw new Error("PAGE_STRUCTURE_INVALID");
  }
}

function getPreferredTheme() {
  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }
  } catch (error) {
    console.warn("Não foi possível recuperar a preferência de tema:", error);
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme) {
  const normalizedTheme = theme === "dark" ? "dark" : "light";
  const darkModeActive = normalizedTheme === "dark";

  document.documentElement.dataset.theme = normalizedTheme;
  elements.themeToggleButton.setAttribute("aria-pressed", String(darkModeActive));
  elements.themeToggleButton.setAttribute(
    "aria-label",
    darkModeActive ? "Ativar modo claro" : "Ativar modo escuro"
  );
  elements.themeToggleButton.title = darkModeActive
    ? "Ativar modo claro"
    : "Ativar modo escuro";
  elements.themeToggleIcon.textContent = darkModeActive ? "Sol" : "Lua";
  elements.themeToggleText.textContent = darkModeActive
    ? "Modo claro"
    : "Modo escuro";
}

function toggleTheme() {
  const nextTheme = document.documentElement.dataset.theme === "dark"
    ? "light"
    : "dark";

  try {
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  } catch (error) {
    console.warn("Não foi possível salvar a preferência de tema:", error);
  }

  applyTheme(nextTheme);
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

function showInvalidInvitation(message) {
  state.invitationValidated = false;
  elements.invitationLoading.hidden = true;
  elements.passwordForm.hidden = true;
  elements.successState.hidden = true;
  elements.invalidInvitationMessage.textContent = message;
  elements.invalidInvitationState.hidden = false;
}

function showPasswordForm() {
  state.invitationValidated = true;
  elements.invitationLoading.hidden = true;
  elements.invalidInvitationState.hidden = true;
  elements.successState.hidden = true;
  elements.passwordForm.hidden = false;
  validatePasswordForm();
  window.requestAnimationFrame(() => elements.newPassword.focus());
}

function showSuccessState() {
  elements.invitationLoading.hidden = true;
  elements.invalidInvitationState.hidden = true;
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

  if (showErrors && confirmation.length === 0) {
    setFieldError(
      elements.confirmPassword,
      elements.confirmPasswordError,
      "Confirme a nova senha."
    );
  } else if (confirmation.length > 0 && !passwordsMatch) {
    setFieldError(
      elements.confirmPassword,
      elements.confirmPasswordError,
      "As senhas informadas não coincidem."
    );
  }

  const formIsValid =
    state.invitationValidated &&
    !state.submitting &&
    passwordIsValid &&
    passwordsMatch;

  elements.submitPasswordButton.disabled = !formIsValid;
  elements.submitPasswordButton.setAttribute(
    "aria-disabled",
    String(!formIsValid)
  );

  return formIsValid;
}

function togglePasswordVisibility(button) {
  const targetId = button.dataset.target;
  const input = document.getElementById(targetId);

  if (!(input instanceof HTMLInputElement)) {
    return;
  }

  const showPassword = input.type === "password";
  input.type = showPassword ? "text" : "password";
  button.textContent = showPassword ? "Ocultar" : "Mostrar";
  button.setAttribute("aria-pressed", String(showPassword));
  button.setAttribute(
    "aria-label",
    showPassword ? "Ocultar senha" : "Mostrar senha"
  );
}

function readHashSession() {
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");

  if (!accessToken || !refreshToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
    type: hash.get("type")
  };
}

function clearAuthParametersFromUrl() {
  const cleanUrl = `${window.location.pathname}${window.location.search}`;
  const url = new URL(cleanUrl, window.location.origin);
  url.searchParams.delete("code");
  url.searchParams.delete("error");
  url.searchParams.delete("error_code");
  url.searchParams.delete("error_description");
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}`);
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

async function establishInvitationSession() {
  const urlError = getUrlAuthError();
  if (urlError) {
    throw new Error("INVITATION_LINK_REJECTED");
  }

  const url = new URL(window.location.href);
  const authCode = url.searchParams.get("code");

  if (authCode) {
    const { error } = await supabase.auth.exchangeCodeForSession(authCode);
    if (error) {
      console.error("Falha ao trocar o código do convite por uma sessão:", error);
      throw new Error("INVITATION_SESSION_EXCHANGE_FAILED");
    }
    clearAuthParametersFromUrl();
  } else {
    const hashSession = readHashSession();
    if (hashSession) {
      const { error } = await supabase.auth.setSession({
        access_token: hashSession.accessToken,
        refresh_token: hashSession.refreshToken
      });
      if (error) {
        console.error("Falha ao estabelecer a sessão do convite:", error);
        throw new Error("INVITATION_SESSION_EXCHANGE_FAILED");
      }
      clearAuthParametersFromUrl();
    }
  }

  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.error("Falha ao consultar a sessão do convite:", sessionError);
    throw new Error("INVITATION_SESSION_INVALID");
  }

  if (session?.user) {
    return session;
  }

  return await waitForAuthSession();
}

function waitForAuthSession() {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (session) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      subscription.data.subscription.unsubscribe();
      resolve(session);
    };

    const subscription = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        finish(session);
      }
    });

    const timeoutId = window.setTimeout(
      () => finish(null),
      SESSION_WAIT_TIMEOUT_MS
    );
  });
}

async function validateInvitation() {
  elements.loadingMessage.textContent =
    "Aguarde enquanto confirmamos os dados de ativação.";

  try {
    const session = await establishInvitationSession();

    if (!session?.user?.id) {
      showInvalidInvitation(
        "O convite é inválido, expirou ou já foi utilizado. Solicite um novo convite à gestão do sistema."
      );
      return;
    }

    showPasswordForm();
  } catch (error) {
    console.error("Falha ao validar o convite:", error);
    showInvalidInvitation(
      "O convite é inválido, expirou ou não pôde ser confirmado. Solicite um novo convite à gestão do sistema."
    );
  }
}

function setSubmitting(isSubmitting) {
  state.submitting = isSubmitting;
  elements.newPassword.disabled = isSubmitting;
  elements.confirmPassword.disabled = isSubmitting;
  elements.toggleNewPassword.disabled = isSubmitting;
  elements.toggleConfirmPassword.disabled = isSubmitting;
  elements.submitPasswordButton.setAttribute(
    "aria-busy",
    String(isSubmitting)
  );
  elements.submitPasswordButton.textContent = isSubmitting
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

  if (
    message.includes("session") ||
    message.includes("jwt") ||
    error?.status === 401
  ) {
    return "A sessão do convite expirou. Solicite um novo convite à gestão do sistema.";
  }

  return "Não foi possível definir a senha. Verifique sua conexão e tente novamente.";
}

async function handlePasswordSubmit(event) {
  event.preventDefault();
  hidePageMessage();

  if (state.submitting || !validatePasswordForm({ showErrors: true })) {
    return;
  }

  setSubmitting(true);

  try {
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      throw sessionError || new Error("AUTH_SESSION_MISSING");
    }

    const { error } = await supabase.auth.updateUser({
      password: elements.newPassword.value
    });

    if (error) {
      throw error;
    }

    elements.newPassword.value = "";
    elements.confirmPassword.value = "";
    updatePasswordRequirements("");

    const { error: signOutError } = await supabase.auth.signOut({
      scope: "local"
    });

    if (signOutError) {
      console.warn(
        "A senha foi definida, mas a sessão temporária não pôde ser encerrada automaticamente:",
        signOutError
      );
    }

    state.invitationValidated = false;
    showSuccessState();
  } catch (error) {
    console.error("Falha ao definir a senha:", error);
    showPageMessage(getPasswordUpdateMessage(error));

    if (
      error?.status === 401 ||
      String(error?.message || "").toLowerCase().includes("session")
    ) {
      state.invitationValidated = false;
    }
  } finally {
    setSubmitting(false);
  }
}

function registerEventListeners() {
  elements.themeToggleButton.addEventListener("click", toggleTheme);
  elements.toggleNewPassword.addEventListener("click", () => {
    togglePasswordVisibility(elements.toggleNewPassword);
  });
  elements.toggleConfirmPassword.addEventListener("click", () => {
    togglePasswordVisibility(elements.toggleConfirmPassword);
  });
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
    await validateInvitation();
  } catch (error) {
    console.error("Falha ao inicializar a página de definição de senha:", error);

    if (error?.message === "PAGE_STRUCTURE_INVALID") {
      document.body.textContent =
        "Não foi possível carregar a estrutura da página.";
      return;
    }

    showInvalidInvitation(
      "Não foi possível iniciar a validação do convite. Atualize a página ou solicite um novo convite."
    );
  }
}

document.addEventListener("DOMContentLoaded", initializePage);
