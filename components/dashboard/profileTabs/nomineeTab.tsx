import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useUploadThing } from "@/lib/uploadthing"
import { useToast } from "@/hooks/use-toast"

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
  const [saving, setSaving] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const { startUpload } = useUploadThing("userPhoto")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    setSelectedFile(file)
    setImagePreviewUrl(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      let photoUrl = form.photo
      if (selectedFile) {
        const uploaded = await startUpload([selectedFile])
        if (uploaded?.[0]?.ufsUrl) photoUrl = uploaded[0].ufsUrl
      }
      const payload = { ...form, photo: photoUrl }
      const res = await fetch("/api/nominee", {
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
    <form className="space-y-4 max-w-xl mx-auto p-4 sm:p-6" onSubmit={e => { e.preventDefault(); handleSave() }}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Name</Label>
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="w-full" />
        </div>
        <div>
          <Label>Relation</Label>
          <Input value={form.relation} onChange={e => setForm(f => ({ ...f, relation: e.target.value }))} required className="w-full" />
        </div>
        <div>
          <Label>Date of Birth</Label>
          <Input type="date" value={form.dob} onChange={e => setForm(f => ({ ...f, dob: e.target.value }))} required className="w-full" />
        </div>
        <div>
          <Label>Mobile</Label>
          <Input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} required className="w-full" />
        </div>
        <div>
          <Label>NID Number</Label>
          <Input value={form.nidNumber} onChange={e => setForm(f => ({ ...f, nidNumber: e.target.value }))} required className="w-full" />
        </div>
        <div className="sm:col-span-2">
          <Label>Address</Label>
          <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} required className="w-full" />
        </div>
        <div className="sm:col-span-2">
          <Label>Photo</Label>
          <div className="flex items-center gap-2">
            {imagePreviewUrl && (
              <Avatar>
                <AvatarImage src={imagePreviewUrl} />
                <AvatarFallback>IMG</AvatarFallback>
              </Avatar>
            )}
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              id="nominee-photo"
            />
            <label htmlFor="nominee-photo">
              <Button variant="outline" asChild>Upload</Button>
            </label>
          </div>
        </div>
      </div>
      <div className="flex justify-center">
        <Button type="submit" disabled={saving} className="w-full sm:w-auto px-8 py-2">
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  )
}
