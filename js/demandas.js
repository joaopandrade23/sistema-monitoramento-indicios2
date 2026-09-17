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
  prioridades: [], tiposIndicio: [], lote: { criterio: null, previa: null, assinaturaPrevia: null, etapa: 1, escopo: null }, detalhe: { requisicao: 0, demanda: null, dados: null, historico: [], ciclos: [], cicloSelecionado: null, contextoCiclo: null, abaAtiva: "detalhes", cpfVisivel: false },
  concluidas: { itens: [], detalhes: new Map(), expandida: null, pagina: 1, tamanho: 20, total: 0, totalPaginas: 0 },
  redistribuicao: { criterio: null, previa: null, assinatura: null, etapa: 1, escopo: null },
  buscaTimer: null,
  cardAtivo: "DISPONIVEL_PARA_ATRIBUICAO",
  paginacao: { pagina: 1, tamanho: 20, total: 0, totalPaginas: 0 },
  filtros: {
    busca: "",
    situacao: "DISPONIVEL_PARA_ATRIBUICAO",
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
"redistributionMenu","redistributionMenuPopover","redistribuirDemandasBtn","redistribuirPorTipoBtn","redistribuirPorCpfBtn","gerenciarEquipeBtn","equipeOverlay","fecharEquipeBtn","cancelarEquipeBtn","equipeResumoAtual","equipeContextoCiclo","equipeAbaAdicionar","equipeAbaRemover","equipeAbaRedistribuir","equipePainelAdicionar","equipePainelRemover","equipePainelRedistribuir","equipeDisponiveisLista","equipeAtivosLista","equipeConversaoAviso","incluirColaboradoresBtn","remocaoJustificativa","confirmarRemocaoColaboradorBtn","equipeNovoPrincipalSelect","equipeManterAnteriorCheck","equipeRedistribuicaoJustificativa","redistribuirIndividualBtn","equipeAviso","redistribuicaoOverlay","fecharRedistribuicaoBtn","cancelarRedistribuicaoBtn","redistribuicaoTitulo","redistribuicaoTipoSelect","redistribuicaoCpfInput","redistribuicaoAtualSelect","redistribuicaoNovoSelect","redistribuicaoManterCheck","redistribuicaoJustificativa","redistribuicaoAviso","redistribuicaoPrevia","redistribuicaoResumo","redistribuicaoDetalhes","revisarRedistribuicaoBtn","confirmarRedistribuicaoBtn","voltarRedistribuicaoBtn","redistribuicaoConfirmacaoCheck","redistribuicaoConfirmacaoResumo","redistribuicaoIndicioInput","redistribuicaoNovoPrazoCheck","redistribuicaoNovoPrazoField","redistribuicaoNovoPrazoInput","loteOperadorLabel","scopeSelectedCount",
"usuarioNome","usuarioPerfil","temaBtn","sairBtn","atualizarBtn","mensagem","atribuirDemandasBtn","assignmentMenu","assignmentMenuPopover","atribuirSelecionadasBtn","atribuirSelecionadasHint","atribuirPorTipoBtn","atribuirPorCpfBtn","cardTotal","cardDisponiveis","cardPendentes","cardEmTratamento","cardAguardandoValidacao","cardMultiplas","buscaInput","situacaoSelect","operadorFiltroSelect","tipoIndicioFiltroSelect","prioridadeFiltroSelect","situacaoPrazoSelect","ordenacaoSelect","semResponsavelCheck","multiplasCheck","analiseCheck","limparFiltrosBtn","tamanhoPaginaSelect","demandasTbody","estadoTabela","selectionInfo","verSelecionadasBtn","limparSelecaoBtn","selecionarPaginaCheck","paginacaoInfo","paginaAtualInfo","paginaAnteriorBtn","proximaPaginaBtn","atribuicaoOverlay","fecharModalBtn","cancelarModalBtn","modalIdentificador","modalSituacao","modalNumeroIndicio","modalCpf","modalNome","modalTipo","modalSituacaoFuncional","modalEspera","modalUltimaAlteracao","modalDescricao","modalPrioridade","modalModo","modalOperador","modalAtribuidoEm","modalNumeroCiclo","modalStatusCiclo","modalPrazo","modalSituacaoPrazo","loteOverlay","fecharLoteBtn","cancelarLoteBtn","revisarLoteBtn","confirmarLoteBtn","voltarLoteBtn","loteConfirmacaoCheck","loteTitulo","loteEtapaSelecionadas","loteEtapaTipo","loteEtapaCpf","loteQuantidade","loteSelecionadasLista","loteTipoSelect","loteCpfInput","loteOperadorSelect","lotePrioridadeSelect","loteModoSelect","loteModoAjuda","loteColaboradoresField","loteColaboradoresLista","lotePrazoCheck","lotePrazoField","lotePrazoInput","loteAviso","lotePrevia","lotePreviaResumo","lotePreviaParticipantes","lotePreviaDetalhes","modalColaboradores","modalProcessosQtd","modalMensagemDetalhe","painelDetalhesGestor","painelEquipeGestor","painelProcessosGestor","painelHistoricoGestor","painelRelatorioGestor","modalCicloResumo","modalAtualizacaoEPessoal","modalModoLeitura","alternarCpfModalBtn","processoSeiOverlay","fecharProcessoSeiBtn","cancelarProcessoSeiBtn","processoSeiContexto","processoSeiNumero","processoSeiAssunto","processoSeiObservacao","processoSeiPrincipal","processoSeiAviso","salvarProcessoSeiBtn","exportarRelatorioGestorBtn","toggleFiltrosAtuais","filtrosAtuaisConteudo","filtrosAvancadosAtuais","resumoFiltrosAtuais","resultadoAtualResumo","acaoAtribuirSelecionadas","acaoRedistribuirSelecionadas","acaoEquipeSelecionada","metricasConcluidas","toggleFiltrosConcluidas","filtrosAvancadosConcluidas","resumoFiltrosConcluidas","concluidaBusca","concluidaInicio","concluidaFim","concluidaTipo","limparConcluidasBtn","aplicarConcluidasBtn","exportarConcluidasPdfBtn","resumoConcluidas","infoConcluidas","loteVincularSei","loteSeiCampos","loteSeiNumero","loteSeiAssunto","loteSeiObservacao","loteSeiPrincipal","resumoAssistenteAtribuicao","resumoAssistenteRedistribuicao","aplicarFiltrosBtn","confirmacaoOverlay","confirmacaoTitulo","confirmacaoCorpo","confirmacaoCancelar","confirmacaoOk"
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
    PENDENTE_DE_TRATAMENTO: "Aguardando início",
    PENDENTE: "Aguardando início",
    EM_TRATAMENTO: "Em tratamento",
    AGUARDANDO_VALIDACAO_TCU: "Aguardando validação do TCU",
    VALIDADO_TCU: "Validado pelo TCU",
    ENCERRADO_INTERNAMENTE: "Encerrado internamente",
    ESTADO_MISTO_REQUER_ANALISE: "Requer análise"
  })[c] || c || "Não classificada";
}

function classeSituacao(c) {
  if (c === "DISPONIVEL_PARA_ATRIBUICAO") return "status-available";
  if (["PENDENTE_DE_TRATAMENTO", "PENDENTE"].includes(c)) return "status-pending";
  if (c === "EM_TRATAMENTO") return "status-progress";
  if (c === "AGUARDANDO_VALIDACAO_TCU") return "status-external";
  if (c === "ENCERRADO_INTERNAMENTE") return "status-closed";
  if (c === "VALIDADO_TCU") return "status-validated";
  if (c === "CANCELADO") return "status-cancelled";
  if (/ANALISE|MISTO/.test(c || "")) return "status-analysis";
  return "status-neutral";
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
    .select("*")
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
    p_ids_indicios: criterio === "selecionadas" ? [...estado.selecionadas.values()].map(x => Number(x.id_indicio)) : criterio === "filtrados" ? estado.demandas.filter(x => x.pode_abrir_e_atribuir).map(x => Number(x.id_indicio)) : null,
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
  preencherResumoAtribuicao();
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
  /**
   * O resumo volta a ser calculado integralmente no backend. A RPC
   * resumo_demandas_gestao agora utiliza o mesmo universo da listagem:
   * somente indícios atuais, sem estados terminais.
   */
  const { data, error } = await sb.rpc("resumo_demandas_gestao");
  if (error) throw error;

  el.cardDisponiveis.textContent = Number(data?.disponiveis_para_atribuicao ?? 0);
  el.cardPendentes.textContent = Number(data?.pendentes_de_tratamento ?? 0);
  el.cardEmTratamento.textContent = Number(data?.em_tratamento ?? 0);
  // Quarto card representa a etapa seguinte do fluxo, sem duplicar Disponíveis.
  el.cardAguardandoValidacao.textContent = Number(data?.aguardando_validacao_tcu ?? 0);

  // Elementos ocultos permanecem apenas para compatibilidade estrutural.
  el.cardTotal.textContent = Number(data?.total_demandas ?? 0);
  el.cardMultiplas.textContent = Number(data?.com_multiplas_origens ?? 0);
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
  el.estadoTabela.innerHTML = "<strong>Carregando indícios...</strong><span>Aguarde um momento.</span>";
  el.demandasTbody.innerHTML = "";

  try {
    /**
     * A paginação e a exclusão dos estados terminais são executadas no banco.
     * O frontend envia somente os filtros e consome a página devolvida pela RPC.
     */
    const { data, error } = await sb.rpc(
      "listar_demandas_gestao",
      parametrosListagem()
    );
    if (error) throw error;

    estado.demandas = data?.itens || [];

    const paginacao = data?.paginacao || {};
    estado.paginacao = {
      pagina: Number(paginacao.pagina || 1),
      tamanho: Number(paginacao.tamanho_pagina || estado.paginacao.tamanho || 20),
      total: Number(paginacao.total_registros || 0),
      totalPaginas: Number(paginacao.total_paginas || 0)
    };

    renderizarDemandas();
    renderizarPaginacao(paginacao);
  } catch (error) {
    console.error(error);
    el.estadoTabela.innerHTML = "<strong>Não foi possível carregar.</strong><span>Tente atualizar a página.</span>";
    exibirMensagem(
      mensagemErro(error, "Não foi possível carregar os indícios."),
      "error"
    );
  } finally {
    estado.carregando = false;
    atualizarControles();
  }
}

/** Retorna a classe visual da prioridade sem alterar o valor do backend. */
function classePrioridade(codigo) {
  const valor = String(codigo || "SEM_PRIORIDADE").toUpperCase();
  if (/URGENTE|CRITICA/.test(valor)) return "priority-urgent";
  if (/ALTA/.test(valor)) return "priority-high";
  if (/BAIXA/.test(valor)) return "priority-low";
  if (/NORMAL|MEDIA/.test(valor)) return "priority-normal";
  return "priority-undefined";
}

/** Produz textos compactos e corretos para o prazo na listagem. */
function descricaoPrazoListagem(demanda) {
  if (!demanda.prazo_em) {
    return demanda.id_ciclo_tratamento
      ? { principal: "Sem prazo definido", auxiliar: "Definição pendente" }
      : { principal: "Sem prazo definido", auxiliar: "Não aplicável" };
  }
  return {
    principal: formatarData(demanda.prazo_em),
    auxiliar: rotuloPainel(demanda.situacao_prazo || "NO_PRAZO")
  };
}

function renderizarDemandas() {
  if (!estado.demandas.length) {
    el.estadoTabela.hidden = false;
    el.estadoTabela.innerHTML = "<strong>Nenhum indício encontrado.</strong><span>Revise os filtros.</span>";
    el.selecionarPaginaCheck.checked = false;
    return;
  }

  el.estadoTabela.hidden = true;
  el.demandasTbody.innerHTML = estado.demandas.map(d => {
    const marcada = estado.selecionadas.has(String(d.id_indicio));
    const elegivel = Boolean(d.pode_abrir_e_atribuir);
    const prazo = descricaoPrazoListagem(d);
    /**
     * Exibe uma situação funcional representativa e um mini-badge com as
     * demais origens. O tooltip preserva a consulta do conjunto completo.
     */
    const origens = Array.isArray(d.origens) ? d.origens : [];
    const quantidadeOrigens = Math.max(Number(d.quantidade_origens || 0), origens.length);
    const situacoes = [...new Set(origens.map(origem => origem.situacao_funcional).filter(Boolean))];
    const vinculoPrincipal = situacoes[0] || d.situacoes_funcionais_resumo || "Sem situação funcional registrada";
    const vinculosCompletos = situacoes.length ? situacoes.join(" · ") : vinculoPrincipal;
    const adicionais = Math.max(0, quantidadeOrigens - 1);
    const vinculos = `<span class="bond-primary">${escapeHtml(vinculoPrincipal)}</span>${adicionais ? `<span class="bond-count" title="${escapeHtml(vinculosCompletos)}">+${adicionais}</span>` : ""}`;
    const prioridade = d.nome_prioridade || "Não definida";
    const diasEstoque = Number(d.dias_de_espera || 0);

    return `<tr class="${marcada ? "is-selected" : ""}" data-row-indicio="${d.id_indicio}" aria-selected="${marcada}">
      <td class="col-select sticky-select">
        <input class="demand-checkbox" type="checkbox" data-selecionar="${d.id_indicio}"
          ${marcada ? "checked" : ""} ${elegivel ? "" : "disabled"}
          title="${elegivel ? "Selecionar este indício" : "Este indício não está disponível para atribuição"}"
          aria-label="Selecionar indício ${escapeHtml(d.identificador_do_indicio)}">
      </td>
      <td class="col-indicio sticky-indicio"><strong>${escapeHtml(d.identificador_do_indicio)}</strong><br><small>${escapeHtml(d.base_de_dados)}</small></td>
      <td class="col-pessoa cell-person"><strong>${escapeHtml(d.nome_atual)}</strong><span>${escapeHtml(d.cpf_mascarado)}</span></td>
      <td class="col-tipo"><div class="truncate" title="${escapeHtml(d.tipo_indicio)}">${escapeHtml(d.tipo_indicio)}</div></td>
      <td class="col-vinculos"><div class="truncate" title="${escapeHtml(vinculosCompletos)}">${vinculos}</div></td>
      <td class="col-situacao"><span class="badge ${classeSituacao(d.situacao_operacional)}">${escapeHtml(rotuloSituacao(d.situacao_operacional))}</span></td>
      <td class="col-prioridade"><span class="priority-badge ${classePrioridade(d.codigo_prioridade)}">${escapeHtml(prioridade)}</span></td>
      <td class="col-operador">${escapeHtml(d.nome_operador_principal, "Sem responsável")}</td>
      <td class="col-prazo"><strong>${escapeHtml(prazo.principal)}</strong><span class="deadline-indicator ${escapeHtml(d.situacao_prazo || "")}">${escapeHtml(prazo.auxiliar)}</span></td>
      <td class="col-atualizacao"><strong>${formatarData(d.data_ultima_modificacao)}</strong><br><small>e-Pessoal<br>${diasEstoque} ${diasEstoque === 1 ? "dia" : "dias"} no estoque</small></td>
      <td class="col-acoes sticky-actions"><button class="btn btn-secondary" type="button" data-visualizar="${d.id_indicio}">Detalhes</button></td>
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
  atualizarResumoSelecaoGestor();
  el.selectionInfo.textContent = n ? `${n} indício${n > 1 ? "s" : ""} selecionado${n > 1 ? "s" : ""}` : "";
  el.selectionInfo.hidden = !n;
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
/** Alterna a aba e mantém o rodapé global livre de ações duplicadas. */
function switchDetailTab(t) {
  estado.detalhe.abaAtiva = t;
  document.querySelectorAll("[data-detail-tab]").forEach(botao => {
    const ativa = botao.dataset.detailTab === t;
    botao.classList.toggle("active", ativa);
    botao.setAttribute("aria-selected", String(ativa));
  });
  document.querySelectorAll("[data-detail-panel]").forEach(painel => {
    painel.hidden = painel.dataset.detailPanel !== t;
  });
  // A geração de arquivo pertence exclusivamente à aba Relatório.
  el.exportarRelatorioGestorBtn.hidden = true;
  el.gerenciarEquipeBtn.hidden = true;
}
/** Retorna o código de situação mais confiável para o contexto atual. */
function codigoSituacaoDetalhe(demanda = {}, ciclo = {}) {
  return ciclo.codigo_status_ciclo || ciclo.situacao_operacional || demanda.situacao_operacional || "";
}

/** Consolida as regras de edição do ciclo em um único ponto. */
function construirContextoCiclo(demanda = {}, dados = {}, ciclo = {}) {
  const possuiCiclo = Boolean(ciclo.id_ciclo_tratamento || demanda.id_ciclo_tratamento);
  const codigo = codigoSituacaoDetalhe(demanda, ciclo);
  const encerrado = Boolean(ciclo.encerrado_em || ciclo.ciclo_encerrado) || [
    "ENCERRADO_INTERNAMENTE", "VALIDADO_TCU", "CANCELADO"
  ].includes(codigo);
  const permiteMovimentacao = ciclo.permite_movimentacao === true || dados.permite_movimentacao === true;
  const editavel = possuiCiclo && !encerrado && ciclo.somente_leitura !== true && permiteMovimentacao;
  return {
    possuiCiclo,
    codigo,
    encerrado,
    editavel,
    somenteLeitura: !editavel,
    numero: ciclo.numero_ciclo || demanda.numero_ciclo || null,
    versao: ciclo.versao_ciclo || ciclo.versao || demanda.versao_ciclo || null
  };
}

/** Produz a linguagem de contexto sem hifens artificiais. */
function rotulosContextoCiclo(contexto, ciclo = {}) {
  if (!contexto.possuiCiclo) {
    return {
      ciclo: "Ainda não iniciado",
      prioridade: "Não definida",
      prazo: "Não aplicável",
      responsavel: "Não atribuído",
      processos: "Nenhum vínculo"
    };
  }
  return {
    ciclo: `Ciclo ${contexto.numero || "não informado"}${contexto.versao ? ` · versão ${contexto.versao}` : ""}`,
    prioridade: ciclo.nome_prioridade || "Não definida",
    prazo: ciclo.prazo_em ? formatarDataHora(ciclo.prazo_em) : "Sem prazo definido",
    responsavel: null,
    processos: null
  };
}

/** Atualiza toda a faixa contextual a partir do ciclo selecionado. */
function aplicarContextoCicloModal(demanda, dados, ciclo, processos = [], principal = {}) {
  const contexto = construirContextoCiclo(demanda, dados, ciclo);
  const rotulos = rotulosContextoCiclo(contexto, ciclo);
  estado.detalhe.cicloSelecionado = contexto.possuiCiclo ? ciclo : null;
  estado.detalhe.contextoCiclo = contexto;

  el.modalCicloResumo.textContent = rotulos.ciclo;
  el.modalPrioridade.textContent = contexto.possuiCiclo ? (ciclo.nome_prioridade || demanda.nome_prioridade || "Não definida") : rotulos.prioridade;
  el.modalPrazo.textContent = contexto.possuiCiclo
    ? (ciclo.prazo_em || demanda.prazo_em ? formatarDataHora(ciclo.prazo_em || demanda.prazo_em) : "Sem prazo definido")
    : rotulos.prazo;
  el.modalOperador.textContent = contexto.possuiCiclo
    ? (principal.nome_exibicao || demanda.nome_operador_principal || "Não informado no histórico")
    : rotulos.responsavel;

  const ativos = (processos || []).filter(item => item.processo_ativo !== false).length;
  el.modalProcessosQtd.textContent = ativos ? `${ativos} ${ativos === 1 ? "processo" : "processos"}` : rotulos.processos || "Nenhum vínculo";

  // O badge principal usa o ciclo quando o indício já foi concluído.
  const codigoBadge = contexto.codigo;
  el.modalSituacao.textContent = contexto.possuiCiclo ? rotuloSituacao(codigoBadge) : rotuloSituacao(demanda.situacao_operacional);
  el.modalSituacao.className = `badge ${classeSituacao(codigoBadge || demanda.situacao_operacional)}`;

  el.modalModoLeitura.hidden = false;
  el.modalModoLeitura.className = `cycle-mode-banner ${contexto.editavel ? "is-editable" : "is-readonly"}`;
  if (!contexto.possuiCiclo) {
    el.modalModoLeitura.innerHTML = "<strong>Sem ciclo de tratamento</strong><span>A equipe será definida na atribuição inicial do indício.</span>";
  } else if (contexto.somenteLeitura) {
    const data = ciclo.encerrado_em ? ` em ${formatarDataHora(ciclo.encerrado_em)}` : "";
    el.modalModoLeitura.innerHTML = `<strong>Ciclo em somente leitura</strong><span>Este ciclo foi encerrado${data} e não permite alterações.</span>`;
  } else {
    el.modalModoLeitura.innerHTML = "<strong>Ciclo atual e editável</strong><span>As alterações permitidas serão registradas no histórico integral.</span>";
  }
}

/** Renderiza o seletor apenas quando ele acrescenta contexto ao usuário. */
function renderizarSeletorCiclos(ciclos = [], selecionado = null) {
  if (!ciclos.length) {
    return '<div class="cycle-empty-state"><strong>Este indício ainda não possui ciclo de tratamento.</strong><span>Atribua o indício para iniciar o primeiro ciclo.</span></div>';
  }
  if (ciclos.length === 1) {
    const ciclo = ciclos[0];
    const estadoCiclo = interpretarCiclo(ciclo);
    const situacao = ciclo.nome_status_ciclo || rotuloSituacao(ciclo.codigo_status_ciclo);
    return `<div class="cycle-single-summary"><div><span>Ciclo selecionado</span><strong>Ciclo ${ciclo.numero_ciclo || "-"}${ciclo.versao_ciclo || ciclo.versao ? ` · versão ${ciclo.versao_ciclo || ciclo.versao}` : ""}</strong></div><div><span>Período</span><strong>${formatarDataHora(ciclo.aberto_em || ciclo.iniciado_em)} a ${formatarDataHora(ciclo.encerrado_em)}</strong></div><span class="badge ${classeSituacao(ciclo.codigo_status_ciclo)}">${escapeHtml(situacao)}</span><small>${estadoCiclo.somenteLeitura ? "Somente leitura" : "Editável"}</small></div>`;
  }
  return `<div class="cycle-selector">${ciclos.map(ciclo => {
    const estadoCiclo = interpretarCiclo(ciclo);
    const ativo = Number(ciclo.id_ciclo_tratamento) === Number(selecionado?.id_ciclo_tratamento);
    const contexto = estadoCiclo.concluidoOperacionalmente ? "Concluído" : estadoCiclo.cicloVigente ? "Ciclo atual" : "Histórico";
    return `<button class="cycle-card ${ativo ? "active" : ""}" type="button" data-ciclo-selecionar="${ciclo.id_ciclo_tratamento}" aria-pressed="${ativo}"><header><strong>Ciclo ${ciclo.numero_ciclo}</strong><span class="badge ${classeSituacao(ciclo.codigo_status_ciclo)}">${escapeHtml(ciclo.nome_status_ciclo || rotuloSituacao(ciclo.codigo_status_ciclo))}</span></header><small>${formatarDataHora(ciclo.aberto_em || ciclo.iniciado_em)} a ${formatarDataHora(ciclo.encerrado_em)}</small><span>${contexto} · ${estadoCiclo.somenteLeitura ? "Somente leitura" : "Editável"}</span></button>`;
  }).join("")}</div>`;
}

function cpfCompletoDisponivel(dados = {}, demanda = {}) {
  const cpf = String(dados.cpf || demanda.cpf || "").replace(/\D/g, "");
  return cpf.length === 11 ? cpf : null;
}
function formatarCpfCompleto(cpf) { return cpf ? cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : null; }
function atualizarControleCpf() {
  const dados = estado.detalhe.dados || {};
  const demanda = estado.detalhe.demanda || {};
  const completo = cpfCompletoDisponivel(dados, demanda);
  const mascara = dados.cpf_mascarado || demanda.cpf_mascarado || "CPF protegido";
  el.modalCpf.textContent = estado.detalhe.cpfVisivel && completo ? formatarCpfCompleto(completo) : mascara;
  el.alternarCpfModalBtn.hidden = !completo;
  el.alternarCpfModalBtn.textContent = estado.detalhe.cpfVisivel ? "Ocultar CPF" : "Mostrar CPF";
  el.alternarCpfModalBtn.setAttribute("aria-pressed", String(estado.detalhe.cpfVisivel));
}
async function abrirDetalhe(d){if(!d)return;estado.detalhe.demanda=d;estado.detalhe.cpfVisivel=false;const req=++estado.detalhe.requisicao;el.modalIdentificador.textContent=d.identificador_do_indicio||"Não informado";el.modalNome.textContent=d.nome_atual||"Não informado";el.modalCpf.textContent=d.cpf_mascarado||"CPF protegido";el.modalTipo.textContent=d.tipo_indicio||"Não informado";el.modalSituacao.textContent=rotuloSituacao(d.situacao_operacional);el.modalSituacao.className=`badge ${classeSituacao(d.situacao_operacional)}`;el.modalPrioridade.textContent=d.nome_prioridade||"Não definida";el.modalPrazo.textContent=d.id_ciclo_tratamento?(d.prazo_em?formatarDataHora(d.prazo_em):"Sem prazo definido"):"Não aplicável";el.modalOperador.textContent=d.id_ciclo_tratamento?(d.nome_operador_principal||"Consultando histórico"):"Não atribuído";el.modalProcessosQtd.textContent="Consultando...";el.modalCicloResumo.textContent=d.id_ciclo_tratamento?"Consultando ciclo...":"Ainda não iniciado";el.modalModoLeitura.hidden=true;el.modalMensagemDetalhe.hidden=true;el.gerenciarEquipeBtn.hidden=true;el.atribuicaoOverlay.hidden=false;document.body.style.overflow="hidden";switchDetailTab("detalhes");[el.painelDetalhesGestor,el.painelEquipeGestor,el.painelProcessosGestor,el.painelHistoricoGestor,el.painelRelatorioGestor].forEach(x=>x.innerHTML='<div class="table-state">Carregando...</div>');try{const{data,error}=await sb.rpc("obter_detalhes_demanda_gestor",{p_id_indicio:Number(d.id_indicio),p_id_ciclo_tratamento:d.id_ciclo_tratamento||null});if(error)throw error;if(req!==estado.detalhe.requisicao)return;estado.detalhe.dados=data;const ciclo=data.ciclo_selecionado||data;const processos=data.processos_sei||data.processos||[];const equipeNormalizada=normalizarEquipeDoCiclo(data,d);const principal=equipeNormalizada.principal;const colaboradores=equipeNormalizada.colaboradores;atualizarControleCpf();el.modalAtualizacaoEPessoal.textContent=formatarDataHora(data.data_ultima_modificacao||d.data_ultima_modificacao);aplicarContextoCicloModal(d,data,ciclo,processos,principal);el.painelDetalhesGestor.innerHTML=dSection("Identificação",dCard("Número do indício",data.identificador_do_indicio||d.identificador_do_indicio)+dCard("Base de dados",data.base_de_dados||d.base_de_dados)+dCard("Tipo de indício",data.tipo_indicio||d.tipo_indicio,"full classified-text")+dCard("Descrição",data.descricao_indicio||"Descrição não informada.","full narrative-text"))+dSection("Pessoa",dCard("Nome atual",data.nome_atual||d.nome_atual,"wide")+dCard("CPF",data.cpf_mascarado||data.cpf||d.cpf_mascarado)+`<div class="detail-card full detail-bonds"><span>Situação funcional</span><strong>${renderVinculosDetalhe(data,d)}</strong></div>`)+renderListaVinculosDetalhe(data,d);el.painelEquipeGestor.innerHTML=renderEquipeConsolidada(data,d);el.painelProcessosGestor.innerHTML = processos.length
  ? `<div class="process-list">${processos.map(x => `<article class="process-detail-card ${x.processo_ativo === false ? "inactive" : ""}"><header><h3>${escapeHtml(x.numero_processo)}</h3><div>${x.processo_principal ? '<span class="badge badge-primary">Principal</span>' : '<span class="badge badge-neutral">Adicional</span>'} ${x.processo_ativo === false ? '<span class="badge badge-neutral">Inativo</span>' : '<span class="badge status-progress">Ativo</span>'}</div></header><p>${escapeHtml(x.assunto || "Assunto não informado")}</p>${x.observacao ? `<p class="muted">${escapeHtml(x.observacao)}</p>` : ""}<dl><div><dt>Vinculado em</dt><dd>${formatarDataHora(x.incluido_em || x.vinculado_em)}</dd></div><div><dt>Responsável pelo vínculo</dt><dd>${escapeHtml(x.nome_executor || x.nome_usuario || "Não informado")}</dd></div></dl></article>`).join("")}</div>`
  : `<div class="process-empty-state"><div><strong>${estado.detalhe.contextoCiclo?.somenteLeitura ? "Nenhum processo foi vinculado durante este ciclo." : "Nenhum processo SEI vinculado"}</strong><p>${estado.detalhe.contextoCiclo?.somenteLeitura ? "O ciclo permanece disponível para consulta histórica." : "Este ciclo ainda não possui processo administrativo associado."}</p>${!estado.detalhe.contextoCiclo?.somenteLeitura && estado.detalhe.contextoCiclo?.possuiCiclo ? '<button class="btn btn-primary" type="button" data-add-processo-sei>Vincular processo SEI</button>' : ""}</div></div>`;
try{const{data:hist,error:he}=await sb.rpc("listar_movimentacoes_demanda_gestor",{p_id_indicio:Number(d.id_indicio),p_id_ciclo_tratamento:ciclo.id_ciclo_tratamento||d.id_ciclo_tratamento||null,p_categoria:null,p_data_inicial:null,p_data_final:null,p_pagina:1,p_tamanho_pagina:200});if(he)throw he;const rows=hist?.itens||[];estado.detalhe.historico=rows;el.painelRelatorioGestor.innerHTML=`<div class="report-cover"><span class="eyebrow">Relatório do indício</span><h3>Indício ${escapeHtml(d.identificador_do_indicio)}</h3><p>O relatório reúne identificação, vínculos funcionais, ciclo selecionado, participantes, processos SEI e auditoria integral.</p><div class="report-scope"><article><span>Escopo</span><strong>${ciclo.id_ciclo_tratamento ? `Ciclo ${ciclo.numero_ciclo || "selecionado"}` : "Histórico do indício"}</strong></article><article><span>Situação</span><strong>${escapeHtml(ciclo.nome_status_ciclo || rotuloSituacao(d.situacao_operacional))}</strong></article><article><span>Movimentações</span><strong>${rows.length}</strong></article></div><button class="btn btn-primary" type="button" data-export-report>Gerar relatório em PDF</button></div><div class="report-sections"><article><strong>Identificação e origem</strong><p>Dados da pessoa, CPF mascarado, vínculos funcionais e atualização na origem.</p></article><article><strong>Ciclo e participantes</strong><p>Responsável principal, colaboradores e participações históricas.</p></article><article><strong>Processos SEI</strong><p>Processo principal, vínculos adicionais e inativos.</p></article><article><strong>Auditoria integral</strong><p>${rows.length} ${rows.length === 1 ? "movimentação" : "movimentações"} no ciclo selecionado.</p></article></div>`;el.painelHistoricoGestor.innerHTML=renderHistoricoConsolidado(rows);atualizarHistoricoFiltrado()}catch(e){el.painelHistoricoGestor.innerHTML=`<div class="status-banner warning">Não foi possível carregar o histórico: ${escapeHtml(e.message)}</div>`}}catch(error){console.error(error);el.modalMensagemDetalhe.textContent=mensagemErro(error,"Não foi possível carregar os detalhes.");el.modalMensagemDetalhe.className="status-banner modal-message error";el.modalMensagemDetalhe.hidden=false;el.painelDetalhesGestor.innerHTML=dSection("Dados disponíveis",dCard("Indício",d.identificador_do_indicio)+dCard("Pessoa",d.nome_atual)+dCard("CPF",d.cpf_mascarado)+dCard("Tipo",d.tipo_indicio,"full"))}}
function fecharDetalhe() {
  estado.detalhe.cpfVisivel = false;
  estado.detalhe.requisicao++;
  el.atribuicaoOverlay.hidden = true;
  if (el.equipeOverlay.hidden) document.body.style.overflow = "";
}

function alternarMenu(forcar) {
  const abrir = forcar ?? el.assignmentMenuPopover.hidden;
  el.assignmentMenuPopover.hidden = !abrir;
  el.atribuirDemandasBtn.setAttribute("aria-expanded", String(abrir));
}

function abrirLote() {
  estado.lote={criterio:null,escopo:null,previa:null,assinaturaPrevia:null,etapa:1}; el.loteTitulo.textContent="Atribuir indícios"; el.loteModoSelect.value="INDIVIDUAL"; atualizarOpcoesColaboradores(); atualizarModoLote();
  el.scopeSelectedCount.textContent=estado.selecionadas.size?`${estado.selecionadas.size} indício(s) selecionado(s).`:"Nenhum indício selecionado.";
  document.querySelectorAll("[data-assignment-scope]").forEach(b=>b.classList.remove("active")); document.querySelector("[data-assignment-scope-slot]").innerHTML='<div class="scope-empty-state">Selecione um escopo para continuar.</div>';
  el.loteConfirmacaoCheck.checked=false; limparAvisoOperacao(el.loteAviso); mostrarEtapaLote(1); el.loteOverlay.hidden=false; document.body.style.overflow="hidden";
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

/** Atualiza o resumo textual e o título da listagem conforme os filtros. */
function atualizarResumoFiltrosAtuais() {
  const ativos = [];
  if (estado.filtros.busca) ativos.push(`Busca: ${estado.filtros.busca}`);
  if (estado.filtros.situacao) ativos.push(rotuloSituacao(estado.filtros.situacao));
  if (estado.filtros.idOperador) ativos.push(`Operador: ${el.operadorFiltroSelect.selectedOptions[0]?.textContent || "selecionado"}`);
  if (estado.filtros.idTipoIndicio) ativos.push(`Tipo: ${el.tipoIndicioFiltroSelect.selectedOptions[0]?.textContent || "selecionado"}`);
  if (estado.filtros.codigoPrioridade) ativos.push(`Prioridade: ${el.prioridadeFiltroSelect.selectedOptions[0]?.textContent || "selecionada"}`);
  if (estado.filtros.situacaoPrazo) ativos.push(`Prazo: ${rotuloPainel(estado.filtros.situacaoPrazo)}`);
  if (estado.filtros.semResponsavel) ativos.push("Sem responsável");
  if (estado.filtros.multiplas) ativos.push("Com múltiplas origens");
  if (estado.filtros.requerAnalise) ativos.push("Requerem análise");
  el.resumoFiltrosAtuais.textContent = ativos.length
    ? `${ativos.length} filtro(s) ativo(s): ${ativos.join(" · ")}`
    : "Nenhum filtro ativo";

  const titulos = {
    DISPONIVEL_PARA_ATRIBUICAO: "Indícios disponíveis para atribuição",
    PENDENTE: "Indícios aguardando início",
    PENDENTE: "Indícios aguardando início",
    PENDENTE_DE_TRATAMENTO: "Indícios aguardando início",
    EM_TRATAMENTO: "Indícios em tratamento",
    AGUARDANDO_VALIDACAO_TCU: "Indícios aguardando validação do TCU"
  };
  const titulo = estado.filtros.semResponsavel
    ? "Indícios sem responsável"
    : (titulos[estado.filtros.situacao] || "Todos os indícios atuais");
  document.querySelector("#secaoDemandasAtuais .selection-summary strong").textContent = titulo;
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
  atualizarResumoFiltrosAtuais();
  carregarDemandas();
}


function opcoesOperadores(excluir = []) {
  const bloqueados = new Set(excluir.map(Number));
  return estado.operadores.filter(o => !bloqueados.has(Number(o.id_usuario))).map(o => `<option value="${o.id_usuario}">${escapeHtml(o.nome_exibicao)}</option>`).join("");
}
function mostrarAvisoEquipe(texto, tipo="") { el.equipeAviso.textContent=texto; el.equipeAviso.className=`status-banner ${tipo}`.trim(); el.equipeAviso.hidden=false; }
function selecionarAbaEquipe(aba) {
  [["adicionar",el.equipeAbaAdicionar,el.equipePainelAdicionar],["remover",el.equipeAbaRemover,el.equipePainelRemover],["redistribuir",el.equipeAbaRedistribuir,el.equipePainelRedistribuir]].forEach(([k,b,p])=>{const ativa=k===aba;b.classList.toggle("is-active",ativa);b.setAttribute("aria-selected",String(ativa));p.hidden=!ativa;});
  el.equipeAviso.hidden=true;
}
function renderizarEquipe(dados) {
  const contexto = estado.detalhe.contextoCiclo || construirContextoCiclo(estado.detalhe.demanda || {}, dados, dados.ciclo_selecionado || dados);
  if (!contexto.possuiCiclo || contexto.somenteLeitura) {
    fecharEquipe();
    return;
  }

  const equipeNormalizada = normalizarEquipeDoCiclo(dados, estado.detalhe.demanda || {});
  const { principal, colaboradores, ciclo, nomeModo } = equipeNormalizada;
  el.equipeContextoCiclo.innerHTML = `<span>Indício ${escapeHtml(estado.detalhe.demanda?.identificador_do_indicio)}</span><strong>Ciclo ${ciclo.numero_ciclo || contexto.numero || "atual"}</strong>`;
  el.equipeResumoAtual.innerHTML = `<article><span>Responsável atual</span><strong>${escapeHtml(principal.nome_exibicao, "Não atribuído")}</strong></article><article><span>Modo de trabalho</span><strong>${escapeHtml(nomeModo)}</strong><small>${colaboradores.length} ${colaboradores.length === 1 ? "colaborador ativo" : "colaboradores ativos"}</small></article>`;

  const ativosIds = new Set([principal.id_usuario, ...colaboradores.map(item => item.id_usuario)].filter(Boolean).map(Number));
  const ativosNomes = new Set([principal.nome_exibicao, ...colaboradores.map(item => item.nome_exibicao)].filter(Boolean).map(nome => String(nome).toLowerCase()));
  const disponiveis = estado.operadores.filter(item => !ativosIds.has(Number(item.id_usuario)) && !ativosNomes.has(String(item.nome_exibicao || "").toLowerCase()));
  el.equipeDisponiveisLista.innerHTML = disponiveis.length ? disponiveis.map(item => {
    const carga = resumoCargaOperador(item);
    return `<label class="operator-choice"><input type="checkbox" value="${item.id_usuario}"><span class="operator-choice-copy"><strong>${escapeHtml(item.nome_exibicao)}</strong>${item.email_institucional ? `<small>${escapeHtml(item.email_institucional)}</small>` : ""}${carga ? `<em>${escapeHtml(carga)}</em>` : ""}</span></label>`;
  }).join("") : '<div class="team-empty-state"><strong>Nenhum operador disponível</strong><span>Todos os operadores disponíveis já participam deste ciclo.</span></div>';
  el.equipeConversaoAviso.hidden = colaboradores.length > 0;

  el.equipeAtivosLista.innerHTML = colaboradores.length ? colaboradores.map(item => `<label class="removal-choice"><input type="radio" name="colaborador-remocao" value="${item.id_usuario}"><span><strong>${escapeHtml(item.nome_exibicao)}</strong><small>${periodoParticipacao(item)}</small></span></label>`).join("") : '<div class="team-empty-state"><strong>Nenhum colaborador ativo</strong><span>Não há participante elegível para remoção.</span></div>';
  el.remocaoJustificativa.closest(".field").hidden = !colaboradores.length;
  el.confirmarRemocaoColaboradorBtn.hidden = !colaboradores.length;
  el.equipePainelRemover.querySelector(".team-action-help").hidden = !colaboradores.length;

  const temPrincipal = Boolean(principal.id_usuario || principal.nome_exibicao);
  el.equipeNovoPrincipalSelect.previousElementSibling.textContent = temPrincipal ? "Novo responsável principal" : "Responsável principal";
  el.equipeNovoPrincipalSelect.innerHTML = '<option value="">Selecione um operador</option>' + opcoesOperadores(principal.id_usuario ? [principal.id_usuario] : []);
  el.equipeManterAnteriorCheck.closest("label").hidden = !temPrincipal;
  el.redistribuirIndividualBtn.textContent = temPrincipal ? "Trocar responsável" : "Definir responsável";
  el.equipeRedistribuicaoJustificativa.placeholder = temPrincipal ? "Informe o motivo da troca" : "Informe o motivo da definição";
}

async function recarregarDetalheEquipe() {
  const id=Number(estado.detalhe.demanda?.id_indicio); if(!id)return;
  const {data,error}=await sb.rpc("obter_detalhes_demanda_modo",{p_id_indicio:id}); if(error)throw error;
  const cicloSelecionado = estado.detalhe.cicloSelecionado || estado.detalhe.dados?.ciclo_selecionado;
  estado.detalhe.dados = { ...estado.detalhe.dados, ...data, ciclo_selecionado: cicloSelecionado || data.ciclo_selecionado };
  renderizarEquipe(estado.detalhe.dados);
  el.painelEquipeGestor.innerHTML = renderEquipeConsolidada(estado.detalhe.dados, estado.detalhe.demanda);
  return estado.detalhe.dados;
}
async function abrirEquipe() {
  const contexto = estado.detalhe.contextoCiclo;
  if (!estado.detalhe.dados || !contexto?.possuiCiclo || contexto.somenteLeitura) return;
  renderizarEquipe(estado.detalhe.dados);
  selecionarAbaEquipe("adicionar");
  el.equipeOverlay.hidden = false;
  document.body.style.overflow = "hidden";
}
function fecharEquipe(){el.equipeOverlay.hidden=true; if(el.atribuicaoOverlay.hidden)document.body.style.overflow="";}
async function incluirColaboradores(){try{const ids=[...el.equipeDisponiveisLista.querySelectorAll('input:checked')].map(x=>Number(x.value));if(!ids.length)throw Error("Selecione ao menos um colaborador.");el.incluirColaboradoresBtn.disabled=true;const {data,error}=await sb.rpc("incluir_colaboradores_ciclo",{p_id_indicio:Number(estado.detalhe.demanda.id_indicio),p_ids_usuarios_colaboradores:ids});if(error)throw error;mostrarAvisoEquipe(data.mensagem||"Colaboradores incluídos.","success");await recarregarDetalheEquipe();await Promise.all([carregarResumo(),carregarDemandas()]);}catch(e){mostrarAvisoEquipe(mensagemErro(e,e.message||"Não foi possível incluir."),"error");}finally{el.incluirColaboradoresBtn.disabled=false;}}
async function removerColaborador(id){try{id = Number(id || el.equipeAtivosLista.querySelector('input[name="colaborador-remocao"]:checked')?.value);if(!id)throw Error("Selecione o colaborador que será removido.");const justificativa=el.remocaoJustificativa.value.trim();if(justificativa.length<10)throw Error("Informe uma justificativa com pelo menos 10 caracteres.");const {data,error}=await sb.rpc("remover_colaborador_ciclo",{p_id_indicio:Number(estado.detalhe.demanda.id_indicio),p_id_usuario_colaborador:Number(id),p_justificativa:justificativa});if(error)throw error;el.remocaoJustificativa.value="";mostrarAvisoEquipe(data.mensagem||"Colaborador removido.","success");await recarregarDetalheEquipe();await Promise.all([carregarResumo(),carregarDemandas()]);}catch(e){mostrarAvisoEquipe(mensagemErro(e,e.message||"Não foi possível remover."),"error");}}
async function redistribuirIndividual(){try{const dados=estado.detalhe.dados;const demanda=estado.detalhe.demanda;const novo=Number(el.equipeNovoPrincipalSelect.value);const justificativa=el.equipeRedistribuicaoJustificativa.value.trim();if(!novo)throw Error("Selecione o novo responsável.");if(justificativa.length<10)throw Error("Informe uma justificativa com pelo menos 10 caracteres.");const principalNormalizado = normalizarEquipeDoCiclo(dados, demanda).principal;const principalAtual = principalNormalizado?.id_usuario ? Number(principalNormalizado.id_usuario) : null;const base={p_criterio:"CPF",p_id_tipo_indicio:null,p_cpf:dados.cpf,p_id_responsavel_atual:principalAtual,p_id_novo_responsavel:novo,p_manter_anterior_como_colaborador:principalAtual ? el.equipeManterAnteriorCheck.checked : false,p_limite_resultados:100};const {data:previa,error:erroPrevia}=await sb.rpc("prever_redistribuicao_demandas",{...base,p_incluir_detalhes:true});if(erroPrevia)throw erroPrevia;const elegiveis=previa?.elegiveis||[];if(elegiveis.length!==1||Number(elegiveis[0].id_indicio)!==Number(demanda.id_indicio))throw Error("A troca individual não pode ser concluída por este fluxo porque o CPF possui outra demanda pendente com o mesmo responsável. Use a redistribuição em lote por CPF.");const {data,error}=await sb.rpc("redistribuir_demandas_lote",{...base,p_limite_resultados:1,p_justificativa:justificativa,p_politica_bloqueios:"EXIGIR_TODAS_ELEGIVEIS"});if(error)throw error;mostrarAvisoEquipe(data.mensagem||"Responsabilidade alterada.","success");await recarregarDetalheEquipe();await Promise.all([carregarResumo(),carregarDemandas()]);}catch(e){mostrarAvisoEquipe(mensagemErro(e,e.message||"Não foi possível trocar o responsável."),"error");}}
function alternarMenuRedistribuicao(forcar){const abrir=forcar??el.redistributionMenuPopover.hidden;el.redistributionMenuPopover.hidden=!abrir;el.redistribuirDemandasBtn.setAttribute("aria-expanded",String(abrir));}
function parametrosRedistribuicao(incluirDetalhes=true){
  const e=estado.redistribuicao.escopo; const base={
    p_criterio:e==="tipo"?"TIPO_INDICIO":e==="cpf"?"CPF":e==="indicio"?"INDICIO":e==="filtrados"?"FILTRADOS":"SELECIONADAS",
    p_id_tipo_indicio:e==="tipo"&&el.redistribuicaoTipoSelect.value?Number(el.redistribuicaoTipoSelect.value):null,
    p_cpf:e==="cpf"?el.redistribuicaoCpfInput.value:null,
    p_id_indicio:e==="indicio"&&el.redistribuicaoIndicioInput.value?Number(el.redistribuicaoIndicioInput.value):null,
    p_ids_indicios:e==="selecionadas"?[...estado.selecionadas.values()].map(x=>Number(x.id_indicio)):e==="filtrados"?estado.demandas.map(x=>Number(x.id_indicio)):null,
    p_id_responsavel_atual:el.redistribuicaoAtualSelect.value?Number(el.redistribuicaoAtualSelect.value):null,
    p_id_novo_responsavel:el.redistribuicaoNovoSelect.value?Number(el.redistribuicaoNovoSelect.value):null,
    p_manter_anterior_como_colaborador:el.redistribuicaoManterCheck.checked,p_limite_resultados:100,
    p_novo_prazo_em:el.redistribuicaoNovoPrazoCheck.checked&&el.redistribuicaoNovoPrazoInput.value?`${el.redistribuicaoNovoPrazoInput.value}T23:59:59-03:00`:null
  };
  return incluirDetalhes?{...base,p_incluir_detalhes:true}:{...base,p_justificativa:el.redistribuicaoJustificativa.value.trim(),p_politica_bloqueios:"PROCESSAR_ELEGIVEIS"};
}
function assinaturaRedistribuicao(){const p=parametrosRedistribuicao();delete p.p_incluir_detalhes;return JSON.stringify(p);}
function abrirRedistribuicao(){
  estado.redistribuicao={criterio:null,escopo:null,previa:null,assinatura:null,etapa:1}; el.redistribuicaoTitulo.textContent="Redistribuir indícios";
  el.redistribuicaoTipoSelect.innerHTML='<option value="">Selecione um tipo</option>'+estado.tiposIndicio.map(t=>`<option value="${t.id}">${escapeHtml(t.nome)}</option>`).join(""); const ops=opcoesOperadores(); el.redistribuicaoAtualSelect.innerHTML='<option value="">Selecione</option>'+ops; el.redistribuicaoNovoSelect.innerHTML='<option value="">Selecione</option>'+ops;
  document.querySelectorAll("[data-redistribution-scope]").forEach(b=>b.classList.remove("active")); document.querySelectorAll("[data-red-scope-field]").forEach(x=>x.hidden=true); document.querySelector("[data-red-scope-empty]").hidden=false;
  el.redistribuicaoJustificativa.value=""; el.redistribuicaoNovoPrazoCheck.checked=false; el.redistribuicaoNovoPrazoField.hidden=true; el.redistribuicaoConfirmacaoCheck.checked=false; limparAvisoOperacao(el.redistribuicaoAviso); mostrarEtapaRedistribuicao(1); el.redistribuicaoOverlay.hidden=false; document.body.style.overflow="hidden";
}
function fecharRedistribuicao(){el.redistribuicaoOverlay.hidden=true;document.body.style.overflow="";}
async function revisarRedistribuicao(){try{const p=parametrosRedistribuicao();if(!p.p_id_responsavel_atual||!p.p_id_novo_responsavel)throw Error("Selecione os dois responsáveis.");if(p.p_id_responsavel_atual===p.p_id_novo_responsavel)throw Error("Os responsáveis devem ser diferentes.");if(p.p_criterio==="TIPO_INDICIO"&&!p.p_id_tipo_indicio)throw Error("Selecione o tipo de indício.");if(p.p_criterio==="CPF"&&String(p.p_cpf||"").replace(/\D/g,"").length!==11)throw Error("Informe um CPF com 11 dígitos.");const {data,error}=await sb.rpc("prever_redistribuicao_demandas",p);if(error)throw error;estado.redistribuicao.previa=data;estado.redistribuicao.assinatura=assinaturaRedistribuicao();const r=data.resumo||{};el.redistribuicaoResumo.innerHTML=[["Elegíveis",r.quantidade_elegivel||0,"success"],["Bloqueadas",r.quantidade_bloqueada||0,"danger"],["Excedentes",r.quantidade_excedente||0,"warning"]].map(x=>`<div class="preview-metric ${x[2]}"><strong>${x[1]}</strong><span>${x[0]}</span></div>`).join("");el.redistribuicaoDetalhes.innerHTML=`<div class="transfer-summary"><div><span>De</span><strong>${escapeHtml(data.responsavel_atual?.nome_exibicao)}</strong></div><div class="transfer-arrow">→</div><div><span>Para</span><strong>${escapeHtml(data.novo_responsavel?.nome_exibicao)}</strong></div></div>`;el.redistribuicaoPrevia.hidden=false;el.confirmarRedistribuicaoBtn.disabled=!data.pode_confirmar;atualizarResumoRedistribuicao();el.redistribuicaoAviso.textContent=data.pode_confirmar?"Prévia pronta. Somente pendências elegíveis serão alteradas.":"Nenhuma demanda elegível.";el.redistribuicaoAviso.className=`status-banner ${data.pode_confirmar?"success":"warning"}`;}catch(e){el.redistribuicaoAviso.textContent=mensagemErro(e,e.message||"Não foi possível gerar a prévia.");el.redistribuicaoAviso.className="status-banner error";}}
async function confirmarRedistribuicao(){try{if(estado.redistribuicao.assinatura!==assinaturaRedistribuicao())throw Error("A configuração mudou. Gere uma nova prévia.");const p=parametrosRedistribuicao(false);if(p.p_justificativa.length<10)throw Error("Informe uma justificativa com pelo menos 10 caracteres.");const {data,error}=await sb.rpc("redistribuir_demandas_lote",p);if(error)throw error;exibirMensagem(data.mensagem||"Redistribuição concluída.","success");fecharRedistribuicao();await Promise.all([carregarResumo(),carregarDemandas()]);}catch(e){el.redistribuicaoAviso.textContent=mensagemErro(e,e.message||"Não foi possível confirmar.");el.redistribuicaoAviso.className="status-banner error";}}


function atualizarResumoSelecaoGestor(){const n=estado.selecionadas.size;el.resultadoAtualResumo.textContent = `${estado.paginacao.total || 0} indício${estado.paginacao.total === 1 ? " encontrado" : "s encontrados"}${n ? ` · ${n} selecionado${n > 1 ? "s" : ""}` : ""}`;[el.acaoAtribuirSelecionadas,el.acaoRedistribuirSelecionadas,el.acaoEquipeSelecionada].forEach(x=>x.disabled=!n);}
function iniciais(nome){return String(nome||"?").split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase()}
/** Retorna o primeiro valor disponível entre aliases de uma entidade. */
function primeiroValor(objeto = {}, campos = []) {
  for (const campo of campos) {
    const valor = objeto?.[campo];
    if (valor !== null && valor !== undefined && valor !== "") return valor;
  }
  return null;
}

/** Normaliza participante para impedir divergências entre os dois modais. */
function normalizarParticipante(participante = {}) {
  return {
    ...participante,
    id_usuario: Number(primeiroValor(participante, ["id_usuario", "id_usuario_operador", "id_operador", "id_participante"])) || null,
    nome_exibicao: primeiroValor(participante, ["nome_exibicao", "nome_operador", "nome", "nome_usuario"]),
    email_institucional: primeiroValor(participante, ["email_institucional", "email", "email_usuario"]),
    papel_principal: participante.papel_principal === true || /PRINCIPAL/.test(String(primeiroValor(participante, ["codigo_papel", "nome_papel", "papel"]) || "").toUpperCase()),
    participacao_ativa: participante.participacao_ativa !== false && !primeiroValor(participante, ["removido_em", "encerrado_em", "finalizado_em"])
  };
}

/**
 * Fonte única para responsável, colaboradores e modo de trabalho.
 * Prioriza o ciclo selecionado e completa lacunas com o detalhe consolidado.
 */
function normalizarEquipeDoCiclo(dados = {}, demanda = {}) {
  const ciclo = dados.ciclo_selecionado || estado.detalhe.cicloSelecionado || dados;
  const bruta = [...(ciclo.equipe || []), ...(dados.equipe || [])].map(normalizarParticipante);
  const unicos = new Map();
  bruta.forEach(item => {
    const chave = item.id_usuario ? `id:${item.id_usuario}` : `nome:${String(item.nome_exibicao || "").toLowerCase()}|${papelParticipante(item)}|${periodoParticipacao(item)}`;
    if (!unicos.has(chave)) unicos.set(chave, item);
  });
  const equipe = [...unicos.values()];

  const principalDetalhe = normalizarParticipante(dados.operador_principal || {});
  const principalEquipe = equipe.find(item => item.papel_principal && item.participacao_ativa)
    || equipe.filter(item => item.papel_principal).sort((a, b) => String(primeiroValor(b, ["atribuido_em", "iniciado_em", "incluido_em"]) || "").localeCompare(String(primeiroValor(a, ["atribuido_em", "iniciado_em", "incluido_em"]) || "")))[0];
  const principal = principalDetalhe.id_usuario || principalDetalhe.nome_exibicao
    ? { ...principalEquipe, ...principalDetalhe }
    : principalEquipe || normalizarParticipante({
        id_usuario: demanda.id_operador_principal,
        nome_exibicao: demanda.nome_operador_principal,
        papel_principal: true,
        participacao_ativa: true
      });

  const colaboradoresDeclarados = (dados.colaboradores || ciclo.colaboradores || []).map(normalizarParticipante);
  const colaboradoresEquipe = equipe.filter(item => !item.papel_principal && item.participacao_ativa);
  const colaboradoresMap = new Map();
  [...colaboradoresDeclarados, ...colaboradoresEquipe].forEach(item => {
    const chave = item.id_usuario ? `id:${item.id_usuario}` : `nome:${String(item.nome_exibicao || "").toLowerCase()}`;
    if (!colaboradoresMap.has(chave)) colaboradoresMap.set(chave, item);
  });
  const colaboradores = [...colaboradoresMap.values()].filter(item => item.id_usuario !== principal.id_usuario);
  const historicos = equipe.filter(item => !item.participacao_ativa);
  const codigoModo = primeiroValor(ciclo.modo_trabalho || {}, ["codigo", "codigo_modo"])
    || primeiroValor(dados.modo_trabalho || {}, ["codigo", "codigo_modo"])
    || primeiroValor(ciclo, ["codigo_modo"])
    || primeiroValor(dados, ["codigo_modo"])
    || (colaboradores.length ? "COLABORATIVO" : "INDIVIDUAL");
  // A composição ativa é a fonte de verdade visual do modo de trabalho.
  // Um ciclo sem colaboradores ativos é individual, ainda que exista código histórico desatualizado.
  const nomeModo = colaboradores.length ? "Colaborativo" : "Individual";
  return { ciclo, equipe, principal, colaboradores, historicos, codigoModo, nomeModo };
}

/** Remove cartões históricos repetidos sem alterar a auditoria integral. */
function historicosUnicos(participantes = []) {
  const mapa = new Map();
  participantes.forEach(item => {
    const chave = [item.id_usuario || item.nome_exibicao, papelParticipante(item), periodoParticipacao(item)].join("|");
    if (!mapa.has(chave)) mapa.set(chave, item);
  });
  return [...mapa.values()];
}

/** Formata intervalo de participação sem produzir datas artificiais. */
function periodoParticipacao(participante = {}) {
  const inicio = participante.atribuido_em || participante.iniciado_em || participante.incluido_em;
  const fim = participante.encerrado_em || participante.removido_em || participante.finalizado_em;
  if (inicio && fim) return `${formatarData(inicio)} a ${formatarData(fim)}`;
  if (inicio) return `Desde ${formatarData(inicio)}`;
  if (fim) return `Até ${formatarData(fim)}`;
  return "Período não registrado";
}

/** Normaliza o papel histórico para linguagem humana. */
function papelParticipante(participante = {}) {
  const codigo = String(participante.codigo_papel || participante.nome_papel || "").toUpperCase();
  if (participante.papel_principal === true || codigo.includes("PRINCIPAL")) return "Responsável principal";
  if (codigo.includes("COLABOR")) return "Colaborador";
  return participante.nome_papel || "Participante do ciclo";
}

/** Renderiza vínculo principal e contagem adicional no padrão homologado. */
function renderVinculosDetalhe(dados = {}, demanda = {}) {
  const origens = dados.origens || demanda.origens || [];
  const situacoes = [...new Set(origens.map(item => item.situacao_funcional).filter(Boolean))];
  const principal = situacoes[0] || dados.situacoes_funcionais_resumo || demanda.situacoes_funcionais_resumo || "Sem situação funcional registrada";
  const quantidade = Math.max(Number(dados.quantidade_origens || demanda.quantidade_origens || 0), origens.length, situacoes.length);
  const adicionais = Math.max(0, quantidade - 1);
  const titulo = situacoes.length ? situacoes.join(" · ") : principal;
  return `<span class="detail-bond-primary">${escapeHtml(principal)}</span>${adicionais ? `<span class="bond-count" title="${escapeHtml(titulo)}">+${adicionais}</span>` : ""}`;
}

/** Lista os vínculos funcionais no detalhe, pois a tabela não os exibe. */
function renderListaVinculosDetalhe(dados = {}, demanda = {}) {
  const origens = dados.origens || demanda.origens || [];
  const unicos = [...new Map(origens.map(item => [
    `${item.situacao_funcional || "Sem situação funcional registrada"}|${item.matricula || item.identificador_origem || ""}`,
    item
  ])).values()];
  if (!unicos.length) return "";
  return `<section class="detail-section functional-links-section"><h3>Vínculos funcionais</h3><div class="functional-links-full">${unicos.map((item, indice) => `<div class="functional-link-row"><div><strong>${escapeHtml(item.situacao_funcional || "Sem situação funcional registrada")}</strong>${item.orgao || item.organizacao ? `<small>${escapeHtml(item.orgao || item.organizacao)}</small>` : ""}</div><span class="badge ${indice === 0 ? "badge-primary" : "badge-neutral"}">${indice === 0 ? "Representativo" : `Vínculo ${indice + 1}`}</span></div>`).join("")}</div></section>`;
}

/** Obtém a carga do operador quando a view disponibiliza o consolidado. */
function resumoCargaOperador(operador = {}) {
  const principal = Number(operador.carga?.como_principal ?? operador.como_principal ?? operador.quantidade_principal ?? 0);
  const colaboracoes = Number(operador.carga?.como_colaborador ?? operador.como_colaborador ?? operador.quantidade_colaboracoes ?? 0);
  const conhecida = operador.carga || ["como_principal","quantidade_principal","como_colaborador","quantidade_colaboracoes"].some(chave => operador[chave] !== undefined);
  return conhecida ? `${principal} como principal · ${colaboracoes} colaborações` : "";
}

/** Estado adequado para a aba Equipe quando ainda não existe ciclo. */
function renderEstadoEquipeSemCiclo() {
  return `<div class="team-no-cycle-state"><strong>Sem ciclo de tratamento</strong><p>A equipe será definida durante a atribuição inicial do indício.</p><small>Nenhuma ação de equipe está disponível antes da abertura do ciclo.</small></div>`;
}

function renderEquipeConsolidada(dados, demanda) {
  const equipeNormalizada = normalizarEquipeDoCiclo(dados, demanda);
  const { ciclo, principal, colaboradores } = equipeNormalizada;
  const contexto = construirContextoCiclo(demanda, dados, ciclo);
  if (!contexto.possuiCiclo) return renderEstadoEquipeSemCiclo();

  const historicos = historicosUnicos(equipeNormalizada.historicos);
  const encerrado = contexto.somenteLeitura;
  const papelPrincipal = encerrado ? "Responsável no encerramento" : "Responsável principal ativo";
  const principalHtml = `<article class="primary-member">
    <span class="member-avatar" aria-hidden="true">${iniciais(principal.nome_exibicao)}</span>
    <div class="member-copy"><strong>${escapeHtml(principal.nome_exibicao || "Não informado no histórico")}</strong><span>${papelPrincipal}</span><small>${periodoParticipacao(principal)}</small></div>
    <span class="badge badge-primary">Principal</span>
  </article>`;

  const ativosHtml = colaboradores.length ? colaboradores.map(item => `<article class="member-card active-member"><header><strong>${escapeHtml(item.nome_exibicao)}</strong><span class="badge badge-primary">Colaborador</span></header><small>${periodoParticipacao(item)}</small></article>`).join("") : '<p class="team-empty-copy">Nenhum colaborador ativo.</p>';
  const resumoHistorico = historicos.length
    ? `<div class="team-history-summary"><div><strong>${historicos.length}</strong><span>${historicos.length === 1 ? "participação anterior registrada" : "participações anteriores registradas"}</span></div><p>Consulte o Histórico integral para acompanhar inclusões, remoções e trocas de responsabilidade.</p><button class="btn btn-ghost btn-sm" type="button" data-open-team-history>Ver alterações da equipe</button></div>`
    : '<div class="team-history-summary is-empty"><p>Nenhuma participação anterior registrada neste ciclo.</p></div>';

  let painelAcoes;
  if (encerrado) {
    painelAcoes = '<div class="readonly-callout"><strong>Ciclo em somente leitura</strong><p>A equipe deste ciclo não pode mais ser alterada. As mudanças realizadas permanecem disponíveis no histórico integral.</p></div>';
  } else {
    painelAcoes = `<h3>Ações da equipe</h3><p>Escolha a operação que deseja realizar neste ciclo.</p><div class="team-choice-grid">
      <button class="team-choice" data-team-action="adicionar" type="button"><b>+</b><span><strong>Adicionar colaborador</strong><small>Inclua um operador no ciclo.</small></span></button>
      <button class="team-choice" data-team-action="remover" type="button" ${colaboradores.length ? "" : "disabled"}><b>−</b><span><strong>Remover colaborador</strong><small>${colaboradores.length ? "Exige justificativa." : "Nenhum colaborador ativo."}</small></span></button>
      <button class="team-choice" data-team-action="redistribuir" type="button"><b>⇄</b><span><strong>Trocar ou promover responsável</strong><small>Promova um colaborador ou escolha outro operador.</small></span></button>
    </div><p class="team-audit-note">Todas as alterações serão registradas no Histórico integral. Versão atual do ciclo: <strong>${escapeHtml(ciclo.versao_ciclo || ciclo.versao)}</strong>.</p>`;
  }

  const classeLayout = encerrado ? "team-layout is-readonly-layout" : "team-layout";
  return `<div class="${classeLayout}">
    <section class="team-column"><h3>Participantes do ciclo</h3>${principalHtml}<h3>Colaboradores ativos</h3><div class="member-cards">${ativosHtml}</div><h3>Histórico da equipe</h3>${resumoHistorico}</section>
    <aside class="team-action-panel">${painelAcoes}</aside>
  </div>`;
}

function rotuloHistoricoGestor(x){const map={INICIO_TRATAMENTO:["Tratamento iniciado","history-start","▶"],OBSERVACAO:["Observação registrada","history-observation","✎"],PROVIDENCIA:["Providência adotada","history-providence","✓"],VINCULO_PROCESSO_SEI:["Processo SEI vinculado","history-sei","⌁"],INATIVACAO_PROCESSO_SEI:["Processo SEI inativado","history-sei","⌁"],ALTERACAO_PROCESSO_SEI_PRINCIPAL:["Processo principal alterado","history-sei","★"],ENCERRAMENTO_INTERNO:["Tratamento encerrado","history-closed","■"],REDISTRIBUICAO:["Responsabilidade redistribuída","history-manager","⇄"],INCLUSAO_COLABORADOR:["Colaborador incluído","history-manager","+"],REMOCAO_COLABORADOR:["Colaborador removido","history-manager","−"],ALTERACAO_PRIORIDADE:["Prioridade alterada","history-manager","⚑"],ALTERACAO_PRAZO:["Prazo alterado","history-manager","▣"]};return map[x.codigo_movimentacao]||(x.evento_automatico?[x.nome_movimentacao||"Evento automático","history-system","⚙"]:[x.nome_movimentacao||"Movimentação","history-default","•"])}
function abrirProcessoSei() {
  const contexto = estado.detalhe.contextoCiclo;
  if (!contexto?.possuiCiclo || contexto.somenteLeitura) return;
  const demanda = estado.detalhe.demanda || {};
  el.processoSeiContexto.innerHTML = `<span>Indício ${escapeHtml(demanda.identificador_do_indicio)}</span><strong>Ciclo ${contexto.numero || "atual"}</strong>`;
  el.processoSeiNumero.value = ""; el.processoSeiAssunto.value = ""; el.processoSeiObservacao.value = ""; el.processoSeiPrincipal.checked = true; el.processoSeiAviso.hidden = true;
  el.processoSeiOverlay.hidden = false;
}
function fecharProcessoSei() { el.processoSeiOverlay.hidden = true; }
async function salvarProcessoSei() {
  const numero = el.processoSeiNumero.value.trim();
  if (!numero) { el.processoSeiAviso.textContent = "Informe o número do processo."; el.processoSeiAviso.className = "status-banner error"; el.processoSeiAviso.hidden = false; return; }
  try {
    el.salvarProcessoSeiBtn.disabled = true;
    const { data, error } = await sb.rpc("vincular_processo_sei_ciclo", {
      p_id_indicio: Number(estado.detalhe.demanda.id_indicio),
      p_numero_processo: numero,
      p_assunto: el.processoSeiAssunto.value.trim() || null,
      p_observacao: el.processoSeiObservacao.value.trim() || null,
      p_processo_principal: el.processoSeiPrincipal.checked
    });
    if (error) throw error;
    fecharProcessoSei();
    await abrirDetalhe(estado.detalhe.demanda);
    switchDetailTab("processos");
  } catch (error) {
    el.processoSeiAviso.textContent = mensagemErro(error, error.message || "Não foi possível vincular o processo SEI.");
    el.processoSeiAviso.className = "status-banner error"; el.processoSeiAviso.hidden = false;
  } finally { el.salvarProcessoSeiBtn.disabled = false; }
}
function descricaoHistoricoGestor(item, rotulo) {
  if (item.descricao) return item.descricao;
  const automáticas = {
    "Abertura de ciclo": "O ciclo de tratamento foi aberto.",
    "Criação de tratamento": "O tratamento do indício foi criado.",
    "Atribuição de principal": "Um participante foi definido como responsável principal."
  };
  return automáticas[rotulo] || "Evento registrado automaticamente, sem descrição adicional.";
}

function renderHistoricoConsolidado(rows) {
  if (!rows.length) return '<div class="history-empty-state"><div><strong>Nenhuma movimentação registrada neste ciclo.</strong><p>Se outro ciclo estiver disponível, selecione-o para consultar o histórico correspondente.</p></div></div>';
  const tipos = [...new Map(rows.map(item => { const meta = rotuloHistoricoGestor(item); return [item.codigo_movimentacao || meta[0], meta[0]]; })).entries()].sort((a,b) => a[1].localeCompare(b[1], "pt-BR"));
  return `<div class="history-filters"><div class="field"><label>Buscar no histórico</label><input class="control" data-history-search placeholder="Descrição, executor ou processo SEI"></div><div class="field"><label>Categoria</label><select class="control" data-history-category><option value="">Todas as categorias</option><option value="HUMANA">Atividade humana</option><option value="ADMINISTRATIVA">Ação administrativa</option><option value="AUTOMATICA">Evento automático</option><option value="ORIGEM">Atualização da origem</option></select></div><div class="field"><label>Tipo de registro</label><select class="control" data-history-type><option value="">Todos os tipos</option>${tipos.map(([codigo,nome]) => `<option value="${escapeHtml(codigo)}">${escapeHtml(nome)}</option>`).join("")}</select></div><div class="field"><label>Ordenação</label><select class="control" data-history-order><option value="DESC">Mais recentes primeiro</option><option value="ASC">Mais antigos primeiro</option></select></div><div class="field"><label>Data inicial</label><input class="control" data-history-start type="date"></div><div class="field"><label>Data final</label><input class="control" data-history-end type="date"></div></div><div class="history-summary-line"><strong data-history-count></strong><span>Histórico do ciclo selecionado</span></div><div class="timeline" data-history-list></div>`;
}
function categoriaHistorico(item) {
  if (item.evento_automatico) return "AUTOMATICA";
  const codigo = String(item.codigo_movimentacao || "");
  if (/PROCESSO_SEI/.test(codigo)) return "ADMINISTRATIVA";
  if (/REDISTRIBUICAO|COLABORADOR|PRIORIDADE|PRAZO/.test(codigo)) return "ADMINISTRATIVA";
  if (/ORIGEM|EPESSOAL|E_PESSOAL/.test(codigo)) return "ORIGEM";
  return "HUMANA";
}
function atualizarHistoricoFiltrado() {
  const painel = el.painelHistoricoGestor; if (!painel.querySelector("[data-history-list]")) return;
  const busca = painel.querySelector("[data-history-search]").value.trim().toLowerCase();
  const categoria = painel.querySelector("[data-history-category]").value;
  const tipo = painel.querySelector("[data-history-type]").value;
  const ordem = painel.querySelector("[data-history-order]").value;
  const inicio = painel.querySelector("[data-history-start]").value;
  const fim = painel.querySelector("[data-history-end]").value;
  const filtrados = estado.detalhe.historico.filter(item => {
    const meta = rotuloHistoricoGestor(item); const codigo = item.codigo_movimentacao || meta[0];
    const texto = [meta[0], item.descricao, item.nome_executor, item.email_executor, item.numero_processo].filter(Boolean).join(" ").toLowerCase();
    const data = item.realizada_em ? String(item.realizada_em).slice(0,10) : "";
    return (!busca || texto.includes(busca)) && (!categoria || categoriaHistorico(item) === categoria) && (!tipo || codigo === tipo) && (!inicio || data >= inicio) && (!fim || data <= fim);
  }).sort((a,b) => (ordem === "ASC" ? 1 : -1) * (new Date(a.realizada_em) - new Date(b.realizada_em)));
  let diaAtual = "";
  painel.querySelector("[data-history-list]").innerHTML = filtrados.map(item => { const meta=rotuloHistoricoGestor(item); const data=new Date(item.realizada_em); const dia=Number.isNaN(data.getTime())?"Data não informada":data.toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"}); const divisor=dia!==diaAtual?`<h3 class="history-day">${dia}</h3>`:""; diaAtual=dia; const executor=item.nome_executor||item.executor?.nome_exibicao||item.email_executor||item.categoria||"Evento automático"; return `${divisor}<article class="timeline-item ${meta[1]}"><span class="history-icon">${meta[2]}</span><div class="history-content"><div class="history-heading"><strong>${escapeHtml(meta[0])}</strong><time>${formatarDataHora(item.realizada_em)}</time></div><p>${escapeHtml(descricaoHistoricoGestor(item,meta[0]))}</p><small>${escapeHtml(executor)}</small></div></article>`; }).join("") || '<div class="history-empty-state"><strong>Nenhuma movimentação corresponde aos filtros.</strong></div>';
  painel.querySelector("[data-history-count]").textContent = `${filtrados.length} ${filtrados.length === 1 ? "movimentação encontrada" : "movimentações encontradas"}`;
}
function exportarRelatorioGestor(){const d=estado.detalhe.dados,item=estado.detalhe.demanda;if(!d||!item)return;const ciclo=d.ciclo_selecionado||d,equipe=ciclo.equipe||d.equipe||[],proc=d.processos_sei||d.processos||[],hist=estado.detalhe.historico||[];const field=(l,v)=>`<div class="f"><span>${escapeHtml(l)}</span><b>${escapeHtml(v||"Não informado")}</b></div>`;const section=(t,b)=>`<section><h2>${t}</h2>${b}</section>`;const html=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório ${escapeHtml(item.identificador_do_indicio)}</title><style>@page{size:A4;margin:15mm}body{font:9.5pt Arial;color:#172033;line-height:1.45}h1{color:#155eef}h2{font-size:13pt;color:#1849a9;border-bottom:1px solid #b9c8dd;padding-bottom:5px}.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:7px}.f,.card{border:1px solid #d0d5dd;border-radius:6px;padding:8px;break-inside:avoid}.f span{display:block;color:#667085;font-size:7.5pt;text-transform:uppercase}.card{border-left:4px solid #155eef;margin:7px 0}.card header{display:flex;justify-content:space-between;gap:10px}.muted{color:#667085}</style></head><body><h1>Relatório detalhado do indício</h1><p class="muted">Informações operacionais, administrativas e automáticas para consulta e auditoria.</p>${section("1. Identificação",`<div class="grid">${field("Indício",d.identificador_do_indicio||item.identificador_do_indicio)}${field("Pessoa",d.nome_atual||item.nome_atual)}${field("CPF",d.cpf_mascarado||item.cpf_mascarado)}${field("Tipo",d.tipo_indicio||item.tipo_indicio)}${field("Situação funcional",d.situacoes_funcionais_resumo||item.situacoes_funcionais_resumo)}${field("Atualização na origem",formatarDataHora(d.data_ultima_modificacao||item.data_ultima_modificacao))}</div>`)}${section("2. Ciclo e participantes",`<div class="grid">${field("Ciclo",ciclo.numero_ciclo)}${field("Situação",ciclo.nome_status_ciclo||rotuloSituacao(item.situacao_operacional))}${field("Prioridade",ciclo.nome_prioridade||item.nome_prioridade)}${field("Prazo",formatarDataHora(ciclo.prazo_em||item.prazo_em))}</div>${equipe.map(x=>`<div class="card"><b>${escapeHtml(x.nome_exibicao||x.nome)}</b><br>${escapeHtml(x.nome_papel||x.codigo_papel)} · ${x.participacao_ativa?"Ativo":"Histórico"}</div>`).join("")}`)}${section("3. Processos SEI",proc.length?proc.map(x=>`<div class="card"><b>${escapeHtml(x.numero_processo)}</b> ${x.processo_principal?"· Principal":""}<br>${escapeHtml(x.assunto||"Sem assunto")}</div>`).join(""):'<p>Nenhum processo registrado.</p>')}${section("4. Histórico integral",hist.length?hist.map(x=>{const m=rotuloHistoricoGestor(x);return `<div class="card"><header><b>${escapeHtml(m[0])}</b><time>${formatarDataHora(x.realizada_em)}</time></header><p>${escapeHtml(x.descricao||"Sem descrição.")}</p><small>${escapeHtml(x.nome_executor||x.categoria||"")}</small></div>`}).join(""):'<p>Nenhuma movimentação registrada.</p>')}<p class="muted">Documento gerado pelo Sistema de Monitoramento de Indícios em ${formatarDataHora(new Date())}.</p></body></html>`;const frame=document.createElement("iframe");frame.style.cssText="position:fixed;width:1px;height:1px;border:0";document.body.appendChild(frame);frame.contentDocument.open();frame.contentDocument.write(html);frame.contentDocument.close();setTimeout(()=>{frame.contentWindow.print();setTimeout(()=>frame.remove(),2500)},450)}
function nomeCriterioLote() { return ({ selecionadas:"Indícios selecionados", tipo:"Por tipo de indício", cpf:"Por CPF", filtrados:"Resultados filtrados" })[estado.lote.criterio] || "Não definido"; }
function selecionarEscopoAtribuicao(escopo) {
  estado.lote.criterio = escopo; estado.lote.escopo = escopo; invalidarPreviaLote();
  el.loteTipoSelect.value = ""; el.loteCpfInput.value = "";
  document.querySelectorAll("[data-assignment-scope]").forEach(b => { const ativo=b.dataset.assignmentScope===escopo; b.classList.toggle("active",ativo); b.setAttribute("aria-checked",String(ativo)); });
  document.querySelectorAll(".scope-source-panel").forEach(x => x.hidden=true);
  const alvo = escopo === "selecionadas" ? el.loteEtapaSelecionadas : escopo === "tipo" ? el.loteEtapaTipo : escopo === "cpf" ? el.loteEtapaCpf : null;
  const slot=document.querySelector("[data-assignment-scope-slot]"); slot.innerHTML="";
  if (alvo) { alvo.hidden=false; slot.appendChild(alvo); }
  else if (escopo === "filtrados") slot.innerHTML=`<div class="scope-result-card"><strong>${estado.demandas.filter(x=>x.pode_abrir_e_atribuir).length} indícios elegíveis nesta página</strong><span>Os filtros atuais da listagem serão usados como referência.</span></div>`;
  preencherResumoAtribuicao(); limparAvisoOperacao(el.loteAviso);
}
function selecionarEscopoRedistribuicao(escopo) {
  estado.redistribuicao.escopo=escopo; estado.redistribuicao.criterio=escopo; estado.redistribuicao.previa=null; estado.redistribuicao.assinatura=null;
  el.redistribuicaoTipoSelect.value=""; el.redistribuicaoCpfInput.value=""; el.redistribuicaoIndicioInput.value="";
  document.querySelectorAll("[data-redistribution-scope]").forEach(b=>{const ativo=b.dataset.redistributionScope===escopo;b.classList.toggle("active",ativo);b.setAttribute("aria-checked",String(ativo));});
  document.querySelectorAll("[data-red-scope-field]").forEach(x=>x.hidden=x.dataset.redScopeField!==escopo);
  document.querySelector("[data-red-scope-empty]").hidden=true; atualizarResumoRedistribuicao(); limparAvisoOperacao(el.redistribuicaoAviso);
}
function limparAvisoOperacao(alvo){alvo.textContent="";alvo.className="status-banner";alvo.hidden=true;}
function preencherResumoAtribuicao() {
  const principal=estado.operadores.find(x=>String(x.id_usuario)===el.loteOperadorSelect.value); const colaboradores=idsColaboradoresSelecionados(); const p=estado.lote.previa?.resumo||{}; const etapa=estado.lote.etapa;
  const itens=[`<div><dt>Escopo</dt><dd>${nomeCriterioLote()}</dd></div>`];
  if(estado.lote.previa)itens.push(`<div><dt>Elegíveis</dt><dd class="summary-success">${Number(p.quantidade_elegivel||0)} indícios</dd></div>`);
  if(etapa>=2)itens.push(`<div><dt>Responsável</dt><dd>${escapeHtml(principal?.nome_exibicao||"Não selecionado")}</dd></div>`,`<div><dt>Modo</dt><dd>${el.loteModoSelect.value==="COLABORATIVO"?"Colaborativo":"Individual"}</dd></div>`,`<div><dt>Colaboradores</dt><dd>${colaboradores.length?`${colaboradores.length} selecionado(s)`:"Nenhum"}</dd></div>`);
  if(etapa>=3)itens.push(`<div><dt>Prioridade</dt><dd>${escapeHtml(el.lotePrioridadeSelect.selectedOptions[0]?.textContent||"Normal")}</dd></div>`,`<div><dt>Prazo</dt><dd>${el.lotePrazoCheck.checked?formatarData(el.lotePrazoInput.value):"Não definido"}</dd></div>`);
  if(etapa>=4)itens.push(`<div><dt>Processo SEI</dt><dd>${el.loteVincularSei.checked?(el.loteSeiNumero.value||"Pendente"):"Não informado"}</dd></div>`);
  el.resumoAssistenteAtribuicao.innerHTML=`<dl class="wizard-summary-list">${itens.join("")}</dl>`;
}
function mostrarEtapaLote(etapa){limparAvisoOperacao(el.loteAviso);estado.lote.etapa=Math.max(1,Math.min(5,etapa));document.querySelectorAll("[data-lote-panel]").forEach(x=>x.hidden=Number(x.dataset.lotePanel)!==estado.lote.etapa);document.querySelectorAll("[data-lote-step]").forEach(x=>{const n=Number(x.dataset.loteStep);x.classList.toggle("active",n===estado.lote.etapa);x.classList.toggle("complete",n<estado.lote.etapa);x.disabled=n>estado.lote.etapa;});el.voltarLoteBtn.hidden=estado.lote.etapa===1;el.revisarLoteBtn.hidden=estado.lote.etapa===5;el.revisarLoteBtn.textContent=estado.lote.etapa===4?"Continuar para revisão":"Continuar";el.confirmarLoteBtn.hidden=estado.lote.etapa!==5;el.confirmarLoteBtn.disabled=!estado.lote.previa?.pode_confirmar||!el.loteConfirmacaoCheck.checked;preencherResumoAtribuicao();}
function validarEtapaLote(etapa){const p=parametrosLote();if(etapa===1){if(!estado.lote.escopo)throw Error("Selecione o escopo da atribuição.");if(p.p_criterio==="SELECIONADAS"&&!p.p_ids_indicios?.length)throw Error("Selecione ao menos um indício.");if(p.p_criterio==="TIPO_INDICIO"&&!p.p_id_tipo_indicio)throw Error("Selecione um tipo de indício.");if(p.p_criterio==="CPF"&&String(p.p_cpf||"").replace(/\D/g,"").length!==11)throw Error("Informe um CPF com 11 dígitos.");}if(etapa===2){if(!p.p_id_usuario_operador)throw Error("Selecione o responsável principal.");if(p.p_codigo_modo==="COLABORATIVO"&&!p.p_ids_usuarios_colaboradores?.length)throw Error("Selecione ao menos um colaborador.");}if(etapa===3&&el.lotePrazoCheck.checked&&!el.lotePrazoInput.value)throw Error("Informe a data limite.");if(etapa===4&&el.loteVincularSei.checked&&!el.loteSeiNumero.value.trim())throw Error("Informe o número do processo SEI.");}
async function avancarLote(){try{validarEtapaLote(estado.lote.etapa);if(estado.lote.etapa===4){await gerarPreviaLote();if(estado.lote.previa?.pode_confirmar)mostrarEtapaLote(5);return;}mostrarEtapaLote(estado.lote.etapa+1);}catch(e){el.loteAviso.textContent=e.message;el.loteAviso.className="status-banner error";}}
async function gerarPreviaLote(){return revisarLote();}
function mostrarEtapaRedistribuicao(etapa){limparAvisoOperacao(el.redistribuicaoAviso);estado.redistribuicao.etapa=Math.max(1,Math.min(5,etapa));document.querySelectorAll("[data-red-panel]").forEach(x=>x.hidden=Number(x.dataset.redPanel)!==estado.redistribuicao.etapa);document.querySelectorAll("[data-red-step]").forEach(x=>{const n=Number(x.dataset.redStep);x.classList.toggle("active",n===estado.redistribuicao.etapa);x.classList.toggle("complete",n<estado.redistribuicao.etapa);x.disabled=n>estado.redistribuicao.etapa;});el.voltarRedistribuicaoBtn.hidden=estado.redistribuicao.etapa===1;el.revisarRedistribuicaoBtn.hidden=estado.redistribuicao.etapa>=4;el.confirmarRedistribuicaoBtn.hidden=estado.redistribuicao.etapa!==5;el.confirmarRedistribuicaoBtn.disabled=!estado.redistribuicao.previa?.pode_confirmar||!el.redistribuicaoConfirmacaoCheck.checked;atualizarResumoRedistribuicao();}
function atualizarResumoRedistribuicao(){const etapa=estado.redistribuicao.etapa;const atual=estado.operadores.find(x=>String(x.id_usuario)===el.redistribuicaoAtualSelect.value),novo=estado.operadores.find(x=>String(x.id_usuario)===el.redistribuicaoNovoSelect.value),r=estado.redistribuicao.previa?.resumo||{};const nomes={selecionadas:"Indícios selecionados",indicio:"Um indício",cpf:"Por CPF",tipo:"Por tipo de indício",filtrados:"Resultados filtrados"};const itens=[`<div><dt>Escopo</dt><dd>${nomes[estado.redistribuicao.escopo]||"Não selecionado"}</dd></div>`];if(estado.redistribuicao.previa)itens.push(`<div><dt>Elegíveis</dt><dd class="summary-success">${Number(r.quantidade_elegivel||0)} indícios</dd></div>`);if(etapa>=2)itens.push(`<div><dt>Responsável atual</dt><dd>${escapeHtml(atual?.nome_exibicao||"Não selecionado")}</dd></div>`,`<div><dt>Novo responsável</dt><dd>${escapeHtml(novo?.nome_exibicao||"Não selecionado")}</dd></div>`);if(etapa>=3)itens.push(`<div><dt>Justificativa</dt><dd>${el.redistribuicaoJustificativa.value.trim().length>=10?"Informada":"Pendente"}</dd></div>`,`<div><dt>Prazo</dt><dd>${el.redistribuicaoNovoPrazoCheck.checked?formatarData(el.redistribuicaoNovoPrazoInput.value):"Preservar prazos atuais"}</dd></div>`);el.resumoAssistenteRedistribuicao.innerHTML=`<dl class="wizard-summary-list">${itens.join("")}</dl>`;}
function validarEtapaRedistribuicao(etapa){const p=parametrosRedistribuicao();if(etapa===1){if(!estado.redistribuicao.escopo)throw Error("Selecione o escopo da redistribuição.");if(p.p_criterio==="SELECIONADAS"&&!p.p_ids_indicios?.length)throw Error("Selecione ao menos um indício na tabela.");if(p.p_criterio==="INDICIO"&&!p.p_id_indicio)throw Error("Informe o número do indício.");if(p.p_criterio==="TIPO_INDICIO"&&!p.p_id_tipo_indicio)throw Error("Selecione o tipo de indício.");if(p.p_criterio==="CPF"&&String(p.p_cpf||"").replace(/\D/g,"").length!==11)throw Error("Informe um CPF com 11 dígitos.");}if(etapa===2){if(!p.p_id_responsavel_atual||!p.p_id_novo_responsavel)throw Error("Selecione os dois responsáveis.");if(p.p_id_responsavel_atual===p.p_id_novo_responsavel)throw Error("O novo responsável deve ser diferente do atual.");}if(etapa===3){if(el.redistribuicaoJustificativa.value.trim().length<10)throw Error("Informe uma justificativa com pelo menos 10 caracteres.");if(el.redistribuicaoNovoPrazoCheck.checked&&!el.redistribuicaoNovoPrazoInput.value)throw Error("Informe a nova data limite.");}}
async function avancarRedistribuicao(){try{validarEtapaRedistribuicao(estado.redistribuicao.etapa);if(estado.redistribuicao.etapa===3){await revisarRedistribuicao();if(estado.redistribuicao.previa?.pode_confirmar)mostrarEtapaRedistribuicao(4);return;}if(estado.redistribuicao.etapa===4){el.redistribuicaoConfirmacaoResumo.innerHTML=el.redistribuicaoPrevia.innerHTML;mostrarEtapaRedistribuicao(5);return;}mostrarEtapaRedistribuicao(estado.redistribuicao.etapa+1);}catch(e){el.redistribuicaoAviso.textContent=e.message;el.redistribuicaoAviso.className="status-banner error";}}
function registrarEventos() {
  atualizarCardAtivo("DISPONIVEL_PARA_ATRIBUICAO");
  el.redistribuirDemandasBtn.addEventListener("click",abrirRedistribuicao);
  el.redistribuirPorTipoBtn.addEventListener("click",()=>{abrirRedistribuicao();selecionarEscopoRedistribuicao("tipo");});
  el.redistribuirPorCpfBtn.addEventListener("click",()=>{abrirRedistribuicao();selecionarEscopoRedistribuicao("cpf");});
  el.gerenciarEquipeBtn.addEventListener("click",()=>switchDetailTab("equipe"));
  el.exportarRelatorioGestorBtn.addEventListener("click",exportarRelatorioGestor);
  el.painelRelatorioGestor.addEventListener("click",e=>{if(e.target.closest("[data-export-report]"))exportarRelatorioGestor()});
  el.alternarCpfModalBtn.addEventListener("click", () => { estado.detalhe.cpfVisivel = !estado.detalhe.cpfVisivel; atualizarControleCpf(); });
  el.painelProcessosGestor.addEventListener("click", e => { if (e.target.closest("[data-add-processo-sei]")) abrirProcessoSei(); });
  el.painelHistoricoGestor.addEventListener("input", atualizarHistoricoFiltrado);
  el.painelHistoricoGestor.addEventListener("change", atualizarHistoricoFiltrado);
  el.fecharProcessoSeiBtn.addEventListener("click", fecharProcessoSei); el.cancelarProcessoSeiBtn.addEventListener("click", fecharProcessoSei); el.salvarProcessoSeiBtn.addEventListener("click", salvarProcessoSei);
  el.processoSeiOverlay.addEventListener("click", e => { if (e.target === el.processoSeiOverlay) fecharProcessoSei(); });
  el.painelEquipeGestor.addEventListener("click", e => {
    const historico = e.target.closest("[data-open-team-history]");
    if (historico) {
      switchDetailTab("historico");
      return;
    }
    const botao = e.target.closest("[data-team-action]");
    if (botao) {
      abrirEquipe();
      selecionarAbaEquipe(botao.dataset.teamAction);
    }
  });
  el.fecharEquipeBtn.addEventListener("click",fecharEquipe); el.cancelarEquipeBtn.addEventListener("click",fecharEquipe);
  el.equipeOverlay.addEventListener("click",e=>{if(e.target===el.equipeOverlay)fecharEquipe();});
  el.equipeAbaAdicionar.addEventListener("click",()=>selecionarAbaEquipe("adicionar")); el.equipeAbaRemover.addEventListener("click",()=>selecionarAbaEquipe("remover")); el.equipeAbaRedistribuir.addEventListener("click",()=>selecionarAbaEquipe("redistribuir"));
  el.incluirColaboradoresBtn.addEventListener("click",incluirColaboradores);
  el.equipeAtivosLista.addEventListener("change", () => { el.equipeAviso.hidden = true; });
  el.remocaoJustificativa.addEventListener("input", () => { el.equipeAviso.hidden = true; });
  el.confirmarRemocaoColaboradorBtn.addEventListener("click",() => removerColaborador());
  el.redistribuirIndividualBtn.addEventListener("click",redistribuirIndividual);
  el.fecharRedistribuicaoBtn.addEventListener("click",fecharRedistribuicao); el.cancelarRedistribuicaoBtn.addEventListener("click",fecharRedistribuicao);
  el.redistribuicaoOverlay.addEventListener("click",e=>{if(e.target===el.redistribuicaoOverlay)fecharRedistribuicao();});
  el.revisarRedistribuicaoBtn.addEventListener("click",avancarRedistribuicao); el.voltarRedistribuicaoBtn.addEventListener("click",()=>mostrarEtapaRedistribuicao(estado.redistribuicao.etapa-1)); el.redistribuicaoConfirmacaoCheck.addEventListener("change",()=>mostrarEtapaRedistribuicao(5)); el.confirmarRedistribuicaoBtn.addEventListener("click",confirmarRedistribuicao);
  [el.redistribuicaoTipoSelect,el.redistribuicaoCpfInput,el.redistribuicaoAtualSelect,el.redistribuicaoNovoSelect,el.redistribuicaoManterCheck].forEach(x=>x.addEventListener("change",()=>{estado.redistribuicao.previa=null;estado.redistribuicao.assinatura=null;el.redistribuicaoPrevia.hidden=true;el.confirmarRedistribuicaoBtn.disabled=true;}));

  document.querySelectorAll("[data-assignment-scope]").forEach(b=>b.addEventListener("click",()=>selecionarEscopoAtribuicao(b.dataset.assignmentScope)));
  document.querySelectorAll("[data-redistribution-scope]").forEach(b=>b.addEventListener("click",()=>selecionarEscopoRedistribuicao(b.dataset.redistributionScope)));
  el.redistribuicaoNovoPrazoCheck.addEventListener("change",()=>{el.redistribuicaoNovoPrazoField.hidden=!el.redistribuicaoNovoPrazoCheck.checked;estado.redistribuicao.previa=null;atualizarResumoRedistribuicao();});
  el.redistribuicaoNovoPrazoInput.addEventListener("change",()=>{estado.redistribuicao.previa=null;atualizarResumoRedistribuicao();});
  document.querySelectorAll("[data-lote-step]").forEach(b=>b.addEventListener("click",()=>{const n=Number(b.dataset.loteStep);if(n<estado.lote.etapa)mostrarEtapaLote(n);}));
  document.querySelectorAll("[data-red-step]").forEach(b=>b.addEventListener("click",()=>{const n=Number(b.dataset.redStep);if(n<estado.redistribuicao.etapa)mostrarEtapaRedistribuicao(n);}));
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

  el.atribuirDemandasBtn.addEventListener("click", abrirLote);
  document.addEventListener("click", e => {
    if (!el.assignmentMenu.contains(e.target)) alternarMenu(false);
    if (!el.redistributionMenu.contains(e.target)) alternarMenuRedistribuicao(false);
  });

  el.atribuirSelecionadasBtn.addEventListener("click", () => {abrirLote();selecionarEscopoAtribuicao("selecionadas");});
  el.atribuirPorTipoBtn.addEventListener("click", () => {abrirLote();selecionarEscopoAtribuicao("tipo");});
  el.atribuirPorCpfBtn.addEventListener("click", () => {abrirLote();selecionarEscopoAtribuicao("cpf");});

  el.limparSelecaoBtn.addEventListener("click", limparSelecao);
  el.toggleFiltrosAtuais.addEventListener("click", () => {
    const abrir = el.filtrosAvancadosAtuais.hidden;
    el.filtrosAvancadosAtuais.hidden = !abrir;
    el.toggleFiltrosAtuais.textContent = abrir ? "Recolher filtros ▴" : "Filtros avançados ▾";
    el.toggleFiltrosAtuais.setAttribute("aria-expanded", String(abrir));
  });
  el.acaoAtribuirSelecionadas.addEventListener("click",()=>{abrirLote();selecionarEscopoAtribuicao("selecionadas");});
  el.acaoRedistribuirSelecionadas.addEventListener("click",()=>{const d=[...estado.selecionadas.values()][0];if(d){abrirRedistribuicao();selecionarEscopoRedistribuicao("cpf");el.redistribuicaoCpfInput.value=d.cpf||""}});
  el.acaoEquipeSelecionada.addEventListener("click",()=>{if(estado.selecionadas.size===1){abrirDetalhe([...estado.selecionadas.values()][0]).then(()=>switchDetailTab("equipe"))}else exibirMensagem("Selecione apenas uma demanda para gerenciar a equipe.","warning")});
  el.verSelecionadasBtn.addEventListener("click",()=>{abrirLote();selecionarEscopoAtribuicao("selecionadas");});
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

  });
  document.querySelectorAll("[data-detail-tab]").forEach(b=>b.addEventListener("click",()=>switchDetailTab(b.dataset.detailTab)));
  el.painelDetalhesGestor.addEventListener("click", e => {
    const botao = e.target.closest("[data-ciclo-selecionar]");
    if (!botao) return;
    const ciclo = estado.detalhe.ciclos.find(item => Number(item.id_ciclo_tratamento) === Number(botao.dataset.cicloSelecionar));
    if (!ciclo || !estado.detalhe.dados || !estado.detalhe.demanda) return;
    estado.detalhe.dados.ciclo_selecionado = ciclo;
    const equipe = ciclo.equipe || estado.detalhe.dados.equipe || [];
    const dadosDoCiclo = { ...estado.detalhe.dados, ciclo_selecionado: ciclo };
    const principal = normalizarEquipeDoCiclo(dadosDoCiclo, estado.detalhe.demanda).principal;
    aplicarContextoCicloModal(estado.detalhe.demanda, dadosDoCiclo, ciclo, estado.detalhe.dados.processos_sei || [], principal);
    el.painelEquipeGestor.innerHTML = renderEquipeConsolidada({ ...estado.detalhe.dados, ciclo_selecionado: ciclo }, estado.detalhe.demanda);
    el.painelDetalhesGestor.querySelectorAll("[data-ciclo-selecionar]").forEach(item => {
      const ativo = item === botao;
      item.classList.toggle("active", ativo);
      item.setAttribute("aria-pressed", String(ativo));
    });
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
      // Cada atalho substitui os demais filtros de situação para evitar
      // combinações silenciosas e garantir que total e listagem sejam coerentes.
      el.situacaoSelect.value = "";
      el.semResponsavelCheck.checked = false;
      el.multiplasCheck.checked = false;
      el.analiseCheck.checked = false;
      if (["DISPONIVEL_PARA_ATRIBUICAO", "PENDENTE", "EM_TRATAMENTO", "AGUARDANDO_VALIDACAO_TCU"].includes(t)) {
        el.situacaoSelect.value = t;
      } else if (t === "SEM_RESPONSAVEL") {
        el.semResponsavelCheck.checked = true;
      }
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
    x.addEventListener("change", () => atualizarCardAtivo(""));
  });

  el.aplicarFiltrosBtn.addEventListener("click", aplicarFiltros);
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
  el.loteOperadorSelect.addEventListener("change", () => { atualizarOpcoesColaboradores(); invalidarPreviaLote(); preencherResumoAtribuicao(); });
  el.loteModoSelect.addEventListener("change",()=>{atualizarModoLote();preencherResumoAtribuicao()});
  el.loteVincularSei.addEventListener("change",()=>{el.loteSeiCampos.hidden=!el.loteVincularSei.checked;preencherResumoAtribuicao();});
  el.loteColaboradoresLista.addEventListener("change",()=>{invalidarPreviaLote();preencherResumoAtribuicao();});
  [el.lotePrioridadeSelect, el.loteTipoSelect, el.loteCpfInput, el.lotePrazoInput, el.loteSeiNumero].forEach(x => x.addEventListener("change",()=>{invalidarPreviaLote();preencherResumoAtribuicao();}));
  el.revisarLoteBtn.addEventListener("click", avancarLote);
  el.voltarLoteBtn.addEventListener("click",()=>mostrarEtapaLote(estado.lote.etapa-1));
  el.loteConfirmacaoCheck.addEventListener("change",()=>mostrarEtapaLote(5));
  el.confirmarLoteBtn.addEventListener("click", confirmarLote);
  document.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    if (!el.loteOverlay.hidden) fecharLote();
    else if (!el.atribuicaoOverlay.hidden) fecharDetalhe();
    else if (!el.assignmentMenuPopover.hidden) alternarMenu(false);
  });
}



/* Painel, concluídas, exportações e inicialização */
const dom = id => document.getElementById(id);
const rotulosMovimentacao = {
  INICIO_TRATAMENTO: "Tratamentos iniciados",
  OBSERVACAO: "Observações registradas",
  PROVIDENCIA: "Providências adotadas",
  VINCULO_PROCESSO_SEI: "Processos SEI vinculados",
  INATIVACAO_PROCESSO_SEI: "Processos SEI inativados",
  ALTERACAO_PROCESSO_SEI_PRINCIPAL: "Processos principais alterados",
  ENCERRAMENTO_INTERNO: "Tratamentos encerrados",
  INCLUSAO_COLABORADOR: "Colaboradores incluídos",
  REMOCAO_COLABORADOR: "Colaboradores removidos",
  REDISTRIBUICAO: "Redistribuições realizadas",
  ALTERACAO_PRIORIDADE: "Prioridades alteradas",
  ALTERACAO_PRAZO: "Prazos alterados"
};

/**
 * Rótulos gerenciais do painel.
 * A função converte códigos técnicos da API em textos adequados para leitura
 * executiva, sem modificar os valores recebidos do backend.
 */
function rotuloPainel(valor) {
  const rotulos = {
    DISPONIVEL_PARA_ATRIBUICAO: "Disponíveis para atribuição",
    SEM_RESPONSAVEL: "Sem responsável",
    PENDENTE: "Aguardando início",
    PENDENTE_DE_TRATAMENTO: "Aguardando início",
    EM_TRATAMENTO: "Em tratamento",
    AGUARDANDO_VALIDACAO_TCU: "Aguardando validação do TCU",
    ENCERRADO_INTERNAMENTE: "Encerradas internamente",
    VALIDADO_TCU: "Validadas pelo TCU",
    CANCELADO: "Canceladas",
    PRAZO_VENCIDO: "Prazo vencido",
    ATRASADA: "Prazo vencido",
    VENCE_HOJE: "Vence hoje",
    VENCE_EM_ATE_3_DIAS: "Vence em até 3 dias",
    ATE_3_DIAS: "Vence em até 3 dias",
    VENCE_EM_ATE_7_DIAS: "Vence entre 4 e 7 dias",
    ATE_7_DIAS: "Vence em até 7 dias",
    ACIMA_7_DIAS: "Vence após 7 dias",
    NO_PRAZO: "Prazo confortável",
    SEM_PRAZO: "Sem prazo definido",
    NAO_SE_APLICA: "Prazo não aplicável"
  };
  return rotulosMovimentacao[valor] || rotulos[valor] ||
    String(valor || "Não informado")
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/(^|\s)\S/g, letra => letra.toUpperCase());
}

/** Retorna uma porcentagem segura, limitada ao intervalo entre 0 e 100. */
function percentual(parte, total) {
  if (!Number(total)) return 0;
  return Math.max(0, Math.min(100, (Number(parte || 0) / Number(total)) * 100));
}

/** Formata percentuais do painel sem casas decimais desnecessárias. */
function formatarPercentual(valor) {
  const numero = Number(valor || 0);
  return numero < 10 && numero % 1 ? `${numero.toFixed(1)}%` : `${Math.round(numero)}%`;
}

/** Soma o campo quantidade de uma coleção retornada pela API. */
function somarQuantidades(itens) {
  return (itens || []).reduce((total, item) => total + Number(item.quantidade || 0), 0);
}

/**
 * Define a cor semântica de cada barra. O painel deixa de usar uma única cor
 * para comunicar normalidade, atenção, risco, conclusão e administração.
 */
function corSemantica(codigo, indice = 0) {
  const cores = {
    DISPONIVEL_PARA_ATRIBUICAO: "#f59e0b",
    SEM_RESPONSAVEL: "#f59e0b",
    PENDENTE: "#38bdf8",
    PENDENTE_DE_TRATAMENTO: "#38bdf8",
    EM_TRATAMENTO: "#8b5cf6",
    AGUARDANDO_VALIDACAO_TCU: "#06b6d4",
    ENCERRADO_INTERNAMENTE: "#10b981",
    VALIDADO_TCU: "#22c55e",
    CANCELADO: "#64748b",
    PRAZO_VENCIDO: "#ef4444",
    ATRASADA: "#ef4444",
    VENCE_HOJE: "#f97316",
    VENCE_EM_ATE_3_DIAS: "#f59e0b",
    ATE_3_DIAS: "#f59e0b",
    VENCE_EM_ATE_7_DIAS: "#eab308",
    ATE_7_DIAS: "#eab308",
    ACIMA_7_DIAS: "#3b82f6",
    NO_PRAZO: "#10b981",
    SEM_PRAZO: "#94a3b8",
    NAO_SE_APLICA: "#64748b",
    REDISTRIBUICAO: "#8b5cf6",
    INCLUSAO_COLABORADOR: "#06b6d4",
    REMOCAO_COLABORADOR: "#f97316",
    ENCERRAMENTO_INTERNO: "#10b981",
    OBSERVACAO: "#3b82f6",
    PROVIDENCIA: "#14b8a6",
    VINCULO_PROCESSO_SEI: "#0ea5e9"
  };
  const paleta = ["#2563eb", "#7c3aed", "#0891b2", "#059669", "#d97706", "#db2777", "#4f46e5"];
  return cores[codigo] || paleta[indice % paleta.length];
}

/** Renderiza barras horizontais com rótulos humanos, cores e percentuais. */
function renderizarBarrasGerenciais(id, dados, opcoes = {}) {
  const alvo = dom(id);
  if (!alvo) return;
  const itens = (dados || []).filter(item => Number(item.quantidade || 0) > 0);
  if (!itens.length) {
    alvo.innerHTML = '<div class="empty-chart">Sem dados para o período selecionado.</div>';
    return;
  }
  const maximo = Math.max(...itens.map(item => Number(item.quantidade || 0)), 1);
  const total = opcoes.total ?? somarQuantidades(itens);
  alvo.innerHTML = `<div class="bar-chart managerial-bars">${itens.map((item, indice) => {
    const codigo = item.codigo_movimentacao || item.codigo_status || item.faixa || item[opcoes.campoCodigo] || item[opcoes.campoRotulo];
    const quantidade = Number(item.quantidade || 0);
    const rotulo = item.rotulo || rotuloPainel(item[opcoes.campoRotulo] || codigo);
    const proporcao = percentual(quantidade, total);
    return `<div class="bar-row" style="--bar-color:${corSemantica(codigo, indice)}">
      <span class="bar-label" title="${escapeHtml(rotulo)}">${escapeHtml(rotulo)}</span>
      <span class="bar-track" aria-hidden="true"><span class="bar-fill" style="width:${Math.max((quantidade / maximo) * 100, 3)}%"></span></span>
      <span class="bar-value"><strong>${quantidade}</strong><small>${formatarPercentual(proporcao)}</small></span>
    </div>`;
  }).join("")}</div>`;
}

/**
 * O bloco de prazos omite "não aplicável" das barras de risco para evitar que
 * centenas de registros sem prazo escondam as poucas demandas que requerem ação.
 */
function renderizarRiscoPrazos(dados, totalEstoque) {
  const alvo = dom("graficoPrazosGestao");
  const todos = dados || [];
  const naoAplicavel = todos.find(item => item.faixa === "NAO_SE_APLICA");
  const risco = todos.filter(item => item.faixa !== "NAO_SE_APLICA");
  renderizarBarrasGerenciais("graficoPrazosGestao", risco, { campoRotulo: "faixa", total: totalEstoque });
  if (naoAplicavel) {
    alvo.insertAdjacentHTML("beforeend", `<p class="chart-footnote"><strong>${Number(naoAplicavel.quantidade || 0)}</strong> demanda(s) sem prazo aplicável foram retiradas das barras para preservar a leitura do risco.</p>`);
  }
}

/** Renderiza a evolução das entregas com rótulos espaçados e sem sobreposição. */
function renderizarEntregas(dados) {
  const alvo = dom("graficoConclusoesGestao");
  const itens = dados || [];
  if (!itens.length) {
    alvo.innerHTML = '<div class="empty-chart">Nenhuma entrega registrada no período.</div>';
    return;
  }
  const maximo = Math.max(...itens.map(item => Number(item.quantidade || 0)), 1);
  const passoRotulo = Math.max(1, Math.ceil(itens.length / 8));
  alvo.innerHTML = `<div class="delivery-chart" role="img" aria-label="Entregas concluídas por dia">${itens.map((item, indice) => {
    const quantidade = Number(item.quantidade || 0);
    const exibirData = indice % passoRotulo === 0 || indice === itens.length - 1;
    return `<div class="delivery-day">
      <div class="delivery-column ${quantidade ? "has-value" : ""}" style="height:${Math.max((quantidade / maximo) * 100, quantidade ? 6 : 1)}%" title="${formatarData(item.data)}: ${quantidade} entrega(s)">
        ${quantidade ? `<span>${quantidade}</span>` : ""}
      </div>
      <time>${exibirData ? new Date(`${item.data}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : ""}</time>
    </div>`;
  }).join("")}</div>`;
}

/**
 * Transforma a carga bruta em informação de capacidade: concentração, risco de
 * prazo e distância entre a maior e a menor carteira principal.
 */
function renderizarCapacidadeEquipe(operadores, totalEstoque) {
  const alvo = dom("cargaOperadoresGestao");
  const equipe = (operadores || []).map(operador => ({
    ...operador,
    principal: Number(operador.carga?.como_principal || 0),
    colaborador: Number(operador.carga?.como_colaborador || 0),
    total: Number(operador.carga?.total_participacoes_ativas || 0),
    vencidas: Number(operador.situacao_principal?.prazos_vencidos || 0)
  })).sort((a, b) => b.principal - a.principal);
  if (!equipe.length) {
    alvo.innerHTML = '<div class="empty-chart">Nenhum operador disponível para análise.</div>';
    return;
  }
  const maior = Math.max(...equipe.map(item => item.principal));
  const menor = Math.min(...equipe.map(item => item.principal));
  const media = equipe.reduce((soma, item) => soma + item.principal, 0) / equipe.length;
  const totalDistribuido = equipe.reduce((soma, item) => soma + item.principal, 0);
  const concentracao = totalDistribuido ? percentual(maior, totalDistribuido) : 0;
  const vencidas = equipe.reduce((soma, item) => soma + item.vencidas, 0);
  const desequilibrio = maior - menor;
  alvo.innerHTML = `
    <div class="team-management-summary">
      <article><span>Carteira média</span><strong>${media.toFixed(1)}</strong><small>Demandas principais por operador</small></article>
      <article><span>Amplitude da distribuição</span><strong>${desequilibrio}</strong><small>Diferença entre maior e menor carteira</small></article>
      <article><span>Maior concentração</span><strong>${formatarPercentual(concentracao)}</strong><small>Parcela da carteira distribuída em um operador</small></article>
      <article><span>Exposição a atraso</span><strong>${vencidas}</strong><small>Demandas vencidas sob responsabilidade</small></article>
    </div>
    <div class="team-capacity-list">${equipe.map((operador, indice) => {
      const cargaRelativa = maior ? percentual(operador.principal, maior) : 0;
      const nivel = operador.vencidas > 0 ? "critical" : operador.principal > media * 1.25 ? "attention" : "balanced";
      const textoNivel = nivel === "critical" ? "Prazo vencido" : nivel === "attention" ? "Carga acima da média" : "Carga controlada";
      return `<article class="capacity-row ${nivel}">
        <div class="capacity-rank">${indice + 1}</div>
        <div class="capacity-person"><strong>${escapeHtml(operador.nome_exibicao)}</strong><small>${textoNivel}</small></div>
        <div class="capacity-bar"><span style="width:${cargaRelativa}%"></span></div>
        <div class="capacity-numbers"><strong>${operador.principal}</strong><small>principal</small></div>
        <div class="capacity-numbers"><strong>${operador.colaborador}</strong><small>colaboração</small></div>
        <div class="capacity-numbers risk"><strong>${operador.vencidas}</strong><small>vencidas</small></div>
      </article>`;
    }).join("")}</div>
    <p class="chart-footnote">O estoque total possui <strong>${Number(totalEstoque || 0)}</strong> demanda(s). A lista destaca apenas a carteira já distribuída entre operadores.</p>`;
}

/**
 * Carrega e apresenta somente o painel. Nenhum fluxo das demais telas é
 * alterado por este módulo.
 */
async function carregarPainelGestao() {
  try {
    const { data, error } = await sb.rpc("resumo_painel_gestor_segep", {
      p_data_inicial: dom("painelInicio").value || null,
      p_data_final: dom("painelFim").value || null
    });
    if (error) throw error;

    const cards = data?.cards || {};
    const total = Number(cards.total_demandas || 0);
    const semResponsavel = Number(cards.sem_responsavel || 0);
    const atribuidas = Math.max(0, total - semResponsavel);
    const emExecucao = Number(cards.aguardando_inicio || 0) + Number(cards.em_analise || 0);
    const riscoPrazo = Number(cards.prazo_proximo || 0) + Number(cards.prazo_vencido || 0);
    const entregas = somarQuantidades(data?.concluidas_por_dia);
    const cobertura = percentual(atribuidas, total);

    /* Cards respondem às primeiras perguntas gerenciais da entrada da página. */
    const indicadores = [
      { titulo: "Estoque sem responsável", valor: semResponsavel, detalhe: `${formatarPercentual(percentual(semResponsavel, total))} do estoque aguarda distribuição`, tom: "warning" },
      { titulo: "Cobertura de atribuição", valor: formatarPercentual(cobertura), detalhe: `${atribuidas} de ${total} demanda(s) com responsável`, tom: cobertura < 80 ? "danger" : "success" },
      { titulo: "Trabalho em execução", valor: emExecucao, detalhe: `${Number(cards.aguardando_inicio || 0)} aguardando início e ${Number(cards.em_analise || 0)} em tratamento`, tom: "primary" },
      { titulo: "Risco de prazo", valor: riscoPrazo, detalhe: `${Number(cards.prazo_vencido || 0)} vencida(s) e ${Number(cards.prazo_proximo || 0)} próxima(s)`, tom: Number(cards.prazo_vencido || 0) ? "danger" : "warning" },
      { titulo: "Entregas no período", valor: entregas, detalhe: "Tratamentos encerrados no intervalo selecionado", tom: "success" },
      { titulo: "Estoque total", valor: total, detalhe: "Volume sob responsabilidade gerencial", tom: "neutral" }
    ];
    dom("metricasPainelGestao").innerHTML = indicadores.map(item => `<article class="management-metric tone-${item.tom}"><span>${item.titulo}</span><strong>${item.valor}</strong><small>${item.detalhe}</small></article>`).join("");

    /* Situação: foco na cobertura e no estágio atual do trabalho. */
    renderizarBarrasGerenciais("graficoStatusGestao", data?.por_status || [], {
      campoRotulo: "nome_status",
      campoCodigo: "codigo_status",
      total
    });

    /* Prazo: códigos técnicos são convertidos e itens não aplicáveis viram nota. */
    renderizarRiscoPrazos(data?.por_prazo || [], total);

    /* Entregas: datas espaçadas para evitar a sobreposição observada. */
    renderizarEntregas(data?.concluidas_por_dia || []);

    /* Tipos: cores distintas facilitam identificar concentração temática. */
    renderizarBarrasGerenciais("graficoTiposGestao", (data?.por_tipo_indicio || []).slice(0, 8), {
      campoRotulo: "tipo_indicio",
      total
    });

    /*
     * Distribuição por operador: substitui a contagem de atos administrativos,
     * que é menos útil para decisão imediata, por uma visão de balanceamento da
     * carteira principal. A área detalhada abaixo permanece responsável pelos
     * indicadores de concentração, colaboração e risco de prazo.
     */
    const carteiraPorOperador = (data?.carga_operadores || [])
      .map(operador => ({
        nome_operador: operador.nome_exibicao,
        codigo_operador: operador.codigo_usuario || operador.email_institucional,
        quantidade: Number(operador.carga?.como_principal || 0)
      }))
      .sort((a, b) => b.quantidade - a.quantidade);
    renderizarBarrasGerenciais("graficoMovimentacoesGestao", carteiraPorOperador, {
      campoRotulo: "nome_operador",
      campoCodigo: "codigo_operador",
      total: carteiraPorOperador.reduce((soma, item) => soma + item.quantidade, 0)
    });

    /* Equipe: leitura detalhada de capacidade, concentração e risco de prazo. */
    renderizarCapacidadeEquipe(data?.carga_operadores || [], total);
  } catch (error) {
    exibirMensagem(mensagemErro(error, error.message || "Não foi possível carregar o painel."), "error");
  }
}

function interpretarCiclo(ciclo = {}) {
  const codigo = String(ciclo.codigo_status_ciclo || "");
  const concluido = Boolean(ciclo.encerrado_em) || ["ENCERRADO_INTERNAMENTE", "VALIDADO_TCU", "CANCELADO"].includes(codigo);
  const definitivo = ciclo.ciclo_encerrado === true || ["VALIDADO_TCU", "CANCELADO"].includes(codigo);
  const editavel = ciclo.permite_movimentacao === true && ciclo.somente_leitura !== true && !concluido;
  return { cicloVigente: ciclo.ciclo_ativo === true, concluidoOperacionalmente: concluido, encerradoDefinitivamente: definitivo, permiteEdicao: editavel, somenteLeitura: !editavel };
}
function parametrosConcluidas() {
  return { p_busca: dom("concluidaBusca").value.trim() || null, p_id_operador: dom("concluidaOperador").value ? Number(dom("concluidaOperador").value) : null, p_id_tipo_indicio: dom("concluidaTipo").value ? Number(dom("concluidaTipo").value) : null, p_codigo_status: dom("concluidaStatus").value || null, p_codigo_prioridade: dom("concluidaPrioridade").value || null, p_data_inicial: dom("concluidaInicio").value || null, p_data_final: dom("concluidaFim").value || null, p_ordenacao: dom("concluidaOrdenacao").value, p_pagina: estado.concluidas.pagina, p_tamanho_pagina: estado.concluidas.tamanho };
}
function duracaoCiclo(item) {
  if (!item.iniciado_em || !item.encerrado_em) return "Não calculado";
  const minutos = Math.max(0, Math.floor((new Date(item.encerrado_em) - new Date(item.iniciado_em)) / 60000));
  const dias = Math.floor(minutos / 1440);
  const horas = Math.floor((minutos % 1440) / 60);
  const restantes = minutos % 60;
  if (dias) return `${dias} ${dias === 1 ? "dia" : "dias"}${horas ? ` e ${horas}h` : ""}`;
  if (horas) return `${horas}h${restantes ? ` ${restantes}min` : ""}`;
  return `${restantes}min`;
}

/** Retorna a forma singular ou plural usada nas mensagens da tela histórica. */
function pluralizarConcluidas(valor, singular, plural) {
  return `${valor} ${Number(valor) === 1 ? singular : plural}`;
}

/** Consulta somente a totalização de uma situação final sem carregar lote local. */
async function totalConcluidasPorStatus(codigoStatus) {
  const parametros = { ...parametrosConcluidas(), p_codigo_status: codigoStatus, p_pagina: 1, p_tamanho_pagina: 1 };
  const { data, error } = await sb.rpc("listar_demandas_concluidas_gestor", parametros);
  if (error) throw error;
  return Number(data?.paginacao?.total_registros || 0);
}

/** Resume o universo histórico que alimenta cards, tabela e relatório. */
function atualizarResumoFiltrosConcluidas() {
  const filtros = [];
  if (dom("concluidaBusca").value.trim()) filtros.push(`Busca: ${dom("concluidaBusca").value.trim()}`);
  if (dom("concluidaInicio").value) filtros.push(`A partir de ${formatarData(dom("concluidaInicio").value)}`);
  if (dom("concluidaFim").value) filtros.push(`Até ${formatarData(dom("concluidaFim").value)}`);
  if (dom("concluidaStatus").value) filtros.push(dom("concluidaStatus").selectedOptions[0]?.textContent || "Situação final");
  if (dom("concluidaTipo").value) filtros.push(`Tipo: ${dom("concluidaTipo").selectedOptions[0]?.textContent}`);
  if (dom("concluidaOperador").value) filtros.push(`Responsável: ${dom("concluidaOperador").selectedOptions[0]?.textContent}`);
  if (dom("concluidaPrioridade").value) filtros.push(`Prioridade: ${dom("concluidaPrioridade").selectedOptions[0]?.textContent}`);
  dom("resumoFiltrosConcluidas").textContent = filtros.length
    ? `${filtros.length} filtro${filtros.length > 1 ? "s" : ""} ativo${filtros.length > 1 ? "s" : ""}: ${filtros.join(" · ")}`
    : "Todo o histórico";
}

async function carregarConcluidas() {
  const alvo = dom("concluidasConteudo");
  atualizarResumoFiltrosConcluidas();
  estado.concluidas.expandida = null;
  alvo.innerHTML = '<div class="table-state">Carregando indícios concluídos...</div>';
  try {
    const parametros = parametrosConcluidas();
    const [resultado, encerrados, validados, cancelados] = await Promise.all([
      sb.rpc("listar_demandas_concluidas_gestor", parametros),
      totalConcluidasPorStatus("ENCERRADO_INTERNAMENTE"),
      totalConcluidasPorStatus("VALIDADO_TCU"),
      totalConcluidasPorStatus("CANCELADO")
    ]);
    if (resultado.error) throw resultado.error;

    const data = resultado.data || {};
    estado.concluidas.itens = data.itens || [];
    const pg = data.paginacao || {};
    estado.concluidas.total = Number(pg.total_registros || 0);
    estado.concluidas.totalPaginas = Number(pg.total_paginas || 0);

    /** Cards gerenciais: volume histórico e distribuição por situação final. */
    const cards = [
      { titulo: "Indícios concluídos", valor: estado.concluidas.total, detalhe: parametros.p_data_inicial || parametros.p_data_final ? "No período consultado" : "Em todo o histórico", tom: "total" },
      { titulo: "Encerrados internamente", valor: encerrados, detalhe: "Conclusão operacional da equipe", tom: "internal" },
      { titulo: "Validados pelo TCU", valor: validados, detalhe: "Conclusão definitiva", tom: "validated" },
      { titulo: "Cancelados", valor: cancelados, detalhe: "Ciclos encerrados sem continuidade", tom: "cancelled" }
    ];
    dom("metricasConcluidas").innerHTML = cards.map(card => `<article class="concluded-metric tone-${card.tom}"><span>${card.titulo}</span><strong>${card.valor}</strong><small>${card.detalhe}</small></article>`).join("");

    dom("resumoConcluidas").textContent = pluralizarConcluidas(estado.concluidas.total, "indício encontrado", "indícios encontrados");
    dom("infoConcluidas").textContent = estado.concluidas.total
      ? `Exibindo ${pg.registro_inicial || 1} a ${pg.registro_final || estado.concluidas.itens.length} de ${estado.concluidas.total} indícios`
      : "Nenhum indício encontrado";
    dom("paginaConcluidasInfo").textContent = `Página ${pg.pagina || 1} de ${pg.total_paginas || 0}`;
    dom("concluidasAnteriorBtn").disabled = !pg.possui_pagina_anterior;
    dom("concluidasProximaBtn").disabled = !pg.possui_proxima_pagina;

    if (!estado.concluidas.itens.length) {
      alvo.innerHTML = '<div class="table-state">Nenhum indício concluído encontrado.</div>';
      return;
    }

    alvo.innerHTML = `<div class="table-wrap concluded-table-wrap"><table class="concluded-table" aria-label="Lista de indícios concluídos"><thead><tr>
      <th class="concluded-col-expand"><span class="sr-only">Resumo</span></th>
      <th class="concluded-col-indicio">Indício</th>
      <th class="concluded-col-pessoa">Pessoa</th>
      <th class="concluded-col-tipo">Tipo</th>
      <th class="concluded-col-status">Situação final</th>
      <th class="concluded-col-responsavel">Responsável no ciclo</th>
      <th class="concluded-col-sei">Processo SEI</th>
      <th class="concluded-col-data">Concluído em</th>
      <th class="concluded-col-duracao">Tempo de tratamento</th>
      <th class="concluded-col-acoes">Ações</th>
    </tr></thead><tbody>${estado.concluidas.itens.map(x => {
      const chave = String(x.id_ciclo_tratamento || x.id_indicio);
      return `<tr data-concluida-linha="${chave}">
        <td class="concluded-col-expand sticky-concluded-expand"><button class="concluded-expand-btn" type="button" data-concluida-expandir="${chave}" aria-expanded="false" aria-label="Expandir resumo do ciclo" title="Expandir resumo do ciclo"><span aria-hidden="true">⌄</span></button></td>
        <td class="concluded-col-indicio sticky-concluded-indicio"><strong>${escapeHtml(x.identificador_do_indicio)}</strong><small>Ciclo ${x.numero_ciclo || "-"}</small></td>
        <td class="concluded-col-pessoa cell-person"><strong>${escapeHtml(x.nome_atual)}</strong><span>${escapeHtml(x.cpf_mascarado)}</span></td>
        <td class="concluded-col-tipo"><div class="concluded-clamp" title="${escapeHtml(x.tipo_indicio)}">${escapeHtml(x.tipo_indicio)}</div></td>
        <td class="concluded-col-status"><span class="badge ${classeSituacao(x.codigo_status_ciclo)}">${escapeHtml(x.nome_status_ciclo)}</span></td>
        <td class="concluded-col-responsavel">${escapeHtml(x.nome_operador_principal, "Responsável histórico não informado")}</td>
        <td class="concluded-col-sei">${escapeHtml(x.processo_sei_principal, "Não vinculado")}</td>
        <td class="concluded-col-data">${formatarDataHora(x.encerrado_em)}</td>
        <td class="concluded-col-duracao">${duracaoCiclo(x)}</td>
        <td class="concluded-col-acoes sticky-concluded-actions"><button class="btn btn-secondary" type="button" data-concluida-detalhe="${chave}">Detalhes</button></td>
      </tr>`;
    }).join("")}</tbody></table></div>
      <section class="concluded-external-detail" id="concluidaExpansaoPainel" hidden aria-live="polite"></section>`;
  } catch (error) {
    alvo.innerHTML = `<div class="status-banner error">${escapeHtml(mensagemErro(error, error.message || "Não foi possível carregar os indícios concluídos."))}</div>`;
  }
}

async function expandirConcluida(chave) {
  const painel = dom("concluidaExpansaoPainel");
  const botao = document.querySelector(`[data-concluida-expandir="${chave}"]`);
  const linha = document.querySelector(`[data-concluida-linha="${chave}"]`);
  if (!painel || !botao || !linha) return;

  const recolher = estado.concluidas.expandida === chave;
  document.querySelectorAll("[data-concluida-expandir]").forEach(controle => {
    controle.classList.remove("is-expanded");
    controle.setAttribute("aria-expanded", "false");
    controle.setAttribute("aria-label", "Expandir resumo do ciclo");
    controle.setAttribute("title", "Expandir resumo do ciclo");
    controle.querySelector("span").textContent = "⌄";
  });
  document.querySelectorAll("[data-concluida-linha]").forEach(registro => registro.classList.remove("is-expanded"));

  if (recolher) {
    painel.hidden = true;
    painel.innerHTML = "";
    estado.concluidas.expandida = null;
    return;
  }

  estado.concluidas.expandida = chave;
  linha.classList.add("is-expanded");
  botao.classList.add("is-expanded");
  botao.setAttribute("aria-expanded", "true");
  botao.setAttribute("aria-label", "Recolher resumo do ciclo");
  botao.setAttribute("title", "Recolher resumo do ciclo");
  botao.querySelector("span").textContent = "⌃";
  painel.hidden = false;

  const item = estado.concluidas.itens.find(x => String(x.id_ciclo_tratamento || x.id_indicio) === chave);
  if (!item) return;

  const cabecalho = `<header class="concluded-detail-heading"><div><span>Indício ${escapeHtml(item.identificador_do_indicio)}</span><strong>Ciclo ${item.numero_ciclo || "-"}</strong></div><button class="btn btn-ghost" type="button" data-recolher-concluida="${chave}">Recolher resumo</button></header>`;
  if (estado.concluidas.detalhes.has(chave)) {
    painel.innerHTML = cabecalho + `<div class="concluded-expansion">${renderResumoCiclo(estado.concluidas.detalhes.get(chave))}</div>`;
    return;
  }

  botao.disabled = true;
  painel.innerHTML = cabecalho + '<div class="table-state">Carregando resumo do ciclo...</div>';
  try {
    const { data, error } = await sb.rpc("relatorio_ciclo_demanda_gestor", { p_id_ciclo_tratamento: Number(item.id_ciclo_tratamento) });
    if (error) throw error;
    estado.concluidas.detalhes.set(chave, data);
    painel.innerHTML = cabecalho + `<div class="concluded-expansion">${renderResumoCiclo(data)}</div>`;
  } catch (error) {
    painel.innerHTML = cabecalho + `<div class="status-banner error">Não foi possível carregar o resumo do ciclo. ${escapeHtml(error.message, "")}</div>`;
  } finally {
    botao.disabled = false;
  }
}

function renderResumoCiclo(relatorio) {
  const c = relatorio?.ciclo || {};
  const equipe = c.equipe || [];
  const processos = c.processos_sei || [];
  const historico = relatorio?.historico || [];
  const principal = equipe.find(x => x.papel_principal) || equipe[0];
  const colaboradores = equipe.filter(x => x !== principal);
  const ultima = historico.map(x => x.realizada_em).filter(Boolean).sort().at(-1);
  return `
    <article><h3>Resumo do ciclo</h3><strong>${escapeHtml(c.nome_status_ciclo)}</strong><p>${escapeHtml(c.resultado_encerramento)}</p><dl><div><dt>Iniciado em</dt><dd>${formatarDataHora(c.iniciado_em || c.aberto_em)}</dd></div><div><dt>Concluído em</dt><dd>${formatarDataHora(c.encerrado_em)}</dd></div></dl></article>
    <article><h3>Participantes do ciclo</h3><dl><div><dt>Participante principal registrado</dt><dd>${escapeHtml(principal?.nome_exibicao, "Não informado")}</dd></div><div><dt>Colaboradores</dt><dd>${pluralizarConcluidas(colaboradores.length, "participante adicional", "participantes adicionais")}</dd></div></dl></article>
    <article><h3>Processos SEI</h3>${processos.length ? `<strong>${escapeHtml(processos.find(x => x.processo_principal)?.numero_processo || processos[0]?.numero_processo)}</strong><p>${processos.length > 1 ? pluralizarConcluidas(processos.length - 1, "vínculo adicional", "vínculos adicionais") : "Processo principal do ciclo"}</p>` : '<p>Nenhum processo vinculado neste ciclo.</p>'}</article>
    <article><h3>Auditoria do ciclo</h3><strong>${pluralizarConcluidas(historico.length, "movimentação registrada", "movimentações registradas")}</strong><p>${ultima ? `Última movimentação: ${formatarDataHora(ultima)}` : "Sem data de movimentação disponível."}</p><small>Abra os detalhes para consultar o histórico completo.</small></article>`;
}

function csvLinhas(payload) { const colunas = payload?.colunas || []; return [colunas, ...(payload?.itens || []).map(item => colunas.map(c => item[c]))]; }
function baixarCsv(linhas, nome) { const q = v => `"${String(v ?? "").replaceAll('"', '""')}"`; const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\ufeff" + linhas.map(r => r.map(q).join(";")).join("\r\n")], { type: "text/csv;charset=utf-8" })); a.download = nome; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
async function exportarDemandas(concluidas) {
  const escopo = dom(concluidas ? "escopoExportacaoConcluidas" : "escopoExportacaoAtuais").value;
  const selecionadas = concluidas ? [] : [...estado.selecionadas.values()];
  if (escopo === "SELECIONADOS" && !selecionadas.length) { exibirMensagem("Selecione ao menos uma demanda.", "warning"); return; }
  const exportarTudo = !concluidas && escopo === "TODAS";
  const f = concluidas ? parametrosConcluidas() : parametrosListagem();
  const args = {
    // A RPC homologada usa FILTRADOS. O escopo "TODAS" reutiliza esse contrato
    // sem qualquer filtro e com limite ampliado de segurança.
    p_escopo: exportarTudo ? "FILTRADOS" : escopo,
    p_ids_indicios: escopo === "SELECIONADOS" ? selecionadas.map(x => Number(x.id_indicio)) : null,
    p_ids_ciclos: escopo === "SELECIONADOS" ? selecionadas.map(x => Number(x.id_ciclo_tratamento)).filter(Boolean) : null,
    p_apenas_concluidas: concluidas,
    p_busca: exportarTudo ? null : (f.p_busca || null),
    p_id_operador: exportarTudo ? null : (f.p_id_operador || null),
    p_id_tipo_indicio: exportarTudo ? null : (f.p_id_tipo_indicio || null),
    p_codigo_status: exportarTudo ? null : (concluidas ? f.p_codigo_status : f.p_situacao_operacional),
    p_codigo_prioridade: exportarTudo ? null : (f.p_codigo_prioridade || null),
    p_data_inicial: exportarTudo ? null : (concluidas ? f.p_data_inicial : null),
    p_data_final: exportarTudo ? null : (concluidas ? f.p_data_final : null),
    p_pagina: exportarTudo ? 1 : (concluidas ? estado.concluidas.pagina : estado.paginacao.pagina),
    p_tamanho_pagina: exportarTudo ? 5000 : (concluidas ? estado.concluidas.tamanho : estado.paginacao.tamanho)
  };
  try {
    if (exportarTudo && !window.confirm("Exportar todos os indícios atuais? Os filtros aplicados serão ignorados.")) return;
    const { data, error } = await sb.rpc("exportar_demandas_gestor", args); if (error) throw error; if (!data?.itens?.length) throw Error("Nenhum registro disponível para exportação."); baixarCsv(csvLinhas(data), `demandas_${concluidas ? "concluidas" : "atuais"}_${escopo.toLowerCase()}.csv`); exibirMensagem(`${data.quantidade_registros} registro(s) exportado(s).`, "success"); } catch (e) { exibirMensagem(e.message, "error"); }
}
async function abrirDetalheCompleto(item) {
  await abrirDetalhe(item);
  if (!estado.detalhe.dados) return;
  try {
    const { data, error } = await sb.rpc("listar_ciclos_demanda_gestor", { p_id_indicio: Number(item.id_indicio) });
    if (error) throw error;

    estado.detalhe.ciclos = data?.itens || [];
    const selecionado = estado.detalhe.ciclos.find(ciclo => Number(ciclo.id_ciclo_tratamento) === Number(item.id_ciclo_tratamento)) || estado.detalhe.ciclos[0] || null;
    const dados = estado.detalhe.dados;
    const processos = dados.processos_sei || dados.processos || [];

    if (selecionado) {
      dados.ciclo_selecionado = selecionado;
      const principal = normalizarEquipeDoCiclo({ ...dados, ciclo_selecionado: selecionado }, item).principal;
      aplicarContextoCicloModal(item, dados, selecionado, processos, principal);
      el.painelEquipeGestor.innerHTML = renderEquipeConsolidada({ ...dados, ciclo_selecionado: selecionado }, item);
    } else {
      aplicarContextoCicloModal(item, dados, {}, processos, {});
    }

    const bloco = `<section class="cycles-context-block"><h3 class="section-title">Ciclos do indício</h3>${renderizarSeletorCiclos(estado.detalhe.ciclos, selecionado)}</section>`;
    el.painelDetalhesGestor.insertAdjacentHTML("afterbegin", bloco);
  } catch (error) {
    console.error(error);
    el.painelDetalhesGestor.insertAdjacentHTML("afterbegin", '<div class="status-banner warning">Não foi possível carregar os ciclos deste indício.</div>');
  }
}

function alterarAbaPrincipal(aba) {
  const painelAtivo = aba === "painel";
  dom("assignmentMenu").hidden = painelAtivo;
  dom("redistributionMenu").hidden = painelAtivo;
  dom("secaoPainelGestao").hidden = aba !== "painel"; dom("secaoDemandasAtuais").hidden = aba !== "atuais"; dom("secaoConcluidasGestao").hidden = aba !== "concluidas";
  document.querySelectorAll("[data-gestao-tab]").forEach(b => { const ativo = b.dataset.gestaoTab === aba; b.classList.toggle("active", ativo); b.setAttribute("aria-selected", String(ativo)); });
  if (aba === "painel") carregarPainelGestao(); if (aba === "concluidas") carregarConcluidas();
}
function prepararNavegacaoGestao() {
  const fim = new Date(), inicio = new Date(Date.now() - 29 * 86400000); dom("painelFim").value = fim.toISOString().slice(0,10); dom("painelInicio").value = inicio.toISOString().slice(0,10);
  document.querySelectorAll("[data-gestao-tab]").forEach(b => b.addEventListener("click", () => alterarAbaPrincipal(b.dataset.gestaoTab)));
  dom("aplicarPainelBtn").addEventListener("click", carregarPainelGestao); dom("exportarAtuaisBtn").addEventListener("click", () => exportarDemandas(false)); dom("exportarConcluidasBtn").addEventListener("click", () => exportarDemandas(true));
  dom("toggleFiltrosConcluidas").addEventListener("click", () => {
    const abrir = dom("filtrosAvancadosConcluidas").hidden;
    dom("filtrosAvancadosConcluidas").hidden = !abrir;
    dom("toggleFiltrosConcluidas").textContent = abrir ? "Recolher filtros ▴" : "Filtros avançados ▾";
    dom("toggleFiltrosConcluidas").setAttribute("aria-expanded", String(abrir));
  });
  dom("aplicarConcluidasBtn").addEventListener("click", () => { estado.concluidas.pagina = 1; carregarConcluidas(); }); dom("limparConcluidasBtn").addEventListener("click", () => { ["concluidaBusca","concluidaInicio","concluidaFim","concluidaTipo","concluidaOperador","concluidaPrioridade","concluidaStatus"].forEach(id => dom(id).value = ""); estado.concluidas.pagina = 1; carregarConcluidas(); });
  dom("tamanhoPaginaConcluidas").addEventListener("change", e => { estado.concluidas.tamanho = Number(e.target.value); estado.concluidas.pagina = 1; carregarConcluidas(); }); dom("concluidasAnteriorBtn").addEventListener("click", () => { if (estado.concluidas.pagina > 1) { estado.concluidas.pagina--; carregarConcluidas(); } }); dom("concluidasProximaBtn").addEventListener("click", () => { if (estado.concluidas.pagina < estado.concluidas.totalPaginas) { estado.concluidas.pagina++; carregarConcluidas(); } });
  dom("concluidasConteudo").addEventListener("click", e => {
    const expandir = e.target.closest("[data-concluida-expandir]");
    const recolher = e.target.closest("[data-recolher-concluida]");
    const detalhe = e.target.closest("[data-concluida-detalhe]");

    if (expandir) {
      expandirConcluida(expandir.dataset.concluidaExpandir);
    }

    if (recolher) {
      expandirConcluida(recolher.dataset.recolherConcluida);
    }

    if (detalhe) {
      const item = estado.concluidas.itens.find(
        registro => String(registro.id_ciclo_tratamento || registro.id_indicio) === detalhe.dataset.concluidaDetalhe
      );
      abrirDetalheCompleto(item);
    }
  });
  alterarAbaPrincipal("painel");
}
async function inicializarAplicacao() {
  prepararNavegacaoGestao();

  // Filtro inicial aplicado uma única vez ao abrir a página.
  el.situacaoSelect.value = "DISPONIVEL_PARA_ATRIBUICAO";
  atualizarCardAtivo("DISPONIVEL_PARA_ATRIBUICAO");
  atualizarResumoFiltrosAtuais();

  registrarEventos();
  try { await exigirAcesso(); await Promise.all([carregarOperadores(), carregarPrioridades(), carregarResumo(), carregarDemandas()]); await carregarTiposIndicio(); dom("concluidaOperador").innerHTML = '<option value="">Todos os responsáveis</option>' + estado.operadores.map(o=>`<option value="${o.id_usuario}">${escapeHtml(o.nome_exibicao)}</option>`).join(""); dom("concluidaPrioridade").innerHTML = '<option value="">Todas as prioridades</option>' + estado.prioridades.map(p=>`<option value="${p.codigo_prioridade}">${escapeHtml(p.nome_prioridade)}</option>`).join(""); dom("concluidaTipo").innerHTML = '<option value="">Todos os tipos</option>' + estado.tiposIndicio.map(t=>`<option value="${t.id}">${escapeHtml(t.nome)}</option>`).join(""); }
  catch (error) { console.error(error); if (error.message !== "SESSAO_AUSENTE") exibirMensagem(mensagemErro(error, "Erro ao carregar dados do sistema."), "error"); }
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", inicializarAplicacao, { once: true }); else inicializarAplicacao();
