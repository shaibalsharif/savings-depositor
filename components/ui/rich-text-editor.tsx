"use client"

import React, { useRef, useState, useEffect } from "react"
import dynamic from "next/dynamic"
import Quill from "quill"
const List = Quill.import("formats/list")
import { Button } from "@/components/ui/button"

// Register bullet and list formats
Quill.register(List, true)

// Dynamically import ReactQuill with SSR disabled
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false })
import "react-quill-new/dist/quill.snow.css"

const modules = {
  toolbar: {
    container: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image"],
      ["clean"],
    ],
  },
}

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "blockquote",
  "color",
  "background",
  "align",
  "list",
  "bullet",
  "link",
  "image",
]
export default function RichTextEditor({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  const [showSignature, setShowSignature] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Signature canvas drawing logic (same as before)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    let drawing = false

    const getXY = (e: MouseEvent | TouchEvent) => {
      let x = 0,
        y = 0
      if ("touches" in e) {
        x = e.touches[0].clientX - canvas.getBoundingClientRect().left
        y = e.touches[0].clientY - canvas.getBoundingClientRect().top
      } else {
        x = e.clientX - canvas.getBoundingClientRect().left
        y = e.clientY - canvas.getBoundingClientRect().top
      }
      return { x, y }
    }

    const start = (e: MouseEvent | TouchEvent) => {
      drawing = true
      ctx.beginPath()
      const { x, y } = getXY(e)
      ctx.moveTo(x, y)
    }
    const draw = (e: MouseEvent | TouchEvent) => {
      if (!drawing) return
      const { x, y } = getXY(e)
      ctx.lineTo(x, y)
      ctx.stroke()
    }
    const end = () => {
      drawing = false
      ctx.closePath()
    }

    canvas.addEventListener("mousedown", start)
    canvas.addEventListener("mousemove", draw)
    canvas.addEventListener("mouseup", end)
    canvas.addEventListener("mouseleave", end)
    canvas.addEventListener("touchstart", start)
    canvas.addEventListener("touchmove", draw)
    canvas.addEventListener("touchend", end)
    canvas.addEventListener("touchcancel", end)

    return () => {
      canvas.removeEventListener("mousedown", start)
      canvas.removeEventListener("mousemove", draw)
      canvas.removeEventListener("mouseup", end)
      canvas.removeEventListener("mouseleave", end)
      canvas.removeEventListener("touchstart", start)
      canvas.removeEventListener("touchmove", draw)
      canvas.removeEventListener("touchend", end)
      canvas.removeEventListener("touchcancel", end)
    }
  }, [showSignature])

  const insertSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dataUrl = canvas.toDataURL("image/png")
    onChange(value + `<p><img src="${dataUrl}" alt="signature" /></p>`)
    setShowSignature(false)
    clearSignature()
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  return (
    <div>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        className="min-h-[300px] max-h-[500px] border rounded-md bg-background w-full"
        style={{ minHeight: 300, maxHeight: 500 }}
      />
      <div className="flex justify-end mt-2">
        <Button type="button" variant="outline" onClick={() => setShowSignature(true)}>
          Insert Signature
        </Button>
      </div>

      {showSignature && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg w-full max-w-xs sm:max-w-md">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">Draw Signature</h3>
              <Button type="button" variant="ghost" onClick={() => setShowSignature(false)}>
                ✕
              </Button>
            </div>
            <canvas
              ref={canvasRef}
              width={350}
              height={90}
              className="border rounded-md w-full bg-white"
              style={{ touchAction: "none" }}
            />
            <div className="flex gap-2 mt-4">
              <Button type="button" onClick={insertSignature}>
                Insert Signature
              </Button>
              <Button type="button" variant="outline" onClick={clearSignature}>
                Clear
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
