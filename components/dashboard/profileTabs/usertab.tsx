'use client'
import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUploadThing } from "@/lib/uploadthing"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs"

export default function UserTab() {

  const { user } = useKindeAuth()
  const userId = user?.id
  const { toast } = useToast()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { startUpload } = useUploadThing("userImage")

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(`/api/users?user_id=${userId}`)
        const data = await res.json()


        setProfile(data.users[0])
        console.log(data.users);

        setImagePreviewUrl(data.users[0].avatar || null)
      } catch {
        toast({ title: "Failed to load user", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [userId]) // ✅ This MUST NOT be empty or missing

  // if (loading || !profile) return <div>Loading...</div>

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    setSelectedFile(file)
    setImagePreviewUrl(URL.createObjectURL(file))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      let pictureUrl = profile.picture

      if (selectedFile) {
        setUploading(true)
        console.log(selectedFile);
        const file = selectedFile

        const uploaded = await startUpload([file])
        console.log(uploaded);

        if (uploaded?.[0]?.ufsUrl) {
          pictureUrl = uploaded[0].ufsUrl

        } else {
          throw new Error("Image upload failed")
        }
      }

      const updateData = {
        given_name: profile.first_name,
        family_name: profile.last_name,
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

  if (!profile || loading)
    return <>Loading...</>


  return (
    <Card>
      <CardHeader>
        <CardTitle>User Account Info</CardTitle>
        <CardDescription>user account additional information</CardDescription>
      </CardHeader>
      <form onSubmit={handleSave}>
        <CardContent className="space-y-4 md:space-y-2 md:grid md:grid-cols-2 gap-6" >
          <div className="flex flex-col items-center w-full">
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
                    <AvatarImage src={imagePreviewUrl || profile.avatar} />
                    <AvatarFallback>IMG</AvatarFallback>
                  </Avatar>
                  <p className="text-sm text-muted-foreground">Image ready to upload</p>
                </div>
              </div>
            ) : (
              <Avatar className="h-32 w-32 ">

                <AvatarImage className="size-30" src={profile.avatar  || ""} />
                <AvatarFallback>{profile.first_name?.[0] || "U"}</AvatarFallback>
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

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input
                value={profile.first_name || ""}
                onChange={e => setProfile({ ...profile, first_name: e.target.value })}
                disabled={!isEditing}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input
                value={profile.last_name || ""}
                onChange={e => setProfile({ ...profile, last_name: e.target.value })}
                disabled={!isEditing}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={profile.email} disabled className="w-full" />
            </div>
          </div>

          <div className="flex justify-between pt-4 max-w-xl mx-auto">
            <Button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsEditing(!isEditing) }} variant="secondary" className="w-full sm:w-auto">
              {isEditing ? "Cancel" : "Edit"}
            </Button>
            {isEditing && (
              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </div>
        </CardContent>
      </form>
    </Card>
  )
}
