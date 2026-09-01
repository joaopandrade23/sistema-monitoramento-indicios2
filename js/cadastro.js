import { supabase } from "./supabase.js";

const form = document.querySelector("#form-cadastro");
const nomeInput = document.querySelector("#nome-completo");
const emailInput = document.querySelector("#cadastro-email");
const passwordInput = document.querySelector("#cadastro-password");
const confirmPasswordInput = document.querySelector("#confirmar-password");
const submitButton = document.querySelector("#signup-button");
const feedbackBanner = document.querySelector("#feedback-banner");

// Remove todos os erros visuais da tela
function limparErros() {
  document.querySelectorAll(".custom-tooltip").forEach((el) => el.remove());
  document.querySelectorAll("input").forEach((input) => input.classList.remove("input-error"));
  feedbackBanner.classList.add("hidden");
  feedbackBanner.className = "feedback-banner hidden";
  feedbackBanner.textContent = "";
}

// Renderiza o balão customizado acoplado ao campo correspondente
function mostrarErroCampo(input, mensagem) {
  limparErros();

  input.classList.add("input-error");
  input.focus();

  const fieldContainer = input.closest(".field");

  const tooltip = document.createElement("div");
  tooltip.className = "custom-tooltip";
  tooltip.innerHTML = `
    <span class="tooltip-icon">!</span>
    <span>${mensagem}</span>
  `;

  fieldContainer.appendChild(tooltip);
}

// Exibe alertas gerais de sucesso ou falha no topo do formulário
function mostrarBannerGlobal(mensagem, tipo = "error") {
  limparErros();
  feedbackBanner.textContent = mensagem;
  feedbackBanner.classList.remove("hidden");
  feedbackBanner.classList.add(tipo);
}

// Remove o erro do campo no momento em que o usuário digita
[nomeInput, emailInput, passwordInput, confirmPasswordInput].forEach((input) => {
  input.addEventListener("input", () => {
    input.classList.remove("input-error");
    const tooltip = input.closest(".field").querySelector(".custom-tooltip");
    if (tooltip) tooltip.remove();
  });
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  limparErros();

  const nomeCompleto = nomeInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  // Validações de campos obrigatórios
  if (!nomeCompleto) {
    mostrarErroCampo(nomeInput, "Preencha este campo.");
    return;
  }

  if (!email) {
    mostrarErroCampo(emailInput, "Preencha este campo.");
    return;
  }

  if (!password) {
    mostrarErroCampo(passwordInput, "Preencha este campo.");
    return;
  }

  if (password.length < 8) {
    mostrarErroCampo(passwordInput, "A senha deve conter no mínimo 8 caracteres.");
    return;
  }

  if (!confirmPassword) {
    mostrarErroCampo(confirmPasswordInput, "Confirme sua senha.");
    return;
  }

  if (password !== confirmPassword) {
    mostrarErroCampo(confirmPasswordInput, "As senhas não coincidem.");
    return;
  }

  submitButton.disabled = true;

  // Substitua o bloco try do submit em cadastro.js
try {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nome_completo: nomeCompleto }
    }
  });

  if (error) {
    if (error.message.includes("already registered") || error.status === 422) {
      mostrarErroCampo(emailInput, "Este e-mail já possui uma solicitação ou conta cadastrada.");
      return;
    }
    mostrarBannerGlobal("Não foi possível enviar sua solicitação. Tente novamente.", "error");
    return;
  }

  mostrarBannerGlobal("Solicitação enviada com sucesso! Aguarde a liberação do seu perfil pela gestão.", "success");
  form.reset();

  setTimeout(() => {
    window.location.href = "./index.html";
  }, 2500);
} catch (err) {
  mostrarBannerGlobal(err.message, "error");
} finally {
  submitButton.disabled = false;
}
