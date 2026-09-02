import { supabase } from './supabase.js';

const AUTHORIZED_PROFILE = "GESTOR_DADOS_SISTEMA";
const FIXED_PAGE_LIMIT = 10;
const THEME_STORAGE_KEY = "mi-theme";

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

  detailId: document.getElementById("detail-id"),
  detailStatus: document.getElementById("detail-status"),
  detailName: document.getElementById("detail-name"),
  detailEmail: document.getElementById("detail-email"),
  detailRequestedAt: document.getElementById("detail-requested-at"),
  detailUpdatedAt: document.getElementById("detail-updated-at"),
  detailAnalyzedAt: document.getElementById("detail-analyzed-at"),
  detailApprovedProfile: document.getElementById("detail-approved-profile"),
  detailJustification: document.getElementById("detail-justification")
};

/**
 * Verifica se todos os elementos necessários existem no HTML.
 */
function validatePageElements() {
  const requiredElements = [
    elements.pageLoading,
    elements.loadingMessage,
    elements.protectedContent,
    elements.mainContent,

    elements.userName,
    elements.userProfile,
    elements.themeToggleButton,
    elements.themeToggleIcon,
    elements.themeToggleText,
    elements.logoutButton,

    elements.pageMessage,
    elements.refreshButton,

    elements.pendingRequestsSummary,
    elements.oldestRequestSummary,
    elements.oldestRequestDescription,
    elements.visibleRecordsSummary,
    elements.currentFilterSummary,
    elements.recordsCounter,

    elements.filterForm,
    elements.statusFilter,
    elements.applyFilterButton,

    elements.listLoading,
    elements.emptyState,
    elements.tableRegion,
    elements.tableBody,

    elements.paginationDescription,
    elements.paginationIndicator,
    elements.previousPageButton,
    elements.nextPageButton,

    elements.detailsModal,
    elements.closeModalButton,

    elements.detailId,
    elements.detailStatus,
    elements.detailName,
    elements.detailEmail,
    elements.detailRequestedAt,
    elements.detailUpdatedAt,
    elements.detailAnalyzedAt,
    elements.detailApprovedProfile,
    elements.detailJustification
  ];

  if (requiredElements.some((element) => !element)) {
    throw new Error("PAGE_STRUCTURE_INVALID");
  }
}

/**
 * Normaliza o retorno da view de contexto funcional.
 */
function normalizeContextRow(data) {
  if (Array.isArray(data)) {
    return data[0] ?? null;
  }

  return data ?? null;
}

/**
 * Obtém a preferência de tema.
 *
 * Ordem utilizada:
 * 1. Tema salvo no navegador.
 * 2. Preferência do sistema operacional.
 * 3. Tema claro como padrão.
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
 * Aplica o tema selecionado ao documento.
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

  elements.themeToggleButton.title = darkModeActive ? "Ativar modo claro" : "Ativar modo escuro";
  elements.themeToggleIcon.textContent = darkModeActive ? "Sol" : "Lua";
  elements.themeToggleText.textContent = darkModeActive ? "Modo claro" : "Modo escuro";
}

/**
 * Inicializa o tema da página.
 */
function initializeTheme() {
  const preferredTheme = getPreferredTheme();
  applyTheme(preferredTheme);
}

/**
 * Alterna entre o modo claro e o modo escuro.
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
 * Retorna o rótulo funcional de um status.
 */
function getStatusLabel(status) {
  return STATUS_LABELS[status] ?? status ?? "Não informado";
}

/**
 * Retorna a classe visual correspondente ao status.
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
 * Formata data e hora para o fuso horário de Fortaleza.
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

  const difference = Date.now() - requestedDate.getTime();

  return Math.max(0, Math.floor(difference / (1000 * 60 * 60 * 24)));
}

/**
 * Retorna o número da página atual.
 */
function getCurrentPage() {
  return Math.floor(state.offset / state.limit) + 1;
}

/**
 * Retorna a quantidade total de páginas.
 */
function getTotalPages() {
  if (state.totalRecords === 0) {
    return 1;
  }

  return Math.ceil(state.totalRecords / state.limit);
}

/**
 * Atualiza a mensagem apresentada durante a validação inicial.
 */
function setLoadingMessage(message) {
  elements.loadingMessage.textContent = message;
}

/**
 * Exibe uma mensagem funcional na página.
 */
function showPageMessage(message, type = "error") {
  elements.pageMessage.textContent = message;
  elements.pageMessage.classList.toggle("success", type === "success");
  elements.pageMessage.hidden = false;
}

/**
 * Oculta a mensagem funcional da página.
 */
function hidePageMessage() {
  elements.pageMessage.hidden = true;
  elements.pageMessage.textContent = "";
  elements.pageMessage.classList.remove("success");
}

/**
 * Controla o estado de carregamento da fila.
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
 * Converte erros técnicos em mensagens funcionais.
 */
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

  if (typeof error.message === "string" && error.message.toLowerCase().includes("jwt")) {
    return "Sua sessão expirou. Entre novamente no sistema.";
  }

  return "Não foi possível carregar as solicitações. Tente novamente.";
}

/**
 * Redireciona o usuário para o login.
 */
function redirectToLogin() {
  window.location.replace("./index.html");
}

/**
 * Redireciona outros perfis autenticados para a tela
 * temporária criada para esses perfis.
 */
function redirectUnauthorizedProfile() {
  window.location.replace("./inicio.html");
}

/**
 * Valida a sessão armazenada no navegador.
 */
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

/**
 * Consulta o perfil funcional do usuário autenticado.
 */
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
    const contextError = new Error("O usuário não possui contexto funcional ativo.");
    contextError.code = "42501";
    contextError.reason = "NO_FUNCTIONAL_CONTEXT";
    throw contextError;
  }

  if (context.codigo_perfil !== AUTHORIZED_PROFILE) {
    const profileError = new Error("O usuário não possui autorização para esta página.");
    profileError.code = "42501";
    profileError.reason = "UNAUTHORIZED_PROFILE";
    throw profileError;
  }

  state.context = context;

  return context;
}

/**
 * Exibe nome e perfil no cabeçalho.
 */
function renderUserContext() {
  const context = state.context;

  elements.userName.textContent = context?.nome_exibicao || "Usuário";
  elements.userProfile.textContent = context?.nome_perfil || context?.codigo_perfil || "Perfil";
}

/**
 * Consulta simultaneamente:
 * 1. A página atual da fila.
 * 2. O total de solicitações pendentes e a mais antiga.
 */
async function fetchRequestsData() {
  const requestsPromise = supabase
    .schema("api")
    .rpc("listar_solicitacoes_acesso", {
      p_status: state.status || null,
      p_limite: state.limit,
      p_deslocamento: state.offset
    });

  /*
   * A RPC ordena solicitações pendentes da mais antiga
   * para a mais recente. O primeiro registro permite
   * identificar a pendência mais antiga.
   */
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

  const requestsData = Array.isArray(requestsResult.data) ? requestsResult.data : [];
  const pendingData = Array.isArray(pendingSummaryResult.data) ? pendingSummaryResult.data : [];

  return { requestsData, pendingData };
}

/**
 * Carrega as solicitações de acesso.
 */
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

    /*
     * Caso a página atual deixe de existir após uma
     * modificação nos registros, retorna à primeira página.
     */
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

/**
 * Cria uma célula da tabela sem usar innerHTML.
 */
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
 * Cria o botão de abertura dos detalhes.
 */
function createDetailsButton(request) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "details-button";
  button.textContent = "Ver detalhes";

  button.setAttribute("aria-label", `Ver detalhes da solicitação ${request.id_solicitacao}`);
  button.addEventListener("click", () => {
    openDetailsModal(request, button);
  });

  return button;
}

/**
 * Renderiza as solicitações na tabela.
 */
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

/**
 * Atualiza os indicadores administrativos.
 */
function updateSummary() {
  const statusLabel = state.status ? getStatusLabel(state.status) : "Todos os status";
  const waitingDays = getWaitingDays(state.oldestPendingAt);

  elements.pendingRequestsSummary.textContent = state.pendingTotal.toLocaleString("pt-BR");

  if (state.oldestPendingAt) {
    elements.oldestRequestSummary.textContent = formatDateTime(state.oldestPendingAt);

    if (waitingDays === null) {
      elements.oldestRequestDescription.textContent = "Não foi possível calcular o tempo de espera";
    } else if (waitingDays === 0) {
      elements.oldestRequestDescription.textContent = "Recebida hoje";
    } else if (waitingDays === 1) {
      elements.oldestRequestDescription.textContent = "Aguardando análise há 1 dia";
    } else {
      elements.oldestRequestDescription.textContent = `Aguardando análise há ${waitingDays} dias`;
    }
  } else {
    elements.oldestRequestSummary.textContent = "Nenhuma";
    elements.oldestRequestDescription.textContent = "Não existem solicitações pendentes";
  }

  elements.visibleRecordsSummary.textContent = `${state.requests.length} de ${state.limit}`;
  elements.currentFilterSummary.textContent = `Filtro: ${statusLabel}`;

  elements.recordsCounter.textContent =
    state.totalRecords === 1
      ? "1 registro"
      : `${state.totalRecords.toLocaleString("pt-BR")} registros`;
}

/**
 * Atualiza a descrição e os botões de paginação.
 */
function updatePagination() {
  const currentPage = getCurrentPage();
  const totalPages = getTotalPages();

  const firstRecord = state.totalRecords === 0 ? 0 : state.offset + 1;
  const lastRecord = Math.min(state.offset + state.requests.length, state.totalRecords);

  elements.paginationDescription.textContent =
    state.totalRecords === 0
      ? "Nenhum registro exibido."
      : `Exibindo ${firstRecord} a ${lastRecord} de ${state.totalRecords.toLocaleString("pt-BR")} registros.`;

  elements.paginationIndicator.textContent = `Página ${currentPage} de ${totalPages}`;

  elements.previousPageButton.disabled = state.loading || state.offset === 0;
  elements.nextPageButton.disabled =
    state.loading || state.offset + state.limit >= state.totalRecords;

  updateSummary();
}

/**
 * Preenche e abre o modal de detalhes.
 */
function openDetailsModal(request, triggerElement = null) {
  state.selectedRequest = request;
  state.lastFocusedElement = triggerElement || document.activeElement;

  elements.detailId.textContent = `#${request.id_solicitacao}`;
  elements.detailStatus.replaceChildren(createStatusBadge(request.status_solicitacao));

  elements.detailName.textContent = request.nome_completo || "Não informado";
  elements.detailEmail.textContent = request.email_normalizado || "Não informado";

  elements.detailRequestedAt.textContent = formatDateTime(request.solicitado_em);
  elements.detailUpdatedAt.textContent = formatDateTime(request.atualizado_em);
  elements.detailAnalyzedAt.textContent = request.analisado_em
    ? formatDateTime(request.analisado_em)
    : "Não analisado";

  elements.detailApprovedProfile.textContent = request.codigo_perfil_aprovado || "Não informado";
  elements.detailJustification.textContent = request.justificativa_analise || "Não informada";

  elements.detailsModal.hidden = false;
  document.body.classList.add("modal-open");

  window.requestAnimationFrame(() => {
    elements.closeModalButton.focus();
  });
}

/**
 * Fecha o modal de detalhes.
 */
function closeDetailsModal() {
  if (elements.detailsModal.hidden) {
    return;
  }

  elements.detailsModal.hidden = true;
  document.body.classList.remove("modal-open");

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
 * Mantém o foco dentro do modal aberto.
 */
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
    "not([tabindex='-1'])"
  ].join(",");

  const focusableElements = [...elements.detailsModal.querySelectorAll(focusableSelector)].filter(
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
 * Encerra a sessão do usuário.
 */
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

    showPageMessage("Não foi possível encerrar a sessão. Tente novamente.");
  }
}

/**
 * Aplica o filtro selecionado.
 */
async function handleFilterSubmit(event) {
  event.preventDefault();

  state.status = elements.statusFilter.value;

  /*
   * A quantidade é fixa e não depende mais de um
   * campo selecionável no HTML.
   */
  state.limit = FIXED_PAGE_LIMIT;
  state.offset = 0;

  await loadRequests();
}

/**
 * Atualiza manualmente a lista.
 */
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

/**
 * Abre a página anterior.
 */
async function handlePreviousPage() {
  if (state.loading || state.offset === 0) {
    return;
  }

  state.offset = Math.max(0, state.offset - state.limit);
  await loadRequests();
}

/**
 * Abre a próxima página.
 */
async function handleNextPage() {
  if (state.loading || state.offset + state.limit >= state.totalRecords) {
    return;
  }

  state.offset += state.limit;
  await loadRequests();
}

/**
 * Trata as teclas utilizadas no modal.
 */
function handleDocumentKeydown(event) {
  if (event.key === "Escape" && !elements.detailsModal.hidden) {
    closeDetailsModal();
    return;
  }

  trapModalFocus(event);
}

/**
 * Registra todos os eventos da página.
 */
function registerEventListeners() {
  elements.themeToggleButton.addEventListener("click", toggleTheme);
  elements.logoutButton.addEventListener("click", handleLogout);
  elements.filterForm.addEventListener("submit", handleFilterSubmit);
  elements.refreshButton.addEventListener("click", handleRefresh);
  elements.previousPageButton.addEventListener("click", handlePreviousPage);
  elements.nextPageButton.addEventListener("click", handleNextPage);
  elements.closeModalButton.addEventListener("click", closeDetailsModal);

  elements.detailsModal.addEventListener("click", (event) => {
    if (event.target === elements.detailsModal) {
      closeDetailsModal();
    }
  });

  document.addEventListener("keydown", handleDocumentKeydown);
}

/**
 * Inicializa a página protegida.
 */
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

    /*
     * Erro causado por incompatibilidade entre
     * o HTML e os elementos esperados pelo JavaScript.
     */
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

    /*
     * Um perfil funcional diferente de
     * GESTOR_DADOS_SISTEMA não acessa esta página.
     */
    if (error?.code === "42501" && error?.reason === "UNAUTHORIZED_PROFILE") {
      redirectUnauthorizedProfile();
      return;
    }

    /*
     * Um usuário sem contexto funcional ativo
     * não deve manter a sessão aberta.
     */
    if (error?.code === "42501" && error?.reason === "NO_FUNCTIONAL_CONTEXT") {
      await supabase.auth.signOut({ scope: "local" });
      redirectToLogin();
      return;
    }

    /*
     * Sessão expirada, token inválido ou falha de autenticação.
     */
    if (
      error?.code === "28000" ||
      error?.status === 401 ||
      (typeof error?.message === "string" && error.message.toLowerCase().includes("jwt"))
    ) {
      await supabase.auth.signOut({ scope: "local" });
      redirectToLogin();
      return;
    }

    /*
     * Uma falha de comunicação não encerra
     * automaticamente uma sessão que pode continuar válida.
     */
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
