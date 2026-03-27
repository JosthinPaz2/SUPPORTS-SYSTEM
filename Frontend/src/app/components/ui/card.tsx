// Importa React para crear componentes
import * as React from "react";

// Función utilitaria para combinar clases CSS/Tailwind
import { cn } from "./utils";

/*
  Componente principal Card
  Es el contenedor base de toda la tarjeta
*/
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card" // Identificador del slot para estilos o debugging
      className={cn(
        // Estilos base de la tarjeta
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border",
        className, // Permite añadir clases adicionales
      )}
      {...props} // Pasa cualquier otra prop al div
    />
  );
}

/*
  CardHeader
  Se usa para la parte superior de la tarjeta
  normalmente contiene título, descripción o acciones
*/
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        // Layout en grid para organizar título, descripción y acciones
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 pt-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className,
      )}
      {...props}
    />
  );
}

/*
  CardTitle
  Representa el título principal de la tarjeta
*/
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <h4
      data-slot="card-title"
      className={cn(
        // Estilo del título
        "leading-none",
        className,
      )}
      {...props}
    />
  );
}

/*
  CardDescription
  Texto descriptivo debajo del título
*/
function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <p
      data-slot="card-description"
      className={cn(
        // Color más suave para texto secundario
        "text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

/*
  CardAction
  Área para colocar acciones como botones o iconos
  (por ejemplo un botón de menú o editar)
*/
function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        // Posiciona el elemento en la esquina superior derecha del header
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

/*
  CardContent
  Contenedor principal del contenido de la tarjeta
*/
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn(
        // Padding horizontal y padding inferior si es el último elemento
        "px-6 [&:last-child]:pb-6",
        className,
      )}
      {...props}
    />
  );
}

/*
  CardFooter
  Área inferior de la tarjeta
  normalmente contiene botones o acciones finales
*/
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        // Layout horizontal con padding
        "flex items-center px-6 pb-6 [.border-t]:pt-6",
        className,
      )}
      {...props}
    />
  );
}

// Exporta todos los componentes para poder usarlos en otras partes de supports-System
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};