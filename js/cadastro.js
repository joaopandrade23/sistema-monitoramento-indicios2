import { supabase } from "./supabase.js";

const form = document.querySelector("#form-cadastro");
const nomeInput = document.querySelector("#nome-completo");
const emailInput = document.querySelector("#cadastro-email");
const submitButton = document.querySelector("#signup-button");
const feedbackBanner = document.querySelector("#feedback-banner");
const turnstileWidget = document.querySelector("#turnstile-widget");
const securityHelp = document.querySelector(".security-help");

const SIGNUP_DEFAULT_TEXT = "Enviar Solicitação";
const SIGNUP_LOADING_TEXT = "Enviando...";

let turnstileToken = "";
let envioEmAndamento = false;

/**
 * Verifica se todos os elementos obrigatórios existem no cadastro.html.
 */
function verificarElementosDaPagina() {
  const elementosObrigatorios = [
    form,
    nomeInput,
    emailInput,
    submitButton,
    feedbackBanner,
    turnstileWidget,
    securityHelp,
  ];

  if (elementosObrigatorios.some((elemento) => !elemento)) {
    throw new Error("PAGE_STRUCTURE_INVALID");
  }
}

/**
 * Normaliza o nome informado.
 */
function normalizarNome(valor) {
  return valor.trim().replace(/\s+/g, " ");
}

/**
 * Normaliza o e-mail informado.
 */
function normalizarEmail(valor) {
  return valor.trim().toLowerCase();
}

/**
 * Controla o estado de carregamento do formulário.
 */
function definirCarregamento(estaCarregando) {
  envioEmAndamento = estaCarregando;

  submitButton.disabled = estaCarregando;
  nomeInput.readOnly = estaCarregando;
  emailInput.readOnly = estaCarregando;

  submitButton.setAttribute(
    "aria-busy",
    String(estaCarregando)
  );

  const textoBotao = submitButton.querySelector("span");

  if (textoBotao) {
    textoBotao.textContent = estaCarregando
      ? SIGNUP_LOADING_TEXT
      : SIGNUP_DEFAULT_TEXT;
  }
}

/**
 * Remove mensagens e erros visuais anteriores.
 */
function limparErros() {
  document
    .querySelectorAll(".custom-tooltip")
    .forEach((elemento) => elemento.remove());

  document
    .querySelectorAll("input")
    .forEach((input) => {
      input.classList.remove("input-error");
      input.removeAttribute("aria-invalid");
    });

  feedbackBanner.className = "feedback-banner hidden";
  feedbackBanner.textContent = "";
}

/**
 * Exibe um erro associado a um campo específico.
 */
function mostrarErroCampo(input, mensagem) {
  limparErros();

  input.classList.add("input-error");
  input.setAttribute("aria-invalid", "true");
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
 * Exibe uma mensagem geral de sucesso ou erro.
 */
function mostrarBannerGlobal(mensagem, tipo = "error") {
  limparErros();

  feedbackBanner.textContent = mensagem;
  feedbackBanner.classList.remove("hidden");
  feedbackBanner.classList.add(tipo);

  feedbackBanner.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
  });
}

/**
 * Atualiza a descrição da verificação de segurança.
 */
function atualizarMensagemSeguranca(mensagem) {
  securityHelp.textContent = mensagem;
}

/**
 * Reinicia o widget do Turnstile.
 */
function reiniciarTurnstile() {
  turnstileToken = "";

  atualizarMensagemSeguranca(
    "Conclua a verificação antes de enviar a solicitação."
  );

  try {
    if (
      window.turnstile &&
      typeof window.turnstile.reset === "function"
    ) {
      window.turnstile.reset("#turnstile-widget");
    }
  } catch (erro) {
    console.warn(
      "Não foi possível reiniciar o Turnstile:",
      erro
    );
  }
}

/**
 * Callback executado quando o Turnstile conclui a verificação.
 *
 * O nome precisa coincidir com:
 * data-callback="onTurnstileSuccess"
 */
window.onTurnstileSuccess = function onTurnstileSuccess(token) {
  turnstileToken = String(token || "").trim();

  if (turnstileToken) {
    atualizarMensagemSeguranca(
      "Verificação de segurança concluída."
    );
  }
};

/**
 * Callback executado quando o token expira.
 *
 * O nome precisa coincidir com:
 * data-expired-callback="onTurnstileExpired"
 */
window.onTurnstileExpired = function onTurnstileExpired() {
  turnstileToken = "";

  atualizarMensagemSeguranca(
    "A verificação expirou. Aguarde uma nova validação antes de enviar."
  );
};

/**
 * Callback executado quando o Turnstile encontra uma falha.
 *
 * O nome precisa coincidir com:
 * data-error-callback="onTurnstileError"
 */
window.onTurnstileError = function onTurnstileError() {
  turnstileToken = "";

  atualizarMensagemSeguranca(
    "Não foi possível concluir a verificação. Atualize a página e tente novamente."
  );
};

/**
 * Remove o erro do campo quando a pessoa volta a digitar.
 */
function configurarLimpezaDosCampos() {
  [nomeInput, emailInput].forEach((input) => {
    input.addEventListener("input", () => {
      input.classList.remove("input-error");
      input.removeAttribute("aria-invalid");

      const fieldContainer = input.closest(".field");
      const tooltip = fieldContainer?.querySelector(
        ".custom-tooltip"
      );

      if (tooltip) {
        tooltip.remove();
      }
    });
  });
}

/**
 * Interpreta erros retornados pela Edge Function.
 */
async function obterMensagemDeErro(error) {
  /*
   * Quando supabase.functions.invoke recebe uma resposta HTTP
   * de erro, o corpo pode estar disponível em error.context.
   */
  try {
    if (error?.context instanceof Response) {
      const corpo = await error.context.clone().json();

      if (
        corpo &&
        typeof corpo.mensagem === "string" &&
        corpo.mensagem.trim()
      ) {
        return corpo.mensagem.trim();
      }
    }
  } catch (erroLeitura) {
    console.warn(
      "Não foi possível interpretar a resposta da Edge Function:",
      erroLeitura
    );
  }
  return "Não foi possível enviar a solicitação. Tente novamente mais tarde.";
}

/**
 * Envia a solicitação para a Edge Function protegida.
 */
async function enviarSolicitacao(
  nomeCompleto,
  email,
  token
) {
  const { data, error } = await supabase.functions.invoke(
    "solicitar-acesso",
    {
      body: {
        nome_completo: nomeCompleto,
        email,
        turnstile_token: token,
      },
    }
  );

  if (error) {
    const mensagem = await obterMensagemDeErro(error);

    console.error(
      "A Edge Function recusou a solicitação:",
      {
        nome: error.name,
        mensagem: error.message,
      }
    );

    throw new Error(mensagem);
  }

  if (!data || data.sucesso !== true) {
    throw new Error(
      data?.mensagem ||
        "Não foi possível enviar a solicitação."
    );
  }

  return data;
}

/**
 * Processa o envio do formulário.
 */
async function processarCadastro(evento) {
  evento.preventDefault();

  if (envioEmAndamento || submitButton.disabled) {
    return;
  }

  limparErros();

  const nomeCompleto = normalizarNome(nomeInput.value);
  const email = normalizarEmail(emailInput.value);

  if (!nomeCompleto) {
    mostrarErroCampo(
      nomeInput,
      "Preencha este campo."
    );

    return;
  }

  if (nomeCompleto.length < 3) {
    mostrarErroCampo(
      nomeInput,
      "O nome completo deve conter pelo menos 3 caracteres."
    );

    return;
  }

  if (nomeCompleto.length > 150) {
    mostrarErroCampo(
      nomeInput,
      "O nome completo deve conter no máximo 150 caracteres."
    );

    return;
  }

  if (!email) {
    mostrarErroCampo(
      emailInput,
      "Preencha este campo."
    );

    return;
  }

  if (!emailInput.checkValidity()) {
    mostrarErroCampo(
      emailInput,
      "Digite um endereço de e-mail válido."
    );

    return;
  }

  if (!turnstileToken) {
    mostrarBannerGlobal(
      "Aguarde a conclusão da verificação de segurança antes de enviar.",
      "error"
    );

    return;
  }

  definirCarregamento(true);

  try {
    const resultado = await enviarSolicitacao(
      nomeCompleto,
      email,
      turnstileToken
    );

    form.reset();
    turnstileToken = "";

    mostrarBannerGlobal(
      resultado.mensagem ||
        "Solicitação recebida. Aguarde a análise da gestão do sistema.",
      "success"
    );

    reiniciarTurnstile();
  } catch (erro) {
    console.error(
      "Falha ao processar a solicitação de acesso:",
      erro
    );

    mostrarBannerGlobal(
      erro instanceof Error
        ? erro.message
        : "Não foi possível enviar a solicitação. Tente novamente mais tarde.",
      "error"
    );

    /*
     * O token pode ter sido consumido mesmo quando a operação
     * posterior falha. Por isso, o widget é reiniciado.
     */
    reiniciarTurnstile();
  } finally {
    definirCarregamento(false);
  }
}

/**
 * Inicializa a página.
 */
function iniciarPaginaCadastro() {
  try {
    verificarElementosDaPagina();
    configurarLimpezaDosCampos();

    form.addEventListener(
      "submit",
      processarCadastro
    );
  } catch (erro) {
    console.error(
      "Falha ao inicializar a página de solicitação:",
      erro
    );

    document.body.textContent =
      "Não foi possível carregar a página de solicitação de acesso.";
  }
}

iniciarPaginaCadastro();
