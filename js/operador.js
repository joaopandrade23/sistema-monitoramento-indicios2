"use strict";

/* ==========================================================================
   Painel do Operador - Sistema de Monitoramento de Indícios
   Código Principal Integrado com Melhorias v11
   ========================================================================== */

// Mapeamentos Amigáveis de Códigos para Rótulos no Painel
const prazoLabels = {
  ATRASADA: "Prazo vencido",
  ATRASADAS: "Prazo vencido",
  VENCE_HOJE: "Vence hoje",
  VENCEM_HOJE: "Vence hoje",
  ATE_3_DIAS: "Vence em até 3 dias",
  ATE_7_DIAS: "Vence em até 7 dias",
  NO_PRAZO: "Prazo confortável",
  ACIMA_7_DIAS: "Vence após 7 dias",
  SEM_PRAZO: "Sem prazo definido"
};

const statusLabels = {
  PENDENTE_DE_TRATAMENTO: "Aguardando início",
  EM_TRATAMENTO: "Em tratamento",
  ENCERRADO_INTERNAMENTE: "Tratamento encerrado",
  AGUARDANDO_VALIDACAO_TCU: "Aguardando validação do TCU",
  VALIDADO_TCU: "Validado pelo TCU"
};

const activityLabels = {
  INICIO_TRATAMENTO: "Tratamentos iniciados",
  OBSERVACAO: "Observações registradas",
  PROVIDENCIA: "Providências adotadas",
  VINCULO_PROCESSO_SEI: "Processos SEI vinculados",
  INATIVACAO_PROCESSO_SEI: "Processos SEI inativados",
  ALTERACAO_PROCESSO_SEI_PRINCIPAL: "Alterações de processo principal",
  ENCERRAMENTO_INTERNO: "Tratamentos encerrados"
};

const normalize = s => String(s || "").trim().toUpperCase().replaceAll(" ", "_");
function friendly(raw, map) {
  const key = normalize(raw);
  return map[key] || raw;
}

// Estado Global da Aplicação
const appState = {
  usuario: null,
  demandas: [],
  demandasFiltradas: [],
  demandaSelecionada: null,
  paginacao: { pagina: 1, limite: 10 },
  filtros: { busca: '', status: '', prazo: '', tipo: '' },
  periodoPainel: { inicio: '', fim: '' }
};

// Configurações de datas padrão no Painel
function setupDefaultDates() {
  const hoje = new Date();
  const trintaDiasAtras = new Date();
  trintaDiasAtras.setDate(hoje.getDate() - 30);

  const fmt = d => d.toISOString().split('T')[0];
  const inpStart = document.getElementById('painelInicio');
  const inpEnd = document.getElementById('painelFim');

  if (inpStart && !inpStart.value) inpStart.value = fmt(trintaDiasAtras);
  if (inpEnd && !inpEnd.value) inpEnd.value = fmt(hoje);

  appState.periodoPainel.inicio = inpStart?.value || fmt(trintaDiasAtras);
  appState.periodoPainel.fim = inpEnd?.value || fmt(hoje);
}

// Funções de Refinamento e Formatação visual
function refineText() {
  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.innerHTML = '<span class="action-icon-slot" aria-hidden="true"></span><span>Detalhes</span>';
    btn.setAttribute('aria-label', 'Abrir detalhes da demanda');
  });
  document.querySelectorAll('.deadline-cell small').forEach(el => {
    el.textContent = friendly(el.textContent, prazoLabels);
  });
  document.querySelectorAll('#graficoPrazos .bar-label').forEach(el => {
    el.textContent = friendly(el.textContent, prazoLabels);
  });
  document.querySelectorAll('#graficoStatus .bar-label').forEach(el => {
    el.textContent = friendly(el.textContent, statusLabels);
  });
  document.querySelectorAll('#graficoAtividades .bar-label').forEach(el => {
    el.textContent = friendly(el.textContent, activityLabels);
  });
}

function refineHeadings() {
  const replacements = new Map([
    ['Situação da carga atual', 'Situação das minhas demandas'],
    ['Somente participações ativas.', 'Demandas atualmente atribuídas a você.'],
    ['Situação dos prazos', 'Atenção aos prazos'],
    ['Distribuição das demandas ativas.', 'Organização das demandas por vencimento.'],
    ['Conclusões no período', 'Demandas concluídas no período'],
    ['Evolução diária das entregas.', 'Quantidade de tratamentos encerrados por dia.'],
    ['Tipos de indício', 'Principais tipos de indício'],
    ['Tipos presentes na carga atual.', 'Composição das demandas atualmente atribuídas.'],
    ['Atividades realizadas', 'Registros realizados no período'],
    ['Movimentações efetuadas no período.', 'Observações, providências e demais ações registradas.'],
    ['Total no escopo', 'Total de demandas'],
    ['Resultados encontrados', 'No grupo selecionado'],
    ['Participações anteriores', 'Histórico de participações']
  ]);
  document.querySelectorAll('h2,p,span,small,strong,.main-tab').forEach(el => {
    const next = replacements.get(el.textContent.trim());
    if (next) el.textContent = next;
  });
  const metrics = document.querySelectorAll('#metricasPainel .metric span');
  ['Aguardando início', 'Em análise', 'Prazo próximo', 'Prazo vencido', 'Concluídas no período', 'Tempo médio de tratamento'].forEach((t, i) => {
    if (metrics[i]) metrics[i].textContent = t;
  });
}

function addDateAxis() {
  const area = document.getElementById('graficoConclusoes');
  if (!area) return;
  const chart = area.querySelector('.line-chart');
  if (!chart || chart.dataset.datesAdded) return;
  const periodStart = document.getElementById('painelInicio')?.value;
  const periodEnd = document.getElementById('painelFim')?.value;
  const cols = [...chart.children];
  if (!cols.length || !periodStart || !periodEnd) return;

  chart.dataset.datesAdded = 'true';
  chart.classList.add('daily-axis');
  const start = new Date(periodStart + 'T12:00:00');
  const end = new Date(periodEnd + 'T12:00:00');
  const step = Math.max(1, Math.ceil(cols.length / 7));

  cols.forEach((col, i) => {
    col.classList.add('daily-column-wrap');
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    if (i % step === 0 || i === cols.length - 1) {
      const time = document.createElement('time');
      time.textContent = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      col.appendChild(time);
    }
  });
}

// Geração de Relatório PDF para Impressão
function buildPrintableReport() {
  const number = document.getElementById('mNumero')?.textContent || '';
  const name = document.getElementById('mNome')?.textContent || '';
  const cpf = document.getElementById('mCpf')?.textContent || '';
  const status = document.getElementById('mStatus')?.textContent || '';

  const rows = [...document.querySelectorAll('#historyList .timeline-item')].map(x => ({
    title: x.querySelector('strong')?.textContent || 'Movimentação',
    date: x.querySelector('time')?.textContent || '',
    description: x.querySelector('p')?.textContent || 'Sem descrição.'
  }));

  if (!rows.length) return null;

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Relatório do histórico - ${number}</title>
  <style>
    @page { size: A4; margin: 18mm; }
    * { box-sizing: border-box; }
    body { font: 11pt Arial, sans-serif; color: #172033; margin: 0; }
    h1 { font-size: 20pt; color: #155eef; margin: 0 0 4px; }
    .sub { color: #667085; margin-bottom: 18px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 14px; background: #f5f7fb; border: 1px solid #d0d5dd; border-radius: 8px; }
    .meta span { display: block; font-size: 8pt; color: #667085; text-transform: uppercase; }
    .count { margin: 18px 0 10px; font-weight: bold; }
    article { padding: 12px 14px; margin: 8px 0; border: 1px solid #d0d5dd; border-left: 5px solid #155eef; border-radius: 6px; page-break-inside: avoid; }
    header { display: flex; justify-content: space-between; gap: 12px; }
    time { font-size: 9pt; color: #667085; }
    p { line-height: 1.45; }
    .foot { margin-top: 18px; padding-top: 8px; border-top: 1px solid #d0d5dd; color: #667085; font-size: 8pt; }
  </style>
</head>
<body>
  <h1>Relatório breve do histórico</h1>
  <div class="sub">Registros exibidos no histórico da demanda</div>
  <section class="meta">
    <div><span>Indício</span><b>${number}</b></div>
    <div><span>Situação</span><b>${status}</b></div>
    <div><span>Pessoa</span><b>${name}</b></div>
    <div><span>CPF</span><b>${cpf}</b></div>
    <div><span>Gerado em</span><b>${new Date().toLocaleString('pt-BR')}</b></div>
  </section>
  <div class="count">${rows.length} registro(s)</div>
  ${rows.map(r => `<article><header><b>${r.title}</b><time>${r.date}</time></header><p>${r.description}</p></article>`).join('')}
  <div class="foot">Documento gerado pelo Sistema de Monitoramento de Indícios. Na caixa de impressão, selecione "Salvar como PDF".</div>
</body>
</html>`;
}

// Interceptação e Impressão de PDF via iframe Oculto
document.addEventListener('click', e => {
  const btn = e.target.closest('#exportPdf');
  if (!btn) return;
  e.preventDefault();
  e.stopImmediatePropagation();

  const html = buildPrintableReport();
  if (!html) return;

  const frame = document.createElement('iframe');
  frame.setAttribute('aria-hidden', 'true');
  frame.style.cssText = 'position:fixed;width:1px;height:1px;border:0;right:0;bottom:0';
  document.body.appendChild(frame);

  frame.contentDocument.open();
  frame.contentDocument.write(html);
  frame.contentDocument.close();

  setTimeout(() => {
    frame.contentWindow.focus();
    frame.contentWindow.print();
    setTimeout(() => frame.remove(), 2000);
  }, 400);
}, true);

// Renderização da Tabela de Demandas
function renderTable() {
  const tbody = document.getElementById('corpoTabela');
  if (!tbody) return;

  const { pagina, limite } = appState.paginacao;
  const inicio = (pagina - 1) * limite;
  const items = appState.demandasFiltradas.slice(inicio, inicio + limite);

  if (items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center py-4">Nenhuma demanda encontrada.</td></tr>';
    document.getElementById('contagemResultados').textContent = 'Exibindo 0 demandas';
    return;
  }

  tbody.innerHTML = items.map(d => {
    const statusTxt = friendly(d.status || '', statusLabels);
    const prazoTxt = friendly(d.prazoStatus || '', prazoLabels);
    let badgeClass = 'badge-pending';
    if (d.status === 'EM_TRATAMENTO') badgeClass = 'badge-in-progress';
    if (d.status === 'ENCERRADO_INTERNAMENTE' || d.status === 'VALIDADO_TCU') badgeClass = 'badge-done';

    return `
      <tr>
        <td><strong>${d.numero || d.id || '-'}</strong></td>
        <td>
          <div>${d.nomePessoa || '-'}</div>
          <small class="text-muted">${d.cpfPessoa || '-'}</small>
        </td>
        <td>${d.tipoIndicio || '-'}</td>
        <td><span class="badge ${badgeClass}">${statusTxt}</span></td>
        <td class="deadline-cell">
          <div>${d.prazoLimite ? new Date(d.prazoLimite).toLocaleDateString('pt-BR') : '-'}</div>
          <small>${prazoTxt}</small>
        </td>
        <td class="text-right">
          <button type="button" class="btn btn-secondary btn-sm" data-view="${d.id}">
            <span class="action-icon-slot" aria-hidden="true"></span>
            <span>Detalhes</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');

  document.getElementById('contagemResultados').textContent = `Exibindo ${items.length} de ${appState.demandasFiltradas.length} demandas`;
}

// Event Handler do Formulário de Ação
const formAcao = document.getElementById('formAcao');
if (formAcao) {
  const selectTipo = document.getElementById('tipoAcao');
  const groupSei = document.getElementById('groupProcessoSei');

  selectTipo?.addEventListener('change', e => {
    if (e.target.value === 'VINCULO_PROCESSO_SEI' || e.target.value === 'ALTERACAO_PROCESSO_SEI_PRINCIPAL') {
      groupSei?.classList.remove('hidden');
    } else {
      groupSei?.classList.add('hidden');
    }
  });
}

// Gerenciamento de Abas Principais
document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));

    btn.classList.add('active');
    const tabId = btn.getAttribute('data-tab');
    document.getElementById(tabId)?.classList.add('active');
  });
});

// Gerenciamento do Tema Claro/Escuro
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }
}

// Observer Dinâmico para Refinamento Automático
const observer = new MutationObserver(() => {
  refineText();
  refineHeadings();
  addDateAxis();
});
observer.observe(document.body, { childList: true, subtree: true });

// Inicialização Geral
document.addEventListener('DOMContentLoaded', () => {
  setupDefaultDates();
  refineText();
  refineHeadings();
  addDateAxis();
});
