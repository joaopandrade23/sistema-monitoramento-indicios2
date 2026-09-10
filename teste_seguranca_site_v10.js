/*
 * Bateria unica de seguranca nao destrutiva - Frontend v10
 *
 * Publicacao:
 *   Coloque este arquivo na mesma pasta de demandas.html e demandas.js.
 *
 * Execucao:
 *   await import("./teste_seguranca_site_v10.js?" + Date.now())
 *
 * Escopo seguro:
 *   - nao executa operacao valida de gravacao;
 *   - testa sessao, contexto, exposicao DOM e validacoes negativas;
 *   - fotografa a demanda 1933 antes e depois;
 *   - nao encerra a sessao atual;
 *   - nao testa concorrencia destrutiva nem efetua redistribuicao.
 */

const CONFIG_TESTE = Object.freeze({
  idIndicio: 1933,
  idPrincipal: 24,
  idOutroOperador: 25,
  idInexistente: 999999999,
  justificativaValida: "Teste de seguranca nao destrutivo.",
  timeoutMs: 20000
});

const inicio = new Date().toISOString();
const resultado = {
  inicio,
  ambiente: {
    origem: location.origin,
    caminho: location.pathname,
    protocolo: location.protocol
  },
  verificacoes: [],
  respostasNegativas: [],
  estadoAntes: null,
  estadoDepois: null,
  resumo: null,
  erroFatal: null
};

function registrar(nome, aprovado, detalhe = "") {
  const item = { nome, aprovado: Boolean(aprovado), detalhe };
  resultado.verificacoes.push(item);
  console[aprovado ? "log" : "warn"](`${aprovado ? "✅" : "⚠️"} ${nome}`, detalhe);
  return item.aprovado;
}

function normalizarErro(error) {
  if (!error) return null;
  return {
    message: error.message || String(error),
    code: error.code || null,
    details: error.details || null,
    hint: error.hint || null,
    status: error.status || null
  };
}

function assinaturaEstado(dados) {
  return {
    idIndicio: Number(dados?.id_indicio),
    idTratamento: Number(dados?.id_tratamento),
    idCiclo: Number(dados?.id_ciclo_tratamento),
    versaoCiclo: Number(dados?.versao_ciclo),
    principal: Number(dados?.operador_principal?.id_usuario),
    modo: dados?.modo_trabalho?.codigo || null,
    status: dados?.codigo_status_ciclo || null,
    prioridade: dados?.codigo_prioridade || null,
    prazo: dados?.prazo_em || null,
    colaboradores: (dados?.colaboradores || [])
      .filter((x) => x.participacao_ativa === true)
      .map((x) => Number(x.id_usuario))
      .sort((a, b) => a - b),
    quantidadeColaboradores: Number(dados?.quantidade_colaboradores),
    quantidadeParticipantes: Number(dados?.quantidade_participantes_ativos)
  };
}

async function rpcNegativa(cliente, nomeTeste, funcao, parametros, mensagensAceitas) {
  const { data, error } = await cliente.rpc(funcao, parametros);
  const erro = normalizarErro(error);
  const texto = `${erro?.message || ""} ${erro?.details || ""}`.toUpperCase();
  const recusada = Boolean(error) && mensagensAceitas.some((x) => texto.includes(x));

  resultado.respostasNegativas.push({
    teste: nomeTeste,
    funcao,
    recusada,
    erro,
    dataRecebida: data !== null && data !== undefined
  });

  registrar(nomeTeste, recusada, erro?.message || "A chamada nao foi recusada como esperado.");
  return recusada;
}

async function executar() {
  console.group("Bateria unica de seguranca nao destrutiva - v10");

  try {
    registrar("HTTPS ativo", location.protocol === "https:", location.protocol);

    const scriptDemandas = [...document.scripts].find((s) => s.src.includes("demandas.js"));
    if (!scriptDemandas) throw new Error("SCRIPT_DEMANDAS_NAO_LOCALIZADO");

    const urlSupabase = new URL("./supabase.js", scriptDemandas.src).href;
    const modulo = await import(urlSupabase);
    const cliente = modulo.supabase;
    if (!cliente) throw new Error("CLIENTE_SUPABASE_NAO_EXPORTADO");

    const { data: sessaoData, error: erroSessao } = await cliente.auth.getSession();
    if (erroSessao) throw erroSessao;
    registrar("Sessao autenticada", Boolean(sessaoData?.session), sessaoData?.session?.user?.id || "sem sessao");

    const { data: contexto, error: erroContexto } = await cliente
      .from("v_meu_contexto")
      .select("id_usuario,codigo_perfil,nome_perfil")
      .limit(2);
    if (erroContexto) throw erroContexto;

    registrar("Contexto funcional unico", Array.isArray(contexto) && contexto.length === 1, `${contexto?.length || 0} registro(s)`);
    registrar(
      "Perfil administrativo autorizado",
      ["GESTOR_DADOS_SISTEMA", "GESTOR_SEGEP_CE"].includes(contexto?.[0]?.codigo_perfil),
      contexto?.[0]?.codigo_perfil || "perfil ausente"
    );

    // Procura segredos administrativos expostos no DOM e scripts inline.
    const conteudoPublico = `${document.documentElement.innerHTML}\n${[...document.scripts].map((s) => s.textContent || "").join("\n")}`;
    const padroesCriticos = [
      /service[_-]?role/i,
      /SUPABASE_SERVICE_ROLE/i,
      /postgres(?:ql)?:\/\//i,
      /BEGIN PRIVATE KEY/i
    ];
    const achadosCriticos = padroesCriticos.filter((re) => re.test(conteudoPublico)).map(String);
    registrar("Nenhum segredo administrativo evidente no DOM", achadosCriticos.length === 0, achadosCriticos.join(", ") || "nenhum padrao critico encontrado");

    // Verifica se a pagina evita handlers inline, que ampliam superficie de XSS.
    const handlersInline = [...document.querySelectorAll("*")]
      .flatMap((el) => [...el.attributes].filter((a) => /^on/i.test(a.name)).map((a) => `${el.tagName}.${a.name}`));
    registrar("Sem handlers JavaScript inline", handlersInline.length === 0, handlersInline.slice(0, 10).join(", ") || "nenhum");

    // Fotografa o estado antes.
    const antes = await cliente.rpc("obter_detalhes_demanda_modo", { p_id_indicio: CONFIG_TESTE.idIndicio });
    if (antes.error) throw antes.error;
    resultado.estadoAntes = assinaturaEstado(antes.data);
    registrar("Demanda de controle localizada", resultado.estadoAntes.idIndicio === CONFIG_TESTE.idIndicio, JSON.stringify(resultado.estadoAntes));

    // Chamadas invalidas. Nenhuma delas deve produzir alteracao valida.
    await rpcNegativa(
      cliente,
      "Redistribuicao recusa responsaveis iguais",
      "redistribuir_demandas_lote",
      {
        p_criterio: "CPF",
        p_id_tipo_indicio: null,
        p_cpf: antes.data.cpf,
        p_id_responsavel_atual: CONFIG_TESTE.idPrincipal,
        p_id_novo_responsavel: CONFIG_TESTE.idPrincipal,
        p_manter_anterior_como_colaborador: false,
        p_justificativa: CONFIG_TESTE.justificativaValida,
        p_limite_resultados: 1,
        p_politica_bloqueios: "EXIGIR_TODAS_ELEGIVEIS"
      },
      ["RESPONSAVEL", "IGUAL", "MESMO", "NOVO_RESPONSAVEL"]
    );

    await rpcNegativa(
      cliente,
      "Redistribuicao recusa justificativa em branco",
      "redistribuir_demandas_lote",
      {
        p_criterio: "CPF",
        p_id_tipo_indicio: null,
        p_cpf: antes.data.cpf,
        p_id_responsavel_atual: CONFIG_TESTE.idPrincipal,
        p_id_novo_responsavel: CONFIG_TESTE.idOutroOperador,
        p_manter_anterior_como_colaborador: false,
        p_justificativa: "   ",
        p_limite_resultados: 1,
        p_politica_bloqueios: "EXIGIR_TODAS_ELEGIVEIS"
      },
      ["JUSTIFICATIVA"]
    );

    await rpcNegativa(
      cliente,
      "Inclusao recusa principal como colaborador",
      "incluir_colaboradores_ciclo",
      {
        p_id_indicio: CONFIG_TESTE.idIndicio,
        p_ids_usuarios_colaboradores: [CONFIG_TESTE.idPrincipal]
      },
      ["PRINCIPAL", "COLABORADOR"]
    );

    await rpcNegativa(
      cliente,
      "Inclusao recusa lista duplicada",
      "incluir_colaboradores_ciclo",
      {
        p_id_indicio: CONFIG_TESTE.idIndicio,
        p_ids_usuarios_colaboradores: [CONFIG_TESTE.idOutroOperador, CONFIG_TESTE.idOutroOperador]
      },
      ["DUPLICAD"]
    );

    await rpcNegativa(
      cliente,
      "Inclusao recusa usuario inexistente",
      "incluir_colaboradores_ciclo",
      {
        p_id_indicio: CONFIG_TESTE.idIndicio,
        p_ids_usuarios_colaboradores: [CONFIG_TESTE.idInexistente]
      },
      ["NAO_DISPONIVEL", "COLABORADOR", "USUARIO"]
    );

    await rpcNegativa(
      cliente,
      "Remocao recusa o principal",
      "remover_colaborador_ciclo",
      {
        p_id_indicio: CONFIG_TESTE.idIndicio,
        p_id_usuario_colaborador: CONFIG_TESTE.idPrincipal,
        p_justificativa: CONFIG_TESTE.justificativaValida
      },
      ["PRINCIPAL", "COLABORADOR"]
    );

    await rpcNegativa(
      cliente,
      "Remocao recusa usuario inexistente",
      "remover_colaborador_ciclo",
      {
        p_id_indicio: CONFIG_TESTE.idIndicio,
        p_id_usuario_colaborador: CONFIG_TESTE.idInexistente,
        p_justificativa: CONFIG_TESTE.justificativaValida
      },
      ["NAO_LOCALIZADO", "COLABORADOR"]
    );

    // Fotografa novamente e exige equivalencia total do estado operacional.
    const depois = await cliente.rpc("obter_detalhes_demanda_modo", { p_id_indicio: CONFIG_TESTE.idIndicio });
    if (depois.error) throw depois.error;
    resultado.estadoDepois = assinaturaEstado(depois.data);

    const antesComparavel = { ...resultado.estadoAntes };
    const depoisComparavel = { ...resultado.estadoDepois };
    // Tentativas recusadas nao devem incrementar a versao do ciclo.
    const estadoIdentico = JSON.stringify(antesComparavel) === JSON.stringify(depoisComparavel);
    registrar("Estado operacional permaneceu identico", estadoIdentico, estadoIdentico ? "nenhuma alteracao" : JSON.stringify({ antesComparavel, depoisComparavel }));

    // Verifica se mensagens de erro nao entregam stack SQL ou corpo de funcao.
    const erros = resultado.respostasNegativas.map((x) => x.erro).filter(Boolean);
    const vazamentoInterno = erros.some((e) => {
      const texto = `${e.message || ""} ${e.details || ""} ${e.hint || ""}`;
      return /PL\/pgSQL function|SQL statement|QUERY:|CONTEXT:/i.test(texto);
    });
    registrar("Erros nao expõem contexto SQL detalhado", !vazamentoInterno, vazamentoInterno ? "foi encontrado detalhamento interno" : "mensagens controladas");

    const obrigatorias = resultado.verificacoes.filter((x) => ![
      "Sem handlers JavaScript inline"
    ].includes(x.nome));

    resultado.resumo = {
      total: resultado.verificacoes.length,
      aprovadas: resultado.verificacoes.filter((x) => x.aprovado).length,
      alertas: resultado.verificacoes.filter((x) => !x.aprovado).length,
      testesNegativos: resultado.respostasNegativas.length,
      testesNegativosRecusados: resultado.respostasNegativas.filter((x) => x.recusada).length,
      estadoPreservado: estadoIdentico,
      aprovado: obrigatorias.every((x) => x.aprovado) && estadoIdentico
    };

    console.table(resultado.verificacoes);
    console.table(resultado.respostasNegativas.map((x) => ({
      teste: x.teste,
      recusada: x.recusada,
      codigo: x.erro?.code,
      mensagem: x.erro?.message
    })));
    console.table(resultado.resumo);
    console.log(
      resultado.resumo.aprovado
        ? "✅ BATERIA DE SEGURANCA APROVADA PARA O ESCOPO NAO DESTRUTIVO."
        : "⚠️ BATERIA CONCLUIDA COM ALERTAS. Revise os itens reprovados."
    );
  } catch (erro) {
    resultado.erroFatal = normalizarErro(erro) || { message: String(erro) };
    resultado.resumo = {
      total: resultado.verificacoes.length,
      aprovadas: resultado.verificacoes.filter((x) => x.aprovado).length,
      alertas: resultado.verificacoes.filter((x) => !x.aprovado).length + 1,
      aprovado: false
    };
    console.error("❌ Falha fatal na bateria de seguranca:", erro);
  } finally {
    resultado.fim = new Date().toISOString();
    window.resultadoTesteSegurancaV10 = resultado;
    console.log("Resultado salvo em window.resultadoTesteSegurancaV10:", resultado);
    console.groupEnd();
  }

  return resultado;
}

const execucao = await executar();
export { executar, execucao };
export default execucao;
