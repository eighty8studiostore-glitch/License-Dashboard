'use client'; // Required for App Router

import { useState } from 'react';
import { uploadUpdate } from '../actions';

export default function UpdateManager() {
  const [version, setVersion] = useState('');
  const [notes, setNotes] = useState('');
  const [signature, setSignature] = useState('');
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [uploading, setUploading] = useState(false);

  // Helper: Read the .sig file content automatically
  const handleSigFileChange = async (e) => {
    const sigFile = e.target.files[0];
    if (sigFile) {
      const text = await sigFile.text();
      setSignature(text.trim());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setStatus('Uploading...');

    const formData = new FormData();
    formData.append('version', version);
    formData.append('notes', notes);
    formData.append('signature', signature);
    formData.append('file', file);

    // Call Server Action directly
    const result = await uploadUpdate(formData);

    if (result.success) {
      setStatus('✅ Update Published Successfully!');
      // Clear form...
    } else {
      setStatus(`❌ Error: ${result.error}`);
    }
    setUploading(false);
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1>🚀 Push New Update</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* 1. Version Input */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>New Version (e.g., 1.0.1)</label>
          <input
            type="text"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="1.0.1"
            style={{ width: '100%', padding: '10px' }}
            required
          />
        </div>

        {/* 2. Release Notes */}
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Release Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What's new in this version?"
            style={{ width: '100%', padding: '10px', height: '80px' }}
          />
        </div>

        {/* 3. Signature Input (Auto-fill via file) */}
        <div style={{ background: '#f4f4f4', padding: '15px', borderRadius: '8px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Signature (.sig)</label>
          <p style={{ fontSize: '12px', color: '#666' }}>Select the <code>.zip.sig</code> file to auto-fill this box.</p>

          <input type="file" accept=".sig" onChange={handleSigFileChange} style={{ marginBottom: '10px' }} />

          <textarea
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder="Signature string will appear here..."
            style={{ width: '100%', padding: '10px', height: '60px', fontFamily: 'monospace', fontSize: '12px' }}
            required
          />
        </div>

        {/* 4. Binary File Input */}
        <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Update File (.nsis.zip)</label>
          <input
            type="file"
            accept=".zip,.tar.gz,.exe"
            onChange={(e) => setFile(e.target.files[0])}
            required
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          style={{
            padding: '15px',
            background: uploading ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {uploading ? 'Uploading...' : 'Publish Update'}
        </button>
      </form>

      {status && <div style={{ marginTop: '20px', padding: '15px', background: '#eee', borderRadius: '5px' }}>{status}</div>}
    </div>
  );
}