"""Extract reviewed annual figures from the saved official PDF; no network needed."""
from pathlib import Path
from pypdf import PdfReader
import csv
import hashlib
import json
import re
import zipfile
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent
PDF = ROOT / 'npa-statistical-tables-original.pdf'
SOURCE = 'https://www.npa.gov.tw/ch/app/data/doc?detailNo=949193398038827008&module=wg055&type=s'
reader = PdfReader(PDF)

def sequence(page, first, count=9):
    lines = [line.strip() for line in reader.pages[page-1].extract_text().splitlines()]
    start = lines.index(f'{first:,}')
    values = lines[start:start+count]
    assert len(values) == count and all(re.fullmatch(r'[\d,]+', v) for v in values)
    return [int(v.replace(',', '')) for v in values]

years = list(range(2017, 2026))
enforcement = sequence(10, 10530571)
accidents = sequence(105, 296826)
deaths = sequence(105, 2697)
injuries = sequence(105, 393046)
assert enforcement == [10530571,11253311,12701516,14641050,13857211,15016547,17554976,15095704,16319308]
assert accidents == [296826,320315,341972,362393,358221,375844,403085,393883,403393]
assert deaths == [2697,2780,2865,2972,2962,3064,3023,2950,2858]
assert injuries == [393046,426799,455400,482333,476304,499179,539535,524433,534134]

# Independently compare overlapping annual enforcement totals with dataset 39362 ODS.
ns = {'t':'urn:oasis:names:tc:opendocument:xmlns:table:1.0'}
with zipfile.ZipFile(ROOT / 'npa-enforcement-original.ods') as z:
    xml = ET.fromstring(z.read('content.xml'))
ods_values = {}
for row in xml.find('.//t:table', ns).findall('t:table-row', ns):
    cells = [''.join(c.itertext()).strip() for c in row.findall('t:table-cell', ns)]
    if len(cells) > 1 and (m := re.search(r'20\d{2}', cells[0])):
        if re.fullmatch(r'[\d,]+', cells[1]):
            ods_values[int(m.group())] = int(cells[1].replace(',', ''))
for year, value in zip(years, enforcement):
    if year in ods_values:
        assert ods_values[year] == value, (year, value, ods_values[year])

rows = []
for i, year in enumerate(years):
    row = dict(year=year, enforcement_cases=enforcement[i], injury_accident_cases=accidents[i],
               deaths_30_days=deaths[i], injuries_persons=injuries[i],
               safety_data_status='preliminary' if year >= 2023 else 'not_marked_preliminary',
               enforcement_pdf_page=10, safety_pdf_page=105, source_url=SOURCE)
    rows.append(row)
with (ROOT / 'annual-2017-2025.csv').open('w', encoding='utf-8-sig', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)
(ROOT / 'annual-2017-2025.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
sources = [
    ('npa-statistical-tables-original.pdf', SOURCE, 'PDF page 9: years; page 10: enforcement; page 105: accidents, 30-day deaths, injuries; page 2: preliminary-data notice'),
    ('npa-enforcement-original.zip', 'https://opdadm.moi.gov.tw/api/v1/no-auth/resource/api/dataset/E50B15E8-DB32-4202-B165-58BA4A0BD68B/resource/39D246DF-E4BC-4A34-8BCB-5279F62AE17D/download', 'Dataset https://data.gov.tw/dataset/39362 ; original archive preserved'),
    ('npa-enforcement-original.ods', 'https://data.gov.tw/dataset/39362', 'ODS extracted without content modification from preserved ZIP; overlap annual totals checked'),
    ('moi-2025-enforcement-release-original.html', 'https://www.moi.gov.tw/News_Content.aspx?n=9&s=337165&sms=9009', '2026-03-07 release; older 2025 total 16,319,546; not used as annual chart total'),
    ('moi-2025-enforcement-release-original.pdf', 'https://ws.moi.gov.tw/Download.ashx?n=MTE15bm056ysMTDpgLHlhafmlL%2FntbHoqIjpgJrloLFf5Lqk6YCa5Z%2B35rOVLnBkZg%3D%3D&u=LzAwMS9VcGxvYWQvNDAwL3JlbGZpbGUvOTAwOS8zMzcxNjUvNmYwMjZjNmMtYWJjYi00OWQxLThlZTAtZjliMDBmMDU4YWVjLnBkZg%3D%3D', 'Attachment linked by the saved release; older version for audit only'),
]
manifest = [dict(file=name, url=url, note=note, retrieved_date='2026-11-21', bytes=(ROOT/name).stat().st_size,
                 sha256=hashlib.sha256((ROOT/name).read_bytes()).hexdigest()) for name,url,note in sources]
(ROOT/'source-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Verified 9 annual rows from saved PDF; ODS overlapping years:', [y for y in years if y in ods_values])
for label, values in [('enforcement', enforcement),('accidents',accidents),('deaths',deaths),('injuries',injuries)]:
    print(label, '2017 to 2025:', round((values[-1]/values[0]-1)*100,2), '%;', '2024 to 2025:', round((values[-1]/values[-2]-1)*100,2),'%')
print('Source files hashed:', len(manifest))
