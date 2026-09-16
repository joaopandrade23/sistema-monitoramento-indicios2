"use strict";

import { supabase } from "./supabase.js";

const CONFIG = Object.freeze({
  LOGIN_URL: "../index.html",
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
  prioridades: [], tiposIndicio: [], lote: { criterio: null, previa: null, assinaturaPrevia: null }, detalhe: { requisicao: 0, demanda: null, dados: null },
  redistribuicao: { criterio: null, previa: null, assinatura: null },
  buscaTimer: null,
  cardAtivo: "TODAS",
  paginacao: { pagina: 1, tamanho: 20, total: 0, totalPaginas: 0 },
  filtros: {
    busca: "",
    situacao: "",
    idOperador: null,
    idTipoIndicio: null,
    codigoPrioridade: null,
    situacaoPrazo: null,
    ordenacao: "DIAS_ESPERA_DESC",
    multiplas: null,
    semResponsavel: null,
    requerAnalise: null
  }
};

const ids = [
"redistributionMenu","redistributionMenuPopover","redistribuirDemandasBtn","redistribuirPorTipoBtn","redistribuirPorCpfBtn","gerenciarEquipeBtn","equipeOverlay","fecharEquipeBtn","cancelarEquipeBtn","equipeResumoAtual","equipeAbaAdicionar","equipeAbaRemover","equipeAbaRedistribuir","equipePainelAdicionar","equipePainelRemover","equipePainelRedistribuir","equipeDisponiveisLista","equipeAtivosLista","equipeConversaoAviso","incluirColaboradoresBtn","remocaoJustificativa","equipeNovoPrincipalSelect","equipeManterAnteriorCheck","equipeRedistribuicaoJustificativa","redistribuirIndividualBtn","equipeAviso","redistribuicaoOverlay","fecharRedistribuicaoBtn","cancelarRedistribuicaoBtn","redistribuicaoTitulo","redistribuicaoCampoTipo","redistribuicaoCampoCpf","redistribuicaoTipoSelect","redistribuicaoCpfInput","redistribuicaoAtualSelect","redistribuicaoNovoSelect","redistribuicaoManterCheck","redistribuicaoJustificativa","redistribuicaoAviso","redistribuicaoPrevia","redistribuicaoResumo","redistribuicaoDetalhes","revisarRedistribuicaoBtn","confirmarRedistribuicaoBtn","loteOperadorLabel",
"usuarioNome","usuarioPerfil","temaBtn","sairBtn","atualizarBtn","mensagem","atribuirDemandasBtn","assignmentMenu","assignmentMenuPopover","atribuirSelecionadasBtn","atribuirSelecionadasHint","atribuirPorTipoBtn","atribuirPorCpfBtn","cardTotal","cardDisponiveis","cardPendentes","cardEmTratamento","cardSemResponsavel","cardMultiplas","buscaInput","situacaoSelect","operadorFiltroSelect","tipoIndicioFiltroSelect","prioridadeFiltroSelect","situacaoPrazoSelect","ordenacaoSelect","semResponsavelCheck","multiplasCheck","analiseCheck","limparFiltrosBtn","tamanhoPaginaSelect","demandasTbody","estadoTabela","selectionInfo","verSelecionadasBtn","limparSelecaoBtn","selecionarPaginaCheck","paginacaoInfo","paginaAtualInfo","paginaAnteriorBtn","proximaPaginaBtn","atribuicaoOverlay","fecharModalBtn","cancelarModalBtn","modalIdentificador","modalSituacao","modalNumeroIndicio","modalCpf","modalNome","modalTipo","modalSituacaoFuncional","modalEspera","modalUltimaAlteracao","modalDescricao","modalPrioridade","modalModo","modalOperador","modalAtribuidoEm","modalNumeroCiclo","modalStatusCiclo","modalPrazo","modalSituacaoPrazo","loteOverlay","fecharLoteBtn","cancelarLoteBtn","revisarLoteBtn","confirmarLoteBtn","loteTitulo","loteEtapaSelecionadas","loteEtapaTipo","loteEtapaCpf","loteQuantidade","loteSelecionadasLista","loteTipoSelect","loteCpfInput","loteOperadorSelect","lotePrioridadeSelect","loteModoSelect","loteModoAjuda","loteColaboradoresField","loteColaboradoresLista","lotePrazoCheck","lotePrazoField","lotePrazoInput","loteAviso","lotePrevia","lotePreviaResumo","lotePreviaParticipantes","lotePreviaDetalhes","modalColaboradores","modalProcessosQtd","modalMensagemDetalhe","painelDetalhesGestor","painelEquipeGestor","painelProcessosGestor","painelHistoricoGestor","exportarRelatorioGestorBtn","loteProcessoSeiCheck","loteProcessoSeiCampos","loteProcessoSeiNumero","loteProcessoSeiAssunto","loteProcessoSeiObservacao","loteProcessoSeiPrincipal"
]
const el = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
const idsAusentes = ids.filter(id => !el[id]);
if (idsAusentes.length) throw new Error(`HTML_INCOMPATIVEL: ${idsAusentes.join(", ")}`);

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
    PENDENTE: "Pendente de tratamento",
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
  if (["PENDENTE_DE_TRATAMENTO", "PENDENTE", "AGUARDANDO_VALIDACAO_TCU"].includes(c)) return "badge-warning";
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


async function carregarPrioridades(){const {data,error}=await sb.from("v_prioridades_disponiveis").select("*").order("nivel_prioridade");if(error)throw error;estado.prioridades=data||[];const op=estado.prioridades.map(p=>`<option value="${escapeHtml(p.codigo_prioridade)}">${escapeHtml(p.nome_prioridade)}</option>`).join("");el.prioridadeFiltroSelect.innerHTML='<option value="">Todas as prioridades</option><option value="SEM_PRIORIDADE">Sem prioridade</option>'+op;el.lotePrioridadeSelect.innerHTML=op;el.lotePrioridadeSelect.value=estado.prioridades.some(p=>p.codigo_prioridade==="NORMAL")?"NORMAL":estado.prioridades[0]?.codigo_prioridade||"";}
async function carregarTiposIndicio(){const {data,error}=await sb.rpc("listar_demandas_gestao",{...parametrosListagem(),p_busca:null,p_situacao_operacional:null,p_id_operador:null,p_id_tipo_indicio:null,p_codigo_prioridade:null,p_situacao_prazo:null,p_pagina:1,p_tamanho_pagina:100});if(error)throw error;estado.tiposIndicio=[...new Map((data?.itens||[]).map(d=>[Number(d.id_tipo_indicio),d.tipo_indicio])).entries()].filter(x=>x[0]&&x[1]).sort((a,b)=>String(a[1]).localeCompare(String(b[1]))).map(([id,nome])=>({id,nome}));el.tipoIndicioFiltroSelect.innerHTML='<option value="">Todos os tipos</option>'+estado.tiposIndicio.map(t=>`<option value="${t.id}">${escapeHtml(t.nome)}</option>`).join("");}
function idsColaboradoresSelecionados() {
  return [...el.loteColaboradoresLista.querySelectorAll('input[type="checkbox"]:checked')]
    .map(input => Number(input.value))
    .filter(Number.isFinite);
}

function atualizarOpcoesColaboradores() {
  const principal = el.loteOperadorSelect.value ? Number(el.loteOperadorSelect.value) : null;
  const selecionados = new Set(idsColaboradoresSelecionados());
  const disponiveis = estado.operadores.filter(o => Number(o.id_usuario) !== principal);

  el.loteColaboradoresLista.innerHTML = disponiveis.length
    ? disponiveis.map(o => `
        <label class="collaborator-option">
          <input type="checkbox" value="${o.id_usuario}" ${selecionados.has(Number(o.id_usuario)) ? "checked" : ""}>
          <span><strong>${escapeHtml(o.nome_exibicao)}</strong>${o.email_institucional ? `<small>${escapeHtml(o.email_institucional)}</small>` : ""}</span>
        </label>`).join("")
    : '<p class="empty-inline">Nenhum outro operador disponível.</p>';
}

function atualizarModoLote() {
  const colaborativo = el.loteModoSelect.value === "COLABORATIVO";
  el.loteColaboradoresField.hidden = !colaborativo;
  el.loteOperadorLabel.textContent = colaborativo ? "2. Responsável principal" : "2. Operador responsável";
  el.loteModoAjuda.textContent = colaborativo
    ? "Um operador principal e pelo menos um colaborador atuarão no ciclo."
    : "Uma pessoa será responsável pelo ciclo.";
  if (!colaborativo) {
    el.loteColaboradoresLista.querySelectorAll('input[type="checkbox"]').forEach(x => { x.checked = false; });
  }
  invalidarPreviaLote();
}

function parametrosLote() {
  const criterio = estado.lote.criterio;
  const dataPrazo = el.lotePrazoCheck.checked ? el.lotePrazoInput.value : null;
  return {
    p_criterio: criterio === "tipo" ? "TIPO_INDICIO" : criterio === "cpf" ? "CPF" : "SELECIONADAS",
    p_ids_indicios: criterio === "selecionadas" ? [...estado.selecionadas.values()].map(x => Number(x.id_indicio)) : null,
    p_id_tipo_indicio: criterio === "tipo" && el.loteTipoSelect.value ? Number(el.loteTipoSelect.value) : null,
    p_cpf: criterio === "cpf" ? el.loteCpfInput.value : null,
    p_id_usuario_operador: el.loteOperadorSelect.value ? Number(el.loteOperadorSelect.value) : null,
    p_codigo_prioridade: el.lotePrioridadeSelect.value || "NORMAL",
    p_id_data_prazo: dataPrazo ? Number(dataPrazo.replaceAll("-", "")) : null,
    p_prazo_em: dataPrazo ? `${dataPrazo}T23:59:59-03:00` : null,
    p_limite_resultados: 100,
    p_codigo_modo: el.loteModoSelect.value || "INDIVIDUAL",
    p_ids_usuarios_colaboradores: el.loteModoSelect.value === "COLABORATIVO" ? idsColaboradoresSelecionados() : null
  };
}

function assinaturaParametrosLote(p) {
  return JSON.stringify({
    ...p,
    p_ids_indicios: [...(p.p_ids_indicios || [])].sort((a, b) => a - b),
    p_ids_usuarios_colaboradores: [...(p.p_ids_usuarios_colaboradores || [])].sort((a, b) => a - b)
  });
}

function validarLote(p) {
  if (!p.p_id_usuario_operador) throw Error("Selecione um operador principal.");
  if (p.p_criterio === "SELECIONADAS" && !p.p_ids_indicios?.length) throw Error("Selecione ao menos uma demanda.");
  if (p.p_criterio === "TIPO_INDICIO" && !p.p_id_tipo_indicio) throw Error("Selecione um tipo de indício.");
  if (p.p_criterio === "CPF" && String(p.p_cpf || "").replace(/\D/g, "").length !== 11) throw Error("Informe um CPF com 11 dígitos.");
  if (el.lotePrazoCheck.checked && !el.lotePrazoInput.value) throw Error("Informe a data limite.");
  if (p.p_codigo_modo === "COLABORATIVO" && !p.p_ids_usuarios_colaboradores?.length) throw Error("Selecione ao menos um colaborador.");
  if (p.p_ids_usuarios_colaboradores?.includes(p.p_id_usuario_operador)) throw Error("O operador principal não pode ser colaborador.");
}

function invalidarPreviaLote() {
  estado.lote.previa = null;
  estado.lote.assinaturaPrevia = null;
  el.confirmarLoteBtn.disabled = true;
  el.lotePrevia.hidden = true;
}

function renderizarPrevia(x) {
  const r = x.resumo || {};
  el.lotePreviaResumo.innerHTML = [
    ["Elegíveis", r.quantidade_elegivel || 0, "success"],
    ["Bloqueadas", r.quantidade_bloqueada || 0, "danger"],
    ["Não encontradas", r.quantidade_nao_encontrada || 0, "warning"],
    ["Excedentes", r.quantidade_excedente || 0, "warning"]
  ].map(a => `<div class="preview-metric ${a[2]}"><strong>${a[1]}</strong><span>${a[0]}</span></div>`).join("");

  const participantes = x.participantes || {};
  const colaboradores = participantes.colaboradores || [];
  el.lotePreviaParticipantes.innerHTML = `
    <h4>Participantes</h4>
    <div class="participant-summary">
      <div><span class="participant-role">Principal</span><strong>${escapeHtml(participantes.principal?.nome_exibicao)}</strong></div>
      <div><span class="participant-role">Modo</span><strong>${escapeHtml(x.modo_trabalho?.nome || x.modo_trabalho?.codigo)}</strong></div>
    </div>
    ${colaboradores.length ? `<div class="collaborator-chips">${colaboradores.map(c => `<span class="participant-chip">${escapeHtml(c.nome_exibicao)}</span>`).join("")}</div>` : '<p class="muted-text">Sem colaboradores.</p>'}`;

  const bloqueadas = x.bloqueadas || [];
  el.lotePreviaDetalhes.innerHTML = bloqueadas.length
    ? `<details><summary>Ver ${bloqueadas.length} demanda(s) bloqueada(s)</summary><ul>${bloqueadas.map(b => `<li>${escapeHtml(b.identificador_do_indicio || b.id_indicio)}: ${escapeHtml(b.motivos?.[0]?.mensagem || "Não elegível")}</li>`).join("")}</ul></details>`
    : '<p class="preview-ok">Todas as demandas localizadas estão aptas.</p>';

  el.lotePrevia.hidden = false;
  el.confirmarLoteBtn.disabled = !x.pode_confirmar;
}

async function revisarLote() {
  try {
    const p = parametrosLote();
    validarLote(p);
    estado.atribuindo = true;
    atualizarControles();
    el.loteAviso.className = "status-banner";
    el.loteAviso.textContent = "Gerando prévia...";

    const { data, error } = await sb.rpc("prever_atribuicao_demandas_modo", {
      ...p,
      p_incluir_detalhes: true
    });
    if (error) throw error;

    estado.lote.previa = data;
    estado.lote.assinaturaPrevia = assinaturaParametrosLote(p);
    renderizarPrevia(data);
    el.loteAviso.className = `status-banner ${data.pode_confirmar ? "success" : "warning"}`;
    el.loteAviso.textContent = data.pode_confirmar
      ? "Prévia concluída. Revise os participantes e confirme."
      : "Não há demandas confirmáveis.";
  } catch (error) {
    invalidarPreviaLote();
    el.loteAviso.className = "status-banner error";
    el.loteAviso.textContent = mensagemErro(error, error.message || "Não foi possível gerar a prévia.");
  } finally {
    estado.atribuindo = false;
    atualizarControles();
  }
}

async function confirmarLote() {
  if (!estado.lote.previa?.pode_confirmar) return;
  try {
    const p = parametrosLote();
    validarLote(p);
    if (estado.lote.assinaturaPrevia !== assinaturaParametrosLote(p)) {
      throw Error("A configuração foi alterada. Gere uma nova prévia antes de confirmar.");
    }

    estado.atribuindo = true;
    atualizarControles();
    el.confirmarLoteBtn.disabled = true;
    el.loteAviso.className = "status-banner";
    el.loteAviso.textContent = "Confirmando atribuição transacional...";

    const { data, error } = await sb.rpc("atribuir_demandas_lote_modo", {
      ...p,
      p_politica_bloqueios: "PROCESSAR_ELEGIVEIS"
    });
    if (error) throw error;

    exibirMensagem(data?.mensagem || "Atribuição concluída.", "success");
    estado.selecionadas.clear();
    fecharLote();
    await Promise.all([carregarResumo(), carregarDemandas()]);
  } catch (error) {
    invalidarPreviaLote();
    el.loteAviso.className = "status-banner error";
    el.loteAviso.textContent = mensagemErro(error, error.message || "Não foi possível confirmar a atribuição.");
  } finally {
    estado.atribuindo = false;
    atualizarControles();
  }
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
    p_id_tipo_indicio: estado.filtros.idTipoIndicio,
    p_codigo_prioridade: estado.filtros.codigoPrioridade,
    p_codigo_modo: null,
    p_apenas_multiplas_origens: estado.filtros.multiplas,
    p_apenas_sem_responsavel: estado.filtros.semResponsavel,
    p_apenas_requer_analise: estado.filtros.requerAnalise,
    p_ordenacao: estado.filtros.ordenacao,
    p_pagina: estado.paginacao.pagina,
    p_tamanho_pagina: estado.paginacao.tamanho,
    p_situacao_prazo: estado.filtros.situacaoPrazo
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
      <td><strong>${Number(d.dias_de_espera || 0)}</strong> dias<br><small>Atualização no e-Pessoal: ${formatarData(d.data_ultima_modificacao)}</small></td>
      <td><button class="btn btn-secondary" type="button" data-visualizar="${d.id_indicio}">Detalhes</button></td>
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
  el.atualizarBtn.disabled = estado.carregando || estado.atribuindo;
  el.revisarLoteBtn.disabled = estado.atribuindo;
  if (estado.atribuindo) el.confirmarLoteBtn.disabled = true;
}


function formatarDataHora(valor) { if (!valor) return "Não informado"; return new Intl.DateTimeFormat("pt-BR", { dateStyle:"short", timeStyle:"short" }).format(new Date(valor)); }
function classificarSituacaoPrazo(dados) {
  if (!dados?.possui_ciclo_ativo) return null;
  if (!dados?.prazo_em) return "SEM_PRAZO";
  const dias = Number(dados.dias_ate_prazo);
  if (!Number.isFinite(dias)) return null;
  if (dias < 0) return "PRAZO_VENCIDO";
  if (dias === 0) return "VENCE_HOJE";
  if (dias <= 3) return "VENCE_EM_ATE_3_DIAS";
  if (dias <= 7) return "VENCE_EM_ATE_7_DIAS";
  return "DENTRO_DO_PRAZO";
}
function rotuloPrazo(codigo, dias, possuiCiclo=true) {
  if (!possuiCiclo) return "Não se aplica";
  return ({SEM_PRAZO:"Sem prazo definido",PRAZO_VENCIDO:`Vencido há ${Math.abs(Number(dias||0))} dia(s)`,VENCE_HOJE:"Vence hoje",VENCE_EM_ATE_3_DIAS:`Vence em ${dias} dia(s)`,VENCE_EM_ATE_7_DIAS:`Vence em ${dias} dia(s)`,DENTRO_DO_PRAZO:`${dias} dia(s) restantes`})[codigo] || "Não informado";
}
function dCard(l,v,c=""){return `<div class="detail-card ${c}"><span>${escapeHtml(l)}</span><strong>${escapeHtml(v??"Não informado")}</strong></div>`}
function dSection(t,h){return `<h3 class="section-title">${escapeHtml(t)}</h3><div class="detail-grid-v3">${h}</div>`}
function switchDetailTab(t){document.querySelectorAll("[data-detail-tab]").forEach(b=>b.classList.toggle("active",b.dataset.detailTab===t));document.querySelectorAll("[data-detail-panel]").forEach(x=>x.hidden=x.dataset.detailPanel!==t)}
async function abrirDetalhe(d){if(!d)return;estado.detalhe.demanda=d;const req=++estado.detalhe.requisicao;el.modalIdentificador.textContent=d.identificador_do_indicio||"Não informado";el.modalNome.textContent=d.nome_atual||"Não informado";el.modalCpf.textContent=d.cpf_mascarado||"CPF protegido";el.modalTipo.textContent=d.tipo_indicio||"Não informado";el.modalSituacao.textContent=rotuloSituacao(d.situacao_operacional);el.modalSituacao.className=`badge ${classeSituacao(d.situacao_operacional)}`;el.modalPrioridade.textContent=d.nome_prioridade||"Não definida";el.modalPrazo.textContent=d.prazo_em?formatarDataHora(d.prazo_em):"Sem prazo";el.modalOperador.textContent=d.nome_operador_principal||"Consultando histórico";el.modalProcessosQtd.textContent="...";el.modalMensagemDetalhe.hidden=true;el.gerenciarEquipeBtn.hidden=true;el.atribuicaoOverlay.hidden=false;document.body.style.overflow="hidden";switchDetailTab("detalhes");[el.painelDetalhesGestor,el.painelEquipeGestor,el.painelProcessosGestor,el.painelHistoricoGestor].forEach(x=>x.innerHTML='<div class="table-state">Carregando...</div>');try{const{data,error}=await sb.rpc("obter_detalhes_demanda",{p_id_indicio:Number(d.id_indicio)});if(error)throw error;if(req!==estado.detalhe.requisicao)return;estado.detalhe.dados=data;const ciclo=data.ciclo_selecionado||data;const processos=data.processos_sei||data.processos||[];const equipe=ciclo.equipe||data.equipe||[];const principal=data.operador_principal||equipe.find(x=>x.papel_principal&&x.participacao_ativa)||{};const colaboradores=data.colaboradores||equipe.filter(x=>!x.papel_principal&&x.participacao_ativa);el.modalCpf.textContent=data.cpf_mascarado||data.cpf||d.cpf_mascarado;el.modalProcessosQtd.textContent=processos.filter(x=>x.processo_ativo!==false).length;el.modalOperador.textContent=principal.nome_exibicao||d.nome_operador_principal||"Responsável histórico não informado";el.painelDetalhesGestor.innerHTML=dSection("Identificação",dCard("Número do indício",data.identificador_do_indicio||d.identificador_do_indicio)+dCard("Base de dados",data.base_de_dados||d.base_de_dados)+dCard("Tipo de indício",data.tipo_indicio||d.tipo_indicio,"full")+dCard("Descrição",data.descricao_indicio||"Descrição não informada.","full"))+dSection("Pessoa",dCard("Nome atual",data.nome_atual||d.nome_atual,"wide")+dCard("CPF",data.cpf_mascarado||data.cpf||d.cpf_mascarado)+dCard("Situação funcional",data.situacoes_funcionais_resumo||d.situacoes_funcionais_resumo,"full"));el.painelEquipeGestor.innerHTML=renderEquipeGestor(d,ciclo,equipe,principal,colaboradores);el.painelProcessosGestor.innerHTML=renderProcessosGestor(processos,d.situacao_operacional==="ENCERRADO_INTERNAMENTE"||ciclo.ciclo_encerrado);try{const{data:hist,error:he}=await sb.rpc("listar_movimentacoes_demanda_gestor",{p_id_indicio:Number(d.id_indicio),p_id_ciclo_tratamento:ciclo.id_ciclo_tratamento||d.id_ciclo_tratamento||null,p_categoria:null,p_data_inicial:null,p_data_final:null,p_pagina:1,p_tamanho_pagina:200});if(he)throw he;const rows=hist?.itens||[];estado.detalhe.historico=rows;el.painelHistoricoGestor.innerHTML=renderHistoricoGestor(rows);setTimeout(()=>{const b=document.getElementById("pdfHistoricoInterno");if(b)b.onclick=exportarRelatorioGestor},0)}catch(e){el.painelHistoricoGestor.innerHTML=`<div class="status-banner warning">Não foi possível carregar o histórico: ${escapeHtml(e.message)}</div>`}}catch(error){console.error(error);el.modalMensagemDetalhe.textContent=mensagemErro(error,"Não foi possível carregar os detalhes.");el.modalMensagemDetalhe.className="status-banner modal-message error";el.modalMensagemDetalhe.hidden=false;el.painelDetalhesGestor.innerHTML=dSection("Dados disponíveis",dCard("Indício",d.identificador_do_indicio)+dCard("Pessoa",d.nome_atual)+dCard("CPF",d.cpf_mascarado)+dCard("Tipo",d.tipo_indicio,"full"))}}
function fecharDetalhe() {
  estado.detalhe.requisicao++;
  el.atribuicaoOverlay.hidden = true;
  if (el.equipeOverlay.hidden) document.body.style.overflow = "";
}

function alternarMenu(forcar) {
  const abrir = forcar ?? el.assignmentMenuPopover.hidden;
  el.assignmentMenuPopover.hidden = !abrir;
  el.atribuirDemandasBtn.setAttribute("aria-expanded", String(abrir));
}

function abrirLote(modo) {
  alternarMenu(false);
  estado.lote = { criterio: modo, previa: null, assinaturaPrevia: null };
  el.loteModoSelect.value = "INDIVIDUAL";
  atualizarOpcoesColaboradores();
  atualizarModoLote();
  el.confirmarLoteBtn.disabled = true;
  el.lotePrevia.hidden = true; el.loteAviso.textContent="Configure a atribuição e gere a prévia antes de confirmar.";
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
    el.loteTipoSelect.innerHTML='<option value="">Selecione um tipo</option>'+estado.tiposIndicio.map(t=>`<option value="${t.id}">${escapeHtml(t.nome)}</option>`).join("");
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
    idTipoIndicio: el.tipoIndicioFiltroSelect.value ? Number(el.tipoIndicioFiltroSelect.value) : null,
    codigoPrioridade: el.prioridadeFiltroSelect.value || null,
    situacaoPrazo: el.situacaoPrazoSelect.value || null,
    ordenacao: el.ordenacaoSelect.value,
    multiplas: el.multiplasCheck.checked ? true : null,
    semResponsavel: el.semResponsavelCheck.checked ? true : null,
    requerAnalise: el.analiseCheck.checked ? true : null
  };
  estado.paginacao.pagina = 1;
  carregarDemandas();
}


function opcoesOperadores(excluir = []) {
  const bloqueados = new Set(excluir.map(Number));
  return estado.operadores.filter(o => !bloqueados.has(Number(o.id_usuario))).map(o => `<option value="${o.id_usuario}">${escapeHtml(o.nome_exibicao)}</option>`).join("");
}
function mostrarAvisoEquipe(texto, tipo="") { el.equipeAviso.textContent=texto; el.equipeAviso.className=`status-banner ${tipo}`.trim(); el.equipeAviso.hidden=false; }
function selecionarAbaEquipe(aba) {
  [["adicionar",el.equipeAbaAdicionar,el.equipePainelAdicionar],["remover",el.equipeAbaRemover,el.equipePainelRemover],["redistribuir",el.equipeAbaRedistribuir,el.equipePainelRedistribuir]].forEach(([k,b,p])=>{b.classList.toggle("is-active",k===aba);p.hidden=k!==aba;});
  el.equipeAviso.hidden=true;
}
function renderizarEquipe(dados) {
  const principal=dados.operador_principal||{}; const colaboradores=dados.colaboradores||[];
  el.equipeResumoAtual.innerHTML=`<div class="role-card role-primary"><span class="participant-role">Responsável principal</span><strong>${escapeHtml(principal.nome_exibicao)}</strong></div><div class="role-card"><span class="participant-role">Modo atual</span><strong>${escapeHtml(dados.modo_trabalho?.nome||dados.modo_trabalho?.codigo)}</strong><small>${colaboradores.length} colaborador(es)</small></div>`;
  const ativos=new Set([Number(principal.id_usuario),...colaboradores.map(c=>Number(c.id_usuario))]);
  const disponiveis=estado.operadores.filter(o=>!ativos.has(Number(o.id_usuario)));
  el.equipeDisponiveisLista.innerHTML=disponiveis.length?disponiveis.map(o=>`<label class="collaborator-option"><input type="checkbox" value="${o.id_usuario}"><span><strong>${escapeHtml(o.nome_exibicao)}</strong><small>${escapeHtml(o.email_institucional,"")}</small></span></label>`).join(""):'<p class="muted-text">Nenhum operador disponível.</p>';
  el.equipeConversaoAviso.hidden=colaboradores.length>0;
  el.equipeAtivosLista.innerHTML=colaboradores.length?colaboradores.map(c=>`<div class="member-row"><div><strong>${escapeHtml(c.nome_exibicao)}</strong><span>Colaborador ativo</span></div><button class="btn btn-danger btn-sm" data-remover-colaborador="${c.id_usuario}">Remover</button></div>`).join(""):'<p class="muted-text">Nenhum colaborador ativo.</p>';
  el.equipeNovoPrincipalSelect.innerHTML='<option value="">Selecione</option>'+opcoesOperadores([principal.id_usuario]);
}
async function recarregarDetalheEquipe() {
  const id=Number(estado.detalhe.demanda?.id_indicio); if(!id)return;
  const {data,error}=await sb.rpc("obter_detalhes_demanda_modo",{p_id_indicio:id}); if(error)throw error;
  estado.detalhe.dados=data; renderizarEquipe(data); return data;
}
async function abrirEquipe() { if(!estado.detalhe.dados)return; renderizarEquipe(estado.detalhe.dados); selecionarAbaEquipe("adicionar"); el.equipeOverlay.hidden=false; document.body.style.overflow="hidden"; }
function fecharEquipe(){el.equipeOverlay.hidden=true; if(el.atribuicaoOverlay.hidden)document.body.style.overflow="";}
async function incluirColaboradores(){try{const ids=[...el.equipeDisponiveisLista.querySelectorAll('input:checked')].map(x=>Number(x.value));if(!ids.length)throw Error("Selecione ao menos um colaborador.");el.incluirColaboradoresBtn.disabled=true;const {data,error}=await sb.rpc("incluir_colaboradores_ciclo",{p_id_indicio:Number(estado.detalhe.demanda.id_indicio),p_ids_usuarios_colaboradores:ids});if(error)throw error;mostrarAvisoEquipe(data.mensagem||"Colaboradores incluídos.","success");await recarregarDetalheEquipe();await Promise.all([carregarResumo(),carregarDemandas()]);}catch(e){mostrarAvisoEquipe(mensagemErro(e,e.message||"Não foi possível incluir."),"error");}finally{el.incluirColaboradoresBtn.disabled=false;}}
async function removerColaborador(id){try{const justificativa=el.remocaoJustificativa.value.trim();if(justificativa.length<10)throw Error("Informe uma justificativa com pelo menos 10 caracteres.");const {data,error}=await sb.rpc("remover_colaborador_ciclo",{p_id_indicio:Number(estado.detalhe.demanda.id_indicio),p_id_usuario_colaborador:Number(id),p_justificativa:justificativa});if(error)throw error;el.remocaoJustificativa.value="";mostrarAvisoEquipe(data.mensagem||"Colaborador removido.","success");await recarregarDetalheEquipe();await Promise.all([carregarResumo(),carregarDemandas()]);}catch(e){mostrarAvisoEquipe(mensagemErro(e,e.message||"Não foi possível remover."),"error");}}
async function redistribuirIndividual(){try{const dados=estado.detalhe.dados;const demanda=estado.detalhe.demanda;const novo=Number(el.equipeNovoPrincipalSelect.value);const justificativa=el.equipeRedistribuicaoJustificativa.value.trim();if(!novo)throw Error("Selecione o novo responsável.");if(justificativa.length<10)throw Error("Informe uma justificativa com pelo menos 10 caracteres.");const base={p_criterio:"CPF",p_id_tipo_indicio:null,p_cpf:dados.cpf,p_id_responsavel_atual:Number(dados.operador_principal.id_usuario),p_id_novo_responsavel:novo,p_manter_anterior_como_colaborador:el.equipeManterAnteriorCheck.checked,p_limite_resultados:100};const {data:previa,error:erroPrevia}=await sb.rpc("prever_redistribuicao_demandas",{...base,p_incluir_detalhes:true});if(erroPrevia)throw erroPrevia;const elegiveis=previa?.elegiveis||[];if(elegiveis.length!==1||Number(elegiveis[0].id_indicio)!==Number(demanda.id_indicio))throw Error("A troca individual não pode ser concluída por este fluxo porque o CPF possui outra demanda pendente com o mesmo responsável. Use a redistribuição em lote por CPF.");const {data,error}=await sb.rpc("redistribuir_demandas_lote",{...base,p_limite_resultados:1,p_justificativa:justificativa,p_politica_bloqueios:"EXIGIR_TODAS_ELEGIVEIS"});if(error)throw error;mostrarAvisoEquipe(data.mensagem||"Responsabilidade alterada.","success");await recarregarDetalheEquipe();await Promise.all([carregarResumo(),carregarDemandas()]);}catch(e){mostrarAvisoEquipe(mensagemErro(e,e.message||"Não foi possível trocar o responsável."),"error");}}
function alternarMenuRedistribuicao(forcar){const abrir=forcar??el.redistributionMenuPopover.hidden;el.redistributionMenuPopover.hidden=!abrir;el.redistribuirDemandasBtn.setAttribute("aria-expanded",String(abrir));}
function parametrosRedistribuicao(incluirDetalhes=true){const tipo=estado.redistribuicao.criterio==="tipo";return {p_criterio:tipo?"TIPO_INDICIO":"CPF",p_id_tipo_indicio:tipo&&el.redistribuicaoTipoSelect.value?Number(el.redistribuicaoTipoSelect.value):null,p_cpf:tipo?null:el.redistribuicaoCpfInput.value,p_id_responsavel_atual:el.redistribuicaoAtualSelect.value?Number(el.redistribuicaoAtualSelect.value):null,p_id_novo_responsavel:el.redistribuicaoNovoSelect.value?Number(el.redistribuicaoNovoSelect.value):null,p_manter_anterior_como_colaborador:el.redistribuicaoManterCheck.checked,p_limite_resultados:100,...(incluirDetalhes?{p_incluir_detalhes:true}:{p_justificativa:el.redistribuicaoJustificativa.value.trim(),p_politica_bloqueios:"PROCESSAR_ELEGIVEIS"})};}
function assinaturaRedistribuicao(){const p=parametrosRedistribuicao();delete p.p_incluir_detalhes;return JSON.stringify(p);}
function abrirRedistribuicao(criterio){alternarMenuRedistribuicao(false);estado.redistribuicao={criterio,previa:null,assinatura:null};el.redistribuicaoTitulo.textContent=criterio==="tipo"?"Redistribuir por tipo de indício":"Redistribuir por CPF";el.redistribuicaoCampoTipo.hidden=criterio!=="tipo";el.redistribuicaoCampoCpf.hidden=criterio!=="cpf";el.redistribuicaoTipoSelect.innerHTML='<option value="">Selecione um tipo</option>'+estado.tiposIndicio.map(t=>`<option value="${t.id}">${escapeHtml(t.nome)}</option>`).join("");const ops=opcoesOperadores();el.redistribuicaoAtualSelect.innerHTML='<option value="">Selecione</option>'+ops;el.redistribuicaoNovoSelect.innerHTML='<option value="">Selecione</option>'+ops;el.redistribuicaoPrevia.hidden=true;el.confirmarRedistribuicaoBtn.disabled=true;el.redistribuicaoOverlay.hidden=false;document.body.style.overflow="hidden";}
function fecharRedistribuicao(){el.redistribuicaoOverlay.hidden=true;document.body.style.overflow="";}
async function revisarRedistribuicao(){try{const p=parametrosRedistribuicao();if(!p.p_id_responsavel_atual||!p.p_id_novo_responsavel)throw Error("Selecione os dois responsáveis.");if(p.p_id_responsavel_atual===p.p_id_novo_responsavel)throw Error("Os responsáveis devem ser diferentes.");if(p.p_criterio==="TIPO_INDICIO"&&!p.p_id_tipo_indicio)throw Error("Selecione o tipo de indício.");if(p.p_criterio==="CPF"&&String(p.p_cpf||"").replace(/\D/g,"").length!==11)throw Error("Informe um CPF com 11 dígitos.");const {data,error}=await sb.rpc("prever_redistribuicao_demandas",p);if(error)throw error;estado.redistribuicao.previa=data;estado.redistribuicao.assinatura=assinaturaRedistribuicao();const r=data.resumo||{};el.redistribuicaoResumo.innerHTML=[["Elegíveis",r.quantidade_elegivel||0,"success"],["Bloqueadas",r.quantidade_bloqueada||0,"danger"],["Excedentes",r.quantidade_excedente||0,"warning"]].map(x=>`<div class="preview-metric ${x[2]}"><strong>${x[1]}</strong><span>${x[0]}</span></div>`).join("");el.redistribuicaoDetalhes.innerHTML=`<div class="transfer-summary"><div><span>De</span><strong>${escapeHtml(data.responsavel_atual?.nome_exibicao)}</strong></div><div class="transfer-arrow">→</div><div><span>Para</span><strong>${escapeHtml(data.novo_responsavel?.nome_exibicao)}</strong></div></div>`;el.redistribuicaoPrevia.hidden=false;el.confirmarRedistribuicaoBtn.disabled=!data.pode_confirmar;el.redistribuicaoAviso.textContent=data.pode_confirmar?"Prévia pronta. Somente pendências elegíveis serão alteradas.":"Nenhuma demanda elegível.";el.redistribuicaoAviso.className=`status-banner ${data.pode_confirmar?"success":"warning"}`;}catch(e){el.redistribuicaoAviso.textContent=mensagemErro(e,e.message||"Não foi possível gerar a prévia.");el.redistribuicaoAviso.className="status-banner error";}}
async function confirmarRedistribuicao(){try{if(estado.redistribuicao.assinatura!==assinaturaRedistribuicao())throw Error("A configuração mudou. Gere uma nova prévia.");const p=parametrosRedistribuicao(false);if(p.p_justificativa.length<10)throw Error("Informe uma justificativa com pelo menos 10 caracteres.");const {data,error}=await sb.rpc("redistribuir_demandas_lote",p);if(error)throw error;exibirMensagem(data.mensagem||"Redistribuição concluída.","success");fecharRedistribuicao();await Promise.all([carregarResumo(),carregarDemandas()]);}catch(e){el.redistribuicaoAviso.textContent=mensagemErro(e,e.message||"Não foi possível confirmar.");el.redistribuicaoAviso.className="status-banner error";}}


const HIST_GESTOR={
 INICIO_TRATAMENTO:["Início do tratamento","history-start","▶"],OBSERVACAO:["Observação registrada","history-observation","✎"],PROVIDENCIA:["Providência adotada","history-providence","✓"],ENCERRAMENTO_INTERNO:["Tratamento encerrado","history-closed","■"],
 VINCULO_PROCESSO_SEI:["Processo SEI vinculado","history-sei","⌁"],INATIVACAO_PROCESSO_SEI:["Processo SEI inativado","history-sei","⌁"],ALTERACAO_PROCESSO_SEI_PRINCIPAL:["Processo principal alterado","history-sei","⌁"],
 REDISTRIBUICAO:["Responsabilidade redistribuída","history-manager","⇄"],INCLUSAO_COLABORADOR:["Colaborador incluído","history-manager","+"],REMOCAO_COLABORADOR:["Colaborador removido","history-manager","−"],ALTERACAO_PRIORIDADE:["Prioridade ou prazo alterado","history-manager","⚙"],
 ATRIBUICAO:["Demanda atribuída","history-manager","→"],IMPORTACAO:["Evento automático do sistema","history-system","A"],ATUALIZACAO_AUTOMATICA:["Atualização automática","history-system","A"]
};
function histMeta(x){const cod=x.codigo_movimentacao||"";if(HIST_GESTOR[cod])return HIST_GESTOR[cod];if(x.evento_automatico||x.categoria==="AUTOMATICA")return[x.nome_movimentacao||"Evento automático","history-system","A"];if(x.categoria==="ADMINISTRATIVA")return[x.nome_movimentacao||"Ação administrativa","history-manager","G"];return[x.nome_movimentacao||"Movimentação","history-default","•"]}
function renderHistoricoGestor(rows){return rows.length?`<div class="history-toolbar"><div><strong>Histórico integral do indício</strong><br><small>Registros operacionais, administrativos e automáticos.</small></div><button class="btn" id="pdfHistoricoInterno" type="button">Exportar relatório em PDF</button></div><div class="timeline">${rows.map(x=>{const m=histMeta(x);return`<article class="timeline-item ${m[1]}"><span class="history-icon">${m[2]}</span><div class="history-content"><div class="history-heading"><strong>${escapeHtml(m[0])}</strong><time>${formatarDataHora(x.realizada_em)}</time></div><p>${escapeHtml(x.descricao||"Sem descrição.")}</p><small>${escapeHtml(x.nome_executor||x.executor?.nome_exibicao||x.categoria||"")}</small></div></article>`}).join("")}</div>`:'<div class="table-state">Nenhuma movimentação registrada.</div>'}
function renderEquipeGestor(d,ciclo,equipe,principal,colaboradores){const encerrado=d.situacao_operacional==="ENCERRADO_INTERNAMENTE"||ciclo.ciclo_encerrado;return(encerrado?'<div class="readonly-callout"><strong>Modo somente leitura.</strong> O ciclo está concluído, mas os participantes históricos permanecem visíveis.</div>':'')+dSection("Ciclo",dCard("Número do ciclo",ciclo.numero_ciclo)+dCard("Situação",ciclo.nome_status_ciclo||rotuloSituacao(d.situacao_operacional))+dCard("Modo",estado.detalhe.dados?.modo_trabalho?.nome||estado.detalhe.dados?.modo_trabalho?.codigo)+dCard("Responsável principal",principal.nome_exibicao||d.nome_operador_principal||"Não informado","wide")+dCard("Colaboradores",colaboradores.map(x=>x.nome_exibicao).join(", ")||"Nenhum colaborador","full"))+(!encerrado?'<div class="team-actions-detail"><button class="btn btn-primary" type="button" data-open-team="adicionar">Adicionar colaborador</button><button class="btn" type="button" data-open-team="remover">Remover colaborador</button><button class="btn" type="button" data-open-team="redistribuir">Trocar ou promover responsável</button></div>':'')}
function renderProcessosGestor(processos,encerrado){const cards=processos.length?processos.map(x=>`<article class="process-card ${x.processo_ativo===false?'inactive':''}"><div><h3>${escapeHtml(x.numero_processo)} ${x.processo_principal?'<span class="badge badge-primary">Principal</span>':''}</h3><p>${escapeHtml(x.assunto||"Sem assunto")}</p><small>Incluído por ${escapeHtml(x.incluido_por||"")} em ${formatarDataHora(x.incluido_em)}${x.processo_ativo===false?`<br>Inativado em ${formatarDataHora(x.inativado_em)}. Motivo: ${escapeHtml(x.motivo_inativacao||"Não informado")}`:''}</small></div>${!encerrado&&x.processo_ativo!==false?`<div class="process-actions">${!x.processo_principal?`<button class="btn" data-gestor-main="${x.id_processo_sei}">Definir principal</button>`:''}<button class="btn btn-danger" data-gestor-inactivate="${x.id_processo_sei}">Inativar</button></div>`:''}</article>`).join(''):'<div class="table-state">Nenhum processo SEI vinculado.</div>';return(!encerrado?'<div class="table-toolbar"><div><strong>Processos SEI</strong><br><small>Vincule e administre os processos relacionados ao ciclo.</small></div><button class="btn btn-primary" id="novoProcessoGestorBtn" type="button">+ Vincular processo</button></div><form class="embedded" id="processoGestorForm" hidden><div class="form-grid-v3"><div class="field"><label for="processoGestorNumero">Número</label><input class="control" id="processoGestorNumero" required></div><div class="field"><label for="processoGestorAssunto">Assunto</label><input class="control" id="processoGestorAssunto"></div><div class="field wide"><label for="processoGestorObservacao">Observação</label><textarea class="control textarea" id="processoGestorObservacao"></textarea></div><label class="check-option compact wide"><input id="processoGestorPrincipal" type="checkbox"><span>Definir como principal</span></label></div><div class="form-actions"><button class="btn" id="cancelarProcessoGestorBtn" type="button">Cancelar</button><button class="btn btn-primary" type="submit">Salvar</button></div></form>':'')+`<div class="process-list">${cards}</div>`}
async function exportarRelatorioGestor(){const d=estado.detalhe.dados,item=estado.detalhe.demanda;if(!d||!item)return;const ciclo=d.ciclo_selecionado||d,processos=d.processos_sei||d.processos||[],equipe=ciclo.equipe||d.equipe||[],hist=estado.detalhe.historico||[];const f=(l,v)=>`<div class="f"><span>${escapeHtml(l)}</span><b>${escapeHtml(v||"Não informado")}</b></div>`,sec=(t,b)=>`<section><h2>${t}</h2>${b}</section>`;const html=`<!doctype html><html><head><meta charset="utf-8"><title>Relatório ${escapeHtml(item.identificador_do_indicio)}</title><style>@page{size:A4;margin:15mm}body{font:9.5pt Arial;color:#172033;line-height:1.4}h1{color:#155eef}h2{font-size:13pt;color:#1849a9;border-bottom:1px solid #b9c8dd;padding-bottom:5px}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}.f{border:1px solid #d0d5dd;border-radius:5px;padding:8px}.f span{display:block;color:#667085;font-size:7.5pt;text-transform:uppercase}.card{border:1px solid #d0d5dd;border-left:4px solid #155eef;border-radius:6px;padding:9px;margin:7px 0;break-inside:avoid}.card header{display:flex;justify-content:space-between}.muted{color:#667085}</style></head><body><h1>Relatório gerencial detalhado do indício</h1><p class="muted">Informações operacionais, administrativas e de auditoria.</p>${sec("1. Identificação",`<div class="grid">${f("Indício",d.identificador_do_indicio||item.identificador_do_indicio)}${f("Pessoa",d.nome_atual||item.nome_atual)}${f("CPF",d.cpf_mascarado||item.cpf_mascarado)}${f("Tipo",d.tipo_indicio||item.tipo_indicio)}${f("Situação funcional",d.situacoes_funcionais_resumo||item.situacoes_funcionais_resumo)}${f("Atualização no e-Pessoal",formatarData(item.data_ultima_modificacao))}</div>`)}${sec("2. Ciclo e participantes",`<div class="grid">${f("Ciclo",ciclo.numero_ciclo)}${f("Situação",ciclo.nome_status_ciclo||rotuloSituacao(item.situacao_operacional))}${f("Prioridade",ciclo.nome_prioridade||item.nome_prioridade)}${f("Prazo",formatarDataHora(ciclo.prazo_em||item.prazo_em))}</div>${equipe.map(x=>`<div class="card"><b>${escapeHtml(x.nome_exibicao||x.nome)}</b><br>${escapeHtml(x.nome_papel||x.codigo_papel)} · ${x.participacao_ativa?'Ativo':'Histórico'}</div>`).join('')}`)}${sec("3. Processos SEI",processos.length?processos.map(x=>`<div class="card"><b>${escapeHtml(x.numero_processo)}</b> ${x.processo_principal?'· Principal':''}<br>${escapeHtml(x.assunto||'Sem assunto')}</div>`).join(''):'<p>Nenhum processo registrado.</p>')}${sec("4. Histórico integral",hist.length?hist.map(x=>{const m=histMeta(x);return`<div class="card"><header><b>${escapeHtml(m[0])}</b><time>${formatarDataHora(x.realizada_em)}</time></header><p>${escapeHtml(x.descricao||'Sem descrição.')}</p><small>${escapeHtml(x.nome_executor||x.categoria||'')}</small></div>`}).join(''):'<p>Nenhuma movimentação registrada.</p>')}${sec("5. Emissão",`<div class="grid">${f("Emitido por",estado.contexto?.nome_exibicao)}${f("Perfil",estado.contexto?.nome_perfil)}${f("Data da emissão",formatarDataHora(new Date()))}${f("Escopo","Operacional, administrativo e automático")}</div>`)}</body></html>`;const frame=document.createElement('iframe');frame.style.cssText='position:fixed;width:1px;height:1px;border:0';document.body.appendChild(frame);frame.contentDocument.open();frame.contentDocument.write(html);frame.contentDocument.close();setTimeout(()=>{frame.contentWindow.print();setTimeout(()=>frame.remove(),2500)},400)}

function registrarEventos() {
  atualizarCardAtivo("TODAS");
  el.redistribuirDemandasBtn.addEventListener("click",e=>{e.stopPropagation();alternarMenuRedistribuicao();});
  el.redistribuirPorTipoBtn.addEventListener("click",()=>abrirRedistribuicao("tipo"));
  el.redistribuirPorCpfBtn.addEventListener("click",()=>abrirRedistribuicao("cpf"));
  el.gerenciarEquipeBtn.addEventListener("click",abrirEquipe);
  el.exportarRelatorioGestorBtn.addEventListener("click",exportarRelatorioGestor);
  el.loteProcessoSeiCheck.addEventListener("change",()=>{el.loteProcessoSeiCampos.hidden=!el.loteProcessoSeiCheck.checked});
  el.painelEquipeGestor.addEventListener("click",e=>{const b=e.target.closest("[data-open-team]");if(b){abrirEquipe();selecionarAbaEquipe(b.dataset.openTeam)}});
  el.fecharEquipeBtn.addEventListener("click",fecharEquipe); el.cancelarEquipeBtn.addEventListener("click",fecharEquipe);
  el.equipeOverlay.addEventListener("click",e=>{if(e.target===el.equipeOverlay)fecharEquipe();});
  el.equipeAbaAdicionar.addEventListener("click",()=>selecionarAbaEquipe("adicionar")); el.equipeAbaRemover.addEventListener("click",()=>selecionarAbaEquipe("remover")); el.equipeAbaRedistribuir.addEventListener("click",()=>selecionarAbaEquipe("redistribuir"));
  el.incluirColaboradoresBtn.addEventListener("click",incluirColaboradores);
  el.equipeAtivosLista.addEventListener("click",e=>{const b=e.target.closest("[data-remover-colaborador]");if(b)removerColaborador(b.dataset.removerColaborador);});
  el.redistribuirIndividualBtn.addEventListener("click",redistribuirIndividual);
  el.fecharRedistribuicaoBtn.addEventListener("click",fecharRedistribuicao); el.cancelarRedistribuicaoBtn.addEventListener("click",fecharRedistribuicao);
  el.redistribuicaoOverlay.addEventListener("click",e=>{if(e.target===el.redistribuicaoOverlay)fecharRedistribuicao();});
  el.revisarRedistribuicaoBtn.addEventListener("click",revisarRedistribuicao); el.confirmarRedistribuicaoBtn.addEventListener("click",confirmarRedistribuicao);
  [el.redistribuicaoTipoSelect,el.redistribuicaoCpfInput,el.redistribuicaoAtualSelect,el.redistribuicaoNovoSelect,el.redistribuicaoManterCheck].forEach(x=>x.addEventListener("change",()=>{estado.redistribuicao.previa=null;estado.redistribuicao.assinatura=null;el.redistribuicaoPrevia.hidden=true;el.confirmarRedistribuicaoBtn.disabled=true;}));

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
    if (!el.redistributionMenu.contains(e.target)) alternarMenuRedistribuicao(false);
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
  document.querySelectorAll("[data-detail-tab]").forEach(b=>b.addEventListener("click",()=>switchDetailTab(b.dataset.detailTab)));
  el.painelProcessosGestor.addEventListener("click",async e=>{const novo=e.target.closest("#novoProcessoGestorBtn"),cancel=e.target.closest("#cancelarProcessoGestorBtn"),main=e.target.closest("[data-gestor-main]"),ina=e.target.closest("[data-gestor-inactivate]");if(novo){document.getElementById("processoGestorForm").hidden=false}if(cancel){document.getElementById("processoGestorForm").hidden=true}if(main){try{const d=estado.detalhe.dados,c=d.ciclo_selecionado||d;await sb.rpc("definir_processo_sei_principal_gestor",{p_id_ciclo_tratamento:Number(c.id_ciclo_tratamento),p_id_processo_sei:Number(main.dataset.gestorMain),p_versao_esperada:Number(c.versao_ciclo||c.versao)});await abrirDetalhe(estado.detalhe.demanda)}catch(x){exibirMensagem(x.message,"error")}}if(ina){const motivo=prompt("Informe a justificativa da inativação:");if(!motivo)return;try{const d=estado.detalhe.dados,c=d.ciclo_selecionado||d;await sb.rpc("inativar_processo_sei_gestor",{p_id_ciclo_tratamento:Number(c.id_ciclo_tratamento),p_id_processo_sei:Number(ina.dataset.gestorInactivate),p_versao_esperada:Number(c.versao_ciclo||c.versao),p_justificativa:motivo});await abrirDetalhe(estado.detalhe.demanda)}catch(x){exibirMensagem(x.message,"error")}}});
  el.painelProcessosGestor.addEventListener("submit",async e=>{if(e.target.id!=="processoGestorForm")return;e.preventDefault();try{const d=estado.detalhe.dados,c=d.ciclo_selecionado||d;const{error}=await sb.rpc("adicionar_processo_sei_gestor",{p_id_ciclo_tratamento:Number(c.id_ciclo_tratamento),p_versao_esperada:Number(c.versao_ciclo||c.versao),p_numero_processo:document.getElementById("processoGestorNumero").value,p_assunto:document.getElementById("processoGestorAssunto").value||null,p_observacao:document.getElementById("processoGestorObservacao").value||null,p_processo_principal:document.getElementById("processoGestorPrincipal").checked});if(error)throw error;await abrirDetalhe(estado.detalhe.demanda)}catch(x){exibirMensagem(x.message,"error")}});
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
  
  [el.situacaoSelect, el.operadorFiltroSelect, el.tipoIndicioFiltroSelect, el.prioridadeFiltroSelect, el.situacaoPrazoSelect, el.ordenacaoSelect, el.semResponsavelCheck, el.multiplasCheck, el.analiseCheck].forEach(x => {
    x.addEventListener("change", () => {
      atualizarCardAtivo("");
      aplicarFiltros();
    });
  });

  el.limparFiltrosBtn.addEventListener("click", () => {
    el.buscaInput.value = "";
    el.situacaoSelect.value = "";
    el.operadorFiltroSelect.value = "";
    el.tipoIndicioFiltroSelect.value = "";
    el.prioridadeFiltroSelect.value = "";
    el.situacaoPrazoSelect.value = "";
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

  el.lotePrazoCheck.addEventListener("change",()=>{el.lotePrazoField.hidden=!el.lotePrazoCheck.checked;invalidarPreviaLote();});
  el.loteOperadorSelect.addEventListener("change", () => { atualizarOpcoesColaboradores(); invalidarPreviaLote(); });
  el.loteModoSelect.addEventListener("change", atualizarModoLote);
  el.loteColaboradoresLista.addEventListener("change", invalidarPreviaLote);
  [el.lotePrioridadeSelect, el.loteTipoSelect, el.loteCpfInput, el.lotePrazoInput].forEach(x => x.addEventListener("change", invalidarPreviaLote));
  el.revisarLoteBtn.addEventListener("click", revisarLote);
  el.confirmarLoteBtn.addEventListener("click", confirmarLote);
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
    await Promise.all([carregarOperadores(),carregarPrioridades(),carregarResumo(),carregarDemandas()]); await carregarTiposIndicio();
  } catch (error) {
    console.error(error);
    if (error.message !== "SESSAO_AUSENTE") {
      exibirMensagem(mensagemErro(error, "Erro ao carregar dados do sistema."), "error");
    }
  }
}

init();

const GX={concluidas:[]};const gx=id=>document.getElementById(id);const movLabels={INICIO_TRATAMENTO:"Tratamentos iniciados",OBSERVACAO:"Observações registradas",PROVIDENCIA:"Providências adotadas",VINCULO_PROCESSO_SEI:"Processos SEI vinculados",INATIVACAO_PROCESSO_SEI:"Processos SEI inativados",ALTERACAO_PROCESSO_SEI_PRINCIPAL:"Alterações do processo principal",ENCERRAMENTO_INTERNO:"Tratamentos encerrados",INCLUSAO_COLABORADOR:"Colaboradores incluídos",REMOCAO_COLABORADOR:"Colaboradores removidos",REDISTRIBUICAO:"Redistribuições realizadas",ALTERACAO_PRIORIDADE:"Prioridades e prazos alterados"};function gl(v){const map={PENDENTE:"Pendente de tratamento",PENDENTE_DE_TRATAMENTO:"Pendente de tratamento",DISPONIVEL_PARA_ATRIBUICAO:"Disponível para atribuição",EM_TRATAMENTO:"Em tratamento",ENCERRADO_INTERNAMENTE:"Encerrado internamente",VENCE_EM_ATE_3_DIAS:"Vence em até 3 dias",VENCE_EM_ATE_7_DIAS:"Vence entre 4 e 7 dias",SEM_PRAZO:"Sem prazo",NAO_SE_APLICA:"Não se aplica",PRAZO_VENCIDO:"Prazo vencido",...movLabels};return map[v]||String(v||"Não informado").replaceAll("_"," ").toLowerCase().replace(/(^|\s)\S/g,m=>m.toUpperCase())}function gbars(id,data,key){const e=gx(id);if(!e)return;if(!data?.length){e.innerHTML='<div class="empty-chart">Sem dados no período.</div>';return}const max=Math.max(...data.map(x=>+x.quantidade),1);e.innerHTML='<div class="bar-chart">'+data.map(x=>`<div class="bar-row"><span class="bar-label" title="${escapeHtml(gl(x.codigo_movimentacao||x[key]))}">${escapeHtml(gl(x.codigo_movimentacao||x[key]))}</span><span class="bar-track"><span class="bar-fill" style="width:${Math.max(+x.quantidade/max*100,3)}%"></span></span><span class="bar-value">${+x.quantidade}</span></div>`).join("")+"</div>"}async function gpanel(){try{const{data,error}=await sb.rpc("resumo_painel_gestor_segep",{p_data_inicial:gx("painelInicio").value||null,p_data_final:gx("painelFim").value||null});if(error)throw error;const k=data.cards||{};gx("metricasPainelGestao").innerHTML=[["Demandas no estoque",k.total_demandas],["Aguardando atribuição",k.sem_responsavel],["Aguardando início",k.aguardando_inicio],["Em tratamento",k.em_analise],["Prazo em até 7 dias",k.prazo_proximo],["Prazo vencido",k.prazo_vencido]].map(([l,v])=>`<article class="metric"><span>${l}</span><strong>${v??0}</strong><small>Visão consolidada</small></article>`).join("");gbars("graficoStatusGestao",data.por_status,"nome_status");gbars("graficoPrazosGestao",data.por_prazo,"faixa");gbars("graficoTiposGestao",data.por_tipo_indicio,"tipo_indicio");gbars("graficoMovimentacoesGestao",data.movimentacoes_administrativas||data.atividades_por_tipo,"nome_movimentacao");const ds=data.concluidas_por_dia||[],max=Math.max(...ds.map(x=>+x.quantidade),1),step=Math.max(1,Math.ceil(ds.length/8));gx("graficoConclusoesGestao").innerHTML=ds.length?'<div class="daily-chart">'+ds.map((x,i)=>`<div class="daily-column-wrap"><div class="daily-column" style="height:${Math.max(+x.quantidade/max*100,2)}%"><span>${x.quantidade||""}</span></div>${i%step===0||i===ds.length-1?`<time>${new Date(x.data+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</time>`:'<time></time>'}</div>`).join("")+"</div>":'<div class="empty-chart">Sem conclusões no período.</div>';const a=data.carga_operadores||[];gx("cargaOperadoresGestao").innerHTML=a.length?a.map(o=>`<article class="operator-load-card"><header><strong>${escapeHtml(o.nome_exibicao)}</strong><span class="badge badge-primary">${o.carga?.total_participacoes_ativas??0}</span></header><small>${escapeHtml(o.email_institucional,"")}</small><div class="load-metrics"><div><b>${o.carga?.como_principal??0}</b><small>Principal</small></div><div><b>${o.carga?.como_colaborador??0}</b><small>Colaborador</small></div><div><b>${o.situacao_principal?.prazos_vencidos??0}</b><small>Vencidas</small></div></div></article>`).join(""):'<div class="empty-chart">Sem operadores.</div>'}catch(e){exibirMensagem(mensagemErro(e,e.message||"Não foi possível carregar o painel."),"error")}}async function gconcluidas(){const e=gx("concluidasConteudo");try{const{data,error}=await sb.rpc("listar_demandas_gestao",{...parametrosListagem(),p_situacao_operacional:"ENCERRADO_INTERNAMENTE",p_pagina:1,p_tamanho_pagina:100});if(error)throw error;GX.concluidas=data?.itens||[];e.innerHTML=GX.concluidas.length?`<div class="table-wrap"><table><thead><tr><th>Indício</th><th>Pessoa</th><th>Tipo</th><th>Situação</th><th>Ação</th></tr></thead><tbody>${GX.concluidas.map(x=>`<tr><td>${escapeHtml(x.identificador_do_indicio)}</td><td>${escapeHtml(x.nome_atual)}<br><small>${escapeHtml(x.cpf_mascarado)}</small></td><td>${escapeHtml(x.tipo_indicio)}</td><td><span class="badge">${escapeHtml(rotuloSituacao(x.situacao_operacional))}</span></td><td><button class="btn btn-secondary" data-concluida="${x.id_indicio}">Detalhes</button></td></tr>`).join("")}</tbody></table></div>`:'<div class="table-state">Nenhuma demanda concluída.</div>'}catch(x){e.innerHTML=`<div class="status-banner error">${escapeHtml(x.message)}</div>`}}function gcsv(rows,name){const q=v=>`"${String(v??"").replaceAll('"','""')}"`;const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+rows.map(r=>r.map(q).join(";")).join("\r\n")],{type:"text/csv;charset=utf-8"}));a.download=name;a.click()}function gtab(t){gx("secaoPainelGestao").hidden=t!=="painel";gx("secaoDemandasAtuais").hidden=t!=="atuais";gx("secaoConcluidasGestao").hidden=t!=="concluidas";document.querySelectorAll("[data-gestao-tab]").forEach(b=>b.classList.toggle("active",b.dataset.gestaoTab===t));if(t==="painel")gpanel();if(t==="concluidas")gconcluidas()}function gboot(){const end=new Date(),start=new Date(Date.now()-29*86400000);gx("painelFim").value=end.toISOString().slice(0,10);gx("painelInicio").value=start.toISOString().slice(0,10);document.querySelectorAll("[data-gestao-tab]").forEach(b=>b.onclick=()=>gtab(b.dataset.gestaoTab));gx("aplicarPainelBtn").onclick=gpanel;gx("exportarAtuaisBtn").onclick=()=>gcsv([["Indício","Pessoa","CPF","Tipo","Situação","Prioridade","Operador"],...estado.demandas.map(x=>[x.identificador_do_indicio,x.nome_atual,x.cpf_mascarado,x.tipo_indicio,rotuloSituacao(x.situacao_operacional),x.nome_prioridade,x.nome_operador_principal])],"demandas_atuais.csv");gx("exportarConcluidasBtn").onclick=()=>gcsv([["Indício","Pessoa","CPF","Tipo","Situação"],...GX.concluidas.map(x=>[x.identificador_do_indicio,x.nome_atual,x.cpf_mascarado,x.tipo_indicio,rotuloSituacao(x.situacao_operacional)])],"demandas_concluidas.csv");gx("concluidasConteudo").onclick=e=>{const b=e.target.closest("[data-concluida]");if(b){const d=GX.concluidas.find(x=>String(x.id_indicio)===b.dataset.concluida);if(d)abrirDetalhe(d)}};gtab("painel")}if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",gboot,{once:true});else gboot();
