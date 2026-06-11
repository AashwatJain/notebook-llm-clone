const API_BASE = 'http://localhost:8000/api';

export const uploadDocument = async (file) => {
  const formData = new FormData();
  formData.append('pdf', file);

  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    body: formData,
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Upload failed');
  }
  return res.json();
};

export const getDocuments = async () => {
  const res = await fetch(`${API_BASE}/documents`);
  if (!res.ok) throw new Error('Failed to fetch documents');
  const data = await res.json();
  return data.data.documents || [];
};

export const deleteDocument = async (id) => {
  const res = await fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete document');
  return res.json();
};

export const checkJobStatus = async (jobId) => {
  const res = await fetch(`${API_BASE}/job/${jobId}`);
  if (!res.ok) throw new Error('Failed to check job status');
  const data = await res.json();
  return data.data; // { jobId, status, documentId }
};
