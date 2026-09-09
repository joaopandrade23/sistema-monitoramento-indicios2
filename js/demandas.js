"use strict";

import { supabase } from "./supabase.js";

const CONFIG = Object.freeze({
  LOGIN_URL: "./index.html",
  PERFIS_AUTORIZADOS: ["GESTOR_SEGEP_CE", "GESTOR_DADOS_SISTEMA"]
});

const sb = supabase;
const estado = {
  contexto: null,
  operadores: [],
  demandas: [],
  selecionadas: new Map(),
  carregando: false,
  atribuindo: false,
  buscaTimer: null,
  cardAtivo: "TODAS",
  paginacao: { pagina: 1, tamanho: 20, total: 0, totalPaginas: 0 },
  filtros: {
    busca: "",
    situacao: "",
    idOperador: null,
    ordenacao: "DIAS_ESPERA_DESC",
    multiplas: null,
    semResponsavel: null,
    requerAnalise: null
  }
};

const ids = [
  "usuarioNome", "usuarioPerfil", "temaBtn", "sairBtn", "atualizarBtn", "mensagem",
  "atribuirDemandasBtn", "assignmentMenu", "assignmentMenuPopover", "atribuirSelecionadasBtn",
  "atribuirSelecionadasHint", "atribuirPorTipoBtn", "atribuirPorCpfBtn",
  "cardTotal", "cardDisponiveis", "cardPendentes", "cardEmTratamento", "cardSemResponsavel", "cardMultiplas",
  "buscaInput", "situacaoSelect", "operadorFiltroSelect", "ordenacaoSelect", "semResponsavelCheck",
  "multiplasCheck", "analiseCheck", "limparFiltrosBtn",
  "tamanhoPaginaSelect", "demandasTbody", "estadoTabela", "selectionInfo", "verSelecionadasBtn",
  "limparSelecaoBtn", "selecionarPaginaCheck", "paginacaoInfo", "paginaAtualInfo", "paginaAnteriorBtn", "proximaPaginaBtn",
  "atribuicaoOverlay", "fecharModalBtn", "cancelarModalBtn", "modalIdentificador",
  "modalSituacao", "modalNumeroIndicio", "modalCpf", "modalNome", "modalTipo", "modalSituacaoFuncional",
  "modalEspera", "modalUltimaAlteracao",
  "loteOverlay", "fecharLoteBtn", "cancelarLoteBtn", "confirmarLoteBtn", "loteTitulo", "loteEtapaSelecionadas",
  "loteEtapaTipo", "loteEtapaCpf", "loteQuantidade", "loteSelecionadasLista", "loteTipoSelect", "loteCpfInput", "loteOperadorSelect"
];
const el = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));

function escapeHtml(valor, fallback = "Não informado") {
  const texto = valor === null || valor === undefined || valor === "" ? fallback : String(valor);
  return texto.replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
}

function exibirMensagem(texto, tipo = "") {
  el.mensagem.textContent = texto;
  el.mensagem.className = `status-banner ${tipo}`.trim();
  el.mensagem.hidden = false;
}

function ocultarMensagem() {
  el.mensagem.hidden = true;
}

function formatarData(valor) {
  if (!valor) return "Não informado";
  const d = /^\d{4}-\d{2}-\d{2}$/.test(valor) ? new Date(`${valor}T12:00:00`) : new Date(valor);
  return Number.isNaN(d.getTime()) ? "Não informado" : new Intl.DateTimeFormat("pt-BR").format(d);
}

function rotuloSituacao(c) {
  return ({
    DISPONIVEL_PARA_ATRIBUICAO: "Disponível para atribuição",
    PENDENTE_DE_TRATAMENTO: "Pendente de tratamento",
    EM_TRATAMENTO: "Em tratamento",
    AGUARDANDO_VALIDACAO_TCU: "Aguardando validação do TCU",
    VALIDADO_TCU: "Validado pelo TCU",
    ENCERRADO_INTERNAMENTE: "Encerrado internamente",
    ESTADO_MISTO_REQUER_ANALISE: "Requer análise"
  })[c] || c || "Não classificada";
}

function classeSituacao(c) {
  if (c === "DISPONIVEL_PARA_ATRIBUICAO") return "badge-primary";
  if (["EM_TRATAMENTO", "VALIDADO_TCU"].includes(c)) return "badge-success";
  if (["PENDENTE_DE_TRATAMENTO", "AGUARDANDO_VALIDACAO_TCU"].includes(c)) return "badge-warning";
  if (/ANALISE|MISTO/.test(c || "")) return "badge-danger";
  return "";
}

function mensagemErro(error, fallback) {
  const m = error?.message || fallback;
  if (/JWT|session|auth/i.test(m)) return "Sua sessão não é mais válida.";
  if (/PERFIL_NAO_AUTORIZADO|permission|42501/i.test(m)) return "Seu perfil não possui permissão.";
  return fallback;
}

async function exigirAcesso() {
  const { data: s, error: se } = await sb.auth.getSession();
  if (se || !s.session) {
    location.replace(CONFIG.LOGIN_URL);
    throw new Error("SESSAO_AUSENTE");
  }
  const { data, error } = await sb.from("v_meu_contexto").select("*").limit(2);
  if (error) throw error;
  if (!Array.isArray(data) || data.length !== 1) throw new Error("CONTEXTO_FUNCIONAL_INVALIDO");
  if (!CONFIG.PERFIS_AUTORIZADOS.includes(data[0].codigo_perfil)) throw new Error("PERFIL_NAO_AUTORIZADO");
  
  estado.contexto = data[0];
  el.usuarioNome.textContent = data[0].nome_exibicao || data[0].email_institucional || "Usuário";
  el.usuarioPerfil.textContent = data[0].nome_perfil || data[0].codigo_perfil;
}

async function carregarOperadores() {
  const { data, error } = await sb.from("v_operadores_disponiveis")
    .select("id_usuario,nome_exibicao,email_institucional")
    .order("nome_exibicao");
  if (error) throw error;
  
  estado.operadores = data || [];
  const opcoes = estado.operadores.map(o =>
    `<option value="${o.id_usuario}">${escapeHtml(o.nome_exibicao)}${o.email_institucional ? ` (${escapeHtml(o.email_institucional)})` : ""}</option>`
  ).join("");
  
  el.operadorFiltroSelect.innerHTML = `<option value="">Todos</option>${opcoes}`;
  el.loteOperadorSelect.innerHTML = `<option value="">Selecione um operador</option>${opcoes}`;
}

async function carregarResumo() {
  const { data, error } = await sb.rpc("resumo_demandas_gestao");
  if (error) throw error;
  
  el.cardTotal.textContent = data?.total_demandas ?? 0;
  el.cardDisponiveis.textContent = data?.disponiveis_para_atribuicao ?? 0;
  el.cardPendentes.textContent = data?.pendentes_de_tratamento ?? 0;
  el.cardEmTratamento.textContent = data?.em_tratamento ?? 0;
  el.cardSemResponsavel.textContent = data?.sem_responsavel ?? 0;
  el.cardMultiplas.textContent = data?.com_multiplas_origens ?? 0;
}

function parametrosListagem() {
  return {
    p_busca: estado.filtros.busca || null,
    p_situacao_operacional: estado.filtros.situacao || null,
    p_id_operador: estado.filtros.idOperador,
    p_id_tipo_indicio: null,
    p_codigo_prioridade: null,
    p_codigo_modo: null,
    p_apenas_multiplas_origens: estado.filtros.multiplas,
    p_apenas_sem_responsavel: estado.filtros.semResponsavel,
    p_apenas_requer_analise: estado.filtros.requerAnalise,
    p_ordenacao: estado.filtros.ordenacao,
    p_pagina: estado.paginacao.pagina,
    p_tamanho_pagina: estado.paginacao.tamanho
  };
}

async function carregarDemandas() {
  estado.carregando = true;
  atualizarControles();
  el.estadoTabela.hidden = false;
  el.estadoTabela.innerHTML = "<strong>Carregando demandas...</strong><span>Aguarde um momento.</span>";
  el.demandasTbody.innerHTML = "";
  
  try {
    const { data, error } = await sb.rpc("listar_demandas_gestao", parametrosListagem());
    if (error) throw error;
    
    estado.demandas = data?.itens || [];
    estado.paginacao = {
      pagina: data?.paginacao?.pagina || 1,
      tamanho: estado.paginacao.tamanho,
      total: data?.paginacao?.total_registros || 0,
      totalPaginas: data?.paginacao?.total_paginas || 0
    };
    renderizarDemandas();
    renderizarPaginacao(data?.paginacao || {});
  } catch (error) {
    console.error(error);
    el.estadoTabela.innerHTML = "<strong>Não foi possível carregar.</strong><span>Tente atualizar a página.</span>";
    exibirMensagem(mensagemErro(error, "Não foi possível carregar as demandas."), "error");
  } finally {
    estado.carregando = false;
    atualizarControles();
  }
}

function renderizarDemandas() {
  if (!estado.demandas.length) {
    el.estadoTabela.hidden = false;
    el.estadoTabela.innerHTML = "<strong>Nenhuma demanda encontrada.</strong><span>Revise os filtros.</span>";
    el.selecionarPaginaCheck.checked = false;
    return;
  }
  
  el.estadoTabela.hidden = true;
  el.demandasTbody.innerHTML = estado.demandas.map(d => {
    const marcada = estado.selecionadas.has(String(d.id_indicio));
    const elegivel = Boolean(d.pode_abrir_e_atribuir);
    const vinculos = d.quantidade_origens > 1
      ? `${escapeHtml((d.origens || [])[0]?.situacao_funcional)} <span class="badge badge-primary">+${d.quantidade_origens - 1}</span>`
      : escapeHtml(d.situacoes_funcionais_resumo);

    return `<tr class="${marcada ? "is-selected" : ""}" data-row-indicio="${d.id_indicio}" aria-selected="${marcada}">
      <td>
        <input class="demand-checkbox" type="checkbox" data-selecionar="${d.id_indicio}" ${marcada ? "checked" : ""} ${elegivel ? "" : "disabled"} aria-label="Selecionar demanda ${escapeHtml(d.identificador_do_indicio)}">
      </td>
      <td><strong>${escapeHtml(d.identificador_do_indicio)}</strong><br><small>${escapeHtml(d.base_de_dados)}</small></td>
      <td class="cell-person"><strong>${escapeHtml(d.nome_atual)}</strong><span>${escapeHtml(d.cpf_mascarado)}</span></td>
      <td><div class="truncate" title="${escapeHtml(d.tipo_indicio)}">${escapeHtml(d.tipo_indicio)}</div></td>
      <td><div class="truncate" title="${escapeHtml(d.situacoes_funcionais_resumo)}">${vinculos}</div></td>
      <td><span class="badge ${classeSituacao(d.situacao_operacional)}">${escapeHtml(rotuloSituacao(d.situacao_operacional))}</span></td>
      <td>${escapeHtml(d.nome_prioridade, "Ainda não definida")}</td>
      <td>${escapeHtml(d.nome_operador_principal, "Sem responsável")}</td>
      <td><strong>${Number(d.dias_de_espera || 0)}</strong> dias<br><small>Última alteração: ${formatarData(d.data_ultima_modificacao)}</small></td>
      <td><button class="btn btn-secondary" type="button" data-visualizar="${d.id_indicio}">Visualizar</button></td>
    </tr>`;
  }).join("");
  
  atualizarCheckPagina();
}

function renderizarPaginacao(p) {
  el.paginacaoInfo.textContent = p.total_registros ? `Exibindo ${p.registro_inicial} a ${p.registro_final} de ${p.total_registros}` : "Nenhuma demanda";
  el.paginaAtualInfo.textContent = `Página ${p.pagina || 1} de ${p.total_paginas || 0}`;
  el.paginaAnteriorBtn.disabled = !p.possui_pagina_anterior;
  el.proximaPaginaBtn.disabled = !p.possui_proxima_pagina;
}

function alternarSelecao(d) {
  if (!d?.pode_abrir_e_atribuir) return;
  const k = String(d.id_indicio);
  if (estado.selecionadas.has(k)) {
    estado.selecionadas.delete(k);
  } else {
    estado.selecionadas.set(k, d);
  }
  renderizarDemandas();
  atualizarControles();
}

function limparSelecao() {
  estado.selecionadas.clear();
  renderizarDemandas();
  atualizarControles();
}

function selecionarPagina(marcar) {
  estado.demandas.filter(d => d.pode_abrir_e_atribuir).forEach(d => {
    if (marcar) estado.selecionadas.set(String(d.id_indicio), d);
    else estado.selecionadas.delete(String(d.id_indicio));
  });
  renderizarDemandas();
  atualizarControles();
}

function atualizarCheckPagina() {
  const elegiveis = estado.demandas.filter(d => d.pode_abrir_e_atribuir);
  const n = elegiveis.filter(d => estado.selecionadas.has(String(d.id_indicio))).length;
  el.selecionarPaginaCheck.checked = elegiveis.length > 0 && n === elegiveis.length;
  el.selecionarPaginaCheck.indeterminate = n > 0 && n < elegiveis.length;
}

function atualizarControles() {
  const n = estado.selecionadas.size;
  el.selectionInfo.textContent = n ? `${n} demanda${n > 1 ? "s" : ""} selecionada${n > 1 ? "s" : ""}` : "Nenhuma demanda selecionada";
  el.limparSelecaoBtn.hidden = !n;
  el.verSelecionadasBtn.hidden = !n;
  el.atribuirSelecionadasBtn.disabled = !n;
  el.atribuirSelecionadasHint.textContent = n ? `${n} selecionada${n > 1 ? "s" : ""}` : "Selecione ao menos uma demanda";
  el.atualizarBtn.disabled = estado.carregando;
}

function abrirDetalhe(d) {
  if (!d) return;
  el.modalIdentificador.textContent = d.identificador_do_indicio || "Não informado";
  el.modalSituacao.textContent = rotuloSituacao(d.situacao_operacional);
  el.modalNumeroIndicio.textContent = d.identificador_do_indicio || "Não informado";
  el.modalCpf.textContent = d.cpf_mascarado || "Não informado";
  el.modalNome.textContent = d.nome_atual || "Não informado";
  el.modalTipo.textContent = d.tipo_indicio || "Não informado";
  el.modalSituacaoFuncional.textContent = d.situacoes_funcionais_resumo || "Não informado";
  el.modalEspera.textContent = `${Number(d.dias_de_espera || 0)} dias`;
  el.modalUltimaAlteracao.textContent = formatarData(d.data_ultima_modificacao);
el.atribuicaoOverlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function fecharDetalhe() {
  el.atribuicaoOverlay.hidden = true;
  document.body.style.overflow = "";
}

function alternarMenu(forcar) {
  const abrir = forcar ?? el.assignmentMenuPopover.hidden;
  el.assignmentMenuPopover.hidden = !abrir;
  el.atribuirDemandasBtn.setAttribute("aria-expanded", String(abrir));
}

function abrirLote(modo) {
  alternarMenu(false);
  [el.loteEtapaSelecionadas, el.loteEtapaTipo, el.loteEtapaCpf].forEach(x => x.hidden = true);
  
  if (modo === "selecionadas") {
    el.loteTitulo.textContent = "Atribuir demandas selecionadas";
    el.loteEtapaSelecionadas.hidden = false;
    el.loteQuantidade.textContent = estado.selecionadas.size;
    el.loteSelecionadasLista.innerHTML = [...estado.selecionadas.values()].map(d =>
      `<div><strong>${escapeHtml(d.identificador_do_indicio)}</strong><span>${escapeHtml(d.nome_atual)} · ${escapeHtml(d.cpf_mascarado)}</span></div>`
    ).join("");
  } else if (modo === "tipo") {
    el.loteTitulo.textContent = "Atribuir por tipo de indício";
    el.loteEtapaTipo.hidden = false;
    const tipos = [...new Map(estado.demandas.map(d => [d.id_tipo_indicio, d.tipo_indicio])).entries()]
      .sort((a, b) => String(a[1]).localeCompare(String(b[1])));
    el.loteTipoSelect.innerHTML = '<option value="">Selecione um tipo</option>' +
      tipos.map(([id, n]) => `<option value="${id}">${escapeHtml(n)}</option>`).join("");
  } else {
    el.loteTitulo.textContent = "Atribuir por CPF";
    el.loteEtapaCpf.hidden = false;
    el.loteCpfInput.value = "";
  }
  
  el.loteOverlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function fecharLote() {
  el.loteOverlay.hidden = true;
  document.body.style.overflow = "";
}

function atualizarCardAtivo(codigo = "TODAS") {
  estado.cardAtivo = codigo;
  document.querySelectorAll(".metric.clickable").forEach(card => {
    const ativo = card.dataset.cardFilter === codigo;
    card.classList.toggle("is-filter-active", ativo);
    card.setAttribute("aria-pressed", String(ativo));
  });
}

function aplicarFiltros() {
  estado.filtros = {
    busca: el.buscaInput.value.trim(),
    situacao: el.situacaoSelect.value,
    idOperador: el.operadorFiltroSelect.value ? Number(el.operadorFiltroSelect.value) : null,
    ordenacao: el.ordenacaoSelect.value,
    multiplas: el.multiplasCheck.checked ? true : null,
    semResponsavel: el.semResponsavelCheck.checked ? true : null,
    requerAnalise: el.analiseCheck.checked ? true : null
  };
  estado.paginacao.pagina = 1;
  carregarDemandas();
}

function registrarEventos() {
  atualizarCardAtivo("TODAS");
  const tema = localStorage.getItem("tema_smi");
  if (tema) document.documentElement.dataset.theme = tema;

  el.temaBtn.addEventListener("click", () => {
    const n = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = n;
    localStorage.setItem("tema_smi", n);
  });

  el.sairBtn.addEventListener("click", async () => {
    try { await sb.auth.signOut(); }
    finally { location.replace(CONFIG.LOGIN_URL); }
  });

  el.atualizarBtn.addEventListener("click", () => Promise.allSettled([carregarResumo(), carregarDemandas()]));

  el.atribuirDemandasBtn.addEventListener("click", e => {
    e.stopPropagation();
    alternarMenu();
  });
  document.addEventListener("click", e => {
    if (!el.assignmentMenu.contains(e.target)) alternarMenu(false);
  });

  el.atribuirSelecionadasBtn.addEventListener("click", () => abrirLote("selecionadas"));
  el.atribuirPorTipoBtn.addEventListener("click", () => abrirLote("tipo"));
  el.atribuirPorCpfBtn.addEventListener("click", () => abrirLote("cpf"));

  el.limparSelecaoBtn.addEventListener("click", limparSelecao);
  el.verSelecionadasBtn.addEventListener("click", () => abrirLote("selecionadas"));
  el.selecionarPaginaCheck.addEventListener("change", e => selecionarPagina(e.target.checked));

  el.demandasTbody.addEventListener("click", e => {
    const check = e.target.closest("input[data-selecionar]");
    if (check) {
      const d = estado.demandas.find(x => String(x.id_indicio) === check.dataset.selecionar);
      alternarSelecao(d);
      return;
    }
    const botao = e.target.closest("button[data-visualizar]");
    if (botao) {
      abrirDetalhe(estado.demandas.find(x => String(x.id_indicio) === botao.dataset.visualizar));
      return;
    }
    if (!e.target.closest("button,input,a,select")) {
      const linha = e.target.closest("tr[data-row-indicio]");
      if (linha) alternarSelecao(estado.demandas.find(x => String(x.id_indicio) === linha.dataset.rowIndicio));
    }
  });
  el.fecharModalBtn.addEventListener("click", fecharDetalhe);
  el.cancelarModalBtn.addEventListener("click", fecharDetalhe);
  el.atribuicaoOverlay.addEventListener("click", e => {
    if (e.target === el.atribuicaoOverlay) fecharDetalhe();
  });

  el.fecharLoteBtn.addEventListener("click", fecharLote);
  el.cancelarLoteBtn.addEventListener("click", fecharLote);
  el.loteOverlay.addEventListener("click", e => {
    if (e.target === el.loteOverlay) fecharLote();
  });

  document.querySelectorAll(".metric.clickable").forEach(card => {
    const fn = () => {
      const t = card.dataset.cardFilter;
      atualizarCardAtivo(t);
      el.situacaoSelect.value = "";
      el.semResponsavelCheck.checked = false;
      el.multiplasCheck.checked = false;
      if (["DISPONIVEL_PARA_ATRIBUICAO", "PENDENTE_DE_TRATAMENTO", "EM_TRATAMENTO"].includes(t)) el.situacaoSelect.value = t;
      else if (t === "SEM_RESPONSAVEL") el.semResponsavelCheck.checked = true;
      else if (t === "MULTIPLAS_ORIGENS") el.multiplasCheck.checked = true;
      aplicarFiltros();
    };
    card.addEventListener("click", fn);
    card.addEventListener("keydown", e => {
      if (["Enter", " "].includes(e.key)) {
        e.preventDefault();
        fn();
      }
    });
  });

  el.buscaInput.addEventListener("input", () => {
    clearTimeout(estado.buscaTimer);
    estado.buscaTimer = setTimeout(aplicarFiltros, 400);
  });
  
  [el.situacaoSelect, el.operadorFiltroSelect, el.ordenacaoSelect, el.semResponsavelCheck, el.multiplasCheck, el.analiseCheck].forEach(x => {
    x.addEventListener("change", () => {
      atualizarCardAtivo("");
      aplicarFiltros();
    });
  });

  el.limparFiltrosBtn.addEventListener("click", () => {
    el.buscaInput.value = "";
    el.situacaoSelect.value = "";
    el.operadorFiltroSelect.value = "";
    el.ordenacaoSelect.value = "DIAS_ESPERA_DESC";
    el.semResponsavelCheck.checked = false;
    el.multiplasCheck.checked = false;
    el.analiseCheck.checked = false;
    atualizarCardAtivo("TODAS");
    aplicarFiltros();
  });

  el.tamanhoPaginaSelect.addEventListener("change", e => {
    estado.paginacao.tamanho = Number(e.target.value);
    estado.paginacao.pagina = 1;
    carregarDemandas();
  });

  el.paginaAnteriorBtn.addEventListener("click", () => {
    if (estado.paginacao.pagina > 1) {
      estado.paginacao.pagina--;
      carregarDemandas();
    }
  });

  el.proximaPaginaBtn.addEventListener("click", () => {
    if (estado.paginacao.pagina < estado.paginacao.totalPaginas) {
      estado.paginacao.pagina++;
      carregarDemandas();
    }
  });

  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if (!el.loteOverlay.hidden) fecharLote();
    else if (!el.atribuicaoOverlay.hidden) fecharDetalhe();
    else if (!el.assignmentMenuPopover.hidden) alternarMenu(false);
  });
}

async function init() {
  registrarEventos();
  try {
    await exigirAcesso();
    await Promise.all([carregarOperadores(), carregarResumo(), carregarDemandas()]);
  } catch (error) {
    console.error(error);
    if (error.message !== "SESSAO_AUSENTE") {
      exibirMensagem(mensagemErro(error, "Erro ao carregar dados do sistema."), "error");
    }
  }
}

init();
