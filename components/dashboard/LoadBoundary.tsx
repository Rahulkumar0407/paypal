"use client";

import { Component, type ReactNode } from "react";

/**
 * If a table or chart fails to load or draw (a lost connection while its code downloads, say), show `fallback`
 * (the same numbers in plain HTML) instead of breaking the page.
 */
export class LoadBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
