"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import SignatureCanvas from "react-signature-canvas"
import { useUploadThing } from "@/lib/uploadthing"
import { useToast } from "@/hooks/use-toast"
import NidPhotoInput from "./nidPhotoInput"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PersonalInfoData, savePersonalInfo } from "@/lib/actions/profile/profile"
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs"


interface PersonalInfoTabProps {
  initialInfo: { personalInfo: PersonalInfoData | null } | { error: string };
  kindeUser: { given_name: string, family_name: string, phone: string | null };
}

export default function PersonalInfoTab({ initialInfo, kindeUser }: PersonalInfoTabProps) {
  const { user } = useKindeAuth();
  const { toast } = useToast();

  const initialForm = {
    name: null,
    nameBn: null,
    father: null,
    mother: null,
    dob: null,
    profession: null,
    religion: null,
    presentAddress: null,
    permanentAddress: null,
    mobile: kindeUser.phone || null,
    nidNumber: null,
    nidFront: null,
    nidBack: null,
    signature: null,
    position: null,
  };

  const [form, setForm] = useState<PersonalInfoData>(
    "error" in initialInfo ? initialForm : initialInfo.personalInfo || initialForm
  );
  const [initialValues, setInitialValues] = useState<PersonalInfoData>(form);
  const [loading, setLoading] = useState(false);

  const [nidFrontFile, setNidFrontFile] = useState<File | null>(null)
  const [nidBackFile, setNidBackFile] = useState<File | null>(null)
  const [signatureFile, setSignatureFile] = useState<File | null>(null);

  const sigCanvasRef = useRef<SignatureCanvas>(null)
  const { startUpload } = useUploadThing("userDocuments")


  const handleSignatureSave = () => {
    const canvas = sigCanvasRef.current?.getCanvas()
    if (!canvas) return

    canvas.toBlob(async blob => {
      if (!blob) return
      const file = new File([blob], "signature.png", { type: "image/png" })
      setSignatureFile(file);
      const url = URL.createObjectURL(file);
      setForm(prev => ({ ...prev, signature: url }));
      toast({ title: "Signature saved!" });
    })
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);
    try {
      let nidFrontUrl = form.nidFront;
      let nidBackUrl = form.nidBack;
      let signatureUrl = form.signature;

      // Only upload if a new file is selected
      if (nidFrontFile) {
        const uploaded = await startUpload([nidFrontFile]);
        if (uploaded?.[0]?.ufsUrl) nidFrontUrl = uploaded[0].ufsUrl;
      }
      if (nidBackFile) {
        const uploaded = await startUpload([nidBackFile]);
        if (uploaded?.[0]?.ufsUrl) nidBackUrl = uploaded[0].ufsUrl;
      }
      if (signatureFile) {
        const uploaded = await startUpload([signatureFile]);
        if (uploaded?.[0]?.ufsUrl) signatureUrl = uploaded[0].ufsUrl;
      }

      const payload = {
        ...form,
        nidFront: nidFrontUrl,
        nidBack: nidBackUrl,
        signature: signatureUrl,
      };

      const result = await savePersonalInfo(user.id, payload);

      if ("error" in result) {
        throw new Error(result.error);
      }

      toast({ title: "Personal information saved!" });
      // Update initial values to reflect new saved state
      setInitialValues(payload);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const isFieldDisabled = (key: keyof PersonalInfoData) => initialValues[key] !== null;


  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
      </CardHeader>
      <form  className="p-4 sm:p-6"  onSubmit={()=>{}}/* onSubmit={handleSave} */>
        <CardContent className="space-y-2 md:grid md:grid-cols-2 gap-6">
          <div className="">
            <Label>Full Name (English)</Label>
            <Input
              placeholder={kindeUser.given_name + " " + kindeUser.family_name}
              value={form.name || ""}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full"
              disabled={isFieldDisabled("name") || loading}
            />
          </div>
          <div className="!m-0">
            <Label>Full Name (Bangla)</Label>
            <Input
              value={form.nameBn || ""}
              onChange={e => setForm({ ...form, nameBn: e.target.value })}
              className="w-full"
              disabled={isFieldDisabled("nameBn") || loading}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Father's Name</Label>
            <Input
              value={form.father || ""}
              onChange={e => setForm({ ...form, father: e.target.value })}
              className="w-full"
              disabled={isFieldDisabled("father") || loading}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Mother's Name</Label>
            <Input
              value={form.mother || ""}
              onChange={e => setForm({ ...form, mother: e.target.value })}
              className="w-full"
              disabled={isFieldDisabled("mother") || loading}
            />
          </div>
          <div>
            <Label>Date of Birth</Label>
            <Input
              type="date"
              value={form.dob || ""}
              onChange={e => setForm({ ...form, dob: e.target.value })}
              className="w-full"
              disabled={isFieldDisabled("dob") || loading}
            />
          </div>
          <div>
            <Label>Profession</Label>
            <Input
              value={form.profession || ""}
              onChange={e => setForm({ ...form, profession: e.target.value })}
              className="w-full"
              disabled={isFieldDisabled("profession") || loading}
            />
          </div>
          <div>
            <Label>Religion</Label>
            <Input
              value={form.religion || ""}
              onChange={e => setForm({ ...form, religion: e.target.value })}
              className="w-full"
              disabled={isFieldDisabled("religion") || loading}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Present Address</Label>
            <Input
              value={form.presentAddress || ""}
              onChange={e => setForm({ ...form, presentAddress: e.target.value })}
              className="w-full"
              disabled={isFieldDisabled("presentAddress") || loading}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Permanent Address</Label>
            <Input
              value={form.permanentAddress || ""}
              onChange={e => setForm({ ...form, permanentAddress: e.target.value })}
              className="w-full"
              disabled={isFieldDisabled("permanentAddress") || loading}
            />
          </div>
          <div>
            <Label>Mobile</Label>
            <Input
              value={form.mobile || ""}
              onChange={e => setForm({ ...form, mobile: e.target.value })}
              className="w-full"
              disabled={isFieldDisabled("mobile") || loading}
            />
          </div>
          <div>
            <Label>NID Number</Label>
            <Input
              value={form.nidNumber || ""}
              onChange={e => setForm({ ...form, nidNumber: e.target.value })}
              className="w-full"
              disabled={isFieldDisabled("nidNumber") || loading}
            />
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 col-span-full gap-4">
            
            <NidPhotoInput
              label="NID Front Photo"
              existingImageUrl={form.nidFront ?? undefined}
              onChange={file => {
                setNidFrontFile(file)
                if (!file) setForm(f => ({ ...f, nidFront: "" }))
              }}
              disabled={isFieldDisabled("nidFront") || loading}
            />
            <NidPhotoInput
              label="NID Back Photo"
              existingImageUrl={form.nidBack ?? undefined}
              onChange={file => {
                setNidBackFile(file)
                if (!file) setForm(f => ({ ...f, nidBack: "" }))
              }}
              disabled={isFieldDisabled("nidBack") || loading}
            />
          </div>

          {/* <div>
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
          </div> */}

        </CardContent>
        <CardFooter className="flex justify-center pt-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}