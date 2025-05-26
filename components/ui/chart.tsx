"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ChartTooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  valueLabelFormatter?: (value: string) => string
}

export const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipContentProps>(
  ({ className, valueLabelFormatter, ...props }, ref) => {
    return (
      <div
        className={cn("rounded-md border bg-popover p-4 text-sm text-popover-foreground shadow-sm", className)}
        ref={ref}
        {...props}
      />
    )
  },
)
ChartTooltipContent.displayName = "ChartTooltipContent"

export interface ChartTooltipProps {
  trigger?: "hover" | "click"
  children: React.ReactNode
}

export const ChartTooltip = ({ children }: ChartTooltipProps) => {
  return <>{children}</>
}

export interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  data: any[]
  tooltipOptions?: {
    trigger?: "hover" | "click"
  }
  children: React.ReactNode
}

export const ChartContainer = ({ data, tooltipOptions, children, className, ...props }: ChartContainerProps) => {
  return (
    <div className={cn("relative", className)} {...props}>
      {children}
    </div>
  )
}

// Also export as a single object for convenience
export const Chart = {
  Tooltip: ChartTooltip,
  TooltipContent: ChartTooltipContent,
  Container: ChartContainer,
}
