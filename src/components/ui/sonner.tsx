import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Toaster institucional — colores del manual de identidad:
 *   success → verde azulado #12BDB6 (--teal)
 *   error   → rosa alerta #FF9CED (--alert)
 *   info    → cian brillante #00BCC8 (--cyan)
 *   warning → lima #A9DB1B (--lime)
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-float group-[.toaster]:rounded-2xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group-[.toaster]:!border-teal/40 group-[.toaster]:!bg-[#dff7f2] group-[.toaster]:!text-[#12BDB6] group-[.toaster]:!shadow-float",
          error:
            "group-[.toaster]:!border-alert/50 group-[.toaster]:!bg-[#ffe5fa] group-[.toaster]:!text-[#1a0e36] group-[.toaster]:!shadow-float",
          info: "group-[.toaster]:!border-cyan/40 group-[.toaster]:!bg-[#00BCC8] group-[.toaster]:!text-[#12BDB6] group-[.toaster]:!shadow-float",
          warning:
            "group-[.toaster]:!border-lime/50 group-[.toaster]:!bg-[#effbe6] group-[.toaster]:!text-[#1b198f] group-[.toaster]:!shadow-float",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
