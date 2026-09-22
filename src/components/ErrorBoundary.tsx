import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(err: unknown) {
    // Log to console in dev; hook up Sentry/PostHog here later
    if (import.meta.env.DEV) {
      console.error("ErrorBoundary caught:", err);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="text-center max-w-sm">
            <h1 className="font-heading text-xl font-bold text-foreground mb-2">Something went wrong.</h1>
            <p className="text-sm text-muted-foreground mb-6">Please refresh the page or go back home.</p>
            <a
              href="/"
              className="inline-flex items-center justify-center h-[44px] px-5 bg-primary text-primary-foreground text-sm font-medium rounded-[12px]"
            >
              Go home
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
