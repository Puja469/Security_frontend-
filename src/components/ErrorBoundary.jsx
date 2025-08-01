import React from 'react';
import { FaExclamationTriangle, FaHome, FaRedo } from 'react-icons/fa';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
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
                <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                                <FaExclamationTriangle className="h-8 w-8 text-red-600" />
                            </div>

                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                Something went wrong
                            </h1>

                            <p className="text-gray-600 mb-6">
                                We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.
                            </p>

                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
                                    <h3 className="text-sm font-semibold text-gray-800 mb-2">Error Details (Development):</h3>
                                    <details className="text-xs text-gray-600">
                                        <summary className="cursor-pointer hover:text-gray-800">Click to see error details</summary>
                                        <pre className="mt-2 whitespace-pre-wrap overflow-auto">
                                            {this.state.error && this.state.error.toString()}
                                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                                        </pre>
                                    </details>
                                </div>
                            )}

                            <div className="flex space-x-4">
                                <button
                                    onClick={this.handleRefresh}
                                    className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <FaRedo className="mr-2" />
                                    Refresh Page
                                </button>

                                <button
                                    onClick={this.handleGoHome}
                                    className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                >
                                    <FaHome className="mr-2" />
                                    Go Home
                                </button>
                            </div>

                            <div className="mt-6 text-xs text-gray-500">
                                <p>If this problem continues, please contact support with the error details above.</p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary; 