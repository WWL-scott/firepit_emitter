import React, { useEffect, useMemo, useState } from 'react';

type Manifest = {
  copied_images?: string[];
  copied_pdfs?: string[];
};

function labelFromFilename(filename: string): string {
  const stem = filename
    .replace(/\.[^/.]+$/, '')
    .replace(/^chart\d+_/, '')
    .replace(/_/g, ' ');

  return stem.replace(/\b\w/g, (m) => m.toUpperCase());
}

export function ReferenceArchive() {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const baseUrl = import.meta.env.BASE_URL || '/';

  useEffect(() => {
    let cancelled = false;

    fetch(`${baseUrl}archive/MANIFEST.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) setManifest(data);
      })
      .catch(() => {
        if (!cancelled) setManifest(null);
      });

    return () => {
      cancelled = true;
    };
  }, [baseUrl]);

  const images = useMemo(() => {
    const list = manifest?.copied_images ?? [];
    return [...list].sort((a, b) => a.localeCompare(b));
  }, [manifest]);

  const pdfs = useMemo(() => {
    const list = manifest?.copied_pdfs ?? [];
    return [...list].sort((a, b) => a.localeCompare(b));
  }, [manifest]);

  const [selectedImage, setSelectedImage] = useState<string>('');

  useEffect(() => {
    if (!selectedImage && images.length > 0) setSelectedImage(images[0]);
  }, [images, selectedImage]);

  return (
    <div
      style={{
        background: 'white',
        border: '1px solid #e9ecef',
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
      }}
    >
      <h4 style={{ marginTop: 0, fontSize: 15, fontWeight: 600, color: '#212529' }}>🗂️ Reference Charts & Docs</h4>
      <p style={{ color: '#6c757d', fontSize: 12, marginTop: 6, marginBottom: 12, lineHeight: 1.5 }}>
        Archived charts and design docs (from prior images) for quick cross-checking.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 320px) 1fr', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#495057', marginBottom: 6 }}>
            Select chart/image
          </label>
          <select
            value={selectedImage}
            onChange={(e) => setSelectedImage(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #ced4da',
              fontSize: 12,
              background: 'white',
            }}
          >
            {images.length === 0 && <option value="">(No archive manifest found)</option>}
            {images.map((img) => (
              <option key={img} value={img}>
                {labelFromFilename(img)}
              </option>
            ))}
          </select>

          {selectedImage && (
            <a
              href={`${baseUrl}archive/images/${selectedImage}`}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'inline-block', marginTop: 10, fontSize: 12, color: '#667eea', fontWeight: 600 }}
            >
              Open full-size
            </a>
          )}

          {pdfs.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#495057', marginBottom: 6 }}>PDFs</div>
              <div style={{ fontSize: 12, color: '#6c757d', lineHeight: 1.8 }}>
                {pdfs.map((pdf) => (
                  <div key={pdf}>
                    <a href={`${baseUrl}archive/pdfs/${pdf}`} target="_blank" rel="noreferrer" style={{ color: '#667eea' }}>
                      {pdf}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          {selectedImage ? (
            <img
              src={`${baseUrl}archive/images/${selectedImage}`}
              alt={labelFromFilename(selectedImage)}
              style={{
                width: '100%',
                maxHeight: 520,
                objectFit: 'contain',
                border: '1px solid #e9ecef',
                borderRadius: 8,
                background: '#fff',
              }}
            />
          ) : (
            <div style={{ color: '#6c757d', fontSize: 12 }}>No image selected.</div>
          )}
        </div>
      </div>
    </div>
  );
}
