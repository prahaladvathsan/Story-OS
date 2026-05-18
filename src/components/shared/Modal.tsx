import type { PropsWithChildren, ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "./Button";

type ModalProps = PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  widthClassName?: string;
}>;

export function Modal({ open, onClose, title, description, widthClassName = "max-w-2xl", children }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-12 backdrop-blur-sm">
      <div className={`panel-strong w-full ${widthClassName} max-h-[85vh] overflow-auto p-6`}>
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold">{title}</h2>
            {description ? <div className="mt-2 text-sm text-[color:var(--muted)]">{description}</div> : null}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

