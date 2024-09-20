import { Logger } from "decky-plugin-framework"

export type SpreadSheetAlignment = "left" | "center" | "right"

export interface SpreadSheetCell {
    data: any
    align: SpreadSheetAlignment
    padding?: string
    rowspan?: boolean
    colspan?: boolean
}

export class SpreadSheet {
    public static printSpreadSheet(headers: Array<SpreadSheetCell>, body: Array<Array<SpreadSheetCell>>) {
        const lengths = SpreadSheet.calcLengths(headers, body)
        const totalLineLength = lengths.reduce((sum, current) => sum + current + 3, 0) + 1
        let head = ""
        let line = ""
        for (let i = 0; i < headers.length; i++) {
            if (headers[i].rowspan) {
                head += "|" + SpreadSheet.padCell("", "left", lengths[i] + 2, " ")
            } else {
                head += SpreadSheet.padCell("", "left", lengths[i] + 3, "-")
            }
            line += (headers[i].colspan ? "  " : "| ") + SpreadSheet.padCell(String(headers[i].data), headers[i].align, lengths[i], headers[i].padding) + " "
        }
        Logger.info(head + "-")
        Logger.info(line + "|")
        for (let i = 0; i < body.length; i++) {
            let head = ""
            let line = ""
            for (let j = 0; j < body[i].length; j++) {
                if (body[i][j].rowspan) {
                    head += "|" + SpreadSheet.padCell("", "left", lengths[j] + 2, " ")
                } else {
                    head += SpreadSheet.padCell("", "left", lengths[j] + 3, "-")
                }
                line += (body[i][j].colspan ? "  " : "| ") + SpreadSheet.padCell(String(body[i][j].data), body[i][j].align, lengths[j], body[i][j].padding) + " "
            }
            Logger.info(head + "-")
            Logger.info(line + "|")
        }
        Logger.info(SpreadSheet.padCell("", "left", totalLineLength, "-"))
    }

    private static calcLengths(headers: Array<SpreadSheetCell>, body: Array<Array<SpreadSheetCell>>) {
        const lengths: Array<number> = []

        for (let i = 0; i < headers.length; i++) {
            let maxLength = String(headers[i].data).length
            for (let j = 0; j < body.length; j++) {
                maxLength = Math.max(maxLength, String(body[j][i].data).length)
            }
            lengths.push(maxLength)
        }

        return lengths
    }

    private static padCell(data: string, align: SpreadSheetAlignment, size: number, padding?: string) {
        if (align == "left") {
            return data.padEnd(size, padding)
        }

        if (align == "right") {
            return data.padStart(size, padding)
        }

        let leftPad = Math.ceil((size - data.length) / 2)
        return data.padStart(leftPad + data.length).padEnd(size)
    }
}



