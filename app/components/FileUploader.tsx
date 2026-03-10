import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { formatSize } from '../lib/utils';

interface FileUploaderProps {
    onFileSelect?: (file: File | null) => void;
}

const FileUploader = ({ onFileSelect }: FileUploaderProps) => {
    const maxFileSize = 20 * 1024 * 1024;

    const onDrop = useCallback((acceptedFiles: File[]) => {
        onFileSelect?.(acceptedFiles[0] ?? null);
    }, [onFileSelect]);

    const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
        onDrop,
        multiple: false,
        accept: { 'application/pdf': ['.pdf'] },
        maxSize: maxFileSize,
    });

    const file = acceptedFiles[0] ?? null;

    return (
        <div {...getRootProps()} className={`upload-zone ${isDragActive ? 'drag-active' : ''}`}>
            <input {...getInputProps()} />
            {file ? (
                <div className="selected-file" onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <div style={{
                            width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem',
                            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                            </svg>
                        </div>
                        <div>
                            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#c8d0e7', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {file.name}
                            </p>
                            <p style={{ fontSize: '0.8rem', color: '#4a5568', marginTop: '0.125rem' }}>
                                {formatSize(file.size)}
                            </p>
                        </div>
                    </div>
                    <button
                        style={{
                            width: '1.875rem', height: '1.875rem', borderRadius: '9999px',
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                            color: '#fca5a5', cursor: 'pointer', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', flexShrink: 0, fontSize: '0.8rem',
                        }}
                        onClick={e => { e.stopPropagation(); onFileSelect?.(null); }}
                        type="button"
                    >
                        ✕
                    </button>
                </div>
            ) : (
                <div>
                    <div className="upload-zone-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                    </div>
                    <p className="upload-zone-title">
                        {isDragActive ? 'Drop your PDF here' : 'Click to upload or drag & drop'}
                    </p>
                    <p className="upload-zone-subtitle">PDF — max {formatSize(maxFileSize)}</p>
                </div>
            )}
        </div>
    );
};

export default FileUploader;
