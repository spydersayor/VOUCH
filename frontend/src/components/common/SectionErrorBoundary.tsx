"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  sectionName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `VOUCH SectionErrorBoundary [${this.props.sectionName || "Section"}] caught error:`,
      error,
      errorInfo
    );
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-6 text-center dark:border-amber-900/60 dark:bg-amber-950/20 my-4">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 mb-3">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {this.props.fallbackTitle || "Unable to display this section"}
          </h3>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            {this.state.error?.message || "A rendering error occurred in this module."}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={this.handleReset}
              className="text-xs flex items-center gap-1.5"
            >
              <RotateCcw className="h-3 w-3" />
              Retry section
            </Button>
            <Button
              size="sm"
              asChild
              className="text-xs flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white"
            >
              <Link href="/">
                <Home className="h-3 w-3" />
                Back to dashboard
              </Link>
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
