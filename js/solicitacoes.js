import { supabase } from './supabase.js';

const AUTHORIZED_PROFILE = 'GESTOR_DADOS_SISTEMA';

const STATUS_LABELS = Object.freeze({
  PENDENTE: 'Pendente',
  APROVADA: 'Aprovada',
  REJEITADA: 'Rejeitada',
  CANCELADA: 'Cancelada',
  EXPIRADA: 'Expirada'
});

const state = {
  context: null,
  requests: [],
  selectedRequest: null,
  status: 'PENDENTE',
  limit: 50,
  offset: 0,
  totalRecords: 0,
  loading: false
};

const elements = {
  pageLoading: document.getElementById('page-loading'),
  loadingMessage: document.getElementById('loading-message'),
  protectedContent: document.getElementById('protected-content'),
  mainContent: document.getElementById('main-content'),

  userName: document.getElementById('user-name'),
  userProfile: document.getElementById('user-profile'),
  logoutButton: document.getElementById('logout-button'),

  pageMessage: document.getElementById('page-message'),
  refreshButton: document.getElementById('refresh-button'),

  selectedStatusSummary: document.getElementById(
    'selected-status-summary'
  ),
  totalRecordsSummary: document.getElementById(
    'total-records-summary'
  ),
  currentPageSummary: document.getElementById(
    'current-page-summary'
  ),
  recordsCounter: document.getElementById('records-counter'),

  filterForm: document.getElementById('filter-form'),
  statusFilter: document.getElementById('status-filter'),
  recordsPerPage: document.getElementById('records-per-page'),
  applyFilterButton: document.getElementById('apply-filter-button'),

  listLoading: document.getElementById('list-loading'),
  emptyState: document.getElementById('empty-state'),
  tableRegion: document.getElementById('table-region'),
  tableBody: document.getElementById('requests-table-body'),

  paginationDescription: document.getElementById(
    'pagination-description'
  ),
  paginationIndicator: document.getElementById(
    'pagination-indicator'
  ),
  previousPageButton: document.getElementById(
    'previous-page-button'
  ),
  nextPageButton: document.getElementById('next-page-button'),

  detailsModal: document.getElementById('details-modal'),
  closeModalButton: document.getElementById('close-modal-button'),

  detailId: document.getElementById('detail-id'),
  detailStatus: document.getElementById('detail-status'),
  detailName: document.getElementById('detail-name'),
  detailEmail: document.getElementById('detail-email'),
  detailRequestedAt: document.getElementById('detail-requested-at'),
  detailUpdatedAt: document.getElementById('detail-updated-at'),
  detailAnalyzedAt: document.getElementById('detail-analyzed-at'),
  detailApprovedProfile: document.getElementById(
    'detail-approved-profile'
  ),
  detailJustification: document.getElementById(
    'detail-justification'
  )
};

function normalizeContextRow(data) {
  if (Array.isArray(data)) {
    return data[0] ?? null;
  }

  return data ?? null;
}

function getStatusLabel(status) {
  return STATUS_LABELS[status] ?? status ?? 'Não informado';
}

function getStatusClass(status) {
  switch (status) {
    case 'PENDENTE':
      return 'status-pending';

    case 'APROVADA':
      return 'status-approved';

    case 'REJEITADA':
      return 'status-rejected';

    default:
      return 'status-neutral';
  }
}

function formatDateTime(value) {
  if (!value) {
    return 'Não informado';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Data inválida';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Fortaleza'
  }).format(date);
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

function showPageMessage(message, type = 'error') {
  elements.pageMessage.textContent = message;
  elements.pageMessage.classList.toggle(
    'success',
    type === 'success'
  );
  elements.pageMessage.hidden = false;
}

function hidePageMessage() {
  elements.pageMessage.hidden = true;
  elements.pageMessage.textContent = '';
  elements.pageMessage.classList.remove('success');
}

function setListLoading(isLoading) {
  state.loading = isLoading;

  elements.listLoading.hidden = !isLoading;
  elements.refreshButton.disabled = isLoading;
  elements.applyFilterButton.disabled = isLoading;
  elements.statusFilter.disabled = isLoading;
  elements.recordsPerPage.disabled = isLoading;

  elements.previousPageButton.disabled = true;
  elements.nextPageButton.disabled = true;

  if (isLoading) {
    elements.emptyState.hidden = true;
    elements.tableRegion.hidden = true;
  }
}

function getFunctionalErrorMessage(error) {
  if (!error) {
    return 'Não foi possível concluir a operação.';
  }

  if (error.code === '28000') {
    return 'Sua sessão não é válida. Entre novamente no sistema.';
  }

  if (error.code === '42501') {
    return 'Seu perfil não possui autorização para acessar esta página.';
  }

  if (error.code === '22023') {
    return error.message || 'Um dos parâmetros informados é inválido.';
  }

  if (
    typeof error.message === 'string' &&
    error.message.toLowerCase().includes('jwt')
  ) {
    return 'Sua sessão expirou. Entre novamente no sistema.';
  }

  return 'Não foi possível carregar as solicitações. Tente novamente.';
}

async function redirectToLogin() {
  window.location.replace('./index.html');
}

async function redirectToHome() {
  window.location.replace('./inicio.html');
}

async function validateSession() {
  setLoadingMessage('Validando sua sessão...');

  const {
    data: { session },
    error
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  if (!session?.user) {
    await redirectToLogin();
    return null;
  }

  return session;
}

async function loadFunctionalContext() {
  setLoadingMessage('Validando seu perfil funcional...');

  const { data, error } = await supabase
    .schema('api')
    .from('v_meu_contexto')
    .select(
      [
        'id_usuario',
        'auth_user_id',
        'codigo_usuario',
        'nome_exibicao',
        'email_institucional',
        'id_perfil_acesso',
        'nome_perfil',
        'codigo_perfil'
      ].join(',')
    )
    .limit(1);

  if (error) {
    throw error;
  }

  const context = normalizeContextRow(data);

  if (!context) {
    const contextError = new Error(
      'O usuário não possui contexto funcional ativo.'
    );

    contextError.code = '42501';
    throw contextError;
  }

  if (context.codigo_perfil !== AUTHORIZED_PROFILE) {
    const profileError = new Error(
      'O usuário não possui autorização para esta página.'
    );

    profileError.code = '42501';
    throw profileError;
  }

  state.context = context;

  return context;
}

function renderUserContext() {
  const context = state.context;

  elements.userName.textContent =
    context?.nome_exibicao || 'Usuário';

  elements.userProfile.textContent =
    context?.nome_perfil || context?.codigo_perfil || 'Perfil';
}

async function loadRequests() {
  if (state.loading) {
    return;
  }

  hidePageMessage();
  setListLoading(true);

  try {
    const { data, error } = await supabase
      .schema('api')
      .rpc('listar_solicitacoes_acesso', {
        p_status: state.status || null,
        p_limite: state.limit,
        p_deslocamento: state.offset
      });

    if (error) {
      throw error;
    }

    state.requests = Array.isArray(data) ? data : [];

    state.totalRecords = Number(
      state.requests[0]?.total_registros ?? 0
    );

    /*
     * Se a exclusão ou alteração de registros deixar a página atual
     * acima do total disponível, retorna para a primeira página.
     */
    if (
      state.requests.length === 0 &&
      state.offset > 0 &&
      state.totalRecords === 0
    ) {
      state.offset = 0;
    }

    renderRequests();
  } catch (error) {
    console.error('Erro ao carregar solicitações:', error);

    state.requests = [];
    state.totalRecords = 0;

    renderRequests();
    showPageMessage(getFunctionalErrorMessage(error));
  } finally {
    setListLoading(false);
    updatePagination();
  }
}

function createTableCell(content, className = '') {
  const cell = document.createElement('td');

  if (className) {
    cell.className = className;
  }

  if (content instanceof Node) {
    cell.append(content);
  } else {
    cell.textContent = String(content ?? '');
  }

  return cell;
}

function createStatusBadge(status) {
  const badge = document.createElement('span');

  badge.className = `status-badge ${getStatusClass(status)}`;
  badge.textContent = getStatusLabel(status);

  return badge;
}

function createDetailsButton(request) {
  const button = document.createElement('button');

  button.type = 'button';
  button.className = 'details-button';
  button.textContent = 'Ver detalhes';

  button.setAttribute(
    'aria-label',
    `Ver detalhes da solicitação ${request.id_solicitacao}`
  );

  button.addEventListener('click', () => {
    openDetailsModal(request);
  });

  return button;
}

function renderRequests() {
  elements.tableBody.replaceChildren();

  if (state.requests.length === 0) {
    elements.emptyState.hidden = false;
    elements.tableRegion.hidden = true;
  } else {
    const fragment = document.createDocumentFragment();

    state.requests.forEach((request) => {
      const row = document.createElement('tr');

      const number = document.createElement('span');
      number.className = 'request-number';
      number.textContent = `#${request.id_solicitacao}`;

      const name = document.createElement('span');
      name.className = 'request-name';
      name.textContent = request.nome_completo || 'Não informado';
      name.title = request.nome_completo || '';

      const email = document.createElement('span');
      email.className = 'request-email';
      email.textContent = request.email_normalizado || 'Não informado';
      email.title = request.email_normalizado || '';

      row.append(
        createTableCell(number),
        createTableCell(name),
        createTableCell(email),
        createTableCell(formatDateTime(request.solicitado_em)),
        createTableCell(
          createStatusBadge(request.status_solicitacao)
        ),
        createTableCell(createDetailsButton(request))
      );

      fragment.append(row);
    });

    elements.tableBody.append(fragment);

    elements.emptyState.hidden = true;
    elements.tableRegion.hidden = false;
  }

  updateSummary();
}

function updateSummary() {
  const statusLabel = state.status
    ? getStatusLabel(state.status)
    : 'Todos os status';

  elements.selectedStatusSummary.textContent = statusLabel;

  elements.totalRecordsSummary.textContent =
    state.totalRecords.toLocaleString('pt-BR');

  elements.currentPageSummary.textContent =
    String(getCurrentPage());

  elements.recordsCounter.textContent =
    state.totalRecords === 1
      ? '1 registro'
      : `${state.totalRecords.toLocaleString('pt-BR')} registros`;
}

function updatePagination() {
  const currentPage = getCurrentPage();
  const totalPages = getTotalPages();

  const firstRecord =
    state.totalRecords === 0 ? 0 : state.offset + 1;

  const lastRecord = Math.min(
    state.offset + state.requests.length,
    state.totalRecords
  );

  elements.paginationDescription.textContent =
    state.totalRecords === 0
      ? 'Nenhum registro exibido.'
      : `Exibindo ${firstRecord} a ${lastRecord} de ` +
        `${state.totalRecords.toLocaleString('pt-BR')} registros.`;

  elements.paginationIndicator.textContent =
    `Página ${currentPage} de ${totalPages}`;

  elements.previousPageButton.disabled =
    state.loading || state.offset === 0;

  elements.nextPageButton.disabled =
    state.loading ||
    state.offset + state.limit >= state.totalRecords;

  updateSummary();
}

function openDetailsModal(request) {
  state.selectedRequest = request;

  elements.detailId.textContent =
    `#${request.id_solicitacao}`;

  elements.detailStatus.replaceChildren(
    createStatusBadge(request.status_solicitacao)
  );

  elements.detailName.textContent =
    request.nome_completo || 'Não informado';

  elements.detailEmail.textContent =
    request.email_normalizado || 'Não informado';

  elements.detailRequestedAt.textContent =
    formatDateTime(request.solicitado_em);

  elements.detailUpdatedAt.textContent =
    formatDateTime(request.atualizado_em);

  elements.detailAnalyzedAt.textContent =
    request.analisado_em
      ? formatDateTime(request.analisado_em)
      : 'Não analisado';

  elements.detailApprovedProfile.textContent =
    request.codigo_perfil_aprovado || 'Não informado';

  elements.detailJustification.textContent =
    request.justificativa_analise || 'Não informada';

  elements.detailsModal.hidden = false;
  document.body.classList.add('modal-open');

  window.requestAnimationFrame(() => {
    elements.closeModalButton.focus();
  });
}

function closeDetailsModal() {
  elements.detailsModal.hidden = true;
  document.body.classList.remove('modal-open');

  state.selectedRequest = null;
}

async function handleLogout() {
  elements.logoutButton.disabled = true;
  hidePageMessage();

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    await redirectToLogin();
  } catch (error) {
    console.error('Erro ao encerrar a sessão:', error);

    elements.logoutButton.disabled = false;

    showPageMessage(
      'Não foi possível encerrar a sessão. Tente novamente.'
    );
  }
}

async function handleFilterSubmit(event) {
  event.preventDefault();

  state.status = elements.statusFilter.value;
  state.limit = Number(elements.recordsPerPage.value);
  state.offset = 0;

  await loadRequests();
}

async function handleRefresh() {
  await loadRequests();

  if (!elements.pageMessage.hidden) {
    return;
  }

  showPageMessage('A lista foi atualizada.', 'success');

  window.setTimeout(() => {
    if (
      elements.pageMessage.classList.contains('success')
    ) {
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

function registerEventListeners() {
  elements.logoutButton.addEventListener('click', handleLogout);

  elements.filterForm.addEventListener(
    'submit',
    handleFilterSubmit
  );

  elements.refreshButton.addEventListener(
    'click',
    handleRefresh
  );

  elements.previousPageButton.addEventListener(
    'click',
    handlePreviousPage
  );

  elements.nextPageButton.addEventListener(
    'click',
    handleNextPage
  );

  elements.closeModalButton.addEventListener(
    'click',
    closeDetailsModal
  );

  elements.detailsModal.addEventListener('click', (event) => {
    if (event.target === elements.detailsModal) {
      closeDetailsModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (
      event.key === 'Escape' &&
      !elements.detailsModal.hidden
    ) {
      closeDetailsModal();
    }
  });
}

async function initializePage() {
  registerEventListeners();

  try {
    await validateSession();
    await loadFunctionalContext();

    renderUserContext();

    elements.pageLoading.hidden = true;
    elements.protectedContent.hidden = false;

    await loadRequests();

    elements.mainContent.focus();
  } catch (error) {
    console.error('Falha ao inicializar a página:', error);

    if (error?.code === '42501') {
      await redirectToHome();
      return;
    }

    await supabase.auth.signOut();
    await redirectToLogin();
  }
}

initializePage();
