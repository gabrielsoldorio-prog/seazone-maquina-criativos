export default function CenaTable({ cenas }) {
  if (!cenas || cenas.length === 0) return null

  return (
    <div style={{ overflowX: 'auto', marginTop: '12px' }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '13px',
        lineHeight: '1.5'
      }}>
        <thead>
          <tr style={{ background: '#1a1a2e' }}>
            <th style={thStyle}>CENA</th>
            <th style={thStyle}>LETTERING</th>
            <th style={thStyle}>LOCUÇÃO</th>
          </tr>
        </thead>
        <tbody>
          {cenas.map((c, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#0f0f1a' : '#13131f' }}>
              <td style={tdStyle}>{c.cena}</td>
              <td style={{ ...tdStyle, color: '#7ec8e3', fontWeight: '500' }}>{c.lettering || '—'}</td>
              <td style={{ ...tdStyle, fontStyle: 'italic', color: '#e0e0e0' }}>"{c.locucao}"</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const thStyle = {
  padding: '10px 14px',
  textAlign: 'left',
  color: '#7ec8e3',
  fontWeight: '700',
  fontSize: '11px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  borderBottom: '1px solid #2a2a3e'
}

const tdStyle = {
  padding: '10px 14px',
  color: '#c0c0d0',
  borderBottom: '1px solid #1e1e2e',
  verticalAlign: 'top'
}
