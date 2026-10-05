"""Import native face geometry and answer marks from the supplied Tsuchido PPTX.
Usage: python scripts/import-tsuchido-hako.py path/to/presentation.pptx
"""
import json
import sys
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET

ns = {'p': 'http://schemas.openxmlformats.org/presentationml/2006/main',
      'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'}
questions = []
with ZipFile(sys.argv[1]) as archive:
    for slide in range(2, 27):
        root = ET.fromstring(archive.read(f'ppt/slides/slide{slide}.xml'))
        faces, answer = [], None
        for shape in root.findall('.//p:sp', ns):
            geom = shape.find('p:spPr/a:prstGeom', ns)
            transform = shape.find('p:spPr/a:xfrm', ns)
            if geom is None or transform is None:
                continue
            kind = geom.get('prst')
            if kind in ('ellipse', 'mathMultiply'):
                answer = kind == 'ellipse'
            if kind != 'rect':
                continue
            off, size = transform[0], transform[1]
            color = shape.find('p:spPr/a:solidFill/a:srgbClr', ns)
            faces.append(dict(x=int(off.get('x')), y=int(off.get('y')),
                              w=int(size.get('cx')), h=int(size.get('cy')),
                              color='#' + color.get('val')))
        assert faces and answer is not None
        questions.append(dict(id=f'tsuchido-hako-{slide}', slide=slide,
                              kind='faces' if slide < 11 else 'net',
                              answer=answer, faces=faces))
target = Path(__file__).resolve().parents[1] / 'hako_shape_review_app_package/tsuchido-hako-data.js'
data = dict(source=Path(sys.argv[1]).name, title='土堂モジュール教材「はこの形」', questions=questions)
target.write_text('window.TsuchidoHakoData = ' + json.dumps(data, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
print(f'Imported {len(questions)} questions')
