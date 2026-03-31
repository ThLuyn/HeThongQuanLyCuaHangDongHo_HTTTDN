// @ts-nocheck
import { XIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
export function Modal({ isOpen, onClose, title, children, size = 'md', }) {
    const overlayRef = useRef(null);
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        if (isOpen)
            window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);
    if (!isOpen)
        return null;
    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
      xl: 'max-w-5xl',
    };
    return (<div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={(e) => {
            if (e.target === overlayRef.current)
                onClose();
        }} role="dialog" aria-modal="true" aria-label={title}>
      <div className={`${sizeClasses[size]} w-full bg-white rounded-xl shadow-2xl transform transition-all max-h-[90vh] overflow-hidden flex flex-col`} style={{
            animation: 'modalIn 0.2s ease-out',
        }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" aria-label="Đóng">
            <XIcon className="w-5 h-5"/>
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto">{children}</div>
      </div>
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>);
}
