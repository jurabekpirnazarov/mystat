/**
 * DOM blokini PDF yoki PNG qilib saqlash. Kutubxonalar faqat bosilganda yuklanadi (Q-02).
 * `sample=true` bo'lsa har sahifaga "NAMUNA" suv belgisi qo'yiladi (S-09: skrinshot real deb tarqalmasin).
 */
async function capture(element: HTMLElement) {
  const { default: html2canvas } = await import("html2canvas");
  const dark = document.documentElement.classList.contains("dark");
  return html2canvas(element, { scale: 2, backgroundColor: dark ? "#111827" : "#ffffff", useCORS: true });
}

function watermark(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#b45309";
  ctx.font = `bold ${Math.round(canvas.width / 9)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(-Math.PI / 7);
  ctx.fillText("NAMUNA", 0, 0);
  ctx.restore();
}

export async function exportElementToPdf(element: HTMLElement, filename: string, sample = false) {
  const canvas = await capture(element);
  if (sample) watermark(canvas);
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const imgW = pageW - margin * 2;
  const imgH = (canvas.height * imgW) / canvas.width;
  const img = canvas.toDataURL("image/jpeg", 0.92);
  let offset = 0;
  // Uzun blok bir necha sahifaga bo'linadi
  while (offset < imgH) {
    if (offset > 0) pdf.addPage();
    pdf.addImage(img, "JPEG", margin, margin - offset, imgW, imgH);
    offset += pageH - margin * 2;
  }
  pdf.save(sample ? filename.replace(/\.pdf$/, "_NAMUNA.pdf") : filename);
}

export async function exportElementToPng(element: HTMLElement, filename: string, sample = false) {
  const canvas = await capture(element);
  if (sample) watermark(canvas);
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = sample ? filename.replace(/\.png$/, "_NAMUNA.png") : filename;
  a.click();
}

/** UTF-8 BOM bilan CSV (Excel to'g'ri ochadi). */
export function downloadCsv(rows: (string | number | null | undefined)[][], filename: string, note?: string) {
  const esc = (v: string | number | null | undefined) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [...(note ? [[note]] : []), ...rows].map((r) => r.map(esc).join(","));
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
