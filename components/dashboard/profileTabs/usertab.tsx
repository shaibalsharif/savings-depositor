import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUploadThing } from "@/lib/uploadthing"

export default function UserTab({ user }: { user: any }) {
  const { toast } = useToast()
  const [profile, setProfile] = useState<any>(user)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(user.picture || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
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
      let pictureUrl = profile.picture

      if (selectedFile) {
        setUploading(true)
        const uploaded = await startUpload([selectedFile])
        if (uploaded?.[0]?.ufsUrl) {
          pictureUrl = uploaded[0].ufsUrl
        } else {
          throw new Error("Image upload failed")
        }
      }

      const updateData = {
        given_name: profile.given_name,
        family_name: profile.family_name,
        picture: pictureUrl,
      }

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to update profile")
      }

      const { user: updatedUser } = await res.json()
      setProfile(updatedUser)
      setSelectedFile(null)
      setIsEditing(false)
      toast({ title: "Profile updated successfully" })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto p-4">
      <div className="flex flex-col items-center">
        {isEditing ? (
          <div className="relative border border-dashed rounded-md p-4 w-48 mx-auto">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={() => {
                setImagePreviewUrl(null)
                setSelectedFile(null)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
            <div className="flex flex-col items-center gap-2 text-center">
              <Avatar className="h-20 w-20">
                <AvatarImage src={imagePreviewUrl || profile.picture} />
                <AvatarFallback>IMG</AvatarFallback>
              </Avatar>
              <p className="text-sm text-muted-foreground">Image ready to upload</p>
            </div>
          </div>
        ) : (
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.picture || ""} />
            <AvatarFallback>{profile.given_name?.[0] || "U"}</AvatarFallback>
          </Avatar>
        )}
        {isEditing && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
              id="profile-image"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mt-2"
            >
              {uploading ? "Uploading..." : "Upload Image"}
            </Button>
          </>
        )}
      </div>

      <div className="space-y-4 max-w-xl mx-auto">
        <div>
          <Label>First Name</Label>
          <Input
            value={profile.given_name || ""}
            onChange={e => setProfile({ ...profile, given_name: e.target.value })}
            disabled={!isEditing}
            className="w-full"
          />
        </div>

        <div>
          <Label>Last Name</Label>
          <Input
            value={profile.family_name || ""}
            onChange={e => setProfile({ ...profile, family_name: e.target.value })}
            disabled={!isEditing}
            className="w-full"
          />
        </div>

        <div>
          <Label>Email</Label>
          <Input value={profile.email} disabled className="w-full" />
        </div>
      </div>

      <div className="flex justify-between pt-4 max-w-xl mx-auto">
        <Button onClick={() => setIsEditing(!isEditing)} variant="secondary" className="w-full sm:w-auto">
          {isEditing ? "Cancel" : "Edit"}
        </Button>
        {isEditing && (
          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </div>
    </div>
  )
}
