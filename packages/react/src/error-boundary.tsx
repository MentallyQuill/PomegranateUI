import { Component, type ErrorInfo, type ReactNode } from 'react';

export interface WidgetErrorBoundaryProps {
  readonly title: string;
  readonly children: ReactNode;
  readonly onError?: (error: Error, info: ErrorInfo) => void;
}

interface WidgetErrorBoundaryState {
  readonly failed: boolean;
}

export class WidgetErrorBoundary extends Component<WidgetErrorBoundaryProps, WidgetErrorBoundaryState> {
  state: WidgetErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): WidgetErrorBoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info);
  }

  render(): ReactNode {
    if (this.state.failed) {
      return <div role="alert">{this.props.title} could not be rendered.</div>;
    }
    return this.props.children;
  }
}
