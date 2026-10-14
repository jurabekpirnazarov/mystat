"""Bog'liqliksiz minimal PDF yozuvchi (namunaviy hisobot shakllari, S-12).

Faqat matn (Helvetica, WinAnsi), bir nechta sahifa va diagonal "NAMUNA" suv belgisi.
Loyihada reportlab/weasyprint yo'q; namuna fayllar uchun shu yetarli.
"""
import textwrap

PAGE_W, PAGE_H = 595, 842  # A4, pt
MARGIN = 56
LINE = 15
WIDTH_CHARS = 88

_TRANSLATE = str.maketrans({"‘": "'", "’": "'", "`": "'", "ʻ": "'", "ʼ": "'", "“": '"', "”": '"', "–": "-", "—": "-",
                            "«": '"', "»": '"', "№": "No"})


def _escape(text):
    text = text.translate(_TRANSLATE)
    text = text.encode("latin-1", "replace").decode("latin-1")
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _layout(blocks):
    """blocks: [(style, text)] style: "h1" | "h2" | "p" -> sahifalar bo'yicha [(size, bold, text)] qatorlari."""
    pages, current, y = [], [], PAGE_H - MARGIN
    for style, text in blocks:
        size, bold, width = {"h1": (16, True, 60), "h2": (12, True, 80), "p": (10, False, WIDTH_CHARS)}[style]
        lines = textwrap.wrap(text, width) or [""]
        if style != "p":
            y -= 6
        for line in lines:
            if y < MARGIN + LINE:
                pages.append(current)
                current, y = [], PAGE_H - MARGIN
            current.append((size, bold, MARGIN, y, line))
            y -= size + 5
    pages.append(current)
    return pages


def render_pdf(blocks, watermark="NAMUNA"):
    pages = _layout(blocks)
    objects = []  # 1-based

    def add(body):
        objects.append(body)
        return len(objects)

    font = add(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")
    font_bold = add(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>")
    pages_id = add(None)  # keyin to'ldiriladi
    page_ids = []
    for lines in pages:
        ops = []
        if watermark:
            ops.append(f"q 0.85 g BT /F2 96 Tf 0.819 0.574 -0.574 0.819 120 260 Tm ({_escape(watermark)}) Tj ET Q")
        for size, bold, x, y, text in lines:
            ops.append(f"BT /{'F2' if bold else 'F1'} {size} Tf {x} {y} Td ({_escape(text)}) Tj ET")
        stream = "\n".join(ops).encode("latin-1")
        content = add(b"<< /Length %d >>\nstream\n" % len(stream) + stream + b"\nendstream")
        page_ids.append(add(
            f"<< /Type /Page /Parent {pages_id} 0 R /MediaBox [0 0 {PAGE_W} {PAGE_H}] "
            f"/Resources << /Font << /F1 {font} 0 R /F2 {font_bold} 0 R >> >> /Contents {content} 0 R >>".encode()))
    objects[pages_id - 1] = f"<< /Type /Pages /Kids [{' '.join(f'{p} 0 R' for p in page_ids)}] /Count {len(page_ids)} >>".encode()
    catalog = add(f"<< /Type /Catalog /Pages {pages_id} 0 R >>".encode())

    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for i, body in enumerate(objects, 1):
        offsets.append(len(out))
        out += f"{i} 0 obj\n".encode() + body + b"\nendobj\n"
    xref = len(out)
    out += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode()
    out += b"".join(f"{o:010d} 00000 n \n".encode() for o in offsets)
    out += f"trailer\n<< /Size {len(objects) + 1} /Root {catalog} 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
    return bytes(out)
