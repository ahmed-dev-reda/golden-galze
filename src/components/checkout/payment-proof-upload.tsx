"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { ALLOWED_SCREENSHOT_TYPES, MAX_SCREENSHOT_SIZE } from "@/lib/constants";

import { ImageIcon } from "lucide-react";

const acceptedTypes = "image/jpeg,image/png,image/webp";

export function PaymentProofUpload({ required = false }: { required?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  function clearSelection() {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
    setPreviewUrl(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function chooseFile(file?: File) {
    if (!file) return;
    if (!ALLOWED_SCREENSHOT_TYPES.includes(file.type)) {
      clearSelection();
      setError("اختار صورة بصيغة JPG أو PNG أو WEBP.");
      return;
    }
    if (file.size > MAX_SCREENSHOT_SIZE) {
      clearSelection();
      setError("حجم الصورة لازم يكون 5 ميجابايت أو أقل.");
      return;
    }

    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(file);
    previewRef.current = url;
    setPreviewUrl(url);
    setFileName(file.name);
    setError("");
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (!file) return;

    const transfer = new DataTransfer();
    transfer.items.add(file);
    if (inputRef.current) inputRef.current.files = transfer.files;
    chooseFile(file);
  }

  function removeFile() {
    clearSelection();
    setError("");
  }

  return (
    <div className="flex flex-col gap-2 sm:col-span-2">
      <label
        className="text-[13px] font-semibold text-[#493a34]"
        htmlFor="payment-proof"
      >
        صورة تحويل InstaPay
      </label>
      <input
        ref={inputRef}
        className="sr-only"
        id="payment-proof"
        name="screenshot"
        type="file"
        accept={acceptedTypes}
        required={required}
        onChange={(event) => chooseFile(event.currentTarget.files?.[0])}
        aria-describedby="payment-proof-help"
      />

      {previewUrl ? (
        <div className="flex items-center gap-3 rounded-lg border border-line bg-page p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="size-20 rounded-md object-cover"
            src={previewUrl}
            alt="معاينة صورة التحويل"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{fileName}</p>
            <p className="m-0 text-xs text-muted">تم اختيار الصورة</p>
          </div>
          <button
            className="rounded-md px-2 py-1 text-xs text-warm hover:bg-soft-surface"
            type="button"
            onClick={() => inputRef.current?.click()}
          >
            تغيير
          </button>
          <button
            className="rounded-md px-2 py-1 text-xs text-[#9b4255] hover:bg-brand-light"
            type="button"
            onClick={removeFile}
          >
            إزالة
          </button>
        </div>
      ) : (
        <button
          className={`flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
            isDragging
              ? "border-brand bg-brand-light"
              : "border-field-line bg-page hover:bg-brand-light/60"
          }`}
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          aria-describedby="payment-proof-help"
        >
          <span
            className="grid size-11 place-items-center rounded-full bg-white text-xl text-brand shadow-sm"
            aria-hidden="true"
          >
            <ImageIcon />
          </span>
          <span className="text-sm font-semibold">اضغط لاختيار الصورة</span>
          <span className="text-xs text-muted">
            أو اسحب صورة التحويل وأرميها هنا
          </span>
        </button>
      )}
      <p
        className="m-0 text-xs leading-6 text-muted"
        id="payment-proof-help"
      >
        الصيغ المسموحة JPG وPNG وWEBP، بحد أقصى 5 ميجابايت.
      </p>
      {error && (
        <p className="m-0 text-xs text-[#9b2939]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
