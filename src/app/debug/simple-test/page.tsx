export default function SimpleTestPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '1rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{ 
          fontSize: '2.5rem', 
          fontWeight: 'bold', 
          color: '#1a202c',
          marginBottom: '1rem'
        }}>
          Inline Style Test
        </h1>
        
        <p style={{ fontSize: '1.1rem', color: '#4a5568', marginBottom: '2rem' }}>
          If you can see this styled page with gradient background, white card, and proper typography, 
          then basic CSS is working. The issue is specifically with Tailwind CSS.
        </p>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{ 
            backgroundColor: '#3182ce', 
            color: 'white', 
            padding: '1rem', 
            borderRadius: '0.5rem',
            textAlign: 'center'
          }}>
            Blue Box
          </div>
          <div style={{ 
            backgroundColor: '#48bb78', 
            color: 'white', 
            padding: '1rem', 
            borderRadius: '0.5rem',
            textAlign: 'center'
          }}>
            Green Box
          </div>
          <div style={{ 
            backgroundColor: '#f56565', 
            color: 'white', 
            padding: '1rem', 
            borderRadius: '0.5rem',
            textAlign: 'center'
          }}>
            Red Box
          </div>
        </div>
        
        <div style={{ 
          backgroundColor: '#f7fafc', 
          padding: '1rem', 
          borderRadius: '0.5rem',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Next Steps:</h3>
          <ul style={{ marginLeft: '1rem', color: '#4a5568' }}>
            <li>If this looks styled → CSS works, Tailwind has issues</li>
            <li>If this looks unstyled → CSS itself is broken</li>
            <li>Check browser console for CSS errors</li>
            <li>Try hard refresh (Ctrl+Shift+R)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
