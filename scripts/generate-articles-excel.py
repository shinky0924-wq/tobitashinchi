import json
import os
import csv
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def generate_excel():
    articles_file = "data/blogArticles.json"
    if not os.path.exists(articles_file):
        print("Articles file not found:", articles_file)
        return

    with open(articles_file, "r", encoding="utf-8") as f:
        articles = json.load(f)

    wb = openpyxl.Workbook()

    # Sheet 1: 記事一覧
    ws = wb.active
    ws.title = "お仕事コラム記事一覧"

    # Sheet 2: カテゴリ集計
    ws_cat = wb.create_sheet(title="カテゴリ別集計")

    # Headers
    headers = [
        "No",
        "記事タイトル",
        "本番サイトURL (Cloudflare Pages)",
        "カテゴリ",
        "スラッグ (URL識別子)",
        "公開日",
        "読了目安",
        "アイキャッチ画像URL",
        "タグ",
        "文字数（概算）",
        "概要 / 検索用サマリー"
    ]

    header_fill = PatternFill(start_color="89244E", end_color="89244E", fill_type="solid")
    header_font = Font(name="Yu Gothic", size=11, bold=True, color="FFFFFF")
    header_align = Alignment(horizontal="center", vertical="center", wrap_text=True)

    thin_border = Border(
        left=Side(style="thin", color="E2D0D7"),
        right=Side(style="thin", color="E2D0D7"),
        top=Side(style="thin", color="E2D0D7"),
        bottom=Side(style="thin", color="E2D0D7")
    )

    ws.row_dimensions[1].height = 32
    for col_idx, h in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_idx, value=h)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = header_align
        cell.border = thin_border

    zebra_fill = PatternFill(start_color="FFF8FA", end_color="FFF8FA", fill_type="solid")
    link_font = Font(name="Yu Gothic", size=10, color="0055CC", underline="single")
    regular_font = Font(name="Yu Gothic", size=10, color="25161D")
    bold_font = Font(name="Yu Gothic", size=10, bold=True, color="25161D")

    category_counts = {}

    for r_idx, art in enumerate(articles, 2):
        ws.row_dimensions[r_idx].height = 24
        is_zebra = (r_idx % 2 == 0)
        current_fill = zebra_fill if is_zebra else None

        slug = art.get("slug", "")
        prod_url = f"https://tobitashinchi.pages.dev/blog/{slug}"
        cat_label = art.get("categoryLabel", "")
        category_counts[cat_label] = category_counts.get(cat_label, 0) + 1

        tags_str = ", ".join(art.get("tags", []))
        eyecatch = art.get("eyeCatch", "")
        eyecatch_full_url = f"https://tobitashinchi.pages.dev{eyecatch}" if eyecatch.startswith("/") else eyecatch

        # Calculate text character count
        text_content = ""
        for block in art.get("content", []):
            if isinstance(block, dict):
                text_content += block.get("text", "") + " "
                for it in block.get("items", []):
                    text_content += str(it) + " "
        char_count = len(text_content.strip()) if text_content else len(art.get("summary", ""))

        row_data = [
            int(art.get("id", r_idx - 1)),
            art.get("title", ""),
            prod_url,
            cat_label,
            slug,
            art.get("date", "2026.08.31"),
            art.get("readTime", "5分"),
            eyecatch_full_url,
            tags_str,
            char_count,
            art.get("summary", "")
        ]

        for c_idx, val in enumerate(row_data, 1):
            cell = ws.cell(row=r_idx, column=c_idx, value=val)
            cell.border = thin_border
            if current_fill:
                cell.fill = current_fill

            if c_idx == 1:
                cell.alignment = Alignment(horizontal="center", vertical="center")
                cell.font = bold_font
            elif c_idx == 3: # URL
                cell.hyperlink = prod_url
                cell.font = link_font
                cell.alignment = Alignment(horizontal="left", vertical="center")
            elif c_idx in [4, 6, 7]:
                cell.alignment = Alignment(horizontal="center", vertical="center")
                cell.font = regular_font
            elif c_idx == 10:
                cell.alignment = Alignment(horizontal="right", vertical="center")
                cell.font = regular_font
            else:
                cell.alignment = Alignment(horizontal="left", vertical="center")
                cell.font = regular_font

    # Column widths
    col_widths = {
        1: 8,    # No
        2: 45,   # タイトル
        3: 52,   # 本番URL
        4: 18,   # カテゴリ
        5: 35,   # スラッグ
        6: 14,   # 公開日
        7: 12,   # 読了目安
        8: 58,   # アイキャッチURL
        9: 25,   # タグ
        10: 14,  # 文字数
        11: 65   # 概要
    }

    for col_idx, width in col_widths.items():
        col_letter = get_column_letter(col_idx)
        ws.column_dimensions[col_letter].width = width

    ws.auto_filter.ref = f"A1:{get_column_letter(len(headers))}{len(articles) + 1}"

    # Sheet 2: カテゴリ別集計
    cat_headers = ["カテゴリ名", "記事数", "割合"]
    ws_cat.row_dimensions[1].height = 28
    for c_idx, h in enumerate(cat_headers, 1):
        c = ws_cat.cell(row=1, column=c_idx, value=h)
        c.fill = header_fill
        c.font = header_font
        c.alignment = header_align
        c.border = thin_border

    total_arts = len(articles)
    for idx, (cat_name, count) in enumerate(sorted(category_counts.items(), key=lambda x: x[1], reverse=True), 2):
        ws_cat.row_dimensions[idx].height = 22
        ratio = f"{(count / total_arts) * 100:.1f}%"
        for c_idx, val in enumerate([cat_name, count, ratio], 1):
            cell = ws_cat.cell(row=idx, column=c_idx, value=val)
            cell.border = thin_border
            if c_idx == 1:
                cell.alignment = Alignment(horizontal="left", vertical="center")
                cell.font = regular_font
            elif c_idx == 2:
                cell.alignment = Alignment(horizontal="right", vertical="center")
                cell.font = bold_font
            else:
                cell.alignment = Alignment(horizontal="right", vertical="center")
                cell.font = regular_font

    ws_cat.column_dimensions["A"].width = 25
    ws_cat.column_dimensions["B"].width = 15
    ws_cat.column_dimensions["C"].width = 15

    # Total row
    tot_row = len(category_counts) + 2
    ws_cat.row_dimensions[tot_row].height = 24
    for c_idx, val in enumerate(["合計", total_arts, "100.0%"], 1):
        cell = ws_cat.cell(row=tot_row, column=c_idx, value=val)
        cell.border = thin_border
        cell.fill = PatternFill(start_color="F1E3E8", end_color="F1E3E8", fill_type="solid")
        cell.font = bold_font
        cell.alignment = Alignment(horizontal="center" if c_idx == 1 else "right", vertical="center")

    # Save to public and artifacts
    os.makedirs("public", exist_ok=True)
    os.makedirs(".aistudio/artifacts/brain/bc67dd2f-2d66-4835-9da8-1994a014a959", exist_ok=True)

    targets = [
        "public/飛田新地求人_お仕事コラム記事一覧.xlsx",
        "public/tobitashinchi_articles.xlsx",
        ".aistudio/artifacts/brain/bc67dd2f-2d66-4835-9da8-1994a014a959/飛田新地求人_お仕事コラム記事一覧.xlsx",
        ".aistudio/artifacts/brain/bc67dd2f-2d66-4835-9da8-1994a014a959/tobitashinchi_articles.xlsx"
    ]

    for t in targets:
        wb.save(t)
        print(f"Saved Excel: {t} (Size: {os.path.getsize(t)} bytes)")

    # Also generate UTF-8 with BOM CSV for 100% Excel compatibility
    csv_targets = [
        "public/飛田新地求人_お仕事コラム記事一覧.csv",
        "public/tobitashinchi_articles.csv",
        ".aistudio/artifacts/brain/bc67dd2f-2d66-4835-9da8-1994a014a959/飛田新地求人_お仕事コラム記事一覧.csv"
    ]

    for csv_path in csv_targets:
        with open(csv_path, "w", encoding="utf-8-sig", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(headers)
            for r_idx, art in enumerate(articles, 1):
                slug = art.get("slug", "")
                tags_str = ", ".join(art.get("tags", []))
                eyecatch = art.get("eyeCatch", "")
                eyecatch_full_url = f"https://tobitashinchi.pages.dev{eyecatch}" if eyecatch.startswith("/") else eyecatch
                writer.writerow([
                    art.get("id", r_idx),
                    art.get("title", ""),
                    f"https://tobitashinchi.pages.dev/blog/{slug}",
                    art.get("categoryLabel", ""),
                    slug,
                    art.get("date", "2026.08.31"),
                    art.get("readTime", "5分"),
                    eyecatch_full_url,
                    tags_str,
                    len(art.get("summary", "")),
                    art.get("summary", "")
                ])
        print(f"Saved CSV: {csv_path} (Size: {os.path.getsize(csv_path)} bytes)")

if __name__ == "__main__":
    generate_excel()
