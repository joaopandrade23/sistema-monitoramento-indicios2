"use strict";

import { supabase } from "./supabase.js";

const CONFIG = Object.freeze({
  LOGIN_URL: "./index.html",
  PERFIS_AUTORIZADOS: ["OPERADOR_SEGEP_CE", "GESTOR_DADOS_SISTEMA"],
  PERFIS_SOMENTE_LEITURA: ["GESTOR_DADOS_SISTEMA"]
});

const $ = (id) => document.getElementById(id);
const el = Object.fromEntries([
  "usuarioNome","usuarioPerfil","temaBtn","sairBtn","atualizarBtn","voltarGestaoBtn","mensagemGlobal",
  "cardTotal","cardPendentes","cardEmTratamento","cardAtrasadas","resultadoResumo","buscaInput","papelFiltro","statusFiltro",
  "demandasTbody","estadoTabela","detalheOverlay","fecharDetalheBtn","fecharRodapeBtn","detalheTitulo","detalheSubtitulo",
  "modalAviso","resumoConteudo","tratamentoAcoes","registroForm","tipoRegistro","descricaoRegistro","encerramentoForm",
  "resultadoEncerramento","processoForm","numeroProcesso","assuntoProcesso","observacaoProcesso","processoPrincipal",
  "processosLista","historicoLista"
].map(id => [id, $(id)]));

const estado = {
  contexto: null,
  demandas: [],
  processos: [],
  participacoes: [],
  selecionada: null,
  filtroCard: "TODAS",
  carregando: false
};

function escapeHtml(valor) {
  return String(valor ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[c]);
}
function textoStatus(codigo) { return String(codigo || "Não informado").replaceAll("_", " ").toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase()); }
function formatarData(valor) { if (!valor) return "Não informado"; const d = new Date(valor); return Number.isNaN(d.getTime()) ? String(valor) : new Intl.DateTimeFormat("pt-BR").format(d); }
function idDataHoje() { const d = new Date(); return Number(`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`); }
function somenteLeitura() { return CONFIG.PERFIS_SOMENTE_LEITURA.includes(estado.contexto?.codigo_perfil); }
function mostrarMensagem(texto, tipo="") { el.mensagemGlobal.hidden = !texto; el.mensagemGlobal.className = `status-banner ${tipo}`; el.mensagemGlobal.textContent = texto || ""; }
function avisoModal(texto, tipo="") { el.modalAviso.hidden = !texto; el.modalAviso.className = `status-banner ${tipo}`; el.modalAviso.textContent = texto || ""; }
function mensagemErro(error, padrao) { const m = error?.message || error?.details || padrao; const mapa={VERSAO_DESATUALIZADA:"A demanda foi atualizada por outra operação. Recarregue e tente novamente.",USUARIO_SEM_PARTICIPACAO_ATIVA:"O usuário não possui participação ativa neste ciclo.",CICLO_NAO_PERMITE_MOVIMENTACAO:"O ciclo ainda não permite esta movimentação.",PROCESSO_SEI_JA_VINCULADO_AO_CICLO:"Este processo já está vinculado ao ciclo.",NUMERO_PROCESSO_SEI_INVALIDO:"Informe um processo no formato 00000.000000/0000-00."}; return mapa[m] || m || padrao; }

async function carregarContexto() {
  const { data: { session }, error: erroSessao } = await supabase.auth.getSession();
  if (erroSessao || !session) { location.replace(CONFIG.LOGIN_URL); throw new Error("SESSAO_AUSENTE"); }
  const { data, error } = await supabase.schema("api").from("v_meu_contexto").select("*").limit(1).maybeSingle();
  if (error || !data) throw error || new Error("CONTEXTO_AUSENTE");
  if (!CONFIG.PERFIS_AUTORIZADOS.includes(data.codigo_perfil)) { location.replace("./inicio.html"); throw new Error("PERFIL_NAO_AUTORIZADO"); }
  estado.contexto = data;
  el.usuarioNome.textContent = data.nome_exibicao || session.user.email;
  el.usuarioPerfil.textContent = data.nome_perfil || data.codigo_perfil;
  el.voltarGestaoBtn.hidden = data.codigo_perfil !== "GESTOR_DADOS_SISTEMA";
}

async function consultarColecao(nome, colunas="*") {
  const { data, error } = await supabase.schema("api").from(nome).select(colunas);
  if (error) throw error;
  return data || [];
}

async function carregarDados() {
  estado.carregando = true; el.estadoTabela.hidden = false; el.estadoTabela.textContent = "Carregando demandas...";
  try {
    const [ciclos, participacoes, processos] = await Promise.all([
      consultarColecao("v_ciclos"), consultarColecao("v_participacoes"), consultarColecao("v_processos_sei")
    ]);
    estado.participacoes = participacoes;
    estado.processos = processos;
    const porCiclo = new Map();
    for (const p of participacoes) {
      if (!p.participacao_ativa) continue;
      const atual = porCiclo.get(String(p.id_ciclo_tratamento));
      if (!atual || p.papel_principal) porCiclo.set(String(p.id_ciclo_tratamento), p);
    }
    estado.demandas = ciclos.filter(c => c.ciclo_ativo).map(c => ({
      ...c,
      participacao: porCiclo.get(String(c.id_ciclo_tratamento)) || null,
      processos: processos.filter(p => String(p.id_ciclo_tratamento) === String(c.id_ciclo_tratamento) && p.processo_ativo)
    })).filter(c => estado.contexto.codigo_perfil === "GESTOR_DADOS_SISTEMA" || c.participacao);
    atualizarResumo(); renderizarTabela(); mostrarMensagem("");
  } catch (error) {
    console.error(error); el.estadoTabela.textContent = "Não foi possível carregar as demandas.";
    mostrarMensagem(mensagemErro(error,"Não foi possível consultar o backend."),"error");
  } finally { estado.carregando = false; }
}

function atrasada(d) { if (!d.prazo_em || d.ciclo_encerrado) return false; return new Date(d.prazo_em) < new Date(new Date().toDateString()); }
function atualizarResumo() {
  el.cardTotal.textContent = estado.demandas.length;
  el.cardPendentes.textContent = estado.demandas.filter(d=>d.codigo_status_ciclo==="PENDENTE_DE_TRATAMENTO").length;
  el.cardEmTratamento.textContent = estado.demandas.filter(d=>d.codigo_status_ciclo==="EM_TRATAMENTO").length;
  el.cardAtrasadas.textContent = estado.demandas.filter(atrasada).length;
}
function demandasFiltradas() {
  const busca=el.buscaInput.value.trim().toLowerCase(), papel=el.papelFiltro.value, status=el.statusFiltro.value;
  return estado.demandas.filter(d => {
    const processos=d.processos.map(p=>p.numero_processo).join(" ");
    const texto=`${d.id_indicio} ${d.id_ciclo_tratamento} ${d.codigo_status_ciclo} ${processos}`.toLowerCase();
    const card=estado.filtroCard==="TODAS" || (estado.filtroCard==="ATRASADAS"?atrasada(d):d.codigo_status_ciclo===estado.filtroCard);
    return card && (!busca || texto.includes(busca)) && (!papel || d.participacao?.codigo_papel===papel) && (!status || d.codigo_status_ciclo===status);
  });
}
function renderizarTabela() {
  const itens=demandasFiltradas(); el.resultadoResumo.textContent=`${itens.length} demanda(s) exibida(s)`;
  el.estadoTabela.hidden=Boolean(itens.length); if(!itens.length) el.estadoTabela.textContent="Nenhuma demanda encontrada para os filtros selecionados.";
  el.demandasTbody.innerHTML=itens.map(d=>{
    const principal=d.processos.find(p=>p.processo_principal) || d.processos[0];
    const proc=d.processos.length ? `<div class="process-stack"><span class="process-number">${escapeHtml(principal.numero_processo)}</span><small>${d.processos.length===1?"1 processo":`${d.processos.length} processos`}</small></div>` : '<span class="muted-text">Nenhum</span>';
    return `<tr><td><strong>#${escapeHtml(d.id_indicio)}</strong></td><td>${escapeHtml(d.numero_ciclo)}<br><small>ID ${escapeHtml(d.id_ciclo_tratamento)}</small></td><td>${proc}</td><td>${escapeHtml(d.participacao?.nome_papel || (somenteLeitura()?"Consulta":"Não identificado"))}</td><td><span class="badge">${escapeHtml(d.nome_status_ciclo || textoStatus(d.codigo_status_ciclo))}</span></td><td>${escapeHtml(d.nome_prioridade || "Não informada")}</td><td>${escapeHtml(formatarData(d.prazo_em))}</td><td><div class="action-row"><button class="btn btn-small" type="button" data-abrir="${d.id_ciclo_tratamento}">Visualizar</button></div></td></tr>`;
  }).join("");
}

function itemResumo(rotulo, valor){return `<div class="detail-item"><span>${escapeHtml(rotulo)}</span><strong>${escapeHtml(valor)}</strong></div>`;}
async function abrirDetalhe(idCiclo) {
  estado.selecionada=estado.demandas.find(d=>String(d.id_ciclo_tratamento)===String(idCiclo)); if(!estado.selecionada)return;
  el.detalheOverlay.hidden=false; document.body.classList.add("modal-open"); avisoModal(""); trocarAba("resumo");
  const d=estado.selecionada; el.detalheTitulo.textContent=`Demanda #${d.id_indicio}`; el.detalheSubtitulo.textContent=`Ciclo ${d.numero_ciclo} | ${d.nome_status_ciclo || textoStatus(d.codigo_status_ciclo)}`;
  el.resumoConteudo.innerHTML=[itemResumo("ID do tratamento",d.id_tratamento),itemResumo("ID do ciclo",d.id_ciclo_tratamento),itemResumo("Papel",d.participacao?.nome_papel || "Consulta gerencial"),itemResumo("Status",d.nome_status_ciclo || textoStatus(d.codigo_status_ciclo)),itemResumo("Prioridade",d.nome_prioridade || "Não informada"),itemResumo("Prazo",formatarData(d.prazo_em)),itemResumo("Versão do ciclo",d.versao),itemResumo("Processos SEI ativos",d.processos.length)].join("");
  renderizarTratamento(); renderizarProcessos(); await carregarHistorico();
}
function fecharDetalhe(){el.detalheOverlay.hidden=true;document.body.classList.remove("modal-open");estado.selecionada=null;}
function trocarAba(nome){document.querySelectorAll("[data-panel]").forEach(p=>p.hidden=p.dataset.panel!==nome);document.querySelectorAll("[data-tab]").forEach(b=>b.setAttribute("aria-selected",String(b.dataset.tab===nome)));}
function podeMovimentar(){const d=estado.selecionada;return d && !somenteLeitura() && d.participacao?.participacao_ativa;}
function renderizarTratamento(){const d=estado.selecionada, principal=d.participacao?.papel_principal===true;el.registroForm.hidden=true;el.encerramentoForm.hidden=true;
  if(somenteLeitura()){el.tratamentoAcoes.innerHTML='<p class="readonly-note">O Gestor de Dados e Sistema possui acesso temporário para consulta. As ações operacionais permanecem restritas ao operador participante.</p>';return;}
  let botoes="";
  if(d.codigo_status_ciclo==="PENDENTE_DE_TRATAMENTO" && principal) botoes='<button class="btn btn-primary" id="iniciarBtn" type="button">Iniciar tratamento</button>';
  if(d.codigo_status_ciclo==="EM_TRATAMENTO" && podeMovimentar()){botoes='<div class="action-row"><button class="btn" id="novoRegistroBtn" type="button">Registrar observação ou providência</button>'+(principal?'<button class="btn btn-danger" id="mostrarEncerramentoBtn" type="button">Concluir tratamento</button>':'')+'</div>';}
  el.tratamentoAcoes.innerHTML=botoes || '<p class="readonly-note">Não há ações disponíveis no status atual.</p>';
  $("iniciarBtn")?.addEventListener("click",iniciarTratamento); $("novoRegistroBtn")?.addEventListener("click",()=>el.registroForm.hidden=false); $("mostrarEncerramentoBtn")?.addEventListener("click",()=>el.encerramentoForm.hidden=false);
}
function renderizarProcessos(){const d=estado.selecionada;el.processoForm.hidden=!(podeMovimentar() && d.permite_movimentacao);el.processosLista.innerHTML=d.processos.length?d.processos.map(p=>`<article class="process-card"><div><strong class="process-number">${escapeHtml(p.numero_processo)}</strong> ${p.processo_principal?'<span class="badge badge-primary">Principal</span>':''}<p>${escapeHtml(p.assunto||"Sem assunto informado")}</p><small>Incluído em ${escapeHtml(formatarData(p.incluido_em))} | Versão ${escapeHtml(p.versao)}</small></div>${podeMovimentar()&&d.permite_movimentacao?`<div class="danger-zone"><button class="btn btn-danger btn-small" data-inativar="${p.id_processo_sei}" type="button">Inativar vínculo</button></div>`:""}</article>`).join(""):'<div class="empty-state">Nenhum processo SEI vinculado.</div>';
}
async function carregarHistorico(){el.historicoLista.innerHTML='<div class="loading-line">Carregando histórico...</div>';const d=estado.selecionada;const {data,error}=await supabase.schema("api").from("v_movimentacoes").select("*").eq("id_ciclo_tratamento",d.id_ciclo_tratamento).order("realizada_em",{ascending:false});if(error){el.historicoLista.innerHTML='<div class="empty-state">Não foi possível carregar o histórico.</div>';return;}el.historicoLista.innerHTML=(data||[]).length?(data||[]).map(m=>`<article class="timeline-item"><strong>${escapeHtml(m.nome_movimentacao||textoStatus(m.codigo_movimentacao))}</strong><p>${escapeHtml(m.descricao||"Sem descrição")}</p><small>${escapeHtml(formatarData(m.realizada_em))}</small></article>`).join(""):'<div class="empty-state">Sem movimentações registradas.</div>';}

async function executarAcao(acao){try{avisoModal("Processando...");await acao();avisoModal("Operação concluída com sucesso.","success");await carregarDados();if(estado.selecionada){const id=estado.selecionada.id_ciclo_tratamento;await abrirDetalhe(id);}}catch(e){console.error(e);avisoModal(mensagemErro(e,"Não foi possível concluir a operação."),"error");}}
async function iniciarTratamento(){const d=estado.selecionada;await executarAcao(async()=>{const {error}=await supabase.rpc("iniciar_tratamento_individual",{p_id_ciclo_tratamento:d.id_ciclo_tratamento,p_versao_esperada:d.versao,p_id_data_inicio:idDataHoje()});if(error)throw error;});}
async function registrarMovimentacao(ev){ev.preventDefault();const d=estado.selecionada, descricao=el.descricaoRegistro.value.trim(), nome=el.tipoRegistro.value==="PROVIDENCIA"?"registrar_providencia_individual":"registrar_observacao_individual";await executarAcao(async()=>{const {error}=await supabase.rpc(nome,{p_id_ciclo_tratamento:d.id_ciclo_tratamento,p_versao_esperada:d.versao,p_id_data_movimentacao:idDataHoje(),p_descricao:descricao,p_dados_complementares:{origem:"PAGINA_OPERADOR"}});if(error)throw error;el.registroForm.reset();});}
async function encerrarTratamento(ev){ev.preventDefault();const d=estado.selecionada;await executarAcao(async()=>{const {error}=await supabase.rpc("encerrar_tratamento_individual",{p_id_ciclo_tratamento:d.id_ciclo_tratamento,p_versao_esperada:d.versao,p_id_data_encerramento:idDataHoje(),p_resultado_encerramento:el.resultadoEncerramento.value.trim()});if(error)throw error;el.encerramentoForm.reset();});}
async function adicionarProcesso(ev){ev.preventDefault();const d=estado.selecionada;await executarAcao(async()=>{const {error}=await supabase.rpc("adicionar_processo_sei_individual",{p_id_ciclo_tratamento:d.id_ciclo_tratamento,p_versao_esperada:d.versao,p_id_data_inclusao:idDataHoje(),p_numero_processo:el.numeroProcesso.value.trim(),p_assunto:el.assuntoProcesso.value.trim()||null,p_observacao:el.observacaoProcesso.value.trim()||null,p_processo_principal:el.processoPrincipal.checked});if(error)throw error;el.processoForm.reset();});}
async function inativarProcesso(id){const p=estado.selecionada.processos.find(x=>String(x.id_processo_sei)===String(id));const motivo=prompt(`Informe a justificativa para inativar ${p?.numero_processo||"o processo"}:`);if(!motivo?.trim())return;const d=estado.selecionada;await executarAcao(async()=>{const {error}=await supabase.rpc("inativar_processo_sei_individual",{p_id_processo_sei:Number(id),p_versao_processo_esperada:p.versao,p_versao_ciclo_esperada:d.versao,p_id_data_inativacao:idDataHoje(),p_motivo_inativacao:motivo.trim()});if(error)throw error;});}

function ligarEventos(){el.sairBtn.addEventListener("click",async()=>{await supabase.auth.signOut();location.replace(CONFIG.LOGIN_URL);});el.atualizarBtn.addEventListener("click",carregarDados);el.temaBtn.addEventListener("click",()=>{const escuro=document.documentElement.dataset.theme==="dark";document.documentElement.dataset.theme=escuro?"light":"dark";localStorage.setItem("tema",escuro?"light":"dark");});[el.buscaInput,el.papelFiltro,el.statusFiltro].forEach(x=>x.addEventListener("input",renderizarTabela));document.querySelectorAll(".summary-card").forEach(b=>b.addEventListener("click",()=>{estado.filtroCard=b.dataset.status;document.querySelectorAll(".summary-card").forEach(x=>x.classList.toggle("is-active",x===b));renderizarTabela();}));el.demandasTbody.addEventListener("click",e=>{const b=e.target.closest("[data-abrir]");if(b)abrirDetalhe(b.dataset.abrir);});[el.fecharDetalheBtn,el.fecharRodapeBtn].forEach(b=>b.addEventListener("click",fecharDetalhe));el.detalheOverlay.addEventListener("click",e=>{if(e.target===el.detalheOverlay)fecharDetalhe();});document.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>trocarAba(b.dataset.tab)));el.registroForm.addEventListener("submit",registrarMovimentacao);el.encerramentoForm.addEventListener("submit",encerrarTratamento);el.processoForm.addEventListener("submit",adicionarProcesso);el.processosLista.addEventListener("click",e=>{const b=e.target.closest("[data-inativar]");if(b)inativarProcesso(b.dataset.inativar);});}

async function init(){try{document.documentElement.dataset.theme=localStorage.getItem("tema")||"light";ligarEventos();await carregarContexto();await carregarDados();}catch(e){if(!["SESSAO_AUSENTE","PERFIL_NAO_AUTORIZADO"].includes(e.message)){console.error(e);mostrarMensagem(mensagemErro(e,"Não foi possível iniciar a página."),"error");}}}
init();
