import { Component, type ErrorInfo, type ReactNode } from 'react';
import { TelemetryLogger } from '../../services/TelemetryLogger';

interface Props {
    children: ReactNode;
    fallbackTitle?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public override state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
        TelemetryLogger.log('ERROR', `[ErrorBoundary] ${error.message}`, {
            stack: error.stack,
            componentStack: errorInfo.componentStack
        });
    }


    public override render() {
        if (this.state.hasError) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] w-full bg-white rounded-xl border border-rose-200 p-8 shadow-sm text-center">
                    <div className="w-14 h-14 bg-rose-50 border border-rose-200 text-rose-600 rounded-full flex items-center justify-center text-2xl mb-4">
                        ⚠️
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">
                        {this.props.fallbackTitle || "Error al renderizar el componente"}
                    </h3>
                    <p className="text-sm text-slate-500 max-w-md mb-6">
                        Ocurrió un error inesperado durante el procesamiento visual de los datos. Puedes volver a la Matriz Financiera o intentar recargar.
                    </p>
                    <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs font-mono text-slate-600 max-w-lg overflow-auto mb-6 text-left">
                        {this.state.error?.message || "Error desconocido"}
                    </div>
                    <button
                        onClick={() => this.setState({ hasError: false, error: null })}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                        Reintentar Renderizado
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
