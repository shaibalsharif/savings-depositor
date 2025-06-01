"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

const PREFILL_HTML = `
  <div style="text-align: center; margin-bottom: 2rem;">
    <img 
      src="https://static.vecteezy.com/system/resources/previews/041/882/917/non_2x/finance-linkedin-banner-template-editor_template.jpeg?last_updated=1711743637" 
      alt="Finance Banner" 
      style="max-width:100%; border-radius: 12px; margin-bottom: 1rem;"
    />
    <h2 style="font-size: 2rem; margin-bottom: 0.5rem;">Financial & Member Agreement</h2>
    <p style="font-size: 1.1rem; color: #555;">
      This agreement outlines the terms and conditions for all members regarding financial operations, responsibilities, and commitments within our organization. Please read carefully and ensure you understand all sections before accepting.
    </p>
  </div>
  <div style="margin-bottom: 2rem;">
    <h3 style="font-size: 1.2rem; font-weight: bold;">Key Terms:</h3>
    <ul style="margin-left: 1.5rem; margin-bottom: 1rem;">
      <li>All member contributions are to be made by the 5th of each month.</li>
      <li>Withdrawals require a minimum 7-day notice and approval from the finance committee.</li>
      <li>Members must maintain a minimum balance as specified in the annual guidelines.</li>
      <li>All financial activities are subject to audit and compliance checks.</li>
      <li>Disputes will be resolved as per the member charter and financial policy.</li>
    </ul>
    <p>
      By continuing, you agree to the above terms and acknowledge your responsibilities as a member.
    </p>
  </div>
  <div style="text-align: right; margin-top: 3rem;">
    <span style="display: block; font-weight: 600; margin-bottom: 0.5rem;">Signature</span>
    <img 
      src="https://www.signwell.com/assets/vip-signatures/barack-obama-signature-dfb67287de175bf23b79d857a57afd34f15ee5564b78f32d8d400cfbae586c88.png" 
      alt="Barack Obama Signature" 
      style="height: 60px;"
    />
    <div style="font-size: 0.95rem; color: #555;">Barack Obama</div>
  </div>
`

export default function TermsTab() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const editableRef = useRef<HTMLDivElement>(null)
  const [content, setContent] = useState(PREFILL_HTML)

  useEffect(() => {
    fetch("/api/settings/terms")
      .then((res) => res.json())
      .then((data) => {
        if (data.terms) setContent(data.terms)
      })
      .catch(() => toast({ title: "Failed to load terms", variant: "destructive" }))
      .finally(() => setLoading(false))
  }, [toast])

  // Update state when user edits content
  const onInput = () => {
    if (editableRef.current) {
      setContent(editableRef.current.innerHTML)
    }
  }

  const saveTerms = async () => {
    try {
      const res = await fetch("/api/settings/terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ terms: content }),
      })
      if (!res.ok) throw new Error("Failed to save terms")
      toast({ title: "Terms & Conditions saved" })
    } catch {
      toast({ title: "Error saving terms", variant: "destructive" })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Terms & Conditions</CardTitle>
        <CardDescription>
          Paste or edit your formatted agreement below. All formatting and images will be preserved.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          ref={editableRef}
          contentEditable
          suppressContentEditableWarning
          onInput={onInput}
          className="w-full min-h-[350px] border rounded-md p-4 overflow-auto prose prose-sm sm:prose lg:prose-lg dark:prose-invert bg-white"
          style={{ whiteSpace: "normal" }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </CardContent>
      <CardFooter>
        <Button onClick={saveTerms} disabled={loading}>
          Save Changes
        </Button>
      </CardFooter>
    </Card>
  )
}
