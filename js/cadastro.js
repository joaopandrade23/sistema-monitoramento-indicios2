import { supabase } from "./supabase.js";

const form = document.querySelector("#form-cadastro");
const nomeInput = document.querySelector("#nome-completo");
const emailInput = document.querySelector("#cadastro-email");
const passwordInput = document.querySelector("#cadastro-password");
const confirmPasswordInput = document.querySelector("#confirmar-password");
const submitButton = document.querySelector("#signup-button");
const feedbackBanner = document.querySelector("#feedback-banner");

const SIGNUP_DEFAULT_TEXT = "Enviar Solicitação";
const SIGNUP_LOADING_TEXT = "Enviando...";

/**
 * Verifica se todos os elementos necessários existem no cadastro.html.
 */
function verificarElementosDaPagina() {
  const elementosObrigatorios = [
    form,
    nomeInput,
    emailInput,
    passwordInput,
    confirmPasswordInput,
    submitButton,
    feedbackBanner,
  ];

  if (elementosObrigatorios.some((elemento) => !elemento)) {
    throw new Error("PAGE_STRUCTURE_INVALID");
  }
}

/**
 * Ativa ou desativa o estado de carregamento do formulário.
 */
function definirCarregamento(estaCarregando) {
  submitButton.disabled = estaCarregando;

  nomeInput.readOnly = estaCarregando;
  emailInput.readOnly = estaCarregando;
  passwordInput.readOnly = estaCarregando;
  confirmPasswordInput.readOnly = estaCarregando;

  submitButton.setAttribute("aria-busy", String(estaCarregando));

  const textoBotao = submitButton.querySelector("span");

  if (textoBotao) {
    textoBotao.textContent = estaCarregando
      ? SIGNUP_LOADING_TEXT
      : SIGNUP_DEFAULT_TEXT;
  }
}

/**
 * Remove todos os erros visuais da tela.
 */
function limparErros() {
  document
    .querySelectorAll(".custom-tooltip")
    .forEach((elemento) => elemento.remove());

  document
    .querySelectorAll("input")
    .forEach((input) => input.classList.remove("input-error"));

  feedbackBanner.className = "feedback-banner hidden";
  feedbackBanner.textContent = "";
}

/**
 * Exibe uma mensagem de erro vinculada a um campo específico.
 */
function mostrarErroCampo(input, mensagem) {
  limparErros();

  input.classList.add("input-error");
  input.focus();

  const fieldContainer = input.closest(".field");

  if (!fieldContainer) {
    mostrarBannerGlobal(
      "Não foi possível apresentar a validação do formulário.",
      "error"
    );
    return;
  }

  const tooltip = document.createElement("div");
  tooltip.className = "custom-tooltip";
  tooltip.setAttribute("role", "alert");

  const tooltipIcon = document.createElement("span");
  tooltipIcon.className = "tooltip-icon";
  tooltipIcon.setAttribute("aria-hidden", "true");
  tooltipIcon.textContent = "!";

  const tooltipText = document.createElement("span");
  tooltipText.textContent = mensagem;

  tooltip.appendChild(tooltipIcon);
  tooltip.appendChild(tooltipText);

  fieldContainer.appendChild(tooltip);
}

/**
 * Exibe alertas gerais de sucesso ou falha.
 */
function mostrarBannerGlobal(mensagem, tipo = "error") {
  limparErros();

  feedbackBanner.textContent = mensagem;
  feedbackBanner.classList.remove("hidden");
  feedbackBanner.classList.add(tipo);
}

/**
 * Remove o erro visual do campo quando o usuário volta a digitar.
 */
function configurarLimpezaDosCampos() {
  const campos = [
    nomeInput,
    emailInput,
    passwordInput,
    confirmPasswordInput,
  ];

  campos.forEach((input) => {
    input.addEventListener("input", () => {
      input.classList.remove("input-error");

      const fieldContainer = input.closest(".field");
      const tooltip = fieldContainer?.querySelector(".custom-tooltip");

      if (tooltip) {
        tooltip.remove();
      }
    });
  });
}

/**
 * Processa o envio da solicitação de cadastro.
 */
async function processarCadastro(evento) {
  evento.preventDefault();

  if (submitButton.disabled) {
    return;
  }

  limparErros();

  const nomeCompleto = nomeInput.value.trim();
  const email = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  if (!nomeCompleto) {
    mostrarErroCampo(nomeInput, "Preencha este campo.");
    return;
  }

  if (nomeCompleto.length < 3) {
    mostrarErroCampo(
      nomeInput,
      "O nome completo deve conter pelo menos 3 caracteres."
    );
    return;
  }

  if (!email) {
    mostrarErroCampo(emailInput, "Preencha este campo.");
    return;
  }

  if (!emailInput.checkValidity()) {
    mostrarErroCampo(
      emailInput,
      "Digite um endereço de e-mail válido."
    );
    return;
  }

  if (!password) {
    mostrarErroCampo(passwordInput, "Preencha este campo.");
    return;
  }

  if (password.length < 8) {
    mostrarErroCampo(
      passwordInput,
      "A senha deve conter no mínimo 8 caracteres."
    );
    return;
  }

  if (!confirmPassword) {
    mostrarErroCampo(
      confirmPasswordInput,
      "Confirme sua senha."
    );
    return;
  }

  if (password !== confirmPassword) {
    mostrarErroCampo(
      confirmPasswordInput,
      "As senhas não coincidem."
    );
    return;
  }

  definirCarregamento(true);

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome_completo: nomeCompleto,
        },
      },
    });

    if (error) {
      const codigoErro = String(error.code || "").toLowerCase();
      const mensagemErro = String(error.message || "").toLowerCase();

      const usuarioJaExiste =
        codigoErro === "user_already_exists" ||
        mensagemErro.includes("already registered") ||
        mensagemErro.includes("user already exists");

      if (usuarioJaExiste) {
        mostrarErroCampo(
          emailInput,
          "Este e-mail já possui uma solicitação ou conta cadastrada."
        );
        return;
      }

      if (error.status === 422) {
        mostrarBannerGlobal(
          "Os dados informados não puderam ser processados. Revise o formulário e tente novamente.",
          "error"
        );
        return;
      }

      mostrarBannerGlobal(
        "Não foi possível enviar sua solicitação. Tente novamente.",
        "error"
      );
      return;
    }

    mostrarBannerGlobal(
      "Solicitação enviada com sucesso! Aguarde a liberação do seu perfil pela gestão.",
      "success"
    );

    form.reset();

    window.setTimeout(() => {
      window.location.href = "./index.html";
    }, 2500);
  } catch (erro) {
    console.error(
      "Falha inesperada ao enviar solicitação de cadastro:",
      erro
    );

    mostrarBannerGlobal(
      "Não foi possível enviar sua solicitação. Verifique sua conexão e tente novamente.",
      "error"
    );
  } finally {
    definirCarregamento(false);
  }
}

/**
 * Inicializa os eventos da página de cadastro.
 */
function iniciarPaginaCadastro() {
  try {
    verificarElementosDaPagina();
    configurarLimpezaDosCampos();

    form.addEventListener("submit", processarCadastro);
  } catch (erro) {
    console.error("Falha ao inicializar a página de cadastro:", erro);

    document.body.textContent =
      "Não foi possível carregar a página de solicitação de cadastro.";
  }
}

iniciarPaginaCadastro();
