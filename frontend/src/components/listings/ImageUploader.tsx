import React, { useRef, useState } from 'react';
import { Upload, X, Star, AlertCircle, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  files,
  onChange,
  maxFiles = 5,
  maxSizeMB = 5,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  const validateAndAddFiles = (newFiles: FileList | File[]) => {
    setError(null);
    const addedFiles: File[] = [];

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];

      if (!allowedTypes.includes(file.type)) {
        setError(`"${file.name}" is not a supported format. Please use JPEG, PNG, or WebP.`);
        return;
      }

      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`"${file.name}" exceeds the maximum size limit of ${maxSizeMB}MB.`);
        return;
      }

      addedFiles.push(file);
    }

    if (files.length + addedFiles.length > maxFiles) {
      setError(`You can upload at most ${maxFiles} photos per listing.`);
      return;
    }

    onChange([...files, ...addedFiles]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onChange(updated);
    setError(null);
  };

  const setPrimary = (index: number) => {
    if (index === 0) return;
    const item = files[index];
    const rest = files.filter((_, i) => i !== index);
    onChange([item, ...rest]);
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-[#5B4DFF] bg-indigo-50/50 scale-[1.01]'
            : files.length >= maxFiles
            ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
            : 'border-slate-300 hover:border-[#5B4DFF] hover:bg-indigo-50/20 bg-white'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          disabled={files.length >= maxFiles}
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-[#5B4DFF] flex items-center justify-center shadow-xs">
            <Upload className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <span className="font-bold text-slate-800 text-sm">
              Click to upload or drag & drop photographs
            </span>
            <p className="text-xs text-slate-400 mt-0.5">
              JPEG, PNG, or WebP up to {maxSizeMB}MB each (1 to {maxFiles} photos)
            </p>
          </div>
          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50/80 px-3 py-1 rounded-full mt-1">
            {files.length} of {maxFiles} uploaded
          </span>
        </div>
      </div>

      {/* Validation Error Alert */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Thumbnails Grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
          {files.map((file, idx) => {
            const previewUrl = URL.createObjectURL(file);
            const isPrimary = idx === 0;

            return (
              <div
                key={`${file.name}-${idx}`}
                className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-square shadow-xs"
              >
                <img
                  src={previewUrl}
                  alt={file.name}
                  className="w-full h-full object-cover"
                  onLoad={() => URL.revokeObjectURL(previewUrl)}
                />

                {/* Primary Badge */}
                {isPrimary ? (
                  <div className="absolute top-1.5 left-1.5 bg-[#5B4DFF] text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                    <Star className="w-3 h-3 fill-white" />
                    <span>Primary</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPrimary(idx);
                    }}
                    className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 bg-black/60 hover:bg-[#5B4DFF] text-white text-[10px] font-bold px-2 py-0.5 rounded-md transition-all"
                  >
                    Set Primary
                  </button>
                )}

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition-colors shadow-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* File size footer */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 text-[10px] text-white/90 truncate">
                  {(file.size / (1024 * 1024)).toFixed(1)} MB
                </div>
              </div>
            );
          })}
        </div>
      )}

      {files.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50/70 p-3 rounded-xl border border-amber-200/60">
          <ImageIcon className="w-4 h-4 shrink-0 text-amber-600" />
          <span>At least 1 authentic photo is required to publish this resource on campus.</span>
        </div>
      )}
    </div>
  );
};
