import { supabase } from "./supabase.js";

const AUTHORIZED_PROFILE = "GESTOR_DADOS_SISTEMA";
const FIXED_PAGE_LIMIT = 10;
const THEME_STORAGE_KEY = "mi-theme";
const JUSTIFICATION_MAX_LENGTH = 2000;

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

const elements = {
  pageLoading: document.getElementById("page-loading"),
  loadingMessage: document.getElementById("loading-message"),
  protectedContent: document.getElementById("protected-content"),
  mainContent: document.getElementById("main-content"),

  userName: document.getElementById("user-name"),
  userProfile: document.getElementById("user-profile"),
  themeToggleButton: document.getElementById("theme-toggle-button"),
  themeToggleIcon: document.getElementById("theme-toggle-icon"),
  themeToggleText: document.getElementById("theme-toggle-text"),
  logoutButton: document.getElementById("logout-button"),

  pageMessage: document.getElementById("page-message"),
  refreshButton: document.getElementById("refresh-button"),

  pendingRequestsSummary: document.getElementById("pending-requests-summary"),
  oldestRequestSummary: document.getElementById("oldest-request-summary"),
  oldestRequestDescription: document.getElementById("oldest-request-description"),
  visibleRecordsSummary: document.getElementById("visible-records-summary"),
  currentFilterSummary: document.getElementById("current-filter-summary"),
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
  closeModalButton: document.getElementById("close-modal-button"),
  cancelAnalysisButton: document.getElementById("cancel-analysis-button"),
  analysisForm: document.getElementById("analysis-form"),
  analysisFormMessage: document.getElementById("analysis-form-message"),
  decisionFieldset: document.getElementById("decision-fieldset"),
  decisionApprove: document.getElementById("decision-approve"),
  decisionReject: document.getElementById("decision-reject"),
  approvedProfile: document.getElementById("approved-profile"),
  analysisJustification: document.getElementById("analysis-justification"),
  justificationCounter: document.getElementById("justification-counter"),
  rejectRequestButton: document.getElementById("reject-request-button"),
  approveRequestButton: document.getElementById("approve-request-button"),

  detailId: document.getElementById("detail-id"),
  detailIdSecondary: document.getElementById("detail-id-secondary"),
  detailStatus: document.getElementById("detail-status"),
  detailName: document.getElementById("detail-name"),
  detailEmail: document.getElementById("detail-email"),
  detailRequestedAt: document.getElementById("detail-requested-at"),
  detailUpdatedAt: document.getElementById("detail-updated-at"),
  detailAnalyzedAt: document.getElementById("detail-analyzed-at"),
  detailApprovedProfile: document.getElementById("detail-approved-profile"),
  detailJustification: document.getElementById("detail-justification")
};

function validatePageElements() {
  const requiredElements = Object.values(elements);

  if (requiredElements.some((element) => !element)) {
    throw new Error("PAGE_STRUCTURE_INVALID");
  }
}

function normalizeContextRow(data) {
  if (Array.isArray(data)) {
    return data[0] ?? null;
  }

  return data ?? null;
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

  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
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

function initializeTheme() {
  applyTheme(getPreferredTheme());
}

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

function getStatusLabel(status) {
  return STATUS_LABELS[status] ?? status ?? "Não informado";
}

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

function getWaitingDays(value) {
  if (!value) {
    return null;
  }

  const requestedDate = new Date(value);

  if (Number.isNaN(requestedDate.getTime())) {
    return null;
  }

  const difference = Date.now() - requestedDate.getTime();
  return Math.max(0, Math.floor(difference / (1000 * 60 * 60 * 24)));
}

function getCurrentPage() {
  return Math.floor(state.offset / state.limit) + 1;
}

function getTotalPages() {
  if (state.totalRecords === 0) {
    return 1;
  }

  return Math.ceil(state.totalRecords / state.limit);
}

function setLoadingMessage(message) {
  elements.loadingMessage.textContent = message;
}

function showPageMessage(message, type = "error") {
  elements.pageMessage.textContent = message;
  elements.pageMessage.classList.toggle("success", type === "success");
  elements.pageMessage.hidden = false;
}

function hidePageMessage() {
  elements.pageMessage.hidden = true;
  elements.pageMessage.textContent = "";
  elements.pageMessage.classList.remove("success");
}

function showAnalysisMessage(message) {
  elements.analysisFormMessage.textContent = message;
  elements.analysisFormMessage.hidden = false;
}

function hideAnalysisMessage() {
  elements.analysisFormMessage.textContent = "";
  elements.analysisFormMessage.hidden = true;
}

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

function getFunctionalErrorMessage(error) {
  if (!error) {
    return "Não foi possível concluir a operação.";
  }

  if (error.code === "28000") {
    return "Sua sessão não é válida. Entre novamente no sistema.";
  }

  if (error.code === "42501") {
    return "Seu perfil não possui autorização para acessar esta página.";
  }

  if (error.code === "22023") {
    return error.message || "Um dos parâmetros informados é inválido.";
  }

  if (
    typeof error.message === "string" &&
    error.message.toLowerCase().includes("jwt")
  ) {
    return "Sua sessão expirou. Entre novamente no sistema.";
  }

  return "Não foi possível carregar as solicitações. Tente novamente.";
}

function redirectToLogin() {
  window.location.replace("./index.html");
}

function redirectUnauthorizedProfile() {
  window.location.replace("./inicio.html");
}

async function validateSession() {
  setLoadingMessage("Validando sua sessão...");

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

async function loadFunctionalContext() {
  setLoadingMessage("Validando seu perfil funcional...");

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

  const context = normalizeContextRow(data);

  if (!context) {
    const contextError = new Error(
      "O usuário não possui contexto funcional ativo."
    );
    contextError.code = "42501";
    contextError.reason = "NO_FUNCTIONAL_CONTEXT";
    throw contextError;
  }

  if (context.codigo_perfil !== AUTHORIZED_PROFILE) {
    const profileError = new Error(
      "O usuário não possui autorização para esta página."
    );
    profileError.code = "42501";
    profileError.reason = "UNAUTHORIZED_PROFILE";
    throw profileError;
  }

  state.context = context;
  return context;
}

function renderUserContext() {
  const context = state.context;
  elements.userName.textContent = context?.nome_exibicao || "Usuário";
  elements.userProfile.textContent =
    context?.nome_perfil || context?.codigo_perfil || "Perfil";
}

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

  const [requestsResult, pendingSummaryResult] = await Promise.all([
    requestsPromise,
    pendingSummaryPromise
  ]);

  if (requestsResult.error) {
    throw requestsResult.error;
  }

  if (pendingSummaryResult.error) {
    throw pendingSummaryResult.error;
  }

  return {
    requestsData: Array.isArray(requestsResult.data)
      ? requestsResult.data
      : [],
    pendingData: Array.isArray(pendingSummaryResult.data)
      ? pendingSummaryResult.data
      : []
  };
}

async function loadRequests() {
  if (state.loading) {
    return;
  }

  hidePageMessage();
  setListLoading(true);
  let shouldReloadFirstPage = false;

  try {
    const { requestsData, pendingData } = await fetchRequestsData();
    state.requests = requestsData;

    if (requestsData.length > 0) {
      state.totalRecords = Number(requestsData[0].total_registros ?? 0);
    } else if (state.offset === 0) {
      state.totalRecords = 0;
    }

    state.pendingTotal = Number(pendingData[0]?.total_registros ?? 0);
    state.oldestPendingAt = pendingData[0]?.solicitado_em ?? null;

    if (requestsData.length === 0 && state.offset > 0) {
      state.offset = 0;
      shouldReloadFirstPage = true;
    } else {
      renderRequests();
    }
  } catch (error) {
    console.error("Erro ao carregar solicitações:", {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint
    });

    state.requests = [];
    state.totalRecords = 0;
    renderRequests();
    showPageMessage(getFunctionalErrorMessage(error));
  } finally {
    setListLoading(false);
    updatePagination();
  }

  if (shouldReloadFirstPage) {
    await loadRequests();
  }
}

function createTableCell(content, className = "") {
  const cell = document.createElement("td");

  if (className) {
    cell.className = className;
  }

  if (content instanceof Node) {
    cell.append(content);
  } else {
    cell.textContent = String(content ?? "");
  }

  return cell;
}

function createStatusBadge(status) {
  const badge = document.createElement("span");
  badge.className = `status-badge ${getStatusClass(status)}`;
  badge.textContent = getStatusLabel(status);
  return badge;
}

function getDetailsButtonLabel(status) {
  if (status === "PENDENTE") {
    return "Analisar";
  }

  if (status === "APROVADA" || status === "REJEITADA") {
    return "Ver análise";
  }

  return "Ver detalhes";
}

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

function renderRequests() {
  elements.tableBody.replaceChildren();

  if (state.requests.length === 0) {
    elements.emptyState.hidden = false;
    elements.tableRegion.hidden = true;
    updateSummary();
    return;
  }

  const fragment = document.createDocumentFragment();

  state.requests.forEach((request) => {
    const row = document.createElement("tr");

    const number = document.createElement("span");
    number.className = "request-number";
    number.textContent = `#${request.id_solicitacao}`;

    const name = document.createElement("span");
    name.className = "request-name";
    name.textContent = request.nome_completo || "Não informado";
    name.title = request.nome_completo || "";

    const email = document.createElement("span");
    email.className = "request-email";
    email.textContent = request.email_normalizado || "Não informado";
    email.title = request.email_normalizado || "";

    row.append(
      createTableCell(number),
      createTableCell(name),
      createTableCell(email),
      createTableCell(formatDateTime(request.solicitado_em)),
      createTableCell(createStatusBadge(request.status_solicitacao)),
      createTableCell(createDetailsButton(request))
    );

    fragment.append(row);
  });

  elements.tableBody.append(fragment);
  elements.emptyState.hidden = true;
  elements.tableRegion.hidden = false;
  updateSummary();
}

function updateSummary() {
  const statusLabel = state.status
    ? getStatusLabel(state.status)
    : "Todos os status";
  const waitingDays = getWaitingDays(state.oldestPendingAt);

  elements.pendingRequestsSummary.textContent =
    state.pendingTotal.toLocaleString("pt-BR");

  if (state.oldestPendingAt) {
    elements.oldestRequestSummary.textContent = formatDateTime(
      state.oldestPendingAt
    );

    if (waitingDays === null) {
      elements.oldestRequestDescription.textContent =
        "Não foi possível calcular o tempo de espera";
    } else if (waitingDays === 0) {
      elements.oldestRequestDescription.textContent = "Recebida hoje";
    } else if (waitingDays === 1) {
      elements.oldestRequestDescription.textContent =
        "Aguardando análise há 1 dia";
    } else {
      elements.oldestRequestDescription.textContent =
        `Aguardando análise há ${waitingDays} dias`;
    }
  } else {
    elements.oldestRequestSummary.textContent = "Nenhuma";
    elements.oldestRequestDescription.textContent =
      "Não existem solicitações pendentes";
  }

  elements.visibleRecordsSummary.textContent =
    `${state.requests.length} de ${state.limit}`;
  elements.currentFilterSummary.textContent = `Filtro: ${statusLabel}`;
  elements.recordsCounter.textContent = state.totalRecords === 1
    ? "1 registro"
    : `${state.totalRecords.toLocaleString("pt-BR")} registros`;
}

function updatePagination() {
  const currentPage = getCurrentPage();
  const totalPages = getTotalPages();
  const firstRecord = state.totalRecords === 0 ? 0 : state.offset + 1;
  const lastRecord = Math.min(
    state.offset + state.requests.length,
    state.totalRecords
  );

  elements.paginationDescription.textContent = state.totalRecords === 0
    ? "Nenhum registro exibido."
    : `Exibindo ${firstRecord} a ${lastRecord} de ${state.totalRecords.toLocaleString("pt-BR")} registros.`;
  elements.paginationIndicator.textContent =
    `Página ${currentPage} de ${totalPages}`;
  elements.previousPageButton.disabled = state.loading || state.offset === 0;
  elements.nextPageButton.disabled =
    state.loading || state.offset + state.limit >= state.totalRecords;
  updateSummary();
}

function resetAnalysisForm() {
  elements.analysisForm.reset();
  elements.decisionFieldset.disabled = true;
  elements.approvedProfile.disabled = true;
  elements.analysisJustification.disabled = true;
  elements.rejectRequestButton.disabled = true;
  elements.approveRequestButton.disabled = true;
  elements.rejectRequestButton.title = "Operação ainda não implementada";
  elements.approveRequestButton.title = "Operação ainda não implementada";
  elements.justificationCounter.textContent = `0 / ${JUSTIFICATION_MAX_LENGTH}`;
  hideAnalysisMessage();
}

function configureAnalysisMode(request) {
  const isPending = request.status_solicitacao === "PENDENTE";

  resetAnalysisForm();

  /*
   * O formulário visual permanece bloqueado até a implantação das RPCs e da
   * Edge Function de aprovação. O estado pendente apenas altera o contexto
   * visual do modal. Nenhuma escrita é realizada por este arquivo.
   */
  if (isPending) {
    elements.analysisForm.setAttribute("data-mode", "analysis-pending");
  } else {
    elements.analysisForm.setAttribute("data-mode", "read-only");
  }
}

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
  elements.detailEmail.textContent =
    request.email_normalizado || "Não informado";
  elements.detailRequestedAt.textContent = formatDateTime(
    request.solicitado_em
  );
  elements.detailUpdatedAt.textContent = formatDateTime(
    request.atualizado_em
  );
  elements.detailAnalyzedAt.textContent = request.analisado_em
    ? formatDateTime(request.analisado_em)
    : "Não analisado";
  elements.detailApprovedProfile.textContent =
    request.codigo_perfil_aprovado || "Não informado";
  elements.detailJustification.textContent =
    request.justificativa_analise || "Não informada";

  configureAnalysisMode(request);
  elements.detailsModal.hidden = false;
  document.body.classList.add("modal-open");

  window.requestAnimationFrame(() => {
    elements.closeModalButton.focus();
  });
}

function closeDetailsModal() {
  if (elements.detailsModal.hidden) {
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

function updateJustificationCounter() {
  const length = elements.analysisJustification.value.length;
  elements.justificationCounter.textContent =
    `${length} / ${JUSTIFICATION_MAX_LENGTH}`;
}

function handleDecisionChange() {
  /*
   * Preparado para a próxima etapa. Enquanto o backend não estiver
   * homologado, o fieldset permanece desabilitado e esta função não produz
   * alteração operacional.
   */
  const approveSelected = elements.decisionApprove.checked;
  elements.approvedProfile.disabled = !approveSelected;
}

function handleUnavailableDecision() {
  showAnalysisMessage(
    "A operação ainda não está disponível. Primeiro serão implantadas e homologadas as funções seguras do backend."
  );
}

function trapModalFocus(event) {
  if (event.key !== "Tab" || elements.detailsModal.hidden) {
    return;
  }

  const focusableSelector = [
    "button:not([disabled])",
    "a[href]",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");

  const focusableElements = [
    ...elements.detailsModal.querySelectorAll(focusableSelector)
  ].filter((element) => {
    return element instanceof HTMLElement &&
      !element.hidden &&
      element.getAttribute("aria-hidden") !== "true";
  });

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

async function handleLogout() {
  elements.logoutButton.disabled = true;
  elements.logoutButton.setAttribute("aria-busy", "true");
  hidePageMessage();

  try {
    const { error } = await supabase.auth.signOut({ scope: "local" });

    if (error) {
      throw error;
    }

    redirectToLogin();
  } catch (error) {
    console.error("Erro ao encerrar a sessão:", {
      code: error?.code,
      status: error?.status,
      message: error?.message
    });
    elements.logoutButton.disabled = false;
    elements.logoutButton.setAttribute("aria-busy", "false");
    showPageMessage(
      "Não foi possível encerrar a sessão. Tente novamente."
    );
  }
}

async function handleFilterSubmit(event) {
  event.preventDefault();
  state.status = elements.statusFilter.value;
  state.limit = FIXED_PAGE_LIMIT;
  state.offset = 0;
  await loadRequests();
}

async function handleRefresh() {
  await loadRequests();

  if (!elements.pageMessage.hidden) {
    return;
  }

  showPageMessage("A lista foi atualizada.", "success");
  window.setTimeout(() => {
    if (elements.pageMessage.classList.contains("success")) {
      hidePageMessage();
    }
  }, 3000);
}

async function handlePreviousPage() {
  if (state.loading || state.offset === 0) {
    return;
  }

  state.offset = Math.max(0, state.offset - state.limit);
  await loadRequests();
}

async function handleNextPage() {
  if (
    state.loading ||
    state.offset + state.limit >= state.totalRecords
  ) {
    return;
  }

  state.offset += state.limit;
  await loadRequests();
}

function handleDocumentKeydown(event) {
  if (event.key === "Escape" && !elements.detailsModal.hidden) {
    closeDetailsModal();
    return;
  }

  trapModalFocus(event);
}

function registerEventListeners() {
  elements.themeToggleButton.addEventListener("click", toggleTheme);
  elements.logoutButton.addEventListener("click", handleLogout);
  elements.filterForm.addEventListener("submit", handleFilterSubmit);
  elements.refreshButton.addEventListener("click", handleRefresh);
  elements.previousPageButton.addEventListener("click", handlePreviousPage);
  elements.nextPageButton.addEventListener("click", handleNextPage);
  elements.closeModalButton.addEventListener("click", closeDetailsModal);
  elements.cancelAnalysisButton.addEventListener("click", closeDetailsModal);
  elements.decisionApprove.addEventListener("change", handleDecisionChange);
  elements.decisionReject.addEventListener("change", handleDecisionChange);
  elements.analysisJustification.addEventListener(
    "input",
    updateJustificationCounter
  );
  elements.rejectRequestButton.addEventListener(
    "click",
    handleUnavailableDecision
  );
  elements.approveRequestButton.addEventListener(
    "click",
    handleUnavailableDecision
  );

  elements.detailsModal.addEventListener("click", (event) => {
    if (event.target === elements.detailsModal) {
      closeDetailsModal();
    }
  });

  document.addEventListener("keydown", handleDocumentKeydown);
}

async function initializePage() {
  try {
    validatePageElements();
    initializeTheme();
    registerEventListeners();

    const session = await validateSession();

    if (!session) {
      return;
    }

    await loadFunctionalContext();
    renderUserContext();
    elements.pageLoading.hidden = true;
    elements.protectedContent.hidden = false;
    await loadRequests();
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

      document.body.textContent =
        "Não foi possível carregar a estrutura da página.";
      return;
    }

    if (
      error?.code === "42501" &&
      error?.reason === "UNAUTHORIZED_PROFILE"
    ) {
      redirectUnauthorizedProfile();
      return;
    }

    if (
      error?.code === "42501" &&
      error?.reason === "NO_FUNCTIONAL_CONTEXT"
    ) {
      await supabase.auth.signOut({ scope: "local" });
      redirectToLogin();
      return;
    }

    if (
      error?.code === "28000" ||
      error?.status === 401 ||
      (
        typeof error?.message === "string" &&
        error.message.toLowerCase().includes("jwt")
      )
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

initializePage();
