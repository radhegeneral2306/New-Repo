import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

export interface ExcelExportOptions {
  title: string
  dateRangeLabel: string
  head: string[]
  rows: (string | number)[][]
  totalsRow?: (string | number)[]
  fileName: string
  sheetName?: string
}

export async function exportToExcel({
  title,
  dateRangeLabel,
  head,
  rows,
  totalsRow,
  fileName,
  sheetName = 'Report',
}: ExcelExportOptions) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(sheetName)

  sheet.mergeCells(1, 1, 1, head.length)
  const titleCell = sheet.getCell(1, 1)
  titleCell.value = `Sahu Samaj Bhawan — ${title}`
  titleCell.font = { bold: true, size: 14 }

  sheet.mergeCells(2, 1, 2, head.length)
  const subtitleCell = sheet.getCell(2, 1)
  subtitleCell.value = dateRangeLabel
  subtitleCell.font = { italic: true, color: { argb: 'FF666666' } }

  sheet.addRow([])
  const headerRow = sheet.addRow(head)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB45309' } }
  })

  for (const row of rows) {
    sheet.addRow(row)
  }

  if (totalsRow) {
    const footerRow = sheet.addRow(totalsRow)
    footerRow.font = { bold: true }
    footerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F4' } }
    })
  }

  sheet.columns.forEach((col) => {
    let maxLength = 12
    col.eachCell?.({ includeEmpty: true }, (cell) => {
      const len = cell.value ? String(cell.value).length : 0
      if (len > maxLength) maxLength = len
    })
    col.width = Math.min(maxLength + 2, 40)
  })

  const buffer = await workbook.xlsx.writeBuffer()
  saveAs(new Blob([buffer]), fileName)
}
