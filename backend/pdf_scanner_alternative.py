# Alternative PDF text extraction methods

def extract_with_pdfplumber(pdf_path, use_ocr: bool = True, ocr_lang: str = 'eng'):
    """Extract text from a PDF using pdfplumber and (optionally) OCR.

    This function will try to extract selectable text via `pdfplumber` for
    each page. If OCR is requested and `pytesseract` (and the tesseract
    binary) are available, it will also render the page to an image and run
    OCR on it. The results are combined intelligently per-page so that
    selectable text is preserved and OCR supplements missing or image-only
    content.

    Args:
        pdf_path: Path to PDF file
        use_ocr: If True, attempt OCR on each page (default True)
        ocr_lang: Language code for Tesseract (default 'eng')

    Returns:
        List[str] - text content per page (combined pdfplumber + OCR)
    """
    import pdfplumber
    from typing import List

    # Try to import OCR dependencies but don't hard-fail if missing
    try:
        from PIL import Image
    except Exception:
        Image = None

    try:
        import pytesseract # pyright: ignore[reportMissingImports]
    except Exception:
        pytesseract = None

    text_by_page: List[str] = []

    with pdfplumber.open(pdf_path) as pdf:
        for page_number, page in enumerate(pdf.pages, start=1):
            # First, try to get selectable/extracted text
            try:
                text = page.extract_text() or ""
            except Exception:
                text = ""

            ocr_text = ""
            # If OCR is enabled and available, render page to image and OCR it
            if pytesseract and Image and use_ocr:
                try:
                    # pdfplumber's page.to_image() can produce a Pillow image via .original
                    imgobj = page.to_image(resolution=150)
                    pil_img = getattr(imgobj, 'original', None)
                    if pil_img is None:
                        # last-resort: try exporting bytes and opening with PIL
                        raw = imgobj.render()
                        pil_img = Image.fromarray(raw)

                    if pil_img and pil_img.mode != 'RGB':
                        pil_img = pil_img.convert('RGB')

                    # Run Tesseract OCR
                    try:
                        ocr_text = pytesseract.image_to_string(pil_img, lang=ocr_lang) or ""
                    except Exception:
                        # If tesseract binary is missing or fails, ignore OCR for this page
                        ocr_text = ""
                except Exception:
                    ocr_text = ""

            # Combine extracted text and OCR results
            combined = ""
            t = text.strip()
            o = ocr_text.strip()

            if t and o:
                # If both have content, include both but avoid exact duplicates
                if o in t or t in o:
                    combined = t if len(t) >= len(o) else o
                else:
                    # Prefer extracted text first, then OCR supplement
                    combined = t + "\n" + o
            elif t:
                combined = t
            elif o:
                combined = o
            else:
                combined = "[No text found]"

            text_by_page.append(combined)

    return text_by_page

# def extract_with_pymupdf(pdf_path):
#     """Using PyMuPDF (fitz) - good for various PDF types"""
#     import fitz  # PyMuPDF
    
#     text_by_page = []
#     doc = fitz.open(pdf_path)
#     for page_num in range(doc.page_count):
#         page = doc[page_num]
#         text = page.get_text()
#         text_by_page.append(text if text else "[No text found]")
#     doc.close()
#     return text_by_page

# def extract_with_pdfminer(pdf_path):
#     """Using pdfminer3k - handles complex encodings well"""
#     from pdfminer.high_level import extract_text
    
#     try:
#         text = extract_text(pdf_path)
#         # Split by form feed character (page breaks)
#         pages = text.split('\f')
#         return [page.strip() for page in pages if page.strip()]
#     except Exception as e:
#         print(f"Error with pdfminer: {e}")
#         return []

if __name__ == "__main__":
    pdf_path = "backend/Chart-Generation-using-LLMs/docs/doc1.pdf"
    

    try:
        texts = extract_with_pdfplumber(pdf_path)
        for i, page_text in enumerate(texts, start=1):
            print(f"--- Page {i} ---")
            print(page_text)
            print()
    except ImportError:
        print("pdfplumber not installed. Install with: pip install pdfplumber")
    except Exception as e:
        print(f"pdfplumber failed: {e}")
    
    # print("\n=== Trying PyMuPDF ===")
    # try:
    #     texts = extract_with_pymupdf(pdf_path)
    #     for i, page_text in enumerate(texts, start=1):
    #         print(f"--- Page {i} ---")
    #         print(page_text[:200] + "..." if len(page_text) > 200 else page_text)
    #         print()
    # except ImportError:
    #     print("PyMuPDF not installed. Install with: pip install PyMuPDF")
    # except Exception as e:
    #     print(f"PyMuPDF failed: {e}")