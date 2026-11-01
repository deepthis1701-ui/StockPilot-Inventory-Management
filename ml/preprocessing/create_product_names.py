import pandas as pd
import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
INPUT_FILE = BASE_DIR / "training_data.csv"
OUTPUT_FILE = BASE_DIR / "product_names.json"

# Read only the ID column
df = pd.read_csv(
    INPUT_FILE,
    usecols=["id"]
)

product_ids = df["id"].drop_duplicates().tolist()

# Human-friendly names
name_templates = [
    "Milk 1L",
    "Rice 5kg",
    "Cooking Oil 1L",
    "Wheat Flour 5kg",
    "Sugar 1kg",
    "Tea Powder 250g",
    "Coffee 200g",
    "Biscuits",
    "Bath Soap",
    "Shampoo",
    "Toothpaste",
    "Detergent Powder",
    "Salt 1kg",
    "Spices",
    "Noodles",
    "Bread",
    "Butter 500g",
    "Cheese 200g",
    "Curd 500g",
    "Yogurt 500g",
    "Tomato 1kg",
    "Potato 1kg",
    "Onion 1kg",
    "Carrot 1kg",
    "Apple 1kg",
    "Banana 1kg",
    "Orange 1kg",
    "Mango 1kg",
    "Chicken 1kg",
    "Eggs 12 Pack",
    "Fish 1kg",
    "Juice 1L",
    "Soft Drink 1L",
    "Mineral Water 1L",
    "Chips",
    "Chocolate",
    "Cookies",
    "Jam 500g",
    "Honey 250g",
    "Corn Flakes",
    "Oats 500g",
    "Dal 1kg",
    "Toor Dal 1kg",
    "Moong Dal 1kg",
    "Chana Dal 1kg",
    "Masoor Dal 1kg",
    "Peanuts 500g",
    "Cashews 250g",
    "Almonds 250g",
]

product_names = {}

for index, product_id in enumerate(product_ids):
    if index < len(name_templates):
        name = name_templates[index]
    else:
        name = f"Food Product {index + 1:03d}"

    product_names[product_id] = name

with open(OUTPUT_FILE, "w", encoding="utf-8") as file:
    json.dump(
        product_names,
        file,
        indent=2,
        ensure_ascii=False
    )

print("=" * 50)
print("PRODUCT NAME MAPPING CREATED")
print("=" * 50)
print(f"Products found: {len(product_ids)}")
print(f"Saved to: {OUTPUT_FILE}")
print()
for product_id, name in list(product_names.items())[:10]:
    print(f"{product_id} -> {name}")