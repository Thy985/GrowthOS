declare module './hooks/useKeyboardShortcuts' {
  export default function useKeyboardShortcuts(shortcuts: Array<{
    key: string;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    callback: () => void;
  }>): void;
}

declare module './components/ErrorBoundary' {
  import React from 'react';
  interface ErrorBoundaryProps {
    children: React.ReactNode;
  }
  export default class ErrorBoundary extends React.Component<ErrorBoundaryProps> {
  }
}

declare module './pages/growth-tree' {
  const GrowthTree: React.FC;
  export default GrowthTree;
}

declare module './pages/analytics' {
  const Analytics: React.FC;
  export default Analytics;
}

declare module './pages/goals' {
  const Goals: React.FC;
  export default Goals;
}

declare module './pages/reminders' {
  const Reminders: React.FC;
  export default Reminders;
}

declare module './components/Tutorial' {
  const Tutorial: React.FC;
  export default Tutorial;
}

declare module './components/KeyboardShortcutsHelp' {
  interface KeyboardShortcutsHelpProps {
    isOpen: boolean;
    onClose: () => void;
  }
  const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps>;
  export default KeyboardShortcutsHelp;
}

declare module './i18n' {
  const i18n: Record<string, unknown>;
  export default i18n;
}
