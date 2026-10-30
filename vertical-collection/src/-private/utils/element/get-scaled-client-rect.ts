export interface VerticalRect {
  top: number;
  bottom: number;
  height: number;
}

export default function getScaledClientRect(
  element: { getBoundingClientRect(): VerticalRect | undefined },
  scale: number,
): VerticalRect {
  const rect = element.getBoundingClientRect()!;

  if (scale === 1) {
    return rect;
  }

  return {
    top: rect.top * scale,
    bottom: rect.bottom * scale,
    height: rect.height * scale,
  };
}
