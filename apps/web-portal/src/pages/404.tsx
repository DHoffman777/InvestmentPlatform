export default function Custom404() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>404</h1>
      <p style={{ fontSize: '18px' }}>Page Not Found</p>
    </div>
  );
}

export async function getStaticProps() {
  return {
    props: {},
  };
}