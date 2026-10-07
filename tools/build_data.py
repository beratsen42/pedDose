"""data/*.csv dosyalarından data.js üretir.

Kullanım: python3 tools/build_data.py
Google Sheets'ten her sekmeyi "Dosya > İndir > CSV" ile data/ klasörüne kaydedin:
  Ilaclar  -> data/ilaclar.csv
  Broselow -> data/broselow.csv
"""
import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

NUMERIC = {
    "doz_per_kg", "doz_10kg_alti_per_kg", "sabit_doz", "tek_doz_min", "tek_doz_max",
    "gunluk_max_per_kg", "gunluk_max", "kilo_min_kg", "kilo_max_kg",
    "konsantrasyon_per_ml", "birim_miktar", "birim_ml",
    "ikinci_doz_per_kg", "ikinci_doz_max",
}


def parse_number(value, column, row_id):
    value = value.strip().replace(",", ".")
    if value == "":
        return None
    try:
        return float(value)
    except ValueError:
        raise SystemExit(f"Hata: '{row_id}' satırında '{column}' sayı değil: {value!r}")


def read_csv(name):
    with open(ROOT / "data" / name, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def build_drugs():
    drugs = []
    seen = set()
    for row in read_csv("ilaclar.csv"):
        row_id = row["id"].strip()
        if not row_id:
            continue
        if row_id in seen:
            raise SystemExit(f"Hata: '{row_id}' id'si iki kez var.")
        seen.add(row_id)
        drug = {}
        for key, value in row.items():
            if key is None:
                continue
            key = key.strip()
            if key in NUMERIC:
                drug[key] = parse_number(value or "", key, row_id)
            else:
                drug[key] = (value or "").strip()
        drug["kategoriler"] = [c.strip() for c in drug["kategoriler"].split(";") if c.strip()]
        if drug.get("hesap_tipi") not in ("", None, "holliday_segar"):
            raise SystemExit(f"Hata: '{row_id}' satırında bilinmeyen hesap_tipi: {drug['hesap_tipi']!r}")
        if not drug.get("hesap_tipi") and drug["doz_per_kg"] is None and drug["sabit_doz"] is None:
            raise SystemExit(f"Hata: '{row_id}' satırında doz_per_kg veya sabit_doz olmalı.")
        drugs.append(drug)
    return drugs


def build_broselow():
    zones = []
    for row in read_csv("broselow.csv"):
        zone = {k.strip(): (v or "").strip() for k, v in row.items() if k}
        zone["kilo_min_kg"] = parse_number(zone["kilo_min_kg"], "kilo_min_kg", zone["renk"])
        zone["kilo_max_kg"] = parse_number(zone["kilo_max_kg"], "kilo_max_kg", zone["renk"])
        zones.append(zone)
    return zones


def main():
    data = {"ilaclar": build_drugs(), "broselow": build_broselow()}
    out = ROOT / "data.js"
    out.write_text(
        "// Bu dosya tools/build_data.py ile üretilir. Elle düzenlemeyin.\n"
        "window.PEDDOSE_DATA = " + json.dumps(data, ensure_ascii=False, indent=1) + ";\n",
        encoding="utf-8",
    )
    print(f"{out.name}: {len(data['ilaclar'])} ilaç, {len(data['broselow'])} Broselow bölgesi")


if __name__ == "__main__":
    main()
