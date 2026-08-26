import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null, info: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
    this.setState({ info })
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh', background: '#0b0b12', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{ maxWidth: 640, width: '100%' }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>⚠️ Ошибка приложения</h1>
            <pre style={{
              background: '#1a1a24', border: '1px solid #333', borderRadius: 12,
              padding: 16, fontSize: 13, overflow: 'auto', whiteSpace: 'pre-wrap', color: '#ff8a8a'
            }}>
              {String(this.state.error?.message || this.state.error)}
              {'\n\n'}
              {this.state.info?.componentStack ? `Компонент:\n${this.state.info.componentStack}` : ''}
            </pre>
            <button
              onClick={() => {
                localStorage.clear()
                window.location.reload()
              }}
              style={{
                marginTop: 16, padding: '10px 18px', background: '#fff', color: '#111',
                border: 'none', borderRadius: 10, fontWeight: 600, cursor: 'pointer'
              }}
            >
              Сбросить данные и перезагрузить
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
