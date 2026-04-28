import React, { useState, useRef } from 'react';
import { upload } from '@vercel/blob/client';
import { UploadCloud, X, File as FileIcon, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onUpload: (url: string, filename: string) => void;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUpload, disabled }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ url: string; name: string }[]>([]);
  const inputFileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    setIsUploading(true);

    try {
      const newBlob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      });
      
      setUploadedFiles(prev => [...prev, { url: newBlob.url, name: file.name }]);
      onUpload(newBlob.url, file.name);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed: ' + (error as Error).message);
    } finally {
      setIsUploading(false);
      // reset file input
      if (inputFileRef.current) {
        inputFileRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <label className={`relative flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-all cursor-pointer border-2 ${
          disabled || isUploading 
            ? 'opacity-50 cursor-not-allowed bg-gray-100 border-gray-200 text-gray-400' 
            : 'bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-200'
        }`}>
          {isUploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
          <span>{isUploading ? 'Uploading...' : 'Attach File'}</span>
          <input
            name="file"
            ref={inputFileRef}
            type="file"
            required
            disabled={disabled || isUploading}
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
        </label>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="flex flex-col gap-2">
          {uploadedFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                <FileIcon size={14} />
              </div>
              <a href={f.url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-gray-700 hover:text-indigo-600 truncate max-w-[200px]">
                {f.name}
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
