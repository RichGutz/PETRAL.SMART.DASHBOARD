
import fitz  # PyMuPDF
import sys
import os

def extract_text_from_pdf(pdf_path, start_page=0, end_page=None):
    if not os.path.exists(pdf_path):
        print(f"Error: File not found at {pdf_path}")
        return

    try:
        doc = fitz.open(pdf_path)
        print(f"Opened PDF: {pdf_path}")
        print(f"Total pages: {len(doc)}")
        
        text_content = []
        
        # If no end page is specified, read until the end
        if end_page is None:
            end_page = len(doc)
            
        # Ensure end_page does not exceed total pages
        end_page = min(end_page, len(doc))

        print(f"Extracting text from page {start_page} to {end_page}...")

        for i in range(start_page, end_page):
            page = doc.load_page(i)
            text = page.get_text()
            text_content.append(f"--- Page {i+1} ---\n{text}\n")

        output_path = pdf_path + ".txt"
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(text_content))
            
        print(f"Successfully extracted text to {output_path}")

    except Exception as e:
        print(f"Error extracting text: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract_pdf_text.py <pdf_path> [start_page] [end_page]")
        sys.exit(1)
        
    # Get arguments
    pdf_path = sys.argv[1]
    
    start_page = 0
    if len(sys.argv) > 2:
        try:
            start_page = int(sys.argv[2])
        except ValueError:
            pass
            
    end_page = None
    if len(sys.argv) > 3:
        try:
            end_page = int(sys.argv[3])
        except ValueError:
            pass
    
    extract_text_from_pdf(pdf_path, start_page, end_page)
