import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Note: We need to install class-variance-authority and @radix-ui/react-slot
// But for now, I'll implement a simpler version to avoid extra installs if not needed yet.
// Actually, let's just use standard props for now to keep it simple without extra deps if possible,
// but standard shadcn uses these. I'll stick to a simple component for speed.

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', ...props }, ref) => {
        const variants = {
            default: "bg-primary text-white hover:bg-primary-dark",
            outline: "border border-white/20 bg-transparent hover:bg-white/10 text-white",
            ghost: "hover:bg-white/10 text-white",
        }

        const sizes = {
            default: "h-12 px-6 py-2",
            sm: "h-9 px-3",
            lg: "h-14 px-8 text-lg",
        }

        return (
            <button
                className={cn(
                    "inline-flex items-center justify-center whitespace-nowrap font-bold uppercase tracking-wider ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                    variants[variant],
                    sizes[size],
                    className
                )}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
