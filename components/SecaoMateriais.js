import MaterialCard from './MaterialCard'

export default function SecaoMateriais({ titulo, badge, badgeColor, icone, materiais, tipo }) {
  if (!materiais || materiais.length === 0) return null

  return (
    <section style={{ marginBottom: '48px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #2a2a3e'
      }}>
        <span style={{ fontSize: '22px' }}>{icone}</span>
        <h2 style={{ margin: 0, color: '#ffffff', fontSize: '18px', fontWeight: '700' }}>
          {titulo}
        </h2>
      </div>

      {materiais.map((material, idx) => (
        <MaterialCard
          key={idx}
          titulo={`Estrutura ${material.estrutura}`}
          badge={badge}
          badgeColor={badgeColor}
          tipo={tipo}
          dados={material}
        />
      ))}
    </section>
  )
}
