# Required Dependencies for PDF Generation

The following dependencies need to be installed for the PDF generation feature to work:

```bash
npm install jspdf html2canvas
npm install --save-dev @types/jspdf
```

## Dependencies:
- `jspdf`: JavaScript PDF generation library
- `html2canvas`: HTML to canvas conversion for PDF generation
- `@types/jspdf`: TypeScript definitions for jsPDF

## Usage:
These dependencies are used in `src/lib/pdf-generator.ts` for generating PDFs from:
- Recipe information
- Food nutrition data
- Nutrition calculation results

The PDF generation is a premium feature that requires authentication and premium subscription.