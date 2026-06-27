import React from 'react';
import ServiceUnavailable from './ServiceUnavailable';

const isChunkLoadError = (error) => {
  const message = String(error?.message || error || '');
  return message.includes('Failed to fetch dynamically imported module')
    || message.includes('Importing a module script failed')
    || message.includes('/assets/');
};

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    if (!isChunkLoadError(error)) return;
    const key = 'nkb-petty-cash-chunk-error-reloaded';
    if (sessionStorage.getItem(key) === '1') return;
    sessionStorage.setItem(key, '1');
    window.location.replace(`${window.location.pathname}?build=${Date.now()}${window.location.hash}`);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <ServiceUnavailable
        title="Application needs a refresh"
        message="Some application files were updated while your browser still had the old version. Refresh to load the newest build."
        onRetry={() => window.location.replace(`${window.location.pathname}?build=${Date.now()}${window.location.hash}`)}
      />
    );
  }
}

export default AppErrorBoundary;
