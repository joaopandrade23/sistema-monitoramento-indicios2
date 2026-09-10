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
"usuarioNome","usuarioPerfil","temaBtn","sairBtn","atualizarBtn","mensagem","atribuirDemandasBtn","assignmentMenu","assignmentMenuPopover","atribuirSelecionadasBtn","atribuirSelecionadasHint","atribuirPorTipoBtn","atribuirPorCpfBtn","cardTotal","cardDisponiveis","cardPendentes","cardEmTratamento","cardSemResponsavel","cardMultiplas","buscaInput","situacaoSelect","operadorFiltroSelect","tipoIndicioFiltroSelect","prioridadeFiltroSelect","situacaoPrazoSelect","ordenacaoSelect","semResponsavelCheck","multiplasCheck","analiseCheck","limparFiltrosBtn","tamanhoPaginaSelect","demandasTbody","estadoTabela","selectionInfo","verSelecionadasBtn","limparSelecaoBtn","selecionarPaginaCheck","paginacaoInfo","paginaAtualInfo","paginaAnteriorBtn","proximaPaginaBtn","atribuicaoOverlay","fecharModalBtn","cancelarModalBtn","modalIdentificador","modalSituacao","modalNumeroIndicio","modalCpf","modalNome","modalTipo","modalSituacaoFuncional","modalEspera","modalUltimaAlteracao","modalDescricao","modalPrioridade","modalModo","modalOperador","modalAtribuidoEm","modalNumeroCiclo","modalStatusCiclo","modalPrazo","modalSituacaoPrazo","loteOverlay","fecharLoteBtn","cancelarLoteBtn","revisarLoteBtn","confirmarLoteBtn","loteTitulo","loteEtapaSelecionadas","loteEtapaTipo","loteEtapaCpf","loteQuantidade","loteSelecionadasLista","loteTipoSelect","loteCpfInput","loteOperadorSelect","lotePrioridadeSelect","loteModoSelect","loteModoAjuda","loteColaboradoresField","loteColaboradoresLista","lotePrazoCheck","lotePrazoField","lotePrazoInput","loteAviso","lotePrevia","lotePreviaResumo","lotePreviaParticipantes","lotePreviaDetalhes","modalColaboradores"
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
async function abrirDetalhe(d) {
  if (!d) return;
  estado.detalhe.demanda = d; estado.detalhe.dados = null; el.gerenciarEquipeBtn.hidden = true;
  const req = ++estado.detalhe.requisicao;
  el.modalIdentificador.textContent=d.identificador_do_indicio||"Não informado"; el.modalSituacao.textContent=rotuloSituacao(d.situacao_operacional);
  el.modalNumeroIndicio.textContent=d.identificador_do_indicio||"Não informado"; el.modalCpf.textContent="Carregando..."; el.modalNome.textContent=d.nome_atual||"Não informado";
  el.modalTipo.textContent=d.tipo_indicio||"Não informado"; el.modalSituacaoFuncional.textContent=d.situacoes_funcionais_resumo||"Não informado"; el.modalEspera.textContent=`${Number(d.dias_de_espera||0)} dias`;
  el.modalUltimaAlteracao.textContent=formatarData(d.data_ultima_modificacao); el.modalDescricao.textContent="Carregando descrição completa...";
  el.atribuicaoOverlay.hidden=false; document.body.style.overflow="hidden";
  try {
    const {data,error}=await sb.rpc("obter_detalhes_demanda_modo",{p_id_indicio:Number(d.id_indicio)}); if(error) throw error;
    if(req!==estado.detalhe.requisicao||el.atribuicaoOverlay.hidden)return;
    estado.detalhe.dados = data; el.gerenciarEquipeBtn.hidden = !data.possui_ciclo_ativo;
    el.modalCpf.textContent=data.cpf||"Não informado"; el.modalNome.textContent=data.nome_atual||"Não informado"; el.modalTipo.textContent=data.tipo_indicio||"Não informado";
    el.modalDescricao.textContent=data.descricao_indicio||"Descrição não informada na base."; el.modalSituacaoFuncional.textContent=data.situacoes_funcionais_resumo||"Não informado";
    el.modalPrioridade.textContent = data.nome_prioridade || "Sem prioridade";
    el.modalModo.textContent = data.modo_trabalho?.nome || data.modo_trabalho?.codigo || "Não informado";
    el.modalOperador.textContent = data.operador_principal?.nome_exibicao || data.nome_operador || "Sem operador principal";
    el.modalAtribuidoEm.textContent = (data.operador_principal?.atribuido_em || data.atribuido_em) ? formatarDataHora(data.operador_principal?.atribuido_em || data.atribuido_em) : "Não informado";
    const colaboradores = data.colaboradores || [];
    el.modalColaboradores.innerHTML = colaboradores.length
      ? `<div class="collaborator-chips">${colaboradores.map(c => `<span class="participant-chip">${escapeHtml(c.nome_exibicao)}</span>`).join("")}</div>`
      : '<span class="muted-text">Nenhum colaborador ativo</span>';
    el.modalNumeroCiclo.textContent=data.numero_ciclo??"Não informado"; el.modalStatusCiclo.textContent=data.nome_status_ciclo||rotuloSituacao(data.situacao_operacional);
    el.modalPrazo.textContent = data.prazo_em ? formatarDataHora(data.prazo_em) : "Sem prazo";
    const situacaoPrazo = data.situacao_prazo || classificarSituacaoPrazo(data);
    el.modalSituacaoPrazo.textContent = rotuloPrazo(situacaoPrazo, data.dias_ate_prazo, data.possui_ciclo_ativo);
  } catch(error){ console.error(error); if(req!==estado.detalhe.requisicao)return; el.modalCpf.textContent=d.cpf_mascarado||"Não disponível"; el.modalDescricao.textContent="Não foi possível carregar os detalhes completos."; }
}

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

function registrarEventos() {
  atualizarCardAtivo("TODAS");
  el.redistribuirDemandasBtn.addEventListener("click",e=>{e.stopPropagation();alternarMenuRedistribuicao();});
  el.redistribuirPorTipoBtn.addEventListener("click",()=>abrirRedistribuicao("tipo"));
  el.redistribuirPorCpfBtn.addEventListener("click",()=>abrirRedistribuicao("cpf"));
  el.gerenciarEquipeBtn.addEventListener("click",abrirEquipe);
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
