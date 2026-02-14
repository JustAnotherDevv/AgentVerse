import * as React from "react"
import * as VisuallyHiddenPrimitive from "@radix-ui/react-visually-hidden"

import { cn } from "@/lib/utils"

const VisuallyHidden = React.forwardRef<
  React.ElementRef<typeof VisuallyHiddenPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof VisuallyHiddenPrimitive.Root>
>(({ className, ...props }, ref) => (
  <VisuallyHiddenPrimitive.Root
    ref={ref}
    className={cn(
      "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
      "[clip:rect(0,0,0,0)]",
      className
    )}
    {...props}
  />
))
VisuallyHidden.displayName = VisuallyHiddenPrimitive.Root.displayName

export { VisuallyHidden }
