export interface PercentagePosition {
  x: number;
  y: number;
}

const clamp = (value: number, min: number, max: number): number => {
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

export const calculatePercentagePos = (
  clientX: number,
  clientY: number,
  containerRect: DOMRect,
): PercentagePosition => {
  if (containerRect.width <= 0 || containerRect.height <= 0) {
    return { x: 0, y: 0 };
  }

  const x = ((clientX - containerRect.left) / containerRect.width) * 100;
  const y = ((clientY - containerRect.top) / containerRect.height) * 100;

  return {
    x: clamp(x, 0, 100),
    y: clamp(y, 0, 100),
  };
};

export const clampPercentage = clamp;
