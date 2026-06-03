import { KeyboardShortcutsShortcut } from '../hooks/useKeyboardShortcuts';

declare module '*.jsx' {
  const component: React.ComponentType<unknown>;
  export default component;
}

declare module './hooks/useKeyboardShortcuts' {
  const useKeyboardShortcuts: (shortcuts: KeyboardShortcutsShortcut[]) => void;
  export default useKeyboardShortcuts;
}

declare module './components/ErrorBoundary' {
  interface ErrorBoundaryProps {
    children?: React.ReactNode;
    fallback?: React.ReactNode;
  }
  class ErrorBoundary extends React.Component<ErrorBoundaryProps, { hasError: boolean; error?: Error }> {
    static getDerivedStateFromError(error: Error): { hasError: boolean; error: Error };
    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void;
    render(): React.ReactNode;
  }
  export default ErrorBoundary;
}

declare module './components/Tutorial' {
  const Tutorial: React.LazyExoticComponent<React.ComponentType>;
  export default Tutorial;
}

declare module './components/KeyboardShortcutsHelp' {
  const KeyboardShortcutsHelp: React.LazyExoticComponent<React.ComponentType<{ isOpen: boolean; onClose: () => void }>>;
  export default KeyboardShortcutsHelp;
}

declare module './pages/growth-tree' {
  const GrowthTree: React.LazyExoticComponent<React.ComponentType>;
  export default GrowthTree;
}

declare module './pages/goals' {
  const Goals: React.LazyExoticComponent<React.ComponentType>;
  export default Goals;
}

declare module './pages/reminders' {
  const Reminders: React.LazyExoticComponent<React.ComponentType>;
  export default Reminders;
}

declare module './pages/analytics' {
  const Analytics: React.LazyExoticComponent<React.ComponentType>;
  export default Analytics;
}

declare module './pages/auth/Login' {
  const Login: React.ComponentType;
  export default Login;
}

declare module './pages/auth/Register' {
  const Register: React.ComponentType;
  export default Register;
}

declare module './pages/ai/AISettingsPage' {
  const AISettingsPage: React.LazyExoticComponent<React.ComponentType>;
  export default AISettingsPage;
}
