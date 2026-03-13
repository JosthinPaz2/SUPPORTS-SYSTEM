import * as React from "react"; // Importa React para poder crear componentes
import { cn } from "./utils"; // Función utilitaria para combinar clases CSS (especialmente con Tailwind)

/*
  Componente Input reutilizable
  Extiende todas las props nativas de un <input>
*/
export function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type} // Tipo del input (text, email, password, file, etc.)
      data-slot="input" // Identificador útil para estilos o debugging
      className={cn(
        // Estilos base del input
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",

        // Estilos cuando el input recibe foco
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",

        // Estilos cuando el input es inválido (aria-invalid)
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",

        // Permite agregar clases personalizadas desde el exterior
        className,
      )}

      // Estilos en línea personalizados
      style={{
        backgroundColor: '#f3f3f5', // Color de fondo del input
        borderColor: 'rgba(0, 0, 0, 0.1)', // Color del borde
        color: '#1a1a2e' // Color del texto
      }}

      // Pasa cualquier otra propiedad al input
      {...props}
    />
  );
}