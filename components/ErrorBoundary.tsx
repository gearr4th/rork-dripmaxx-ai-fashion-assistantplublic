import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const message = typeof error === "object" && error !== null && "message" in error ? String((error as { message?: unknown }).message ?? "Unknown error") : String(error);
    console.log("[ErrorBoundary] getDerivedStateFromError", message);
    return { hasError: true, errorMessage: message };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.log("[ErrorBoundary] componentDidCatch", { error, errorInfo });
  }

  handleReset = () => {
    console.log("[ErrorBoundary] Reset pressed");
    this.setState({ hasError: false, errorMessage: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container} testID="error-boundary">
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{this.state.errorMessage ?? "An unexpected error occurred."}</Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset} testID="error-boundary-reset">
            <Text style={styles.buttonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children as React.ReactElement;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#0b0b0b",
  },
  title: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "700" as const,
    marginBottom: 8,
  },
  message: {
    color: "#c9c9c9",
    fontSize: 14,
    textAlign: "center" as const,
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "600" as const,
  },
});
