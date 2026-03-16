// Importa React para poder crear componentes
import * as React from "react";

// Slot permite que el componente Badge pueda "heredar" el elemento padre
// (por ejemplo convertir el badge en un <a>, <button>, etc.)
import { Slot } from "@radix-ui/react-slot";

// Importa cva para manejar variantes de estilos y VariantProps para tipar esas variantes
import { cva, type VariantProps } from "class-variance-authority";

// Función utilitaria para combinar clases de Tailwind/CSS
import { cn } from "./utils";

// Definición de variantes de estilo para el componente Badge
const badgeVariants = cva(
  // Clases base que siempre se aplican al badge
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    // Variantes disponibles del badge
    variants: {
      variant: {
        // Variante por defecto
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",

        // Variante secundaria
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",

        // Variante destructiva (usada normalmente para errores o advertencias)
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",

        // Variante outline (sin fondo fuerte)
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },

    // Variante usada por defecto si no se especifica ninguna
    defaultVariants: {
      variant: "default",
    },
  },
);

// Componente Badge
function Badge({
  className, // clases adicionales opcionales
  variant,   // variante de estilo (default, secondary, destructive, outline)
  asChild = false, // permite renderizar otro elemento en lugar de <span>
  ...props   // resto de props que se pasan al elemento
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {

  // Si asChild es true, usa Slot (Radix), si no usa un <span>
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      data-slot="badge" // atributo identificador para el componente
      className={cn(badgeVariants({ variant }), className)} // combina estilos de variante con clases extra
      {...props} // pasa todas las demás props al componente
    />
  );
}

// Exporta el componente Badge y las variantes para usarlos en otras partes del proyecto
export { Badge, badgeVariants };