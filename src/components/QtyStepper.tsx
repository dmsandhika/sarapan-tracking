"use client";

import { AnimatePresence, motion } from "framer-motion";

export default function QtyStepper({ qty, onChange }: { qty: number; onChange: (qty: number) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
      className="flex items-center gap-2"
    >
      <button
        type="button"
        onClick={() => onChange(qty - 1)}
        className="flex h-11 w-11 items-center justify-center rounded-control border border-border text-lg leading-none"
      >
        −
      </button>
      <span className="relative w-6 overflow-hidden text-center text-sm font-medium tabular-nums">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={qty}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="block"
          >
            {qty}
          </motion.span>
        </AnimatePresence>
      </span>
      <button
        type="button"
        onClick={() => onChange(qty + 1)}
        className="flex h-11 w-11 items-center justify-center rounded-control border border-border text-lg leading-none"
      >
        +
      </button>
    </motion.div>
  );
}
