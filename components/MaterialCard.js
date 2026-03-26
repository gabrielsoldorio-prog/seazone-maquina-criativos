import { useState } from 'react'
import CenaTable from './CenaTable'

export default function MaterialCard({ titulo, badge, badgeColor, estrutura, children, tipo, dados }) {
  const [feedback, setFeedback] = useState('')
  const [feedbackSalvo, setFeedbackSalvo] = useState(false)

  function salvarFeedback() {
    if (feedback.trim()) {
      setFeedbackSalvo(true)
      setTimeout(() => setFeedbackSalvo(false), 2000)
    }
  }

  return (
    <div style={{
      background: '#0f0f1a',
      border: '1px solid #2a2a3e',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '20px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <span style={{
          background: badgeColor || '#1e3a5f',
          color: '#7ec8e3',
          padding: '4px 10px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: '700',
          letterSpacing: '0.06em',
          textTransform: 'uppercase'
        }}>{badge}</span>
        <h3 style={{ margin: 0, color: '#ffffff', fontSize: '15px', fontWeight: '600' }}>
          {titulo}
        </h3>
        {dados?.duracao && (
          <span style={{ marginLeft: 'auto', color: '#666', fontSize: '12px' }}>
            {dados.duracao}
          </span>
        )}
      </div>

      {tipo === 'video' && dados?.cenas && (
        <CenaTable cenas={dados.cenas} />
      )}

      {tipo === 'estatico' && dados && (
        <div>
          <div style={{
            background: '#13131f',
            border: '1px solid #2a2a3e',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '12px'
          }}>
            <p style={{ margin: '0 0 6px', color: '#666', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Referência Visual
            </p>
            <p style={{ margin: 0, color: '#a0a0b0', fontSize: '13px', lineHeight: '1.5' }}>
              {dados.referenciaVisual}
            </p>
          </div>
          <div style={{
            background: '#13131f',
            border: '1px solid #2a2a3e',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '12px'
          }}>
            <p style={{ margin: '0 0 6px', color: '#666', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Texto da Arte
            </p>
            <p style={{ margin: 0, color: '#e0e0f0', fontSize: '14px', lineHeight: '1.7', whiteSpace: 'pre-line', fontWeight: '500' }}>
              {dados.textoDaArte}
            </p>
          </div>
          {dados.legenda && (
            <div style={{
              background: '#13131f',
              border: '1px solid #2a2a3e',
              borderRadius: '8px',
              padding: '16px'
            }}>
              <p style={{ margin: '0 0 6px', color: '#666', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Legenda do Post
              </p>
              <p style={{ margin: 0, color: '#a0a0b0', fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                {dados.legenda}
              </p>
            </div>
          )}
        </div>
      )}

      {children}

      <div style={{ marginTop: '20px' }}>
        <label style={{ display: 'block', color: '#666', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
          Feedback
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="Deixe seu feedback sobre este material..."
            rows={2}
            style={{
              flex: 1,
              background: '#13131f',
              border: '1px solid #2a2a3e',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#c0c0d0',
              fontSize: '13px',
              resize: 'vertical',
              fontFamily: 'inherit',
              outline: 'none'
            }}
          />
          <button
            onClick={salvarFeedback}
            style={{
              background: feedbackSalvo ? '#1a4a2e' : '#1e3a5f',
              color: feedbackSalvo ? '#4ade80' : '#7ec8e3',
              border: 'none',
              borderRadius: '8px',
              padding: '0 16px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            {feedbackSalvo ? 'Salvo!' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
