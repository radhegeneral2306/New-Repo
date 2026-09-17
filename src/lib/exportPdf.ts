import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface PdfExportOptions {
  title: string
  dateRangeLabel: string
  head: string[]
  rows: (string | number)[][]
  totalsRow?: (string | number)[]
  fileName: string
}

export function exportToPdf({ title, dateRangeLabel, head, rows, totalsRow, fileName }: PdfExportOptions) {
  const doc = new jsPDF({ orientation: 'landscape' })

  doc.setFontSize(16)
  doc.text('Sahu Samaj Bhawan', 14, 15)
  doc.setFontSize(12)
  doc.text(title, 14, 22)
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(dateRangeLabel, 14, 28)

  autoTable(doc, {
    startY: 33,
    head: [head],
    body: rows,
    foot: totalsRow ? [totalsRow] : undefined,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [180, 83, 9] },
    footStyles: { fillColor: [245, 245, 244], textColor: 20, fontStyle: 'bold' },
  })

  doc.save(fileName)
}
