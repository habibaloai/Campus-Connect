import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View className="flex-1 items-center justify-center bg-white px-8">
          <View className="w-20 h-20 rounded-full bg-red-100 items-center justify-center mb-6">
            <AlertTriangle size={40} color="#EF4444" />
          </View>
          <Text className="text-xl font-semibold text-gray-800 text-center mb-2">
            Something went wrong
          </Text>
          <Text className="text-base text-gray-500 text-center mb-6">
            We encountered an unexpected error. Please try again.
          </Text>
          {__DEV__ && this.state.error && (
            <View className="bg-gray-100 rounded-lg p-4 mb-6 w-full">
              <Text className="text-sm text-gray-600 font-mono">
                {this.state.error.message}
              </Text>
            </View>
          )}
          <TouchableOpacity
            onPress={this.handleRetry}
            className="flex-row items-center bg-blue-500 px-6 py-3 rounded-xl"
            activeOpacity={0.8}
          >
            <RefreshCw size={18} color="#FFFFFF" />
            <Text className="text-white font-semibold ml-2">Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;










