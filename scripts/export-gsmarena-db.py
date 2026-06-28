#!/usr/bin/env python3

import json
import sqlite3
from collections import defaultdict
from pathlib import Path


SOURCE_DB = Path("/tmp/gsmarena2api/gsmarena.db")
OUTPUT_JSON = Path("data/imports/gsmarena-smartphones-db.json")


def main() -> None:
    connection = sqlite3.connect(SOURCE_DB)
    connection.row_factory = sqlite3.Row

    devices = connection.execute(
        """
        SELECT d.id, d.name AS model_name, d.url, d.thumbnail, d.summary, b.name AS brand_name
        FROM device d
        JOIN brand b ON b.id = d.brand_id
        WHERE lower(d.summary) LIKE '%smartphone%'
          AND EXISTS (
            SELECT 1
            FROM device_specification ds
            WHERE ds.device_id = d.id
          )
        ORDER BY b.name, d.name
        """
    ).fetchall()

    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)

    with OUTPUT_JSON.open("w", encoding="utf-8") as output:
        output.write("[\n")

        total = len(devices)
        for index, device in enumerate(devices):
            sections = defaultdict(list)
            spec_rows = connection.execute(
                """
                SELECT spec_category, specification, spec_value
                FROM device_specification
                WHERE device_id = ?
                ORDER BY spec_id
                """,
                (device["id"],),
            ).fetchall()

            for spec in spec_rows:
                sections[spec["spec_category"]].append(
                    {
                        "key": spec["specification"],
                        "value": spec["spec_value"],
                    }
                )

            name = device["model_name"]
            brand = device["brand_name"]
            payload = {
                "brand": brand,
                "model": name,
                "name": name if brand.lower() in name.lower() else f"{brand} {name}",
                "image": device["thumbnail"],
                "source_url": device["url"],
                "summary": device["summary"],
                "specifications": [
                    {"title": title, "specs": specs}
                    for title, specs in sections.items()
                ],
            }

            json.dump(payload, output, ensure_ascii=False, indent=2)
            if index < total - 1:
                output.write(",\n")
            else:
                output.write("\n")

            if (index + 1) % 500 == 0:
                print(f"Exported {index + 1}/{total} smartphones...")

        output.write("]\n")

    print(f"Wrote {total} smartphones to {OUTPUT_JSON}")


if __name__ == "__main__":
    main()
