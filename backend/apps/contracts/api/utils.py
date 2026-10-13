import asyncio
from docxtpl import DocxTemplate
from datetime import datetime
import os
import time



async def convert_docx_to_pdf_async(docx_path: str) -> str:
    """Asynchronous conversion of DOCX to PDF and file saving."""

    pdf_path = docx_path.replace(".docx", ".pdf")

    if os.name == 'nt':  # Windows 
        ''' pip install pywin32 '''
        import pythoncom 
        from win32com.client import Dispatch

        pythoncom.CoInitialize()
        try:
            word = Dispatch("Word.Application")
            word.Visible = False
            doc = word.Documents.Open(docx_path)
            doc.SaveAs(pdf_path, FileFormat=17)  # 17 - PDF 
            doc.Close()
            word.Quit()
        finally:
            pythoncom.CoUninitialize()

        return pdf_path

    else:  # Linux/MacOS -> LibreOffice
        process = await asyncio.create_subprocess_exec(
            "libreoffice", "--headless", "--convert-to", "pdf", docx_path, "--outdir", os.path.dirname(docx_path),
            stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            print("LibreOffice Error:", stderr.decode())
            raise Exception("LibreOffice conversion failed")

        return pdf_path


async def generate_financial_report(context: dict, lang: str = "uz", media_root: str = None, BASE_DIR: str = None) -> str:
    """Generates a financial report in DOCX format and converts it to PDF."""
    today_date = datetime.now().date()

    start_time = time.time()
    
    doc_template = os.path.join(BASE_DIR, "contractTemplate.docx")
    if media_root:
        output_dir = os.path.join(media_root, "contracts")
    else:
        output_dir = os.path.abspath(os.path.join(BASE_DIR, "reports"))
    print(f"Output directory: {output_dir}, {time.time() - start_time:.2f} s")
    print(f"Template path: {doc_template}, {time.time() - start_time:.2f} s")
    # Create unique filename using contract number or UUID
    contract_identifier = context.get('contractNum', f"contract_{int(time.time())}")
    docx_output = os.path.join(output_dir, f"contract_{contract_identifier}_{lang}_{today_date}.docx")
    pdf_path = docx_output.replace(".docx", ".pdf")
    
    os.makedirs(output_dir, exist_ok=True)

    
    doc = DocxTemplate(doc_template)
    # print(f"Template: {doc_template}, {time.time() - start_time:.2f} s")
    
    # Add report date to context
    context["report_date"] = today_date.strftime("%d %B %Y")
  
    print(f"Images have been corrected. {time.time() - start_time:.2f} s")
    # context["PAGEBREAK"] = "\f"

    doc.render(context)
    doc.save(docx_output)
    print(f"Company report has been generated successfully!, {time.time() - start_time:.2f} s")

    pdf_path = await convert_docx_to_pdf_async(docx_output)
    print(f"Financial report PDF generated: {pdf_path}, {time.time() - start_time:.2f} s")

    return pdf_path




def num_to_words_uz(num):
    """Convert number to words in Uzbek."""
    from num2word_uz import num2word
    return num2word(num)