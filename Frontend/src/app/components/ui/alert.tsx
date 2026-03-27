// Importa React para poder crear componentes
import * as React from "react";

// Importa cva (Class Variance Authority) para manejar variantes de estilos
// y VariantProps para tipar las props de esas variantes
import { cva, type VariantProps } from "class-variance-authority";

// Importa una función utilitaria para combinar clases de Tailwind o CSS
import { cn } from "./utils";

// Definición de variantes de estilos para el componente Alert
const alertVariants = cva(
  // Clases base aplicadas siempre al alert
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    // Definición de variantes posibles
    variants: {
      variant: {
        // Variante por defecto
        default: "bg-card text-card-foreground",

        // Variante destructiva (usada normalmente para errores o alertas críticas)
        destructive:
          "text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90",
      },
    },

    // Variante que se usa si no se especifica ninguna
    defaultVariants: {
      variant: "default",
    },
  },
);

// Componente principal Alert
function Alert({
  className, // clases adicionales opcionales
  variant,   // variante de estilo (default o destructive)
  ...props   // resto de props que se pasarán al div
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert" // atributo usado para identificar el slot del componente
      role="alert" // rol accesible para lectores de pantalla
      className={cn(alertVariants({ variant }), className)} // combina variantes con clases extra
      {...props} // pasa el resto de props al elemento
    />
  );
}

// Componente para el título del Alert
function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title" // identificador del slot
      className={cn(
        // Clases de estilo del título
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className, // permite agregar clases extra
      )}
      {...props}
    />
  );
}

// Componente para la descripción del Alert
function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description" // identificador del slot
      className={cn(
        // Clases para el texto descriptivo
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}

// Exporta los componentes para poder usarlos en otras partes de la aplicación
export { Alert, AlertTitle, AlertDescription };