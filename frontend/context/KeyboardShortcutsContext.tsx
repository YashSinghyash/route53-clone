'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@cloudscape-design/components/modal';
import Box from '@cloudscape-design/components/box';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';
import ColumnLayout from '@cloudscape-design/components/column-layout';

export interface ShortcutHandlers {
  onSearch?: () => void;
  onCreate?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onEscape?: () => boolean | void;
}

interface KeyboardShortcutsContextType {
  isHelpOpen: boolean;
  openHelp: () => void;
  closeHelp: () => void;
  toggleHelp: () => void;
  isMac: boolean;
  registerHandlers: (handlers: ShortcutHandlers) => () => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | undefined>(undefined);

export function KeyboardShortcutsProvider({ children }: { children: ReactNode }) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMac, setIsMac] = useState(true);
  const router = useRouter();

  // Active registered page handlers
  const handlersRef = useRef<ShortcutHandlers>({});

  // Buffer for sequence shortcuts like "g" -> "h" / "d"
  const pendingGRef = useRef<boolean>(false);
  const gTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const platformStr = navigator.platform || navigator.userAgent || '';
      setIsMac(/Mac|iPod|iPhone|iPad/i.test(platformStr));
    }
  }, []);

  const registerHandlers = useCallback((handlers: ShortcutHandlers) => {
    handlersRef.current = handlers;
    return () => {
      handlersRef.current = {};
    };
  }, []);

  const openHelp = useCallback(() => setIsHelpOpen(true), []);
  const closeHelp = useCallback(() => setIsHelpOpen(false), []);
  const toggleHelp = useCallback(() => setIsHelpOpen((prev) => !prev), []);

  useEffect(() => {
    function isInputFocused(): boolean {
      const active = document.activeElement;
      if (!active) return false;
      const tag = active.tagName.toUpperCase();
      const isEditable = active.getAttribute('contenteditable') === 'true';
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || isEditable;
    }

    function focusSearchInput() {
      if (handlersRef.current.onSearch) {
        handlersRef.current.onSearch();
        return;
      }
      // Fallback: Query DOM for Cloudscape text filter or search input
      const searchInput = document.querySelector<HTMLInputElement>(
        '.awsui-text-filter input, input[type="search"], input[placeholder*="filter" i], input[placeholder*="search" i], input[placeholder*="Find" i]'
      );
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      // 1. ESCAPE - Always handled (even inside inputs)
      if (e.key === 'Escape') {
        if (isHelpOpen) {
          setIsHelpOpen(false);
          return;
        }
        // Call registered onEscape if any
        let consumed = false;
        if (handlersRef.current.onEscape) {
          consumed = !!handlersRef.current.onEscape();
        }
        if (!consumed) {
          // If search input is focused, blur it
          const active = document.activeElement as HTMLElement | null;
          if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
            active.blur();
          }
        }
        return;
      }

      // 2. INPUT GUARDING - Do not trigger other shortcuts when typing in an input/textarea/select
      if (isInputFocused()) {
        return;
      }

      const isModifierPressed = e.metaKey || e.ctrlKey || e.altKey;

      // 3. Cmd+K (Mac) / Ctrl+K (Windows)
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        focusSearchInput();
        return;
      }

      // If alt or meta/ctrl is pressed for other keys, don't interfere with browser defaults
      if (isModifierPressed) {
        return;
      }

      // 4. "g" -> "h" or "g" -> "d" sequence handling
      if (e.key.toLowerCase() === 'g' && !pendingGRef.current) {
        pendingGRef.current = true;
        if (gTimerRef.current) clearTimeout(gTimerRef.current);
        gTimerRef.current = setTimeout(() => {
          pendingGRef.current = false;
        }, 1000);
        return;
      }

      if (pendingGRef.current) {
        pendingGRef.current = false;
        if (gTimerRef.current) clearTimeout(gTimerRef.current);

        const key = e.key.toLowerCase();
        if (key === 'h') {
          e.preventDefault();
          router.push('/hosted-zones');
          return;
        }
        if (key === 'd') {
          e.preventDefault();
          router.push('/dashboard');
          return;
        }
      }

      // 5. "/" - Focus search/filter box
      if (e.key === '/') {
        e.preventDefault();
        focusSearchInput();
        return;
      }

      // 6. "?" (Shift+/) - Keyboard shortcuts help
      if (e.key === '?') {
        e.preventDefault();
        setIsHelpOpen((prev) => !prev);
        return;
      }

      // 7. "c" - Create item
      if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        if (handlersRef.current.onCreate) {
          handlersRef.current.onCreate();
        } else {
          router.push('/hosted-zones/create');
        }
        return;
      }

      // 8. "e" - Edit selected row
      if (e.key.toLowerCase() === 'e') {
        if (handlersRef.current.onEdit) {
          e.preventDefault();
          handlersRef.current.onEdit();
        }
        return;
      }

      // 9. "Delete" or "Backspace" - Delete selected row(s)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (handlersRef.current.onDelete) {
          e.preventDefault();
          handlersRef.current.onDelete();
        }
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHelpOpen, router]);

  const modKeyLabel = isMac ? '⌘' : 'Ctrl+';

  return (
    <KeyboardShortcutsContext.Provider
      value={{
        isHelpOpen,
        openHelp,
        closeHelp,
        toggleHelp,
        isMac,
        registerHandlers,
      }}
    >
      {children}

      {/* Keyboard Shortcuts Help Modal */}
      {isHelpOpen && (
        <Modal
          visible={isHelpOpen}
          onDismiss={closeHelp}
          header="Keyboard shortcuts"
          size="medium"
          footer={
            <Box float="right">
              <Button variant="primary" onClick={closeHelp}>
                Done
              </Button>
            </Box>
          }
        >
          <SpaceBetween size="l">
            <ColumnLayout columns={2}>
              <SpaceBetween size="s">
                <Box variant="h3">Navigation</Box>
                <ShortcutRow keys={['g', 'h']} label="Go to Hosted zones" />
                <ShortcutRow keys={['g', 'd']} label="Go to Dashboard" />
                <ShortcutRow keys={['?']} label="Show keyboard shortcuts" />
              </SpaceBetween>

              <SpaceBetween size="s">
                <Box variant="h3">Global Actions</Box>
                <ShortcutRow keys={['/']} label="Focus search / filter box" />
                <ShortcutRow keys={[`${modKeyLabel}K`]} label="Focus search / filter box" />
                <ShortcutRow keys={['c']} label="Create item (Zone / Record)" />
                <ShortcutRow keys={['Esc']} label="Close modal / clear filter" />
              </SpaceBetween>
            </ColumnLayout>

            <SpaceBetween size="s">
              <Box variant="h3">Table Controls</Box>
              <ColumnLayout columns={2}>
                <ShortcutRow keys={['e']} label="Edit selected row (1 selected)" />
                <ShortcutRow keys={['Delete', 'or', 'Backspace']} label="Delete selected row(s)" />
              </ColumnLayout>
            </SpaceBetween>
          </SpaceBetween>
        </Modal>
      )}
    </KeyboardShortcutsContext.Provider>
  );
}

function ShortcutRow({ keys, label }: { keys: string[]; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
      <span style={{ fontSize: '13px', color: '#545b64' }}>{label}</span>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        {keys.map((k, idx) =>
          k === 'then' || k === 'or' ? (
            <span key={idx} style={{ fontSize: '11px', color: '#879596', padding: '0 2px' }}>
              {k}
            </span>
          ) : (
            <kbd
              key={idx}
              style={{
                backgroundColor: '#f2f3f3',
                border: '1px solid #d5dbdb',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '12px',
                fontFamily: 'monospace',
                fontWeight: 600,
                color: '#16191f',
                boxShadow: '0 1px 1px rgba(0,0,0,0.08)',
              }}
            >
              {k}
            </kbd>
          )
        )}
      </div>
    </div>
  );
}

export function useKeyboardShortcuts(handlers?: ShortcutHandlers) {
  const context = useContext(KeyboardShortcutsContext);
  if (!context) {
    throw new Error('useKeyboardShortcuts must be used within a KeyboardShortcutsProvider');
  }

  useEffect(() => {
    if (handlers) {
      const cleanup = context.registerHandlers(handlers);
      return cleanup;
    }
  }, [handlers, context]);

  return context;
}
