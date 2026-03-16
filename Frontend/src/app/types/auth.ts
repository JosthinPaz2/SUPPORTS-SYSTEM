
export type UserRole = 'admin' | 'employee'; // Roles posibles dentro del sistema
/* Interfaz que representa un usuario */
export interface User {
  id: number;           // Identificador único del usuario en la base de datos
  name: string;          // Nombre completo del usuario
  email: string;        // Correo institucional del usuario
  role: UserRole;       // Rol del usuario en la aplicación (admin o employee)
  id_role: number;      // ID del rol en la base de datos (ej: 1 = admin, 2 = empleado)
  campaign?: string;    // Campaña o área a la que pertenece el usuario (opcional)
  access_token?: string; // Token de autenticación JWT o similar para llamadas a la API (opcional)
}