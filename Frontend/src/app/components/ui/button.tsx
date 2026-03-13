// Importa React para crear componentes
import * as React from "react";

// Slot de Radix UI permite que el componente use otro elemento HTML como base
// (por ejemplo <a>, <Link>, etc.) manteniendo los estilos
import { Slot } from "@radix-ui/react-slot";

// cva permite crear variantes de estilos dinámicas
// VariantProps permite tipar esas variantes en TypeScript
import { cva, type VariantProps } from "class-variance-authority";

// Función utilitaria para combinar clases CSS/Tailwind
import { cn } from "./utils";

// Definición de las variantes del botón
const buttonVariants = cva(
  // Clases base que siempre tendrá el botón
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      // Variantes visuales del botón
      variant: {
        // Botón principal
        default: "bg-primary text-primary-foreground hover:bg-primary/90",

        // Botón de acción destructiva (ej. eliminar)
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",

        // Botón con borde
        outline:
          "border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",

        // Botón secundario
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",

        // Botón sin fondo (solo efecto hover)
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",

        // Botón estilo enlace
        link: "text-primary underline-offset-4 hover:underline",
      },

      // Variantes de tamaño
      size: {
        // Tamaño estándar
        default: "h-9 px-4 py-2 has-[>svg]:px-3",

        // Botón pequeño
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",

        // Botón grande
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",

        // Botón solo icono
        icon: "size-9 rounded-md",
      },
    },

    // Variantes por defecto si no se especifican
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

// Componente Button
function Button({
  className, // clases adicionales
  variant,   // variante visual del botón
  size,      // tamaño del botón
  asChild = false, // permite renderizar otro elemento en lugar de <button>
  ...props   // resto de props HTML
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {

  // Si asChild es true se usa Slot, si no se usa un <button>
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button" // atributo útil para debugging o estilos
      className={cn(buttonVariants({ variant, size, className }))} // combina variantes + clases extra
      {...props} // pasa todas las props al componente
    />
  );
}

// Exporta el botón y las variantes para usarlos en otros archivos
export { Button, buttonVariants };