import React from 'react';

// Class component is required here — getDerivedStateFromError/
// componentDidCatch have no hooks equivalent. Without this boundary
// anywhere in the tree, React 18's default behavior on an uncaught render
// error is to unmount the whole app, so a single component throwing (bad
// data shape, null access, a third-party lib like maplibre-gl misbehaving)
// takes down the entire page instead of just the section that broke.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Uncaught render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" role="alert">
          <p className="error-boundary-message">
            Something went wrong loading this page. Reloading usually fixes it.
          </p>
          <button type="button" className="cta-button" onClick={() => window.location.reload()}>
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
