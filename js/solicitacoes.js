import { supabase } from "./supabase.js";

const AUTHORIZED_PROFILE = "GESTOR_DADOS_SISTEMA";
const FIXED_PAGE_LIMIT = 10;
const THEME_STORAGE_KEY = "mi-theme";
const JUSTIFICATION_MAX_LENGTH = 2000;
const JUSTIFICATION_MIN_LENGTH = 3;

const PROFILE_LABELS = Object.freeze({
  GESTOR_DADOS_SISTEMA: "Gestor de Dados e Sistema",
  MONITORAMENTO_SMSA_CE: "Monitoramento SMSA/CE",
  GESTOR_SEGEP_CE: "Gestor SEGEP/CE",
  OPERADOR_SEGEP_CE: "Operador SEGEP/CE"
});

const STATUS_LABELS = Object.freeze({
  PENDENTE: "Pendente",
  APROVADA: "Aprovada",
  REJEITADA: "Rejeitada",
  CANCELADA: "Cancelada",
  EXPIRADA: "Expirada"
});

const state = {
  context: null,
  requests: [],
  selectedRequest: null,
  lastFocusedElement: null,
  status: "PENDENTE",
  limit: FIXED_PAGE_LIMIT,
  offset: 0,
  totalRecords: 0,
  pendingTotal: 0,
  oldestPendingAt: null,
  loading: false
};

let elements = {};

/**
 * Armazena as referências dos elementos da página.
 */
function cacheDOMElements() {
  elements = {
    pageLoading: document.getElementById("page-loading"),
    loadingMessage: document.getElementById("loading-message"),
    protectedContent: document.getElementById("protected-content"),
    mainContent: document.getElementById("main-content"),
    pageMessage: document.getElementById("page-message"),

    userName: document.getElementById("user-name"),
    userProfile: document.getElementById("user-profile"),
    logoutButton: document.getElementById("logout-button"),
    themeToggleButton: document.getElementById(
      "theme-toggle-button"
    ),
    themeToggleIcon: document.getElementById(
      "theme-toggle-icon"
    ),
    themeToggleText: document.getElementById(
      "theme-toggle-text"
    ),

    refreshButton: document.getElementById("refresh-button"),
    pendingSummary: document.getElementById(
      "pending-requests-summary"
    ),
    oldestSummary: document.getElementById(
      "oldest-request-summary"
    ),
    oldestDescription: document.getElementById(
      "oldest-request-description"
    ),
    visibleSummary: document.getElementById(
      "visible-records-summary"
    ),
    filterSummary: document.getElementById(
      "current-filter-summary"
    ),
    recordsCounter: document.getElementById(
      "records-counter"
    ),

    filterForm: document.getElementById("filter-form"),
    statusFilter: document.getElementById("status-filter"),
    applyFilterButton: document.getElementById(
      "apply-filter-button"
    ),
    listLoading: document.getElementById("list-loading"),
    emptyState: document.getElementById("empty-state"),
    tableRegion: document.getElementById("table-region"),
    tableBody: document.getElementById(
      "requests-table-body"
    ),

    paginationDescription: document.getElementById(
      "pagination-description"
    ),
    paginationIndicator: document.getElementById(
      "pagination-indicator"
    ),
    previousPageButton: document.getElementById(
      "previous-page-button"
    ),
    nextPageButton: document.getElementById(
      "next-page-button"
    ),

    detailsModal: document.getElementById("details-modal"),
    closeModalButton: document.getElementById(
      "close-modal-button"
    ),
    cancelAnalysisButton: document.getElementById(
      "cancel-analysis-button"
    ),

    detailId: document.getElementById("detail-id"),
    detailIdSecondary: document.getElementById(
      "detail-id-secondary"
    ),
    detailStatus: document.getElementById("detail-status"),
    detailRequestedAt: document.getElementById(
      "detail-requested-at"
    ),
    detailUpdatedAt: document.getElementById(
      "detail-updated-at"
    ),
    detailAnalyzedAt: document.getElementById(
      "detail-analyzed-at"
    ),
    detailName: document.getElementById("detail-name"),
    detailEmail: document.getElementById("detail-email"),
    detailApprovedProfile: document.getElementById(
      "detail-approved-profile"
    ),
    detailJustification: document.getElementById(
      "detail-justification"
    ),

    analysisForm: document.getElementById("analysis-form"),
    decisionFieldset: document.getElementById(
      "decision-fieldset"
    ),
    decisionApprove: document.getElementById(
      "decision-approve"
    ),
    decisionReject: document.getElementById(
      "decision-reject"
    ),
    approvedProfileSelect: document.getElementById(
      "approved-profile"
    ),
    analysisJustification: document.getElementById(
      "analysis-justification"
    ),
    justificationCounter: document.getElementById(
      "justification-counter"
    ),
    analysisFormMessage: document.getElementById(
      "analysis-form-message"
    ),
    confirmDecisionButton: document.getElementById(
      "confirm-decision-button"
    )
  };
}

/**
 * Verifica se todos os elementos usados pelo JavaScript
 * estão presentes no HTML.
 */
function validatePageElements() {
  const missingElements = Object.entries(elements)
    .filter(([, element]) => !element)
    .map(([name]) => name);

  if (missingElements.length > 0) {
    console.error(
      "Elementos ausentes no HTML:",
      missingElements
    );

    throw new Error("PAGE_STRUCTURE_INVALID");
  }
}

/**
 * Identifica a preferência de tema do usuário.
 */
function getPreferredTheme() {
  try {
    const storedTheme = localStorage.getItem(
      THEME_STORAGE_KEY
    );

    if (
      storedTheme === "light" ||
      storedTheme === "dark"
    ) {
      return storedTheme;
    }
  } catch (error) {
    console.warn(
      "Não foi possível recuperar a preferência de tema:",
      error
    );
  }

  if (
    window.matchMedia &&
    window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches
  ) {
    return "dark";
  }

  return "light";
}

/**
 * Aplica o tema visual.
 */
function applyTheme(theme) {
  const normalizedTheme =
    theme === "dark" ? "dark" : "light";

  const darkModeActive =
    normalizedTheme === "dark";

  document.documentElement.dataset.theme =
    normalizedTheme;

  elements.themeToggleButton.setAttribute(
    "aria-pressed",
    String(darkModeActive)
  );

  elements.themeToggleButton.setAttribute(
    "aria-label",
    darkModeActive
      ? "Ativar modo claro"
      : "Ativar modo escuro"
  );

  elements.themeToggleButton.title =
    darkModeActive
      ? "Ativar modo claro"
      : "Ativar modo escuro";

  elements.themeToggleIcon.textContent =
    darkModeActive ? "Sol" : "Lua";

  elements.themeToggleText.textContent =
    darkModeActive
      ? "Modo claro"
      : "Modo escuro";
}

/**
 * Inicializa o tema.
 */
function initializeTheme() {
  applyTheme(getPreferredTheme());
}

/**
 * Alterna entre o modo claro e o modo escuro.
 */
function toggleTheme() {
  const currentTheme =
    document.documentElement.dataset.theme ||
    "light";

  const nextTheme =
    currentTheme === "dark"
      ? "light"
      : "dark";

  try {
    localStorage.setItem(
      THEME_STORAGE_KEY,
      nextTheme
    );
  } catch (error) {
    console.warn(
      "Não foi possível salvar a preferência de tema:",
      error
    );
  }

  applyTheme(nextTheme);
}

/**
 * Retorna o rótulo de um status.
 */
function getStatusLabel(status) {
  return (
    STATUS_LABELS[status] ??
    status ??
    "Não informado"
  );
}

/**
 * Retorna a classe visual de um status.
 */
function getStatusClass(status) {
  switch (status) {
    case "PENDENTE":
      return "status-pending";

    case "APROVADA":
      return "status-approved";

    case "REJEITADA":
      return "status-rejected";

    default:
      return "status-neutral";
  }
}

/**
 * Cria o marcador visual de status.
 */
function createStatusBadge(status) {
  const badge = document.createElement("span");

  badge.className =
    `status-badge ${getStatusClass(status)}`;

  badge.textContent = getStatusLabel(status);

  return badge;
}

/**
 * Converte uma data para o fuso horário de Fortaleza.
 */
function formatDateTime(value) {
  if (!value) {
    return "Não informado";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data inválida";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Fortaleza"
  }).format(date);
}

/**
 * Calcula a quantidade aproximada de dias de espera.
 */
function getWaitingDays(value) {
  if (!value) {
    return null;
  }

  const requestedDate = new Date(value);

  if (Number.isNaN(requestedDate.getTime())) {
    return null;
  }

  return Math.max(
    0,
    Math.floor(
      (Date.now() - requestedDate.getTime()) /
        86400000
    )
  );
}

/**
 * Retorna o número da página atual.
 */
function getCurrentPage() {
  return (
    Math.floor(state.offset / state.limit) + 1
  );
}

/**
 * Retorna a quantidade total de páginas.
 */
function getTotalPages() {
  return Math.max(
    1,
    Math.ceil(
      state.totalRecords / state.limit
    )
  );
}

/**
 * Exibe uma mensagem geral na página.
 */
function showPageMessage(
  message,
  type = "error"
) {
  elements.pageMessage.textContent = message;

  elements.pageMessage.classList.toggle(
    "success",
    type === "success"
  );

  elements.pageMessage.hidden = false;
}

/**
 * Oculta a mensagem geral.
 */
function hidePageMessage() {
  elements.pageMessage.textContent = "";
  elements.pageMessage.classList.remove(
    "success"
  );
  elements.pageMessage.hidden = true;
}

/**
 * Exibe uma mensagem dentro do formulário de análise.
 */
function showFormMessage(message) {
  elements.analysisFormMessage.textContent =
    message;

  elements.analysisFormMessage.hidden = false;
}

/**
 * Oculta a mensagem do formulário de análise.
 */
function hideFormMessage() {
  elements.analysisFormMessage.textContent = "";
  elements.analysisFormMessage.hidden = true;
}

/**
 * Controla o carregamento da lista.
 */
function setListLoading(isLoading) {
  state.loading = isLoading;

  elements.listLoading.hidden = !isLoading;
  elements.refreshButton.disabled = isLoading;
  elements.applyFilterButton.disabled =
    isLoading;
  elements.statusFilter.disabled = isLoading;

  elements.previousPageButton.disabled = true;
  elements.nextPageButton.disabled = true;

  if (isLoading) {
    elements.emptyState.hidden = true;
    elements.tableRegion.hidden = true;
  }
}

/**
 * Redireciona para a página de login.
 */
function redirectToLogin() {
  window.location.replace("./index.html");
}

/**
 * Redireciona um perfil não autorizado para a tela
 * temporária destinada aos demais perfis.
 */
function redirectUnauthorizedProfile() {
  window.location.replace("./inicio.html");
}

/**
 * Verifica se existe uma sessão válida.
 */
async function validateUserSession() {
  elements.loadingMessage.textContent =
    "Validando sua sessão...";

  const {
    data: { session },
    error
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  if (!session?.user) {
    redirectToLogin();
    return null;
  }

  return session;
}

/**
 * Consulta e valida o contexto funcional.
 */
async function loadFunctionalContext() {
  elements.loadingMessage.textContent =
    "Validando seu perfil funcional...";

  const { data, error } = await supabase
    .schema("api")
    .from("v_meu_contexto")
    .select(
      [
        "id_usuario",
        "auth_user_id",
        "codigo_usuario",
        "nome_exibicao",
        "email_institucional",
        "id_perfil_acesso",
        "nome_perfil",
        "codigo_perfil"
      ].join(",")
    )
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const contextError = new Error(
      "NO_FUNCTIONAL_CONTEXT"
    );

    contextError.code = "42501";
    contextError.reason =
      "NO_FUNCTIONAL_CONTEXT";

    throw contextError;
  }

  if (
    data.codigo_perfil !==
    AUTHORIZED_PROFILE
  ) {
    const profileError = new Error(
      "UNAUTHORIZED_PROFILE"
    );

    profileError.code = "42501";
    profileError.reason =
      "UNAUTHORIZED_PROFILE";

    throw profileError;
  }

  state.context = data;

  elements.userName.textContent =
    data.nome_exibicao || "Usuário";

  elements.userProfile.textContent =
    data.nome_perfil ||
    data.codigo_perfil ||
    "Perfil";

  return data;
}

/**
 * Consulta a página atual e o resumo das solicitações
 * pendentes.
 */
async function fetchRequestsData() {
  const requestsPromise = supabase
    .schema("api")
    .rpc(
      "listar_solicitacoes_acesso",
      {
        p_status: state.status || null,
        p_limite: state.limit,
        p_deslocamento: state.offset
      }
    );

  const pendingSummaryPromise = supabase
    .schema("api")
    .rpc(
      "listar_solicitacoes_acesso",
      {
        p_status: "PENDENTE",
        p_limite: 1,
        p_deslocamento: 0
      }
    );

  const [
    requestsResult,
    pendingResult
  ] = await Promise.all([
    requestsPromise,
    pendingSummaryPromise
  ]);

  if (requestsResult.error) {
    throw requestsResult.error;
  }

  if (pendingResult.error) {
    throw pendingResult.error;
  }

  return {
    requests: Array.isArray(
      requestsResult.data
    )
      ? requestsResult.data
      : [],

    pending: Array.isArray(
      pendingResult.data
    )
      ? pendingResult.data
      : []
  };
}

/**
 * Carrega a lista de solicitações.
 */
async function fetchRequestsList() {
  if (state.loading) {
    return;
  }

  hidePageMessage();
  setListLoading(true);

  let reloadFirstPage = false;

  try {
    const result =
      await fetchRequestsData();

    state.requests = result.requests;

    state.totalRecords = Number(
      result.requests[0]
        ?.total_registros ?? 0
    );

    state.pendingTotal = Number(
      result.pending[0]
        ?.total_registros ?? 0
    );

    state.oldestPendingAt =
      result.pending[0]
        ?.solicitado_em ?? null;

    if (
      state.requests.length === 0 &&
      state.offset > 0
    ) {
      state.offset = 0;
      reloadFirstPage = true;
    } else {
      renderTablePage();
    }
  } catch (error) {
    console.error(
      "Erro ao consultar solicitações:",
      {
        code: error?.code,
        message: error?.message,
        details: error?.details,
        hint: error?.hint
      }
    );

    state.requests = [];
    state.totalRecords = 0;

    renderTablePage();

    showPageMessage(
      "Não foi possível carregar as solicitações."
    );
  } finally {
    setListLoading(false);
    updatePagination();
  }

  if (reloadFirstPage) {
    await fetchRequestsList();
  }
}

/**
 * Cria uma célula da tabela sem utilizar innerHTML.
 */
function createTableCell(content) {
  const cell = document.createElement("td");

  if (content instanceof Node) {
    cell.append(content);
  } else {
    cell.textContent =
      String(content ?? "");
  }

  return cell;
}

/**
 * Define o texto do botão da tabela de acordo
 * com o status.
 */
function getDetailsButtonLabel(status) {
  if (status === "PENDENTE") {
    return "Analisar";
  }

  if (
    status === "APROVADA" ||
    status === "REJEITADA"
  ) {
    return "Ver análise";
  }

  return "Ver detalhes";
}

/**
 * Cria o botão que abre o modal de análise.
 */
function createDetailsButton(request) {
  const button =
    document.createElement("button");

  const label = getDetailsButtonLabel(
    request.status_solicitacao
  );

  button.type = "button";
  button.className = "details-button";
  button.textContent = label;

  button.setAttribute(
    "aria-label",
    `${label} da solicitação ${request.id_solicitacao}`
  );

  button.addEventListener(
    "click",
    () => {
      openDetailsModal(
        request,
        button
      );
    }
  );

  return button;
}

/**
 * Renderiza os registros retornados pela RPC.
 */
function renderTablePage() {
  elements.tableBody.replaceChildren();

  if (state.requests.length === 0) {
    elements.emptyState.hidden = false;
    elements.tableRegion.hidden = true;

    updateSummaryCards();
    return;
  }

  const fragment =
    document.createDocumentFragment();

  state.requests.forEach(
    (request) => {
      const row =
        document.createElement("tr");

      const requestNumber =
        document.createElement("span");

      requestNumber.className =
        "request-number";

      requestNumber.textContent =
        `#${request.id_solicitacao}`;

      const requestName =
        document.createElement("strong");

      requestName.className =
        "request-name";

      requestName.textContent =
        request.nome_completo ||
        "Não informado";

      const requestEmail =
        document.createElement("span");

      requestEmail.className =
        "request-email";

      requestEmail.textContent =
        request.email_normalizado ||
        "Não informado";

      row.append(
        createTableCell(requestNumber),
        createTableCell(requestName),
        createTableCell(requestEmail),
        createTableCell(
          formatDateTime(
            request.solicitado_em
          )
        ),
        createTableCell(
          createStatusBadge(
            request.status_solicitacao
          )
        ),
        createTableCell(
          createDetailsButton(request)
        )
      );

      fragment.append(row);
    }
  );

  elements.tableBody.append(fragment);

  elements.emptyState.hidden = true;
  elements.tableRegion.hidden = false;

  updateSummaryCards();
}

/**
 * Atualiza os indicadores administrativos.
 */
function updateSummaryCards() {
  const waitingDays =
    getWaitingDays(
      state.oldestPendingAt
    );

  const currentStatusLabel =
    state.status
      ? getStatusLabel(state.status)
      : "Todos os status";

  elements.pendingSummary.textContent =
    state.pendingTotal.toLocaleString(
      "pt-BR"
    );

  if (state.oldestPendingAt) {
    elements.oldestSummary.textContent =
      formatDateTime(
        state.oldestPendingAt
      );

    if (waitingDays === null) {
      elements.oldestDescription.textContent =
        "Não foi possível calcular o tempo de espera";
    } else if (waitingDays === 0) {
      elements.oldestDescription.textContent =
        "Recebida hoje";
    } else if (waitingDays === 1) {
      elements.oldestDescription.textContent =
        "Aguardando análise há 1 dia";
    } else {
      elements.oldestDescription.textContent =
        `Aguardando análise há ${waitingDays} dias`;
    }
  } else {
    elements.oldestSummary.textContent =
      "Nenhuma";

    elements.oldestDescription.textContent =
      "Não existem solicitações pendentes";
  }

  elements.visibleSummary.textContent =
    `${state.requests.length} de ${state.limit}`;

  elements.filterSummary.textContent =
    `Filtro: ${currentStatusLabel}`;

  elements.recordsCounter.textContent =
    state.totalRecords === 1
      ? "1 registro"
      : `${state.totalRecords.toLocaleString("pt-BR")} registros`;
}

/**
 * Atualiza as informações e os controles da paginação.
 */
function updatePagination() {
  const currentPage = getCurrentPage();
  const totalPages = getTotalPages();

  const firstRecord =
    state.totalRecords === 0
      ? 0
      : state.offset + 1;

  const lastRecord = Math.min(
    state.offset +
      state.requests.length,
    state.totalRecords
  );

  elements.paginationDescription.textContent =
    state.totalRecords === 0
      ? "Nenhum registro exibido."
      : `Exibindo ${firstRecord} a ${lastRecord} de ` +
        `${state.totalRecords.toLocaleString("pt-BR")} solicitações.`;

  elements.paginationIndicator.textContent =
    `Página ${currentPage} de ${totalPages}`;

  elements.previousPageButton.disabled =
    state.loading ||
    state.offset === 0;

  elements.nextPageButton.disabled =
    state.loading ||
    state.offset + state.limit >=
      state.totalRecords;
}

/**
 * Retorna o formulário do modal ao estado inicial.
 */
function resetAnalysisForm() {
  elements.analysisForm.reset();

  elements.decisionFieldset.disabled = true;
  elements.approvedProfileSelect.disabled =
    true;
  elements.analysisJustification.disabled =
    true;

  elements.justificationCounter.textContent =
    `0 / ${JUSTIFICATION_MAX_LENGTH}`;

  elements.confirmDecisionButton.disabled =
    true;

  elements.confirmDecisionButton.setAttribute(
    "aria-disabled",
    "true"
  );

  elements.confirmDecisionButton.removeAttribute(
    "data-decision"
  );

  elements.confirmDecisionButton.textContent =
    "Selecione uma decisão";

  elements.confirmDecisionButton.title =
    "Selecione uma decisão";

  hideFormMessage();
}

/**
 * Configura o modal para análise ou consulta.
 */
function configureAnalysisMode(request) {
  resetAnalysisForm();

  if (
    request.status_solicitacao ===
    "PENDENTE"
  ) {
    elements.analysisForm.dataset.mode =
      "analysis-pending";

    elements.decisionFieldset.disabled =
      false;

    return;
  }

  elements.analysisForm.dataset.mode =
    "read-only";
}

/**
 * Abre o modal e preenche os dados da solicitação.
 */
function openDetailsModal(
  request,
  triggerElement = null
) {
  state.selectedRequest = request;

  state.lastFocusedElement =
    triggerElement ||
    document.activeElement;

  const requestNumber =
    `#${request.id_solicitacao}`;

  elements.detailId.textContent =
    requestNumber;

  elements.detailIdSecondary.textContent =
    requestNumber;

  elements.detailStatus.replaceChildren(
    createStatusBadge(
      request.status_solicitacao
    )
  );

  elements.detailName.textContent =
    request.nome_completo ||
    "Não informado";

  elements.detailEmail.textContent =
    request.email_normalizado ||
    "Não informado";

  elements.detailRequestedAt.textContent =
    formatDateTime(
      request.solicitado_em
    );

  elements.detailUpdatedAt.textContent =
    formatDateTime(
      request.atualizado_em
    );

  elements.detailAnalyzedAt.textContent =
    request.analisado_em
      ? formatDateTime(
          request.analisado_em
        )
      : "Não analisado";

  elements.detailApprovedProfile.textContent =
    request.codigo_perfil_aprovado
      ? PROFILE_LABELS[
          request.codigo_perfil_aprovado
        ] ||
        request.codigo_perfil_aprovado
      : "Nenhum perfil atribuído";

  elements.detailJustification.textContent =
    request.justificativa_analise ||
    "Nenhuma justificativa informada.";

  configureAnalysisMode(request);

  elements.detailsModal.hidden = false;

  document.body.classList.add(
    "modal-open"
  );

  window.requestAnimationFrame(
    () => {
      elements.closeModalButton.focus();
    }
  );
}

/**
 * Fecha o modal.
 */
function closeModal() {
  if (elements.detailsModal.hidden) {
    return;
  }

  elements.detailsModal.hidden = true;

  document.body.classList.remove(
    "modal-open"
  );

  resetAnalysisForm();

  state.selectedRequest = null;

  if (
    state.lastFocusedElement instanceof
      HTMLElement &&
    document.contains(
      state.lastFocusedElement
    )
  ) {
    state.lastFocusedElement.focus();
  }

  state.lastFocusedElement = null;
}

/**
 * Obtém a decisão selecionada pelo gestor.
 */
function getSelectedDecision() {
  if (elements.decisionApprove.checked) {
    return "APROVAR";
  }

  if (elements.decisionReject.checked) {
    return "REJEITAR";
  }

  return null;
}

/**
 * Ajusta os campos conforme a decisão selecionada.
 */
function handleDecisionChange() {
  const selectedDecision =
    getSelectedDecision();

  const approveSelected =
    selectedDecision === "APROVAR";

  elements.approvedProfileSelect.disabled =
    !approveSelected;

  if (!approveSelected) {
    elements.approvedProfileSelect.value =
      "";
  }

  elements.analysisJustification.disabled =
    !selectedDecision;

  hideFormMessage();
  validateDecisionForm();
}

/**
 * Valida visualmente o formulário.
 *
 * O botão permanece desabilitado enquanto as operações
 * seguras do backend não forem implementadas.
 */
function validateDecisionForm() {
  const requestIsPending =
    state.selectedRequest
      ?.status_solicitacao ===
    "PENDENTE";

  if (!requestIsPending) {
    updateConfirmButton(
      false,
      null,
      "Solicitação já analisada"
    );

    return;
  }

  const selectedDecision =
    getSelectedDecision();

  const justification =
    elements.analysisJustification
      .value
      .trim();

  const profile =
    elements.approvedProfileSelect
      .value;

  if (!selectedDecision) {
    updateConfirmButton(
      false,
      null,
      "Selecione uma decisão"
    );

    return;
  }

  const validJustification =
    justification.length >=
      JUSTIFICATION_MIN_LENGTH &&
    justification.length <=
      JUSTIFICATION_MAX_LENGTH;

  const validApproval =
    selectedDecision === "APROVAR" &&
    Boolean(profile) &&
    validJustification;

  const validRejection =
    selectedDecision === "REJEITAR" &&
    validJustification;

  const isValid =
    validApproval ||
    validRejection;

  const buttonText =
    selectedDecision === "APROVAR"
      ? "Aprovar solicitação"
      : "Rejeitar solicitação";

  /*
   * O botão permanece desabilitado até a criação da RPC
   * de rejeição e da Edge Function de aprovação.
   */
  updateConfirmButton(
    false,
    selectedDecision,
    buttonText
  );

  if (isValid) {
    elements.confirmDecisionButton.title =
      "Operação aguardando implementação segura no backend";
  }
}

/**
 * Atualiza texto, estado e estilo do botão contextual.
 */
function updateConfirmButton(
  enabled,
  decision,
  text
) {
  const button =
    elements.confirmDecisionButton;

  button.disabled = !enabled;

  button.setAttribute(
    "aria-disabled",
    String(!enabled)
  );

  button.textContent = text;

  if (decision) {
    button.dataset.decision = decision;
  } else {
    button.removeAttribute(
      "data-decision"
    );
  }
}

/**
 * Atualiza o contador da justificativa.
 */
function updateJustificationCounter() {
  elements.justificationCounter.textContent =
    `${elements.analysisJustification.value.length} / ` +
    `${JUSTIFICATION_MAX_LENGTH}`;

  validateDecisionForm();
}

/**
 * A persistência permanece indisponível nesta etapa.
 */
function handleDecisionSubmit() {
  showFormMessage(
    "A confirmação ainda não está disponível. " +
    "Primeiro serão implantadas e homologadas " +
    "as operações seguras do backend."
  );
}

/**
 * Encerra a sessão.
 */
async function handleLogout() {
  elements.logoutButton.disabled = true;

  try {
    const { error } =
      await supabase.auth.signOut({
        scope: "local"
      });

    if (error) {
      throw error;
    }

    redirectToLogin();
  } catch (error) {
    console.error(
      "Erro ao encerrar a sessão:",
      error
    );

    elements.logoutButton.disabled =
      false;

    showPageMessage(
      "Não foi possível encerrar a sessão. Tente novamente."
    );
  }
}

/**
 * Aplica o filtro selecionado.
 */
async function handleFilterSubmit(event) {
  event.preventDefault();

  state.status =
    elements.statusFilter.value;

  state.offset = 0;

  await fetchRequestsList();
}

/**
 * Abre a página anterior.
 */
async function handlePreviousPage() {
  if (
    state.loading ||
    state.offset === 0
  ) {
    return;
  }

  state.offset = Math.max(
    0,
    state.offset - state.limit
  );

  await fetchRequestsList();
}

/**
 * Abre a próxima página.
 */
async function handleNextPage() {
  if (
    state.loading ||
    state.offset + state.limit >=
      state.totalRecords
  ) {
    return;
  }

  state.offset += state.limit;

  await fetchRequestsList();
}

/**
 * Registra os eventos da interface.
 */
function setupEventListeners() {
  elements.themeToggleButton.addEventListener(
    "click",
    toggleTheme
  );

  elements.logoutButton.addEventListener(
    "click",
    handleLogout
  );

  elements.filterForm.addEventListener(
    "submit",
    handleFilterSubmit
  );

  elements.refreshButton.addEventListener(
    "click",
    fetchRequestsList
  );

  elements.previousPageButton.addEventListener(
    "click",
    handlePreviousPage
  );

  elements.nextPageButton.addEventListener(
    "click",
    handleNextPage
  );

  elements.closeModalButton.addEventListener(
    "click",
    closeModal
  );

  elements.cancelAnalysisButton.addEventListener(
    "click",
    closeModal
  );

  elements.decisionApprove.addEventListener(
    "change",
    handleDecisionChange
  );

  elements.decisionReject.addEventListener(
    "change",
    handleDecisionChange
  );

  elements.approvedProfileSelect.addEventListener(
    "change",
    validateDecisionForm
  );

  elements.analysisJustification.addEventListener(
    "input",
    updateJustificationCounter
  );

  elements.confirmDecisionButton.addEventListener(
    "click",
    handleDecisionSubmit
  );

  elements.detailsModal.addEventListener(
    "click",
    (event) => {
      if (
        event.target ===
        elements.detailsModal
      ) {
        closeModal();
      }
    }
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Escape" &&
        !elements.detailsModal.hidden
      ) {
        closeModal();
      }
    }
  );
}

/**
 * Inicializa a página protegida.
 */
async function initializePage() {
  try {
    cacheDOMElements();
    validatePageElements();
    initializeTheme();
    setupEventListeners();

    const session =
      await validateUserSession();

    if (!session) {
      return;
    }

    await loadFunctionalContext();

    elements.pageLoading.hidden = true;
    elements.protectedContent.hidden = false;

    await fetchRequestsList();

    elements.mainContent.focus();
  } catch (error) {
    console.error(
      "Falha ao inicializar a página:",
      {
        code: error?.code,
        reason: error?.reason,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack
      }
    );

    if (
      error?.message ===
      "PAGE_STRUCTURE_INVALID"
    ) {
      elements.pageLoading.hidden = true;
      elements.protectedContent.hidden = true;

      document.body.textContent =
        "Não foi possível carregar a estrutura da página.";

      return;
    }

    if (
      error?.reason ===
      "UNAUTHORIZED_PROFILE"
    ) {
      redirectUnauthorizedProfile();
      return;
    }

    if (
      error?.reason ===
      "NO_FUNCTIONAL_CONTEXT"
    ) {
      await supabase.auth.signOut({
        scope: "local"
      });

      redirectToLogin();
      return;
    }

    if (
      error?.status === 401 ||
      error?.code === "28000" ||
      String(error?.message || "")
        .toLowerCase()
        .includes("jwt")
    ) {
      await supabase.auth.signOut({
        scope: "local"
      });

      redirectToLogin();
      return;
    }

    elements.pageLoading.hidden = true;
    elements.protectedContent.hidden = false;

    showPageMessage(
      "Não foi possível estabelecer conexão com o servidor. " +
      "Verifique sua rede e tente novamente."
    );
  }
}

document.addEventListener(
  "DOMContentLoaded",
  initializePage
);
