#!/usr/bin/env python3

import argparse
import importlib.util
import json
import subprocess
import sys
from pathlib import Path
from typing import Dict, List


ROOT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_MODELS_PATH = ROOT_DIR / "data/backfill-models.txt"
DEFAULT_OUTPUT_PATH = ROOT_DIR / "data/imports/gsmarena-backfill-phones.json"
SCRAPER_PATH = ROOT_DIR / "scripts/scrape-gsmarena.py"
IMPORTER_PATH = ROOT_DIR / "scripts/import-phone-backfill.mjs"
BRAND_PATHS = {
    "Apple": "apple-phones-48.php",
    "Google": "google-phones-107.php",
    "Samsung": "samsung-phones-9.php",
}
MAX_BRAND_PAGES = 12


def load_scraper():
    spec = importlib.util.spec_from_file_location("gsmarena_scraper", SCRAPER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load {SCRAPER_PATH}")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def read_models(path: Path) -> List[str]:
    models = []

    for line in path.read_text(encoding="utf-8").splitlines():
        cleaned = line.strip()
        if cleaned and not cleaned.startswith("#"):
            models.append(cleaned)

    return models


def infer_brand_and_model(query: str) -> Dict[str, str]:
    parts = query.split(maxsplit=1)
    if len(parts) == 2 and parts[0] in BRAND_PATHS:
        return {"brand": parts[0], "model": parts[1], "query": query}

    return {"brand": "", "model": query, "query": query}


def normalize_label(value: str) -> str:
    return " ".join(value.lower().replace("+", " plus ").split())


def collect_brand_index(scraper, brand: str) -> List[Dict[str, str]]:
    path = BRAND_PATHS.get(brand)
    if not path:
        return []

    entries = []
    seen_paths = set()
    current_path = path

    for _ in range(MAX_BRAND_PAGES):
        if current_path in seen_paths:
            break

        seen_paths.add(current_path)
        soup = scraper.BeautifulSoup(
            scraper.get_html(scraper.urljoin(scraper.BASE_URL, current_path)),
            "html.parser",
        )

        for result in soup.select(".makers li a"):
            href = result.get("href")
            label = scraper.clean_text(result.get_text(" ", strip=True))
            image = result.select_one("img")
            title = scraper.clean_text(image.get("title", "")) if image else ""

            if not href or not label:
                continue

            title_lower = title.lower()
            if "tablet" in title_lower or "watch" in title_lower:
                continue

            entries.append(
                {
                    "brand": brand,
                    "model": label,
                    "name": f"{brand} {label}" if brand.lower() not in label.lower() else label,
                    "source_url": scraper.urljoin(scraper.BASE_URL, href),
                    "label_key": normalize_label(label),
                }
            )

        next_link = soup.select_one(".nav-pages a.prevnextbutton[title='Next page']")
        next_path = next_link.get("href") if next_link else ""
        if not next_path:
            break

        current_path = next_path

    return entries


def find_phone_page_from_brand_index(scraper, entry: Dict[str, str], brand_indexes) -> str:
    brand = entry["brand"]
    if not brand:
        raise RuntimeError(f"Brand is required for brand-page lookup: {entry['query']}")

    if brand not in brand_indexes:
        print(f"Indexing {brand} GSMArena listings...")
        brand_indexes[brand] = collect_brand_index(scraper, brand)

    target = normalize_label(entry["model"])
    matches = brand_indexes[brand]

    for candidate in matches:
        if candidate["label_key"] == target:
            return candidate["source_url"]

    for candidate in matches:
        if target in candidate["label_key"]:
            return candidate["source_url"]

    raise RuntimeError(f"No GSMArena brand-listing result found for '{entry['query']}'")


def scrape_phone(scraper, entry: Dict[str, str], brand_indexes) -> Dict:
    try:
        return scraper.scrape_phone(entry)
    except RuntimeError as error:
        if "No GSMArena result found" not in str(error):
            raise

    page_url = find_phone_page_from_brand_index(scraper, entry, brand_indexes)
    return scraper.scrape_phone_page(entry, page_url)


def write_json(path: Path, payload: List[Dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote {len(payload)} scraped phones to {path.relative_to(ROOT_DIR)}")


def run_importer(output_path: Path) -> int:
    result = subprocess.run(
        ["node", str(IMPORTER_PATH.relative_to(ROOT_DIR)), str(output_path.relative_to(ROOT_DIR))],
        cwd=ROOT_DIR,
        text=True,
        check=False,
    )
    return result.returncode


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Backfill targeted GSMArena devices and import only missing normalized records."
    )
    parser.add_argument(
        "--models",
        type=Path,
        default=DEFAULT_MODELS_PATH,
        help="Path to a newline-delimited model/query list.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT_PATH,
        help="Path for scraped GSMArena JSON.",
    )
    parser.add_argument(
        "--scrape-only",
        action="store_true",
        help="Write scraped JSON without importing it into Prisma.",
    )
    args = parser.parse_args()

    models_path = args.models if args.models.is_absolute() else ROOT_DIR / args.models
    output_path = args.output if args.output.is_absolute() else ROOT_DIR / args.output
    queries = read_models(models_path)

    if not queries:
        print(f"No models found in {models_path}", file=sys.stderr)
        return 1

    scraper = load_scraper()
    scraped = []
    failed = []
    brand_indexes = {}

    for query in queries:
        entry = infer_brand_and_model(query)
        print(f"Scraping {entry['query']}...")

        try:
            scraped.append(scrape_phone(scraper, entry, brand_indexes))
        except Exception as error:
            failed.append({"query": query, "reason": str(error)})
            print(f"Failed: {query}: {error}")

    write_json(output_path, scraped)

    if failed:
        print("Scrape failures:")
        for failure in failed:
            print(f"- {failure['query']}: {failure['reason']}")

    if args.scrape_only:
        print(f"Found:       {len(scraped)}")
        print("Already had: 0")
        print("Added:       0")
        print(f"Failed:      {len(failed)}")
        return 0 if scraped else 1

    importer_status = run_importer(output_path)
    return importer_status or (1 if failed and not scraped else 0)


if __name__ == "__main__":
    raise SystemExit(main())
