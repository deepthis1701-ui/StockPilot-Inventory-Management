import pandas as pd
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
INPUT_FILE = BASE_DIR / "preprocessing" / "processed_sales.csv"
OUTPUT_FILE = BASE_DIR / "preprocessing" / "training_data.csv"

# Number of product/store combinations to use
N_SERIES = 100

print("Reading product/store combinations...")

# Read only identifying columns first
ids = pd.read_csv(
    INPUT_FILE,
    usecols=["id", "item_id", "store_id"]
)

series_ids = ids[["id", "item_id", "store_id"]].drop_duplicates()

print("Total series:", len(series_ids))

# Select a representative sample
selected = series_ids.head(N_SERIES)

selected_ids = set(selected["id"])

print("Selected series:", len(selected_ids))

print("Reading selected records...")

chunks = []

for chunk in pd.read_csv(
    INPUT_FILE,
    chunksize=500_000
):
    filtered = chunk[chunk["id"].isin(selected_ids)]

    if not filtered.empty:
        chunks.append(filtered)

    print("Processed chunk...")

training_data = pd.concat(chunks, ignore_index=True)

# Sort chronologically
training_data = training_data.sort_values(
    ["id", "date"]
)

training_data.to_csv(
    OUTPUT_FILE,
    index=False
)

print("===================================")
print("TRAINING DATA CREATED")
print("Rows:", len(training_data))
print("Columns:", len(training_data.columns))
print("Saved to:", OUTPUT_FILE)
print("===================================")