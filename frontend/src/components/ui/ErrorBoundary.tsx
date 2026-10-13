import { Component, type ErrorInfo, type ReactNode } from "react";
import ErrorState from "./ErrorState";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/** Bitta sahifa yiqilsa, butun ilova oq ekranga aylanmasligi uchun. */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("UI xatosi:", error, info.componentStack);
  }

  private reset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="max-w-xl mx-auto py-16">
            <ErrorState
              title="Sahifada kutilmagan xato yuz berdi"
              description="Sahifani qayta yuklab ko'ring. Muammo takrorlansa, biz bilan bog'laning."
              onRetry={this.reset}
            />
          </div>
        )
      );
    }
    return this.props.children;
  }
}
