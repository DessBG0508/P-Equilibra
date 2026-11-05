import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold cursor-pointer transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // Botón primario institucional: azul profundo #1B198F, hover oscurece 10%
        default:
          "bg-primary text-primary-foreground shadow-soft hover:-translate-y-0.5 hover:shadow-float hover:bg-primary/90",
        // Destructive = alerta rosa #FF9CED (NO rojo agresivo)
        destructive:
          "bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive/90 hover:-translate-y-0.5",
        // Outline: borde lavanda, texto azul profundo
        outline:
          "border border-lavender/60 bg-card text-primary shadow-soft hover:bg-bg-lavender hover:border-secondary/40",
        // Secondary: lila vívido #6857E4
        secondary:
          "bg-secondary text-secondary-foreground shadow-soft hover:bg-secondary/90 hover:-translate-y-0.5",
        // Success: verde azulado #12BDB6
        success: "bg-teal text-white shadow-soft hover:bg-teal/90 hover:-translate-y-0.5",
        // Ghost: solo texto azul, hover lavanda
        ghost: "text-primary hover:bg-bg-lavender",
        // Link: azul profundo subrayado
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-14 rounded-2xl px-8 text-base",
        icon: "h-11 w-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
