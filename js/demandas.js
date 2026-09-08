'use strict';

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
  selecionada: null,
  carregando: false,
  atribuindo: false,
  buscaTimer: null,
  cardAtivo: 'TODAS',
  paginacao: { pagina: 1, tamanho: 20, total: 0, totalPaginas: 0 },
  filtros: {
    busca: '', situacao: '', idOperador: null, ordenacao: 'DIAS_ESPERA_DESC',
    multiplas: null, semResponsavel: null, requerAnalise: null
  }
};

const el = Object.fromEntries([
  'usuarioNome','usuarioPerfil','temaBtn','sairBtn','atualizarBtn','atribuirSelecionadaBtn','mensagem',
  'cardTotal','cardDisponiveis','cardPendentes','cardEmTratamento','cardSemResponsavel','cardMultiplas',
  'buscaInput','situacaoSelect','operadorFiltroSelect','ordenacaoSelect','semResponsavelCheck','multiplasCheck','analiseCheck','limparFiltrosBtn',
  'tamanhoPaginaSelect','demandasTbody','estadoTabela','selectionInfo','paginacaoInfo','paginaAtualInfo','paginaAnteriorBtn','proximaPaginaBtn',
  'atribuicaoOverlay','fecharModalBtn','cancelarModalBtn','operadorAtribuicaoSelect','confirmarAtribuicaoBtn','limparSelecaoBtn',
  'modalIdentificador','modalSituacao','modalNumeroIndicio','modalCpf','modalNome','modalTipo','modalSituacaoFuncional','modalEspera','modalUltimaAlteracao'
].map(id => [id, document.getElementById(id)]));

function textoSeguro(valor, fallback = 'Não informado') {
  const texto = valor === null || valor === undefined || valor === '' ? fallback : String(valor);
  return texto.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function exibirMensagem(texto, tipo = '') {
  el.mensagem.textContent = texto;
  el.mensagem.className = `status-banner ${tipo}`.trim();
  el.mensagem.hidden = false;
}
function ocultarMensagem() { el.mensagem.hidden = true; }

function mensagemErro(error, fallback) {
  const msg = error?.message || fallback;
  if (/JWT|session|auth/i.test(msg)) return 'Sua sessão não é mais válida. Entre novamente para continuar.';
  if (/PERFIL_NAO_AUTORIZADO|permission|42501/i.test(msg)) return 'Seu perfil não possui permissão para executar esta operação.';
  if (/DEMANDA_NAO_ELEGIVEL|TRATAMENTO_JA_POSSUI_CICLO_ATIVO|23505/i.test(msg)) return 'A demanda foi alterada ou já possui ciclo ativo. A lista será atualizada.';
  return fallback;
}

function formatarData(valor) {
  if (!valor) return 'Não informado';
  const data = /^\d{4}-\d{2}-\d{2}$/.test(valor) ? new Date(`${valor}T12:00:00`) : new Date(valor);
  return Number.isNaN(data.getTime()) ? 'Não informado' : new Intl.DateTimeFormat('pt-BR').format(data);
}

function rotuloSituacao(codigo) {
  return ({
    DISPONIVEL_PARA_ATRIBUICAO: 'Disponível para atribuição',
    PENDENTE_DE_TRATAMENTO: 'Pendente de tratamento',
    EM_TRATAMENTO: 'Em tratamento',
    AGUARDANDO_VALIDACAO_TCU: 'Aguardando validação do TCU',
    VALIDADO_TCU: 'Validado pelo TCU',
    ENCERRADO_INTERNAMENTE: 'Encerrado internamente',
    ESTADO_MISTO_REQUER_ANALISE: 'Requer análise',
    REQUER_ANALISE: 'Requer análise'
  })[codigo] || codigo || 'Não classificada';
}

function classeSituacao(codigo) {
  if (codigo === 'DISPONIVEL_PARA_ATRIBUICAO') return 'badge-primary';
  if (codigo === 'EM_TRATAMENTO' || codigo === 'VALIDADO_TCU') return 'badge-success';
  if (codigo === 'PENDENTE_DE_TRATAMENTO' || codigo === 'AGUARDANDO_VALIDACAO_TCU') return 'badge-warning';
  if (/ANALISE|MISTO/.test(codigo || '')) return 'badge-danger';
  return '';
}

async function exigirAcesso() {
  const { data: sessaoData, error: sessaoErro } = await sb.auth.getSession();
  if (sessaoErro || !sessaoData.session) {
    window.location.replace(CONFIG.LOGIN_URL);
    throw new Error('SESSAO_AUSENTE');
  }

  const { data, error } = await sb.from('v_meu_contexto').select('*').limit(2);
  if (error) throw error;
  if (!Array.isArray(data) || data.length !== 1) throw new Error('CONTEXTO_FUNCIONAL_INVALIDO');
  if (!CONFIG.PERFIS_AUTORIZADOS.includes(data[0].codigo_perfil)) throw new Error('PERFIL_NAO_AUTORIZADO');

  estado.contexto = data[0];
  el.usuarioNome.textContent = data[0].nome_exibicao || data[0].email_institucional || 'Usuário';
  el.usuarioPerfil.textContent = data[0].nome_perfil || data[0].codigo_perfil;
}

async function carregarOperadores() {
  const { data, error } = await sb.from('v_operadores_disponiveis').select('id_usuario,nome_exibicao,email_institucional').order('nome_exibicao');
  if (error) throw error;
  estado.operadores = data || [];
  const options = estado.operadores.map(op => `<option value="${op.id_usuario}">${textoSeguro(op.nome_exibicao)}${op.email_institucional ? ` (${textoSeguro(op.email_institucional)})` : ''}</option>`).join('');
  el.operadorFiltroSelect.innerHTML = `<option value="">Todos</option>${options}`;
  el.operadorAtribuicaoSelect.innerHTML = `<option value="">Selecione um operador</option>${options}`;
}

async function carregarResumo() {
  const { data, error } = await sb.rpc('resumo_demandas_gestao');
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
  el.estadoTabela.innerHTML = '<strong>Carregando demandas...</strong><span>Aguarde um momento.</span>';
  el.demandasTbody.innerHTML = '';

  try {
    const { data, error } = await sb.rpc('listar_demandas_gestao', parametrosListagem());
    if (error) throw error;
    estado.demandas = data?.itens || [];
    estado.paginacao.pagina = data?.paginacao?.pagina || 1;
    estado.paginacao.total = data?.paginacao?.total_registros || 0;
    estado.paginacao.totalPaginas = data?.paginacao?.total_paginas || 0;
    renderizarDemandas();
    renderizarPaginacao(data?.paginacao || {});
  } catch (error) {
    console.error('Falha ao carregar demandas', error);
    el.estadoTabela.innerHTML = '<strong>Não foi possível carregar as demandas.</strong><span>Tente atualizar a página.</span>';
    exibirMensagem(mensagemErro(error, 'Não foi possível carregar as demandas.'), 'error');
  } finally {
    estado.carregando = false;
    atualizarControles();
  }
}

function renderizarDemandas() {
  if (!estado.demandas.length) {
    el.estadoTabela.hidden = false;
    el.estadoTabela.innerHTML = '<strong>Nenhuma demanda encontrada.</strong><span>Revise os filtros aplicados.</span>';
    return;
  }
  el.estadoTabela.hidden = true;
  el.demandasTbody.innerHTML = estado.demandas.map(d => {
    const selecionada = estado.selecionada?.id_indicio === d.id_indicio;
    const habilitada = Boolean(d.pode_abrir_e_atribuir);
    const vinculos = d.quantidade_origens > 1 ? `${textoSeguro((d.origens || [])[0]?.situacao_funcional)} <span class="badge badge-primary">+${d.quantidade_origens - 1}</span>` : textoSeguro(d.situacoes_funcionais_resumo);
    return `<tr class="${selecionada ? 'is-selected' : ''}" data-row-indicio="${d.id_indicio}" aria-selected="${selecionada}">
      <td><input type="radio" name="demanda" data-selecionar="${d.id_indicio}" ${selecionada ? 'checked' : ''} ${habilitada ? '' : 'disabled'} aria-label="Selecionar demanda ${textoSeguro(d.identificador_do_indicio)}"></td>
      <td><strong>${textoSeguro(d.identificador_do_indicio)}</strong><br><small>${textoSeguro(d.base_de_dados)}</small></td>
      <td class="cell-person"><strong>${textoSeguro(d.nome_atual)}</strong><span>${textoSeguro(d.cpf_mascarado)}</span></td>
      <td><div class="truncate" title="${textoSeguro(d.tipo_indicio)}">${textoSeguro(d.tipo_indicio)}</div></td>
      <td><div class="truncate" title="${textoSeguro(d.situacoes_funcionais_resumo)}">${vinculos}</div></td>
      <td><span class="badge ${classeSituacao(d.situacao_operacional)}">${textoSeguro(rotuloSituacao(d.situacao_operacional))}</span></td>
      <td>${textoSeguro(d.nome_prioridade, 'Ainda não definida')}</td>
      <td>${textoSeguro(d.nome_operador_principal, 'Sem responsável')}</td>
      <td><strong>${Number(d.dias_de_espera || 0)}</strong> dias<br><small>Última alteração na origem: ${formatarData(d.data_ultima_modificacao)}</small></td>
      <td><div class="actions-cell">
        <button class="btn btn-primary" type="button" data-atribuir="${d.id_indicio}" ${habilitada ? '' : 'disabled'}>Atribuir</button>
      </div></td>
    </tr>`;
  }).join('');
}

function renderizarPaginacao(p) {
  el.paginacaoInfo.textContent = p.total_registros ? `Exibindo ${p.registro_inicial} a ${p.registro_final} de ${p.total_registros} demandas` : 'Nenhuma demanda encontrada';
  el.paginaAtualInfo.textContent = `Página ${p.pagina || 1} de ${p.total_paginas || 0}`;
  el.paginaAnteriorBtn.disabled = !p.possui_pagina_anterior;
  el.proximaPaginaBtn.disabled = !p.possui_proxima_pagina;
}

function selecionarDemanda(id) {
  estado.selecionada = estado.demandas.find(d => String(d.id_indicio) === String(id)) || null;
  renderizarDemandas();
  atualizarControles();
}

function limparSelecao() {
  estado.selecionada = null;
  renderizarDemandas();
  atualizarControles();
}

function atualizarControles() {
  el.atualizarBtn.disabled = estado.carregando || estado.atribuindo;
  el.atribuirSelecionadaBtn.disabled = !estado.selecionada?.pode_abrir_e_atribuir || estado.carregando || estado.atribuindo;
  el.selectionInfo.textContent = estado.selecionada ? `Indício ${estado.selecionada.identificador_do_indicio} selecionado` : 'Nenhuma demanda selecionada';
  if (el.limparSelecaoBtn) el.limparSelecaoBtn.hidden = !estado.selecionada;
}

function abrirModal(demanda) {
  if (!demanda?.pode_abrir_e_atribuir) return;
  estado.selecionada = demanda;
  if (el.modalIdentificador) el.modalIdentificador.textContent = demanda.identificador_do_indicio || 'Não informado';
  if (el.modalSituacao) el.modalSituacao.textContent = rotuloSituacao(demanda.situacao_operacional);
  if (el.modalNumeroIndicio) el.modalNumeroIndicio.textContent = demanda.identificador_do_indicio || 'Não informado';
  if (el.modalCpf) el.modalCpf.textContent = demanda.cpf_mascarado || 'Não informado';
  if (el.modalNome) el.modalNome.textContent = demanda.nome_atual || 'Não informado';
  if (el.modalTipo) el.modalTipo.textContent = demanda.tipo_indicio || 'Não informado';
  if (el.modalSituacaoFuncional) el.modalSituacaoFuncional.textContent = demanda.situacoes_funcionais_resumo || 'Não informado';
  if (el.modalEspera) el.modalEspera.textContent = `${Number(demanda.dias_de_espera || 0)} dias`;
  if (el.modalUltimaAlteracao) el.modalUltimaAlteracao.textContent = formatarData(demanda.data_ultima_modificacao);
  el.operadorAtribuicaoSelect.value = '';
  el.atribuicaoOverlay.hidden = false;
  document.body.style.overflow = 'hidden';
  setTimeout(() => el.operadorAtribuicaoSelect.focus(), 0);
  atualizarControles();
}

function fecharModal() {
  if (estado.atribuindo) return;
  fecharModalForcado();
}

function fecharModalForcado() {
  el.atribuicaoOverlay.hidden = true;
  document.body.style.overflow = '';
}

function idDataHoje() {
  const partes = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const mapa = Object.fromEntries(partes.map(p => [p.type, p.value]));
  return Number(`${mapa.year}${mapa.month}${mapa.day}`);
}

async function atribuirDemanda() {
  const demanda = estado.selecionada;
  const idOperador = Number(el.operadorAtribuicaoSelect.value);
  if (!demanda?.pode_abrir_e_atribuir) return exibirMensagem('A demanda selecionada não está mais elegível para atribuição.', 'warning');
  if (!idOperador) return exibirMensagem('Selecione o operador principal.', 'warning');

  estado.atribuindo = true;
  el.confirmarAtribuicaoBtn.disabled = true;
  el.confirmarAtribuicaoBtn.innerHTML = '<span class="spinner" aria-hidden="true"></span> Atribuindo...';
  ocultarMensagem();

  try {
    const { data, error } = await sb.rpc('abrir_atribuir_fluxo_individual', {
      p_id_indicio: demanda.id_indicio,
      p_id_origem_abertura: demanda.id_origem_representativa,
      p_id_estado_indicio_abertura: demanda.id_estado_indicio,
      p_id_data_abertura: idDataHoje(),
      p_id_usuario_operador: idOperador,
      p_id_data_prazo: null,
      p_prazo_em: null
    });
    if (error) throw error;
    fecharModalForcado();
    estado.selecionada = null;
    exibirMensagem(`Demanda ${demanda.identificador_do_indicio} atribuída com sucesso.`, 'success');
    await Promise.allSettled([carregarResumo(), carregarDemandas()]);
    console.info('Atribuição concluída', data);
  } catch (error) {
    console.error('Falha na atribuição', error);
    exibirMensagem(mensagemErro(error, 'Não foi possível atribuir a demanda.'), 'error');
    if (/DEMANDA_NAO_ELEGIVEL|TRATAMENTO_JA_POSSUI_CICLO_ATIVO|23505/i.test(error?.message || '')) {
      estado.selecionada = null;
      fecharModalForcado();
      await Promise.allSettled([carregarResumo(), carregarDemandas()]);
    }
  } finally {
    estado.atribuindo = false;
    el.confirmarAtribuicaoBtn.disabled = false;
    el.confirmarAtribuicaoBtn.textContent = 'Confirmar atribuição';
    atualizarControles();
  }
}
