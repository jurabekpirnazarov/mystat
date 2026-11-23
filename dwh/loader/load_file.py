"""Faylni (CSV / Excel / Parquet / JSON) raw qatlamiga yuklaydi.

Misol:
    docker compose run --rm loader aholi_2025.xlsx
    docker compose run --rm loader savdo.csv --table savdo --mode append

Har bir qatorga _source_file va _loaded_at ustunlari qo'shiladi,
natija meta.load_log ga yoziladi.
"""
import argparse
import os
import re
import sys
from pathlib import Path

import pandas as pd
from sqlalchemy import create_engine, text


def clean_name(name) -> str:
    """Ustun/jadval nomini xavfsiz snake_case ko'rinishiga keltiradi."""
    s = re.sub(r"[^0-9a-zA-Z_]+", "_", str(name).strip().lower()).strip("_")
    if not s:
        s = "col"
    if s[0].isdigit():
        s = "_" + s
    return s[:63]


def unique_names(names):
    seen, out = {}, []
    for n in names:
        c = clean_name(n)
        seen[c] = seen.get(c, 0) + 1
        out.append(c if seen[c] == 1 else f"{c}_{seen[c]}")
    return out


def read_frames(path: Path, sheet, sep, encoding):
    """(jadval_qo'shimchasi, DataFrame bo'laklari) juftliklarini qaytaradi."""
    ext = path.suffix.lower()
    if ext in (".csv", ".tsv", ".txt"):
        sep = sep or ("\t" if ext == ".tsv" else None)
        yield "", pd.read_csv(path, sep=sep, engine="python" if sep is None else "c",
                              encoding=encoding, dtype=str, chunksize=50_000)
    elif ext in (".xlsx", ".xlsm", ".xls"):
        sheets = pd.read_excel(path, sheet_name=sheet, dtype=str)
        if isinstance(sheets, pd.DataFrame):
            yield "", [sheets]
        else:
            many = len(sheets) > 1
            for name, df in sheets.items():
                yield (f"__{clean_name(name)}" if many else ""), [df]
    elif ext == ".parquet":
        yield "", [pd.read_parquet(path)]
    elif ext in (".json", ".jsonl", ".ndjson"):
        yield "", [pd.read_json(path, lines=ext != ".json", dtype=False)]
    else:
        sys.exit(f"Qo'llab-quvvatlanmaydigan format: {ext}")


def main():
    p = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    p.add_argument("file", help="/data ichidagi fayl (dwh/data papkasi)")
    p.add_argument("--table", help="jadval nomi (standart: fayl nomi)")
    p.add_argument("--schema", default="raw")
    p.add_argument("--mode", choices=["replace", "append"], default="replace")
    p.add_argument("--sheet", default=None, help="Excel varaq nomi (standart: hammasi)")
    p.add_argument("--sep", default=None, help="CSV ajratgich (standart: avtomatik)")
    p.add_argument("--encoding", default="utf-8-sig")
    a = p.parse_args()

    path = Path(a.file)
    if not path.is_file():
        sys.exit(f"Fayl topilmadi: {path.resolve()}")

    engine = create_engine(os.environ["DWH_DSN"])
    base = clean_name(a.table or path.stem)

    for suffix, chunks in read_frames(path, a.sheet, a.sep, a.encoding):
        table = (base + suffix)[:63]
        target = f"{a.schema}.{table}"
        with engine.begin() as c:
            log_id = c.execute(
                text("INSERT INTO meta.load_log (source, target_table) "
                     "VALUES (:s, :t) RETURNING id"),
                {"s": path.name, "t": target}).scalar_one()
        total = 0
        try:
            # Bitta tranzaksiya: xato bo'lsa eski jadval o'z holicha qoladi
            with engine.begin() as c:
                for i, df in enumerate(chunks):
                    df.columns = unique_names(df.columns)
                    df["_source_file"] = path.name
                    df["_loaded_at"] = pd.Timestamp.now(tz="UTC")
                    df.to_sql(table, c, schema=a.schema, index=False,
                              if_exists=a.mode if i == 0 else "append",
                              method="multi", chunksize=1_000)
                    total += len(df)
            with engine.begin() as c:
                c.execute(text("UPDATE meta.load_log SET status='ok', rows_loaded=:n, "
                               "finished_at=now() WHERE id=:i"), {"n": total, "i": log_id})
            print(f"OK  {target}: {total} qator")
        except Exception as e:
            with engine.begin() as c:
                c.execute(text("UPDATE meta.load_log SET status='error', error=:e, "
                               "finished_at=now() WHERE id=:i"),
                          {"e": str(e)[:2000], "i": log_id})
            sys.exit(f"XATO {target}: {e}")


if __name__ == "__main__":
    main()
