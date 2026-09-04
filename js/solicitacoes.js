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
  const byId = (id) => document.getElementById(id);
  elements = {
    pageLoading: byId("page-loading"),
    loadingMessage: byId("loading-message"),
    protectedContent: byId("protected-content"),
    mainContent: byId("main-content"),
    pageMessage: byId("page-message"),
    userName: byId("user-name"),
    userProfile: byId("user-profile"),
    logoutButton: byId("logout-button"),
    themeToggleButton: byId("theme-toggle-button"),
    themeToggleIcon: byId("theme-toggle-icon"),
    themeToggleText: byId("theme-toggle-text"),
    refreshButton: byId("refresh-button"),
    pendingSummary: byId("pending-requests-summary"),
    oldestSummary: byId("oldest-request-summary"),
    oldestDescription: byId("oldest-request-description"),
    visibleSummary: byId("visible-records-summary"),
    filterSummary: byId("current-filter-summary"),
    recordsCounter: byId("records-counter"),
    filterForm: byId("filter-form"),
    statusFilter: byId("status-filter"),
    applyFilterButton: byId("apply-filter-button"),
    listLoading: byId("list-loading"),
    emptyState: byId("empty-state"),
    tableRegion: byId("table-region"),
    tableBody: byId("requests-table-body"),
    paginationDescription: byId("pagination-description"),
    paginationIndicator: byId("pagination-indicator"),
    previousPageButton: byId("previous-page-button"),
    nextPageButton: byId("next-page-button"),
    detailsModal: byId("details-modal"),
    analysisModal: document.querySelector("#details-modal .analysis-modal"),
    closeModalButton: byId("close-modal-button"),
    cancelAnalysisButton: byId("cancel-analysis-button"),
    detailId: byId("detail-id"),
    detailIdSecondary: byId("detail-id-secondary"),
    detailStatus: byId("detail-status"),
    detailRequestedAt: byId("detail-requested-at"),
    detailUpdatedAt: byId("detail-updated-at"),
    detailAnalyzedAtItem: byId("detail-analyzed-at-item"),
    detailAnalyzedAtIcon: byId("detail-analyzed-at-icon"),
    detailAnalyzedAtLabel: byId("detail-analyzed-at-label"),
    detailAnalyzedAt: byId("detail-analyzed-at"),
    detailName: byId("detail-name"),
    detailEmail: byId("detail-email"),
    detailApprovedProfile: byId("detail-approved-profile"),
    detailJustification: byId("detail-justification"),
    decisionPanelDescription: byId("decision-panel-description"),
    analysisForm: byId("analysis-form"),
    decisionFieldset: byId("decision-fieldset"),
    decisionApprove: byId("decision-approve"),
    decisionReject: byId("decision-reject"),
    decisionApproveOption: byId("decision-approve-option"),
    decisionRejectOption: byId("decision-reject-option"),
    approvedProfileField: byId("approved-profile-field"),
    approvedProfileSelect: byId("approved-profile"),
    analysisJustificationField: byId("analysis-justification-field"),
    analysisJustification: byId("analysis-justification"),
    analysisJustificationHelp: byId("analysis-justification-help"),
    justificationCounter: byId("justification-counter"),
    analysisFormMessage: byId("analysis-form-message"),
    analysisInformation: byId("analysis-information"),
    analysisInformationTitle: byId("analysis-information-title"),
    analysisInformationText: byId("analysis-information-text"),
    decisionConfirmationArea: byId("decision-confirmation-area"),
    confirmDecisionButton: byId("confirm-decision-button")
  };
}

/**
 * Verifica se todos os elementos necessários estão presentes no HTML.
 */
function validatePageElements() {
  const missing = Object.entries(elements)
    .filter(([, element]) => !element)
    .map(([name]) => name);

  if (missing.length) {
    console.error("Elementos ausentes no HTML:", missing);
    throw new Error("PAGE_STRUCTURE_INVALID");
  }
}

/**
 * Obtém o tema preferido.
 */
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

/**
 * Aplica o tema visual.
 */
function applyTheme(theme) {
  const normalized = theme === "dark" ? "dark" : "light";
  const dark = normalized === "dark";
  document.documentElement.dataset.theme = normalized;
  elements.themeToggleButton.setAttribute("aria-pressed", String(dark));
  elements.themeToggleButton.setAttribute(
    "aria-label",
    dark ? "Ativar modo claro" : "Ativar modo escuro"
  );
  elements.themeToggleButton.title = dark ? "Ativar modo claro" : "Ativar modo escuro";
  elements.themeToggleIcon.textContent = dark ? "Sol" : "Lua";
  elements.themeToggleText.textContent = dark ? "Modo claro" : "Modo escuro";
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
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch (error) {
    console.warn("Não foi possível salvar a preferência de tema:", error);
  }
  applyTheme(next);
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
  if (status === "PENDENTE") return "status-pending";
  if (status === "APROVADA") return "status-approved";
  if (status === "REJEITADA") return "status-rejected";
  if (status === "EXPIRADA") return "status-expired";
  return "status-neutral";
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
  if (!value) return "Não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data inválida";
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
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
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
function setListLoading(value) {
  state.loading = value;
  elements.listLoading.hidden = !value;
  elements.refreshButton.disabled = value;
  elements.applyFilterButton.disabled = value;
  elements.statusFilter.disabled = value;
  elements.refreshButton.setAttribute("aria-busy", String(value));
  elements.applyFilterButton.setAttribute("aria-busy", String(value));
  elements.previousPageButton.disabled = true;
  elements.nextPageButton.disabled = true;
  if (value) {
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
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  if (!data.session?.user) {
    redirectToLogin();
    return null;
  }
  return data.session;
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

  if (error) throw error;
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
  elements.userProfile.textContent = data.nome_perfil || data.codigo_perfil || "Perfil";
  return data;
}

/**
 * Consulta a lista e o resumo das pendências.
 */
async function fetchRequestsData() {
  const [requestsResult, pendingResult] = await Promise.all([
    supabase.schema("api").rpc("listar_solicitacoes_acesso", {
      p_status: state.status || null,
      p_limite: state.limit,
      p_deslocamento: state.offset
    }),
    supabase.schema("api").rpc("listar_solicitacoes_acesso", {
      p_status: "PENDENTE",
      p_limite: 1,
      p_deslocamento: 0
    })
  ]);
  if (requestsResult.error) throw requestsResult.error;
  if (pendingResult.error) throw pendingResult.error;
  return {
    requests: Array.isArray(requestsResult.data) ? requestsResult.data : [],
    pending: Array.isArray(pendingResult.data) ? pendingResult.data : []
  };
}

/**
 * Carrega a lista de solicitações.
 */
async function fetchRequestsList() {
  if (state.loading) return;
  hidePageMessage();
  setListLoading(true);
  let reloadFirstPage = false;

  try {
    const result = await fetchRequestsData();
    state.requests = result.requests;
    state.totalRecords = Number(result.requests[0]?.total_registros ?? 0);
    state.pendingTotal = Number(result.pending[0]?.total_registros ?? 0);
    state.oldestPendingAt = result.pending[0]?.solicitado_em ?? null;

    if (!state.requests.length && state.offset > 0) {
      state.offset = 0;
      reloadFirstPage = true;
    } else {
      renderTablePage();
    }
  } catch (error) {
    console.error("Erro ao consultar solicitações:", error);
    state.requests = [];
    state.totalRecords = 0;
    renderTablePage();
    showPageMessage("Não foi possível carregar as solicitações.");
  } finally {
    setListLoading(false);
    updatePagination();
  }

  if (reloadFirstPage) await fetchRequestsList();
}

/**
 * Cria uma célula da tabela.
 */
function createTableCell(content) {
  const cell = document.createElement("td");
  if (content instanceof Node) cell.append(content);
  else cell.textContent = String(content ?? "");
  return cell;
}

/**
 * Define o texto do botão de detalhes.
 */
function getDetailsButtonLabel(status) {
  if (status === "PENDENTE") return "Analisar";
  if (status === "APROVADA" || status === "REJEITADA") return "Ver análise";
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
  button.setAttribute("aria-label", `${label} da solicitação ${request.id_solicitacao}`);
  button.addEventListener("click", () => openDetailsModal(request, button));
  return button;
}

/**
 * Renderiza a página atual.
 */
function renderTablePage() {
  elements.tableBody.replaceChildren();
  if (!state.requests.length) {
    elements.emptyState.hidden = false;
    elements.tableRegion.hidden = true;
    updateSummaryCards();
    return;
  }

  const fragment = document.createDocumentFragment();
  state.requests.forEach((request) => {
    const row = document.createElement("tr");

    const number = document.createElement("span");
    number.className = "request-number";
    number.textContent = `#${request.id_solicitacao}`;

    const name = document.createElement("strong");
    name.className = "request-name";
    name.textContent = request.nome_completo || "Não informado";
    name.title = request.nome_completo || "";

    const email = document.createElement("span");
    email.className = "request-email";
    email.textContent = request.email_normalizado || "Não informado";
    email.title = request.email_normalizado || "";

    const action = createTableCell(createDetailsButton(request));
    action.style.textAlign = "right";

    row.append(
      createTableCell(number),
      createTableCell(name),
      createTableCell(email),
      createTableCell(formatDateTime(request.solicitado_em)),
      createTableCell(createStatusBadge(request.status_solicitacao)),
      action
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
  const filterLabel = state.status ? getStatusLabel(state.status) : "Todos os status";
  elements.pendingSummary.textContent = state.pendingTotal.toLocaleString("pt-BR");

  if (state.oldestPendingAt) {
    elements.oldestSummary.textContent = formatDateTime(state.oldestPendingAt);
    elements.oldestDescription.textContent =
      waitingDays === null
        ? "Não foi possível calcular o tempo de espera"
        : waitingDays === 0
        ? "Recebida hoje"
        : waitingDays === 1
        ? "Aguardando análise há 1 dia"
        : `Aguardando análise há ${waitingDays} dias`;
  } else {
    elements.oldestSummary.textContent = "Nenhuma";
    elements.oldestDescription.textContent = "Não existem solicitações pendentes";
  }

  elements.visibleSummary.textContent = `${state.requests.length} de ${state.limit}`;
  elements.filterSummary.textContent = `Filtro: ${filterLabel}`;
  elements.recordsCounter.textContent =
    state.totalRecords === 1
      ? "1 registro"
      : `${state.totalRecords.toLocaleString("pt-BR")} registros`;
}

/**
 * Atualiza a paginação.
 */
function updatePagination() {
  const first = state.totalRecords ? state.offset + 1 : 0;
  const last = Math.min(state.offset + state.requests.length, state.totalRecords);

  elements.paginationDescription.textContent = state.totalRecords
    ? `Exibindo ${first} a ${last} de ${state.totalRecords.toLocaleString("pt-BR")} solicitações.`
    : "Nenhum registro exibido.";

  elements.paginationIndicator.textContent = `Página ${getCurrentPage()} de ${getTotalPages()}`;
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

  elements.detailAnalyzedAtItem.removeAttribute("data-status");
  elements.detailAnalyzedAtIcon.textContent = "AN";
  elements.detailAnalyzedAtLabel.textContent = "Analisado em";

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
  updateConfirmButton(false, null, "Selecione uma decisão", "Selecione uma decisão");

  elements.decisionPanelDescription.textContent =
    "Defina o resultado da análise desta solicitação.";
  elements.analysisInformationTitle.textContent = "Operação protegida";
  elements.analysisInformationText.textContent =
    "A aprovação ou rejeição é registrada por uma operação segura no backend.";

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
}

/**
 * Configura uma solicitação rejeitada.
 */
function configureRejectedMode(request) {
  elements.analysisForm.dataset.mode = "read-only-rejected";
  elements.decisionReject.checked = true;
  elements.decisionFieldset.disabled = true;

  elements.approvedProfileField.hidden = true;

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
  elements.decisionFieldset.disabled = true;

  elements.approvedProfileSelect.disabled = true;
  elements.approvedProfileSelect.value = request.codigo_perfil_aprovado || "";

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
 * Configura uma solicitação expirada.
 */
function configureExpiredMode() {
  elements.analysisForm.dataset.mode = "read-only-expired";
  elements.decisionFieldset.disabled = true;
  elements.approvedProfileField.hidden = true;
  elements.analysisJustificationField.hidden = true;
  elements.decisionConfirmationArea.hidden = true;

  elements.decisionPanelDescription.textContent =
    "Esta solicitação foi encerrada automaticamente após o término do prazo de análise.";
  elements.analysisInformationTitle.textContent = "Solicitação expirada";
  elements.analysisInformationText.textContent =
    "A solicitação permaneceu pendente por 3 dias corridos e foi encerrada automaticamente pelo sistema. Para prosseguir, o solicitante deverá enviar um novo pedido de acesso.";
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
  elements.analysisInformationTitle.textContent = getStatusLabel(request.status_solicitacao);
  elements.analysisInformationText.textContent = "A solicitação está em modo somente leitura.";
}

/**
 * Configura o modo do modal conforme o status.
 */
function configureAnalysisMode(request) {
  resetAnalysisForm();
  if (request.status_solicitacao === "PENDENTE") configurePendingMode();
  else if (request.status_solicitacao === "REJEITADA") configureRejectedMode(request);
  else if (request.status_solicitacao === "APROVADA") configureApprovedMode(request);
  else if (request.status_solicitacao === "EXPIRADA") configureExpiredMode();
  else configureNeutralReadOnlyMode(request);
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

  elements.detailStatus.replaceChildren(createStatusBadge(request.status_solicitacao));
  elements.detailName.textContent = request.nome_completo || "Não informado";
  elements.detailEmail.textContent = request.email_normalizado || "Não informado";

  elements.detailRequestedAt.textContent = formatDateTime(request.solicitado_em);
  elements.detailUpdatedAt.textContent = formatDateTime(request.atualizado_em);

  const isExpired = request.status_solicitacao === "EXPIRADA";
  if (isExpired) {
    elements.detailAnalyzedAtItem.dataset.status = "EXPIRADA";
    elements.detailAnalyzedAtIcon.textContent = "EX";
    elements.detailAnalyzedAtLabel.textContent = "Expirado em";
  } else {
    elements.detailAnalyzedAtItem.removeAttribute("data-status");
    elements.detailAnalyzedAtIcon.textContent = "AN";
    elements.detailAnalyzedAtLabel.textContent = "Analisado em";
  }

  elements.detailAnalyzedAt.textContent = request.analisado_em
    ? formatDateTime(request.analisado_em)
    : isExpired
      ? "Data de expiração não informada"
      : "Não analisado";

  elements.detailApprovedProfile.textContent = request.codigo_perfil_aprovado
    ? PROFILE_LABELS[request.codigo_perfil_aprovado] || request.codigo_perfil_aprovado
    : "Nenhum perfil atribuído";

  elements.detailJustification.textContent =
    request.justificativa_analise || "Nenhuma justificativa informada.";

  configureAnalysisMode(request);

  elements.detailsModal.hidden = false;
  document.body.classList.add("modal-open");
  window.requestAnimationFrame(() => elements.closeModalButton.focus());
}

/**
 * Fecha o modal.
 */
function closeModal() {
  if (elements.detailsModal.hidden || state.submittingDecision) return;
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
  if (elements.decisionApprove.checked) return "APROVAR";
  if (elements.decisionReject.checked) return "REJEITAR";
  return null;
}

/**
 * Trata a escolha da decisão.
 */
function handleDecisionChange() {
  if (state.submittingDecision || state.selectedRequest?.status_solicitacao !== "PENDENTE") {
    return;
  }
  const decision = getSelectedDecision();
  const approving = decision === "APROVAR";

  elements.approvedProfileSelect.disabled = !approving;
  if (!approving) elements.approvedProfileSelect.value = "";

  elements.analysisJustification.disabled = !decision;

  hideFormMessage();
  validateDecisionForm();
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

  if (decision) button.dataset.decision = decision;
  else button.removeAttribute("data-decision");
}

/**
 * Avalia os campos e atualiza o botão contextual.
 */
function validateDecisionForm() {
  if (state.selectedRequest?.status_solicitacao !== "PENDENTE") {
    elements.decisionConfirmationArea.hidden = true;
    return;
  }

  const decision = getSelectedDecision();
  const justification = elements.analysisJustification.value.trim();
  const validJustification =
    justification.length >= JUSTIFICATION_MIN_LENGTH &&
    justification.length <= JUSTIFICATION_MAX_LENGTH;

  if (!decision) {
    updateConfirmButton(false, null, "Selecione uma decisão", "Selecione uma decisão.");
    return;
  }

  if (decision === "APROVAR") {
    const validProfile = Object.hasOwn(PROFILE_LABELS, elements.approvedProfileSelect.value);
    const enabled = validProfile && validJustification && !state.submittingDecision;
    const title = !validProfile
      ? "Selecione o perfil de acesso."
      : !validJustification
      ? `Informe uma justificativa com pelo menos ${JUSTIFICATION_MIN_LENGTH} caracteres.`
      : "Confirmar aprovação da solicitação";

    updateConfirmButton(
      enabled,
      "APROVAR",
      state.submittingDecision ? "Registrando aprovação..." : "Aprovar solicitação",
      title
    );
    return;
  }

  const enabled = validJustification && !state.submittingDecision;
  updateConfirmButton(
    enabled,
    "REJEITAR",
    state.submittingDecision ? "Registrando rejeição..." : "Rejeitar solicitação",
    validJustification
      ? "Confirmar rejeição da solicitação"
      : `Informe uma justificativa com pelo menos ${JUSTIFICATION_MIN_LENGTH} caracteres.`
  );
}

/**
 * Atualiza o contador da justificativa.
 */
function updateJustificationCounter() {
  elements.justificationCounter.textContent = `${elements.analysisJustification.value.length} / ${JUSTIFICATION_MAX_LENGTH}`;
  validateDecisionForm();
}

/**
 * Bloqueia/desbloqueia controles durante o processamento de uma decisão.
 */
function setDecisionProcessing(decision, processing) {
  state.submittingDecision = processing;
  elements.analysisModal.classList.toggle("is-processing", processing);
  elements.closeModalButton.disabled = processing;
  elements.cancelAnalysisButton.disabled = processing;
  elements.decisionFieldset.disabled = processing;
  elements.approvedProfileSelect.disabled = processing || decision !== "APROVAR";
  elements.analysisJustification.disabled = processing;

  if (processing) {
    updateConfirmButton(
      false,
      decision,
      decision === "APROVAR" ? "Registrando aprovação..." : "Registrando rejeição...",
      "Registrando decisão"
    );
  }
}

/**
 * Restaura os controles em caso de falha.
 */
function restoreDecisionControls() {
  state.submittingDecision = false;
  elements.analysisModal.classList.remove("is-processing");
  elements.closeModalButton.disabled = false;
  elements.cancelAnalysisButton.disabled = false;

  if (state.selectedRequest?.status_solicitacao === "PENDENTE") {
    elements.decisionFieldset.disabled = false;
    elements.analysisJustification.disabled = !getSelectedDecision();
    elements.approvedProfileSelect.disabled = getSelectedDecision() !== "APROVAR";
  }

  validateDecisionForm();
}

/**
 * Verifica se a solicitação deixou de estar pendente no backend.
 */
function isRequestStateConflict(error) {
  const code = error?.code || error?.body?.error?.code || null;
  return ["REQUEST_NOT_PENDING", "P0001", "40001"].includes(code);
}

/**
 * Fecha o modal e recarrega a lista após alteração concorrente ou expiração.
 */
async function handleRequestStateConflict(requestId) {
  state.submittingDecision = false;
  elements.analysisModal.classList.remove("is-processing");
  elements.closeModalButton.disabled = false;
  elements.cancelAnalysisButton.disabled = false;

  closeModal();
  await fetchRequestsList();

  showPageMessage(
    `A solicitação #${requestId} não está mais pendente. A lista foi atualizada para mostrar o status mais recente.`
  );
}

/**
 * Interpreta erros retornados pela Edge Function.
 */
async function readEdgeFunctionError(functionError) {
  const normalized = {
    name: functionError?.name || "EdgeFunctionError",
    code: null,
    status: functionError?.context?.status || null,
    message: functionError?.message || "A Edge Function retornou um erro.",
    body: null
  };

  const response = functionError?.context;
  if (response instanceof Response) {
    normalized.status = response.status;
    try {
      const body = await response.clone().json();
      normalized.body = body;
      normalized.code = body?.error?.code || null;
      normalized.message = body?.error?.message || normalized.message;
    } catch {
      try {
        const text = await response.clone().text();
        if (text) normalized.message = text;
      } catch {
        // Mantém a mensagem original
      }
    }
  }

  if (functionError?.name === "FunctionsFetchError") {
    normalized.code = "FUNCTION_NETWORK_ERROR";
  } else if (functionError?.name === "FunctionsHttpError" && !normalized.code) {
    normalized.code = "FUNCTION_HTTP_ERROR";
  }

  return normalized;
}

/**
 * Converte erros de aprovação (Edge Function / RPC) em mensagens funcionais.
 */
function getApprovalErrorMessage(error) {
  const code = error?.code || error?.body?.error?.code;
  const message = error?.body?.error?.message || error?.message || "";

  if (["INVALID_REQUEST_ID", "INVALID_PROFILE", "INVALID_JUSTIFICATION", "22023"].includes(code)) {
    return message || "Os dados informados para aprovação não são válidos.";
  }
  if (["ORIGIN_NOT_ALLOWED", "42501"].includes(code)) {
    return message || "Seu perfil não possui autorização para aprovar esta solicitação.";
  }
  if (
    ["AUTHORIZATION_HEADER_MISSING", "AUTHORIZATION_HEADER_INVALID", "INVALID_SESSION", "28000"].includes(code)
  ) {
    return "Sua sessão expirou. Entre novamente no sistema.";
  }
  if (["REQUEST_NOT_FOUND", "P0002"].includes(code)) {
    return "A solicitação não foi encontrada. Atualize a lista e tente novamente.";
  }
  if (["REQUEST_NOT_PENDING", "P0001"].includes(code)) {
    return message || "A solicitação já foi analisada.";
  }
  if (code === "AUTH_USER_ALREADY_EXISTS") {
    return "Já existe uma identidade no Supabase Auth associada ao e-mail desta solicitação. A aprovação não foi concluída.";
  }
  if (code === "REQUEST_EMAIL_INVALID") return "O e-mail registrado na solicitação não é válido.";
  if (code === "INVITE_FAILED") return "Não foi possível enviar o convite de acesso. Tente novamente mais tarde.";
  if (["INVITE_RESPONSE_INVALID", "INVITE_EMAIL_MISMATCH"].includes(code)) {
    return "O serviço de autenticação retornou uma resposta inesperada. A aprovação foi interrompida.";
  }
  if (code === "SERVER_CONFIGURATION_ERROR") {
    return "A configuração interna da aprovação está incompleta. Comunique o problema à administração do sistema.";
  }
  if (code === "23505") return message || "Já existe um cadastro associado a esta identidade.";
  if (code === "40001") return "A solicitação foi alterada por outra operação. Atualize a lista e tente novamente.";
  if (code === "FUNCTION_NETWORK_ERROR") {
    return "Não foi possível alcançar o serviço de aprovação. Verifique sua conexão e tente novamente.";
  }
  if (code === "FUNCTION_HTTP_ERROR") return message || "O serviço de aprovação recusou a operação.";
  if (error?.status === 401 || error?.status === 403 || /jwt|session/i.test(message)) {
    return "Sua sessão expirou ou não possui autorização. Entre novamente no sistema.";
  }

  return "Não foi possível registrar a aprovação. Atualize a lista e tente novamente.";
}

/**
 * Converte erros da RPC de rejeição em mensagens funcionais.
 */
function getRejectionErrorMessage(error) {
  if (error?.code === "22023") return error.message || "A justificativa informada não é válida.";
  if (error?.code === "42501") return "Seu perfil não possui autorização para rejeitar esta solicitação.";
  if (error?.code === "P0002") return "A solicitação não foi encontrada. Atualize a lista e tente novamente.";
  if (error?.code === "P0001") return error.message || "A solicitação já foi analisada.";
  if (error?.code === "40001") return "A solicitação foi alterada por outra operação. Atualize a lista e tente novamente.";
  if (error?.status === 401 || error?.code === "28000" || /jwt/i.test(error?.message || "")) {
    return "Sua sessão expirou. Entre novamente no sistema.";
  }

  return "Não foi possível registrar a rejeição. Atualize a lista e tente novamente.";
}

/**
 * Registra a aprovação via Edge Function.
 */
async function approveSelectedRequest() {
  const request = state.selectedRequest;
  const profile = elements.approvedProfileSelect.value;
  const justification = elements.analysisJustification.value.trim();

  if (!request) return showFormMessage("Nenhuma solicitação foi selecionada.");
  if (request.status_solicitacao !== "PENDENTE") {
    return showFormMessage("Esta solicitação não está mais pendente. Atualize a lista.");
  }
  if (!Object.hasOwn(PROFILE_LABELS, profile)) {
    showFormMessage("Selecione um perfil de acesso válido.");
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
  hideFormMessage();
  setDecisionProcessing("APROVAR", true);

  try {
    const { data, error } = await supabase.functions.invoke("aprovar-solicitacao-acesso", {
      body: {
        id_solicitacao: requestId,
        codigo_perfil: profile,
        justificativa: justification
      }
    });

    if (error) throw await readEdgeFunctionError(error);
    if (
      data?.success !== true ||
      Number(data?.data?.id_solicitacao) !== Number(requestId) ||
      data?.data?.status_solicitacao !== "APROVADA"
    ) {
      const invalid = new Error("O servidor retornou uma resposta de aprovação inválida.");
      invalid.code = "APPROVAL_RESPONSE_INVALID";
      throw invalid;
    }

    request.status_solicitacao = "APROVADA";
    request.codigo_perfil_aprovado = data.data.codigo_perfil_aprovado || profile;
    request.justificativa_analise = justification;
    request.analisado_em = data.data.analisado_em || new Date().toISOString();
    request.atualizado_em = request.analisado_em;

    state.submittingDecision = false;
    elements.analysisModal.classList.remove("is-processing");

    closeModal();
    await fetchRequestsList();

    showPageMessage(
      `A solicitação #${requestId} foi aprovada e o convite de acesso foi enviado com sucesso.`,
      "success"
    );
  } catch (error) {
    console.error("Erro ao aprovar solicitação:", {
      name: error?.name,
      code: error?.code,
      status: error?.status,
      message: error?.message,
      details: error?.body?.error?.details || error?.details || null
    });

    if (isRequestStateConflict(error)) {
      await handleRequestStateConflict(requestId);
      return;
    }

    restoreDecisionControls();
    showFormMessage(getApprovalErrorMessage(error));
  }
}

/**
 * Registra a rejeição pela RPC segura.
 */
async function rejectSelectedRequest() {
  const request = state.selectedRequest;
  const justification = elements.analysisJustification.value.trim();

  if (!request) return showFormMessage("Nenhuma solicitação foi selecionada.");
  if (request.status_solicitacao !== "PENDENTE") {
    return showFormMessage("Esta solicitação não está mais pendente. Atualize a lista.");
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
  hideFormMessage();
  setDecisionProcessing("REJEITAR", true);

  try {
    const { data, error } = await supabase
      .schema("api")
      .rpc("rejeitar_solicitacao_acesso", {
        p_id_solicitacao: requestId,
        p_justificativa: justification
      });

    if (error) throw error;
    const rejected = Array.isArray(data) ? data[0] : data;

    if (!rejected || rejected.status_solicitacao !== "REJEITADA") {
      throw new Error("INVALID_REJECTION_RESPONSE");
    }

    request.status_solicitacao = "REJEITADA";
    request.justificativa_analise = rejected.justificativa_analise ?? justification;
    request.analisado_em = rejected.analisado_em ?? new Date().toISOString();
    request.atualizado_em = request.analisado_em;

    state.submittingDecision = false;
    elements.analysisModal.classList.remove("is-processing");

    closeModal();
    await fetchRequestsList();

    showPageMessage(`A solicitação #${requestId} foi rejeitada com sucesso.`, "success");
  } catch (error) {
    console.error("Erro ao rejeitar solicitação:", error);

    if (isRequestStateConflict(error)) {
      await handleRequestStateConflict(requestId);
      return;
    }

    restoreDecisionControls();
    showFormMessage(getRejectionErrorMessage(error));
  }
}

/**
 * Trata a confirmação final.
 */
async function handleDecisionSubmit() {
  if (state.submittingDecision || !state.selectedRequest) return;
  const decision = getSelectedDecision();

  if (decision === "APROVAR") return approveSelectedRequest();
  if (decision === "REJEITAR") return rejectSelectedRequest();

  showFormMessage("Selecione a decisão de Aprovar ou Rejeitar para continuar.");
}

/**
 * Encerra a sessão.
 */
async function handleLogout() {
  elements.logoutButton.disabled = true;
  try {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) throw error;
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
  if (elements.pageMessage.hidden) showPageMessage("A lista foi atualizada.", "success");
}

/**
 * Abre a página anterior.
 */
async function handlePreviousPage() {
  if (state.loading || state.offset === 0) return;
  state.offset = Math.max(0, state.offset - state.limit);
  await fetchRequestsList();
}

/**
 * Abre a próxima página.
 */
async function handleNextPage() {
  if (state.loading || state.offset + state.limit >= state.totalRecords) return;
  state.offset += state.limit;
  await fetchRequestsList();
}

/**
 * Mantém o foco dentro do modal.
 */
function trapModalFocus(event) {
  if (event.key !== "Tab" || elements.detailsModal.hidden) return;

  const selector = [
    "button:not([disabled])",
    "a[href]",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");

  const focusable = [...elements.detailsModal.querySelectorAll(selector)].filter(
    (element) =>
      element instanceof HTMLElement &&
      !element.hidden &&
      element.getAttribute("aria-hidden") !== "true"
  );

  if (!focusable.length) return event.preventDefault();

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * Trata as teclas usadas no modal.
 */
function handleDocumentKeydown(event) {
  if (event.key === "Escape" && !elements.detailsModal.hidden && !state.submittingDecision) {
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
    if (event.target === elements.detailsModal && !state.submittingDecision) closeModal();
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
    if (!session) return;

    await loadFunctionalContext();

    elements.pageLoading.hidden = true;
    elements.protectedContent.hidden = false;

    await fetchRequestsList();

    elements.mainContent.focus();
  } catch (error) {
    console.error("Falha ao inicializar a página:", error);

    if (error?.message === "PAGE_STRUCTURE_INVALID") {
      if (elements.pageLoading) elements.pageLoading.hidden = true;
      if (elements.protectedContent) elements.protectedContent.hidden = true;
      document.body.textContent = "Não foi possível carregar a estrutura da página.";
      return;
    }

    if (error?.reason === "UNAUTHORIZED_PROFILE") return redirectUnauthorizedProfile();

    if (
      error?.reason === "NO_FUNCTIONAL_CONTEXT" ||
      error?.status === 401 ||
      error?.code === "28000" ||
      /jwt/i.test(error?.message || "")
    ) {
      await supabase.auth.signOut({ scope: "local" });
      return redirectToLogin();
    }

    if (elements.pageLoading) elements.pageLoading.hidden = true;
    if (elements.protectedContent) elements.protectedContent.hidden = false;

    showPageMessage(
      "Não foi possível estabelecer conexão com o servidor. Verifique sua rede e tente novamente."
    );
  }
}

document.addEventListener("DOMContentLoaded", initializePage);
