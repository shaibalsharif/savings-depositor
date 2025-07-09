import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import Webcam from "react-webcam"
import SignatureCanvas from "react-signature-canvas"
import { useUploadThing } from "@/lib/uploadthing"
import { useToast } from "@/hooks/use-toast"
import NidPhotoInput from "./nidPhotoInput"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"


export default function PersonalInfoTab({ user }: { user: any }) {
  const { toast } = useToast()
  const initialForm = {
    name: "",
    nameBn: "",
    father: "",
    dob: "",
    profession: "",
    religion: "",
    presentAddress: "",
    permanentAddress: "",
    mobile: user.phone || "",
    nidNumber: "",
    nidFront: "",
    nidBack: "",
    signature: "",
  };
  const [form, setForm] = useState({ ...initialForm });
  const [initialValues, setInitialValues] = useState({ ...initialForm });

  const [nidFrontFile, setNidFrontFile] = useState<File | null>(null)
  const [nidBackFile, setNidBackFile] = useState<File | null>(null)

  const [showCamera, setShowCamera] = useState<"nidFront" | "nidBack" | null>(null)
  const webcamRef = useRef<Webcam>(null)
  const sigCanvasRef = useRef<SignatureCanvas>(null)
  const { startUpload } = useUploadThing("userDocuments")

  const captureNidPhoto = async (side: "nidFront" | "nidBack") => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (!imageSrc) return

    const blob = await fetch(imageSrc).then(r => r.blob())
    const file = new File([blob], `${side}-nid.jpg`, { type: "image/jpeg" })
    const uploaded = await startUpload([file])
    if (uploaded?.[0]?.ufsUrl) {
      setForm(prev => ({ ...prev, [side]: uploaded[0].ufsUrl }))
    }
    setShowCamera(null)
  }

  const handleSignatureSave = () => {
    const canvas = sigCanvasRef.current?.getCanvas()
    if (!canvas) return

    canvas.toBlob(async blob => {
      if (!blob) return
      const file = new File([blob], "signature.png", { type: "image/png" })
      const uploaded = await startUpload([file])
      if (uploaded?.[0]?.ufsUrl) {
        setForm(prev => ({ ...prev, signature: uploaded[0].ufsUrl }))
        toast({ title: "Signature saved!" })
      }
    })
  }

  const handleSave = async () => {
    try {
      // Upload profile photo if changed


      // Upload NID photos if files selected (fallback if you want)
      if (nidFrontFile) {
        const uploaded = await startUpload([nidFrontFile])
        if (uploaded?.[0]?.ufsUrl) setForm(f => ({ ...f, nidFront: uploaded[0].ufsUrl }))
      }
      if (nidBackFile) {
        const uploaded = await startUpload([nidBackFile])
        if (uploaded?.[0]?.ufsUrl) setForm(f => ({ ...f, nidBack: uploaded[0].ufsUrl }))
      }

      const payload = {
        ...form,
      }

      const res = await fetch("/api/profile/personal-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save personal info")
      }

      toast({ title: "Personal information saved!" })
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }
  }


  useEffect(() => {
    async function fetchExistingData() {
      try {
        const res = await fetch("/api/profile/personal-info");
        if (!res.ok) return;
        const data = await res.json();
        if (data.personalInfo) {
          setForm(prev => ({ ...prev, ...data.personalInfo }));
          setInitialValues(prev => ({ ...prev, ...data.personalInfo }));
        }
      } catch (err) {
        console.error("Failed to fetch personal info");
      }
    }

    fetchExistingData();
  }, []);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
      </CardHeader>
      <form className=" p-4 sm:p-6" onSubmit={e => { e.preventDefault(); handleSave() }}>
        <CardContent className="space-y-2 md:space-y-2 md:grid md:grid-cols-2 gap-6" >
          <div className="">
            <Label>Full Name (English)</Label>
            <Input placeholder={user.given_name + " " + user.family_name} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full" disabled={!!initialValues.name} />
          </div>
          <div className="!m-0">
            <Label>Full Name (Bangla)</Label>
            <Input value={form.nameBn} onChange={e => setForm({ ...form, nameBn: e.target.value })} className="w-full" disabled={!!initialValues.nameBn} />
          </div>
          <div className="sm:col-span-2">
            <Label>Father's Name</Label>
            <Input value={form.father} onChange={e => setForm({ ...form, father: e.target.value })} className="w-full" disabled={!!initialValues.father} />
          </div>
          <div>
            <Label>Date of Birth</Label>
            <Input type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} className="w-full" disabled={!!initialValues.dob} />
          </div>
          <div>
            <Label>Profession</Label>
            <Input value={form.profession} onChange={e => setForm({ ...form, profession: e.target.value })} className="w-full" disabled={!!initialValues.profession} />
          </div>
          <div>
            <Label>Religion</Label>
            <Input value={form.religion} onChange={e => setForm({ ...form, religion: e.target.value })} className="w-full" disabled={!!initialValues.religion} />
          </div>
          <div className="sm:col-span-2">
            <Label>Present Address</Label>
            <Input value={form.presentAddress} onChange={e => setForm({ ...form, presentAddress: e.target.value })} className="w-full" disabled={!!initialValues.presentAddress} />
          </div>
          <div className="sm:col-span-2">
            <Label>Permanent Address</Label>
            <Input value={form.permanentAddress} onChange={e => setForm({ ...form, permanentAddress: e.target.value })} className="w-full" disabled={!!initialValues.permanentAddress} />
          </div>
          <div>
            <Label>Mobile</Label>
            <Input value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} className="w-full" disabled={!!initialValues.mobile} />
          </div>
          <div>
            <Label>NID Number</Label>
            <Input value={form.nidNumber} onChange={e => setForm({ ...form, nidNumber: e.target.value })} className="w-full" disabled={!!initialValues.nidNumber} />
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NidPhotoInput
              label="NID Front Photo"
              existingImageUrl={form.nidFront}
              onChange={file => {
                setNidFrontFile(file)
                if (!file) setForm(f => ({ ...f, nidFront: "" }))
              }}
            />
            <NidPhotoInput
              label="NID Back Photo"
              existingImageUrl={form.nidBack}
              onChange={file => {
                setNidBackFile(file)
                if (!file) setForm(f => ({ ...f, nidBack: "" }))
              }}
            />
          </div>

          <div>
            <Label>Signature</Label>
            <div className="border rounded p-2 max-w-full overflow-auto">
              <SignatureCanvas
                ref={sigCanvasRef}
                penColor="black"
                canvasProps={{ width: 400, height: 150, className: "w-full" }}
              />
              <div className="flex gap-2 mt-2">
                <Button type="button" onClick={() => sigCanvasRef.current?.clear()}>Clear</Button>
                <Button type="button" onClick={handleSignatureSave}>Save Signature</Button>
              </div>
            </div>
          </div>

          {/* <div>
            <Label>Position</Label>
            <select
              value={form.position}
              onChange={e => setForm({ ...form, position: e.target.value })}
              className="w-full border rounded px-2 py-1"
              required
            >
              <option value="">Select position</option>
              <option value="president">President</option>
              <option value="gs">GS</option>
              <option value="os">OS</option>
              <option value="fs">FS</option>
              <option value="member">Member</option>
            </select>
          </div> */}

          <CardFooter>
            <Button type="submit" className="w-full">Save</Button>
          </CardFooter>
        </CardContent>
      </form>
    </Card>
  )
}
