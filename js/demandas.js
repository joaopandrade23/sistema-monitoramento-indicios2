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
  prioridades: [], tiposIndicio: [], lote: { criterio: null, previa: null, assinaturaPrevia: null, etapa: 1, escopo: null, selecionadasExpandidas: false }, detalhe: { requisicao: 0, demanda: null, dados: null, historico: [], ciclos: [], cicloSelecionado: null, contextoCiclo: null, abaAtiva: "detalhes", cpfVisivel: false, cpfCompleto: null, cpfCarregando: false, configuracaoEtapa: 1 },
  exportacao: { contexto: "ATUAIS", escopo: "PAGINA", perfil: "GERENCIAL", colunas: new Set(), processando: false },
  concluidas: { itens: [], detalhes: new Map(), expandida: null, pagina: 1, tamanho: 20, total: 0, totalPaginas: 0 },
  dilacoes: { itens: [], pagina: 1, tamanho: 50, total: 0, totalPaginas: 0, selecionada: null, etapa: 1 },
  redistribuicao: { criterio: null, previa: null, assinatura: null, etapa: 1, escopo: null, diagnostico: null },
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
"exportacaoCsvOverlay","exportacaoCsvTitulo","fecharExportacaoCsvBtn","cancelarExportacaoCsvBtn","exportacaoEscopos","alternarColunasExportacaoBtn","exportacaoColunasPainel","exportacaoColunasContador","selecionarTodasColunasBtn","limparColunasBtn","restaurarColunasBtn","exportacaoColunasLista","exportacaoResumo","exportacaoProgresso","exportacaoProgressoTitulo","exportacaoProgressoPercentual","exportacaoProgressoBarra","exportacaoProgressoTexto","exportacaoCsvAviso","gerarExportacaoCsvBtn",
"dilacaoTabCount","dilacaoPendentesTotal","dilacaoStatusFiltro","dilacaoBuscaFiltro","aplicarDilacoesBtn","atualizarDilacoesBtn","dilacaoResumoLista","dilacoesConteudo","dilacaoPaginacaoInfo","dilacaoAnteriorBtn","dilacaoPaginaInfo","dilacaoProximaBtn","dilacaoAnaliseOverlay","dilacaoAnaliseTitulo","fecharDilacaoAnaliseBtn","cancelarDilacaoAnaliseBtn","dilacaoAnaliseContexto","dilacaoComparativo","dilacaoDecisaoFormulario","dilacaoPrazoAjustadoField","dilacaoPrazoAjustadoInput","dilacaoManifestacaoField","dilacaoManifestacaoInput","dilacaoRevisao","dilacaoRevisaoResumo","dilacaoConfirmacaoCheck","dilacaoAnaliseAviso","voltarDilacaoAnaliseBtn","revisarDilacaoAnaliseBtn","confirmarDilacaoAnaliseBtn",  
"configuracaoCicloOverlay","configuracaoCicloTitulo","fecharConfiguracaoCicloBtn","cancelarConfiguracaoCicloBtn","configuracaoCicloContexto","configuracaoCicloAtual","configuracaoCicloFormulario","configuracaoPrioridadeSelect","configuracaoPrazoField","configuracaoPrazoInput","configuracaoJustificativa","configuracaoCicloRevisao","configuracaoCicloResumo","configuracaoCicloConfirmacao","configuracaoCicloAviso","voltarConfiguracaoCicloBtn","revisarConfiguracaoCicloBtn","confirmarConfiguracaoCicloBtn",
"redistributionMenu","redistributionMenuPopover","redistribuirDemandasBtn","redistribuirPorTipoBtn","redistribuirPorCpfBtn","gerenciarEquipeBtn","equipeOverlay","fecharEquipeBtn","cancelarEquipeBtn","equipeResumoAtual","equipeContextoCiclo","equipeAbaAdicionar","equipeAbaRemover","equipeAbaRedistribuir","equipePainelAdicionar","equipePainelRemover","equipePainelRedistribuir","equipeDisponiveisLista","equipeAtivosLista","equipeConversaoAviso","incluirColaboradoresBtn","remocaoJustificativa","confirmarRemocaoColaboradorBtn","equipeNovoPrincipalSelect","equipeManterAnteriorCheck","equipeRedistribuicaoJustificativa","redistribuirIndividualBtn","equipeAviso","redistribuicaoOverlay","fecharRedistribuicaoBtn","cancelarRedistribuicaoBtn","redistribuicaoTitulo","redistribuicaoTipoSelect","redistribuicaoCpfInput","redistribuicaoNovoSelect","redistribuicaoManterCheck","redistribuicaoJustificativa","redistribuicaoAviso","redistribuicaoPrevia","redistribuicaoResumo","redistribuicaoDetalhes","revisarRedistribuicaoBtn","confirmarRedistribuicaoBtn","voltarRedistribuicaoBtn","redistribuicaoConfirmacaoCheck","redistribuicaoConfirmacaoResumo","redistribuicaoCarteiras","redistribuicaoDiagnosticoResumo","redistribuicaoImpactoDestino","redistribuicaoEscopoContexto","redistribuicaoEscopoContextoTitulo","redistribuicaoEscopoContextoDetalhe","alterarEscopoRedistribuicaoBtn","redistribuicaoConfirmacaoTexto","redistribuicaoNovoPrazoCheck","redistribuicaoNovoPrazoField","redistribuicaoNovoPrazoInput","loteOperadorLabel","scopeSelectedCount","loteQuantidadeRotulo","loteAlternarSelecionadasBtn","loteEscopoContexto","loteEscopoContextoTitulo","loteEscopoContextoDetalhe","alterarEscopoLoteBtn",
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
  const bruto=String(error?.message||error?.details||error?.hint||error?.code||fallback||"");
  const codigo=bruto.match(/[A-Z][A-Z0-9_]{4,}/)?.[0]||"";
  const traducoes={
    PRAZO_ANTERIOR_A_DATA_ATUAL:"A nova data limite não pode ser anterior à data atual. Escolha a data de hoje ou uma data futura.",
    DATA_PRAZO_NAO_ENCONTRADA:"A data selecionada não está disponível no calendário do sistema.",
    JUSTIFICATIVA_NAO_INFORMADA:"Informe a justificativa da redistribuição.",
    JUSTIFICATIVA_MUITO_CURTA:"A justificativa deve possuir pelo menos 10 caracteres.",
    NOVO_RESPONSAVEL_NAO_INFORMADO:"Selecione o novo responsável principal.",
    NOVO_RESPONSAVEL_NAO_DISPONIVEL:"O responsável selecionado não está disponível para receber indícios.",
    CRITERIO_REDISTRIBUICAO_INVALIDO:"Selecione um escopo válido para a redistribuição em lote.",
    TIPO_INDICIO_NAO_INFORMADO:"Selecione o tipo de indício.",
    CPF_INVALIDO:"Informe um CPF válido com 11 dígitos.",
    ID_INDICIO_NAO_INFORMADO:"Não foi possível identificar o indício.",
    INDICIO_NAO_ENCONTRADO:"O indício não foi encontrado.",
    CPF_NAO_DISPONIVEL:"O CPF completo não está disponível para este indício.",
    PARAMETROS_DE_CRITERIO_CONFLITANTES:"Use apenas um critério de localização: CPF ou tipo de indício.",
    LIMITE_RESULTADOS_INVALIDO:"Não foi possível consultar a carteira porque o limite da operação é inválido.",
    NENHUMA_DEMANDA_ELEGIVEL:"Nenhum indício está elegível para redistribuição em lote.",
    CICLO_NAO_ENCONTRADO_OU_NAO_PERMITE_MOVIMENTACAO:"O Ciclo de Tratamento Interno não está disponível para alteração.",
    VERSAO_DESATUALIZADA:"O Ciclo de Tratamento Interno foi alterado por outra operação. Atualize os dados e tente novamente.",
    CICLO_NAO_ATUALIZADO_POR_CONFLITO_DE_VERSAO:"A configuração foi alterada por outra operação. Atualize os dados e tente novamente.",
    NENHUMA_ALTERACAO_INFORMADA:"Nenhuma alteração foi identificada. Modifique a prioridade ou o prazo para continuar.",
    PARAMETROS_PRAZO_CONFLITANTES:"Escolha somente uma opção para o prazo.",
    PRIORIDADE_INVALIDA:"Selecione uma prioridade válida.",
    IDENTIFICACAO_DA_DEMANDA_NAO_INFORMADA:"Não foi possível identificar o indício ou o Ciclo de Tratamento Interno.",
    PRINCIPAL_ATIVO_NAO_ENCONTRADO:"O Ciclo de Tratamento Interno não possui responsável principal ativo.",
    DATA_ATUAL_NAO_ENCONTRADA:"A data atual não está disponível no calendário do sistema.",
    SOLICITACAO_DILACAO_NAO_ENCONTRADA:"A solicitação de dilação não foi encontrada.",
    SOLICITACAO_DILACAO_JA_ANALISADA:"Esta solicitação já foi analisada.",
    SOLICITACAO_DILACAO_PERDEU_OBJETO:"A solicitação não pode mais ser analisada porque o ciclo deixou de permitir alterações.",
    DECISAO_DILACAO_INVALIDA:"Selecione uma decisão válida.",
    MANIFESTACAO_GESTOR_OBRIGATORIA:"Informe uma manifestação com pelo menos 10 caracteres.",
    PRAZO_APROVADO_NAO_INFORMADO:"Informe a data que será aprovada.",
    PRAZO_APROVADO_ANTERIOR_A_DATA_ATUAL:"A data aprovada não pode ser anterior à data atual.",
    PRAZO_APROVADO_DEVE_SER_POSTERIOR_AO_ATUAL:"A data aprovada deve ser posterior ao prazo atual."
  };
  if(traducoes[codigo])return traducoes[codigo];
  if(/JWT|session|auth/i.test(bruto))return "Sua sessão não é mais válida.";
  if(/PERFIL_NAO_AUTORIZADO|permission|42501/i.test(bruto))return "Seu perfil não possui permissão.";
  return fallback||bruto||"Não foi possível concluir a operação.";
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
async function carregarTiposIndicio(){const {data,error}=await sb.rpc("listar_demandas_gestao",{...parametrosListagem(),p_busca:null,p_situacao_operacional:null,p_id_operador:null,p_id_tipo_indicio:null,p_codigo_prioridade:null,p_situacao_prazo:null,p_pagina:1,p_tamanho_pagina:100});if(error)throw error;estado.tiposIndicio=[...new Map((data?.itens||[]).map(d=>[Number(d.id_tipo_indicio),d.tipo_indicio])).entries()].filter(x=>x[0]&&x[1]).sort((a,b)=>String(a[1]).localeCompare(String(b[1]))).map(([id,nome])=>({id,nome}));el.tipoIndicioFiltroSelect.innerHTML='<option value="">Todos os tipos</option>'+estado.tiposIndicio.map(t=>`<option value="${t.id}">${escapeHtml(t.nome)}</option>`).join(""); preencherSeletoresTipos();}
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
  if (p.p_criterio === "SELECIONADAS" && !p.p_ids_indicios?.length) throw Error("Selecione ao menos um indício.");
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

function renderizarPrevia(x){
  const r=x.resumo||{},elegiveis=Number(r.quantidade_elegivel||0),bloqueadas=x.bloqueadas||[],participantes=x.participantes||{},colaboradores=participantes.colaboradores||[];
  el.lotePreviaResumo.innerHTML=[["Elegíveis",elegiveis,"success"],["Impedidos",r.quantidade_bloqueada||0,"danger"],["Não encontrados",r.quantidade_nao_encontrada||0,"neutral"],["Excedentes",r.quantidade_excedente||0,"warning"]].map(a=>`<div class="preview-metric ${a[2]}"><span>${a[0]}</span><strong>${a[1]}</strong></div>`).join("");
  el.lotePreviaParticipantes.innerHTML=`<section class="review-section"><h4>Escopo</h4>${renderizarContextoEscopoAtribuicao(true)}</section><section class="review-section"><h4>Equipe</h4><dl class="review-definition-list"><div><dt>Responsável principal</dt><dd>${escapeHtml(participantes.principal?.nome_exibicao)}</dd></div><div><dt>Modo de trabalho</dt><dd>${escapeHtml(x.modo_trabalho?.nome||x.modo_trabalho?.codigo)}</dd></div><div><dt>Colaboradores</dt><dd>${colaboradores.length?colaboradores.map(c=>escapeHtml(c.nome_exibicao)).join(", "):"Nenhum"}</dd></div></dl></section><section class="review-section"><h4>Configuração</h4><dl class="review-definition-list"><div><dt>Prioridade</dt><dd>${escapeHtml(el.lotePrioridadeSelect.selectedOptions[0]?.textContent||"Normal")}</dd></div><div><dt>Prazo</dt><dd>${el.lotePrazoCheck.checked?formatarData(el.lotePrazoInput.value):"Não definido"}</dd></div><div><dt>Processo SEI</dt><dd>${el.loteVincularSei.checked?escapeHtml(el.loteSeiNumero.value||"Pendente"):"Não informado"}</dd></div></dl></section>`;
  el.lotePreviaDetalhes.innerHTML=bloqueadas.length?`<details class="blocked-details"><summary>Ver ${bloqueadas.length} ${bloqueadas.length===1?"indício impedido":"indícios impedidos"}</summary><ul>${bloqueadas.map(b=>`<li>${escapeHtml(b.identificador_do_indicio||b.id_indicio)}: ${escapeHtml(b.motivos?.[0]?.mensagem||"Não elegível")}</li>`).join("")}</ul></details>`:`<div class="preview-ok">Todos os indícios localizados estão aptos para atribuição.</div>`;
  el.loteConfirmacaoCheck.nextElementSibling.textContent=`Revisei os dados e confirmo a atribuição de ${elegiveis} ${elegiveis===1?"indício elegível":"indícios elegíveis"}.`;
  el.lotePrevia.hidden=false;el.confirmarLoteBtn.disabled=!x.pode_confirmar||!el.loteConfirmacaoCheck.checked;preencherResumoAtribuicao();
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
      ? { principal: "Sem prazo definido", auxiliar: "Definição pendente", classe: "SEM_PRAZO" }
      : { principal: "Sem prazo definido", auxiliar: "Não aplicável", classe: "NAO_APLICAVEL" };
  }
  return {
    principal: formatarData(demanda.prazo_em),
    auxiliar: rotuloPainel(demanda.situacao_prazo || "NO_PRAZO"),
    classe: demanda.situacao_prazo || "NO_PRAZO"
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
      <td class="col-prazo"><span class="deadline-label ${escapeHtml(prazo.classe)}"><strong>${escapeHtml(prazo.principal)}</strong><span class="deadline-indicator">${escapeHtml(prazo.auxiliar)}</span></span></td>
      <td class="col-atualizacao"><strong>${formatarData(d.data_ultima_modificacao)}</strong><br><small>e-Pessoal<br>${diasEstoque} ${diasEstoque === 1 ? "dia" : "dias"} no estoque</small></td>
      <td class="col-acoes sticky-actions"><button class="btn btn-secondary" type="button" data-visualizar="${d.id_indicio}">Detalhes</button></td>
    </tr>`;
  }).join("");

  atualizarCheckPagina();
}

function renderizarPaginacao(p) {
  el.paginacaoInfo.textContent = p.total_registros ? `Exibindo ${p.registro_inicial} a ${p.registro_final} de ${p.total_registros}` : "Nenhum indício";
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
  if(el.loteOverlay && !el.loteOverlay.hidden) atualizarSelecionadasLote();
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
    ciclo: `Ciclo de Tratamento Interno ${contexto.numero || "não informado"}${contexto.versao ? ` · versão ${contexto.versao}` : ""}`,
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
    el.modalModoLeitura.innerHTML = "<strong>Sem Ciclo de Tratamento Interno</strong><span>A equipe será definida na atribuição inicial do indício.</span>";
  } else if (contexto.somenteLeitura) {
    const data = ciclo.encerrado_em ? ` em ${formatarDataHora(ciclo.encerrado_em)}` : "";
    el.modalModoLeitura.innerHTML = `<strong>Ciclo de Tratamento Interno em somente leitura</strong><span>Este Ciclo de Tratamento Interno foi concluído${data} e não permite alterações.</span>`;
  } else {
    el.modalModoLeitura.innerHTML = "<strong>Ciclo de Tratamento Interno atual e editável</strong><span>As alterações permitidas serão registradas no histórico integral.</span>";
  }
}

/** Renderiza o seletor apenas quando ele acrescenta contexto ao usuário. */
function renderizarSeletorCiclos(ciclos = [], selecionado = null) {
  if (!ciclos.length) {
    return '<div class="cycle-empty-state"><strong>Este indício ainda não possui tratamento interno.</strong><span>Atribua o indício para iniciar o primeiro tratamento interno.</span></div>';
  }
  if (ciclos.length === 1) {
    const ciclo = ciclos[0];
    const estadoCiclo = interpretarCiclo(ciclo);
    const situacao = ciclo.nome_status_ciclo || rotuloSituacao(ciclo.codigo_status_ciclo);
    return `<div class="cycle-single-summary"><div><span>Ciclo de Tratamento Interno selecionado</span><strong>Ciclo ${ciclo.numero_ciclo || "-"}${ciclo.versao_ciclo || ciclo.versao ? ` · versão ${ciclo.versao_ciclo || ciclo.versao}` : ""}</strong></div><div><span>Período</span><strong>${formatarDataHora(ciclo.aberto_em || ciclo.iniciado_em)} a ${formatarDataHora(ciclo.encerrado_em)}</strong></div><span class="badge ${classeSituacao(ciclo.codigo_status_ciclo)}">${escapeHtml(situacao)}</span><small>${estadoCiclo.somenteLeitura ? "Somente leitura" : "Editável"}</small></div>`;
  }
  return `<div class="cycle-selector">${ciclos.map(ciclo => {
    const estadoCiclo = interpretarCiclo(ciclo);
    const ativo = Number(ciclo.id_ciclo_tratamento) === Number(selecionado?.id_ciclo_tratamento);
    const contexto = estadoCiclo.concluidoOperacionalmente ? "Concluído" : estadoCiclo.cicloVigente ? "Ciclo de Tratamento Interno atual" : "Histórico";
    return `<button class="cycle-card ${ativo ? "active" : ""}" type="button" data-ciclo-selecionar="${ciclo.id_ciclo_tratamento}" aria-pressed="${ativo}"><header><strong>Ciclo ${ciclo.numero_ciclo}</strong><span class="badge ${classeSituacao(ciclo.codigo_status_ciclo)}">${escapeHtml(ciclo.nome_status_ciclo || rotuloSituacao(ciclo.codigo_status_ciclo))}</span></header><small>${formatarDataHora(ciclo.aberto_em || ciclo.iniciado_em)} a ${formatarDataHora(ciclo.encerrado_em)}</small><span>${contexto} · ${estadoCiclo.somenteLeitura ? "Somente leitura" : "Editável"}</span></button>`;
  }).join("")}</div>`;
}

function configuracaoCicloSelecionada() {
  return estado.detalhe.dados?.ciclo_selecionado || estado.detalhe.cicloSelecionado || {};
}
function valorDataInput(valor) {
  if (!valor) return "";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return String(valor).slice(0, 10);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza", year: "numeric", month: "2-digit", day: "2-digit" }).format(data);
}
function renderConfiguracaoCiclo() {
  const ciclo = configuracaoCicloSelecionada();
  const contexto = estado.detalhe.contextoCiclo || {};
  if (!contexto.possuiCiclo) return "";
  const prioridade = ciclo.nome_prioridade || estado.detalhe.demanda?.nome_prioridade || "Não definida";
  const prazo = ciclo.prazo_em ? formatarDataHora(ciclo.prazo_em) : "Sem prazo definido";
  const situacao = rotuloPrazo(classificarSituacaoPrazo({ ...ciclo, possui_ciclo_ativo: contexto.possuiCiclo }), ciclo.dias_ate_prazo, true);
  return `<section class="cycle-config-section" data-cycle-config-section><div><span class="eyebrow">Configuração do Ciclo de Tratamento Interno</span><h3>Prioridade e prazo</h3><p>Consulte a configuração vigente e o histórico das alterações administrativas.</p></div><div class="cycle-config-values"><article><span>Prioridade atual</span><strong>${escapeHtml(prioridade)}</strong></article><article><span>Prazo atual</span><strong>${escapeHtml(prazo)}</strong><small>${escapeHtml(situacao)}</small></article></div>${contexto.editavel ? '<button class="btn btn-secondary" type="button" data-alterar-configuracao-ciclo>Alterar prioridade ou prazo</button>' : '<div class="readonly-inline">Este Ciclo de Tratamento Interno está disponível somente para consulta.</div>'}</section>`;
}
function atualizarBlocoConfiguracaoCiclo() {
  const atual = el.painelDetalhesGestor.querySelector("[data-cycle-config-section]");
  const html = renderConfiguracaoCiclo();
  if (atual) atual.outerHTML = html;
  else if (html) el.painelDetalhesGestor.insertAdjacentHTML("beforeend", html);
}
function limparAvisoConfiguracao() { el.configuracaoCicloAviso.hidden = true; el.configuracaoCicloAviso.textContent = ""; }
function modoPrazoConfiguracao() { return document.querySelector('input[name="configuracaoPrazoModo"]:checked')?.value || "MANTER"; }
function abrirConfiguracaoCiclo() {
  const ciclo = configuracaoCicloSelecionada(), contexto = estado.detalhe.contextoCiclo;
  if (!contexto?.editavel || !ciclo.id_ciclo_tratamento) return;
  estado.detalhe.configuracaoEtapa = 1;
  el.configuracaoPrioridadeSelect.innerHTML = estado.prioridades.map(p => `<option value="${escapeHtml(p.codigo_prioridade)}">${escapeHtml(p.nome_prioridade)}</option>`).join("");
  el.configuracaoPrioridadeSelect.value = ciclo.codigo_prioridade || estado.detalhe.demanda?.codigo_prioridade || "";
  document.querySelector('input[name="configuracaoPrazoModo"][value="MANTER"]').checked = true;
  el.configuracaoPrazoField.hidden = true;
  el.configuracaoPrazoInput.value = valorDataInput(ciclo.prazo_em);
  el.configuracaoPrazoInput.min = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza", year:"numeric", month:"2-digit", day:"2-digit" }).format(new Date());
  el.configuracaoJustificativa.value = "";
  el.configuracaoCicloConfirmacao.checked = false;
  el.configuracaoCicloContexto.innerHTML = `<span>Indício ${escapeHtml(estado.detalhe.demanda?.identificador_do_indicio)}</span><strong>Ciclo de Tratamento Interno ${escapeHtml(contexto.numero || "atual")}</strong>`;
  el.configuracaoCicloAtual.innerHTML = `<article><span>Prioridade atual</span><strong>${escapeHtml(ciclo.nome_prioridade || estado.detalhe.demanda?.nome_prioridade || "Não definida")}</strong></article><article><span>Prazo atual</span><strong>${escapeHtml(ciclo.prazo_em ? formatarDataHora(ciclo.prazo_em) : "Sem prazo definido")}</strong></article>`;
  mostrarEtapaConfiguracao(1); limparAvisoConfiguracao(); el.configuracaoCicloOverlay.hidden = false; document.body.style.overflow = "hidden";
}
function fecharConfiguracaoCiclo() { el.configuracaoCicloOverlay.hidden = true; if (el.atribuicaoOverlay.hidden) document.body.style.overflow = ""; }
function mostrarEtapaConfiguracao(etapa) {
  estado.detalhe.configuracaoEtapa = etapa;
  el.configuracaoCicloFormulario.hidden = etapa !== 1;
  el.configuracaoCicloRevisao.hidden = etapa !== 2;
  el.voltarConfiguracaoCicloBtn.hidden = etapa !== 2;
  el.revisarConfiguracaoCicloBtn.hidden = etapa !== 1;
  el.confirmarConfiguracaoCicloBtn.hidden = etapa !== 2;
  el.confirmarConfiguracaoCicloBtn.disabled = !el.configuracaoCicloConfirmacao.checked;
}
function dadosConfiguracaoCiclo() {
  const ciclo = configuracaoCicloSelecionada(), modo = modoPrazoConfiguracao();
  return { ciclo, modo, prioridade: el.configuracaoPrioridadeSelect.value, prazo: modo === "DEFINIR" ? el.configuracaoPrazoInput.value : null, remover: modo === "REMOVER", justificativa: el.configuracaoJustificativa.value.trim() };
}
function revisarConfiguracaoCiclo() {
  try {
    limparAvisoConfiguracao();
    const x = dadosConfiguracaoCiclo();
    if (!x.prioridade) throw Error("Selecione uma prioridade.");
    if (x.modo === "DEFINIR" && !x.prazo) throw Error("Informe a nova data limite.");
    if (x.justificativa.length < 10) throw Error("A justificativa deve possuir pelo menos 10 caracteres.");
    const prioridadeAtual = x.ciclo.codigo_prioridade || estado.detalhe.demanda?.codigo_prioridade || "";
    const prioridadeMudou = x.prioridade !== prioridadeAtual;
    const prazoAtual = valorDataInput(x.ciclo.prazo_em);
    const prazoMudou = x.modo === "REMOVER" ? Boolean(x.ciclo.prazo_em) : x.modo === "DEFINIR" ? x.prazo !== prazoAtual : false;
    if (!prioridadeMudou && !prazoMudou) throw Error("Nenhuma alteração foi identificada. Modifique a prioridade ou o prazo para continuar.");
    const prioridadeNova = estado.prioridades.find(p => p.codigo_prioridade === x.prioridade)?.nome_prioridade || x.prioridade;
    const prazoNovo = x.modo === "MANTER" ? (x.ciclo.prazo_em ? formatarDataHora(x.ciclo.prazo_em) : "Sem prazo definido") : x.modo === "REMOVER" ? "Sem prazo definido" : formatarData(x.prazo);
    el.configuracaoCicloResumo.innerHTML = `<dl class="review-definition-list"><div><dt>Prioridade</dt><dd>${escapeHtml(x.ciclo.nome_prioridade || "Não definida")} ${prioridadeMudou ? `→ ${escapeHtml(prioridadeNova)}` : '<small>Sem alteração</small>'}</dd></div><div><dt>Prazo</dt><dd>${escapeHtml(x.ciclo.prazo_em ? formatarDataHora(x.ciclo.prazo_em) : "Sem prazo definido")} ${prazoMudou ? `→ ${escapeHtml(prazoNovo)}` : '<small>Sem alteração</small>'}</dd></div><div class="full"><dt>Justificativa</dt><dd>${escapeHtml(x.justificativa)}</dd></div></dl>`;
    el.configuracaoCicloConfirmacao.checked = false; mostrarEtapaConfiguracao(2);
  } catch (error) { el.configuracaoCicloAviso.textContent = error.message; el.configuracaoCicloAviso.className = "status-banner error"; el.configuracaoCicloAviso.hidden = false; }
}
async function confirmarConfiguracaoCiclo() {
  const x = dadosConfiguracaoCiclo(), contexto = estado.detalhe.contextoCiclo;
  try {
    el.confirmarConfiguracaoCicloBtn.disabled = true; limparAvisoConfiguracao();
    const { data, error } = await sb.rpc("alterar_prioridade_prazo_demanda_gestor", { p_id_indicio: Number(estado.detalhe.demanda.id_indicio), p_id_ciclo_tratamento: Number(x.ciclo.id_ciclo_tratamento), p_versao_esperada: Number(contexto.versao), p_codigo_prioridade: x.prioridade, p_prazo_em: x.modo === "DEFINIR" ? `${x.prazo}T23:59:59-03:00` : null, p_remover_prazo: x.remover, p_justificativa: x.justificativa });
    if (error) throw error;
    fecharConfiguracaoCiclo();
    const demanda = estado.detalhe.demanda;
    await Promise.all([carregarResumo(), carregarDemandas()]);
    await abrirDetalhe(demanda);
    switchDetailTab("historico");
    exibirMensagem(data?.alterou_prioridade && data?.alterou_prazo ? "Prioridade e prazo atualizados." : data?.alterou_prioridade ? "Prioridade atualizada." : "Prazo atualizado.", "success");
  } catch (error) { el.configuracaoCicloAviso.textContent = mensagemErro(error, "Não foi possível atualizar a configuração."); el.configuracaoCicloAviso.className = "status-banner error"; el.configuracaoCicloAviso.hidden = false; el.confirmarConfiguracaoCicloBtn.disabled = false; }
}
function formatarCpfCompleto(cpf) {
  const digitos = String(cpf || "").replace(/\D/g, "");
  return digitos.length === 11
    ? digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
    : null;
}
function atualizarControleCpf() {
  const dados = estado.detalhe.dados || {};
  const demanda = estado.detalhe.demanda || {};
  const mascara = dados.cpf_mascarado || demanda.cpf_mascarado || "CPF protegido";
  const completo = formatarCpfCompleto(estado.detalhe.cpfCompleto);
  const valor = estado.detalhe.cpfVisivel && completo ? completo : mascara;
  el.modalCpf.textContent = valor;
  const cpfCartao = el.painelDetalhesGestor.querySelector("[data-cpf-detalhe]");
  if (cpfCartao) cpfCartao.textContent = valor;
  const permitido = dados.permissoes?.pode_revelar_cpf === true;
  el.alternarCpfModalBtn.hidden = !permitido;
  el.alternarCpfModalBtn.disabled = estado.detalhe.cpfCarregando;
  el.alternarCpfModalBtn.textContent = estado.detalhe.cpfCarregando
    ? "Consultando..."
    : estado.detalhe.cpfVisivel ? "Ocultar CPF" : "Mostrar CPF";
  el.alternarCpfModalBtn.setAttribute("aria-pressed", String(estado.detalhe.cpfVisivel));
}
async function alternarCpfDetalhe() {
  if (estado.detalhe.cpfCarregando) return;
  if (estado.detalhe.cpfVisivel) {
    estado.detalhe.cpfVisivel = false;
    atualizarControleCpf();
    return;
  }
  if (estado.detalhe.cpfCompleto) {
    estado.detalhe.cpfVisivel = true;
    atualizarControleCpf();
    return;
  }
  const idIndicio = Number(estado.detalhe.demanda?.id_indicio);
  if (!idIndicio) return;
  try {
    estado.detalhe.cpfCarregando = true;
    atualizarControleCpf();
    const { data, error } = await sb.rpc("revelar_cpf_demanda_gestor", {
      p_id_indicio: idIndicio
    });
    if (error) throw error;
    const completo = formatarCpfCompleto(data?.cpf);
    if (!completo) throw new Error("CPF_NAO_DISPONIVEL");
    estado.detalhe.cpfCompleto = completo;
    estado.detalhe.cpfVisivel = true;
    el.modalMensagemDetalhe.hidden = true;
  } catch (error) {
    estado.detalhe.cpfCompleto = null;
    estado.detalhe.cpfVisivel = false;
    el.modalMensagemDetalhe.textContent = mensagemErro(error, "Não foi possível revelar o CPF.");
    el.modalMensagemDetalhe.className = "status-banner modal-message error";
    el.modalMensagemDetalhe.hidden = false;
  } finally {
    estado.detalhe.cpfCarregando = false;
    atualizarControleCpf();
  }
}
function dCardCpf(valor) {
  return `<div class="detail-card cpf-detail-card"><span>CPF</span><strong data-cpf-detalhe>${escapeHtml(valor || "CPF protegido")}</strong></div>`;
}
async function abrirDetalhe(d){if(!d)return;estado.detalhe.demanda=d;estado.detalhe.cpfVisivel=false;estado.detalhe.cpfCompleto=null;estado.detalhe.cpfCarregando=false;const req=++estado.detalhe.requisicao;el.modalIdentificador.textContent=d.identificador_do_indicio||"Não informado";el.modalNome.textContent=d.nome_atual||"Não informado";el.modalCpf.textContent=d.cpf_mascarado||"CPF protegido";el.modalTipo.textContent=d.tipo_indicio||"Não informado";el.modalSituacao.textContent=rotuloSituacao(d.situacao_operacional);el.modalSituacao.className=`badge ${classeSituacao(d.situacao_operacional)}`;el.modalPrioridade.textContent=d.nome_prioridade||"Não definida";el.modalPrazo.textContent=d.id_ciclo_tratamento?(d.prazo_em?formatarDataHora(d.prazo_em):"Sem prazo definido"):"Não aplicável";el.modalOperador.textContent=d.id_ciclo_tratamento?(d.nome_operador_principal||"Consultando histórico"):"Não atribuído";el.modalProcessosQtd.textContent="Consultando...";el.modalCicloResumo.textContent=d.id_ciclo_tratamento?"Consultando ciclo...":"Ainda não iniciado";el.modalModoLeitura.hidden=true;el.modalMensagemDetalhe.hidden=true;el.gerenciarEquipeBtn.hidden=true;el.atribuicaoOverlay.hidden=false;document.body.style.overflow="hidden";switchDetailTab("detalhes");[el.painelDetalhesGestor,el.painelEquipeGestor,el.painelProcessosGestor,el.painelHistoricoGestor,el.painelRelatorioGestor].forEach(x=>x.innerHTML='<div class="table-state">Carregando...</div>');try{const{data,error}=await sb.rpc("obter_detalhes_demanda_gestor",{p_id_indicio:Number(d.id_indicio),p_id_ciclo_tratamento:d.id_ciclo_tratamento||null});if(error)throw error;if(req!==estado.detalhe.requisicao)return;estado.detalhe.dados=data;const ciclo=data.ciclo_selecionado||data;const processos=data.processos_sei||data.processos||[];const equipeNormalizada=normalizarEquipeDoCiclo(data,d);const principal=equipeNormalizada.principal;const colaboradores=equipeNormalizada.colaboradores;atualizarControleCpf();el.modalAtualizacaoEPessoal.textContent=formatarDataHora(data.data_ultima_modificacao||d.data_ultima_modificacao);aplicarContextoCicloModal(d,data,ciclo,processos,principal);el.painelDetalhesGestor.innerHTML=dSection("Identificação",dCard("Número do indício",data.identificador_do_indicio||d.identificador_do_indicio)+dCard("Base de dados",data.base_de_dados||d.base_de_dados)+dCard("Tipo de indício",data.tipo_indicio||d.tipo_indicio,"full classified-text")+dCard("Descrição",data.descricao_indicio||"Descrição não informada.","full narrative-text"))+dSection("Pessoa",dCard("Nome atual",data.nome_atual||d.nome_atual,"wide")+dCardCpf(data.cpf_mascarado||d.cpf_mascarado)+`<div class="detail-card full detail-bonds"><span>Situação funcional</span><strong>${renderVinculosDetalhe(data,d)}</strong></div>`)+renderListaVinculosDetalhe(data,d)+renderConfiguracaoCiclo();atualizarControleCpf();el.painelEquipeGestor.innerHTML=renderEquipeConsolidada(data,d);el.painelProcessosGestor.innerHTML = processos.length
  ? `<div class="process-list">${processos.map(x => `<article class="process-detail-card ${x.processo_ativo === false ? "inactive" : ""}"><header><h3>${escapeHtml(x.numero_processo)}</h3><div>${x.processo_principal ? '<span class="badge badge-primary">Principal</span>' : '<span class="badge badge-neutral">Adicional</span>'} ${x.processo_ativo === false ? '<span class="badge badge-neutral">Inativo</span>' : '<span class="badge status-progress">Ativo</span>'}</div></header><p>${escapeHtml(x.assunto || "Assunto não informado")}</p>${x.observacao ? `<p class="muted">${escapeHtml(x.observacao)}</p>` : ""}<dl><div><dt>Vinculado em</dt><dd>${formatarDataHora(x.incluido_em || x.vinculado_em)}</dd></div><div><dt>Responsável pelo vínculo</dt><dd>${escapeHtml(x.nome_executor || x.nome_usuario || "Não informado")}</dd></div></dl></article>`).join("")}</div>`
  : `<div class="process-empty-state"><div><strong>${estado.detalhe.contextoCiclo?.somenteLeitura ? "Nenhum processo foi vinculado durante este ciclo." : "Nenhum processo SEI vinculado"}</strong><p>${estado.detalhe.contextoCiclo?.somenteLeitura ? "O ciclo permanece disponível para consulta histórica." : "Este ciclo ainda não possui processo administrativo associado."}</p>${!estado.detalhe.contextoCiclo?.somenteLeitura && estado.detalhe.contextoCiclo?.possuiCiclo ? '<button class="btn btn-primary" type="button" data-add-processo-sei>Vincular processo SEI</button>' : ""}</div></div>`;
try{const{data:hist,error:he}=await sb.rpc("listar_movimentacoes_demanda_gestor",{p_id_indicio:Number(d.id_indicio),p_id_ciclo_tratamento:ciclo.id_ciclo_tratamento||d.id_ciclo_tratamento||null,p_categoria:null,p_data_inicial:null,p_data_final:null,p_pagina:1,p_tamanho_pagina:200});if(he)throw he;const rows=hist?.itens||[];estado.detalhe.historico=rows;el.painelRelatorioGestor.innerHTML=`<div class="report-cover"><span class="eyebrow">Relatório do indício</span><h3>Indício ${escapeHtml(d.identificador_do_indicio)}</h3><p>O relatório reúne identificação, vínculos funcionais, ciclo selecionado, participantes, processos SEI e auditoria integral.</p><div class="report-scope"><article><span>Escopo</span><strong>${ciclo.id_ciclo_tratamento ? `Ciclo ${ciclo.numero_ciclo || "selecionado"}` : "Histórico do indício"}</strong></article><article><span>Situação</span><strong>${escapeHtml(ciclo.nome_status_ciclo || rotuloSituacao(d.situacao_operacional))}</strong></article><article><span>Movimentações</span><strong>${rows.length}</strong></article></div><button class="btn btn-primary" type="button" data-export-report>Gerar relatório em PDF</button></div><div class="report-sections"><article><strong>Identificação e origem</strong><p>Dados da pessoa, CPF mascarado, vínculos funcionais e atualização na origem.</p></article><article><strong>Ciclo e participantes</strong><p>Responsável principal, colaboradores e participações históricas.</p></article><article><strong>Processos SEI</strong><p>Processo principal, vínculos adicionais e inativos.</p></article><article><strong>Auditoria integral</strong><p>${rows.length} ${rows.length === 1 ? "movimentação" : "movimentações"} no ciclo selecionado.</p></article></div>`;el.painelHistoricoGestor.innerHTML=renderHistoricoConsolidado(rows);atualizarHistoricoFiltrado()}catch(e){el.painelHistoricoGestor.innerHTML=`<div class="status-banner warning">Não foi possível carregar o histórico: ${escapeHtml(e.message)}</div>`}}catch(error){console.error(error);el.modalMensagemDetalhe.textContent=mensagemErro(error,"Não foi possível carregar os detalhes.");el.modalMensagemDetalhe.className="status-banner modal-message error";el.modalMensagemDetalhe.hidden=false;el.painelDetalhesGestor.innerHTML=dSection("Dados disponíveis",dCard("Indício",d.identificador_do_indicio)+dCard("Pessoa",d.nome_atual)+dCard("CPF",d.cpf_mascarado)+dCard("Tipo",d.tipo_indicio,"full"))}}
function fecharDetalhe() {
  estado.detalhe.cpfVisivel = false;
  estado.detalhe.cpfCompleto = null;
  estado.detalhe.cpfCarregando = false;
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
  estado.lote={criterio:null,escopo:null,previa:null,assinaturaPrevia:null,etapa:1,selecionadasExpandidas:false};el.loteTitulo.textContent="Atribuir indícios";el.loteModoSelect.value="INDIVIDUAL";preencherSeletoresTipos();atualizarOpcoesColaboradores();atualizarModoLote();atualizarSelecionadasLote();document.querySelectorAll("[data-assignment-scope]").forEach(b=>b.classList.remove("active"));document.querySelector("[data-assignment-scope-slot]").innerHTML='<div class="scope-empty-state">Selecione um escopo para continuar.</div>';el.loteConfirmacaoCheck.checked=false;limparAvisoOperacao(el.loteAviso);mostrarEtapaLote(1);el.loteOverlay.hidden=false;document.body.style.overflow="hidden";
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
async function redistribuirIndividual(){try{const dados=estado.detalhe.dados;const demanda=estado.detalhe.demanda;const novo=Number(el.equipeNovoPrincipalSelect.value);const justificativa=el.equipeRedistribuicaoJustificativa.value.trim();if(!novo)throw Error("Selecione o novo responsável.");if(justificativa.length<10)throw Error("Informe uma justificativa com pelo menos 10 caracteres.");const principalNormalizado = normalizarEquipeDoCiclo(dados, demanda).principal;const principalAtual = principalNormalizado?.id_usuario ? Number(principalNormalizado.id_usuario) : null;const base={p_criterio:"CPF",p_id_tipo_indicio:null,p_cpf:dados.cpf,p_id_responsavel_atual:principalAtual,p_id_novo_responsavel:novo,p_manter_anterior_como_colaborador:principalAtual ? el.equipeManterAnteriorCheck.checked : false,p_limite_resultados:100};const {data:previa,error:erroPrevia}=await sb.rpc("prever_redistribuicao_demandas",{...base,p_incluir_detalhes:true});if(erroPrevia)throw erroPrevia;const elegiveis=previa?.elegiveis||[];if(elegiveis.length!==1||Number(elegiveis[0].id_indicio)!==Number(demanda.id_indicio))throw Error("A troca individual não pode ser concluída por este fluxo porque o CPF possui outra indício pendente com o mesmo responsável. Use a redistribuição em lote por CPF.");const {data,error}=await sb.rpc("redistribuir_demandas_lote",{...base,p_limite_resultados:1,p_justificativa:justificativa,p_politica_bloqueios:"EXIGIR_TODAS_ELEGIVEIS"});if(error)throw error;mostrarAvisoEquipe(data.mensagem||"Responsabilidade alterada.","success");await recarregarDetalheEquipe();await Promise.all([carregarResumo(),carregarDemandas()]);}catch(e){mostrarAvisoEquipe(mensagemErro(e,e.message||"Não foi possível trocar o responsável."),"error");}}
function alternarMenuRedistribuicao(forcar){const abrir=forcar??el.redistributionMenuPopover.hidden;el.redistributionMenuPopover.hidden=!abrir;el.redistribuirDemandasBtn.setAttribute("aria-expanded",String(abrir));}
function parametrosDiagnosticoRedistribuicao(pagina=1){
  const porTipo=estado.redistribuicao.escopo==="tipo";
  return {...parametrosListagem(),p_busca:porTipo?null:el.redistribuicaoCpfInput.value,p_situacao_operacional:null,p_id_operador:null,p_id_tipo_indicio:porTipo?Number(el.redistribuicaoTipoSelect.value):null,p_codigo_prioridade:null,p_situacao_prazo:null,p_apenas_multiplas_origens:null,p_apenas_sem_responsavel:null,p_apenas_requer_analise:null,p_pagina:pagina,p_tamanho_pagina:100};
}
function classificarDiagnosticoRedistribuicao(d){
  if(!d.id_ciclo_tratamento)return "NAO_ATRIBUIDO";
  if(d.iniciado_em)return "TRATAMENTO_INICIADO";
  if(d.encerrado_em||d.codigo_status_ciclo==="ENCERRADO_INTERNAMENTE")return "TRATAMENTO_CONCLUIDO";
  if(d.ciclo_ativo===true&&d.codigo_status_ciclo==="PENDENTE"&&d.permite_movimentacao===true&&d.id_operador_principal)return "PENDENTE_NAO_INICIADO";
  return "OUTRO_IMPEDIMENTO";
}
async function diagnosticarEscopoRedistribuicao(){
  el.redistribuicaoCarteiras.innerHTML='<div class="scope-empty-state">Localizando indícios e responsáveis principais...</div>';
  el.redistribuicaoDiagnosticoResumo.hidden=true;
  const base=parametrosRedistribuicao();
  let melhor=null;
  for(const operador of estado.operadores){
    const tentativa={...base,p_id_novo_responsavel:Number(operador.id_usuario),p_incluir_detalhes:true};
    const {data,error}=await sb.rpc("prever_redistribuicao_demandas_v2",tentativa);
    if(error)throw error;
    const jaDestino=(data?.bloqueadas||[]).filter(x=>x.codigo==="NOVO_RESPONSAVEL_JA_E_PRINCIPAL").length;
    const candidato={data,jaDestino};
    if(!melhor||candidato.jaDestino<melhor.jaDestino)melhor=candidato;
    if(jaDestino===0)break;
  }
  if(!melhor)throw Error("Não foi possível diagnosticar a carteira.");
  const data=melhor.data,r=data.resumo||{};
  const responsaveis=(data.responsaveis_atuais||[]).filter(x=>x.id_usuario!==null);
  const pendentes=responsaveis.reduce((s,x)=>s+Number(x.quantidade_elegivel||0),0);
  estado.redistribuicao.diagnostico={...data,pendentes,responsaveis};
  renderizarDiagnosticoRedistribuicao();
  return estado.redistribuicao.diagnostico;
}
function renderizarDiagnosticoRedistribuicao(){
  const d=estado.redistribuicao.diagnostico;if(!d)return;
  const r=d.resumo||{},responsaveis=d.responsaveis||[];
  el.redistribuicaoDiagnosticoResumo.hidden=false;
  el.redistribuicaoDiagnosticoResumo.innerHTML=`<article><span>Localizados</span><strong>${Number(r.quantidade_localizada||0)}</strong></article><article class="success"><span>Pendentes e ainda não iniciados</span><strong>${Number(d.pendentes||0)}</strong></article><article><span>Ciclos de Tratamento Interno já iniciados</span><strong>${Number(r.quantidade_tratamento_iniciado||0)}</strong></article><article><span>Ainda não atribuídos</span><strong>${(d.bloqueadas||[]).filter(x=>x.codigo==="DEMANDA_SEM_CICLO_ATIVO").length}</strong></article>`;
  el.redistribuicaoCarteiras.innerHTML=responsaveis.length?`<div class="portfolio-heading"><h4>Responsáveis principais atuais</h4><p>${responsaveis.length} ${responsaveis.length===1?"carteira identificada":"carteiras identificadas"}</p></div><div class="portfolio-list">${responsaveis.map(x=>`<article><div><strong>${escapeHtml(x.nome_exibicao)}</strong><span>${Number(x.quantidade_elegivel||0)} ${Number(x.quantidade_elegivel||0)===1?"indício pendente e ainda não iniciado":"indícios pendentes e ainda não iniciados"}</span></div></article>`).join("")}</div>`:'<div class="scope-empty-state">Nenhum responsável principal com indício pendente e ainda não iniciado.</div>';
}
function parametrosRedistribuicao(incluirDetalhes=true){const e=estado.redistribuicao.escopo;const base={p_criterio:e==="tipo"?"TIPO_INDICIO":"CPF",p_id_tipo_indicio:e==="tipo"&&el.redistribuicaoTipoSelect.value?Number(el.redistribuicaoTipoSelect.value):null,p_cpf:e==="cpf"?el.redistribuicaoCpfInput.value:null,p_id_novo_responsavel:el.redistribuicaoNovoSelect.value?Number(el.redistribuicaoNovoSelect.value):null,p_manter_anteriores_como_colaboradores:el.redistribuicaoManterCheck.checked,p_novo_prazo_em:el.redistribuicaoNovoPrazoCheck.checked&&el.redistribuicaoNovoPrazoInput.value?`${el.redistribuicaoNovoPrazoInput.value}T23:59:59-03:00`:null,p_limite_resultados:100};return incluirDetalhes?{...base,p_incluir_detalhes:true}:{...base,p_justificativa:el.redistribuicaoJustificativa.value.trim(),p_politica_bloqueios:"PROCESSAR_ELEGIVEIS"};}
function assinaturaRedistribuicao(){const p=parametrosRedistribuicao();delete p.p_incluir_detalhes;return JSON.stringify(p);}
function abrirRedistribuicao(){estado.redistribuicao={criterio:null,escopo:null,previa:null,assinatura:null,etapa:1,diagnostico:null};el.redistribuicaoTitulo.textContent="Redistribuição em lote";preencherSeletoresTipos();el.redistribuicaoNovoSelect.innerHTML='<option value="">Selecione um operador</option>'+opcoesOperadores();document.querySelectorAll("[data-redistribution-scope]").forEach(b=>b.classList.remove("active"));document.querySelectorAll("[data-red-scope-field]").forEach(x=>x.hidden=true);document.querySelector("[data-red-scope-empty]").hidden=false;el.redistribuicaoJustificativa.value="";el.redistribuicaoManterCheck.checked=false;el.redistribuicaoNovoPrazoCheck.checked=false;el.redistribuicaoNovoPrazoField.hidden=true;el.redistribuicaoConfirmacaoCheck.checked=false;el.redistribuicaoCarteiras.innerHTML='<div class="scope-empty-state">O diagnóstico do escopo será exibido aqui.</div>';el.redistribuicaoImpactoDestino.innerHTML="";limparAvisoOperacao(el.redistribuicaoAviso);mostrarEtapaRedistribuicao(1);el.redistribuicaoOverlay.hidden=false;document.body.style.overflow="hidden";}
function fecharRedistribuicao(){el.redistribuicaoOverlay.hidden=true;document.body.style.overflow="";}
function renderizarImpactoDestinoRedistribuicao(data){
  const n=data?.novo_responsavel||{},r=data?.resumo||{};
  el.redistribuicaoImpactoDestino.innerHTML=`<div class="impact-metrics"><article><span>Carga atual</span><strong>${Number(n.carga_atual_principal||0)}</strong></article><article><span>A receber</span><strong>+${Number(n.quantidade_a_receber||0)}</strong></article><article><span>Carga estimada</span><strong>${Number(n.carga_estimada_principal||0)}</strong></article></div>`;
  const carteiras=(data?.responsaveis_atuais||[]).filter(x=>Number(x.quantidade_elegivel||0)>0);
  el.redistribuicaoCarteiras.innerHTML=carteiras.length?`<div class="portfolio-heading"><h4>Carteiras de origem</h4><p>Responsáveis principais dos indícios que serão redistribuídos</p></div><div class="portfolio-list">${carteiras.map(x=>`<article><div><strong>${escapeHtml(x.nome_exibicao)}</strong><span>${Number(x.quantidade_elegivel||0)} ${Number(x.quantidade_elegivel||0)===1?"indício":"indícios"}</span></div></article>`).join("")}</div>`:'<div class="scope-empty-state">Nenhuma carteira elegível para o destino selecionado.</div>';
}function renderizarPreviaRedistribuicao(data){
  const r=data.resumo||{},carteiras=(data.responsaveis_atuais||[]).filter(x=>Number(x.quantidade_elegivel||0)>0),bloqueadas=data.bloqueadas||[],novo=data.novo_responsavel||{},localizados=Number(r.quantidade_localizada||0),elegiveis=Number(r.quantidade_elegivel||0),semAlteracao=localizados-elegiveis;
  el.redistribuicaoResumo.innerHTML=[["Localizados",localizados,"neutral"],["Serão redistribuídos",elegiveis,"success"],["Tratamentos internos já iniciados",r.quantidade_tratamento_iniciado||0,"danger"],["Outros impedimentos",r.quantidade_outros_impedimentos||0,"warning"]].map(x=>`<div class="preview-metric ${x[2]}"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join("");
  el.redistribuicaoCarteiras.innerHTML=carteiras.length?`<div class="portfolio-heading"><h4>Carteiras de origem</h4><p>Responsáveis principais dos indícios que serão redistribuídos</p></div><div class="portfolio-list">${carteiras.map(x=>`<article><div><strong>${escapeHtml(x.nome_exibicao)}</strong><span>${Number(x.quantidade_elegivel||0)} ${Number(x.quantidade_elegivel||0)===1?"indício":"indícios"}</span></div></article>`).join("")}</div>`:'<div class="scope-empty-state">Nenhuma carteira elegível encontrada.</div>';
  el.redistribuicaoImpactoDestino.innerHTML=`<div class="impact-metrics"><article><span>Carga atual</span><strong>${Number(novo.carga_atual_principal||0)}</strong></article><article><span>A receber</span><strong>+${Number(novo.quantidade_a_receber||0)}</strong></article><article><span>Carga estimada</span><strong>${Number(novo.carga_estimada_principal||0)}</strong></article></div>`;
  const grupos=Object.entries(bloqueadas.reduce((a,x)=>{a[x.codigo]=(a[x.codigo]||0)+1;return a},{}));
  el.redistribuicaoDetalhes.innerHTML=`<section class="operation-outcome"><strong>${elegiveis} ${elegiveis===1?"indício será redistribuído":"indícios serão redistribuídos"}</strong><span>${semAlteracao} ${semAlteracao===1?"indício permanecerá":"indícios permanecerão"} sem alteração</span></section><section class="review-section"><h4>Transferência</h4>${el.redistribuicaoCarteiras.innerHTML}<div class="transfer-destination"><span>Novo responsável</span><strong>${escapeHtml(novo.nome_exibicao)}</strong><small>${Number(novo.quantidade_a_receber||0)} ${Number(novo.quantidade_a_receber||0)===1?"indício a receber":"indícios a receber"}</small></div></section><section class="review-section"><h4>Configuração</h4><dl class="review-definition-list"><div><dt>Responsáveis anteriores</dt><dd>${el.redistribuicaoManterCheck.checked?"Manter como colaboradores":"Não manter"}</dd></div><div><dt>Prazo dos indícios</dt><dd>${el.redistribuicaoNovoPrazoCheck.checked?formatarData(el.redistribuicaoNovoPrazoInput.value):"Preservar prazos atuais"}</dd></div><div><dt>Prioridade</dt><dd>Preservada</dd></div><div class="full"><dt>Justificativa</dt><dd>${escapeHtml(el.redistribuicaoJustificativa.value)}</dd></div></dl></section>${grupos.length?`<section class="review-section"><h4>Indícios que permanecerão sem alteração</h4><div class="blocked-summary">${grupos.map(([k,n])=>`<span><strong>${n}</strong> ${escapeHtml(rotuloBloqueioRedistribuicao(k))}</span>`).join("")}</div></section>`:""}`;
  el.redistribuicaoConfirmacaoTexto.textContent=`Revisei os dados e confirmo a redistribuição em lote de ${elegiveis} ${elegiveis===1?"indício elegível":"indícios elegíveis"}.`;
  atualizarResumoRedistribuicao();
}
async function revisarRedistribuicao(){try{const p=parametrosRedistribuicao();if(!p.p_id_novo_responsavel)throw Error("Selecione o novo responsável.");if(p.p_criterio==="TIPO_INDICIO"&&!p.p_id_tipo_indicio)throw Error("Selecione o tipo de indício.");if(p.p_criterio==="CPF"&&String(p.p_cpf||"").replace(/\D/g,"").length!==11)throw Error("Informe um CPF com 11 dígitos.");const{data,error}=await sb.rpc("prever_redistribuicao_demandas_v2",p);if(error)throw error;estado.redistribuicao.previa=data;estado.redistribuicao.diagnostico=data;estado.redistribuicao.assinatura=assinaturaRedistribuicao();renderizarPreviaRedistribuicao(data);el.redistribuicaoAviso.textContent=data.pode_confirmar?"Prévia pronta. Somente Ciclos de Tratamento Interno elegíveis serão alterados.":"Nenhum Ciclo de Tratamento Interno está elegível para redistribuição em lote.";el.redistribuicaoAviso.className=`status-banner ${data.pode_confirmar?"success":"warning"}`;el.redistribuicaoAviso.hidden=false;}catch(e){el.redistribuicaoAviso.textContent=mensagemErro(e,e.message||"Não foi possível gerar a prévia.");el.redistribuicaoAviso.className="status-banner error";el.redistribuicaoAviso.hidden=false;}}
async function confirmarRedistribuicao(){try{if(estado.redistribuicao.assinatura!==assinaturaRedistribuicao())throw Error("A configuração mudou. Gere uma nova prévia.");const p=parametrosRedistribuicao(false);if(p.p_justificativa.length<10)throw Error("Informe uma justificativa com pelo menos 10 caracteres.");const{data,error}=await sb.rpc("redistribuir_demandas_lote_v2",p);if(error)throw error;exibirMensagem(data.mensagem||"Redistribuição em lote concluída.",data.codigo_resultado==="REDISTRIBUICAO_EM_LOTE_PARCIAL"?"warning":"success");fecharRedistribuicao();await Promise.all([carregarResumo(),carregarDemandas()]);}catch(e){el.redistribuicaoAviso.textContent=mensagemErro(e,e.message||"Não foi possível confirmar a redistribuição em lote.");el.redistribuicaoAviso.className="status-banner error";el.redistribuicaoAviso.hidden=false;}}


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
  return participante.nome_papel || "Participante do Ciclo de Tratamento Interno";
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
  return `<div class="team-no-cycle-state"><strong>Sem Ciclo de Tratamento Interno</strong><p>A equipe será definida durante a atribuição inicial do indício.</p><small>Nenhuma ação de equipe está disponível antes da abertura do ciclo.</small></div>`;
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
    painelAcoes = '<div class="readonly-callout"><strong>Ciclo de Tratamento Interno em somente leitura</strong><p>A equipe deste ciclo não pode mais ser alterada. As mudanças realizadas permanecem disponíveis no histórico integral.</p></div>';
  } else {
    painelAcoes = `<h3>Ações da equipe</h3><p>Escolha a operação que deseja realizar neste ciclo.</p><div class="team-choice-grid">
      <button class="team-choice" data-team-action="adicionar" type="button"><b>+</b><span><strong>Adicionar colaborador</strong><small>Inclua um operador no ciclo.</small></span></button>
      <button class="team-choice" data-team-action="remover" type="button" ${colaboradores.length ? "" : "disabled"}><b>−</b><span><strong>Remover colaborador</strong><small>${colaboradores.length ? "Exige justificativa." : "Nenhum colaborador ativo."}</small></span></button>
      <button class="team-choice" data-team-action="redistribuir" type="button"><b>⇄</b><span><strong>Trocar ou promover responsável</strong><small>Promova um colaborador ou escolha outro operador.</small></span></button>
    </div><p class="team-audit-note">Todas as alterações serão registradas no Histórico integral. Versão atual do ciclo: <strong>${escapeHtml(ciclo.versao_ciclo || ciclo.versao)}</strong>.</p>`;
  }

  const classeLayout = encerrado ? "team-layout is-readonly-layout" : "team-layout";
  return `<div class="${classeLayout}">
    <section class="team-column"><h3>Participantes do Ciclo de Tratamento Interno</h3>${principalHtml}<h3>Colaboradores ativos</h3><div class="member-cards">${ativosHtml}</div><h3>Histórico da equipe</h3>${resumoHistorico}</section>
    <aside class="team-action-panel">${painelAcoes}</aside>
  </div>`;
}

function rotuloHistoricoGestor(x){const map={CRIACAO_TRATAMENTO:["Criação do acompanhamento do indício","history-system","◆"],ABERTURA_CICLO:["Abertura do Ciclo de Tratamento Interno","history-start","▶"],ATRIBUICAO_PRINCIPAL:["Atribuição do responsável principal","history-manager","●"],ATRIBUICAO_LOTE:["Atribuição em lote","history-manager","●"],INICIO_TRATAMENTO:["Início do tratamento","history-start","▶"],OBSERVACAO:["Registro de observação","history-observation","✎"],PROVIDENCIA:["Registro de providência","history-providence","✓"],VINCULO_PROCESSO_SEI:["Vinculação de processo SEI","history-sei","⌁"],INATIVACAO_PROCESSO_SEI:["Inativação de processo SEI","history-sei","⌁"],ALTERACAO_PROCESSO_SEI_PRINCIPAL:["Alteração do processo SEI principal","history-sei","★"],ENCERRAMENTO_INTERNO:["Conclusão do Ciclo de Tratamento Interno","history-closed","■"],REABERTURA:["Reabertura do Ciclo de Tratamento Interno","history-manager","↻"],CANCELAMENTO:["Cancelamento do Ciclo de Tratamento Interno","history-closed","×"],RETIFICACAO:["Retificação de movimentação","history-manager","↺"],REDISTRIBUICAO:["Redistribuição do responsável principal","history-manager","⇄"],SUBSTITUICAO_PRINCIPAL:["Substituição do responsável principal","history-manager","⇄"],INCLUSAO_COLABORADOR:["Inclusão de colaborador","history-manager","+"],REMOCAO_COLABORADOR:["Remoção de colaborador","history-manager","−"],ALTERACAO_PRIORIDADE:["Alteração da prioridade","history-manager","⚑"],ALTERACAO_PRAZO:["Alteração do prazo","history-manager","▣"],ALTERACAO_PRIORIDADE_PRAZO:["Alteração da prioridade e do prazo","history-manager","⚑"],AGUARDANDO_VALIDACAO_TCU_DETECTADO:["Espera pela validação do TCU detectada","history-system","⚙"],VALIDACAO_TCU_DETECTADA:["Validação do TCU detectada","history-system","⚙"],VALIDACAO_DURANTE_TRATAMENTO:["Validação do TCU detectada durante o tratamento","history-system","⚙"],RETORNO_INDICIO_SNAPSHOT:["Retorno do indício detectado","history-system","⚙"],ESTADO_MISTO_DETECTADO:["Divergência de estados detectada","history-system","⚙"],INDICIO_NAO_LOCALIZADO:["Indício não localizado na atualização atual","history-system","⚙"],DIVERGENCIA_POS_VALIDACAO:["Divergência após validação detectada","history-system","⚙"],SOLICITACAO_DILACAO_PRAZO:["Solicitação de dilação de prazo","history-dilation","⌛"],APROVACAO_DILACAO_PRAZO:["Dilação de prazo aprovada","history-dilation-approved","✓"],APROVACAO_DILACAO_COM_AJUSTE:["Dilação aprovada com ajuste","history-dilation-approved","✓"],REJEICAO_DILACAO_PRAZO:["Solicitação de dilação rejeitada","history-dilation-rejected","×"],CANCELAMENTO_SOLICITACAO_DILACAO:["Solicitação de dilação cancelada","history-dilation-rejected","×"],PERDA_OBJETO_DILACAO_PRAZO:["Solicitação de dilação sem efeito","history-system","⚙"]};return map[x.codigo_movimentacao]||(x.evento_automatico?[x.nome_movimentacao||"Evento automático","history-system","⚙"]:[x.nome_movimentacao||"Movimentação","history-default","•"])}
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
  if (!rows.length) return '<div class="history-empty-state"><div><strong>Nenhuma movimentação registrada neste Ciclo de Tratamento Interno.</strong><p>Se outro ciclo estiver disponível, selecione-o para consultar o histórico correspondente.</p></div></div>';
  const tipos = [...new Map(rows.map(item => { const meta = rotuloHistoricoGestor(item); return [item.codigo_movimentacao || meta[0], meta[0]]; })).entries()].sort((a,b) => a[1].localeCompare(b[1], "pt-BR"));
  return `<div class="history-filters"><div class="field"><label for="historySearchInput">Buscar no histórico</label><input class="control" id="historySearchInput" name="historySearchInput" data-history-search placeholder="Descrição, executor ou processo SEI"></div><div class="field"><label for="historyCategorySelect">Categoria</label><select class="control" id="historyCategorySelect" name="historyCategorySelect" data-history-category><option value="">Todas as categorias</option><option value="HUMANA">Atividade humana</option><option value="ADMINISTRATIVA">Ação administrativa</option><option value="AUTOMATICA">Evento automático</option><option value="ORIGEM">Atualização da origem</option></select></div><div class="field"><label for="historyTypeSelect">Tipo de registro</label><select class="control" id="historyTypeSelect" name="historyTypeSelect" data-history-type><option value="">Todos os tipos</option>${tipos.map(([codigo,nome]) => `<option value="${escapeHtml(codigo)}">${escapeHtml(nome)}</option>`).join("")}</select></div><div class="field"><label for="historyOrderSelect">Ordenação</label><select class="control" id="historyOrderSelect" name="historyOrderSelect" data-history-order><option value="DESC">Mais recentes primeiro</option><option value="ASC">Mais antigos primeiro</option></select></div><div class="field"><label for="historyStartInput">Data inicial</label><input class="control" id="historyStartInput" name="historyStartInput" data-history-start type="date"></div><div class="field"><label for="historyEndInput">Data final</label><input class="control" id="historyEndInput" name="historyEndInput" data-history-end type="date"></div></div><div class="history-summary-line"><strong data-history-count></strong><span>Histórico do Ciclo de Tratamento Interno selecionado</span></div><div class="timeline" data-history-list></div>`;
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
function pdfBiblioteca() {
  const JsPdf = window.jspdf?.jsPDF;
  if (!JsPdf) throw new Error("BIBLIOTECA_PDF_NAO_CARREGADA");
  return JsPdf;
}
function pdfTexto(valor, fallback = "Não informado") {
  const texto = valor === null || valor === undefined || valor === "" ? fallback : String(valor);
  return texto.replace(/[\u2012-\u2015]/g, "-").replace(/\u00a0/g, " ");
}
function pdfCpfMascarado(dados = {}, demanda = {}) {
  const mascara = dados.cpf_mascarado || demanda.cpf_mascarado || "CPF protegido";
  const digitos = String(mascara).replace(/\D/g, "");
  if (digitos.length === 11 && !String(mascara).includes("*")) return `***.${digitos.slice(3,6)}.${digitos.slice(6,9)}-**`;
  return mascara;
}
function pdfNatureza(item) {
  const cat = categoriaHistorico(item);
  return ({HUMANA:"Atividade humana",ADMINISTRATIVA:"Administrativa",AUTOMATICA:"Automática",ORIGEM:"Atualização da origem"})[cat] || "Movimentação";
}
function pdfResumoMovimentacoes(historico = []) {
  const contagem = codigo => historico.filter(x => x.codigo_movimentacao === codigo).length;
  return [
    ["Tratamentos iniciados", contagem("INICIO_TRATAMENTO")],
    ["Observações", contagem("OBSERVACAO")],
    ["Providências", contagem("PROVIDENCIA")],
    ["Processos vinculados", contagem("VINCULO_PROCESSO_SEI")],
    ["Processos inativados", contagem("INATIVACAO_PROCESSO_SEI")],
    ["Redistribuições", contagem("REDISTRIBUICAO") + contagem("SUBSTITUICAO_PRINCIPAL")],
    ["Alterações de prioridade", contagem("ALTERACAO_PRIORIDADE") + contagem("ALTERACAO_PRIORIDADE_PRAZO")],
    ["Alterações de prazo", contagem("ALTERACAO_PRAZO") + contagem("ALTERACAO_PRIORIDADE_PRAZO")],
    ["Conclusões", contagem("ENCERRAMENTO_INTERNO")],
    ["Eventos automáticos", historico.filter(x => x.evento_automatico).length],
    ["Total de movimentações", historico.length]
  ];
}
function criarDocumentoPdfGerencial({dados, demanda, ciclo, historico, equipe, processos}) {
  const JsPdf = pdfBiblioteca();
  const doc = new JsPdf({orientation:"portrait",unit:"mm",format:"a4",compress:true,putOnlyUsedFonts:true});
  doc.setProperties({title:`Relatório do indício ${demanda.identificador_do_indicio || ""}`,subject:"Relatório gerencial do Ciclo de Tratamento Interno",author:"Sistema de Monitoramento de Indícios",creator:"Sistema de Monitoramento de Indícios"});
  const W=210,H=297,M=15,CW=W-M*2,AZUL=[21,94,239],ESCURO=[23,32,51],CINZA=[102,112,133],LINHA=[208,213,221],FUNDO=[248,250,252];
  let y=18, pagina=1, secao=0;
  const setBody=()=>{doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(...ESCURO)};
  const rodape=()=>{doc.setDrawColor(...LINHA);doc.line(M,H-13,W-M,H-13);doc.setFont("helvetica","normal");doc.setFontSize(7.2);doc.setTextColor(...CINZA);doc.text("Sistema de Monitoramento de Indícios",M,H-8);doc.text(`Página ${pagina}`,W-M,H-8,{align:"right"});};
  const cabecalhoContinuacao=()=>{doc.setFont("helvetica","bold");doc.setFontSize(8);doc.setTextColor(...AZUL);doc.text(`INDÍCIO ${pdfTexto(demanda.identificador_do_indicio)}`,M,10);doc.setTextColor(...CINZA);doc.text(`Ciclo de Tratamento Interno ${pdfTexto(ciclo.numero_ciclo,"não informado")}`,W-M,10,{align:"right"});doc.setDrawColor(...LINHA);doc.line(M,13,W-M,13);};
  const novaPagina=()=>{rodape();doc.addPage();pagina++;y=19;cabecalhoContinuacao();setBody();};
  const garantir=altura=>{if(y+altura>H-18)novaPagina();};
  const linhas=(texto,largura=CW)=>doc.splitTextToSize(pdfTexto(texto),largura);
  const blocoTexto=(texto,opts={})=>{const fs=opts.size||9,lh=opts.lineHeight||4.3,ls=linhas(texto,opts.width||CW);garantir(ls.length*lh+(opts.after||0));doc.setFont("helvetica",opts.bold?"bold":"normal");doc.setFontSize(fs);doc.setTextColor(...(opts.color||ESCURO));doc.text(ls,opts.x||M,y);y+=ls.length*lh+(opts.after||0);setBody();};
  const tituloSecao=t=>{secao++;garantir(12);y+=2;doc.setFillColor(...AZUL);doc.roundedRect(M,y-4,5,5,1,1,"F");doc.setFont("helvetica","bold");doc.setFontSize(12);doc.setTextColor(...ESCURO);doc.text(`${secao}. ${t}`,M+8,y);doc.setDrawColor(...LINHA);doc.line(M+8,y+2,W-M,y+2);y+=8;setBody();};
  const campos=(itens,colunas=2)=>{const gap=4,w=(CW-gap*(colunas-1))/colunas;for(let i=0;i<itens.length;i+=colunas){const row=itens.slice(i,i+colunas);const heights=row.map(([,v])=>Math.max(16,9+linhas(v,w-8).length*4));const ht=Math.max(...heights);garantir(ht+4);row.forEach(([l,v],k)=>{const x=M+k*(w+gap);doc.setFillColor(...FUNDO);doc.setDrawColor(...LINHA);doc.roundedRect(x,y,w,ht,2,2,"FD");doc.setFont("helvetica","bold");doc.setFontSize(7);doc.setTextColor(...CINZA);doc.text(pdfTexto(l).toUpperCase(),x+4,y+5);doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(...ESCURO);doc.text(linhas(v,w-8),x+4,y+10);});y+=ht+4;}setBody();};
  const cartao=(titulo,subtitulo,descricao,meta="")=>{const desc=linhas(descricao,CW-12),ht=Math.max(22,15+desc.length*4+(meta?4:0));garantir(ht+3);doc.setFillColor(255,255,255);doc.setDrawColor(...LINHA);doc.roundedRect(M,y,CW,ht,2,2,"FD");doc.setFillColor(...AZUL);doc.rect(M,y,2,ht,"F");doc.setFont("helvetica","bold");doc.setFontSize(9.5);doc.setTextColor(...ESCURO);doc.text(pdfTexto(titulo),M+6,y+6);doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.setTextColor(...CINZA);doc.text(pdfTexto(subtitulo),W-M-5,y+6,{align:"right"});doc.setFontSize(8.5);doc.setTextColor(...ESCURO);doc.text(desc,M+6,y+12);if(meta){doc.setFontSize(7.3);doc.setTextColor(...CINZA);doc.text(pdfTexto(meta),M+6,y+ht-4);}y+=ht+3;setBody();};
  // Cover/header
  doc.setFillColor(...AZUL);doc.rect(0,0,W,43,"F");doc.setFont("helvetica","bold");doc.setTextColor(255,255,255);doc.setFontSize(8);doc.text("SISTEMA DE MONITORAMENTO DE INDÍCIOS",M,13);doc.setFontSize(18);doc.text("Relatório detalhado do indício",M,24);doc.setFont("helvetica","normal");doc.setFontSize(9);doc.text("Informações operacionais, administrativas e automáticas para consulta e auditoria",M,31);doc.setFontSize(8);doc.text(`Indício ${pdfTexto(demanda.identificador_do_indicio)}  |  Ciclo de Tratamento Interno ${pdfTexto(ciclo.numero_ciclo,"não informado")}`,M,38);y=51;setBody();
  tituloSecao("Identificação do indício");
  campos([["Número do indício",dados.identificador_do_indicio||demanda.identificador_do_indicio],["Base de dados",dados.base_de_dados||demanda.base_de_dados],["Tipo de indício",dados.tipo_indicio||demanda.tipo_indicio],["Situação atual",ciclo.nome_status_ciclo||rotuloSituacao(demanda.situacao_operacional)]],2);
  blocoTexto("Descrição do indício",{bold:true,size:8,color:CINZA,after:2});blocoTexto(dados.descricao_indicio||"Descrição não informada.",{after:3});
  tituloSecao("Identificação da pessoa");
  campos([["Nome atual",dados.nome_atual||demanda.nome_atual],["CPF",pdfCpfMascarado(dados,demanda)],["Situação funcional",dados.situacoes_funcionais_resumo||demanda.situacoes_funcionais_resumo||"Sem situação funcional registrada"],["Quantidade de vínculos",String((dados.origens||demanda.origens||[]).length||"Não informado")]],2);
  tituloSecao("Vínculos funcionais");
  const vinculos=dados.origens||demanda.origens||[];
  if(vinculos.length)vinculos.forEach((v,i)=>cartao(v.situacao_funcional||`Vínculo ${i+1}`,v.orgao||v.organizacao||"Origem funcional",[v.matricula&&`Matrícula: ${v.matricula}`,v.nome_upag&&`UPAG: ${v.nome_upag}`].filter(Boolean).join("  |  ")||"Sem informações adicionais."));else blocoTexto("Sem situação funcional registrada.",{after:3});
  tituloSecao("Ciclo de Tratamento Interno");
  const eq=normalizarEquipeDoCiclo({...dados,ciclo_selecionado:ciclo},demanda);
  campos([["Número do ciclo",ciclo.numero_ciclo],["Situação do ciclo",ciclo.nome_status_ciclo||rotuloSituacao(ciclo.codigo_status_ciclo)],["Prioridade",ciclo.nome_prioridade||demanda.nome_prioridade],["Prazo",ciclo.prazo_em?formatarDataHora(ciclo.prazo_em):"Sem prazo definido"],["Modo de trabalho",eq.nomeModo],["Responsável principal",eq.principal.nome_exibicao||demanda.nome_operador_principal],["Aberto em",formatarDataHora(ciclo.aberto_em)],["Iniciado em",ciclo.iniciado_em?formatarDataHora(ciclo.iniciado_em):"Ainda não iniciado"],["Concluído em",ciclo.encerrado_em?formatarDataHora(ciclo.encerrado_em):"Não concluído"],["Tempo de tratamento",duracaoCiclo(ciclo)]],2);
  tituloSecao("Resultado do tratamento");blocoTexto(ciclo.resultado_encerramento||"Resultado ainda não registrado.",{after:2});if(ciclo.encerrado_em)blocoTexto(`Conclusão registrada em ${formatarDataHora(ciclo.encerrado_em)}.`,{size:8,color:CINZA,after:3});
  tituloSecao("Processos SEI");
  const ativos=processos.filter(x=>x.processo_ativo!==false),inativos=processos.filter(x=>x.processo_ativo===false);
  blocoTexto(`Processos ativos (${ativos.length})`,{bold:true,size:9,after:2});if(ativos.length)ativos.forEach(x=>cartao(x.numero_processo,x.processo_principal?"Principal · Ativo":"Adicional · Ativo",x.assunto||"Assunto não informado",x.observacao||""));else blocoTexto("Nenhum processo ativo.",{after:3});
  blocoTexto(`Processos inativados (${inativos.length})`,{bold:true,size:9,after:2});if(inativos.length)inativos.forEach(x=>cartao(x.numero_processo,"Inativo",x.assunto||"Assunto não informado",x.observacao||""));else blocoTexto("Nenhum processo inativado.",{after:3});
  tituloSecao("Equipe do Ciclo de Tratamento Interno");
  if(equipe.length)equipe.forEach(x=>cartao(x.nome_exibicao||x.nome,papelParticipante(normalizarParticipante(x)),`Participação ${x.participacao_ativa===false?"histórica":"ativa"}.`,periodoParticipacao(x)));else blocoTexto("Nenhum participante informado.",{after:3});
  tituloSecao("Resumo das movimentações");campos(pdfResumoMovimentacoes(historico).map(([a,b])=>[a,String(b)]),3);
  tituloSecao("Histórico integral");
  if(historico.length)historico.forEach(x=>{const m=rotuloHistoricoGestor(x);const executor=x.nome_executor||x.executor?.nome_exibicao||x.email_executor||"Sistema";cartao(m[0],`${formatarDataHora(x.realizada_em)} · ${pdfNatureza(x)}`,descricaoHistoricoGestor(x,m[0]),`Executada por: ${executor}`);});else blocoTexto("Nenhuma movimentação registrada.",{after:3});
  tituloSecao("Informações da emissão");
  campos([["Emitido por",estado.contexto?.nome_exibicao||estado.contexto?.email_institucional||"Usuário autenticado"],["Perfil",estado.contexto?.nome_perfil||estado.contexto?.codigo_perfil||"Gestor"],["Data e hora",formatarDataHora(new Date())],["Escopo","Histórico integral do Ciclo de Tratamento Interno selecionado"]],2);
  blocoTexto("Este relatório apoia a consulta e a auditoria e não substitui os documentos e autos existentes no processo SEI.",{size:7.5,color:CINZA,after:2});
  rodape();
  return doc;
}
async function exportarRelatorioGestor() {
  const dados=estado.detalhe.dados,demanda=estado.detalhe.demanda;if(!dados||!demanda)return;
  const ciclo=dados.ciclo_selecionado||estado.detalhe.cicloSelecionado||dados;
  const equipe=ciclo.equipe||dados.equipe||[];
  const processos=dados.processos_sei||dados.processos||[];
  const historico=estado.detalhe.historico||[];
  const botoes=[el.exportarRelatorioGestorBtn,el.painelRelatorioGestor.querySelector("[data-export-report]")].filter(Boolean);
  try {
    botoes.forEach(b=>{b.disabled=true;b.dataset.textoOriginal=b.textContent;b.textContent="Gerando PDF..."});
    const doc=criarDocumentoPdfGerencial({dados,demanda,ciclo,historico,equipe,processos});
    const data=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Fortaleza",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
    doc.save(`relatorio_indicio_${demanda.identificador_do_indicio||demanda.id_indicio}_ciclo_${ciclo.numero_ciclo||"historico"}_${data}.pdf`);
    exibirMensagem("Relatório em PDF gerado com texto pesquisável e CPF mascarado.","success");
  } catch(error) {
    console.error(error);
    exibirMensagem(error.message==="BIBLIOTECA_PDF_NAO_CARREGADA"?"Não foi possível carregar o gerador de PDF. Verifique a conexão e tente novamente.":"Não foi possível gerar o relatório em PDF.","error");
  } finally {botoes.forEach(b=>{b.disabled=false;b.textContent=b.dataset.textoOriginal||"Gerar relatório em PDF"})}
}
async function exportarHistoricoConcluidasPdf() {
  if(!estado.concluidas.itens.length){exibirMensagem("Nenhum indício concluído está disponível para o relatório.","warning");return;}
  const JsPdf=pdfBiblioteca(),doc=new JsPdf({unit:"mm",format:"a4",orientation:"landscape",compress:true,putOnlyUsedFonts:true});
  const M=12,W=297,H=210,CW=W-M*2;let y=18,pagina=1;
  const rodape=()=>{doc.setFont("helvetica","normal");doc.setFontSize(7);doc.setTextColor(102,112,133);doc.text("Sistema de Monitoramento de Indícios",M,H-7);doc.text(`Página ${pagina}`,W-M,H-7,{align:"right"});};
  const nova=()=>{rodape();doc.addPage();pagina++;y=17;cabecalho()};
  const cabecalho=()=>{doc.setFont("helvetica","bold");doc.setTextColor(21,94,239);doc.setFontSize(15);doc.text("Relatório do histórico de indícios concluídos",M,y);y+=7;doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(102,112,133);doc.text(`Registros da página atual · Gerado em ${formatarDataHora(new Date())}`,M,y);y+=7;};
  cabecalho();
  const cols=[18,30,54,30,38,28,32,28],headers=["Indício","Ciclo","Pessoa","Situação final","Responsável","Processo SEI","Concluído em","Duração"];
  const header=()=>{doc.setFillColor(21,94,239);doc.rect(M,y,CW,8,"F");let x=M;headers.forEach((t,i)=>{doc.setFont("helvetica","bold");doc.setFontSize(7);doc.setTextColor(255,255,255);doc.text(t,x+2,y+5);x+=cols[i]});y+=8;};header();
  estado.concluidas.itens.forEach(item=>{const vals=[item.identificador_do_indicio,item.numero_ciclo,item.nome_atual,item.nome_status_ciclo,item.nome_operador_principal||"Não informado",item.processo_sei_principal||"Não vinculado",formatarDataHora(item.encerrado_em),duracaoCiclo(item)];const wraps=vals.map((v,i)=>doc.splitTextToSize(pdfTexto(v),cols[i]-4));const ht=Math.max(9,...wraps.map(a=>a.length*3.5+3));if(y+ht>H-15){nova();header()}doc.setDrawColor(208,213,221);doc.setFillColor(248,250,252);doc.rect(M,y,CW,ht,"FD");let x=M;wraps.forEach((ls,i)=>{doc.setFont("helvetica","normal");doc.setFontSize(7);doc.setTextColor(23,32,51);doc.text(ls,x+2,y+4);x+=cols[i]});y+=ht;});
  rodape();const data=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Fortaleza",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());doc.save(`historico_indicios_concluidos_pagina_${data}.pdf`);
}
function preencherSeletoresTipos(){const op=estado.tiposIndicio.map(t=>`<option value="${t.id}">${escapeHtml(t.nome)}</option>`).join("");el.loteTipoSelect.innerHTML='<option value="">Selecione um tipo</option>'+op;el.redistribuicaoTipoSelect.innerHTML='<option value="">Selecione um tipo</option>'+op;}
function listaSelecionadasHtml(expandida=false){const itens=[...estado.selecionadas.values()],visiveis=expandida?itens:itens.slice(0,3);if(!itens.length)return '<div class="scope-empty-state">Nenhum indício selecionado.</div>';return `<div class="compact-indication-list">${visiveis.map(d=>`<article><strong>${escapeHtml(d.identificador_do_indicio)}</strong><span>${escapeHtml(d.nome_atual)}</span><small>${escapeHtml(d.tipo_indicio)}</small></article>`).join("")}</div>${!expandida&&itens.length>3?`<p class="more-selected">+${itens.length-3} ${itens.length-3===1?"indício adicional":"indícios adicionais"}</p>`:""}`;}
function atualizarSelecionadasLote(){
  const n=estado.selecionadas.size;
  el.scopeSelectedCount.textContent=n?`${n} ${n===1?"indício selecionado":"indícios selecionados"}.`:"Nenhum indício selecionado.";
  el.loteQuantidade.textContent=n||"";
  el.loteQuantidadeRotulo.textContent=n?(n===1?"indício selecionado":"indícios selecionados"):"Nenhum indício selecionado";
  el.loteSelecionadasLista.innerHTML=listaSelecionadasHtml(estado.lote.selecionadasExpandidas);
  el.loteAlternarSelecionadasBtn.hidden=n<=3;
  el.loteAlternarSelecionadasBtn.textContent=estado.lote.selecionadasExpandidas?"Recolher lista":"Ver todos";
}
function renderizarContextoEscopoAtribuicao(revisao=false){const e=estado.lote.escopo;if(e==="selecionadas")return `<div class="scope-review-copy"><strong>${estado.selecionadas.size} ${estado.selecionadas.size===1?"indício selecionado":"indícios selecionados"}</strong>${listaSelecionadasHtml(false)}</div>`;if(e==="tipo")return `<div class="scope-review-copy"><span>Por tipo de indício</span><strong>${escapeHtml(el.loteTipoSelect.selectedOptions[0]?.textContent||"Não selecionado")}</strong></div>`;if(e==="cpf")return `<div class="scope-review-copy"><span>Por CPF</span><strong>${escapeHtml(mascararCpf(el.loteCpfInput.value))}</strong></div>`;return '<span>Escopo não definido</span>';}
function mascararCpf(v){const n=String(v||"").replace(/\D/g,"");return n.length===11?`***.${n.slice(3,6)}.${n.slice(6,9)}-**`:"CPF não informado";}
function atualizarContextoLote(){const etapa=estado.lote.etapa;el.loteEscopoContexto.hidden=etapa===1||!estado.lote.escopo;if(el.loteEscopoContexto.hidden)return;el.loteEscopoContextoTitulo.textContent=nomeCriterioLote();el.loteEscopoContextoDetalhe.innerHTML=renderizarContextoEscopoAtribuicao();}
function rotuloBloqueioRedistribuicao(c){return ({TRATAMENTO_JA_INICIADO:"Ciclo de Tratamento Interno já iniciado",DEMANDA_SEM_CICLO_ATIVO:"Ainda não atribuído",CICLO_CONCLUIDO:"Ciclo de Tratamento Interno concluído",DEMANDA_NAO_ESTA_PENDENTE_DE_TRATAMENTO:"Não está pendente de início",CICLO_NAO_PERMITE_MOVIMENTACAO:"Ciclo de Tratamento Interno sem permissão de alteração",CICLO_SEM_PRINCIPAL_ATIVO:"Ciclo de Tratamento Interno sem responsável principal",NOVO_RESPONSAVEL_JA_E_PRINCIPAL:"Já pertence ao novo responsável",LIMITE_DO_LOTE_EXCEDIDO:"Fora do limite desta operação"})[c]||c||"Impedimento";}
function nomeCriterioLote() { return ({ selecionadas:"Indícios selecionados", tipo:"Por tipo de indício", cpf:"Por CPF" })[estado.lote.criterio] || "Não definido"; }
function selecionarEscopoAtribuicao(escopo) {
  const mudou=estado.lote.escopo&&estado.lote.escopo!==escopo;
  if(mudou){if(escopo!=="tipo")el.loteTipoSelect.value="";if(escopo!=="cpf")el.loteCpfInput.value="";}
  estado.lote.criterio=escopo;estado.lote.escopo=escopo;invalidarPreviaLote();
  document.querySelectorAll("[data-assignment-scope]").forEach(b=>{const ativo=b.dataset.assignmentScope===escopo;b.classList.toggle("active",ativo);b.setAttribute("aria-checked",String(ativo));});
  document.querySelectorAll(".scope-source-panel").forEach(x=>x.hidden=true);
  const alvo=escopo==="selecionadas"?el.loteEtapaSelecionadas:escopo==="tipo"?el.loteEtapaTipo:el.loteEtapaCpf;
  const slot=document.querySelector("[data-assignment-scope-slot]");slot.innerHTML="";alvo.hidden=false;slot.appendChild(alvo);atualizarSelecionadasLote();preencherResumoAtribuicao();limparAvisoOperacao(el.loteAviso);
}
function selecionarEscopoRedistribuicao(escopo){if(!["cpf","tipo"].includes(escopo))return;const mudou=estado.redistribuicao.escopo&&estado.redistribuicao.escopo!==escopo;if(mudou){el.redistribuicaoTipoSelect.value="";el.redistribuicaoCpfInput.value="";}estado.redistribuicao.escopo=escopo;estado.redistribuicao.criterio=escopo;estado.redistribuicao.previa=null;estado.redistribuicao.assinatura=null;estado.redistribuicao.diagnostico=null;document.querySelectorAll("[data-redistribution-scope]").forEach(b=>{const ativo=b.dataset.redistributionScope===escopo;b.classList.toggle("active",ativo);b.setAttribute("aria-checked",String(ativo));});document.querySelectorAll("[data-red-scope-field]").forEach(x=>x.hidden=x.dataset.redScopeField!==escopo);document.querySelector("[data-red-scope-empty]").hidden=true;atualizarResumoRedistribuicao();limparAvisoOperacao(el.redistribuicaoAviso);}
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
function mostrarEtapaLote(etapa){limparAvisoOperacao(el.loteAviso);estado.lote.etapa=Math.max(1,Math.min(5,etapa));document.querySelectorAll("[data-lote-panel]").forEach(x=>x.hidden=Number(x.dataset.lotePanel)!==estado.lote.etapa);if(estado.lote.etapa===1){const ativo=estado.lote.escopo==="selecionadas"?el.loteEtapaSelecionadas:estado.lote.escopo==="tipo"?el.loteEtapaTipo:estado.lote.escopo==="cpf"?el.loteEtapaCpf:null;document.querySelectorAll(".scope-source-panel").forEach(x=>x.hidden=x!==ativo);}document.querySelectorAll("[data-lote-step]").forEach(x=>{const n=Number(x.dataset.loteStep);x.classList.toggle("active",n===estado.lote.etapa);x.classList.toggle("complete",n<estado.lote.etapa);x.disabled=n>estado.lote.etapa;x.setAttribute("aria-current",n===estado.lote.etapa?"step":"false");});el.voltarLoteBtn.hidden=estado.lote.etapa===1;el.revisarLoteBtn.hidden=estado.lote.etapa===5;el.revisarLoteBtn.textContent=estado.lote.etapa===4?"Continuar para revisão":"Continuar";el.confirmarLoteBtn.hidden=estado.lote.etapa!==5;el.confirmarLoteBtn.disabled=!estado.lote.previa?.pode_confirmar||!el.loteConfirmacaoCheck.checked;atualizarContextoLote();preencherResumoAtribuicao();const corpo=el.loteOverlay.querySelector(".wizard-layout");if(corpo)corpo.scrollTop=0;document.querySelector(`[data-lote-panel="${estado.lote.etapa}"] h3`)?.focus?.();}
function validarEtapaLote(etapa){const p=parametrosLote();if(etapa===1){if(!estado.lote.escopo)throw Error("Selecione o escopo da atribuição.");if(p.p_criterio==="SELECIONADAS"&&!p.p_ids_indicios?.length)throw Error("Selecione ao menos um indício.");if(p.p_criterio==="TIPO_INDICIO"&&!p.p_id_tipo_indicio)throw Error("Selecione um tipo de indício.");if(p.p_criterio==="CPF"&&String(p.p_cpf||"").replace(/\D/g,"").length!==11)throw Error("Informe um CPF com 11 dígitos.");}if(etapa===2){if(!p.p_id_usuario_operador)throw Error("Selecione o responsável principal.");if(p.p_codigo_modo==="COLABORATIVO"&&!p.p_ids_usuarios_colaboradores?.length)throw Error("Selecione ao menos um colaborador.");}if(etapa===3&&el.lotePrazoCheck.checked&&!el.lotePrazoInput.value)throw Error("Informe a data limite.");if(etapa===4&&el.loteVincularSei.checked&&!el.loteSeiNumero.value.trim())throw Error("Informe o número do processo SEI.");}
async function avancarLote(){try{validarEtapaLote(estado.lote.etapa);if(estado.lote.etapa===4){await gerarPreviaLote();if(estado.lote.previa?.pode_confirmar)mostrarEtapaLote(5);return;}mostrarEtapaLote(estado.lote.etapa+1);}catch(e){el.loteAviso.textContent=e.message;el.loteAviso.className="status-banner error";}}
async function gerarPreviaLote(){return revisarLote();}
function mostrarEtapaRedistribuicao(etapa){
  limparAvisoOperacao(el.redistribuicaoAviso);estado.redistribuicao.etapa=Math.max(1,Math.min(4,etapa));
  document.querySelectorAll("[data-red-panel]").forEach(x=>x.hidden=Number(x.dataset.redPanel)!==estado.redistribuicao.etapa);
  document.querySelectorAll("[data-red-step]").forEach(x=>{const n=Number(x.dataset.redStep);x.classList.toggle("active",n===estado.redistribuicao.etapa);x.classList.toggle("complete",n<estado.redistribuicao.etapa);x.disabled=n>estado.redistribuicao.etapa;x.setAttribute("aria-current",n===estado.redistribuicao.etapa?"step":"false");});
  el.redistribuicaoEscopoContexto.hidden=estado.redistribuicao.etapa===1||!estado.redistribuicao.escopo;
  if(!el.redistribuicaoEscopoContexto.hidden){el.redistribuicaoEscopoContextoTitulo.textContent=estado.redistribuicao.escopo==="tipo"?"Por tipo de indício":"Por CPF";el.redistribuicaoEscopoContextoDetalhe.textContent=estado.redistribuicao.escopo==="tipo"?(el.redistribuicaoTipoSelect.selectedOptions[0]?.textContent||""):mascararCpf(el.redistribuicaoCpfInput.value);}
  el.voltarRedistribuicaoBtn.hidden=estado.redistribuicao.etapa===1;
  el.revisarRedistribuicaoBtn.hidden=estado.redistribuicao.etapa===4;
  el.revisarRedistribuicaoBtn.textContent=estado.redistribuicao.etapa===3?"Revisar operação":"Continuar";
  el.confirmarRedistribuicaoBtn.hidden=estado.redistribuicao.etapa!==4;
  el.confirmarRedistribuicaoBtn.disabled=!estado.redistribuicao.previa?.pode_confirmar||!el.redistribuicaoConfirmacaoCheck.checked;
  atualizarResumoRedistribuicao();
  const corpo=el.redistribuicaoOverlay.querySelector('.wizard-layout');if(corpo)corpo.scrollTop=0;
}
function atualizarResumoRedistribuicao(){const etapa=estado.redistribuicao.etapa,data=estado.redistribuicao.previa||{},r=data.resumo||{},novo=data.novo_responsavel||estado.operadores.find(x=>String(x.id_usuario)===el.redistribuicaoNovoSelect.value)||{};const itens=[`<div><dt>Escopo</dt><dd>${estado.redistribuicao.escopo==="tipo"?"Por tipo de indício":estado.redistribuicao.escopo==="cpf"?"Por CPF":"Não selecionado"}</dd></div>`];if(estado.redistribuicao.escopo==="tipo"&&el.redistribuicaoTipoSelect.value)itens.push(`<div><dt>Tipo</dt><dd>${escapeHtml(el.redistribuicaoTipoSelect.selectedOptions[0]?.textContent)}</dd></div>`);if(estado.redistribuicao.escopo==="cpf"&&el.redistribuicaoCpfInput.value)itens.push(`<div><dt>CPF</dt><dd>${mascararCpf(el.redistribuicaoCpfInput.value)}</dd></div>`);if(data.resumo)itens.push(`<div><dt>Elegíveis</dt><dd class="summary-success">${Number(r.quantidade_elegivel||0)} ${Number(r.quantidade_elegivel||0)===1?"indício":"indícios"}</dd></div>`,`<div><dt>Carteiras elegíveis</dt><dd>${(data.responsaveis_atuais||[]).filter(x=>Number(x.quantidade_elegivel)>0).length}</dd></div>`);if(etapa>=2)itens.push(`<div><dt>Novo responsável</dt><dd>${escapeHtml(novo.nome_exibicao||"Não selecionado")}</dd></div>`,`<div><dt>Quantidade a receber</dt><dd>${Number(novo.quantidade_a_receber||0)} ${Number(novo.quantidade_a_receber||0)===1?"indício":"indícios"}</dd></div>`,`<div><dt>Colaboração após a troca</dt><dd>${el.redistribuicaoManterCheck.checked?"Manter anteriores":"Não manter"}</dd></div>`);if(etapa>=3)itens.push(`<div><dt>Justificativa</dt><dd>${el.redistribuicaoJustificativa.value.trim().length>=10?"Informada":"Pendente"}</dd></div>`,`<div><dt>Prazo</dt><dd>${el.redistribuicaoNovoPrazoCheck.checked?formatarData(el.redistribuicaoNovoPrazoInput.value):"Preservar prazos atuais"}</dd></div>`);el.resumoAssistenteRedistribuicao.innerHTML=`<dl class="wizard-summary-list">${itens.join("")}</dl>`;}
function validarEtapaRedistribuicao(etapa){const p=parametrosRedistribuicao();if(etapa===1){if(!estado.redistribuicao.escopo)throw Error("Selecione o escopo da redistribuição em lote.");if(p.p_criterio==="TIPO_INDICIO"&&!p.p_id_tipo_indicio)throw Error("Selecione o tipo de indício.");if(p.p_criterio==="CPF"&&String(p.p_cpf||"").replace(/\D/g,"").length!==11)throw Error("Informe um CPF com 11 dígitos.");}if(etapa===2&&!p.p_id_novo_responsavel)throw Error("Selecione o novo responsável principal.");if(etapa===3){if(el.redistribuicaoJustificativa.value.trim().length<10)throw Error("Informe uma justificativa com pelo menos 10 caracteres.");if(el.redistribuicaoNovoPrazoCheck.checked&&!el.redistribuicaoNovoPrazoInput.value)throw Error("Informe a nova data limite.");}}
async function avancarRedistribuicao(){
  try{
    validarEtapaRedistribuicao(estado.redistribuicao.etapa);
    if(estado.redistribuicao.etapa===1){await diagnosticarEscopoRedistribuicao();mostrarEtapaRedistribuicao(2);return;}
    if(estado.redistribuicao.etapa===3){await revisarRedistribuicao();if(estado.redistribuicao.previa?.pode_confirmar)mostrarEtapaRedistribuicao(4);return;}
    mostrarEtapaRedistribuicao(estado.redistribuicao.etapa+1);
  }catch(e){el.redistribuicaoAviso.textContent=e.message;el.redistribuicaoAviso.className="status-banner error";el.redistribuicaoAviso.hidden=false;}
}
function registrarEventos() {
  el.loteAlternarSelecionadasBtn.addEventListener("click",()=>{estado.lote.selecionadasExpandidas=!estado.lote.selecionadasExpandidas;atualizarSelecionadasLote();});
  el.alterarEscopoLoteBtn.addEventListener("click",()=>mostrarEtapaLote(1));
  el.alterarEscopoRedistribuicaoBtn.addEventListener("click",()=>mostrarEtapaRedistribuicao(1));
  atualizarCardAtivo("DISPONIVEL_PARA_ATRIBUICAO");
  el.redistribuirDemandasBtn.addEventListener("click",abrirRedistribuicao);
  el.redistribuirPorTipoBtn.addEventListener("click",()=>{abrirRedistribuicao();selecionarEscopoRedistribuicao("tipo");});
  el.redistribuirPorCpfBtn.addEventListener("click",()=>{abrirRedistribuicao();selecionarEscopoRedistribuicao("cpf");});
  el.gerenciarEquipeBtn.addEventListener("click",()=>switchDetailTab("equipe"));
  el.exportarRelatorioGestorBtn.addEventListener("click",exportarRelatorioGestor);
  el.painelRelatorioGestor.addEventListener("click",e=>{if(e.target.closest("[data-export-report]"))exportarRelatorioGestor()});
  el.alternarCpfModalBtn.addEventListener("click", alternarCpfDetalhe);
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
  el.redistribuicaoNovoSelect.addEventListener("change",async()=>{estado.redistribuicao.previa=null;estado.redistribuicao.assinatura=null;if(!el.redistribuicaoNovoSelect.value){el.redistribuicaoImpactoDestino.innerHTML='<div class="impact-placeholder">Selecione o destino para calcular o impacto.</div>';atualizarResumoRedistribuicao();return;}el.redistribuicaoImpactoDestino.innerHTML='<div class="impact-placeholder">Calculando impacto...</div>';try{const{data,error}=await sb.rpc("prever_redistribuicao_demandas_v2",parametrosRedistribuicao());if(error)throw error;estado.redistribuicao.previa=data;estado.redistribuicao.assinatura=assinaturaRedistribuicao();renderizarImpactoDestinoRedistribuicao(data);atualizarResumoRedistribuicao();}catch(e){el.redistribuicaoImpactoDestino.innerHTML='<div class="impact-placeholder error">Não foi possível calcular o impacto para o destino selecionado.</div>';el.redistribuicaoAviso.textContent=mensagemErro(e,"Não foi possível calcular o impacto da redistribuição.");el.redistribuicaoAviso.className="status-banner error";el.redistribuicaoAviso.hidden=false;}});
  el.fecharRedistribuicaoBtn.addEventListener("click",fecharRedistribuicao); el.cancelarRedistribuicaoBtn.addEventListener("click",fecharRedistribuicao);
  el.redistribuicaoOverlay.addEventListener("click",e=>{if(e.target===el.redistribuicaoOverlay)fecharRedistribuicao();});
  el.revisarRedistribuicaoBtn.addEventListener("click",avancarRedistribuicao); el.voltarRedistribuicaoBtn.addEventListener("click",()=>mostrarEtapaRedistribuicao(estado.redistribuicao.etapa-1)); el.redistribuicaoConfirmacaoCheck.addEventListener("change",()=>{el.confirmarRedistribuicaoBtn.disabled=!estado.redistribuicao.previa?.pode_confirmar||!el.redistribuicaoConfirmacaoCheck.checked;}); el.confirmarRedistribuicaoBtn.addEventListener("click",confirmarRedistribuicao);
  [el.redistribuicaoTipoSelect,el.redistribuicaoCpfInput,el.redistribuicaoNovoSelect,el.redistribuicaoManterCheck].forEach(x=>x.addEventListener("change",()=>{estado.redistribuicao.previa=null;estado.redistribuicao.assinatura=null;el.redistribuicaoPrevia.hidden=true;el.confirmarRedistribuicaoBtn.disabled=true;}));

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
    const config = e.target.closest("[data-alterar-configuracao-ciclo]"); if (config) { abrirConfiguracaoCiclo(); return; }
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
    atualizarBlocoConfiguracaoCiclo();
    el.painelDetalhesGestor.querySelectorAll("[data-ciclo-selecionar]").forEach(item => {
      const ativo = item === botao;
      item.classList.toggle("active", ativo);
      item.setAttribute("aria-pressed", String(ativo));
    });
  });

  el.fecharConfiguracaoCicloBtn.addEventListener("click", fecharConfiguracaoCiclo); el.cancelarConfiguracaoCicloBtn.addEventListener("click", fecharConfiguracaoCiclo); el.configuracaoCicloOverlay.addEventListener("click", e => { if (e.target === el.configuracaoCicloOverlay) fecharConfiguracaoCiclo(); });
  document.querySelectorAll('input[name="configuracaoPrazoModo"]').forEach(r => r.addEventListener("change", () => { el.configuracaoPrazoField.hidden = modoPrazoConfiguracao() !== "DEFINIR"; limparAvisoConfiguracao(); }));
  el.revisarConfiguracaoCicloBtn.addEventListener("click", revisarConfiguracaoCiclo); el.voltarConfiguracaoCicloBtn.addEventListener("click", () => mostrarEtapaConfiguracao(1)); el.configuracaoCicloConfirmacao.addEventListener("change", () => { el.confirmarConfiguracaoCicloBtn.disabled = !el.configuracaoCicloConfirmacao.checked; }); el.confirmarConfiguracaoCicloBtn.addEventListener("click", confirmarConfiguracaoCiclo);
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
  ALTERACAO_PRAZO: "Prazos alterados",
  ALTERACAO_PRIORIDADE_PRAZO: "Prioridades e prazos alterados"
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
    alvo.insertAdjacentHTML("beforeend", `<p class="chart-footnote"><strong>${Number(naoAplicavel.quantidade || 0)}</strong> indício(s) sem prazo aplicável foram retiradas das barras para preservar a leitura do risco.</p>`);
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
      <article><span>Carteira média</span><strong>${media.toFixed(1)}</strong><small>Indícios principais por operador</small></article>
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
    <p class="chart-footnote">O estoque total possui <strong>${Number(totalEstoque || 0)}</strong> indício(s). A lista destaca apenas a carteira já distribuída entre operadores.</p>`;
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
      { titulo: "Cobertura de atribuição", valor: formatarPercentual(cobertura), detalhe: `${atribuidas} de ${total} indício(s) com responsável`, tom: cobertura < 80 ? "danger" : "success" },
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
    <article><h3>Resumo do Ciclo de Tratamento Interno</h3><strong>${escapeHtml(c.nome_status_ciclo)}</strong><p>${escapeHtml(c.resultado_encerramento)}</p><dl><div><dt>Iniciado em</dt><dd>${formatarDataHora(c.iniciado_em || c.aberto_em)}</dd></div><div><dt>Concluído em</dt><dd>${formatarDataHora(c.encerrado_em)}</dd></div></dl></article>
    <article><h3>Participantes do Ciclo de Tratamento Interno</h3><dl><div><dt>Participante principal registrado</dt><dd>${escapeHtml(principal?.nome_exibicao, "Não informado")}</dd></div><div><dt>Colaboradores</dt><dd>${pluralizarConcluidas(colaboradores.length, "participante adicional", "participantes adicionais")}</dd></div></dl></article>
    <article><h3>Processos SEI</h3>${processos.length ? `<strong>${escapeHtml(processos.find(x => x.processo_principal)?.numero_processo || processos[0]?.numero_processo)}</strong><p>${processos.length > 1 ? pluralizarConcluidas(processos.length - 1, "vínculo adicional", "vínculos adicionais") : "Processo principal do Ciclo de Tratamento Interno"}</p>` : '<p>Nenhum processo vinculado neste Ciclo de Tratamento Interno.</p>'}</article>
    <article><h3>Auditoria do Ciclo de Tratamento Interno</h3><strong>${pluralizarConcluidas(historico.length, "movimentação registrada", "movimentações registradas")}</strong><p>${ultima ? `Última movimentação: ${formatarDataHora(ultima)}` : "Sem data de movimentação disponível."}</p><small>Abra os detalhes para consultar o histórico completo do Ciclo de Tratamento Interno.</small></article>`;
}

const CAMPOS_EXPORTACAO = Object.freeze({
  identificador_do_indicio:{rotulo:"Número do indício",grupo:"Identificação",valor:x=>x.identificador_do_indicio||"Não informado"},
  nome_atual:{rotulo:"Nome",grupo:"Identificação",valor:x=>x.nome_atual||"Não informado"},
  cpf_mascarado:{rotulo:"CPF",grupo:"Identificação",valor:x=>x.cpf_mascarado||"CPF protegido"},
  tipo_indicio:{rotulo:"Tipo de indício",grupo:"Identificação",valor:x=>x.tipo_indicio||"Não informado"},
  situacao_operacional:{rotulo:"Situação do indício",grupo:"Situação e responsabilidade",valor:x=>rotuloSituacao(x.situacao_operacional)},
  nome_operador_principal:{rotulo:"Responsável principal",grupo:"Situação e responsabilidade",valor:x=>x.nome_operador_principal||"Não atribuído"},
  nome_modo:{rotulo:"Modo de trabalho",grupo:"Situação e responsabilidade",valor:x=>x.nome_modo||rotuloPainel(x.codigo_modo)||"Não informado"},
  quantidade_colaboradores:{rotulo:"Quantidade de colaboradores",grupo:"Situação e responsabilidade",valor:x=>Number(x.quantidade_colaboradores||0)},
  nome_prioridade:{rotulo:"Prioridade",grupo:"Prioridade e prazo",valor:x=>x.nome_prioridade||"Não definida"},
  prazo_em:{rotulo:"Prazo",grupo:"Prioridade e prazo",valor:x=>x.prazo_em?formatarData(x.prazo_em):"Sem prazo definido"},
  situacao_prazo:{rotulo:"Situação do prazo",grupo:"Prioridade e prazo",valor:x=>situacaoPrazoExportacao(x)},
  numero_ciclo:{rotulo:"Número do Ciclo de Tratamento Interno",grupo:"Ciclo de Tratamento Interno",valor:x=>x.numero_ciclo??"Não informado"},
  nome_status_ciclo:{rotulo:"Situação do Ciclo de Tratamento Interno",grupo:"Ciclo de Tratamento Interno",valor:x=>x.nome_status_ciclo||rotuloSituacao(x.codigo_status_ciclo)},
  aberto_em:{rotulo:"Data de abertura",grupo:"Ciclo de Tratamento Interno",valor:x=>x.aberto_em?formatarDataHora(x.aberto_em):"Não informada"},
  iniciado_em:{rotulo:"Data de início",grupo:"Ciclo de Tratamento Interno",valor:x=>x.iniciado_em?formatarDataHora(x.iniciado_em):"Ainda não iniciado"},
  encerrado_em:{rotulo:"Data de conclusão",grupo:"Ciclo de Tratamento Interno",valor:x=>x.encerrado_em?formatarDataHora(x.encerrado_em):"Não concluído"},
  resultado_encerramento:{rotulo:"Resultado da conclusão",grupo:"Ciclo de Tratamento Interno",valor:x=>x.resultado_encerramento||"Não informado"},
  dias_ate_inicio:{rotulo:"Dias até o início",grupo:"Indicadores",valor:x=>diasEntreExportacao(x.aberto_em,x.iniciado_em,"Não calculado")},
  dias_tratamento:{rotulo:"Dias de tratamento",grupo:"Indicadores",valor:x=>diasEntreExportacao(x.iniciado_em,x.encerrado_em,"Não calculado")},
  processo_sei_principal:{rotulo:"Processo SEI principal",grupo:"Processos SEI",valor:x=>x.processo_sei_principal||"Não informado"},
  quantidade_processos_sei:{rotulo:"Quantidade de processos SEI",grupo:"Processos SEI",valor:x=>Number(x.quantidade_processos_sei||0)},
  base_de_dados:{rotulo:"Base de dados",grupo:"Origem",valor:x=>x.base_de_dados||"Não informada"},
  nome_orgao:{rotulo:"Órgão",grupo:"Origem",valor:x=>x.nome_orgao||"Não informado"},
  nome_upag:{rotulo:"UPAG",grupo:"Origem",valor:x=>x.nome_upag||"Não informada"},
  situacoes_funcionais_resumo:{rotulo:"Situação funcional",grupo:"Origem",valor:x=>x.situacoes_funcionais_resumo||"Não informada"},
  dias_de_espera:{rotulo:"Dias em acompanhamento",grupo:"Acompanhamento e histórico",valor:x=>Number(x.dias_de_espera||0)},
  quantidade_movimentacoes:{rotulo:"Quantidade de movimentações",grupo:"Acompanhamento e histórico",valor:x=>Number(x.quantidade_movimentacoes||0)}
});
const PERFIS_EXPORTACAO = Object.freeze({
 ATUAIS:{RESUMIDO:["identificador_do_indicio","nome_atual","cpf_mascarado","tipo_indicio","situacao_operacional","nome_operador_principal","nome_prioridade","prazo_em","situacao_prazo"],GERENCIAL:["identificador_do_indicio","nome_atual","cpf_mascarado","tipo_indicio","situacao_operacional","nome_operador_principal","nome_prioridade","prazo_em","situacao_prazo","nome_modo","quantidade_colaboradores","numero_ciclo","nome_status_ciclo","aberto_em","iniciado_em","processo_sei_principal","quantidade_processos_sei","base_de_dados","nome_orgao","nome_upag","situacoes_funcionais_resumo","dias_de_espera","quantidade_movimentacoes"]},
 CONCLUIDAS:{RESUMIDO:["identificador_do_indicio","nome_atual","cpf_mascarado","tipo_indicio","numero_ciclo","nome_operador_principal","nome_prioridade","encerrado_em","resultado_encerramento"],GERENCIAL:["identificador_do_indicio","nome_atual","cpf_mascarado","tipo_indicio","numero_ciclo","nome_status_ciclo","nome_operador_principal","nome_modo","quantidade_colaboradores","nome_prioridade","prazo_em","situacao_prazo","aberto_em","iniciado_em","encerrado_em","dias_ate_inicio","dias_tratamento","resultado_encerramento","processo_sei_principal","quantidade_processos_sei","quantidade_movimentacoes","base_de_dados","nome_orgao","nome_upag","situacoes_funcionais_resumo"]}
});
function diasEntreExportacao(inicio,fim,fallback){if(!inicio||!fim)return fallback;const a=new Date(inicio),b=new Date(fim);if(Number.isNaN(a)||Number.isNaN(b))return fallback;return Math.max(0,Math.floor((b-a)/86400000));}
function situacaoPrazoExportacao(x){if(!x.prazo_em)return "Sem prazo definido";const hoje=new Date(),prazo=new Date(x.prazo_em);const h=new Date(hoje.getFullYear(),hoje.getMonth(),hoje.getDate()),p=new Date(prazo.getFullYear(),prazo.getMonth(),prazo.getDate());const dias=Math.round((p-h)/86400000);if(dias<0)return `Prazo vencido há ${Math.abs(dias)} dia(s)`;if(dias===0)return "Vence hoje";if(dias<=3)return `Vence em ${dias} dia(s)`;if(dias<=7)return `Vence entre 4 e 7 dias`;return `${dias} dia(s) restantes`;}
function aplicarPerfilExportacao(perfil=estado.exportacao.perfil){estado.exportacao.perfil=perfil;const base=PERFIS_EXPORTACAO[estado.exportacao.contexto][perfil==="PERSONALIZADO"?"GERENCIAL":perfil];estado.exportacao.colunas=new Set(base);renderizarColunasExportacao();atualizarResumoExportacao();}
function escoposExportacao(){const concluidas=estado.exportacao.contexto==="CONCLUIDAS";return concluidas?[["PAGINA","Página atual","Somente os registros visíveis."],["FILTRADOS","Resultados filtrados","Todos os registros que atendem aos filtros."],["TODAS","Todos os concluídos","Todo o histórico de ciclos concluídos."]]:[["PAGINA","Página atual","Somente os registros visíveis."],["FILTRADOS","Resultados filtrados","Todos os registros que atendem aos filtros."],["SELECIONADOS","Indícios selecionados",`${estado.selecionadas.size} selecionado(s).`],["TODAS","Todos os indícios atuais","Ignora os filtros da tela."]];}
function abrirExportacaoCsv(concluidas){estado.exportacao.contexto=concluidas?"CONCLUIDAS":"ATUAIS";estado.exportacao.escopo="PAGINA";estado.exportacao.perfil="GERENCIAL";estado.exportacao.processando=false;el.exportacaoCsvTitulo.textContent=concluidas?"Exportar Ciclos de Tratamento Interno concluídos":"Exportar indícios atuais";el.exportacaoEscopos.innerHTML=escoposExportacao().map(([v,t,d])=>`<label class="export-choice"><input name="exportacaoEscopo" type="radio" value="${v}" ${v==="PAGINA"?"checked":""}><span><strong>${t}</strong><small>${d}</small></span></label>`).join("");document.querySelector('input[name="exportacaoPerfil"][value="GERENCIAL"]').checked=true;el.exportacaoColunasPainel.hidden=true;el.alternarColunasExportacaoBtn.textContent="Exibir colunas";el.exportacaoProgresso.hidden=true;el.exportacaoCsvAviso.hidden=true;aplicarPerfilExportacao("GERENCIAL");el.exportacaoCsvOverlay.hidden=false;document.body.style.overflow="hidden";}
function fecharExportacaoCsv(){if(estado.exportacao.processando)return;el.exportacaoCsvOverlay.hidden=true;document.body.style.overflow="";}
function renderizarColunasExportacao(){const disponiveis=[...new Set([...PERFIS_EXPORTACAO[estado.exportacao.contexto].GERENCIAL,...PERFIS_EXPORTACAO[estado.exportacao.contexto].RESUMIDO])];const grupos={};disponiveis.forEach(k=>(grupos[CAMPOS_EXPORTACAO[k].grupo]??=[]).push(k));el.exportacaoColunasLista.innerHTML=Object.entries(grupos).map(([g,ks])=>`<fieldset><legend>${g}</legend>${ks.map(k=>`<label><input type="checkbox" data-export-column="${k}" ${estado.exportacao.colunas.has(k)?"checked":""}><span>${CAMPOS_EXPORTACAO[k].rotulo}</span></label>`).join("")}</fieldset>`).join("");el.exportacaoColunasContador.textContent=`${estado.exportacao.colunas.size} ${estado.exportacao.colunas.size===1?"coluna selecionada":"colunas selecionadas"}`;el.gerarExportacaoCsvBtn.disabled=!estado.exportacao.colunas.size;}
function totalEstimadoExportacao(){if(estado.exportacao.escopo==="SELECIONADOS")return estado.selecionadas.size;if(estado.exportacao.escopo==="PAGINA")return estado.exportacao.contexto==="CONCLUIDAS"?estado.concluidas.itens.length:estado.demandas.length;if(estado.exportacao.escopo==="TODAS")return null;return estado.exportacao.contexto==="CONCLUIDAS"?estado.concluidas.total:estado.paginacao.total;}
function atualizarResumoExportacao(){const total=totalEstimadoExportacao(),partes=total?Math.ceil(total/5000):null;const entrega=total&&total>5000?`ZIP com ${partes} arquivos CSV`:"CSV único ou ZIP automático";el.exportacaoResumo.innerHTML=`<h3>Resumo da exportação</h3><dl><div><dt>Escopo</dt><dd>${escoposExportacao().find(x=>x[0]===estado.exportacao.escopo)?.[1]||"Página atual"}</dd></div><div><dt>Registros estimados</dt><dd>${total??"Calculado durante a exportação"}</dd></div><div><dt>Perfil</dt><dd>${estado.exportacao.perfil.charAt(0)+estado.exportacao.perfil.slice(1).toLowerCase()}</dd></div><div><dt>Colunas</dt><dd>${estado.exportacao.colunas.size}</dd></div><div><dt>Entrega</dt><dd>${entrega}</dd></div><div><dt>CPF</dt><dd>Sempre mascarado</dd></div></dl>`;}
function argsExportacao(concluidas,escopo,pagina=1,ids=null){const todas=escopo==="TODAS",f=concluidas?parametrosConcluidas():parametrosListagem();return{p_escopo:escopo==="SELECIONADOS"?"SELECIONADOS":"PAGINA",p_ids_indicios:ids?.map(x=>Number(x.id_indicio))||null,p_ids_ciclos:ids?.map(x=>Number(x.id_ciclo_tratamento)).filter(Boolean)||null,p_apenas_concluidas:concluidas,p_busca:todas?null:(f.p_busca||null),p_id_operador:todas?null:(f.p_id_operador||null),p_id_tipo_indicio:todas?null:(f.p_id_tipo_indicio||null),p_codigo_status:todas?null:(concluidas?f.p_codigo_status:f.p_situacao_operacional),p_codigo_prioridade:todas?null:(f.p_codigo_prioridade||null),p_data_inicial:todas?null:(concluidas?f.p_data_inicial:null),p_data_final:todas?null:(concluidas?f.p_data_final:null),p_pagina:pagina,p_tamanho_pagina:5000};}
function filtrarSituacaoPrazoExportacao(itens){if(estado.exportacao.contexto!=="ATUAIS"||estado.exportacao.escopo==="TODAS"||!estado.filtros.situacaoPrazo)return itens;return itens.filter(x=>{if(!x.prazo_em)return estado.filtros.situacaoPrazo==="SEM_PRAZO";const hoje=new Date(),p=new Date(x.prazo_em),d=Math.round((new Date(p.getFullYear(),p.getMonth(),p.getDate())-new Date(hoje.getFullYear(),hoje.getMonth(),hoje.getDate()))/86400000);return estado.filtros.situacaoPrazo==="PRAZO_VENCIDO"?d<0:estado.filtros.situacaoPrazo==="VENCE_HOJE"?d===0:estado.filtros.situacaoPrazo==="VENCE_EM_ATE_3_DIAS"?d>=1&&d<=3:estado.filtros.situacaoPrazo==="VENCE_EM_ATE_7_DIAS"?d>=4&&d<=7:estado.filtros.situacaoPrazo==="DENTRO_DO_PRAZO"?d>7:true;});}
function csvConteudo(itens,colunas){const q=v=>`"${String(v??"").replaceAll('"','""')}"`;const linhas=[[...colunas].map(k=>CAMPOS_EXPORTACAO[k].rotulo),...itens.map(item=>[...colunas].map(k=>CAMPOS_EXPORTACAO[k].valor(item)))];return "\ufeff"+linhas.map(r=>r.map(q).join(";")).join("\r\n");}
function baixarBlob(blob,nome){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=nome;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1500);}
function crc32(bytes){let c=-1;for(const b of bytes){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return(c^-1)>>>0;}
function zipStore(arquivos){const enc=new TextEncoder(),locais=[],centrais=[];let offset=0;const u16=n=>[n&255,n>>>8&255],u32=n=>[n&255,n>>>8&255,n>>>16&255,n>>>24&255];for(const arq of arquivos){const nome=enc.encode(arq.nome),dados=typeof arq.conteudo==="string"?enc.encode(arq.conteudo):arq.conteudo,crc=crc32(dados),local=new Uint8Array([...u32(0x04034b50),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(dados.length),...u32(dados.length),...u16(nome.length),...u16(0),...nome,...dados]);locais.push(local);centrais.push(new Uint8Array([...u32(0x02014b50),...u16(20),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(dados.length),...u32(dados.length),...u16(nome.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset),...nome]));offset+=local.length;}const centralSize=centrais.reduce((s,x)=>s+x.length,0),fim=new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(arquivos.length),...u16(arquivos.length),...u32(centralSize),...u32(offset),...u16(0)]);return new Blob([...locais,...centrais,fim],{type:"application/zip"});}
function atualizarProgressoExportacao(processados,estimado,lote){const pct=estimado?Math.min(99,Math.round(processados/estimado*100)):Math.min(95,lote*10);el.exportacaoProgressoBarra.value=pct;el.exportacaoProgressoPercentual.textContent=`${pct}%`;el.exportacaoProgressoTexto.textContent=`${processados.toLocaleString("pt-BR")} registro(s) processado(s) · lote ${lote}`;}
async function gerarExportacaoCsv(){const concluidas=estado.exportacao.contexto==="CONCLUIDAS",escopo=estado.exportacao.escopo,colunas=[...estado.exportacao.colunas];if(!colunas.length)return;if(escopo==="SELECIONADOS"&&!estado.selecionadas.size){el.exportacaoCsvAviso.textContent="Selecione ao menos um indício.";el.exportacaoCsvAviso.className="status-banner warning";el.exportacaoCsvAviso.hidden=false;return;}try{estado.exportacao.processando=true;el.gerarExportacaoCsvBtn.disabled=true;el.cancelarExportacaoCsvBtn.disabled=true;el.exportacaoProgresso.hidden=false;el.exportacaoCsvAviso.hidden=true;const arquivos=[],estimado=totalEstimadoExportacao();let processados=0,lote=0;if(escopo==="PAGINA"){const itens=concluidas?estado.concluidas.itens:estado.demandas;arquivos.push(itens);}else if(escopo==="SELECIONADOS"){const todos=[...estado.selecionadas.values()];for(let i=0;i<todos.length;i+=5000){lote++;const{data,error}=await sb.rpc("exportar_demandas_gestor",argsExportacao(false,"SELECIONADOS",1,todos.slice(i,i+5000)));if(error)throw error;arquivos.push(data?.itens||[]);processados+=(data?.itens||[]).length;atualizarProgressoExportacao(processados,estimado,lote);}}else{for(let pagina=1;;pagina++){lote++;const{data,error}=await sb.rpc("exportar_demandas_gestor",argsExportacao(concluidas,escopo,pagina));if(error)throw error;const itens=data?.itens||[];arquivos.push(itens);processados+=itens.length;atualizarProgressoExportacao(processados,estimado,lote);if(itens.length<5000)break;}}const tratados=arquivos.map(filtrarSituacaoPrazoExportacao).filter(x=>x.length);if(!tratados.length)throw Error("Nenhum registro disponível para exportação.");const data=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Fortaleza",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()),base=`${concluidas?"ciclos_tratamento_interno_concluidos":"indicios_atuais"}_${escopo.toLowerCase()}_${data}`;if(tratados.length===1){baixarBlob(new Blob([csvConteudo(tratados[0],colunas)],{type:"text/csv;charset=utf-8"}),`${base}.csv`);}else{const total=tratados.reduce((s,x)=>s+x.length,0),z=tratados.map((itens,i)=>({nome:`${base}_parte_${String(i+1).padStart(3,"0")}.csv`,conteudo:csvConteudo(itens,colunas)}));z.push({nome:"LEIA-ME.txt",conteudo:`Exportação: ${concluidas?"Ciclos de Tratamento Interno concluídos":"Indícios atuais"}\r\nEscopo: ${escopo}\r\nPerfil: ${estado.exportacao.perfil}\r\nData de geração: ${formatarDataHora(new Date())}\r\nQuantidade total: ${total}\r\nQuantidade de partes: ${tratados.length}\r\nCPF: mascarado\r\nSeparador: ponto e vírgula\r\nCodificação: UTF-8\r\n`});baixarBlob(zipStore(z),`${base}.zip`);}el.exportacaoProgressoBarra.value=100;el.exportacaoProgressoPercentual.textContent="100%";el.exportacaoProgressoTexto.textContent="Exportação concluída.";el.exportacaoCsvAviso.textContent=`${tratados.reduce((s,x)=>s+x.length,0)} registro(s) exportado(s).`;el.exportacaoCsvAviso.className="status-banner success";el.exportacaoCsvAviso.hidden=false;setTimeout(()=>{estado.exportacao.processando=false;el.cancelarExportacaoCsvBtn.disabled=false;el.gerarExportacaoCsvBtn.disabled=false;},600);}catch(e){estado.exportacao.processando=false;el.cancelarExportacaoCsvBtn.disabled=false;el.gerarExportacaoCsvBtn.disabled=false;el.exportacaoCsvAviso.textContent=mensagemErro(e,e.message||"Não foi possível gerar a exportação.");el.exportacaoCsvAviso.className="status-banner error";el.exportacaoCsvAviso.hidden=false;}}
function registrarEventosExportacao(){el.fecharExportacaoCsvBtn.addEventListener("click",fecharExportacaoCsv);el.cancelarExportacaoCsvBtn.addEventListener("click",fecharExportacaoCsv);el.exportacaoCsvOverlay.addEventListener("click",e=>{if(e.target===el.exportacaoCsvOverlay)fecharExportacaoCsv()});el.exportacaoEscopos.addEventListener("change",e=>{if(e.target.name==="exportacaoEscopo"){estado.exportacao.escopo=e.target.value;atualizarResumoExportacao()}});document.querySelectorAll('input[name="exportacaoPerfil"]').forEach(r=>r.addEventListener("change",()=>{aplicarPerfilExportacao(r.value);if(r.value==="PERSONALIZADO"){el.exportacaoColunasPainel.hidden=false;el.alternarColunasExportacaoBtn.textContent="Recolher colunas";}}));el.alternarColunasExportacaoBtn.addEventListener("click",()=>{el.exportacaoColunasPainel.hidden=!el.exportacaoColunasPainel.hidden;el.alternarColunasExportacaoBtn.textContent=el.exportacaoColunasPainel.hidden?"Exibir colunas":"Recolher colunas";el.alternarColunasExportacaoBtn.setAttribute("aria-expanded",String(!el.exportacaoColunasPainel.hidden))});el.exportacaoColunasLista.addEventListener("change",e=>{const k=e.target.dataset.exportColumn;if(!k)return;e.target.checked?estado.exportacao.colunas.add(k):estado.exportacao.colunas.delete(k);estado.exportacao.perfil="PERSONALIZADO";document.querySelector('input[name="exportacaoPerfil"][value="PERSONALIZADO"]').checked=true;renderizarColunasExportacao();atualizarResumoExportacao()});el.selecionarTodasColunasBtn.addEventListener("click",()=>{estado.exportacao.colunas=new Set([...PERFIS_EXPORTACAO[estado.exportacao.contexto].GERENCIAL,...PERFIS_EXPORTACAO[estado.exportacao.contexto].RESUMIDO]);estado.exportacao.perfil="PERSONALIZADO";document.querySelector('input[name="exportacaoPerfil"][value="PERSONALIZADO"]').checked=true;renderizarColunasExportacao();atualizarResumoExportacao()});el.limparColunasBtn.addEventListener("click",()=>{estado.exportacao.colunas.clear();estado.exportacao.perfil="PERSONALIZADO";renderizarColunasExportacao();atualizarResumoExportacao()});el.restaurarColunasBtn.addEventListener("click",()=>aplicarPerfilExportacao("GERENCIAL"));el.gerarExportacaoCsvBtn.addEventListener("click",gerarExportacaoCsv);}
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

    const bloco = `<section class="cycles-context-block"><h3 class="section-title">Ciclos de Tratamento Interno do indício</h3>${renderizarSeletorCiclos(estado.detalhe.ciclos, selecionado)}</section>`;
    el.painelDetalhesGestor.insertAdjacentHTML("afterbegin", bloco);
  } catch (error) {
    console.error(error);
    el.painelDetalhesGestor.insertAdjacentHTML("afterbegin", '<div class="status-banner warning">Não foi possível carregar os ciclos deste indício.</div>');
  }
}


function rotuloStatusDilacao(codigo){return ({PENDENTE:"Aguardando análise",APROVADA:"Aprovada",APROVADA_COM_AJUSTE:"Aprovada com ajuste",REJEITADA:"Rejeitada",CANCELADA:"Cancelada",PERDEU_OBJETO:"Sem efeito"})[codigo]||codigo||"Não informada";}
function classeStatusDilacao(codigo){return codigo==="PENDENTE"?"badge-warning":codigo==="APROVADA"||codigo==="APROVADA_COM_AJUSTE"?"badge-success":codigo==="REJEITADA"?"badge-danger":"badge-neutral";}
async function atualizarContadorDilacoes(){try{const{data,error}=await sb.rpc("listar_solicitacoes_dilacao_gestor",{p_codigo_status:"PENDENTE",p_id_operador:null,p_busca:null,p_pagina:1,p_tamanho_pagina:1});if(error)throw error;const total=Number(data?.paginacao?.total_registros||0);el.dilacaoTabCount.textContent=total;el.dilacaoPendentesTotal.textContent=total;}catch(e){console.error(e);}}
async function carregarDilacoes(){el.dilacoesConteudo.innerHTML='<div class="table-state">Carregando solicitações...</div>';try{const{data,error}=await sb.rpc("listar_solicitacoes_dilacao_gestor",{p_codigo_status:el.dilacaoStatusFiltro.value||null,p_id_operador:null,p_busca:el.dilacaoBuscaFiltro.value.trim()||null,p_pagina:estado.dilacoes.pagina,p_tamanho_pagina:estado.dilacoes.tamanho});if(error)throw error;estado.dilacoes.itens=data?.itens||[];const pg=data?.paginacao||{};estado.dilacoes.total=Number(pg.total_registros||0);estado.dilacoes.totalPaginas=Number(pg.total_paginas||0);el.dilacaoResumoLista.textContent=`${estado.dilacoes.total} ${estado.dilacoes.total===1?"solicitação encontrada":"solicitações encontradas"}`;el.dilacaoPaginacaoInfo.textContent=estado.dilacoes.total?`Exibindo ${estado.dilacoes.itens.length} de ${estado.dilacoes.total}`:"Nenhuma solicitação";el.dilacaoPaginaInfo.textContent=`Página ${pg.pagina||1} de ${pg.total_paginas||0}`;el.dilacaoAnteriorBtn.disabled=estado.dilacoes.pagina<=1;el.dilacaoProximaBtn.disabled=estado.dilacoes.pagina>=estado.dilacoes.totalPaginas;if(!estado.dilacoes.itens.length){el.dilacoesConteudo.innerHTML='<div class="table-state">Nenhuma solicitação corresponde aos filtros.</div>';await atualizarContadorDilacoes();return;}el.dilacoesConteudo.innerHTML=`<div class="table-wrap"><table class="dilation-table"><thead><tr><th>Indício</th><th>Pessoa</th><th>Solicitante</th><th>Prazo vigente</th><th>Prazo solicitado</th><th>Solicitada em</th><th>Situação</th><th>Ação</th></tr></thead><tbody>${estado.dilacoes.itens.map(x=>`<tr><td><strong>${escapeHtml(x.identificador_do_indicio)}</strong><br><small>Ciclo ${escapeHtml(x.numero_ciclo)}</small></td><td><strong>${escapeHtml(x.nome_atual)}</strong><br><small>${escapeHtml(x.cpf_mascarado||"CPF protegido")}</small></td><td>${escapeHtml(x.nome_solicitante)}</td><td>${formatarDataHora(x.prazo_vigente_em)}</td><td><strong>${formatarDataHora(x.prazo_solicitado_em)}</strong></td><td>${formatarDataHora(x.criado_em)}</td><td><span class="badge ${classeStatusDilacao(x.codigo_status_solicitacao)}">${escapeHtml(rotuloStatusDilacao(x.codigo_status_solicitacao))}</span></td><td>${x.codigo_status_solicitacao==="PENDENTE"?`<button class="btn btn-primary btn-sm" data-analisar-dilacao="${x.id_solicitacao_dilacao}" type="button">Analisar</button>`:`<button class="btn btn-secondary btn-sm" data-analisar-dilacao="${x.id_solicitacao_dilacao}" type="button">Consultar</button>`}</td></tr>`).join("")}</tbody></table></div>`;await atualizarContadorDilacoes();}catch(e){el.dilacoesConteudo.innerHTML=`<div class="status-banner error">${escapeHtml(mensagemErro(e,"Não foi possível carregar as solicitações."))}</div>`;}}
function dadosDecisaoDilacao(){const decisao=document.querySelector('input[name="dilacaoDecisao"]:checked')?.value||"APROVAR";return{decisao,prazo:decisao==="APROVAR_COM_AJUSTE"?el.dilacaoPrazoAjustadoInput.value:null,manifestacao:el.dilacaoManifestacaoInput.value.trim()};}
function mostrarEtapaDilacao(etapa){estado.dilacoes.etapa=etapa;el.dilacaoDecisaoFormulario.hidden=etapa!==1;el.dilacaoRevisao.hidden=etapa!==2;el.voltarDilacaoAnaliseBtn.hidden=etapa!==2;el.revisarDilacaoAnaliseBtn.hidden=etapa!==1;el.confirmarDilacaoAnaliseBtn.hidden=etapa!==2;el.confirmarDilacaoAnaliseBtn.disabled=!el.dilacaoConfirmacaoCheck.checked;}
async function abrirAnaliseDilacao(id){try{const{data,error}=await sb.rpc("obter_solicitacao_dilacao_gestor",{p_id_solicitacao_dilacao:Number(id)});if(error)throw error;const x=data?.solicitacao;if(!x)throw Error("SOLICITACAO_DILACAO_NAO_ENCONTRADA");estado.dilacoes.selecionada=x;el.dilacaoAnaliseTitulo.textContent=x.codigo_status_solicitacao==="PENDENTE"?"Analisar solicitação":"Consultar solicitação";el.dilacaoAnaliseContexto.innerHTML=`<span>Indício ${escapeHtml(x.identificador_do_indicio)} · Ciclo de Tratamento Interno ${escapeHtml(x.numero_ciclo)}</span><strong>${escapeHtml(x.nome_atual)}</strong><small>Solicitada por ${escapeHtml(x.nome_solicitante)} em ${formatarDataHora(x.criado_em)}</small>`;el.dilacaoComparativo.innerHTML=`<article><span>Prazo no envio</span><strong>${formatarDataHora(x.prazo_vigente_em)}</strong></article><article><span>Prazo solicitado</span><strong>${formatarDataHora(x.prazo_solicitado_em)}</strong></article><article class="full"><span>Justificativa do operador</span><strong>${escapeHtml(x.justificativa_solicitante)}</strong></article>${x.codigo_status_solicitacao!=="PENDENTE"?`<article><span>Decisão</span><strong>${escapeHtml(rotuloStatusDilacao(x.codigo_status_solicitacao))}</strong></article><article><span>Prazo aprovado</span><strong>${x.prazo_aprovado_em?formatarDataHora(x.prazo_aprovado_em):"Não se aplica"}</strong></article><article class="full"><span>Manifestação do gestor</span><strong>${escapeHtml(x.manifestacao_gestor||"Não informada")}</strong></article>`:""}`;document.querySelector('input[name="dilacaoDecisao"][value="APROVAR"]').checked=true;el.dilacaoPrazoAjustadoField.hidden=true;el.dilacaoPrazoAjustadoInput.value="";el.dilacaoPrazoAjustadoInput.min=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Fortaleza",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());el.dilacaoManifestacaoInput.value="";el.dilacaoConfirmacaoCheck.checked=false;el.dilacaoAnaliseAviso.hidden=true;const pendente=x.codigo_status_solicitacao==="PENDENTE";el.dilacaoDecisaoFormulario.hidden=!pendente;el.revisarDilacaoAnaliseBtn.hidden=!pendente;el.confirmarDilacaoAnaliseBtn.hidden=true;el.voltarDilacaoAnaliseBtn.hidden=true;el.dilacaoRevisao.hidden=true;estado.dilacoes.etapa=1;el.dilacaoAnaliseOverlay.hidden=false;document.body.style.overflow="hidden";}catch(e){exibirMensagem(mensagemErro(e,"Não foi possível abrir a solicitação."),"error");}}
function fecharAnaliseDilacao(){el.dilacaoAnaliseOverlay.hidden=true;document.body.style.overflow="";}
function revisarAnaliseDilacao(){try{const x=dadosDecisaoDilacao(),s=estado.dilacoes.selecionada;if(x.decisao==="APROVAR_COM_AJUSTE"&&!x.prazo)throw Error("Informe a data aprovada.");if(["APROVAR_COM_AJUSTE","REJEITAR"].includes(x.decisao)&&x.manifestacao.length<10)throw Error("Informe uma manifestação com pelo menos 10 caracteres.");const prazoFinal=x.decisao==="APROVAR"?s.prazo_solicitado_em:x.decisao==="APROVAR_COM_AJUSTE"?`${x.prazo}T23:59:59-03:00`:null;el.dilacaoRevisaoResumo.innerHTML=`<dl class="review-definition-list"><div><dt>Decisão</dt><dd>${escapeHtml(x.decisao==="APROVAR"?"Aprovar a data solicitada":x.decisao==="APROVAR_COM_AJUSTE"?"Aprovar com ajuste":"Rejeitar")}</dd></div><div><dt>Prazo vigente</dt><dd>${formatarDataHora(s.prazo_vigente_em)}</dd></div><div><dt>Prazo solicitado</dt><dd>${formatarDataHora(s.prazo_solicitado_em)}</dd></div><div><dt>Prazo aprovado</dt><dd>${prazoFinal?formatarDataHora(prazoFinal):"Prazo atual preservado"}</dd></div><div class="full"><dt>Manifestação</dt><dd>${escapeHtml(x.manifestacao||"Aprovação conforme a data solicitada.")}</dd></div></dl>`;el.dilacaoConfirmacaoCheck.checked=false;mostrarEtapaDilacao(2);}catch(e){el.dilacaoAnaliseAviso.textContent=e.message;el.dilacaoAnaliseAviso.className="status-banner error";el.dilacaoAnaliseAviso.hidden=false;}}
async function confirmarAnaliseDilacao(){const x=dadosDecisaoDilacao(),s=estado.dilacoes.selecionada;try{el.confirmarDilacaoAnaliseBtn.disabled=true;const{data,error}=await sb.rpc("analisar_solicitacao_dilacao_gestor",{p_id_solicitacao_dilacao:Number(s.id_solicitacao_dilacao),p_decisao:x.decisao,p_prazo_aprovado_em:x.decisao==="APROVAR_COM_AJUSTE"?`${x.prazo}T23:59:59-03:00`:null,p_manifestacao_gestor:x.manifestacao||null});if(error)throw error;fecharAnaliseDilacao();await Promise.all([carregarDilacoes(),carregarResumo(),carregarDemandas(),atualizarContadorDilacoes()]);exibirMensagem(data?.status==="REJEITADA"?"Solicitação rejeitada. O prazo foi preservado.":"Solicitação aprovada e prazo atualizado.","success");}catch(e){el.dilacaoAnaliseAviso.textContent=mensagemErro(e,"Não foi possível registrar a decisão.");el.dilacaoAnaliseAviso.className="status-banner error";el.dilacaoAnaliseAviso.hidden=false;el.confirmarDilacaoAnaliseBtn.disabled=false;}}
function registrarEventosDilacao(){el.aplicarDilacoesBtn.addEventListener("click",()=>{estado.dilacoes.pagina=1;carregarDilacoes()});el.atualizarDilacoesBtn.addEventListener("click",carregarDilacoes);el.dilacaoAnteriorBtn.addEventListener("click",()=>{if(estado.dilacoes.pagina>1){estado.dilacoes.pagina--;carregarDilacoes()}});el.dilacaoProximaBtn.addEventListener("click",()=>{if(estado.dilacoes.pagina<estado.dilacoes.totalPaginas){estado.dilacoes.pagina++;carregarDilacoes()}});el.dilacoesConteudo.addEventListener("click",e=>{const b=e.target.closest("[data-analisar-dilacao]");if(b)abrirAnaliseDilacao(b.dataset.analisarDilacao)});[el.fecharDilacaoAnaliseBtn,el.cancelarDilacaoAnaliseBtn].forEach(b=>b.addEventListener("click",fecharAnaliseDilacao));el.dilacaoAnaliseOverlay.addEventListener("click",e=>{if(e.target===el.dilacaoAnaliseOverlay)fecharAnaliseDilacao()});document.querySelectorAll('input[name="dilacaoDecisao"]').forEach(r=>r.addEventListener("change",()=>{el.dilacaoPrazoAjustadoField.hidden=r.value!=="APROVAR_COM_AJUSTE"||!r.checked;el.dilacaoAnaliseAviso.hidden=true}));el.revisarDilacaoAnaliseBtn.addEventListener("click",revisarAnaliseDilacao);el.voltarDilacaoAnaliseBtn.addEventListener("click",()=>mostrarEtapaDilacao(1));el.dilacaoConfirmacaoCheck.addEventListener("change",()=>{el.confirmarDilacaoAnaliseBtn.disabled=!el.dilacaoConfirmacaoCheck.checked});el.confirmarDilacaoAnaliseBtn.addEventListener("click",confirmarAnaliseDilacao);}

function alterarAbaPrincipal(aba) {
  const painelAtivo = aba === "painel";
  dom("assignmentMenu").hidden = painelAtivo;
  dom("redistributionMenu").hidden = painelAtivo;
  dom("secaoPainelGestao").hidden = aba !== "painel"; dom("secaoDemandasAtuais").hidden = aba !== "atuais"; dom("secaoConcluidasGestao").hidden = aba !== "concluidas"; dom("secaoDilacoesGestao").hidden = aba !== "dilacoes";
  document.querySelectorAll("[data-gestao-tab]").forEach(b => { const ativo = b.dataset.gestaoTab === aba; b.classList.toggle("active", ativo); b.setAttribute("aria-selected", String(ativo)); });
  if (aba === "painel") carregarPainelGestao(); if (aba === "concluidas") carregarConcluidas(); if (aba === "dilacoes") carregarDilacoes();
}
function prepararNavegacaoGestao() {
  const fim = new Date(), inicio = new Date(Date.now() - 29 * 86400000); dom("painelFim").value = fim.toISOString().slice(0,10); dom("painelInicio").value = inicio.toISOString().slice(0,10);
  document.querySelectorAll("[data-gestao-tab]").forEach(b => b.addEventListener("click", () => alterarAbaPrincipal(b.dataset.gestaoTab)));
  dom("aplicarPainelBtn").addEventListener("click", carregarPainelGestao); dom("exportarAtuaisBtn").addEventListener("click", () => abrirExportacaoCsv(false)); dom("exportarConcluidasBtn").addEventListener("click", () => abrirExportacaoCsv(true)); dom("exportarConcluidasPdfBtn").addEventListener("click", exportarHistoricoConcluidasPdf);
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
  registrarEventosExportacao();

  // Filtro inicial aplicado uma única vez ao abrir a página.
  el.situacaoSelect.value = "DISPONIVEL_PARA_ATRIBUICAO";
  atualizarCardAtivo("DISPONIVEL_PARA_ATRIBUICAO");
  atualizarResumoFiltrosAtuais();

  registrarEventos();
  try { await exigirAcesso(); await Promise.all([carregarOperadores(), carregarPrioridades(), carregarResumo(), carregarDemandas()]); await carregarTiposIndicio(); await atualizarContadorDilacoes(); dom("concluidaOperador").innerHTML = '<option value="">Todos os responsáveis</option>' + estado.operadores.map(o=>`<option value="${o.id_usuario}">${escapeHtml(o.nome_exibicao)}</option>`).join(""); dom("concluidaPrioridade").innerHTML = '<option value="">Todas as prioridades</option>' + estado.prioridades.map(p=>`<option value="${p.codigo_prioridade}">${escapeHtml(p.nome_prioridade)}</option>`).join(""); dom("concluidaTipo").innerHTML = '<option value="">Todos os tipos</option>' + estado.tiposIndicio.map(t=>`<option value="${t.id}">${escapeHtml(t.nome)}</option>`).join(""); }
  catch (error) { console.error(error); if (error.message !== "SESSAO_AUSENTE") exibirMensagem(mensagemErro(error, "Erro ao carregar dados do sistema."), "error"); }
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", inicializarAplicacao, { once: true }); else inicializarAplicacao();
