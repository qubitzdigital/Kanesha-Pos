import React, { useState, useEffect, useRef } from "react";
import CloseButton from "./CloseButton";

const InputModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  placeholder,
  initialValue = "",
}) => {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setValue(initialValue);
      // Focus input after modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, initialValue]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedValue = value.trim();
    if (trimmedValue) {
      onSubmit(trimmedValue);
      setValue("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md p-6 bg-white shadow-2xl rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-800">{title}</h3>

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            className="w-full px-4 py-3 mb-4 text-sm transition-all border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors bg-gray-100 rounded-xl hover:bg-gray-200"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white transition-colors rounded-xl bg-primary hover:bg-primary/90"
              disabled={!value.trim()}
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InputModal;
