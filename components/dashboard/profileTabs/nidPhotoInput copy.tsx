"use client"

import { useState, useRef } from "react"
import Webcam from "react-webcam"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export default function NidPhotoInput({
  label,
  existingImageUrl,
  onChange,
}: {
  label: string
  existingImageUrl?: string
  onChange: (file: File | null) => void
}) {
  const [showCamera, setShowCamera] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(existingImageUrl)
  const webcamRef = useRef<Webcam>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // When user selects file from upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    setPreviewUrl(URL.createObjectURL(file))
    onChange(file)
  }

  // Capture photo from webcam
  const capturePhoto = () => {
    if (!webcamRef.current) return
    const imageSrc = webcamRef.current.getScreenshot()
    if (!imageSrc) return

    fetch(imageSrc)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `${label.replace(/\s+/g, "-").toLowerCase()}.jpeg`, { type: "image/jpeg" })
        setPreviewUrl(imageSrc)
        onChange(file)
        setShowCamera(false)
      })
  }

  // Clear selected image and reset
  const clearImage = () => {
    setPreviewUrl(undefined)
    onChange(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="mb-4">
      <label className="block font-medium mb-1">{label}</label>

      {previewUrl ? (
        <div className="relative inline-block">
          <img src={previewUrl} alt={`${label} preview`} className="h-40 w-auto rounded border" />
          <button
            type="button"
            onClick={clearImage}
            className="absolute top-1 right-1 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-75"
            aria-label="Remove image"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ) : showCamera ? (
        <div className="mb-2">
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            className="rounded border"
          />
          <div className="flex gap-2 mt-2">
            <Button onClick={capturePhoto}>Capture</Button>
            <Button variant="outline" onClick={() => setShowCamera(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            id={`${label}-file-input`}
            className="hidden"
          />
          <label htmlFor={`${label}-file-input`}>
            <Button variant="outline" asChild>Upload Image</Button>
          </label>
          <Button variant="outline" onClick={() => setShowCamera(true)}>Take Photo</Button>
        </div>
      )}
    </div>
  )
}
