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
function verificarElementosDaPag*na() {
  const elementosObrigatori*s = [
    form,
    nomeInput,
    emailInput,
    submitButton,
    feedbackBanner,
    turnstileWidget,
    securityHelp,
  ];

  if (ele*entosObrigatorios.some((elemento) *> !elemento)) {
    throw new Erro*("PAGE_STRUCTURE_INVALID");
  }
}
*/**
 * Normaliza o nome informado.* */
function normalizarNome(valor)*{
  return valor.trim().replace(/\*+/g, " ");
}

/**
 * Normaliza o e*mail informado.
 */
function norma*izarEmail(valor) {
  return valor.*rim().toLowerCase();
}

/**
 * Con*rola o estado de carregamento do f*rmulário.
 */
function definirCarr*gamento(estaCarregando) {
  envioE*Andamento = estaCarregando;

  sub*itButton.disabled = estaCarregando*
  nomeInput.readOnly = estaCarreg*ndo;
  emailInput.readOnly = estaC*rregando;

  submitButton.setAttri*ute(
    "aria-busy",
    String(e*taCarregando)
  );

  const textoB*tao = submitButton.querySelector("*pan");

  if (textoBotao) {
    te*toBotao.textContent = estaCarregan*o
      ? SIGNUP_LOADING_TEXT
    * : SIGNUP_DEFAULT_TEXT;
  }
}

/*** * Remove mensagens e erros visuai* anteriores.
 */
function limparEr*os() {
  document
    .querySelect*rAll(".custom-tooltip")
    .forEa*h((elemento) => elemento.remove())*

  document
    .querySelectorAll*"input")
    .forEach((input) => {*      input.classList.remove("inpu*-error");
      input.removeAttrib*te("aria-invalid");
    });

  fee*backBanner.className = "feedback-b*nner hidden";
  feedbackBanner.tex*Content = "";
}

/**
 * Exibe um e*ro associado a um campo específico*
 */
function mostrarErroCampo(inp*t, mensagem) {
  limparErros();

 *input.classList.add("input-error")*
  input.setAttribute("aria-invali*", "true");
  input.focus();

  co*st fieldContainer = input.closest(*.field");

  if (!fieldContainer) *
    mostrarBannerGlobal(
      "N*o foi possível apresentar a valida*ão do formulário.",
      "error"
*   );

    return;
  }

  const to*ltip = document.createElement("div*);
  tooltip.className = "custom-t*oltip";
  tooltip.setAttribute("ro*e", "alert");

  const tooltipIcon*= document.createElement("span");
* tooltipIcon.className = "tooltip-*con";
  tooltipIcon.setAttribute("*ria-hidden", "true");
  tooltipIco*.textContent = "!";

  const toolt*pText = document.createElement("sp*n");
  tooltipText.textContent = m*nsagem;

  tooltip.appendChild(too*tipIcon);
  tooltip.appendChild(to*ltipText);

  fieldContainer.appen*Child(tooltip);
}

/**
 * Exibe um* mensagem geral de sucesso ou erro*
 */
function mostrarBannerGlobal(*ensagem, tipo = "error") {
  limpa*Erros();

  feedbackBanner.textCon*ent = mensagem;
  feedbackBanner.c*assList.remove("hidden");
  feedba*kBanner.classList.add(tipo);

  fe*dbackBanner.scrollIntoView({
    b*havior: "smooth",
    block: "near*st",
  });
}

/**
 * Atualiza a de*crição da verificação de segurança*
 */
function atualizarMensagemSeg*ranca(mensagem) {
  securityHelp.t*xtContent = mensagem;
}

/**
 * Re*nicia o widget do Turnstile.
 */
f*nction reiniciarTurnstile() {
  tu*nstileToken = "";

  atualizarMens*gemSeguranca(
    "Conclua a verif*cação antes de enviar a solicitaçã*."
  );

  try {
    if (
      wi*dow.turnstile &&
      typeof wind*w.turnstile.reset === "function"
 *  ) {
      window.turnstile.reset*"#turnstile-widget");
    }
  } ca*ch (erro) {
    console.warn(
    * "Não foi possível reiniciar o Tur*stile:",
      erro
    );
  }
}

***
 * Callback executado quando o *urnstile conclui a verificação.
 ** * O nome precisa coincidir com:
 * data-callback="onTurnstileSuccess*
 */
window.onTurnstileSuccess = f*nction onTurnstileSuccess(token) {*  turnstileToken = String(token ||*"").trim();

  if (turnstileToken)*{
    atualizarMensagemSeguranca(
*     "Verificação de segurança con*luída."
    );
  }
};

/**
 * Call*ack executado quando o token expir*.
 *
 * O nome precisa coincidir c*m:
 * data-expired-callback="onTur*stileExpired"
 */
window.onTurnsti*eExpired = function onTurnstileExp*red() {
  turnstileToken = "";

  *tualizarMensagemSeguranca(
    "A *erificação expirou. Aguarde uma no*a validação antes de enviar."
  );*};

/**
 * Callback executado quan*o o Turnstile encontra uma falha.
**
 * O nome precisa coincidir com:* * data-error-callback="onTurnstil*Error"
 */
window.onTurnstileError*= function onTurnstileError() {
  *urnstileToken = "";

  atualizarMe*sagemSeguranca(
    "Não foi possí*el concluir a verificação. Atualiz* a página e tente novamente."
  );*};

/**
 * Remove o erro do campo *uando a pessoa volta a digitar.
 **
function configurarLimpezaDosCamp*s() {
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
    if (error?.context i*stanceof Response) {
      const c*rpo = await error.context.clone().*son();

      if (
        corpo &*
        typeof corpo.mensagem ===*"string" &&
        corpo.mensagem*trim()
      ) {
        return co*po.mensagem.trim();
      }
    }
* } catch (erroLeitura) {
    conso*e.warn(
      "Não foi possível in*erpretar a resposta da Edge Functi*n:",
      erroLeitura
    );
  }
*  return "Não foi possível enviar * solicitação. Tente novamente mais*tarde.";
}

/**
 * Envia a solicit*ção para a Edge Function protegida*
 */
async function enviarSolicita*ao(
  nomeCompleto,
  email,
  tok*n
) {
  const { data, error } = aw*it supabase.functions.invoke(
    *solicitar-acesso",
    {
      bod*: {
        nome_completo: nomeCom*leto,
        email,
        turns*ile_token: token,
      },
    }
 *);

  if (error) {
    const mensa*em = await obterMensagemDeErro(err*r);

    console.error(
      "A E*ge Function recusou a solicitação:*,
      {
        nome: error.name*
        mensagem: error.message,
*     }
    );

    throw new Error*mensagem);
  }

  if (!data || dat*.sucesso !== true) {
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
