import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let friendly = error.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(error.message);
      if (parsed?.error) {
        friendly = `Data sync notice (${parsed.operationType || 'request'}): ${parsed.error}`;
      }
    } catch {
      // Keep original message
    }
    return { hasError: true, errorMessage: friendly };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Duet ErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center px-6">
          <div className="max-w-md w-full bg-white border border-[#EAE6DF] rounded-[2rem] p-8 text-center">
            <p className="text-xs tracking-wide text-[#71717A] mb-2">Duet</p>
            <h1 className="font-serif text-3xl text-[#18181B] mb-3">
              Something interrupted the quiet.
            </h1>
            <p className="text-sm text-[#71717A] leading-relaxed mb-6">
              {this.state.errorMessage}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, errorMessage: '' });
                window.location.reload();
              }}
              className="px-6 py-3 rounded-full bg-[#3F6251] text-white text-sm font-medium hover:bg-[#345143] transition-colors"
            >
              Reload Duet
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
