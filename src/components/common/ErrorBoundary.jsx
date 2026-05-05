import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
          <div className="rounded-[2rem] border border-rose-500/50 bg-rose-500/10 p-8 text-center">
            <h2 className="mb-4 text-2xl font-semibold text-rose-300">Something went wrong</h2>
            <p className="text-slate-300">An unexpected error occurred while rendering this component.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 rounded-full bg-gradient-to-r from-violet-500 to-sky-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
