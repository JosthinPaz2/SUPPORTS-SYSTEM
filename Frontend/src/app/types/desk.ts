export interface Desk {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type?: 'management' | 'store' | 'regular' | 'empty' | 'entrance';
}

export type DeskLayoutData = Desk[];
