"use strict";

import { supabase } from "./supabase.js";

// Constantes de Mapeamento e Configuração
const STATUS_CODES = {
  PENDENTE: "PENDENTE_DE_TRATAMENTO",
  EM_TRATAMENTO: "EM_TRATAMENTO",
  ENCERRADO: "ENCERRADO_INTERNAMENTE"
};

const ERROR_MESSAGES = {
  VERSAO_DESATUALIZADA: "A demanda foi atualizada. Recarregue e tente novamente.",
  CICLO_NAO_PERMITE_MOVIMENTACAO: "Inicie o tratamento antes desta ação.",
  PROCESSO_SEI_JA_VINCULADO_AO_CICLO: "Este processo já está vinculado.",
  NUMERO_PROCESSO_SEI_INVALIDO: "Número de processo inválido."
};

// Funções Utilitárias
const getElement = (id) => document.getElementById(id);

const escapeHtml = (str) =>
  String(str ?? "").replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[char]);

const formatDate = (dateStr) => {
  if (!dateStr) return "Não informado";
  const parsedDate = new Date(dateStr);
  return isNaN(parsedDate) ? String(dateStr) : parsedDate.toLocaleDateString("pt-BR");
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return "Não informado";
  const parsedDate = new Date(dateStr);
  return isNaN(parsedDate) ? String(dateStr) : parsedDate.toLocaleString("pt-BR");
};

const getDaysToDeadline = (deadlineDateStr) => {
  if (!deadlineDateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(deadlineDateStr);
  deadline.setHours(0, 0, 0, 0);

  return Math.ceil((deadline - today) / 86400000);
};

const getDeadlineCode = (item) => {
  const days = getDaysToDeadline(item.prazo_em);
  if (days === null) return "SEM_PRAZO";
  if (days < 0) return "ATRASADA";
  if (days <= 7) return "PROXIMA";
  return "NO_PRAZO";
};

const getDeadlineText = (item) => {
  const days = getDaysToDeadline(item.prazo_em);
  if (days === null) return "Sem prazo";
  if (days < 0) return `Vencido há ${-days} dia(s)`;
  if (days === 0) return "Vence hoje";
  return `${days} dia(s) restantes`;
};

const getBadgeClass = (statusCode) => {
  switch (statusCode) {
    case STATUS_CODES.PENDENTE: return "badge-warning";
    case STATUS_CODES.EM_TRATAMENTO: return "badge-success";
    case STATUS_CODES.ENCERRADO: return "badge-neutral";
    default: return "badge-primary";
  }
};

const getTodayFormattedId = () =>
  Number(new Date().toISOString().slice(0, 10).replaceAll("-", ""));

const getFriendlyError = (err) => {
  const msg = err?.message || err?.details || "Falha na operação.";
  return ERROR_MESSAGES[msg] || msg;
};

// Mapeamento Centralizado do DOM
const elements = [
  "usuarioNome", "usuarioPerfil", "voltarGestaoBtn", "mensagem", "total",
  "pendentes", "tratando", "atrasadas", "busca", "tipo", "status", "prioridade",
  "papel", "prazo", "processo", "ordem", "avancados", "toggleFiltros", "limpar",
  "aplicar", "porPagina", "resumoTabela", "tbody", "estadoTabela", "anterior",
  "proxima", "paginaInfo", "modalOverlay", "mNumero", "mNome", "mCpf", "mTipo",
  "mStatus", "mPrioridade", "mPrazo", "mPapel", "mProcessos", "modalMensagem",
  "painelDetalhes", "painelTratamento", "painelHistorico", "novoProcesso",
  "formProcesso", "numeroProcesso", "assuntoProcesso", "observacaoProcesso",
  "processoPrincipal", "cancelarProcesso", "listaProcessos", "fecharModal",
  "fecharRodape", "temaBtn", "sairBtn", "atualizarBtn"
].reduce((acc, id) => {
  acc[id] = getElement(id);
  return acc;
}, {});

// Estado Global
const state = {
  ctx: null,
  itens: [],
  atual: null,
  card: "TODAS",
  pagina: 1,
  tamanho: 20
};

const isReadOnlyUser = () => state.ctx?.codigo_perfil === "GESTOR_DADOS_SISTEMA";

function showBannerMessage(containerElement, text, type = "") {
  containerElement.hidden = !text;
  containerElement.className = `status-banner ${type}`.trim();
  containerElement.textContent = text || "";
}

function resolveFieldValue(item, ...keys) {
  for (const key of keys) {
    const val = item.det?.[key] ?? item[key];
    if (val !== null && val !== undefined && val !== "") return val;
  }
  return null;
}

// Comunicação com Supabase
async function fetchContext() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    location.replace("index.html");
    throw new Error("SESSAO_AUSENTE");
  }

  const { data, error } = await supabase
    .schema("api")
    .from("v_meu_contexto")
    .select("*")
    .limit(1)
    .maybeSingle();

  if (error || !data) throw error || new Error("CONTEXTO_AUSENTE");

  if (!["OPERADOR_SEGEP_CE", "GESTOR_DADOS_SISTEMA"].includes(data.codigo_perfil)) {
    location.replace("inicio.html");
    throw new Error("PERFIL_NAO_AUTORIZADO");
  }

  state.ctx = data;
  elements.usuarioNome.textContent = data.nome_exibicao;
  elements.usuarioPerfil.textContent = data.nome_perfil;
  elements.voltarGestaoBtn.hidden = !isReadOnlyUser();
}

async function fetchTableData(viewName) {
  const { data, error } = await supabase.schema("api").from(viewName).select("*");
  if (error) throw error;
  return data || [];
}

async function fetchDemandDetails(id) {
  const { data, error } = await supabase.rpc("obter_detalhes_demanda_modo", {
    p_id_indicio: Number(id)
  });
  if (error) throw error;
  return data;
}

async function loadData() {
  elements.estadoTabela.hidden = false;
  elements.estadoTabela.innerHTML = "<strong>Carregando demandas...</strong>";

  try {
    const [ciclos, participacoes, processos] = await Promise.all([
      fetchTableData("v_ciclos"),
      fetchTableData("v_participacoes"),
      fetchTableData("v_processos_sei")
    ]);

    const activeParticipantsMap = new Map();
    participacoes
      .filter((p) => p.participacao_ativa)
      .forEach((p) => {
        const key = String(p.id_ciclo_tratamento);
        const existing = activeParticipantsMap.get(key);
        if (!existing || p.papel_principal) {
          activeParticipantsMap.set(key, p);
        }
      });

    const baseItems = ciclos
      .filter((c) => c.ciclo_ativo)
      .map((c) => {
        const key = String(c.id_ciclo_tratamento);
        return {
          ...c,
          part: activeParticipantsMap.get(key),
          procs: processos.filter(
            (p) => p.processo_ativo && String(p.id_ciclo_tratamento) === key
          )
        };
      })
      .filter((item) => isReadOnlyUser() || item.part);

    const detailsSettled = await Promise.allSettled(
      baseItems.map((item) => fetchDemandDetails(item.id_indicio))
    );

    state.itens = baseItems.map((item, index) => ({
      ...item,
      det: detailsSettled[index].status === "fulfilled" ? detailsSettled[index].value : {}
    }));

    populateFilterDropdowns();
    updateMetricCards();
    state.pagina = 1;
    renderTable();
    showBannerMessage(elements.mensagem, "");
  } catch (error) {
    console.error(error);
    showBannerMessage(elements.mensagem, getFriendlyError(error), "error");
  }
}

function populateFilterDropdowns() {
  const tipos = [...new Set(state.itens.map((x) => resolveFieldValue(x, "tipo_indicio")).filter(Boolean))].sort();
  const prioridades = [...new Set(state.itens.map((x) => x.nome_prioridade).filter(Boolean))].sort();

  elements.tipo.innerHTML =
    '<option value="">Todos os tipos</option>' +
    tipos.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(t)}</option>`).join("");

  elements.prioridade.innerHTML =
    '<option value="">Todas</option>' +
    prioridades.map((p) => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join("");
}

function updateMetricCards() {
  elements.total.textContent = state.itens.length;
  elements.pendentes.textContent = state.itens.filter(
    (x) => x.codigo_status_ciclo === STATUS_CODES.PENDENTE
  ).length;
  elements.tratando.textContent = state.itens.filter(
    (x) => x.codigo_status_ciclo === STATUS_CODES.EM_TRATAMENTO
  ).length;
  elements.atrasadas.textContent = state.itens.filter(
    (x) => getDeadlineCode(x) === "ATRASADA"
  ).length;
}

function getFilteredData() {
  const query = elements.busca.value.trim().toLowerCase();

  let filtered = state.itens.filter((item) => {
    const fullText = [
      resolveFieldValue(item, "identificador_do_indicio"),
      resolveFieldValue(item, "nome_atual"),
      resolveFieldValue(item, "cpf_mascarado", "cpf"),
      resolveFieldValue(item, "tipo_indicio"),
      ...item.procs.map((p) => p.numero_processo)
    ].join(" ").toLowerCase();

    const matchesCard =
      state.card === "TODAS" ||
      (state.card === "ATRASADAS"
        ? getDeadlineCode(item) === "ATRASADA"
        : item.codigo_status_ciclo === state.card);

    const matchesQuery = !query || fullText.includes(query);
    const matchesTipo = !elements.tipo.value || resolveFieldValue(item, "tipo_indicio") === elements.tipo.value;
    const matchesStatus = !elements.status.value || item.codigo_status_ciclo === elements.status.value;
    const matchesPrioridade = !elements.prioridade.value || item.nome_prioridade === elements.prioridade.value;
    const matchesPapel = !elements.papel.value || item.part?.codigo_papel === elements.papel.value;
    const matchesPrazo = !elements.prazo.value || getDeadlineCode(item) === elements.prazo.value;

    const matchesProcesso =
      !elements.processo.value ||
      (elements.processo.value === "COM" && item.procs.length > 0) ||
      (elements.processo.value === "SEM" && item.procs.length === 0) ||
      (elements.processo.value === "MULTIPLOS" && item.procs.length > 1);

    return (
      matchesCard &&
      matchesQuery &&
      matchesTipo &&
      matchesStatus &&
      matchesPrioridade &&
      matchesPapel &&
      matchesPrazo &&
      matchesProcesso
    );
  });

  filtered.sort((a, b) => {
    if (elements.ordem.value === "ESPERA") {
      return Number(resolveFieldValue(b, "dias_de_espera") || 0) - Number(resolveFieldValue(a, "dias_de_espera") || 0);
    }
    if (elements.ordem.value === "RECENTE") {
      return new Date(b.atualizado_em) - new Date(a.atualizado_em);
    }
    return (getDaysToDeadline(a.prazo_em) ?? 99999) - (getDaysToDeadline(b.prazo_em) ?? 99999);
  });

  return filtered;
}

function renderTable() {
  const filtered = getFilteredData();
  const totalPages = Math.max(1, Math.ceil(filtered.length / state.tamanho));
  state.pagina = Math.min(state.pagina, totalPages);

  const pageItems = filtered.slice(
    (state.pagina - 1) * state.tamanho,
    state.pagina * state.tamanho
  );

  elements.resumoTabela.textContent = `${filtered.length} demanda(s) encontrada(s)`;
  elements.paginaInfo.textContent = `Página ${state.pagina} de ${totalPages}`;
  elements.anterior.disabled = state.pagina <= 1;
  elements.proxima.disabled = state.pagina >= totalPages;

  elements.estadoTabela.hidden = pageItems.length > 0;
  if (!pageItems.length) {
    elements.estadoTabela.innerHTML = "<strong>Nenhuma demanda encontrada.</strong>";
  }

  elements.tbody.innerHTML = pageItems.map((item) => {
    const mainProc = item.procs.find((p) => p.processo_principal) || item.procs[0];
    const numIndicio = resolveFieldValue(item, "identificador_do_indicio") || "Não informado";
    const nome = resolveFieldValue(item, "nome_atual") || "Nome não disponível";
    const cpf = resolveFieldValue(item, "cpf_mascarado", "cpf") || "CPF não disponível";
    const tipo = resolveFieldValue(item, "tipo_indicio") || "Tipo não disponível";
    const situacao = resolveFieldValue(item, "situacoes_funcionais_resumo", "situacao_funcional") || "Sem situação funcional";
    const papelTexto = item.part?.nome_papel || (isReadOnlyUser() ? "Consulta" : "");

    return `
      <tr>
        <td class="indicio-cell">
          <strong>${escapeHtml(numIndicio)}</strong>
          <small>${escapeHtml(resolveFieldValue(item, "base_de_dados") || "")}</small>
        </td>
        <td class="person-cell">
          <strong>${escapeHtml(nome)}</strong>
          <span>${escapeHtml(cpf)}</span>
        </td>
        <td><div class="clip2">${escapeHtml(tipo)}</div></td>
        <td><div class="clip2">${escapeHtml(situacao)}</div></td>
        <td class="process-cell">
          ${
            mainProc
              ? `<span class="process-number">${escapeHtml(mainProc.numero_processo)}</span>
                 <small>${item.procs.length > 1 ? `+${item.procs.length - 1} outro(s)` : ""}</small>`
              : "Nenhum processo"
          }
        </td>
        <td><span class="badge ${getBadgeClass(item.codigo_status_ciclo)}">${escapeHtml(item.nome_status_ciclo)}</span></td>
        <td>${escapeHtml(item.nome_prioridade || "Não definida")}</td>
        <td class="deadline-cell">
          <strong>${formatDate(item.prazo_em)}</strong>
          <small>${getDeadlineText(item)}</small>
        </td>
        <td>${escapeHtml(papelTexto)}</td>
        <td>
          <button class="btn btn-secondary" data-ver="${item.id_ciclo_tratamento}">Visualizar</button>
        </td>
      </tr>
    `;
  }).join("");
}

function renderDetailCard(label, value, extraClass = "") {
  return `
    <div class="detail-card ${extraClass}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value ?? "Não informado")}</strong>
    </div>
  `;
}

function renderSectionTitle(title, content) {
  return `
    <h3 class="section-title">${escapeHtml(title)}</h3>
    <div class="detail-grid-v3">${content}</div>
  `;
}

async function openModal(id) {
  const item = state.itens.find((x) => String(x.id_ciclo_tratamento) === String(id));
  if (!item) return;

  state.atual = item;
  elements.modalOverlay.hidden = false;
  document.body.style.overflow = "hidden";
  switchModalTab("detalhes");

  elements.mNumero.textContent = resolveFieldValue(item, "identificador_do_indicio");
  elements.mNome.textContent = resolveFieldValue(item, "nome_atual");
  elements.mCpf.textContent = resolveFieldValue(item, "cpf_mascarado", "cpf");
  elements.mTipo.textContent = resolveFieldValue(item, "tipo_indicio");
  elements.mStatus.textContent = item.nome_status_ciclo;
  elements.mStatus.className = `badge ${getBadgeClass(item.codigo_status_ciclo)}`;
  elements.mPrioridade.textContent = item.nome_prioridade;
  elements.mPrazo.textContent = `${formatDate(item.prazo_em)} · ${getDeadlineText(item)}`;
  elements.mPapel.textContent = item.part?.nome_papel || (isReadOnlyUser() ? "Consulta" : "");
  elements.mProcessos.textContent = item.procs.length;

  const det = item.det || {};

  elements.painelDetalhes.innerHTML =
    renderSectionTitle(
      "Identificação do indício",
      renderDetailCard("Número do indício", resolveFieldValue(item, "identificador_do_indicio")) +
      renderDetailCard("Base de dados", resolveFieldValue(item, "base_de_dados")) +
      renderDetailCard("Tipo de indício", resolveFieldValue(item, "tipo_indicio"), "wide") +
      renderDetailCard("Descrição", resolveFieldValue(item, "descricao_indicio"), "full")
    ) +
    renderSectionTitle(
      "Pessoa",
      renderDetailCard("Nome", resolveFieldValue(item, "nome_atual"), "wide") +
      renderDetailCard("CPF", resolveFieldValue(item, "cpf_mascarado", "cpf")) +
      renderDetailCard("Situação funcional", resolveFieldValue(item, "situacoes_funcionais_resumo", "situacao_funcional"), "full")
    ) +
    renderSectionTitle(
      "Informações operacionais",
      renderDetailCard("Responsável principal", det.operador_principal?.nome_exibicao) +
      renderDetailCard("Modo de trabalho", det.modo_trabalho?.nome) +
      renderDetailCard("Data da atribuição", formatDateTime(det.operador_principal?.atribuido_em || item.part?.atribuido_em)) +
      renderDetailCard("Prioridade", item.nome_prioridade) +
      renderDetailCard("Prazo", formatDate(item.prazo_em)) +
      renderDetailCard("Meu papel", item.part?.nome_papel)
    );

  renderTreatmentPanel(item);
  renderProcessesPanel(item);
  await loadHistoryTab(item);
}

function renderTreatmentPanel(item) {
  const isPrincipal = item.part?.papel_principal;
  let actionsHtml = "";

  if (isReadOnlyUser()) {
    actionsHtml = '<p class="readonly">Acesso de consulta.</p>';
  } else if (item.codigo_status_ciclo === STATUS_CODES.PENDENTE && isPrincipal) {
    actionsHtml = `
      <div class="treatment-grid">
        <article class="action-card">
          <h3>Iniciar tratamento</h3>
          <p>Libera as ações operacionais para este indício.</p>
          <button class="btn btn-primary" id="btnIniciarTratamento">Iniciar tratamento</button>
        </article>
      </div>
    `;
  } else if (item.codigo_status_ciclo === STATUS_CODES.EM_TRATAMENTO) {
    const helpBanner = `
      <div class="treatment-help">
        <span aria-hidden="true">i</span>
        <div><strong>Observação x providência:</strong> observação registra o que foi analisado ou constatado; providência registra o que foi feito. Somente a ação Concluir tratamento realiza o encerramento interno.</div>
      </div>
    `;

    const cards = `
      <div class="treatment-grid">
        <article class="action-card action-observation">
          <h3>Registrar observação</h3>
          <p>Registre análises, constatações ou informações relevantes sobre o indício.</p>
          <textarea class="control textarea" id="obsInput" placeholder="Descreva a observação..."></textarea>
          <button class="btn btn-primary" data-reg="OBSERVACAO">Registrar observação</button>
        </article>
        <article class="action-card action-providence">
          <h3>Registrar providência adotada</h3>
          <p>Registre uma ação realizada durante o tratamento, como consulta, diligência, comunicação ou encaminhamento. Esta ação não encerra o tratamento.</p>
          <textarea class="control textarea" id="provInput" placeholder="Descreva a providência..."></textarea>
          <button class="btn btn-primary" data-reg="PROVIDENCIA">Registrar providência</button>
        </article>
      </div>
    `;

    actionsHtml = helpBanner + cards;
  } else {
    actionsHtml = '<p class="readonly">Sem ações disponíveis para o estado atual.</p>';
  }

  elements.painelTratamento.innerHTML =
    renderSectionTitle(
      "Andamento",
      renderDetailCard("Situação", item.nome_status_ciclo) +
      renderDetailCard("Iniciado em", formatDateTime(item.iniciado_em)) +
      renderDetailCard("Prazo", formatDate(item.prazo_em))
    ) + actionsHtml;
}

function renderProcessesPanel(item) {
  elements.novoProcesso.hidden = isReadOnlyUser() || !item.permite_movimentacao;
  elements.formProcesso.hidden = true;

  if (!item.procs.length) {
    elements.listaProcessos.innerHTML = '<div class="table-state"><strong>Nenhum processo vinculado.</strong></div>';
    return;
  }

  elements.listaProcessos.innerHTML = item.procs.map((p) => `
    <article class="process-card">
      <div>
        <h3>
          ${escapeHtml(p.numero_processo)} 
          ${p.processo_principal ? '<span class="badge badge-primary">Principal</span>' : ""}
        </h3>
        <p>${escapeHtml(p.assunto || "Sem assunto")}</p>
        <small>Incluído em ${formatDateTime(p.incluido_em)}</small>
      </div>
      ${
        !isReadOnlyUser() && item.permite_movimentacao
          ? `<button class="btn btn-danger" data-inativar="${p.id_processo_sei}">Inativar</button>`
          : ""
      }
    </article>
  `).join("");
}

async function loadHistoryTab(item) {
  elements.painelHistorico.innerHTML = '<div class="table-state"><strong>Carregando...</strong></div>';

  const { data: rows, error } = await supabase
    .schema("api")
    .from("v_movimentacoes")
    .select("*")
    .eq("id_ciclo_tratamento", item.id_ciclo_tratamento)
    .eq("id_usuario_executor", state.ctx.id_usuario)
    .order("realizada_em", { ascending: false });

  if (error) {
    elements.painelHistorico.innerHTML = '<div class="table-state"><strong>Falha ao carregar.</strong></div>';
    return;
  }

  if (!rows || !rows.length) {
    elements.painelHistorico.innerHTML = '<div class="table-state"><strong>Nenhuma movimentação realizada por você.</strong></div>';
    return;
  }

  elements.painelHistorico.innerHTML = `
    <div class="timeline">
      ${rows.map((m) => `
        <article class="timeline-item">
          <time>${formatDateTime(m.realizada_em)}</time>
          <strong>${escapeHtml(m.nome_movimentacao)}</strong>
          <p>${escapeHtml(m.descricao || "")}</p>
        </article>
      `).join("")}
    </div>
  `;
}

function switchModalTab(tabName) {
  document.querySelectorAll("[data-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.panel !== tabName;
  });

  document.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tabName);
  });
}

function closeModal() {
  elements.modalOverlay.hidden = true;
  document.body.style.overflow = "";
  state.atual = null;
}

// Manipulação de Ações e RPC
async function handleAsyncAction(actionFn) {
  const currentId = state.atual?.id_ciclo_tratamento;
  try {
    showBannerMessage(elements.modalMensagem, "Processando...");
    await actionFn();
    await loadData();
    if (currentId) await openModal(currentId);
    showBannerMessage(elements.modalMensagem, "Operação concluída com sucesso.", "success");
  } catch (error) {
    showBannerMessage(elements.modalMensagem, getFriendlyError(error), "error");
  }
}

async function startTreatment() {
  const item = state.atual;
  await handleAsyncAction(async () => {
    const { error } = await supabase.rpc("iniciar_tratamento_individual", {
      p_id_ciclo_tratamento: item.id_ciclo_tratamento,
      p_versao_esperada: item.versao,
      p_id_data_inicio: getTodayFormattedId()
    });
    if (error) throw error;
  });
}

async function registerAction(type) {
  const item = state.atual;
  const inputId = type === "OBSERVACAO" ? "obsInput" : "provInput";
  const description = getElement(inputId)?.value.trim() || "";

  const rpcName =
    type === "OBSERVACAO"
      ? "registrar_observacao_individual"
      : "registrar_providencia_individual";

  await handleAsyncAction(async () => {
    const { error } = await supabase.rpc(rpcName, {
      p_id_ciclo_tratamento: item.id_ciclo_tratamento,
      p_versao_esperada: item.versao,
      p_id_data_movimentacao: getTodayFormattedId(),
      p_descricao: description,
      p_dados_complementares: { origem: "PAGINA_OPERADOR" }
    });
    if (error) throw error;
  });
}

async function addProcess(event) {
  event.preventDefault();
  const item = state.atual;

  await handleAsyncAction(async () => {
    const { error } = await supabase.rpc("adicionar_processo_sei_individual", {
      p_id_ciclo_tratamento: item.id_ciclo_tratamento,
      p_versao_esperada: item.versao,
      p_id_data_inclusao: getTodayFormattedId(),
      p_numero_processo: elements.numeroProcesso.value,
      p_assunto: elements.assuntoProcesso.value || null,
      p_observacao: elements.observacaoProcesso.value || null,
      p_processo_principal: elements.processoPrincipal.checked
    });
    if (error) throw error;
  });
}

async function inactivateProcess(processId) {
  const item = state.atual;
  const process = item.procs.find((x) => String(x.id_processo_sei) === String(processId));
  const reason = prompt("Justificativa da inativação:");

  if (!reason?.trim()) return;

  await handleAsyncAction(async () => {
    const { error } = await supabase.rpc("inativar_processo_sei_individual", {
      p_id_processo_sei: Number(processId),
      p_versao_processo_esperada: process.versao,
      p_versao_ciclo_esperada: item.versao,
      p_id_data_inativacao: getTodayFormattedId(),
      p_motivo_inativacao: reason.trim()
    });
    if (error) throw error;
  });
}

// Configuração de Eventos
function setupEventListeners() {
  elements.sairBtn.onclick = async () => {
    await supabase.auth.signOut();
    location.replace("index.html");
  };

  elements.temaBtn.onclick = () => {
    const currentTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = currentTheme;
    localStorage.setItem("tema", currentTheme);
  };

  elements.atualizarBtn.onclick = loadData;

  elements.toggleFiltros.onclick = () => {
    elements.avancados.hidden = !elements.avancados.hidden;
  };

  elements.aplicar.onclick = () => {
    state.pagina = 1;
    renderTable();
  };

  elements.limpar.onclick = () => {
    [
      elements.busca, elements.tipo, elements.status,
      elements.prioridade, elements.papel, elements.prazo, elements.processo
    ].forEach((control) => (control.value = ""));
    state.card = "TODAS";
    renderTable();
  };

  elements.busca.oninput = renderTable;

  document.querySelectorAll("[data-card]").forEach((button) => {
    button.onclick = () => {
      state.card = button.dataset.card;
      document.querySelectorAll("[data-card]").forEach((b) => b.classList.toggle("active", b === button));
      renderTable();
    };
  });

  elements.porPagina.onchange = () => {
    state.tamanho = Number(elements.porPagina.value);
    renderTable();
  };

  elements.anterior.onclick = () => {
    state.pagina--;
    renderTable();
  };

  elements.proxima.onclick = () => {
    state.pagina++;
    renderTable();
  };

  // Delegação de Eventos na Tabela
  elements.tbody.onclick = (event) => {
    const viewBtn = event.target.closest("[data-ver]");
    if (viewBtn) openModal(viewBtn.dataset.ver);
  };

  // NAVEGAÇÃO POR ABAS NO MODAL
  document.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.onclick = () => switchModalTab(btn.dataset.tab);
  });

  // Delegação de Ações do Painel de Tratamento
  elements.painelTratamento.onclick = (event) => {
    if (event.target.id === "btnIniciarTratamento") {
      startTreatment();
    } else {
      const regBtn = event.target.closest("[data-reg]");
      if (regBtn) registerAction(regBtn.dataset.reg);
    }
  };

  // Fechamento e Formulários do Modal
  elements.fecharModal.onclick = closeModal;
  elements.fecharRodape.onclick = closeModal;
  elements.modalOverlay.onclick = (e) => {
    if (e.target === elements.modalOverlay) closeModal();
  };

  elements.novoProcesso.onclick = () => (elements.formProcesso.hidden = false);
  elements.cancelarProcesso.onclick = () => (elements.formProcesso.hidden = true);
  elements.formProcesso.onsubmit = addProcess;

  elements.listaProcessos.onclick = (event) => {
    const inactivateBtn = event.target.closest("[data-inativar]");
    if (inactivateBtn) inactivateProcess(inactivateBtn.dataset.inativar);
  };
}

// Inicialização da Aplicação
(async function init() {
  try {
    document.documentElement.dataset.theme = localStorage.getItem("tema") || "light";
    setupEventListeners();
    await fetchContext();
    await loadData();
  } catch (error) {
    if (error.message !== "SESSAO_AUSENTE") {
      showBannerMessage(elements.mensagem, getFriendlyError(error), "error");
    }
  }
})();
