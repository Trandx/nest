function randomHexColor(): string {
  return Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");
}

function getContrastColor(hex: string): string {
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? "000" : "fff"; // dark text if bg is light, else white
}

export function generateAvatarUrl({name, bg_color , text_color}: { name: string, bg_color?: string, text_color?: string }): string {
  const background = bg_color || randomHexColor();
  const color = text_color || getContrastColor(background);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name
  )}&background=${background}&color=${color}`;
}

