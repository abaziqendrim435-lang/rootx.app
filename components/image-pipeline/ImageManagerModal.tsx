'use client';

import React, { useState } from 'react';
import type { NormalizedImage, ImageRole } from '@/lib/image-pipeline/types';
import { scoreImageQuality } from '@/lib/image-pipeline/ranker';
import { X, Upload, Trash2, Crown, ArrowUp, ArrowDown, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  images: NormalizedImage[];
  onUpdateImages: (updatedImages: NormalizedImage[]) => void;
}

export default function ImageManagerModal({ isOpen, onClose, images, onUpdateImages }: Props) {
  const [imageList, setImageList] = useState<NormalizedImage[]>(images);
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  // Move Image Up/Down
  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newList = [...imageList];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newList.length) return;

    const temp = newList[index];
    newList[index] = newList[targetIdx];
    newList[targetIdx] = temp;

    // First image gets assigned hero role automatically
    newList[0].role = 'hero';
    setImageList(newList);
  };

  // Set Hero Image directly
  const setAsHero = (id: string) => {
    const heroIndex = imageList.findIndex((img) => img.id === id);
    if (heroIndex <= 0) return;

    const newList = [...imageList];
    const [selected] = newList.splice(heroIndex, 1);
    selected.role = 'hero';
    newList.unshift(selected);

    setImageList(newList);
  };

  // Assign Role
  const assignRole = (id: string, role: ImageRole) => {
    const newList = imageList.map((img) => (img.id === id ? { ...img, role } : img));
    setImageList(newList);
  };

  // Remove Image
  const removeImage = (id: string) => {
    const newList = imageList.filter((img) => img.id !== id);
    if (newList.length > 0 && !newList.some((img) => img.role === 'hero')) {
      newList[0].role = 'hero';
    }
    setImageList(newList);
  };

  // Manual File Upload Handler (JPG, JPEG, PNG, WEBP, <= 10MB)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB

    Array.from(files).forEach((file) => {
      if (!validMimes.includes(file.type)) {
        setUploadError(`Invalid file format "${file.name}". Supported: JPG, PNG, WEBP.`);
        setIsUploading(false);
        return;
      }

      if (file.size > maxSizeBytes) {
        setUploadError(`File "${file.name}" exceeds maximum allowed size (10MB).`);
        setIsUploading(false);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          const newImg: NormalizedImage = {
            id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            originalUrl: dataUrl,
            normalizedUrl: dataUrl,
            width: 800,
            height: 800,
            aspectRatio: 1.0,
            source: 'manual',
            altText: file.name.replace(/\.[^/.]+$/, ''),
            role: imageList.length === 0 ? 'hero' : 'product-gallery',
            qualityScore: 95,
            isValid: true,
            isCustomUpload: true,
          };

          setImageList((prev) => [newImg, ...prev]);
        }
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    });
  };

  // Save changes and trigger parent update
  const handleSave = () => {
    onUpdateImages(imageList);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-4xl rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h3 className="font-bold text-base text-white">Product Image Manager & Uploads</h3>
            <p className="text-xs text-zinc-400">Reorder, select hero image, assign roles, or upload manual photos.</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Toolbar: Upload Button & Quick Actions */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-950/60 flex items-center justify-between flex-wrap gap-3">
          <label className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer transition-all">
            <Upload size={14} />
            Upload Image (JPG, PNG, WEBP)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {uploadError && (
            <span className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle size={12} /> {uploadError}
            </span>
          )}

          <span className="text-xs text-zinc-400 font-mono">
            {imageList.length} Images Managed
          </span>
        </div>

        {/* Image Grid List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {imageList.length === 0 ? (
            <div className="text-center py-12 text-zinc-400 text-xs">
              No images available. Click "Upload Image" above to add product photos.
            </div>
          ) : (
            imageList.map((img, idx) => {
              const isHero = idx === 0 || img.role === 'hero';

              return (
                <div
                  key={img.id}
                  className="p-3 rounded-xl border flex items-center gap-4 transition-all"
                  style={{
                    background: isHero ? 'rgba(59, 130, 246, 0.08)' : 'var(--color-surface, #18181b)',
                    borderColor: isHero ? '#3b82f6' : 'rgba(255, 255, 255, 0.08)',
                  }}
                >
                  {/* Reorder handle buttons */}
                  <div className="flex flex-col gap-1">
                    <button
                      disabled={idx === 0}
                      onClick={() => moveImage(idx, 'up')}
                      className="p-1 text-zinc-400 hover:text-white disabled:opacity-30"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      disabled={idx === imageList.length - 1}
                      onClick={() => moveImage(idx, 'down')}
                      className="p-1 text-zinc-400 hover:text-white disabled:opacity-30"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>

                  {/* Thumbnail Image */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-black/40 border border-zinc-800 flex-shrink-0 relative">
                    <img src={img.normalizedUrl} alt={img.altText} className="w-full h-full object-cover" />
                    {isHero && (
                      <span className="absolute top-1 left-1 bg-amber-500 text-black p-0.5 rounded-full" title="Hero Image">
                        <Crown size={10} />
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white truncate max-w-[200px]">{img.altText}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-zinc-800 text-zinc-300">
                        {img.source}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        Score: {img.qualityScore}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      {/* Role selection dropdown */}
                      <select
                        value={img.role}
                        onChange={(e) => assignRole(img.id, e.target.value as ImageRole)}
                        className="bg-zinc-800 text-xs text-zinc-200 border border-zinc-700 rounded px-2 py-1 font-mono"
                      >
                        <option value="hero">Hero Image</option>
                        <option value="featured-product">Featured Product</option>
                        <option value="product-gallery">Product Gallery</option>
                        <option value="lifestyle">Lifestyle</option>
                        <option value="benefit">Benefit</option>
                        <option value="final-cta">Final CTA</option>
                      </select>

                      {!isHero && (
                        <button
                          onClick={() => setAsHero(img.id)}
                          className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
                        >
                          <Crown size={12} /> Make Hero
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeImage(img.id)}
                    className="p-2 text-zinc-400 hover:text-red-400 rounded-lg transition-colors"
                    title="Remove Image"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between">
          <button
            onClick={() => setImageList(images)}
            className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
          >
            <RefreshCw size={12} /> Reset to Automatic Selection
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5"
            >
              <CheckCircle2 size={14} /> Apply Image Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
