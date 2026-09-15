import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
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
    console.error('ENSv1 Uncaught Runtime Error:', error, errorInfo);
  }

  private handleResetEverything = () => {
    try {
      localStorage.removeItem('ensv1_saved_topologies');
      localStorage.removeItem('ensv1_device_templates');
    } catch {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#080d17] text-slate-200 p-6 select-none font-sans">
          <div className="max-w-md w-full rounded-2xl border border-red-500/30 bg-slate-900/95 p-6 shadow-2xl backdrop-blur-xl text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertTriangle className="h-7 w-7" />
            </div>

            <div className="space-y-1">
              <h1 className="text-lg font-bold text-white tracking-wide">ENSv1 Workspace Recovery</h1>
              <p className="text-xs text-slate-400">
                The network simulator encountered an unexpected runtime error during topology rendering.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-left overflow-x-auto max-h-28">
                <p className="text-[11px] font-mono text-red-400 leading-relaxed">
                  {this.state.error.message || 'Unknown Exception'}
                </p>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs transition"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reload Page</span>
              </button>

              <button
                onClick={this.handleResetEverything}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition shadow-lg shadow-sky-900/30"
              >
                <span>Reset Default Lab</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
