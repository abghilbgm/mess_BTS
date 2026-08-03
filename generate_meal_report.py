import csv
import glob
import os
import re
import zipfile
from collections import defaultdict
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = "/Users/gowtham/Downloads/mess_BTS"
CSV_GLOB = os.path.join(ROOT, "Meals", "votes*.csv")
CHAT_FILE = os.path.join(ROOT, "_chat.txt")
OUTPUT_XLSX = os.path.join(ROOT, "meal_poll_summary.xlsx")


def is_vote_cell(value):
    if value is None:
        return False
    text = str(value).strip()
    if not text:
        return False
    if text.lower() == "no":
        return False
    return True


def infer_category(menu_name):
    text = menu_name.lower()
    if any(k in text for k in ["upma", "uttapam", "dosa", "thepla", "paratha", "puri", "poori", "bhature", "chole", "healthy salad"]):
        return "breakfast"
    if any(k in text for k in ["biryani", "tehari", "fried rice", "chicken", "mutton", "pulao"]):
        return "dinner"
    return "lunch"


def infer_veg_nonveg(menu_name):
    text = menu_name.lower()
    if any(k in text for k in ["chicken"]):
        return "non-veg"
    return "veg"


def normalize_name(name):
    if not name:
        return ""
    name = name.strip().lower()
    name = name.replace("~", " ")
    name = name.replace("️", "")
    name = re.sub(r"[^a-z0-9]+", " ", name)
    return " ".join(name.split())


def find_matching_user(user_stats, sender):
    sender_norm = normalize_name(sender)
    if not sender_norm:
        return None
    for key, stats in user_stats.items():
        if normalize_name(stats["name"]) == sender_norm:
            return key
    for key, stats in user_stats.items():
        target = normalize_name(stats["name"])
        if sender_norm in target or target in sender_norm:
            return key
    return None


def sheet_xml(rows):
    xml_rows = []
    for row_idx, row in enumerate(rows, start=1):
        cells = []
        for col_idx, value in enumerate(row, start=1):
            cell_ref = f"{chr(64 + col_idx)}{row_idx}"
            if isinstance(value, (int, float)) and not isinstance(value, bool):
                cells.append(f'<c r="{cell_ref}"><v>{value}</v></c>')
            else:
                text = str(value if value is not None else "")
                cells.append(f'<c r="{cell_ref}" t="inlineStr"><is><t>{escape(text)}</t></is></c>')
        xml_rows.append(f'<row r="{row_idx}">{"".join(cells)}</row>')
    return f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheetData>{"".join(xml_rows)}</sheetData>
</worksheet>'''


def build_xlsx(path, sheets):
    content_types = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
'''
    for idx, _ in enumerate(sheets, start=1):
        content_types += f'  <Override PartName="/xl/worksheets/sheet{idx}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>\n'
    content_types += '</Types>'

    rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>'''

    workbook_rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
'''
    for idx, _ in enumerate(sheets, start=1):
        workbook_rels += f'  <Relationship Id="rId{idx}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet{idx}.xml"/>\n'
    workbook_rels += '  <Relationship Id="rId999" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>\n'
    workbook_rels += '</Relationships>'

    workbook = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
'''
    for idx, name in enumerate([s[0] for s in sheets], start=1):
        workbook += f'    <sheet name="{escape(name)}" sheetId="{idx}" r:id="rId{idx}"/>\n'
    workbook += '  </sheets>\n</workbook>'

    styles = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="1"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border/></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>'''

    with zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.writestr('[Content_Types].xml', content_types)
        zf.writestr('_rels/.rels', rels)
        zf.writestr('xl/workbook.xml', workbook)
        zf.writestr('xl/_rels/workbook.xml.rels', workbook_rels)
        zf.writestr('xl/styles.xml', styles)
        for idx, (_, rows) in enumerate(sheets, start=1):
            zf.writestr(f'xl/worksheets/sheet{idx}.xml', sheet_xml(rows))


files = sorted(glob.glob(CSV_GLOB))
user_stats = defaultdict(lambda: {'name': '', 'phone': '', 'breakfast': 0, 'lunch_veg': 0, 'lunch_nonveg': 0, 'dinner_veg': 0, 'dinner_nonveg': 0, 'total': 0})

for file_path in files:
    with open(file_path, newline='', encoding='utf-8-sig') as fh:
        reader = csv.DictReader(fh)
        if not reader.fieldnames:
            continue
        menu_header = None
        for field in reader.fieldnames:
            if field and field.strip() not in {'Name', 'Phone', 'No', ''}:
                menu_header = field.strip()
                break
        if not menu_header:
            continue
        category = infer_category(menu_header)
        veg_type = infer_veg_nonveg(menu_header)
        for row in reader:
            name = (row.get('Name') or '').strip()
            phone = (row.get('Phone') or '').strip()
            if not name or name == 'סה"כ' or name.lower() == 'total':
                continue
            if not is_vote_cell(row.get(menu_header)):
                continue
            user = user_stats[(name, phone)]
            user['name'] = name
            user['phone'] = phone
            if category == 'breakfast':
                user['breakfast'] += 1
            elif category == 'lunch':
                if veg_type == 'veg':
                    user['lunch_veg'] += 1
                else:
                    user['lunch_nonveg'] += 1
            else:
                if veg_type == 'veg':
                    user['dinner_veg'] += 1
                else:
                    user['dinner_nonveg'] += 1
            user['total'] += 1

chat_text = Path(CHAT_FILE).read_text(encoding='utf-8', errors='ignore')
for line in chat_text.splitlines():
    match = re.match(r'^\[(\d{1,2})/(\d{1,2})/(\d{2,4}),.*\]\s*(.*?)\s*:\s*(.*)$', line)
    if not match:
        continue
    month = int(match.group(1))
    day = int(match.group(2))
    year = int(match.group(3))
    if len(match.group(3)) == 2:
        year += 2000
    if month != 7 or year != 2026:
        continue
    sender = match.group(4).strip()
    message = match.group(5)
    count_match = re.search(r'(?<!\w)(\d+)\s*(?:\+)?\s*(?:post\s+)?(breakfast|lunch|dinner)\b', message, re.I)
    if not count_match:
        continue
    count = int(count_match.group(1))
    meal_type = count_match.group(2).lower()
    user_key = find_matching_user(user_stats, sender)
    if not user_key:
        user_stats[(sender, '')] = {'name': sender, 'phone': '', 'breakfast': 0, 'lunch_veg': 0, 'lunch_nonveg': 0, 'dinner_veg': 0, 'dinner_nonveg': 0, 'total': 0}
        user_key = (sender, '')
    stats = user_stats[user_key]
    if meal_type == 'breakfast':
        stats['breakfast'] += count
    elif meal_type == 'lunch':
        stats['lunch_veg'] += count
    elif meal_type == 'dinner':
        stats['dinner_veg'] += count
    stats['total'] += count

rows = [['Name', 'Phone', 'Breakfast count', 'Lunch veg', 'Lunch non-veg', 'Dinner veg', 'Dinner non-veg', 'Total meals count']]
for key in sorted(user_stats, key=lambda item: (item[0].lower(), item[1])):
    stats = user_stats[key]
    rows.append([stats['name'], stats['phone'], stats['breakfast'], stats['lunch_veg'], stats['lunch_nonveg'], stats['dinner_veg'], stats['dinner_nonveg'], stats['total']])

build_xlsx(OUTPUT_XLSX, [('User wise', rows)])
print(f'Updated {OUTPUT_XLSX}')
for sender in ['Nikita', 'Navya Kondapalli NITR', 'Kshitija 🥀']:
    for row in rows:
        if row and row[0] == sender:
            print(row)
            break
