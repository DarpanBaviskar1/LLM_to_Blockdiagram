"""
Complete PDF to Mermaid Diagram Generator

This script performs the complete pipeline:
1. Extract text from PDF
2. Generate structured summary 
3. Create Mermaid flowchart code
"""

import os
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.documents import Document
from langchain.chains.combine_documents import create_stuff_documents_chain
from pdf_scanner_alternative import extract_with_pdfplumber
from dotenv import load_dotenv




def pdf_to_mermaid_complete(pdf_path: str, output_file: str = None):
    """
    Complete pipeline: PDF → Summary → Mermaid Code
    
    Args:
        pdf_path: Path to the PDF file
        output_file: Optional output file path for Mermaid code
    
    Returns:
        Dictionary with summary and mermaid_code
    """
    
    # Load environment variables
    load_dotenv()
    
    # Get API key
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in environment variables")
    
    # Initialize Gemini model
    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",  # Updated model name
            google_api_key=api_key
        )
    except Exception as e:
        raise Exception(f"Failed to initialize Gemini model: {e}")
    
    # Step 1: Extract text from PDF
    print("📄 Extracting text from PDF...")
    try:
        if not os.path.exists(pdf_path):
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")
        
        texts = extract_with_pdfplumber(pdf_path)
        if not texts or not any(text.strip() for text in texts):
            raise Exception("No text could be extracted from the PDF")
        
        # Combine all pages' text into one string
        input_text = '\n'.join(texts)
        print(f"✓ Extracted {len(input_text)} characters from {len(texts)} pages")
        
    except Exception as e:
        raise Exception(f"PDF text extraction failed: {e}")
    
    # Step 2: Generate structured summary
    print("📝 Generating structured summary...")
    try:
        # Updated summary prompt template for research papers
        summary_prompt = ChatPromptTemplate.from_template(
            """Analyze this research paper and create a comprehensive structured summary that captures:

            **METHODOLOGY & APPROACH:**
            - Research objectives and goals
            - Proposed methods, algorithms, or frameworks
            - Key techniques and approaches used
            - Experimental setup and procedures

            **SYSTEM ARCHITECTURE & COMPONENTS:**
            - Main system components and modules
            - Data flow and processing pipelines
            - Input sources and output destinations
            - Dependencies between components

            **PROCESSES & WORKFLOWS:**
            - Step-by-step procedures and workflows
            - Data transformation processes
            - Decision points and conditional logic
            - Feedback loops and iterations

            **KEY ENTITIES & RELATIONSHIPS:**
            - Important concepts, variables, and parameters
            - Relationships between different elements
            - Causal connections and dependencies
            - Hierarchical structures

            **EVALUATION & RESULTS:**
            - Evaluation methods and metrics
            - Comparison processes
            - Result analysis workflows

            Extract ALL significant elements that show the complete research methodology, system design, and process flows. Include technical details that would be essential for understanding the full scope of the work.

            Research Paper Content: {context}"""
        )
        
        # Convert text to LangChain Document format
        documents = [Document(page_content=input_text)]
        
        # Create summarization chain
        summary_chain = create_stuff_documents_chain(llm, summary_prompt)
        
        # Generate summary
        summary = summary_chain.invoke({"context": documents})
        print(f"✓ Generated summary ({len(summary)} characters)")
        
    except Exception as e:
        raise Exception(f"Summary generation failed: {e}")
    
    # Step 3: Generate Mermaid code
    print("🎨 Generating Mermaid flowchart code...")
    try:
        # Updated Mermaid generation prompt for comprehensive diagrams with strict syntax
        mermaid_prompt = ChatPromptTemplate.from_template(
            """Create a comprehensive Mermaid flowchart that represents the complete research methodology and system architecture described in the summary.

            **CRITICAL SYNTAX REQUIREMENTS:**
            1. Start with EXACTLY: flowchart TD
            2. Use ONLY these valid node shapes:
               - A[Process Name] for processes
               - A(Start/End) for start/end points
               - A{{Decision}} for decisions
               - A[[Database]] for data/storage
               - A[/Analysis/] for analysis steps
               - A((Result)) for results/outcomes
            3. Use simple node IDs: A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z
            4. For connections, use ONLY: --> or -->|label|
            5. Node labels must be 2-4 words maximum
            6. NO special characters in node IDs (only A-Z)
            7. NO quotes around labels
            8. NO empty lines between statements

            **STRUCTURE REQUIREMENTS:**
            - Create exactly 15-20 nodes
            - Show complete research workflow from problem to conclusions
            - Include: problem definition → literature review → methodology → data collection → preprocessing → analysis → evaluation → results → conclusions
            - Add decision points for method selection and validation
            - Include feedback loops where appropriate

            **VALID SYNTAX EXAMPLE:**
            flowchart TD
                A(Research Problem) --> B[Literature Review]
                B --> C[Data Collection]
                C --> D[[Dataset]]
                D --> E[Data Preprocessing]
                E --> F{{Method Selection}}
                F -->|Approach 1| G[Algorithm Implementation]
                F -->|Approach 2| H[Alternative Method]
                G --> I[Feature Extraction]
                H --> I
                I --> J[Model Training]
                J --> K{{Validation Check}}
                K -->|Failed| L[Parameter Tuning]
                L --> J
                K -->|Passed| M[/Performance Evaluation/]
                M --> N[Comparison Analysis]
                N --> O[/Statistical Testing/]
                O --> P((Results))
                P --> Q[Result Interpretation]
                Q --> R((Conclusions))

            **OUTPUT RULES:**
            - Provide ONLY the Mermaid code
            - NO explanations before or after
            - NO markdown code blocks
            - NO additional text
            - Ensure every node referenced in connections is defined
            - Test each line follows the pattern: NodeID[Label] --> NodeID[Label]

            Based on this summary, create a syntactically correct Mermaid flowchart:
            {context}"""
        )
        
        # Convert summary to document format
        summary_documents = [Document(page_content=summary)]
        
        # Create Mermaid generation chain
        mermaid_chain = create_stuff_documents_chain(llm, mermaid_prompt)
        
        # Generate Mermaid code
        mermaid_code = mermaid_chain.invoke({"context": summary_documents})
        
        # Clean up the response more thoroughly
        mermaid_code = mermaid_code.strip()
        
        # Remove any potential wrapper tags
        if '```mermaid' in mermaid_code:
            mermaid_code = mermaid_code.split('```mermaid')[1].split('```')[0].strip()
        elif '```' in mermaid_code:
            mermaid_code = mermaid_code.replace('```', '').strip()
        
        # Remove any extra explanatory text
        lines = mermaid_code.split('\n')
        cleaned_lines = []
        
        for line in lines:
            line = line.strip()
            # Keep only lines that are flowchart definition or node connections
            if (line.startswith('flowchart') or 
                '-->' in line or 
                line.endswith(']') or 
                line.endswith(')') or 
                line.endswith('}}') or
                line.endswith('/]')):
                cleaned_lines.append(line)
        
        mermaid_code = '\n'.join(cleaned_lines)
        
        # Validate basic syntax
        if not mermaid_code.startswith('flowchart'):
            raise Exception("Generated code doesn't start with 'flowchart'")
        
        print(f"✓ Generated Mermaid code ({len(mermaid_code)} characters)")
        
    except Exception as e:
        raise Exception(f"Mermaid code generation failed: {e}")
    
    # Step 4: Save output file if specified
    if output_file:
        try:
            # Create output directory if it doesn't exist
            output_dir = os.path.dirname(output_file)
            if output_dir and not os.path.exists(output_dir):
                os.makedirs(output_dir)
            
            # Create HTML content with Mermaid code (like test4.html format)
            html_content = f"""<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body>
  <pre class="mermaid">
{mermaid_code}
  </pre>

  <script type="module">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    mermaid.initialize({{ startOnLoad: true }});
  </script>
</body>
</html>"""
            
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(html_content)
            print(f"💾 Saved HTML with Mermaid diagram to: {output_file}")
            
        except Exception as e:
            print(f"Warning: Failed to save output file: {e}")
    
    # Return results
    results = {
        'pdf_path': pdf_path,
        'summary': summary,
        'mermaid_code': mermaid_code,
        'text_length': len(input_text),
        'summary_length': len(summary),
        'mermaid_length': len(mermaid_code)
    }
    
    return results


def text_to_mermaid_complete(input_text: str, output_file: str = None):
    """
    Complete pipeline: raw text → Summary → Mermaid Code

    Args:
        input_text: Raw text to process
        output_file: Optional output file path for Mermaid code

    Returns:
        Dictionary with summary and mermaid_code
    """

    # Validate input
    if not isinstance(input_text, str) or not input_text.strip():
        raise ValueError("input_text must be a non-empty string")

    # Load environment variables
    load_dotenv()

    # Get API key
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in environment variables")

    # Initialize Gemini model
    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=api_key
        )
    except Exception as e:
        raise Exception(f"Failed to initialize Gemini model: {e}")

    # Use the same summarization prompt as the PDF pipeline
    print("📝 Generating structured summary from text...")
    try:
        summary_prompt = ChatPromptTemplate.from_template(
             """You are given a short story or narrative passage. Produce a concise, story-focused summary aimed at diagramming the narrative. Provide five short sections, each as a single-line bullet:

            CHARACTERS: comma-separated list of main characters (1-3 words each)
            RELATIONSHIPS: short phrases describing key relationships (e.g., "Alice → Bob: mentor")
            LOCATIONS: important settings (comma-separated)
            TIMELINE: 4-8 short event phrases in chronological order (comma-separated)
            RESOLUTION: one short sentence describing the ending or outcome

            Output only these five lines (no extra text, no markdown). Example:
            CHARACTERS: Alice, Bob
            RELATIONSHIPS: Alice → Bob: collaborator
            LOCATIONS: Paris, Berlin
            TIMELINE: Meeting in Paris, Decision about project, Travel to Berlin, Update sent
            RESOLUTION: The team agrees to continue work remotely

            Story content: {context}"""
        )

        # Convert text to LangChain Document format
        documents = [Document(page_content=input_text)]

        # Create summarization chain
        summary_chain = create_stuff_documents_chain(llm, summary_prompt)

        # Generate summary
        summary = summary_chain.invoke({"context": documents})
        print(f"✓ Generated summary ({len(summary)} characters)")

    except Exception as e:
        raise Exception(f"Summary generation failed: {e}")

    # Generate mermaid code from summary using same prompt as PDF pipeline
    print("🎨 Generating Mermaid flowchart code from summary...")
    try:
        mermaid_prompt = ChatPromptTemplate.from_template(
            """Create a comprehensive Mermaid flowchart that represents the complete research methodology and system architecture described in the summary.

            **CRITICAL SYNTAX REQUIREMENTS:**
            1. Start with EXACTLY: flowchart TD
            2. Use ONLY these valid node shapes:
               - A[Process Name] for processes
               - A(Start/End) for start/end points
               - A{{Decision}} for decisions
               - A[[Database]] for data/storage
               - A[/Analysis/] for analysis steps
               - A((Result)) for results/outcomes
            3. Use simple node IDs: A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z
            4. For connections, use ONLY: --> or -->|label|
            5. Node labels must be 2-4 words maximum
            6. NO special characters in node IDs (only A-Z)
            7. NO quotes around labels
            8. NO empty lines between statements

            **STRUCTURE REQUIREMENTS:**
            - Create exactly 15-20 nodes
            - Show complete research workflow from problem to conclusions
            - Include: problem definition → literature review → methodology → data collection → preprocessing → analysis → evaluation → results → conclusions
            - Add decision points for method selection and validation
            - Include feedback loops where appropriate

            **VALID SYNTAX EXAMPLE:**
            flowchart TD
                A(Research Problem) --> B[Literature Review]
                B --> C[Data Collection]
                C --> D[[Dataset]]
                D --> E[Data Preprocessing]
                E --> F{{Method Selection}}
                F -->|Approach 1| G[Algorithm Implementation]
                F -->|Approach 2| H[Alternative Method]
                G --> I[Feature Extraction]
                H --> I
                I --> J[Model Training]
                J --> K{{Validation Check}}
                K -->|Failed| L[Parameter Tuning]
                L --> J
                K -->|Passed| M[/Performance Evaluation/]
                M --> N[Comparison Analysis]
                N --> O[/Statistical Testing/]
                O --> P((Results))
                P --> Q[Result Interpretation]
                Q --> R((Conclusions))

            **OUTPUT RULES:**
            - Provide ONLY the Mermaid code
            - NO explanations before or after
            - NO markdown code blocks
            - NO additional text
            - Ensure every node referenced in connections is defined
            - Test each line follows the pattern: NodeID[Label] --> NodeID[Label]

            Based on this summary, create a syntactically correct Mermaid flowchart:
            {context}"""
        )

        summary_documents = [Document(page_content=summary)]
        mermaid_chain = create_stuff_documents_chain(llm, mermaid_prompt)
        mermaid_code = mermaid_chain.invoke({"context": summary_documents})

        mermaid_code = mermaid_code.strip()

        if '```mermaid' in mermaid_code:
            mermaid_code = mermaid_code.split('```mermaid')[1].split('```')[0].strip()
        elif '```' in mermaid_code:
            mermaid_code = mermaid_code.replace('```', '').strip()

        lines = mermaid_code.split('\n')
        cleaned_lines = []
        for line in lines:
            line = line.strip()
            if (line.startswith('flowchart') or 
                '-->' in line or 
                line.endswith(']') or 
                line.endswith(')') or 
                line.endswith('}}') or
                line.endswith('/]')):
                cleaned_lines.append(line)

        mermaid_code = '\n'.join(cleaned_lines)

        if not mermaid_code.startswith('flowchart'):
            raise Exception("Generated code doesn't start with 'flowchart'")

        print(f"✓ Generated Mermaid code ({len(mermaid_code)} characters)")

    except Exception as e:
        raise Exception(f"Mermaid code generation failed: {e}")

    # Save output file if specified
    if output_file:
        try:
            output_dir = os.path.dirname(output_file)
            if output_dir and not os.path.exists(output_dir):
                os.makedirs(output_dir)

            html_content = f"""<!DOCTYPE html>
<html lang=\"en\">
<head><meta charset=\"UTF-8\"></head>
<body>
  <pre class=\"mermaid\">
{mermaid_code}
  </pre>

  <script type=\"module\">
    import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
    mermaid.initialize({{ startOnLoad: true }});
  </script>
</body>
</html>"""

            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(html_content)
            print(f"💾 Saved HTML with Mermaid diagram to: {output_file}")
        except Exception as e:
            print(f"Warning: Failed to save output file: {e}")

    results = {
        'summary': summary,
        'mermaid_code': mermaid_code,
        'text_length': len(input_text),
        'summary_length': len(summary),
        'mermaid_length': len(mermaid_code)
    }

    return results

def display_results(results):
    """Display the results in a formatted way"""
    print("\n" + "="*70)
    print("🎯 PDF TO MERMAID DIAGRAM GENERATION COMPLETE")
    print("="*70)
    print(f"📄 PDF File: {results['pdf_path']}")
    print(f"📊 Original Text: {results['text_length']:,} characters")
    print(f"📝 Summary: {results['summary_length']:,} characters")
    print(f"🎨 Mermaid Code: {results['mermaid_length']:,} characters")
    
    print("\n" + "-"*50)
    print("📋 GENERATED SUMMARY:")
    print("-"*50)
    print(results['summary'])
    
    print("\n" + "-"*50)
    print("🎯 GENERATED MERMAID CODE:")
    print("-"*50)
    print(results['mermaid_code'])
    print("\n" + "="*70)

# Main execution
if __name__ == "__main__":
    # Configuration - Update these paths
    PDF_PATH = "Chart-Generation-using-LLMs/docs/doc4.pdf"  # Change this to your PDF file path
    OUTPUT_FILE = "generated_diagram.html"  # Changed from .mmd to .html
    
    try:
        # Run the complete pipeline
        print("🚀 Starting PDF to Mermaid generation pipeline...")
        print(f"📄 Processing: {PDF_PATH}")
        
        results = pdf_to_mermaid_complete(
            pdf_path=PDF_PATH,
            output_file=OUTPUT_FILE
        )
        
        # Display the results
        display_results(results)
        
        print("✅ Pipeline completed successfully!")
        
    except FileNotFoundError as e:
        print(f"❌ File Error: {e}")
        print("Please check that the PDF file path is correct.")
        
    except ValueError as e:
        print(f"❌ Configuration Error: {e}")
        print("Please check your .env file contains GEMINI_API_KEY")
        
    except Exception as e:
        print(f"❌ Pipeline Error: {e}")
        print("Please check your configuration and try again.")

