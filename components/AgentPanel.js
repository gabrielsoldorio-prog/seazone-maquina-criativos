import { useState } from 'react'
import { FileSearch, Type, ImageIcon, BarChart3, CheckCircle, Clock, Circle, ChevronDown, ChevronUp } from 'lucide-react'

const AGENTS = [
  { id: 'briefing',     name: 'Agente de Briefing',     icon: FileSearch, desc: 'Analisa e estrutura o briefing do empreendimento.' },
  { id: 'copy',         name: 'Agente de Copy',          icon: Type,       desc: 'Gera roteiros e textos alinhados à marca Seazone.' },
  { id: 'imagem',       name: 'Agente de Imagem',        icon: ImageIcon,  desc: 'Gera composições visuais e prompts para Fal.ai.' },
  { id: 'benchmarking', name: 'Agente de Benchmarking',  icon: BarChart3,  desc: 'Analisa os criativos vs referências do mercado.' },
]

const CHECKS = [
  { key: 'pinLocalizacao',        label: 'PIN de localização' },
  { key: 'dadosConfirmados',      label: 'Dados confirmados' },
  { key: 'sufixoAluguel',         label: 'Sufixo aluguel por temporada' },
  { key: 'semTermosProibidos',    label: 'Sem termos proibidos' },
  { key: 'sequenciaVisual',       label: 'Sequência visual' },
  { key: 'dosSeguidos',           label: "Do's seguidos" },
  { key: 'dontsSeguidos',         label: "Don'ts respeitados" },
  { key: 'tomCorreto',            label: 'Tom de voz correto' },
  { key: 'comboValorizacaoRenda', label: 'Valorização + renda passiva' },
]

function StatusBadge({ status }) {
  const cfg = {
    concluido:   { label: 'Concluído',   cls: 'bg-green-100 text-green-700',  Icon: CheckCircle },
    processando: { label: 'Processando', cls: 'bg-yellow-100 text-yellow-700', Icon: Clock },
    aguardando:  { label: 'Aguardando',  cls: 'bg-slate-100 text-slate-500',   Icon: Circle },
  }
  const s = cfg[status] || cfg.aguardando
  const Icon = s.Icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.cls}`}>
      <Icon size={10} />
      {s.label}
    </span>
  )
}

function AgentCard({ agent, status, summary }) {
  const [open, setOpen] = useState(false)
  const Icon = agent.icon
  return (
    <div className="border border-[#E2E8F0] rounded-xl p-4 mb-3 transition-shadow duration-200 hover:shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg flex items-center justify-center shrink-0">
            <Icon size={15} color="#64748B" />
          </div>
          <span className="text-sm font-semibold text-[#0F172A]">{agent.name}</span>
        </div>
        <StatusBadge status={status} />
      </div>
      <p className="text-xs text-[#94A3B8] mb-2 leading-relaxed">{agent.desc}</p>
      {summary && (
        <>
          <button
            onClick={() => setOpen(o => !o)}
            className="flex items-center gap-1 text-xs text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {open ? 'Recolher' : 'Ver resumo'}
          </button>
          {open && (
            <div className="mt-2 text-xs text-[#64748B] bg-[#F8FAFC] rounded-lg p-3 leading-relaxed border border-[#E2E8F0] animate-fade-in">
              {summary}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function AgentPanel({ agentes, criativos }) {
  const [aba, setAba] = useState('agentes')

  const nota    = agentes?.nota || 0
  const revisor = agentes?.revisor || {}
  const passados = CHECKS.filter(c => revisor[c.key] === true).length

  const corNota = nota >= 8 ? 'text-green-600' : nota >= 6 ? 'text-yellow-600' : 'text-red-500'
  const bgNota  = nota >= 8 ? 'bg-green-500'  : nota >= 6 ? 'bg-yellow-500'   : 'bg-red-500'

  const statuses = {
    briefing:     criativos            ? 'concluido'   : 'aguardando',
    copy:         agentes              ? 'concluido'   : criativos ? 'processando' : 'aguardando',
    imagem:       'aguardando',
    benchmarking: agentes              ? 'concluido'   : 'aguardando',
  }

  const ABAS = ['agentes', 'logs', 'benchmarking']

  return (
    <div className="flex flex-col h-full">

      {/* Tabs */}
      <div className="border-b border-[#E2E8F0] px-4 pt-4 shrink-0">
        <div className="flex gap-1">
          {ABAS.map(t => (
            <button
              key={t}
              onClick={() => setAba(t)}
              className={`px-3 py-2 text-xs font-medium capitalize transition-colors rounded-t-lg border-b-2 ${
                aba === t
                  ? 'text-[#E85D3A] border-[#E85D3A]'
                  : 'text-[#94A3B8] border-transparent hover:text-[#64748B]'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">

        {/* Agentes */}
        {aba === 'agentes' && AGENTS.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            status={statuses[agent.id]}
            summary={agent.id === 'copy' && agentes?.justificativa ? agentes.justificativa : null}
          />
        ))}

        {/* Logs */}
        {aba === 'logs' && (
          <div className="space-y-2 font-mono text-xs">
            {criativos ? (
              <>
                <p className="text-green-600">[OK] Briefing analisado</p>
                <p className="text-green-600">[OK] 45 roteiros gerados</p>
                {agentes && <p className="text-green-600">[OK] Revisão automática: {nota.toFixed(1)}/10</p>}
                <p className="text-[#94A3B8]">[INFO] Aguardando geração de mídia por variação</p>
              </>
            ) : (
              <p className="text-[#94A3B8]">Nenhuma atividade ainda.</p>
            )}
          </div>
        )}

        {/* Benchmarking */}
        {aba === 'benchmarking' && (
          agentes ? (
            <div>
              <div className="text-center mb-5">
                <div className={`text-5xl font-black ${corNota}`}>{nota.toFixed(1)}</div>
                <div className="text-xs text-[#94A3B8] mt-1">nota geral / 10</div>
                <div className="mt-3 h-2 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${bgNota}`}
                    style={{ width: `${(nota / 10) * 100}%` }}
                  />
                </div>
                {agentes.justificativa && (
                  <p className="text-xs text-[#64748B] mt-3 leading-relaxed text-left">{agentes.justificativa}</p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
                  Checklist — {passados}/{CHECKS.length}
                </p>
                {CHECKS.map(({ key, label }) => {
                  const ok = revisor[key] === true
                  return (
                    <div key={key} className="flex items-center gap-2 text-xs">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                        ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'
                      }`}>
                        {ok ? '✓' : '✕'}
                      </span>
                      <span className={ok ? 'text-[#64748B]' : 'text-[#94A3B8]'}>{label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#94A3B8] text-center py-8">Gere os criativos para ver o benchmarking.</p>
          )
        )}
      </div>
    </div>
  )
}
