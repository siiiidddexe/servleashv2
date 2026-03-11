import { useState, useRef, useCallback } from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { X, Check, RotateCcw } from "lucide-react";

/**
 * ImageCropper — pick a file, crop it to a square, return a Blob.
 * Props:
 *   onCropped(blob, previewUrl)  — called with the final cropped image
 *   onCancel()                   — called when the user cancels
 *   aspectRatio                  — default 1 (square)
 */
export default function ImageCropper({ onCropped, onCancel, aspectRatio = 1 }) {
  const [src, setSrc] = useState(null);
  const [crop, setCrop] = useState({ unit: "%", width: 80, aspect: aspectRatio });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);

  const onSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => setSrc(reader.result));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = useCallback((e) => {
    imgRef.current = e.currentTarget;
    const { width, height } = e.currentTarget;
    const size = Math.min(width, height) * 0.8;
    setCrop({
      unit: "px",
      width: size,
      height: size / aspectRatio,
      x: (width - size) / 2,
      y: (height - size / aspectRatio) / 2,
    });
  }, [aspectRatio]);

  const getCroppedBlob = useCallback(() => {
    const image = imgRef.current;
    if (!image || !completedCrop) return;

    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const pxCrop = completedCrop;

    canvas.width = pxCrop.width * scaleX;
    canvas.height = pxCrop.height * scaleY;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(
      image,
      pxCrop.x * scaleX,
      pxCrop.y * scaleY,
      pxCrop.width * scaleX,
      pxCrop.height * scaleY,
      0, 0,
      canvas.width,
      canvas.height
    );

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        onCropped(blob, url);
      }
    }, "image/png", 0.92);
  }, [completedCrop, onCropped]);

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-[400px] overflow-hidden">
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border-light">
          <h3 className="text-[15px] font-bold text-brand-dark">Crop Image</h3>
          <button onClick={onCancel} className="h-8 w-8 rounded-full bg-brand-bg flex items-center justify-center">
            <X size={16} className="text-brand-dark" />
          </button>
        </div>

        <div className="p-4">
          {!src ? (
            <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-brand-border rounded-xl cursor-pointer hover:border-brand-orange transition-colors">
              <p className="text-[13px] text-brand-light font-medium">Tap to select an image</p>
              <p className="text-[11px] text-brand-light/60 mt-1">PNG, JPG, SVG — any size</p>
              <input type="file" accept="image/*" className="hidden" onChange={onSelectFile} />
            </label>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="max-h-[300px] overflow-auto rounded-xl">
                <ReactCrop crop={crop} onChange={setCrop} onComplete={setCompletedCrop} aspect={aspectRatio}>
                  <img src={src} onLoad={onImageLoad} alt="Crop" className="max-w-full" />
                </ReactCrop>
              </div>

              <div className="flex gap-2 w-full">
                <button
                  onClick={() => setSrc(null)}
                  className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl bg-brand-bg text-brand-medium text-[13px] font-semibold"
                >
                  <RotateCcw size={14} /> Change
                </button>
                <button
                  onClick={getCroppedBlob}
                  className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl bg-brand-orange text-white text-[13px] font-semibold"
                >
                  <Check size={14} /> Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
