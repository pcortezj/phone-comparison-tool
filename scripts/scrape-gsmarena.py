#!/usr/bin/env python3

import json
import sys
import time
from pathlib import Path
from typing import Dict, List
from urllib.parse import quote, urljoin

import requests
from bs4 import BeautifulSoup


BASE_URL = "https://www.gsmarena.com/"
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
}

SMALL_OUTPUT_PATH = Path("data/imports/gsmarena-real-phones.json")
CATALOG_OUTPUT_PATH = Path("data/imports/gsmarena-catalog.json")
LATEST_OUTPUT_PATH = Path("data/imports/gsmarena-latest-phones.json")

PHONE_QUERIES = [
    {"brand": "Apple", "model": "iPhone 17", "query": "Apple iPhone 17"},
    {"brand": "Apple", "model": "iPhone Air", "query": "Apple iPhone Air"},
    {"brand": "Apple", "model": "iPhone 17 Pro", "query": "Apple iPhone 17 Pro"},
    {"brand": "Apple", "model": "iPhone 17 Pro Max", "query": "Apple iPhone 17 Pro Max"},
    {"brand": "Samsung", "model": "Galaxy S26", "query": "Samsung Galaxy S26"},
    {"brand": "Samsung", "model": "Galaxy S26+", "query": "Samsung Galaxy S26+"},
    {"brand": "Samsung", "model": "Galaxy S26 Ultra", "query": "Samsung Galaxy S26 Ultra"},
    {"brand": "Google", "model": "Pixel 10", "query": "Google Pixel 10"},
    {"brand": "Google", "model": "Pixel 10 Pro", "query": "Google Pixel 10 Pro"},
    {"brand": "OnePlus", "model": "13", "query": "OnePlus 13"},
    {"brand": "Xiaomi", "model": "15", "query": "Xiaomi 15"},
]

BRANDS = [
    {"brand": "Samsung", "path": "samsung-phones-9.php"},
    {"brand": "Apple", "path": "apple-phones-48.php"},
    {"brand": "Xiaomi", "path": "xiaomi-phones-80.php"},
    {"brand": "Google", "path": "google-phones-107.php"},
    {"brand": "OnePlus", "path": "oneplus-phones-95.php"},
    {"brand": "Motorola", "path": "motorola-phones-4.php"},
    {"brand": "Honor", "path": "honor-phones-121.php"},
    {"brand": "Oppo", "path": "oppo-phones-82.php"},
    {"brand": "vivo", "path": "vivo-phones-98.php"},
    {"brand": "Nothing", "path": "nothing-phones-128.php"},
    {"brand": "Realme", "path": "realme-phones-118.php"},
    {"brand": "Asus", "path": "asus-phones-46.php"},
    {"brand": "Huawei", "path": "huawei-phones-58.php"},
    {"brand": "Sony", "path": "sony-phones-7.php"},
    {"brand": "Infinix", "path": "infinix-phones-119.php"},
    {"brand": "Tecno", "path": "tecno-phones-120.php"},
]

MAX_PHONES_PER_BRAND = 14
REQUEST_DELAY_SECONDS = 0.8
MAX_RETRIES = 4


def clean_text(value: str) -> str:
    return " ".join(value.split())


def get_html(url: str) -> str:
    last_error = None

    for attempt in range(MAX_RETRIES):
        response = requests.get(url, headers=HEADERS, timeout=25)

        if response.status_code == 429:
            wait_seconds = 8 * (attempt + 1)
            print(f"Rate limited on {url}. Waiting {wait_seconds}s before retrying...")
            time.sleep(wait_seconds)
            last_error = requests.HTTPError(f"429 Too Many Requests for {url}")
            continue

        try:
            response.raise_for_status()
            time.sleep(REQUEST_DELAY_SECONDS)
            return response.text
        except requests.HTTPError as error:
            last_error = error
            wait_seconds = 4 * (attempt + 1)
            print(f"Request failed for {url}. Waiting {wait_seconds}s before retrying...")
            time.sleep(wait_seconds)

    raise last_error if last_error else RuntimeError(f"Failed to fetch {url}")


def find_phone_page(query: str) -> str:
    search_url = f"{BASE_URL}results.php3?sQuickSearch=yes&sName={quote(query)}"
    soup = BeautifulSoup(get_html(search_url), "html.parser")
    target = clean_text(query).lower()
    matches = []

    for result in soup.select(".makers li a"):
        href = result.get("href")
        if not href:
            continue

        label = clean_text(result.get_text(" ", strip=True)).lower()
        matches.append((label, href))

        if label == target:
            return urljoin(BASE_URL, href)

    for label, href in matches:
        if target in label:
            return urljoin(BASE_URL, href)

    if not matches:
        raise RuntimeError(f"No GSMArena result found for '{query}'")

    return urljoin(BASE_URL, matches[0][1])


def scrape_phone_page(entry: dict, page_url: str) -> dict:
    soup = BeautifulSoup(get_html(page_url), "html.parser")

    name_node = soup.select_one(".specs-phone-name-title")
    name = clean_text(name_node.get_text(" ", strip=True)) if name_node else f"{entry['brand']} {entry['model']}"
    image_tag = soup.select_one(".specs-photo-main img")
    image_url = urljoin(BASE_URL, image_tag["src"]) if image_tag and image_tag.get("src") else ""

    specifications = []
    for table in soup.select("#specs-list table"):
        heading = table.select_one("th[scope='row']")
        if not heading:
            continue

        title = clean_text(heading.get_text(" ", strip=True))
        specs = []

        for row in table.select("tr"):
            key_cell = row.select_one("td.ttl")
            value_cell = row.select_one("td.nfo")
            if not key_cell or not value_cell:
                continue

            key = clean_text(key_cell.get_text(" ", strip=True)).replace("\xa0", "").strip()
            value = clean_text(value_cell.get_text(" ", strip=True))
            if not key or not value:
                continue

            specs.append({"key": key, "value": value})

        if specs:
            specifications.append({"title": title, "specs": specs})

    return {
        "brand": entry["brand"],
        "model": entry["model"],
        "name": name,
        "image": image_url,
        "source_url": page_url,
        "specifications": specifications,
    }


def scrape_phone(entry: dict) -> dict:
    page_url = find_phone_page(entry["query"])
    return scrape_phone_page(entry, page_url)


def fetch_brand_catalog_entries(brand: str, path: str) -> List[Dict]:
    soup = BeautifulSoup(get_html(urljoin(BASE_URL, path)), "html.parser")
    entries = []

    for result in soup.select(".makers li a"):
        href = result.get("href")
        image = result.select_one("img")
        label = clean_text(result.get_text(" ", strip=True))
        title_text = clean_text(image.get("title", "")) if image else ""

        if not href or not label:
            continue

        lower_title = title_text.lower()
        if "smartphone" not in lower_title and "phone" not in lower_title:
            continue
        if "tablet" in lower_title or "watch" in lower_title:
            continue

        entries.append(
            {
                "brand": brand,
                "model": label,
                "name": f"{brand} {label}" if brand.lower() not in label.lower() else label,
                "image": urljoin(BASE_URL, image["src"]) if image and image.get("src") else "",
                "source_url": urljoin(BASE_URL, href),
            }
        )

        if len(entries) >= MAX_PHONES_PER_BRAND:
            break

    return entries


def scrape_catalog() -> List[Dict]:
    if CATALOG_OUTPUT_PATH.exists():
        catalog_entries = json.loads(CATALOG_OUTPUT_PATH.read_text(encoding="utf-8"))
    else:
        catalog_entries = []

    seen_urls = set()
    saved_urls = {entry.get("source_url") for entry in catalog_entries if entry.get("source_url")}

    for brand_entry in BRANDS:
        brand = brand_entry["brand"]
        print(f"Collecting {brand} listings...")
        brand_phones = fetch_brand_catalog_entries(brand, brand_entry["path"])

        for phone in brand_phones:
            if phone["source_url"] in seen_urls:
                continue

            seen_urls.add(phone["source_url"])
            if phone["source_url"] in saved_urls:
                print(f"Skipping already saved {phone['name']}...")
                continue

            print(f"Scraping {phone['name']}...")
            try:
                catalog_entries.append(scrape_phone_page(phone, phone["source_url"]))
                saved_urls.add(phone["source_url"])
                write_json(CATALOG_OUTPUT_PATH, catalog_entries)
            except Exception as error:
                print(f"Skipping {phone['name']} after repeated failures: {error}")

    return catalog_entries


def write_json(path: Path, payload: List[Dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"Wrote {len(payload)} phones to {path}")


def main() -> None:
    catalog_only = "--catalog-only" in sys.argv
    latest_only = "--latest-only" in sys.argv

    if not catalog_only:
        print("Building focused latest-device set...")
        focused = []
        for entry in PHONE_QUERIES:
            print(f"Scraping {entry['query']}...")
            focused.append(scrape_phone(entry))
        write_json(LATEST_OUTPUT_PATH if latest_only else SMALL_OUTPUT_PATH, focused)

        if latest_only:
            return

    print("Building multi-brand catalog...")
    catalog = scrape_catalog()
    write_json(CATALOG_OUTPUT_PATH, catalog)


if __name__ == "__main__":
    main()
