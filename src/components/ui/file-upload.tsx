import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Label } from './label';
import { Upload, X, File, Image as ImageIcon, FileText, FileArchive, Film } from 'lucide-react';
import { Progress } from './progress';

interface FileUploadProps {
  readonly onChange: (files: File[]) => void;
  readonly value?: readonly File[];
  readonly maxFiles?: number;
  readonly maxSize?: number; // in MB
  readonly accept?: string;
  readonly className?: string;
  readonly label?: string;
  readonly description?: string;
  readonly error?: string;
  readonly disabled?: boolean;
  readonly multiple?: boolean;
  readonly showPreview?: boolean;
}

export function FileUpload({
  onChange,
  value = [],
  maxFiles = 5,
  maxSize = 10, // 10MB default
  accept = '*',
  className,
  label,
  description,
  error,
  disabled = false,
  multiple = true,
  showPreview = true,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Validate file size
  const validateFileSize = (file: File): boolean => {
    const isValidSize = file.size <= maxSize * 1024 * 1024;
    if (!isValidSize) {
      console.error(`File ${file.name} exceeds the maximum size of ${maxSize}MB`);
    }
    return isValidSize;
  };

  // Simulate file upload progress
  const simulateUpload = (file: File) => {
    const fileId = Date.now() + file.name;
    setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 10) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
    }, 200);
  };

  // Process and validate new files
  const processNewFiles = (newFiles: File[]): File[] => {
    if (multiple && value.length + newFiles.length > maxFiles) {
      console.error(`Maximum ${maxFiles} files allowed`);
      return [];
    }
    return newFiles.filter(validateFileSize);
  };

  // Handle file selection from file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const newFiles = Array.from(e.target.files);
      const validFiles = processNewFiles(newFiles);
      if (validFiles.length > 0) {
        validFiles.forEach(simulateUpload);
        const updatedFiles = multiple ? [...value, ...validFiles] : validFiles;
        onChange(updatedFiles);
      }
    }
  };
  
  // Handle file drop
  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files?.length) {
      const newFiles = Array.from(e.dataTransfer.files);
      const validFiles = processNewFiles(newFiles);
      if (validFiles.length > 0) {
        validFiles.forEach(simulateUpload);
        const updatedFiles = multiple ? [...value, ...validFiles] : validFiles;
        onChange(updatedFiles);
      }
    }
  };
  
  // Handle drag events
  const handleDrag = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  // Handle removing a file
  const handleRemoveFile = (index: number) => {
    const updatedFiles = [...value];
    updatedFiles.splice(index, 1);
    onChange(updatedFiles);
  };
  
  // Get file icon based on MIME type
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-5 w-5 text-[hsl(196,80%,43%)]" />;
    } else if (file.type.startsWith('video/')) {
      return <Film className="h-5 w-5 text-[hsl(354,70%,54%)]" />;
    } else if (file.type.includes('pdf') || file.type.includes('document')) {
      return <FileText className="h-5 w-5 text-[hsl(38,92%,50%)]" />;
    } else if (file.type.includes('zip') || file.type.includes('compressed')) {
      return <FileArchive className="h-5 w-5 text-[hsl(220,14%,46%)]" />;
    } else {
      return <File className="h-5 w-5 text-[hsl(220,14%,46%)]" />;
    }
  };
  
  // Format file size
  const formatFileSize = (size: number) => {
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
  };
  
  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label className="text-[hsl(206,33%,16%)]">{label}</Label>}
      
      <button
        type="button"
        disabled={disabled}
        aria-label="File upload area. Drag and drop files here or click to browse."
        className={cn(
          "w-full border-2 border-dashed rounded-md p-6 text-center outline-none focus:ring-2 focus:ring-[hsl(196,80%,43%)] focus:ring-offset-2 transition-colors bg-transparent",
          dragActive ? "border-[hsl(196,80%,43%)] bg-[hsl(196,80%,95%)]" : "border-[hsl(215,16%,80%)] hover:border-[hsl(196,80%,60%)]",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          className
        )}
        onDragEnter={disabled ? undefined : handleDrag}
        onDragLeave={disabled ? undefined : handleDrag}
        onDragOver={disabled ? undefined : handleDrag}
        onDrop={disabled ? undefined : handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          multiple={multiple}
          className="hidden"
          disabled={disabled}
          title="File selector"
          aria-label="File upload"
          placeholder="Choose files"
        />
        
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-10 w-10 text-[hsl(220,14%,46%)]" />
          <p className="text-sm font-medium text-[hsl(206,33%,16%)]">
            Drag and drop files here or{' '}
            <Button
              type="button"
              variant="link"
              className="text-[hsl(196,80%,43%)] p-0 h-auto focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(196,80%,60%)] rounded-sm"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || (multiple && value.length >= maxFiles)}
              aria-disabled={disabled || (multiple && value.length >= maxFiles)}
            >
              browse
            </Button>
          </p>
          {description && (
            <p className="text-xs text-[hsl(220,14%,46%)]">{description}</p>
          )}
          <p className="text-xs text-[hsl(220,14%,46%)]">
            Max {maxFiles} files, up to {maxSize}MB each
          </p>
        </div>
      </button>
      
      {error && (
        <p className="text-sm text-[hsl(354,70%,54%)]">{error}</p>
      )}
      
      {showPreview && value.length > 0 && (
        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-medium text-[hsl(206,33%,16%)]" id="selected-files-heading">Selected Files</h3>
          <ul className="space-y-2">
            {value.map((file, index) => (
              <li key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center justify-between p-2 border rounded-md">
                <div className="flex items-center gap-2">
                  {getFileIcon(file)}
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-[hsl(206,33%,16%)] truncate max-w-[200px]">
                      {file.name}
                    </p>
                    <p className="text-xs text-[hsl(220,14%,46%)]">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                
                {uploadProgress[Date.now() + file.name] !== undefined && 
                  uploadProgress[Date.now() + file.name] < 100 ? (
                  <div className="w-24">
                    <Progress 
                      value={uploadProgress[Date.now() + file.name]} 
                      className="h-2 bg-[hsl(215,16%,90%)]" 
                    />
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-[hsl(354,70%,54%)]"
                    onClick={() => handleRemoveFile(index)}
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
