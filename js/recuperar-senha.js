import { supabase } from "./supabase.js";

const THEME_STORAGE_KEY = "mi-theme";
const GENERIC_SUCCESS_MESSAGE =
  "Se existir uma conta associada ao e-mail informado, as instruções para redefinir a senha serão enviadas.";

const form = document.getElementById("recovery-form");
const emailInput = document.getElementById("recovery-email");
const recoveryButton = document.getElementById("recovery-button");
const recoveryButtonText = document.getElementById("recovery-button-text");
const message = document.getElementById("recovery-message");

function validatePageStructure() {
  const required = {
    form,
    emailInput,
    recoveryButton,
    recoveryButtonText,
    message
  };

  const missing = Object.entries(required)
    .filter(([, element]) => !element)
    .map(([name]) => name);

  if (missing.length) {
    console.error("Elementos ausentes na página de recuperação:", missing);
    throw new Error("RECOVERY_PAGE_STRUCTURE_INVALID");
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

function applyTheme() {
  document.documentElement.dataset.theme = getPreferredTheme();
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function getRecoveryRedirectUrl() {
  const url = new URL(window.location.href);
  const pathParts = url.pathname.split("/");
  pathParts[pathParts.length - 1] = "redefinir-senha.html";
  url.pathname = pathParts.join("/");
  url.search = "";
  url.hash = "";
  return url.toString();
}

function showMessage(text, type = "error") {
  message.textContent = text;
  message.classList.toggle("success", type === "success");
  message.setAttribute("role", type === "success" ? "status" : "alert");
  message.hidden = false;
}

function hideMessage() {
  message.textContent = "";
  message.classList.remove("success");
  message.setAttribute("role", "status");
  message.hidden = true;
}

function setProcessing(processing) {
  recoveryButton.disabled = processing;
  emailInput.disabled = processing;
  recoveryButton.setAttribute("aria-busy", String(processing));
  recoveryButtonText.textContent = processing
    ? "Enviando instruções..."
    : "Enviar link de recuperação";
}

function isRateLimitError(error) {
  const code = String(error?.code || "").toLowerCase();
  const status = Number(error?.status || 0);
  const text = String(error?.message || "").toLowerCase();

  return (
    status === 429 ||
    code === "over_request_rate_limit" ||
    code === "over_email_send_rate_limit" ||
    text.includes("rate limit") ||
    text.includes("too many requests")
  );
}

async function handleRecoverySubmit(event) {
  event.preventDefault();

  if (recoveryButton.disabled) return;

  hideMessage();
  emailInput.value = normalizeEmail(emailInput.value);

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const email = emailInput.value;
  const redirectTo = getRecoveryRedirectUrl();

  setProcessing(true);

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    });

    if (error) throw error;

    showMessage(GENERIC_SUCCESS_MESSAGE, "success");
    form.reset();
  } catch (error) {
    console.error("Falha ao solicitar recuperação de senha:", {
      code: error?.code || null,
      status: error?.status || null,
      message: error?.message || null
    });

    if (isRateLimitError(error)) {
      showMessage(
        "O limite temporário de envios foi atingido. Aguarde alguns minutos antes de tentar novamente."
      );
    } else {
      showMessage(
        "Não foi possível solicitar a recuperação agora. Verifique sua conexão e tente novamente."
      );
    }
  } finally {
    setProcessing(false);
  }
}

function initializePage() {
  try {
    validatePageStructure();
    applyTheme();
    form.addEventListener("submit", handleRecoverySubmit);
    emailInput.focus();
  } catch (error) {
    console.error("Falha ao inicializar a recuperação de senha:", error);
    document.body.textContent = "Não foi possível carregar a página de recuperação de senha.";
  }
}

document.addEventListener("DOMContentLoaded", initializePage);
