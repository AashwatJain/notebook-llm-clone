import { useState, useEffect } from 'react';
import { FileText, Trash2, Loader2, PlusCircle } from 'lucide-react';
import { getDocuments, deleteDocument } from '../utils/api';

export default function Sidebar({ selectedDocument, onSelectDocument }) {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocs = async () => {
    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
    // In a real app, you might want to use a global state or event emitter 
    // to trigger this fetch when a new upload completes.
    // For now, we'll expose a global function as a simple hack
    window.refreshDocuments = fetchDocs;
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Prevent selecting while deleting
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await deleteDocument(id);
      if (selectedDocument?._id === id) {
        onSelectDocument(null);
      }
      fetchDocs();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="glass-sidebar" style={{
      width: '320px',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      zIndex: 20
    }}>
      <div style={{ padding: 'var(--spacing-2xl) var(--spacing-lg) var(--spacing-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xl)' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>N</span>
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            NotebookLLM
          </h1>
        </div>
        <button 
          className="btn-primary" 
          style={{ width: '100%', padding: 'var(--spacing-md)' }}
          onClick={() => onSelectDocument(null)}
        >
          <PlusCircle size={18} /> New Chat
        </button>
      </div>

      <div style={{ padding: '0 var(--spacing-md)', flex: 1, overflowY: 'auto' }}>
        <h2 style={{ fontSize: '0.875rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--spacing-sm)' }}>
          Your Documents
        </h2>
        
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-xl)' }}>
            <Loader2 className="animate-pulse" size={24} color="var(--text-muted)" />
          </div>
        ) : documents.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: 'var(--spacing-xl) 0' }}>
            No documents yet.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
            {documents.map(doc => (
              <div 
                key={doc._id}
                onClick={() => doc.status === 'ready' && onSelectDocument(doc)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--spacing-sm)',
                  borderRadius: 'var(--radius-md)',
                  cursor: doc.status === 'ready' ? 'pointer' : 'not-allowed',
                  backgroundColor: selectedDocument?._id === doc._id ? 'var(--bg-card-hover)' : 'transparent',
                  opacity: doc.status === 'ready' ? 1 : 0.6,
                  transition: 'background-color 0.2s',
                }}
                className={selectedDocument?._id !== doc._id && doc.status === 'ready' ? 'hover-bg-card' : ''}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', overflow: 'hidden' }}>
                  <FileText size={16} color={doc.status === 'ready' ? 'var(--accent-color)' : 'var(--text-muted)'} />
                  <span style={{ 
                    fontSize: '0.875rem', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    color: selectedDocument?._id === doc._id ? 'var(--text-primary)' : 'var(--text-secondary)'
                  }}>
                    {doc.originalName}
                  </span>
                </div>
                
                <button 
                  className="btn-ghost" 
                  onClick={(e) => handleDelete(e, doc._id)}
                  title="Delete Document"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`
        .hover-bg-card:hover {
          background-color: var(--bg-card);
        }
      `}</style>
    </div>
  );
}
