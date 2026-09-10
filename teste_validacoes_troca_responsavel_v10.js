/*
 * Teste das validacoes do formulario Trocar responsavel - Frontend v10
 *
 * Publicacao:
 *   Coloque este arquivo na mesma pasta de demandas.html e demandas.js.
 *
 * Execucao no Console:
 *   await import("./teste_validacoes_troca_responsavel_v10.js?" + Date.now())
 *
 * Seguranca:
 *   - abre os modais pela interface;
 *   - testa tentativas invalidas;
 *   - intercepta chamadas RPC de gravacao como camada adicional de seguranca;
 *   - nao executa redistribuicao valida;
 *   - nao altera participacoes, ciclos ou responsaveis.
 */

const ID_INDICIO = 1933;
const IDENTIFICADOR_INDICIO = "4977161";

const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function aguardar(verificacao, descricao, limiteMs = 15000) {
  const inicio = Date.now();
  while (Date.now() - inicio < limiteMs) {
    if (verificacao()) return true;
    await esperar(120);
  }
  throw new Error(`TEMPO_ESGOTADO: ${descricao}`);
}

const porId = (id) => document.getElementById(id);
const visivel = (elemento) => Boolean(elemento && !elemento.hidden && elemento.offsetParent !== null);

function localizarBotaoVisualizar() {
  const direto = document.querySelector(`[data-visualizar="${ID_INDICIO}"]`);
  if (direto) return direto;

  const linha = [...document.querySelectorAll("tbody tr")].find((item) => {
    const texto = item.textContent || "";
    return texto.includes(String(ID_INDICIO)) || texto.includes(IDENTIFICADOR_INDICIO);
  });

  if (!linha) return null;
  return linha.querySelector("[data-visualizar]") ||
    [...linha.querySelectorAll("button")].find((botao) => /visualizar|detalhes/i.test(botao.textContent || "")) ||
    null;
}

function fecharModais() {
  if (porId("equipeOverlay") && !porId("equipeOverlay").hidden) {
    porId("cancelarEquipeBtn")?.click();
  }
  if (porId("atribuicaoOverlay") && !porId("atribuicaoOverlay").hidden) {
    porId("cancelarModalBtn")?.click();
  }
}

function limparFormulario() {
  porId("equipeNovoPrincipalSelect").value = "";
  porId("equipeManterAnteriorCheck").checked = false;
  porId("equipeRedistribuicaoJustificativa").value = "";
  porId("equipeAviso").hidden = true;
}

async function executarTesteValidacoesTroca() {
  const relatorio = {
    estruturaHtmlValida: false,
    demandaLocalizada: false,
    modalEquipeAberto: false,
    abaTrocarAberta: false,
    colaboradorDisponivelComoNovoPrincipal: false,
    bloqueouSemNovoResponsavel: false,
    bloqueouJustificativaVazia: false,
    bloqueouJustificativaCurta: false,
    manteveAnteriorDisponivel: false,
    nenhumaRpcGravacaoExecutada: false,
    nenhumEstadoAtivoAlterado: false,
    modaisFechados: false,
    aprovado: false
  };

  const resultado = {
    relatorio,
    mensagensCapturadas: [],
    tentativasRpcGravacao: [],
    estadoAntes: null,
    estadoDepois: null,
    erro: null
  };

  const ids = [
    "atribuicaoOverlay", "cancelarModalBtn", "gerenciarEquipeBtn",
    "equipeOverlay", "cancelarEquipeBtn", "equipeAbaRedistribuir",
    "equipePainelRedistribuir", "equipeNovoPrincipalSelect",
    "equipeManterAnteriorCheck", "equipeRedistribuicaoJustificativa",
    "redistribuirIndividualBtn", "equipeAviso"
  ];

  console.group(`Teste das validacoes de troca de responsavel - demanda ${ID_INDICIO}`);

  try {
    const ausentes = ids.filter((id) => !porId(id));
    if (ausentes.length) throw new Error(`HTML_INCOMPATIVEL: ${ausentes.join(", ")}`);
    relatorio.estruturaHtmlValida = true;

    fecharModais();
    await esperar(250);

    const botaoVisualizar = localizarBotaoVisualizar();
    if (!botaoVisualizar) {
      throw new Error(`DEMANDA_NAO_LOCALIZADA: pesquise por ${IDENTIFICADOR_INDICIO} e execute novamente.`);
    }
    relatorio.demandaLocalizada = true;

    // Importa o cliente apenas para fotografar o estado antes e depois.
    const scriptDemandas = [...document.scripts].find((script) => script.src.includes("demandas.js"));
    if (!scriptDemandas) throw new Error("SCRIPT_DEMANDAS_NAO_LOCALIZADO");
    const { supabase: cliente } = await import(new URL("./supabase.js", scriptDemandas.src).href);

    const consultaAntes = await cliente.rpc("obter_detalhes_demanda_modo", { p_id_indicio: ID_INDICIO });
    if (consultaAntes.error) throw consultaAntes.error;
    resultado.estadoAntes = consultaAntes.data;

    botaoVisualizar.click();
    await aguardar(() => porId("atribuicaoOverlay").hidden === false, "abertura dos detalhes");
    await aguardar(() => porId("gerenciarEquipeBtn").hidden === false, "carregamento do gerenciamento");
    porId("gerenciarEquipeBtn").click();
    await aguardar(() => porId("equipeOverlay").hidden === false, "abertura do modal de equipe");
    relatorio.modalEquipeAberto = true;

    porId("equipeAbaRedistribuir").click();
    await aguardar(() => porId("equipePainelRedistribuir").hidden === false, "abertura da aba Trocar responsavel");
    relatorio.abaTrocarAberta = visivel(porId("equipePainelRedistribuir"));

    relatorio.colaboradorDisponivelComoNovoPrincipal = [...porId("equipeNovoPrincipalSelect").options]
      .some((opcao) => Number(opcao.value) === 25);
    relatorio.manteveAnteriorDisponivel = visivel(porId("equipeManterAnteriorCheck")) &&
      !porId("equipeManterAnteriorCheck").disabled;

    // Camada adicional: intercepta chamadas de gravacao disparadas pela interface durante o teste.
    const rpcOriginal = cliente.rpc.bind(cliente);
    const rpcBloqueado = new Set(["redistribuir_demandas_lote"]);
    cliente.rpc = async (nome, parametros) => {
      if (rpcBloqueado.has(nome)) {
        resultado.tentativasRpcGravacao.push({ nome, parametros });
        return { data: null, error: new Error("RPC_DE_GRAVACAO_BLOQUEADA_PELO_TESTE") };
      }
      return rpcOriginal(nome, parametros);
    };

    const capturarAviso = async () => {
      await esperar(250);
      const texto = porId("equipeAviso").textContent.trim();
      resultado.mensagensCapturadas.push(texto);
      return texto;
    };

    // Cenario 1: nenhum novo responsavel e justificativa vazia.
    limparFormulario();
    porId("redistribuirIndividualBtn").click();
    const msgSemResponsavel = await capturarAviso();
    relatorio.bloqueouSemNovoResponsavel = /selecione o novo responsavel/i.test(
      msgSemResponsavel.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    );

    // Cenario 2: responsavel selecionado e justificativa vazia.
    limparFormulario();
    porId("equipeNovoPrincipalSelect").value = "25";
    porId("redistribuirIndividualBtn").click();
    const msgJustificativaVazia = await capturarAviso();
    relatorio.bloqueouJustificativaVazia = /justificativa.*10 caracteres/i.test(
      msgJustificativaVazia.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    );

    // Cenario 3: responsavel selecionado e justificativa curta.
    limparFormulario();
    porId("equipeNovoPrincipalSelect").value = "25";
    porId("equipeRedistribuicaoJustificativa").value = "curta";
    porId("redistribuirIndividualBtn").click();
    const msgJustificativaCurta = await capturarAviso();
    relatorio.bloqueouJustificativaCurta = /justificativa.*10 caracteres/i.test(
      msgJustificativaCurta.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    );

    // Nenhum cenario usa justificativa valida. A RPC de gravacao nao deve sequer ser tentada.
    relatorio.nenhumaRpcGravacaoExecutada = resultado.tentativasRpcGravacao.length === 0;

    limparFormulario();
    porId("cancelarEquipeBtn").click();
    await aguardar(() => porId("equipeOverlay").hidden === true, "fechamento do modal de equipe");
    porId("cancelarModalBtn").click();
    await aguardar(() => porId("atribuicaoOverlay").hidden === true, "fechamento dos detalhes");
    relatorio.modaisFechados = true;

    const consultaDepois = await rpcOriginal("obter_detalhes_demanda_modo", { p_id_indicio: ID_INDICIO });
    if (consultaDepois.error) throw consultaDepois.error;
    resultado.estadoDepois = consultaDepois.data;

    const antes = resultado.estadoAntes;
    const depois = resultado.estadoDepois;
    const colabsAntes = (antes.colaboradores || []).map((x) => Number(x.id_usuario)).sort();
    const colabsDepois = (depois.colaboradores || []).map((x) => Number(x.id_usuario)).sort();

    relatorio.nenhumEstadoAtivoAlterado =
      Number(antes.operador_principal?.id_usuario) === Number(depois.operador_principal?.id_usuario) &&
      antes.modo_trabalho?.codigo === depois.modo_trabalho?.codigo &&
      Number(antes.quantidade_colaboradores) === Number(depois.quantidade_colaboradores) &&
      Number(antes.quantidade_participantes_ativos) === Number(depois.quantidade_participantes_ativos) &&
      JSON.stringify(colabsAntes) === JSON.stringify(colabsDepois);

    relatorio.aprovado = Object.entries(relatorio)
      .filter(([chave]) => chave !== "aprovado")
      .every(([, valor]) => valor === true);

    console.log("Mensagens capturadas:");
    console.table(resultado.mensagensCapturadas.map((mensagem, indice) => ({ cenario: indice + 1, mensagem })));
    console.table(relatorio);
    console.log(
      relatorio.aprovado
        ? "✅ TESTE DAS VALIDACOES APROVADO. Nenhuma redistribuicao foi executada."
        : "⚠️ TESTE CONCLUIDO COM VALIDACOES NEGATIVAS. Consulte o relatorio."
    );
  } catch (erro) {
    resultado.erro = { nome: erro?.name, mensagem: erro?.message, stack: erro?.stack };
    relatorio.aprovado = false;
    console.error("❌ Erro no teste das validacoes:", erro);
    console.table(relatorio);
    fecharModais();
  } finally {
    window.resultadoTesteValidacoesTrocaV10 = resultado;
    console.log("Resultado salvo em window.resultadoTesteValidacoesTrocaV10:", resultado);
    console.groupEnd();
  }

  return resultado;
}

const resultado = await executarTesteValidacoesTroca();
export { executarTesteValidacoesTroca, resultado };
export default resultado;
