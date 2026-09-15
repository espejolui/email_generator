/**
 * Nombre de archivo desde el título de la plantilla (ya sanitizado al
 * entrar: sin entidades, sin tildes, solo [a-z0-9-]). Vacío -> "plantilla".
 */
export function fileNameFromTitle(title: string): string {
  const slug = title
    .replace(/&[a-zA-Z0-9#]+;/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${slug === "" ? "plantilla" : slug}.html`;
}

export function downloadTemplate(html: string, filename = "plantilla.html"): void {
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
