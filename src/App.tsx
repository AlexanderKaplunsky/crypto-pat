import './App.css';

function App() {
  return (
    <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center' }}>
      <h1 style={{ color: 'var(--color-happy-yellow)' }}>
        Crypto Pet 🐾
      </h1>
      <p style={{ marginTop: 'var(--spacing-md)' }}>
        Design system loaded! Check the console for environment status.
      </p>
      <button 
        className="pixel-border"
        style={{
          marginTop: 'var(--spacing-lg)',
          padding: 'var(--spacing-sm) var(--spacing-md)',
          backgroundColor: 'var(--color-button-green)',
          color: 'var(--color-text-light)',
        }}
      >
        Test Button
      </button>
    </div>
  );
}

export default App;
