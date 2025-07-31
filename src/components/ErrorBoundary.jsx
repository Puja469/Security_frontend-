import React from 'react';
import { FaExclamationTriangle, FaHome, FaRedo } from 'react-icons/fa';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    handleRefresh = () => {
        window.location.reload();
    };

    handleGoHome = () => {
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-amber-600 via-orange-600 to-yellow-600 flex items-center justify-center p-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-2xl text-center max-w-md">
                        <FaExclamationTriangle className="text-red-400 text-6xl mx-auto mb-6" />
                        <h1 className="text-2xl font-bold text-white mb-4">Oops! Something went wrong</h1>
                        <p className="text-amber-100 mb-6">
                            We encountered an unexpected error. Don't worry, this is usually temporary.
                        </p>

                        <div className="space-y-3">
                            <button
                                onClick={this.handleRefresh}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                            >
                                <FaRedo />
                                Refresh Page
                            </button>

                            <button
                                onClick={this.handleGoHome}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/20 transition-all duration-300"
                            >
                                <FaHome />
                                Go to Home
                            </button>
                        </div>

                        {process.env.NODE_ENV === 'development' && (
                            <details className="mt-6 text-left">
                                <summary className="text-amber-200 cursor-pointer">Error Details (Development)</summary>
                                <pre className="mt-2 text-xs text-red-300 bg-red-900/20 p-3 rounded overflow-auto">
                                    {this.state.error?.toString()}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary; 