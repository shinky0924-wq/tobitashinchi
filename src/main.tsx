import { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-rose-50 flex items-center justify-center p-6 text-center font-sans">
          <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-rose-100">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
              !
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">読み込みエラーが発生しました</h1>
            <p className="text-sm text-gray-600 mb-6">
              {this.state.error?.message || 'ページの表示中に問題が発生しました。再読み込みをお試しください。'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-3 px-6 bg-pink-600 text-white rounded-full font-bold shadow-md hover:bg-pink-700 transition-colors"
            >
              ページを再読み込み
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
  } catch (err: any) {
    console.error('Fatal initialization error:', err);
    rootElement.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;font-family:sans-serif;background:#fff5f7;text-align:center;">
        <div style="background:#fff;padding:30px;border-radius:20px;box-shadow:0 10px 25px rgba(0,0,0,0.05);max-width:480px;width:100%;border:1px solid #ffe4e8;">
          <div style="font-size:24px;margin-bottom:12px;color:#d2547b;font-weight:bold;">初期化エラーが発生しました</div>
          <p style="font-size:14px;color:#666;margin-bottom:20px;">${err?.message || '不明なエラー'}</p>
          <button onclick="location.reload()" style="background:#d2547b;color:#fff;border:none;padding:12px 24px;border-radius:9999px;font-weight:bold;cursor:pointer;">再読み込み</button>
        </div>
      </div>
    `;
  }
}





