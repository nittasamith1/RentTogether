import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { CreateListingWizard } from '../listings/CreateListingWizard';

interface ListItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemCreated?: (title: string, category?: string, price?: number) => void;
}

export const ListItemModal: React.FC<ListItemModalProps> = ({
  isOpen,
  onClose,
  onItemCreated,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-[#0F172A]/70 backdrop-blur-md"
        />

        {/* Modal Wrapper */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          className="relative w-full max-w-3xl z-10 my-8"
        >
          {/* Close button outside top right */}
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-9 h-9 rounded-full bg-white text-slate-700 shadow-xl border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors z-20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <CreateListingWizard
            onSuccess={() => {
              if (onItemCreated) onItemCreated('Campus Resource Item');
              onClose();
            }}
            onCancel={onClose}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
