import { supabase } from "./supabase.js";

const form = document.querySelector("#form-cadastro");
const nomeInput = document.querySelector("#nome-completo");
const emailInput = document.querySelector("#cadastro-email");
const submitButton = document.querySelector("#signup-button");
const feedbackBanner = document.querySelector("#feedback-banner");
const turnstileContainer = document.querySelector("#turnstile-widget");
const securityHelp = document.querySelector("#security-help");

const SIGNUP_DEFAULT_TEXT = "Enviar Solicitação";
const SIGNUP_LOADING_TEXT = "Enviando...";

let turnstileToken = "";
let turnstileWidgetId = null;
let envioEmAndamento = false;

/**
 * Verifica a correspondência entre o HTML e o JavaScript.
 */
function verificarElementosDaPagina() {
  const elementosObrigatorios = [
    { nome: "form-cadastro", elemento: form },
    { nome: "nome-completo", elemento: nomeInput },
    { nome: "cadastro-email", elemento: emailInput },
    { nome: "signup-button", elemento: submitButton },
    { nome: "feedback-banner", elemento: feedbackBanner },
    { nome: "turnstile-widget", elemento: turnstileContainer },
    { nome: "security-help", elemento: securityHelp },
  ];

  const elementosAusentes = elementosObrigatorios
    .filter((item) => !item.elemento)
    .map((item) => item.nome);

  if (elementosAusentes.length > 0) {
    console.error(
      "Elementos ausentes no cadastro.html:",
      elementosAusentes
    );

    throw new Error("PAGE_STRUCTURE_INVALID");
  }
}

/**
 * Normaliza o nome informado.
 */
function normalizarNome(valor) {
  return String(valor || "")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * Normaliza o e-mail informado.
 */
function normalizarEmail(valor) {
  return String(valor || "")
    .trim()
    .toLowerCase();
}

/**
 * Altera o estado visual durante o processamento.
 */
function definirCarregamento(estaCarregando) {
  envioEmAndamento = estaCarregando;

  if (submitButton) submitButton.disabled = estaCarregando;
  if (nomeInput) nomeInput.readOnly = estaCarregando;
  if (emailInput) emailInput.readOnly = estaCarregando;

  if (submitButton) {
    submitButton.setAttribute("aria-busy", String(estaCarregando));
    const textoBotao = submitButton.querySelector("span");
    if (textoBotao) {
      textoBotao.textContent = estaCarregando
        ? SIGNUP_LOADING_TEXT
        : SIGNUP_DEFAULT_TEXT;
    }
  }
}

/**
 * Remove mensagens e erros visuais anteriores.
 */
function limparErros() {
  document
    .querySelectorAll(".custom-tooltip")
    .forEach((elemento) => elemento.remove());

  [nomeInput, emailInput].forEach((input) => {
    if (input) {
      input.classList.remove("input-error");
      input.removeAttribute("aria-invalid");
    }
  });

  if (feedbackBanner) {
    feedbackBanner.className = "feedback-banner hidden";
    feedbackBanner.textContent = "";
  }
}

/**
 * Exibe uma mensagem geral.
 */
function mostrarBannerGlobal(mensagem, tipo = "error") {
  limparErros();

  if (!feedbackBanner) return;

  feedbackBanner.textContent = mensagem;
  feedbackBanner.className = `feedback-banner ${tipo}`;

  feedbackBanner.scrollIntoView({
    behavior: "smooth",
    block: "nearest",
  });
}

/**
 * Exibe uma mensagem vinculada a um campo.
 */
function mostrarErroCampo(input, mensagem) {
  limparErros();

  if (!input) return;

  input.classList.add("input-error");
  input.setAttribute("aria-invalid", "true");

  const fieldContainer = input.closest(".field");

  if (!fieldContainer) {
    mostrarBannerGlobal(
      "Não foi possível validar o formulário.",
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

  input.focus();
}

/**
 * Atualiza a mensagem abaixo do Turnstile.
 */
function atualizarMensagemSeguranca(mensagem) {
  if (securityHelp) {
    securityHelp.textContent = mensagem;
  }
}

/**
 * Recebe o token gerado pelo Turnstile.
 */
function aoValidarTurnstile(token) {
  turnstileToken = String(token || "").trim();

  if (turnstileToken) {
    atualizarMensagemSeguranca("Verificação de segurança concluída.");
  }
}

/**
 * Remove o token quando expirar.
 */
function aoExpirarTurnstile() {
  turnstileToken = "";
  atualizarMensagemSeguranca("A verificação expirou. Aguarde uma nova validação.");
}

/**
 * Trata erros informados pelo widget.
 */
function aoFalharTurnstile(codigoErro) {
  turnstileToken = "";

  console.warn(
    "Falha informada pelo Turnstile:",
    codigoErro || "código não informado"
  );

  atualizarMensagemSeguranca(
    "Não foi possível concluir a verificação. Atualize a página e tente novamente."
  );
}

/**
 * Carrega a biblioteca oficial do Turnstile evitando duplicidade.
 */
function carregarBibliotecaTurnstile() {
  return new Promise((resolve, reject) => {
    if (window.turnstile && typeof window.turnstile.render === "function") {
      resolve(window.turnstile);
      return;
    }

    const scriptExistente = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');

    if (scriptExistente) {
      scriptExistente.addEventListener(
        "load",
        () => {
          if (window.turnstile && typeof window.turnstile.render === "function") {
            resolve(window.turnstile);
          } else {
            reject(new Error("TURNSTILE_API_UNAVAILABLE"));
          }
        },
        { once: true }
      );

      scriptExistente.addEventListener(
        "error",
        () => reject(new Error("TURNSTILE_SCRIPT_LOAD_FAILED")),
        { once: true }
      );

      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.dataset.turnstileScript = "true";

    script.addEventListener(
      "load",
      () => {
        if (window.turnstile && typeof window.turnstile.render === "function") {
          resolve(window.turnstile);
        } else {
          reject(new Error("TURNSTILE_API_UNAVAILABLE"));
        }
      },
      { once: true }
    );

    script.addEventListener(
      "error",
      () => reject(new Error("TURNSTILE_SCRIPT_LOAD_FAILED")),
      { once: true }
    );

    document.head.appendChild(script);
  });
}

/**
 * Renderiza explicitamente o widget.
 */
async function inicializarTurnstile() {
  const siteKey = String(turnstileContainer?.dataset?.sitekey || "").trim();

  if (!siteKey || siteKey === "COLE_SUA_SITE_KEY_AQUI") {
    throw new Error("TURNSTILE_SITE_KEY_INVALID");
  }

  atualizarMensagemSeguranca("Carregando verificação de segurança...");

  const turnstile = await carregarBibliotecaTurnstile();

  turnstileWidgetId = turnstile.render(turnstileContainer, {
    sitekey: siteKey,
    action: "solicitar_acesso",
    theme: "light",
    size: "flexible",
    language: "pt-br",
    callback: aoValidarTurnstile,
    "expired-callback": aoExpirarTurnstile,
    "error-callback": aoFalharTurnstile,
  });

  if (turnstileWidgetId === undefined || turnstileWidgetId === null) {
    throw new Error("TURNSTILE_RENDER_FAILED");
  }

  atualizarMensagemSeguranca("Aguarde a conclusão da verificação de segurança.");
}

/**
 * Reinicia o Turnstile depois de cada tentativa de envio.
 */
function reiniciarTurnstile() {
  turnstileToken = "";
  atualizarMensagemSeguranca("Aguarde uma nova verificação de segurança.");

  if (
    window.turnstile &&
    typeof window.turnstile.reset === "function" &&
    turnstileWidgetId !== null
  ) {
    try {
      window.turnstile.reset(turnstileWidgetId);
    } catch (erro) {
      console.warn("Não foi possível reiniciar o Turnstile:", erro);
    }
  }
}

/**
 * Remove o aviso de um campo quando a pessoa volta a digitar.
 */
function configurarLimpezaDosCampos() {
  [nomeInput, emailInput].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", () => {
      input.classList.remove("input-error");
      input.removeAttribute("aria-invalid");

      const fieldContainer = input.closest(".field");
      const tooltip = fieldContainer?.querySelector(".custom-tooltip");

      if (tooltip) {
        tooltip.remove();
      }
    });
  });
}

/**
 * Tenta extrair a mensagem devolvida pela Edge Function.
 */
async function obterMensagemDeErro(error) {
  try {
    if (error?.context instanceof Response) {
      const resposta = error.context.clone();
      const corpo = await resposta.json();

      if (corpo && typeof corpo.mensagem === "string" && corpo.mensagem.trim()) {
        return corpo.mensagem.trim();
      }
    }
  } catch (erroLeitura) {
    console.warn("Não foi possível interpretar a resposta da função:", erroLeitura);
  }

  return "Não foi possível enviar a solicitação. Tente novamente mais tarde.";
}

/**
 * Chama a Edge Function solicitar-acesso.
 */
async function enviarSolicitacao(nomeCompleto, email, token) {
  const { data, error } = await supabase.functions.invoke("solicitar-acesso", {
    body: {
      nome_completo: nomeCompleto,
      email,
      turnstile_token: token,
    },
  });

  if (error) {
    const mensagem = await obterMensagemDeErro(error);

    console.error("A Edge Function recusou a solicitação:", {
      name: error.name,
      message: error.message,
    });

    throw new Error(mensagem);
  }

  if (!data || data.sucesso !== true) {
    throw new Error(data?.mensagem || "Não foi possível enviar a solicitação.");
  }

  return data;
}

/**
 * Valida os campos e processa o formulário.
 */
async function processarCadastro(evento) {
  evento.preventDefault();

  if (envioEmAndamento) return;

  limparErros();

  const nomeCompleto = normalizarNome(nomeInput.value);
  const email = normalizarEmail(emailInput.value);

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

  if (nomeCompleto.length > 150) {
    mostrarErroCampo(
      nomeInput,
      "O nome completo deve conter no máximo 150 caracteres."
    );
    return;
  }

  if (!email) {
    mostrarErroCampo(emailInput, "Preencha este campo.");
    return;
  }

  if (!emailInput.checkValidity()) {
    mostrarErroCampo(emailInput, "Digite um endereço de e-mail válido.");
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
    const resultado = await enviarSolicitacao(nomeCompleto, email, turnstileToken);

    form.reset();

    mostrarBannerGlobal(
      resultado.mensagem ||
        "Solicitação recebida. Aguarde a análise da gestão do sistema.",
      "success"
    );

    reiniciarTurnstile();
  } catch (erro) {
    console.error("Falha ao processar a solicitação:", erro);

    mostrarBannerGlobal(
      erro instanceof Error
        ? erro.message
        : "Não foi possível enviar a solicitação.",
      "error"
    );

    reiniciarTurnstile();
  } finally {
    definirCarregamento(false);
  }
}

/**
 * Inicializa a página de solicitação.
 */
async function iniciarPaginaCadastro() {
  try {
    verificarElementosDaPagina();
    configurarLimpezaDosCampos();

    form.addEventListener("submit", processarCadastro);

    await inicializarTurnstile();
  } catch (erro) {
    console.error("Falha ao inicializar a página de solicitação:", erro);

    if (feedbackBanner) {
      mostrarBannerGlobal(
        "Não foi possível carregar a verificação de segurança. Atualize a página e tente novamente.",
        "error"
      );
    }

    if (submitButton) {
      submitButton.disabled = true;
    }
  }
}

iniciarPaginaCadastro();
