const CHECKS = [
  { key: 'pinLocalizacao',       label: 'PIN de localização no primeiro lettering' },
  { key: 'dadosConfirmados',     label: 'Apenas dados com status Confirmado' },
  { key: 'sufixoAluguel',        label: 'Sufixo "com aluguel por temporada"' },
  { key: 'semTermosProibidos',   label: 'Sem termos proibidos' },
  { key: 'sequenciaVisual',      label: 'Sequência visual da estrutura respeitada' },
  { key: 'dosSeguidos',          label: "Do's seguidos" },
  { key: 'dontsSeguidos',        label: "Don'ts respeitados" },
  { key: 'tomCorreto',           label: 'Tom de voz correto para o formato' },
  { key: 'comboValorizacaoRenda',label: 'Combo valorização patrimonial + renda passiva' },
]

export default function AgenteCard({ agentes }) {
  if (!agentes) return null

  const nota = agentes.nota || 0
  const revisor = agentes.revisor || {}
  const totalChecks = CHECKS.length
  const passados = CHECKS.filter(c => revisor[c.key] === true).length

  const corNota = nota >= 8 ? '#4ade80' : nota >= 6 ? '#facc15' : '#f87171'

  return (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '32px' }}>

      {/* Agente Nota */}
      <div style={{
        flex: '1 1 200px',
        background: '#111118',
        border: '1px solid #1e1e2e',
        borderRadius: '12px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <p style={{ margin: '0 0 8px', color: '#666', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Agente Nota
        </p>
        <div style={{
          fontSize: '48px',
          fontWeight: '800',
          color: corNota,
          lineHeight: 1,
          marginBottom: '8px'
        }}>
          {nota.toFixed(1)}
        </div>
        <div style={{
          height: '4px',
          background: '#1a1a2e',
          borderRadius: '2px',
          overflow: 'hidden',
          marginBottom: '10px'
        }}>
          <div style={{
            height: '100%',
            width: `${(nota / 10) * 100}%`,
            background: corNota,
            borderRadius: '2px',
            transition: 'width 0.6s ease'
          }} />
        </div>
        <p style={{ margin: 0, color: '#888', fontSize: '12px', lineHeight: '1.5' }}>
          {agentes.justificativa || 'Alinhamento com briefing e público-alvo'}
        </p>
      </div>

      {/* Agente Revisor */}
      <div style={{
        flex: '2 1 320px',
        background: '#111118',
        border: '1px solid #1e1e2e',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <p style={{ margin: 0, color: '#666', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Agente Revisor
          </p>
          <span style={{
            background: passados === totalChecks ? '#0a2a1a' : '#1a1a0a',
            color: passados === totalChecks ? '#4ade80' : '#facc15',
            fontSize: '11px',
            fontWeight: '700',
            padding: '3px 8px',
            borderRadius: '4px'
          }}>
            {passados}/{totalChecks} checks
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {CHECKS.map(({ key, label }) => {
            const passou = revisor[key] === true
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: passou ? '#0a2a1a' : '#1a0a0a',
                  border: `1px solid ${passou ? '#1e5a2e' : '#5a1e1e'}`,
                  fontSize: '9px',
                  color: passou ? '#4ade80' : '#f87171'
                }}>
                  {passou ? '✓' : '✕'}
                </span>
                <span style={{ fontSize: '12px', color: passou ? '#a0c0a8' : '#c08080' }}>
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
