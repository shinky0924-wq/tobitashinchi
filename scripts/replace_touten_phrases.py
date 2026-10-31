import json, os

articles_path = "data/blogArticles.json"
with open(articles_path, "r", encoding="utf-8") as f:
    content = f.read()

# Replace targets
replacements = [
    ("当店（飛田新地求人窓口）", "飛田新地にある当店"),
    ("当店（飛田新地求人窓口・直営グループ）", "飛田新地にある当店（直営グループ）"),
    ("飛田新地求人窓口（当直営グループ）", "飛田新地にある当直営グループ"),
    ("当直営グループ（飛田新地求人窓口）", "飛田新地にある当直営グループ"),
]

before_count = content.count("当店（飛田新地求人窓口）")
for old, new in replacements:
    content = content.replace(old, new)

with open(articles_path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Replaced {before_count} occurrences of 当店（飛田新地求人窓口） with 飛田新地にある当店 in {articles_path}")

# Also check other files in src and data
for root, _, files in os.walk("src"):
    for file in files:
        if file.endswith((".ts", ".tsx", ".json")):
            p = os.path.join(root, file)
            with open(p, "r", encoding="utf-8", errors="ignore") as f:
                c = f.read()
            if "当店（飛田新地求人窓口）" in c:
                for old, new in replacements:
                    c = c.replace(old, new)
                with open(p, "w", encoding="utf-8") as f:
                    f.write(c)
                print(f"Updated {p}")

print("Done replacement script.")
