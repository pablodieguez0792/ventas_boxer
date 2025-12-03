"""
Script para convertir el documento Markdown a Word
"""
import re

try:
    from docx import Document
    from docx.shared import Pt, RGBColor, Inches
    from docx.enum.text import WD_ALIGN_PARAGRAPH
except ImportError:
    print("Instalando python-docx...")
    import subprocess
    subprocess.check_call(['pip', 'install', 'python-docx'])
    from docx import Document
    from docx.shared import Pt, RGBColor, Inches
    from docx.enum.text import WD_ALIGN_PARAGRAPH

def parse_markdown_to_docx(md_file, docx_file):
    """Convierte Markdown a Word"""
    
    # Crear documento
    doc = Document()
    
    # Configurar estilos
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Calibri'
    font.size = Pt(11)
    
    # Leer archivo markdown
    with open(md_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    in_code_block = False
    code_language = None
    code_lines = []
    in_table = False
    table_lines = []
    
    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        
        # Detectar bloques de código
        if line.startswith('```'):
            if not in_code_block:
                in_code_block = True
                code_language = line[3:].strip()
                code_lines = []
            else:
                # Fin del bloque de código
                in_code_block = False
                if code_lines:
                    p = doc.add_paragraph()
                    p.paragraph_format.left_indent = Inches(0.5)
                    p.paragraph_format.space_before = Pt(6)
                    p.paragraph_format.space_after = Pt(6)
                    run = p.add_run('\n'.join(code_lines))
                    run.font.name = 'Consolas'
                    run.font.size = Pt(9)
                    run.font.color.rgb = RGBColor(0, 0, 128)
                code_lines = []
            i += 1
            continue
        
        if in_code_block:
            code_lines.append(line)
            i += 1
            continue
        
        # Detectar tablas
        if '|' in line and line.strip().startswith('|'):
            if not in_table:
                in_table = True
                table_lines = []
            table_lines.append(line)
            i += 1
            continue
        elif in_table and line.strip() == '':
            # Fin de tabla
            in_table = False
            if len(table_lines) > 2:
                create_table(doc, table_lines)
            table_lines = []
            i += 1
            continue
        
        # Títulos
        if line.startswith('# '):
            p = doc.add_heading(line[2:], level=1)
            p.paragraph_format.space_before = Pt(24)
            p.paragraph_format.space_after = Pt(12)
        elif line.startswith('## '):
            p = doc.add_heading(line[3:], level=2)
            p.paragraph_format.space_before = Pt(18)
            p.paragraph_format.space_after = Pt(10)
        elif line.startswith('### '):
            p = doc.add_heading(line[4:], level=3)
            p.paragraph_format.space_before = Pt(14)
            p.paragraph_format.space_after = Pt(8)
        elif line.startswith('#### '):
            p = doc.add_heading(line[5:], level=4)
        
        # Líneas horizontales
        elif line.strip() == '---':
            doc.add_paragraph('_' * 80)
        
        # Listas
        elif line.startswith('- ') or line.startswith('* '):
            text = line[2:]
            # Detectar negrita en listas
            text = process_inline_formatting(text)
            p = doc.add_paragraph(style='List Bullet')
            add_formatted_text(p, text)
        
        elif re.match(r'^\d+\. ', line):
            text = re.sub(r'^\d+\. ', '', line)
            text = process_inline_formatting(text)
            p = doc.add_paragraph(style='List Number')
            add_formatted_text(p, text)
        
        # Párrafos normales
        elif line.strip():
            text = process_inline_formatting(line)
            p = doc.add_paragraph()
            add_formatted_text(p, text)
        
        # Líneas vacías
        else:
            doc.add_paragraph()
        
        i += 1
    
    # Guardar documento
    doc.save(docx_file)
    print(f"Documento creado exitosamente: {docx_file}")

def create_table(doc, table_lines):
    """Crea una tabla en el documento"""
    # Parsear líneas de tabla
    rows = []
    for line in table_lines:
        if line.strip().startswith('|---') or line.strip().startswith('|-'):
            continue  # Línea separadora
        cells = [cell.strip() for cell in line.split('|')[1:-1]]
        if cells:
            rows.append(cells)
    
    if not rows:
        return
    
    # Crear tabla
    table = doc.add_table(rows=len(rows), cols=len(rows[0]))
    table.style = 'Light Grid Accent 1'
    
    # Llenar tabla
    for i, row_data in enumerate(rows):
        row = table.rows[i]
        for j, cell_data in enumerate(row_data):
            if j < len(row.cells):
                row.cells[j].text = cell_data
                # Primera fila en negrita
                if i == 0:
                    for paragraph in row.cells[j].paragraphs:
                        for run in paragraph.runs:
                            run.font.bold = True

def process_inline_formatting(text):
    """Procesa formato inline (negrita, código)"""
    return text

def add_formatted_text(paragraph, text):
    """Agrega texto con formato al párrafo"""
    # Detectar negrita **texto**
    parts = re.split(r'(\*\*.*?\*\*)', text)
    for part in parts:
        if part.startswith('**') and part.endswith('**'):
            run = paragraph.add_run(part[2:-2])
            run.font.bold = True
        elif part.startswith('`') and part.endswith('`'):
            run = paragraph.add_run(part[1:-1])
            run.font.name = 'Consolas'
            run.font.size = Pt(10)
            run.font.color.rgb = RGBColor(200, 0, 0)
        else:
            paragraph.add_run(part)

if __name__ == '__main__':
    md_file = 'DOCUMENTACION_TIENDA_NUBE.md'
    docx_file = 'DOCUMENTACION_TIENDA_NUBE.docx'
    
    print("Convirtiendo Markdown a Word...")
    parse_markdown_to_docx(md_file, docx_file)
    print(f"Archivo generado: {docx_file}")
