import { Component, ReactNode } from 'react';

type Props = { children: ReactNode; fallback?: ReactNode };
type State = { hasError: boolean; error?: any };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="border rounded-2xl p-3 text-sm bg-red-50 text-red-700">
          Ocurrió un error al renderizar este bloque. Revisa la consola.
        </div>
      );
    }
    return this.props.children;
  }
}
