/**
 * File Upload Hook
 * Manages drag-and-drop state, file validation, and upload triggering
 */

import { useState, useCallback, useRef } from 'react';
import { MAX_FILE_SIZE_BYTES, ALLOWED_FILE_EXTENSIONS } from '@/lib/constants';

export interface UseFileUploadReturn {
  file: File | null;
  isDragging: boolean;
  error: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  handleDragEnter: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => File | null;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => File | null;
  handleClick: () => void;
  clearFile: () => void;
  clearError: () => void;
}

function validateFile(file: File): string | null {
  // Check extension
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (!ALLOWED_FILE_EXTENSIONS.includes(ext)) {
    return `Invalid file type. Please upload a CSV file (.csv, .txt)`;
  }

  // Check size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`;
  }

  // Check if file is empty
  if (file.size === 0) {
    return 'File is empty';
  }

  return null;
}

export function useFileUpload(): UseFileUploadReturn {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const processFile = useCallback((file: File): File | null => {
    setError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return null;
    }
    setFile(file);
    return file;
  }, []);

  const handleDrop = useCallback((e: React.DragEvent): File | null => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (files.length === 0) return null;

    const droppedFile = files[0];
    return processFile(droppedFile);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>): File | null => {
    const files = e.target.files;
    if (!files || files.length === 0) return null;

    const selectedFile = files[0];
    return processFile(selectedFile);
  }, [processFile]);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const clearFile = useCallback(() => {
    setFile(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    file,
    isDragging,
    error,
    inputRef,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFileSelect,
    handleClick,
    clearFile,
    clearError,
  };
}
