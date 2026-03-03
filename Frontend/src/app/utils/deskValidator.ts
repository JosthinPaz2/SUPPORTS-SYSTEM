import { Desk } from '../types/desk';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateDesks(desks: Desk[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (desks.length === 0) {
    errors.push('Debe haber al menos un escritorio');
    return { isValid: false, errors, warnings };
  }

  const ids = new Set<string>();
  const duplicateIds = new Set<string>();
  
  desks.forEach((desk, index) => {
 
    if (!desk.id || desk.id.trim() === '') {
      errors.push(`Escritorio en posición ${index + 1}: ID vacío`);
    }

    if (ids.has(desk.id)) {
      duplicateIds.add(desk.id);
    }
    ids.add(desk.id);


    if (desk.x < 0 || desk.y < 0) {
      errors.push(`Escritorio ${desk.id}: Las coordenadas no pueden ser negativas`);
    }

    if (desk.width <= 0 || desk.height <= 0) {
      errors.push(`Escritorio ${desk.id}: Las dimensiones deben ser positivas`);
    }


    if (desk.x > 2000 || desk.y > 2000) {
      warnings.push(`Escritorio ${desk.id}: Coordenadas muy grandes (x: ${desk.x}, y: ${desk.y})`);
    }

    if (desk.width > 200 || desk.height > 200) {
      warnings.push(`Escritorio ${desk.id}: Dimensiones muy grandes (${desk.width}x${desk.height})`);
    }

    if (desk.width < 10 || desk.height < 10) {
      warnings.push(`Escritorio ${desk.id}: Dimensiones muy pequeñas (${desk.width}x${desk.height})`);
    }
  });


  if (duplicateIds.size > 0) {
    errors.push(`IDs duplicados encontrados: ${Array.from(duplicateIds).join(', ')}`);
  }

  const overlaps = findOverlaps(desks);
  if (overlaps.length > 0) {
    overlaps.forEach(overlap => {
      warnings.push(`Posible solapamiento entre ${overlap.desk1} y ${overlap.desk2}`);
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}


function findOverlaps(desks: Desk[]): Array<{ desk1: string; desk2: string }> {
  const overlaps: Array<{ desk1: string; desk2: string }> = [];

  for (let i = 0; i < desks.length; i++) {
    for (let j = i + 1; j < desks.length; j++) {
      const desk1 = desks[i];
      const desk2 = desks[j];

      const overlap = !(
        desk1.x + desk1.width <= desk2.x ||
        desk2.x + desk2.width <= desk1.x ||
        desk1.y + desk1.height <= desk2.y ||
        desk2.y + desk2.height <= desk1.y
      );

      if (overlap) {
        overlaps.push({
          desk1: desk1.id,
          desk2: desk2.id,
        });
      }
    }
  }

  return overlaps;
}

export function sanitizeDesks(desks: Desk[]): Desk[] {
  const seenIds = new Set<string>();
  const sanitized: Desk[] = [];

  desks.forEach(desk => {
    if (seenIds.has(desk.id)) {
      return;
    }

    if (!desk.id || desk.width <= 0 || desk.height <= 0 || desk.x < 0 || desk.y < 0) {
      return;
    }

    seenIds.add(desk.id);
    sanitized.push({
      ...desk,
      id: desk.id.trim(),
      type: desk.type || 'regular',
    });
  });

  return sanitized;
}
