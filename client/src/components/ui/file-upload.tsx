import * as React from "react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  className?: string;
  disabled?: boolean;
}

export function FileUpload({ onFileSelect, accept = "image/*", className, disabled }: FileUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("relative", className)}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="sr-only"
        disabled={disabled}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm file:mr-4 file:py-1 file:px-3 file:border-0 file:text-sm file:bg-primary file:text-white file:rounded hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Choose Image File
      </button>
    </div>
  );
}
