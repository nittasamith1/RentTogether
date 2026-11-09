import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  HelpCircle,
  X,
  Trash2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export type DialogVariant = 'danger' | 'warning' | 'info' | 'success' | 'brand';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  icon?: 'trash' | 'alert' | 'check' | 'calendar' | 'info';
}

export interface PromptOptions {
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  required?: boolean;
  multiline?: boolean;
}

export interface AlertOptions {
  title: string;
  message: string;
  confirmText?: string;
  variant?: DialogVariant;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface DialogContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  prompt: (options: PromptOptions) => Promise<string | null>;
  alert: (options: AlertOptions) => Promise<void>;
  showToast: (message: string, type?: ToastType) => void;
}

const DialogContext = createContext<DialogContextValue | null>(null);

// Global toast trigger ref for non-component usages (e.g. inside standard hooks)
let globalToastEmitter: ((message: string, type?: ToastType) => void) | null = null;

export const toast = {
  success: (msg: string) => globalToastEmitter?.(msg, 'success'),
  error: (msg: string) => globalToastEmitter?.(msg, 'error'),
  info: (msg: string) => globalToastEmitter?.(msg, 'info'),
  warning: (msg: string) => globalToastEmitter?.(msg, 'warning'),
};

export const DialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Confirm state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve?: (value: boolean) => void;
  }>({
    isOpen: false,
    options: { title: '', message: '' },
  });

  // Prompt state
  const [promptState, setPromptState] = useState<{
    isOpen: boolean;
    options: PromptOptions;
    value: string;
    error?: string;
    resolve?: (value: string | null) => void;
  }>({
    isOpen: false,
    options: { title: '', message: '' },
    value: '',
  });

  // Alert state
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    options: AlertOptions;
    resolve?: () => void;
  }>({
    isOpen: false,
    options: { title: '', message: '' },
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const promptInputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  globalToastEmitter = showToast;

  // Confirm API
  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);

  const closeConfirm = (confirmed: boolean) => {
    confirmState.resolve?.(confirmed);
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
  };

  // Prompt API
  const prompt = useCallback((options: PromptOptions): Promise<string | null> => {
    return new Promise<string | null>((resolve) => {
      setPromptState({
        isOpen: true,
        options,
        value: options.defaultValue || '',
        error: undefined,
        resolve,
      });
      setTimeout(() => promptInputRef.current?.focus(), 100);
    });
  }, []);

  const handlePromptSubmit = () => {
    if (promptState.options.required && !promptState.value.trim()) {
      setPromptState((prev) => ({ ...prev, error: 'This field cannot be empty.' }));
      return;
    }
    promptState.resolve?.(promptState.value.trim());
    setPromptState((prev) => ({ ...prev, isOpen: false }));
  };

  const closePrompt = () => {
    promptState.resolve?.(null);
    setPromptState((prev) => ({ ...prev, isOpen: false }));
  };

  // Alert API
  const alert = useCallback((options: AlertOptions): Promise<void> => {
    return new Promise<void>((resolve) => {
      setAlertState({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);

  const closeAlert = () => {
    alertState.resolve?.();
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  };

  // Icon selector
  const getModalIcon = (variant: DialogVariant = 'brand', customIcon?: string) => {
    if (customIcon === 'trash') return <Trash2 className="w-5 h-5 text-[#E87575]" />;
    if (customIcon === 'calendar') return <Calendar className="w-5 h-5 text-[#7563D9]" />;
    if (customIcon === 'check') return <CheckCircle2 className="w-5 h-5 text-[#42A879]" />;
    if (customIcon === 'alert') return <AlertTriangle className="w-5 h-5 text-[#E87575]" />;

    switch (variant) {
      case 'danger':
        return <Trash2 className="w-5 h-5 text-[#E87575]" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-[#D97706]" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-[#42A879]" />;
      case 'info':
        return <Info className="w-5 h-5 text-[#3A6BB5]" />;
      case 'brand':
      default:
        return <HelpCircle className="w-5 h-5 text-[#7563D9]" />;
    }
  };

  const getVariantStyles = (variant: DialogVariant = 'brand') => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: '#FFF0F0',
          iconBorder: '#FCA5A5',
          btnBg: '#E87575',
          btnHover: '#D96060',
        };
      case 'warning':
        return {
          iconBg: '#FFF8E7',
          iconBorder: '#FDE68A',
          btnBg: '#D97706',
          btnHover: '#B45309',
        };
      case 'success':
        return {
          iconBg: '#DDF3E7',
          iconBorder: '#A7F3D0',
          btnBg: '#42A879',
          btnHover: '#368E66',
        };
      case 'info':
        return {
          iconBg: '#DFEDFF',
          iconBorder: '#BFDBFE',
          btnBg: '#3A6BB5',
          btnHover: '#2E5592',
        };
      case 'brand':
      default:
        return {
          iconBg: '#E9E3FF',
          iconBorder: '#DDD6FE',
          btnBg: '#7563D9',
          btnHover: '#6552C5',
        };
    }
  };

  return (
    <DialogContext.Provider value={{ confirm, prompt, alert, showToast }}>
      {children}

      {/* 1. Formal Confirmation Modal */}
      <AnimatePresence>
        {confirmState.isOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => closeConfirm(false)}
              className="fixed inset-0 bg-[#1E2235]/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="relative w-full max-w-md rounded-3xl p-6 shadow-2xl border z-10 overflow-hidden"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#EAE6E1' }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0"
                  style={{
                    backgroundColor: getVariantStyles(confirmState.options.variant).iconBg,
                    borderColor: getVariantStyles(confirmState.options.variant).iconBorder,
                  }}
                >
                  {getModalIcon(confirmState.options.variant, confirmState.options.icon)}
                </div>

                <div className="flex-1 pr-6">
                  <h3 className="text-base font-bold tracking-tight" style={{ color: '#303653' }}>
                    {confirmState.options.title}
                  </h3>
                  <p className="text-xs mt-2 leading-relaxed whitespace-pre-line" style={{ color: '#55596D' }}>
                    {confirmState.options.message}
                  </p>
                </div>

                <button
                  onClick={() => closeConfirm(false)}
                  className="absolute top-5 right-5 p-1.5 rounded-xl hover:bg-neutral-100 transition-colors text-neutral-400 hover:text-neutral-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t" style={{ borderColor: '#F2EFEB' }}>
                <button
                  type="button"
                  onClick={() => closeConfirm(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer hover:bg-[#F7F5F2]"
                  style={{ backgroundColor: '#FFFFFF', borderColor: '#EAE6E1', color: '#6E7387' }}
                >
                  {confirmState.options.cancelText || 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => closeConfirm(true)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm cursor-pointer"
                  style={{
                    backgroundColor: getVariantStyles(confirmState.options.variant).btnBg,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = getVariantStyles(confirmState.options.variant).btnHover)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = getVariantStyles(confirmState.options.variant).btnBg)
                  }
                >
                  {confirmState.options.confirmText || 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Formal Prompt Modal */}
      <AnimatePresence>
        {promptState.isOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePrompt}
              className="fixed inset-0 bg-[#1E2235]/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="relative w-full max-w-md rounded-3xl p-6 shadow-2xl border z-10 overflow-hidden"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#EAE6E1' }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0"
                  style={{
                    backgroundColor: getVariantStyles(promptState.options.variant).iconBg,
                    borderColor: getVariantStyles(promptState.options.variant).iconBorder,
                  }}
                >
                  {getModalIcon(promptState.options.variant)}
                </div>

                <div className="flex-1 pr-6">
                  <h3 className="text-base font-bold tracking-tight" style={{ color: '#303653' }}>
                    {promptState.options.title}
                  </h3>
                  <p className="text-xs mt-2 leading-relaxed" style={{ color: '#55596D' }}>
                    {promptState.options.message}
                  </p>
                </div>

                <button
                  onClick={closePrompt}
                  className="absolute top-5 right-5 p-1.5 rounded-xl hover:bg-neutral-100 transition-colors text-neutral-400 hover:text-neutral-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-4">
                {promptState.options.multiline ? (
                  <textarea
                    ref={promptInputRef as any}
                    rows={3}
                    value={promptState.value}
                    onChange={(e) => setPromptState((prev) => ({ ...prev, value: e.target.value, error: undefined }))}
                    placeholder={promptState.options.placeholder || 'Enter notes or reason...'}
                    className="w-full px-3.5 py-2.5 rounded-2xl border text-xs focus:outline-none focus:ring-2 focus:ring-[#7563D9] transition-all resize-none"
                    style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1', color: '#303653' }}
                  />
                ) : (
                  <input
                    ref={promptInputRef as any}
                    type="text"
                    value={promptState.value}
                    onChange={(e) => setPromptState((prev) => ({ ...prev, value: e.target.value, error: undefined }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handlePromptSubmit();
                      if (e.key === 'Escape') closePrompt();
                    }}
                    placeholder={promptState.options.placeholder || 'Type here...'}
                    className="w-full px-3.5 py-2.5 rounded-2xl border text-xs focus:outline-none focus:ring-2 focus:ring-[#7563D9] transition-all"
                    style={{ backgroundColor: '#FFFCF7', borderColor: '#EAE6E1', color: '#303653' }}
                  />
                )}
                {promptState.error && (
                  <p className="text-[11px] text-[#E87575] mt-1.5 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    <span>{promptState.error}</span>
                  </p>
                )}
              </div>

              <div className="mt-5 flex items-center justify-end gap-2.5 pt-4 border-t" style={{ borderColor: '#F2EFEB' }}>
                <button
                  type="button"
                  onClick={closePrompt}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer hover:bg-[#F7F5F2]"
                  style={{ backgroundColor: '#FFFFFF', borderColor: '#EAE6E1', color: '#6E7387' }}
                >
                  {promptState.options.cancelText || 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handlePromptSubmit}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm cursor-pointer"
                  style={{
                    backgroundColor: getVariantStyles(promptState.options.variant).btnBg,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = getVariantStyles(promptState.options.variant).btnHover)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = getVariantStyles(promptState.options.variant).btnBg)
                  }
                >
                  {promptState.options.confirmText || 'Submit'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Formal Alert Modal */}
      <AnimatePresence>
        {alertState.isOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAlert}
              className="fixed inset-0 bg-[#1E2235]/50 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="relative w-full max-w-md rounded-3xl p-6 shadow-2xl border z-10 overflow-hidden"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#EAE6E1' }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0"
                  style={{
                    backgroundColor: getVariantStyles(alertState.options.variant).iconBg,
                    borderColor: getVariantStyles(alertState.options.variant).iconBorder,
                  }}
                >
                  {getModalIcon(alertState.options.variant)}
                </div>

                <div className="flex-1 pr-6">
                  <h3 className="text-base font-bold tracking-tight" style={{ color: '#303653' }}>
                    {alertState.options.title}
                  </h3>
                  <p className="text-xs mt-2.5 leading-relaxed whitespace-pre-line" style={{ color: '#55596D' }}>
                    {alertState.options.message}
                  </p>
                </div>

                <button
                  onClick={closeAlert}
                  className="absolute top-5 right-5 p-1.5 rounded-xl hover:bg-neutral-100 transition-colors text-neutral-400 hover:text-neutral-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-6 flex items-center justify-end pt-4 border-t" style={{ borderColor: '#F2EFEB' }}>
                <button
                  type="button"
                  onClick={closeAlert}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-sm cursor-pointer"
                  style={{
                    backgroundColor: getVariantStyles(alertState.options.variant).btnBg,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = getVariantStyles(alertState.options.variant).btnHover)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = getVariantStyles(alertState.options.variant).btnBg)
                  }
                >
                  {alertState.options.confirmText || 'Got it'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Elegant Toast Stack */}
      <div className="fixed bottom-5 right-5 z-[130] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            let icon = <Info className="w-4 h-4 text-[#3A6BB5]" />;
            let border = '#BFDBFE';
            let bg = '#FFFFFF';

            if (t.type === 'success') {
              icon = <CheckCircle2 className="w-4 h-4 text-[#42A879]" />;
              border = '#A7F3D0';
            } else if (t.type === 'error') {
              icon = <AlertTriangle className="w-4 h-4 text-[#E87575]" />;
              border = '#FCA5A5';
            } else if (t.type === 'warning') {
              icon = <AlertTriangle className="w-4 h-4 text-[#D97706]" />;
              border = '#FDE68A';
            }

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                className="pointer-events-auto p-3.5 rounded-2xl border shadow-lg flex items-center justify-between gap-3 text-xs font-medium"
                style={{ backgroundColor: bg, borderColor: border, color: '#303653' }}
              >
                <div className="flex items-center gap-2.5 flex-1 pr-2">
                  <div className="shrink-0">{icon}</div>
                  <span className="leading-snug">{t.message}</span>
                </div>
                <button
                  onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                  className="p-1 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-400 hover:text-neutral-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </DialogContext.Provider>
  );
};

export const useDialog = (): DialogContextValue => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};
