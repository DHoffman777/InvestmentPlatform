export default function Custom500() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>500</h1>
      <p style={{ fontSize: '18px' }}>Server Error</p>
    </div>
  );
}

export async function getStaticProps() {
  return {
    props: {},
  };
}