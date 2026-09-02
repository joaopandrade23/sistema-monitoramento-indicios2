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

  loading: false,
  submittingDecision: false
};

let elements = {};

/**
 * Armazena todas as referências necessárias do DOM.
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
    themeToggleButton: document.getElementById("theme-toggle-button"),
    themeToggleIcon: document.getElementById("theme-toggle-icon"),
    themeToggleText: document.getElementById("theme-toggle-text"),
    refreshButton: document.getElementById("refresh-button"),
    pendingSummary: document.getElementById("pending-requests-summary"),
    oldestSummary: document.getElementById("oldest-request-summary"),
    oldestDescription: document.getElementById("oldest-request-description"),
    visibleSummary: document.getElementById("visible-records-summary"),
    filterSummary: document.getElementById("current-filter-summary"),
    recordsCounter: document.getElementById("records-counter"),
    filterForm: document.getElementById("filter-form"),
    statusFilter: document.getElementById("status-filter"),
    applyFilterButton: document.getElementById("apply-filter-button"),
    listLoading: document.getElementById("list-loading"),
    emptyState: document.getElementById("empty-state"),
    tableRegion: document.getElementById("table-region"),
    tableBody: document.getElementById("requests-table-body"),
    paginationDescription: document.getElementById("pagination-description"),
    paginationIndicator: document.getElementById("pagination-indicator"),
    previousPageButton: document.getElementById("previous-page-button"),
    nextPageButton: document.getElementById("next-page-button"),
    detailsModal: document.getElementById("details-modal"),
    analysisModal: document.querySelector("#details-modal .analysis-modal"),
    closeModalButton: document.getElementById("close-modal-button"),
    cancelAnalysisButton: document.getElementById("cancel-analysis-button"),
    detailId: document.getElementById("detail-id"),
    detailIdSecondary: document.getElementById("detail-id-secondary"),
    detailStatus: document.getElementById("detail-status"),
    detailRequestedAt: document.getElementById("detail-requested-at"),
    detailUpdatedAt: document.getElementById("detail-updated-at"),
    detailAnalyzedAt: document.getElementById("detail-analyzed-at"),
    detailName: document.getElementById("detail-name"),
    detailEmail: document.getElementById("detail-email"),
    detailApprovedProfile: document.getElementById("detail-approved-profile"),
    detailJustification: document.getElementById("detail-justification"),
    decisionPanelDescription: document.getElementById("decision-panel-description"),
    analysisForm: document.getElementById("analysis-form"),
    decisionFieldset: document.getElementById("decision-fieldset"),
    decisionApprove: document.getElementById("decision-approve"),
    decisionReject: document.getElementById("decision-reject"),
    decisionApproveOption: document.getElementById("decision-approve-option"),
    decisionRejectOption: document.getElementById("decision-reject-option"),
    approvedProfileField: document.getElementById("approved-profile-field"),
    approvedProfileSelect: document.getElementById("approved-profile"),
    analysisJustificationField: document.getElementById("analysis-justification-field"),
    analysisJustification: document.getElementById("analysis-justification"),
    analysisJustificationHelp: document.getElementById("analysis-justification-help"),
    justificationCounter: document.getElementById("justification-counter"),
    analysisFormMessage: document.getElementById("analysis-form-message"),
    analysisInformation: document.getElementById("analysis-information"),
    analysisInformationTitle: document.getElementById("analysis-information-title"),
    analysisInformationText: document.getElementById("analysis-information-text"),
    decisionConfirmationArea: document.getElementById("decision-confirmation-area"),
    confirmDecisionButton: document.getElementById("confirm-decision-button")
  };
}

/**
 * Verifica se todos os elementos necessários estão presentes no HTML.
 */
function validatePageElements() {
  const missingElements = Object.entries(elements)
    .filter(([, element]) => !element)
    .map(([name]) => name);

  if (missingElements.length > 0) {
    console.error("Elementos ausentes no HTML:", missingElements);
    throw new Error("PAGE_STRUCTURE_INVALID");
  }
}

/**
 * Obtém o tema preferido.
 */
function getPreferredTheme() {
  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }
  } catch (error) {
    console.warn("Não foi possível recuperar a preferência de tema:", error);
  }

  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
}

/**
 * Aplica o tema visual.
 */
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
  elements.themeToggleText.textContent = darkModeActive ? "Modo claro" : "Modo escuro";
}

/**
 * Inicializa o tema.
 */
function initializeTheme() {
  applyTheme(getPreferredTheme());
}

/**
 * Alterna entre os temas.
 */
function toggleTheme() {
  const currentTheme = document.documentElement.dataset.theme || "light";
  const nextTheme = currentTheme === "dark" ? "light" : "dark";

  try {
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  } catch (error) {
    console.warn("Não foi possível salvar a preferência de tema:", error);
  }

  applyTheme(nextTheme);
}

/**
 * Retorna o rótulo do status.
 */
function getStatusLabel(status) {
  return STATUS_LABELS[status] ?? status ?? "Não informado";
}

/**
 * Retorna a classe visual do status.
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
 * Cria um marcador visual de status.
 */
function createStatusBadge(status) {
  const badge = document.createElement("span");
  badge.className = `status-badge ${getStatusClass(status)}`;
  badge.textContent = getStatusLabel(status);
  return badge;
}

/**
 * Formata uma data para o horário de Fortaleza.
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
 * Calcula o tempo aproximado de espera.
 */
function getWaitingDays(value) {
  if (!value) {
    return null;
  }

  const requestedDate = new Date(value);
  if (Number.isNaN(requestedDate.getTime())) {
    return null;
  }

  return Math.max(0, Math.floor((Date.now() - requestedDate.getTime()) / 86400000));
}

/**
 * Retorna o número da página atual.
 */
function getCurrentPage() {
  return Math.floor(state.offset / state.limit) + 1;
}

/**
 * Retorna o total de páginas.
 */
function getTotalPages() {
  return Math.max(1, Math.ceil(state.totalRecords / state.limit));
}

/**
 * Exibe uma mensagem geral da página.
 */
function showPageMessage(message, type = "error") {
  elements.pageMessage.textContent = message;
  elements.pageMessage.classList.toggle("success", type === "success");
  elements.pageMessage.hidden = false;
}

/**
 * Oculta a mensagem geral.
 */
function hidePageMessage() {
  elements.pageMessage.textContent = "";
  elements.pageMessage.classList.remove("success");
  elements.pageMessage.hidden = true;
}

/**
 * Exibe uma mensagem no formulário.
 */
function showFormMessage(message, type = "error") {
  elements.analysisFormMessage.textContent = message;
  elements.analysisFormMessage.classList.toggle("success", type === "success");
  elements.analysisFormMessage.hidden = false;
}

/**
 * Oculta a mensagem do formulário.
 */
function hideFormMessage() {
  elements.analysisFormMessage.textContent = "";
  elements.analysisFormMessage.classList.remove("success");
  elements.analysisFormMessage.hidden = true;
}

/**
 * Controla o carregamento da lista.
 */
function setListLoading(isLoading) {
  state.loading = isLoading;

  elements.listLoading.hidden = !isLoading;
  elements.refreshButton.disabled = isLoading;
  elements.applyFilterButton.disabled = isLoading;
  elements.statusFilter.disabled = isLoading;

  elements.refreshButton.setAttribute("aria-busy", String(isLoading));
  elements.applyFilterButton.setAttribute("aria-busy", String(isLoading));

  elements.previousPageButton.disabled = true;
  elements.nextPageButton.disabled = true;

  if (isLoading) {
    elements.emptyState.hidden = true;
    elements.tableRegion.hidden = true;
  }
}

/**
 * Redireciona o usuário para o login.
 */
function redirectToLogin() {
  window.location.replace("./index.html");
}

/**
 * Redireciona um perfil não autorizado.
 */
function redirectUnauthorizedProfile() {
  window.location.replace("./inicio.html");
}

/**
 * Valida a sessão autenticada.
 */
async function validateUserSession() {
  elements.loadingMessage.textContent = "Validando sua sessão...";

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
 * Carrega e valida o contexto funcional.
 */
async function loadFunctionalContext() {
  elements.loadingMessage.textContent = "Validando seu perfil funcional...";

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
    const contextError = new Error("NO_FUNCTIONAL_CONTEXT");
    contextError.code = "42501";
    contextError.reason = "NO_FUNCTIONAL_CONTEXT";
    throw contextError;
  }

  if (data.codigo_perfil !== AUTHORIZED_PROFILE) {
    const profileError = new Error("UNAUTHORIZED_PROFILE");
    profileError.code = "42501";
    profileError.reason = "UNAUTHORIZED_PROFILE";
    throw profileError;
  }

  state.context = data;

  elements.userName.textContent = data.nome_exibicao || "Usuário";
  elements.userProfile.textContent =
    data.nome_perfil || data.codigo_perfil || "Perfil";

  return data;
}

/**
 * Consulta a lista e o resumo das pendências.
 */
async function fetchRequestsData() {
  const requestsPromise = supabase
    .schema("api")
    .rpc("listar_solicitacoes_acesso", {
      p_status: state.status || null,
      p_limite: state.limit,
      p_deslocamento: state.offset
    });

  const pendingSummaryPromise = supabase
    .schema("api")
    .rpc("listar_solicitacoes_acesso", {
      p_status: "PENDENTE",
      p_limite: 1,
      p_deslocamento: 0
    });

  const [requestsResult, pendingResult] = await Promise.all([
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
    requests: Array.isArray(requestsResult.data) ? requestsResult.data : [],
    pending: Array.isArray(pendingResult.data) ? pendingResult.data : []
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
    const result = await fetchRequestsData();

    state.requests = result.requests;
    state.totalRecords = Number(result.requests[0]?.total_registros ?? 0);
    state.pendingTotal = Number(result.pending[0]?.total_registros ?? 0);
    state.oldestPendingAt = result.pending[0]?.solicitado_em ?? null;

    if (state.requests.length === 0 && state.offset > 0) {
      state.offset = 0;
      reloadFirstPage = true;
    } else {
      renderTablePage();
    }
  } catch (error) {
    console.error("Erro ao consultar solicitações:", {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint
    });

    state.requests = [];
    state.totalRecords = 0;

    renderTablePage();
    showPageMessage("Não foi possível carregar as solicitações.");
  } finally {
    setListLoading(false);
    updatePagination();
  }

  if (reloadFirstPage) {
    await fetchRequestsList();
  }
}

/**
 * Cria uma célula da tabela.
 */
function createTableCell(content) {
  const cell = document.createElement("td");

  if (content instanceof Node) {
    cell.append(content);
  } else {
    cell.textContent = String(content ?? "");
  }

  return cell;
}

/**
 * Define o texto do botão de detalhes.
 */
function getDetailsButtonLabel(status) {
  if (status === "PENDENTE") {
    return "Analisar";
  }

  if (status === "APROVADA" || status === "REJEITADA") {
    return "Ver análise";
  }

  return "Ver detalhes";
}

/**
 * Cria o botão que abre o modal.
 */
function createDetailsButton(request) {
  const button = document.createElement("button");
  const label = getDetailsButtonLabel(request.status_solicitacao);

  button.type = "button";
  button.className = "details-button";
  button.textContent = label;
  button.setAttribute(
    "aria-label",
    `${label} da solicitação ${request.id_solicitacao}`
  );

  button.addEventListener("click", () => {
    openDetailsModal(request, button);
  });

  return button;
}

/**
 * Renderiza a página atual.
 */
function renderTablePage() {
  elements.tableBody.replaceChildren();

  if (state.requests.length === 0) {
    elements.emptyState.hidden = false;
    elements.tableRegion.hidden = true;
    updateSummaryCards();
    return;
  }

  const fragment = document.createDocumentFragment();

  state.requests.forEach((request) => {
    const row = document.createElement("tr");

    const requestNumber = document.createElement("span");
    requestNumber.className = "request-number";
    requestNumber.textContent = `#${request.id_solicitacao}`;

    const requestName = document.createElement("strong");
    requestName.className = "request-name";
    requestName.textContent = request.nome_completo || "Não informado";
    requestName.title = request.nome_completo || "";

    const requestEmail = document.createElement("span");
    requestEmail.className = "request-email";
    requestEmail.textContent = request.email_normalizado || "Não informado";
    requestEmail.title = request.email_normalizado || "";

    const actionCell = createTableCell(createDetailsButton(request));
    actionCell.style.textAlign = "right";

    row.append(
      createTableCell(requestNumber),
      createTableCell(requestName),
      createTableCell(requestEmail),
      createTableCell(formatDateTime(request.solicitado_em)),
      createTableCell(createStatusBadge(request.status_solicitacao)),
      actionCell
    );

    fragment.append(row);
  });

  elements.tableBody.append(fragment);

  elements.emptyState.hidden = true;
  elements.tableRegion.hidden = false;

  updateSummaryCards();
}

/**
 * Atualiza os cartões administrativos.
 */
function updateSummaryCards() {
  const waitingDays = getWaitingDays(state.oldestPendingAt);
  const currentStatusLabel = state.status
    ? getStatusLabel(state.status)
    : "Todos os status";

  elements.pendingSummary.textContent = state.pendingTotal.toLocaleString("pt-BR");

  if (state.oldestPendingAt) {
    elements.oldestSummary.textContent = formatDateTime(state.oldestPendingAt);

    if (waitingDays === null) {
      elements.oldestDescription.textContent =
        "Não foi possível calcular o tempo de espera";
    } else if (waitingDays === 0) {
      elements.oldestDescription.textContent = "Recebida hoje";
    } else if (waitingDays === 1) {
      elements.oldestDescription.textContent = "Aguardando análise há 1 dia";
    } else {
      elements.oldestDescription.textContent = `Aguardando análise há ${waitingDays} dias`;
    }
  } else {
    elements.oldestSummary.textContent = "Nenhuma";
    elements.oldestDescription.textContent = "Não existem solicitações pendentes";
  }

  elements.visibleSummary.textContent = `${state.requests.length} de ${state.limit}`;
  elements.filterSummary.textContent = `Filtro: ${currentStatusLabel}`;
  elements.recordsCounter.textContent =
    state.totalRecords === 1
      ? "1 registro"
      : `${state.totalRecords.toLocaleString("pt-BR")} registros`;
}

/**
 * Atualiza a paginação.
 */
function updatePagination() {
  const currentPage = getCurrentPage();
  const totalPages = getTotalPages();
  const firstRecord = state.totalRecords === 0 ? 0 : state.offset + 1;
  const lastRecord = Math.min(
    state.offset + state.requests.length,
    state.totalRecords
  );

  elements.paginationDescription.textContent =
    state.totalRecords === 0
      ? "Nenhum registro exibido."
      : `Exibindo ${firstRecord} a ${lastRecord} de ${state.totalRecords.toLocaleString(
          "pt-BR"
        )} solicitações.`;

  elements.paginationIndicator.textContent = `Página ${currentPage} de ${totalPages}`;

  elements.previousPageButton.disabled = state.loading || state.offset === 0;
  elements.nextPageButton.disabled =
    state.loading || state.offset + state.limit >= state.totalRecords;
}

/**
 * Restaura o modal ao estado inicial.
 */
function resetAnalysisForm() {
  state.submittingDecision = false;

  elements.analysisForm.reset();
  elements.analysisForm.removeAttribute("data-mode");

  elements.decisionFieldset.disabled = true;
  elements.decisionApprove.checked = false;
  elements.decisionReject.checked = false;

  elements.approvedProfileField.hidden = false;
  elements.approvedProfileSelect.disabled = true;
  elements.approvedProfileSelect.value = "";

  elements.analysisJustificationField.hidden = false;
  elements.analysisJustification.disabled = true;
  elements.analysisJustification.readOnly = false;
  elements.analysisJustification.value = "";
  elements.analysisJustification.placeholder =
    "Informe o motivo da aprovação ou da rejeição desta solicitação.";

  elements.analysisJustificationHelp.hidden = false;
  elements.justificationCounter.hidden = false;
  elements.justificationCounter.textContent = `0 / ${JUSTIFICATION_MAX_LENGTH}`;

  elements.decisionConfirmationArea.hidden = false;
  elements.confirmDecisionButton.disabled = true;
  elements.confirmDecisionButton.setAttribute("aria-disabled", "true");
  elements.confirmDecisionButton.removeAttribute("data-decision");
  elements.confirmDecisionButton.textContent = "Selecione uma decisão";
  elements.confirmDecisionButton.title = "Selecione uma decisão";

  elements.decisionPanelDescription.textContent =
    "Defina o resultado da análise desta solicitação.";
  elements.analysisInformationTitle.textContent = "Operação protegida";
  elements.analysisInformationText.textContent =
    "A decisão selecionada é registrada por uma operação segura no backend e atualizará o acesso do usuário conforme a regra de perfil.";

  elements.analysisModal.classList.remove("is-processing");
  elements.closeModalButton.disabled = false;
  elements.cancelAnalysisButton.disabled = false;

  hideFormMessage();
}

/**
 * Configura uma solicitação pendente.
 */
function configurePendingMode() {
  elements.analysisForm.dataset.mode = "analysis-pending";

  elements.decisionFieldset.disabled = false;
  elements.approvedProfileField.hidden = false;
  elements.approvedProfileSelect.disabled = true;

  elements.analysisJustificationField.hidden = false;
  elements.analysisJustification.disabled = true;
  elements.analysisJustification.readOnly = false;
  elements.analysisJustification.value = "";

  elements.analysisJustificationHelp.hidden = false;
  elements.justificationCounter.hidden = false;
  elements.decisionConfirmationArea.hidden = false;

  elements.decisionPanelDescription.textContent =
    "Defina o resultado da análise desta solicitação.";
  elements.analysisInformationTitle.textContent = "Operação protegida";
  elements.analysisInformationText.textContent =
    "A aprovação ou rejeição é registrada por uma operação segura no backend.";
}

/**
 * Configura uma solicitação rejeitada.
 */
function configureRejectedMode(request) {
  elements.analysisForm.dataset.mode = "read-only-rejected";

  elements.decisionApprove.checked = false;
  elements.decisionReject.checked = true;
  elements.decisionFieldset.disabled = true;

  elements.approvedProfileField.hidden = true;
  elements.approvedProfileSelect.disabled = true;

  elements.analysisJustificationField.hidden = false;
  elements.analysisJustification.disabled = false;
  elements.analysisJustification.readOnly = true;
  elements.analysisJustification.value =
    request.justificativa_analise || "Nenhuma justificativa informada.";
  elements.analysisJustification.placeholder = "";

  elements.justificationCounter.hidden = true;
  elements.analysisJustificationHelp.hidden = true;
  elements.decisionConfirmationArea.hidden = true;

  elements.decisionPanelDescription.textContent =
    "Consulte a decisão registrada para esta solicitação.";
  elements.analysisInformationTitle.textContent = "Solicitação rejeitada";
  elements.analysisInformationText.textContent =
    "A decisão foi registrada no backend e não pode ser alterada por esta tela.";
}

/**
 * Configura uma solicitação aprovada.
 */
function configureApprovedMode(request) {
  elements.analysisForm.dataset.mode = "read-only-approved";

  elements.decisionApprove.checked = true;
  elements.decisionReject.checked = false;
  elements.decisionFieldset.disabled = true;

  elements.approvedProfileField.hidden = false;
  elements.approvedProfileSelect.disabled = true;
  elements.approvedProfileSelect.value = request.codigo_perfil_aprovado || "";

  elements.analysisJustificationField.hidden = false;
  elements.analysisJustification.disabled = false;
  elements.analysisJustification.readOnly = true;
  elements.analysisJustification.value =
    request.justificativa_analise || "Nenhuma justificativa informada.";
  elements.analysisJustification.placeholder = "";

  elements.justificationCounter.hidden = true;
  elements.analysisJustificationHelp.hidden = true;
  elements.decisionConfirmationArea.hidden = true;

  elements.decisionPanelDescription.textContent =
    "Consulte a decisão registrada para esta solicitação.";
  elements.analysisInformationTitle.textContent = "Solicitação aprovada";
  elements.analysisInformationText.textContent =
    "A aprovação foi registrada. O perfil concedido é apresentado em modo somente leitura.";
}

/**
 * Configura outros estados históricos.
 */
function configureNeutralReadOnlyMode(request) {
  elements.analysisForm.dataset.mode = "read-only-neutral";

  elements.decisionFieldset.disabled = true;
  elements.approvedProfileField.hidden = true;
  elements.analysisJustificationField.hidden = true;
  elements.decisionConfirmationArea.hidden = true;

  elements.decisionPanelDescription.textContent =
    "Esta solicitação não está disponível para análise.";
  elements.analysisInformationTitle.textContent = getStatusLabel(
    request.status_solicitacao
  );
  elements.analysisInformationText.textContent =
    "A solicitação está em modo somente leitura.";
}

/**
 * Configura o modo do modal conforme o status.
 */
function configureAnalysisMode(request) {
  resetAnalysisForm();

  switch (request.status_solicitacao) {
    case "PENDENTE":
      configurePendingMode();
      break;
    case "REJEITADA":
      configureRejectedMode(request);
      break;
    case "APROVADA":
      configureApprovedMode(request);
      break;
    default:
      configureNeutralReadOnlyMode(request);
      break;
  }
}

/**
 * Abre o modal.
 */
function openDetailsModal(request, triggerElement = null) {
  state.selectedRequest = request;
  state.lastFocusedElement = triggerElement || document.activeElement;

  const requestNumber = `#${request.id_solicitacao}`;

  elements.detailId.textContent = requestNumber;
  elements.detailIdSecondary.textContent = requestNumber;

  elements.detailStatus.replaceChildren(
    createStatusBadge(request.status_solicitacao)
  );

  elements.detailName.textContent = request.nome_completo || "Não informado";
  elements.detailEmail.textContent = request.email_normalizado || "Não informado";

  elements.detailRequestedAt.textContent = formatDateTime(request.solicitado_em);
  elements.detailUpdatedAt.textContent = formatDateTime(request.atualizado_em);
  elements.detailAnalyzedAt.textContent = request.analisado_em
    ? formatDateTime(request.analisado_em)
    : "Não analisado";

  elements.detailApprovedProfile.textContent = request.codigo_perfil_aprovado
    ? PROFILE_LABELS[request.codigo_perfil_aprovado] ||
      request.codigo_perfil_aprovado
    : "Nenhum perfil atribuído";

  elements.detailJustification.textContent =
    request.justificativa_analise || "Nenhuma justificativa informada.";

  configureAnalysisMode(request);

  elements.detailsModal.hidden = false;
  document.body.classList.add("modal-open");

  window.requestAnimationFrame(() => {
    elements.closeModalButton.focus();
  });
}

/**
 * Fecha o modal.
 */
function closeModal() {
  if (elements.detailsModal.hidden || state.submittingDecision) {
    return;
  }

  elements.detailsModal.hidden = true;
  document.body.classList.remove("modal-open");

  resetAnalysisForm();

  state.selectedRequest = null;

  if (
    state.lastFocusedElement instanceof HTMLElement &&
    document.contains(state.lastFocusedElement)
  ) {
    state.lastFocusedElement.focus();
  }

  state.lastFocusedElement = null;
}

/**
 * Retorna a decisão selecionada.
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
 * Trata a escolha da decisão.
 */
function handleDecisionChange() {
  if (
    state.submittingDecision ||
    state.selectedRequest?.status_solicitacao !== "PENDENTE"
  ) {
    return;
  }

  const selectedDecision = getSelectedDecision();
  const approveSelected = selectedDecision === "APROVAR";

  elements.approvedProfileSelect.disabled = !approveSelected;

  if (!approveSelected) {
    elements.approvedProfileSelect.value = "";
  }

  elements.analysisJustification.disabled = !selectedDecision;

  hideFormMessage();
  validateDecisionForm();
}

/**
 * Avalia os campos e atualiza o botão contextual.
 */
function validateDecisionForm() {
  const requestIsPending =
    state.selectedRequest?.status_solicitacao === "PENDENTE";

  if (!requestIsPending) {
    elements.decisionConfirmationArea.hidden = true;
    return;
  }

  const selectedDecision = getSelectedDecision();
  const justification = elements.analysisJustification.value.trim();
  const profile = elements.approvedProfileSelect.value;

  if (!selectedDecision) {
    updateConfirmButton(
      false,
      null,
      "Selecione uma decisão",
      "Selecione uma decisão."
    );
    return;
  }

  const validJustification =
    justification.length >= JUSTIFICATION_MIN_LENGTH &&
    justification.length <= JUSTIFICATION_MAX_LENGTH;

  if (selectedDecision === "APROVAR") {
    const enabled = Boolean(profile) && validJustification && !state.submittingDecision;
    const buttonText = state.submittingDecision
      ? "Registrando aprovação..."
      : "Aprovar solicitação";

    let title = "Confirmar aprovação da solicitação";
    if (!profile) {
      title = "Selecione o perfil de acesso.";
    } else if (!validJustification) {
      title = `Informe uma justificativa com pelo menos ${JUSTIFICATION_MIN_LENGTH} caracteres.`;
    }

    updateConfirmButton(enabled, "APROVAR", buttonText, title);
    return;
  }

  if (selectedDecision === "REJEITAR") {
    const enabled = validJustification && !state.submittingDecision;
    const buttonText = state.submittingDecision
      ? "Registrando rejeição..."
      : "Rejeitar solicitação";

    const title = validJustification
      ? "Confirmar rejeição da solicitação"
      : `Informe uma justificativa com pelo menos ${JUSTIFICATION_MIN_LENGTH} caracteres.`;

    updateConfirmButton(enabled, "REJEITAR", buttonText, title);
  }
}

/**
 * Atualiza o botão contextual.
 */
function updateConfirmButton(enabled, decision, text, title = "") {
  const button = elements.confirmDecisionButton;

  button.disabled = !enabled;
  button.setAttribute("aria-disabled", String(!enabled));
  button.textContent = text;
  button.title = title || text;

  if (decision) {
    button.dataset.decision = decision;
  } else {
    button.removeAttribute("data-decision");
  }
}

/**
 * Atualiza o contador da justificativa.
 */
function updateJustificationCounter() {
  const currentLength = elements.analysisJustification.value.length;

  elements.justificationCounter.textContent = `${currentLength} / ${JUSTIFICATION_MAX_LENGTH}`;

  validateDecisionForm();
}

/**
 * Converte erros da RPC de aprovação em mensagens funcionais.
 */
function getApprovalErrorMessage(error) {
  switch (error?.code) {
    case "22023":
      return error.message || "Os dados informados para aprovação não são válidos.";
    case "42501":
      return "Seu perfil não possui autorização para aprovar esta solicitação.";
    case "P0002":
      return "A solicitação não foi encontrada. Atualize a lista e tente novamente.";
    case "P0001":
      return error.message || "A solicitação já foi analisada.";
    case "40001":
      return "A solicitação foi alterada por outra operação. Atualize a lista e tente novamente.";
    default:
      break;
  }

  if (
    error?.status === 401 ||
    error?.code === "28000" ||
    String(error?.message || "").toLowerCase().includes("jwt")
  ) {
    return "Sua sessão expirou. Entre novamente no sistema.";
  }

  return "Não foi possível registrar a aprovação. Atualize a lista e tente novamente.";
}

/**
 * Converte erros da RPC de rejeição em mensagens funcionais.
 */
function getRejectionErrorMessage(error) {
  switch (error?.code) {
    case "22023":
      return error.message || "A justificativa informada não é válida.";
    case "42501":
      return "Seu perfil não possui autorização para rejeitar esta solicitação.";
    case "P0002":
      return "A solicitação não foi encontrada. Atualize a lista e tente novamente.";
    case "P0001":
      return error.message || "A solicitação já foi analisada.";
    case "40001":
      return "A solicitação foi alterada por outra operação. Atualize a lista e tente novamente.";
    default:
      break;
  }

  if (
    error?.status === 401 ||
    error?.code === "28000" ||
    String(error?.message || "").toLowerCase().includes("jwt")
  ) {
    return "Sua sessão expirou. Entre novamente no sistema.";
  }

  return "Não foi possível registrar a rejeição. Atualize a lista e tente novamente.";
}

/**
 * Registra a aprovação pela RPC segura.
 */
async function approveSelectedRequest() {
  const request = state.selectedRequest;
  const justification = elements.analysisJustification.value.trim();
  const approvedProfile = elements.approvedProfileSelect.value;

  if (!request) {
    showFormMessage("Nenhuma solicitação foi selecionada.");
    return;
  }

  if (request.status_solicitacao !== "PENDENTE") {
    showFormMessage("Esta solicitação não está mais pendente. Atualize a lista.");
    return;
  }

  if (!approvedProfile) {
    showFormMessage("Selecione um perfil de acesso.");
    elements.approvedProfileSelect.focus();
    return;
  }

  if (
    justification.length < JUSTIFICATION_MIN_LENGTH ||
    justification.length > JUSTIFICATION_MAX_LENGTH
  ) {
    showFormMessage(
      `Informe uma justificativa entre ${JUSTIFICATION_MIN_LENGTH} e ${JUSTIFICATION_MAX_LENGTH} caracteres.`
    );
    elements.analysisJustification.focus();
    return;
  }

  const requestId = request.id_solicitacao;
  state.submittingDecision = true;

  hideFormMessage();

  elements.analysisModal.classList.add("is-processing");
  elements.closeModalButton.disabled = true;
  elements.cancelAnalysisButton.disabled = true;
  elements.decisionFieldset.disabled = true;
  elements.approvedProfileSelect.disabled = true;
  elements.analysisJustification.disabled = true;

  updateConfirmButton(
    false,
    "APROVAR",
    "Registrando aprovação...",
    "Registrando aprovação"
  );

  try {
    const { data, error } = await supabase
      .schema("api")
      .rpc("aprovar_solicitacao_acesso", {
        p_id_solicitacao: requestId,
        p_codigo_perfil: approvedProfile,
        p_justificativa: justification
      });

    if (error) {
      throw error;
    }

    const approvedRequest = Array.isArray(data) ? data[0] ?? null : data;

    if (!approvedRequest || approvedRequest.status_solicitacao !== "APROVADA") {
      throw new Error("INVALID_APPROVAL_RESPONSE");
    }

    request.status_solicitacao = "APROVADA";
    request.codigo_perfil_aprovado =
      approvedRequest.codigo_perfil_aprovado ?? approvedProfile;
    request.justificativa_analise =
      approvedRequest.justificativa_analise ?? justification;
    request.analisado_em = approvedRequest.analisado_em ?? new Date().toISOString();
    request.atualizado_em = approvedRequest.analisado_em ?? new Date().toISOString();

    state.submittingDecision = false;

    elements.analysisModal.classList.remove("is-processing");

    closeModal();

    await fetchRequestsList();

    showPageMessage(
      `A solicitação #${requestId} foi aprovada com sucesso.`,
      "success"
    );
  } catch (error) {
    console.error("Erro ao aprovar solicitação:", {
      code: error?.code,
      status: error?.status,
      message: error?.message,
      details: error?.details,
      hint: error?.hint
    });

    state.submittingDecision = false;

    elements.analysisModal.classList.remove("is-processing");
    elements.closeModalButton.disabled = false;
    elements.cancelAnalysisButton.disabled = false;

    if (state.selectedRequest?.status_solicitacao === "PENDENTE") {
      elements.decisionFieldset.disabled = false;
      elements.analysisJustification.disabled = false;
      elements.approvedProfileSelect.disabled =
        getSelectedDecision() !== "APROVAR";
    }

    showFormMessage(getApprovalErrorMessage(error));
    validateDecisionForm();
  }
}

/**
 * Registra a rejeição pela RPC segura.
 */
async function rejectSelectedRequest() {
  const request = state.selectedRequest;
  const justification = elements.analysisJustification.value.trim();

  if (!request) {
    showFormMessage("Nenhuma solicitação foi selecionada.");
    return;
  }

  if (request.status_solicitacao !== "PENDENTE") {
    showFormMessage("Esta solicitação não está mais pendente. Atualize a lista.");
    return;
  }

  if (
    justification.length < JUSTIFICATION_MIN_LENGTH ||
    justification.length > JUSTIFICATION_MAX_LENGTH
  ) {
    showFormMessage(
      `Informe uma justificativa entre ${JUSTIFICATION_MIN_LENGTH} e ${JUSTIFICATION_MAX_LENGTH} caracteres.`
    );
    elements.analysisJustification.focus();
    return;
  }

  const requestId = request.id_solicitacao;
  state.submittingDecision = true;

  hideFormMessage();

  elements.analysisModal.classList.add("is-processing");
  elements.closeModalButton.disabled = true;
  elements.cancelAnalysisButton.disabled = true;
  elements.decisionFieldset.disabled = true;
  elements.approvedProfileSelect.disabled = true;
  elements.analysisJustification.disabled = true;

  updateConfirmButton(
    false,
    "REJEITAR",
    "Registrando rejeição...",
    "Registrando rejeição"
  );

  try {
    const { data, error } = await supabase
      .schema("api")
      .rpc("rejeitar_solicitacao_acesso", {
        p_id_solicitacao: requestId,
        p_justificativa: justification
      });

    if (error) {
      throw error;
    }

    const rejectedRequest = Array.isArray(data) ? data[0] ?? null : data;

    if (!rejectedRequest || rejectedRequest.status_solicitacao !== "REJEITADA") {
      throw new Error("INVALID_REJECTION_RESPONSE");
    }

    request.status_solicitacao = "REJEITADA";
    request.justificativa_analise =
      rejectedRequest.justificativa_analise ?? justification;
    request.analisado_em = rejectedRequest.analisado_em ?? new Date().toISOString();
    request.atualizado_em = rejectedRequest.analisado_em ?? new Date().toISOString();

    state.submittingDecision = false;

    elements.analysisModal.classList.remove("is-processing");

    closeModal();

    await fetchRequestsList();

    showPageMessage(
      `A solicitação #${requestId} foi rejeitada com sucesso.`,
      "success"
    );
  } catch (error) {
    console.error("Erro ao rejeitar solicitação:", {
      code: error?.code,
      status: error?.status,
      message: error?.message,
      details: error?.details,
      hint: error?.hint
    });

    state.submittingDecision = false;

    elements.analysisModal.classList.remove("is-processing");
    elements.closeModalButton.disabled = false;
    elements.cancelAnalysisButton.disabled = false;

    if (state.selectedRequest?.status_solicitacao === "PENDENTE") {
      elements.decisionFieldset.disabled = false;
      elements.analysisJustification.disabled = false;
      elements.approvedProfileSelect.disabled =
        getSelectedDecision() !== "APROVAR";
    }

    showFormMessage(getRejectionErrorMessage(error));
    validateDecisionForm();
  }
}

/**
 * Trata a confirmação final.
 */
async function handleDecisionSubmit() {
  if (state.submittingDecision || !state.selectedRequest) {
    return;
  }

  const selectedDecision = getSelectedDecision();

  if (selectedDecision === "APROVAR") {
    await approveSelectedRequest();
    return;
  }

  if (selectedDecision === "REJEITAR") {
    await rejectSelectedRequest();
    return;
  }

  showFormMessage("Selecione a decisão de Aprovar ou Rejeitar para continuar.");
}

/**
 * Encerra a sessão.
 */
async function handleLogout() {
  elements.logoutButton.disabled = true;

  try {
    const { error } = await supabase.auth.signOut({ scope: "local" });

    if (error) {
      throw error;
    }

    redirectToLogin();
  } catch (error) {
    console.error("Erro ao encerrar a sessão:", error);

    elements.logoutButton.disabled = false;
    showPageMessage("Não foi possível encerrar a sessão. Tente novamente.");
  }
}

/**
 * Aplica o filtro.
 */
async function handleFilterSubmit(event) {
  event.preventDefault();

  state.status = elements.statusFilter.value;
  state.offset = 0;

  await fetchRequestsList();
}

/**
 * Atualiza a lista manualmente.
 */
async function handleRefresh() {
  await fetchRequestsList();

  if (!elements.pageMessage.hidden) {
    return;
  }

  showPageMessage("A lista foi atualizada.", "success");
}

/**
 * Abre a página anterior.
 */
async function handlePreviousPage() {
  if (state.loading || state.offset === 0) {
    return;
  }

  state.offset = Math.max(0, state.offset - state.limit);
  await fetchRequestsList();
}

/**
 * Abre a próxima página.
 */
async function handleNextPage() {
  if (state.loading || state.offset + state.limit >= state.totalRecords) {
    return;
  }

  state.offset += state.limit;
  await fetchRequestsList();
}

/**
 * Mantém o foco dentro do modal.
 */
function trapModalFocus(event) {
  if (event.key !== "Tab" || elements.detailsModal.hidden) {
    return;
  }

  const selector = [
    "button:not([disabled])",
    "a[href]",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");

  const focusableElements = [
    ...elements.detailsModal.querySelectorAll(selector)
  ].filter(
    (element) =>
      element instanceof HTMLElement &&
      !element.hidden &&
      element.getAttribute("aria-hidden") !== "true"
  );

  if (focusableElements.length === 0) {
    event.preventDefault();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
    return;
  }

  if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

/**
 * Trata as teclas usadas no modal.
 */
function handleDocumentKeydown(event) {
  if (
    event.key === "Escape" &&
    !elements.detailsModal.hidden &&
    !state.submittingDecision
  ) {
    closeModal();
    return;
  }

  trapModalFocus(event);
}

/**
 * Registra os eventos da interface.
 */
function setupEventListeners() {
  elements.themeToggleButton.addEventListener("click", toggleTheme);
  elements.logoutButton.addEventListener("click", handleLogout);
  elements.filterForm.addEventListener("submit", handleFilterSubmit);
  elements.refreshButton.addEventListener("click", handleRefresh);
  elements.previousPageButton.addEventListener("click", handlePreviousPage);
  elements.nextPageButton.addEventListener("click", handleNextPage);
  elements.closeModalButton.addEventListener("click", closeModal);
  elements.cancelAnalysisButton.addEventListener("click", closeModal);

  elements.decisionApprove.addEventListener("change", handleDecisionChange);
  elements.decisionReject.addEventListener("change", handleDecisionChange);
  elements.approvedProfileSelect.addEventListener("change", validateDecisionForm);
  elements.analysisJustification.addEventListener("input", updateJustificationCounter);
  elements.confirmDecisionButton.addEventListener("click", handleDecisionSubmit);

  elements.detailsModal.addEventListener("click", (event) => {
    if (event.target === elements.detailsModal && !state.submittingDecision) {
      closeModal();
    }
  });

  document.addEventListener("keydown", handleDocumentKeydown);
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

    const session = await validateUserSession();
    if (!session) {
      return;
    }

    await loadFunctionalContext();

    elements.pageLoading.hidden = true;
    elements.protectedContent.hidden = false;

    await fetchRequestsList();

    elements.mainContent.focus();
  } catch (error) {
    console.error("Falha ao inicializar a página:", {
      code: error?.code,
      reason: error?.reason,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack
    });

    if (error?.message === "PAGE_STRUCTURE_INVALID") {
      if (elements.pageLoading) {
        elements.pageLoading.hidden = true;
      }
      if (elements.protectedContent) {
        elements.protectedContent.hidden = true;
      }
      document.body.textContent = "Não foi possível carregar a estrutura da página.";
      return;
    }

    if (error?.reason === "UNAUTHORIZED_PROFILE") {
      redirectUnauthorizedProfile();
      return;
    }

    if (error?.reason === "NO_FUNCTIONAL_CONTEXT") {
      await supabase.auth.signOut({ scope: "local" });
      redirectToLogin();
      return;
    }

    if (
      error?.status === 401 ||
      error?.code === "28000" ||
      String(error?.message || "").toLowerCase().includes("jwt")
    ) {
      await supabase.auth.signOut({ scope: "local" });
      redirectToLogin();
      return;
    }

    if (elements.pageLoading) {
      elements.pageLoading.hidden = true;
    }

    if (elements.protectedContent) {
      elements.protectedContent.hidden = false;
    }

    showPageMessage(
      "Não foi possível estabelecer conexão com o servidor. Verifique sua rede e tente novamente."
    );
  }
}

document.addEventListener("DOMContentLoaded", initializePage);
