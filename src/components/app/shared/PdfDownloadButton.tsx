"use client"

import { useState } from "react"
import { FileDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
  href: string
  label?: string
}

export function PdfDownloadButton({ href, label = "PDF exportieren" }: Props) {
  const [loading, setLoading] = useState(false)

  function handleClick() {
    setLoading(true)
    window.open(href, "_blank")
    setTimeout(() => setLoading(false), 2500)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={loading} title={label}>
      <FileDown className="h-4 w-4 md:mr-1" />
      <span className="hidden md:inline">{loading ? "Erstelle PDF…" : label}</span>
    </Button>
  )
}
