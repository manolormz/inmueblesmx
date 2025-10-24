import React from "react";

export default class DebugBoundary extends React.Component<
  { name?: string; children: React.ReactNode },
  { error: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { error: null } as { error: any };
  }
  static getDerivedStateFromError(error: any) {
    return { error } as { error: any };
  }
  componentDidCatch(error: any, info: any) {
    console.error("[Boundary]", this.props.name || "Boundary", error, info);
  }
  render() {
    if ((this.state as any).error) {
      const err = (this.state as any).error;
      return (
        <div className="max-w-3xl mx-auto my-8 p-4 rounded-2xl border bg-red-50 text-red-800">
          <h2 className="font-semibold text-lg">
            Se produjo un error en {this.props.name || "la sección"}
          </h2>
          <pre className="mt-2 text-xs whitespace-pre-wrap">
            {String(err?.message || err)}
          </pre>
          <p className="text-xs mt-2 opacity-80">
            Revisa la consola del navegador para el stacktrace.
          </p>
        </div>
      );
    }
    return <>{this.props.children}</>;
  }
}
