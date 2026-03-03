import { Desk } from '../types/desk';

/**
 * Convierte un array de escritorios a formato CSV
 */
export function desksToCSV(desks: Desk[]): string {
  const headers = ['id', 'x', 'y', 'width', 'height', 'type'];
  const rows = desks.map(desk => [
    desk.id,
    desk.x.toString(),
    desk.y.toString(),
    desk.width.toString(),
    desk.height.toString(),
    desk.type || 'regular'
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Parsea un archivo CSV y retorna un array de escritorios
 */
export function parseCSVToDesks(csvContent: string): Desk[] {
  const lines = csvContent.trim().split('\n');
  
  if (lines.length < 2) {
    throw new Error('El archivo CSV está vacío o no tiene datos');
  }

  // Verificar headers
  const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
  const requiredHeaders = ['id', 'x', 'y', 'width', 'height'];
  
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    throw new Error(`Faltan columnas requeridas: ${missingHeaders.join(', ')}`);
  }

  // Parsear datos
  const desks: Desk[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Saltar líneas vacías

    const values = line.split(',').map(v => v.trim());
    
    if (values.length < 5) {
      throw new Error(`Línea ${i + 1}: Datos incompletos`);
    }

    const [id, xStr, yStr, widthStr, heightStr, typeStr] = values;

    const x = parseFloat(xStr);
    const y = parseFloat(yStr);
    const width = parseFloat(widthStr);
    const height = parseFloat(heightStr);

    if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) {
      throw new Error(`Línea ${i + 1}: Las coordenadas deben ser números válidos`);
    }

    const desk: Desk = {
      id,
      x,
      y,
      width,
      height,
    };

    if (typeStr) {
      const validTypes = ['management', 'store', 'regular', 'empty', 'entrance'];
      if (validTypes.includes(typeStr.toLowerCase())) {
        desk.type = typeStr.toLowerCase() as Desk['type'];
      }
    }

    desks.push(desk);
  }

  return desks;
}

/**
 * Descarga un archivo CSV
 */
export function downloadCSV(csvContent: string, filename: string = 'office-layout.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Lee un archivo y retorna su contenido como texto
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('No se pudo leer el archivo'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };
    
    reader.readAsText(file);
  });
}
