import React from "react";
import { FiX } from "react-icons/fi";

function Modal({ isOpen, onClose, title, children, panelClassName = "max-w-md" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-md transition-all duration-300 animate-fade-in"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className={`relative z-[141] w-full transform rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300 animate-scale-in ${panelClassName}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <FiX className="h-6 w-6" />
          </button>

          {/* Title */}
          <h3 className="text-2xl font-bold text-gray-900 mb-6">{title}</h3>

          {/* Content */}
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
