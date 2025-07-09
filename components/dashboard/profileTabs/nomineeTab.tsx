import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUploadThing } from "@/lib/uploadthing"
import { useToast } from "@/hooks/use-toast"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Upload, X } from "lucide-react"

export default function NomineeTab({ user }: { user: any }) {
  const { toast } = useToast()
  const [form, setForm] = useState({
    name: "",
    relation: "",
    dob: "",
    mobile: "",
    nidNumber: "",
    address: "",
    photo: "",
  })
  const [initialValues, setInitialValues] = useState<typeof form>(form)
  const [file, setFile] = useState<File | null>(null)

  const [saving, setSaving] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const { startUpload } = useUploadThing("nomineePhoto")



  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/profile/nominee")
      if (!res.ok) return
      const data = await res.json()
      if (data.nomineeInfo) {
        setForm(data.nomineeInfo)
        setInitialValues(data.nomineeInfo)
      }
    }
    fetchData()
  }, [])

  const isFieldDisabled = (key: keyof typeof form) => !!initialValues[key]

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    const file = e.target.files[0]
    setFile(file)
    setForm(f => ({ ...f, photo: URL.createObjectURL(file) }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      let photoUrl = initialValues.photo
      if (file) {
        const uploaded = await startUpload([file])
        if (uploaded?.[0]?.url) {
          photoUrl = uploaded[0].url
        }
      }

      const payload = { ...form, photo: photoUrl }

      const res = await fetch("/api/profile/nominee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save nominee")
      }

      toast({ title: "Nominee information saved!" })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nominee Info</CardTitle>
        <CardDescription>Nominee Information one-time change</CardDescription>
      </CardHeader>
      <form onSubmit={(e) => { e.preventDefault(); handleSave() }}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {["name", "relation", "dob", "mobile", "nidNumber", "address"].map(field => (
              <div key={field} className={field === "address" ? "sm:col-span-2" : ""}>
                <Label>{field === "nidNumber" ? "NID Number" : field.charAt(0).toUpperCase() + field.slice(1)}</Label>
                <Input
                  type={field === "dob" ? "date" : "text"}
                  value={form[field as keyof typeof form]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  disabled={isFieldDisabled(field as keyof typeof form)}
                />
              </div>
            ))}
          </div>

          {/* Custom Upload */}
          <div className="space-y-2 col-span-full">
            <Label htmlFor="receipt">Photo</Label>
            {file ? (
              <div className="relative rounded-md border border-dashed p-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2"
                  onClick={() => setFile(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="text-center">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8">
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <div className="mb-2 text-center">
                  <p className="font-medium">Drag and drop your nominee photo</p>
                  <p className="text-sm text-muted-foreground">Supports JPEG/PNG (max 1MB)</p>
                </div>
                <Input
                  id="receipt"
                  type="file"
                  className="hidden"
                  accept=".jpeg,.jpg,.png"
                  onChange={handleFileChange}
                />
                <Button type="button" variant="outline" onClick={() => document.getElementById("receipt")?.click()}>
                  Select File
                </Button>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button type="submit" disabled={saving} className="w-full sm:w-auto px-8 py-2">
            {saving ? "Saving..." : "Save"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}