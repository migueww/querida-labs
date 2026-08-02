import { NextResponse, type NextRequest } from "next/server";
import { MateriaPrimaModel } from "@/lib/models/materia-prima.model";
import { verifyToken } from "@/lib/jwt";
import ExcelJS from "exceljs";

async function checkAuth(request: NextRequest) {
  const authToken = request.cookies.get("auth-token")?.value;
  if (!authToken) return false;
  const payload = await verifyToken(authToken);
  return !!payload;
}

export async function GET(request: NextRequest) {
  try {
    if (!(await checkAuth(request))) {
      return NextResponse.json({ message: "Não autorizado." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const classificacao = searchParams.get("classificacao") || "ALL";

    // Fetch filtered list without pagination
    const items = await MateriaPrimaModel.exportFiltered({ search, classificacao });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Matérias-Primas Filtradas");

    sheet.columns = [
      { header: "Código do Produto", key: "codigoProduto", width: 20 },
      { header: "Nome do Produto", key: "nomeProduto", width: 40 },
      { header: "Distribuidor", key: "distribuidor", width: 25 },
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "1E293B" }, // Slate 800
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 24;

    // Add rows
    items.forEach((item) => {
      sheet.addRow({
        codigoProduto: item.codigoProduto,
        nomeProduto: item.nomeProduto,
        distribuidor: item.distribuidor,
      });
    });

    const buffer = (await workbook.xlsx.writeBuffer()) as any;
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer;

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Materias_Primas_Filtradas.xlsx"`,
      },
    });
  } catch (error) {
    console.error("[GET /api/revalidacao-cv/materia-prima/export] Error:", error);
    return NextResponse.json(
      { message: "Erro ao exportar Matérias-Primas." },
      { status: 500 }
    );
  }
}
