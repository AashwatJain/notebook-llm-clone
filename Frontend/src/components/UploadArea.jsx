import { useState, useRef } from 'react';
import { UploadCloud, File, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { uploadDocument, checkJobStatus } from '../utils/api';

export default function UploadArea({ onUploadComplete }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, processing, error
  const [progressText, setProgressText] = useState('');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    if (selectedFile.type !== 'application/pdf') {
      setStatus('error');
      setProgressText('Only PDF files are allowed.');
      return;
    }
    if (selectedFile.size > 20 * 1024 * 1024) {
      setStatus('error');
      setProgressText('File exceeds 20MB limit.');
      return;
    }
    setFile(selectedFile);
    setStatus('idle');
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    setProgressText('Uploading document...');

    try {
      const res = await uploadDocument(file);
      const { jobId } = res.data;
      
      setStatus('processing');
      pollJobStatus(jobId);
      
      if (window.refreshDocuments) window.refreshDocuments();
    } catch (error) {
      setStatus('error');
      setProgressText(error.message);
    }
  };

  const pollJobStatus = async (jobId) => {
    try {
      const job = await checkJobStatus(jobId);
      setProgressText(`Processing: ${job.status}...`);

      if (job.status === 'completed') {
        setStatus('idle');
        setFile(null);
        if (window.refreshDocuments) window.refreshDocuments();
        // Since we don't return the full document from job status, 
        // the user can select it from the sidebar which will refresh automatically.
      } else if (job.status === 'failed') {
        setStatus('error');
        setProgressText('Document processing failed.');
      } else {
        // Continue polling every 2 seconds
        setTimeout(() => pollJobStatus(jobId), 2000);
      }
    } catch (error) {
      setStatus('error');
      setProgressText('Failed to check status. Check sidebar later.');
    }
  };

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--spacing-xl)'
    }}>
      <div 
        className={`glass-panel ${isDragging ? 'dragging' : ''}`}
        style={{
          width: '100%',
          maxWidth: '600px',
          padding: 'var(--spacing-xl)',
          textAlign: 'center',
          transition: 'all 0.3s ease',
          borderColor: isDragging ? 'var(--accent-color)' : 'var(--border-color)',
          transform: isDragging ? 'scale(1.02)' : 'scale(1)'
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--bg-input)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto var(--spacing-lg)',
          boxShadow: isDragging ? 'var(--shadow-glow)' : 'none',
          transition: 'box-shadow 0.3s ease'
        }}>
          {status === 'error' ? <AlertCircle size={40} color="var(--error)" /> :
           status === 'processing' || status === 'uploading' ? <Loader2 size={40} className="animate-pulse" color="var(--accent-color)" /> :
           <UploadCloud size={40} color="var(--accent-color)" />}
        </div>

        <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-sm)' }}>
          Upload your PDF Document
        </h2>
        
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--spacing-xl)' }}>
          {status === 'idle' && !file ? "Drag and drop your file here, or click to browse." :
           status === 'idle' && file ? `Selected: ${file.name}` :
           progressText}
        </p>

        {status === 'idle' && (
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center' }}>
            <input 
              type="file" 
              accept="application/pdf"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
            />
            <button 
              className="btn-ghost" 
              onClick={() => fileInputRef.current?.click()}
            >
              Browse Files
            </button>
            <button 
              className="btn-primary" 
              onClick={handleUpload}
              disabled={!file}
            >
              Start Upload
            </button>
          </div>
        )}
      </div>
      <style>{`
        .dragging {
          background-color: var(--bg-card-hover);
        }
      `}</style>
    </div>
  );
}
