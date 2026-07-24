export default function Dashboard() {
  return (
    <div>
      <h2 style={{ fontSize: '24px', fontWeight: 300, letterSpacing: '0.1em', marginBottom: '32px' }}>Dashboard Overview</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        {[
          { label: 'Total Sales', value: '₹0', change: '+0%' },
          { label: 'Total Orders', value: '0', change: '+0%' },
          { label: 'Active Products', value: '0', change: '0' },
          { label: 'Active Customers', value: '0', change: '+0%' },
        ].map(stat => (
          <div key={stat.label} style={{ backgroundColor: '#0A0A0A', padding: '24px', borderRadius: '8px', border: '1px solid #1F1F1F' }}>
            <p style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>{stat.label}</p>
            <h3 style={{ fontSize: '32px', fontWeight: 300, marginBottom: '8px' }}>{stat.value}</h3>
            <p style={{ color: '#00c853', fontSize: '12px' }}>{stat.change} from last month</p>
          </div>
        ))}
      </div>
    </div>
  )
}
