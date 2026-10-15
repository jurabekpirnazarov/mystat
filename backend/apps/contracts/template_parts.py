"""007 shartnoma bo'limlari ({title, body}) — OS-18.

Asosiy manba `datas/contractContentTemplate.json` (serverda, repoda yo'q — `.gitignore`).
U bo'lmasa bo'limlar repodagi `contractTemplate.docx` dan (PDF shu fayldan chiqadi) olinadi:
"N. KATTA HARFLI SARLAVHA" qatorlari bo'lim boshi, jadval qatorlari " | " bilan bitta qatorga.
"""
import json
import logging
import os
import re
from functools import lru_cache

from django.conf import settings

logger = logging.getLogger(__name__)

SECTION_RE = re.compile(r"^\d+\.\s+[^a-z]+$")  # "2. SHARTNOMA PREDMETI" (kichik lotin harfsiz)
SIGNATURE_RE = re.compile(r"^(Ijrochi|Bajaruvchi|Buyurtmachi):")  # rekvizitlar DIDOX Owner/Clients da
PLACEHOLDER_RE = re.compile(r"\{\{\s*(\w+)\s*\}\}")
PREAMBLE_TITLE = "Tomonlar"


def _json_path():
    return os.path.join(settings.BASE_DIR, "datas", "contractContentTemplate.json")


def _docx_path():
    return os.path.join(settings.BASE_DIR, "contractTemplate.docx")


def _blocks(document):
    """Hujjat tanasidagi paragraf va jadvallar asl tartibda, matn qatorlari sifatida."""
    from docx.table import Table
    from docx.text.paragraph import Paragraph
    for child in document.element.body.iterchildren():
        tag = child.tag.rsplit("}", 1)[-1]
        if tag == "p":
            yield Paragraph(child, document).text
        elif tag == "tbl":
            for row in Table(child, document).rows:
                cells = []
                for cell in row.cells:  # birlashtirilgan katakchalar takrorlanadi
                    text = cell.text.strip()
                    if text and (not cells or cells[-1] != text):
                        cells.append(text)
                yield " | ".join(cells)


@lru_cache(maxsize=1)
def _parts_from_docx(path, mtime):
    from docx import Document
    parts, preamble = [], []
    started = False
    for raw in _blocks(Document(path)):
        line = PLACEHOLDER_RE.sub(r"{{\1}}", " ".join(raw.split()))
        if not line:
            continue
        if SECTION_RE.match(line):
            started = True
            parts.append({"title": line, "body": []})
        elif started and not SIGNATURE_RE.match(line):
            parts[-1]["body"].append(line)
        else:
            preamble.append(line)
    # Sarlavha, raqam va sana DIDOX ContractDoc'da bor — preambuladan faqat tomonlar matni olinadi
    parties = [line for line in preamble if "Bajaruvchi" in line or "Tomonlar" in line]
    result = [{"title": PREAMBLE_TITLE, "body": "\n".join(parties)}] if parties else []
    result += [{"title": p["title"], "body": "\n".join(p["body"])} for p in parts]
    return result


def load_template_parts():
    """[{title, body}] — JSON, bo'lmasa .docx; ikkalasi ham bo'lmasa []."""
    try:
        with open(_json_path(), "r", encoding="utf-8") as f:
            return json.load(f).get("parts", [])
    except FileNotFoundError:
        pass
    except Exception as e:
        logger.error(f"Failed to load contract template JSON: {e}")
    try:
        path = _docx_path()
        return list(_parts_from_docx(path, os.path.getmtime(path)))
    except Exception as e:
        logger.error(f"Failed to load contract template DOCX: {e}")
        return []
