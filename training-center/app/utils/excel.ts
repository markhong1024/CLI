import * as XLSX from "xlsx";
import { Center } from "../data/mock";

export function downloadCentersExcel(centers: Center[]) {
  const rows = centers.map((c) => ({
    "연번": c.id,
    "지역": c.region,
    "공동훈련센터명": c.name,
    "담당자": c.manager,
    "기수": c.generation,
    "참여유형수": c.typeCount,
    "사업유형": c.bizType,
    "재직자": c.jikja ? "O" : "",
    "P-TECH": c.ptech ? "O" : "",
    "4년제": c.yr4 ? "O" : "",
    "전문대": c.college ? "O" : "",
    "특화대학": c.specialized ? "O" : "",
    "대학원": c.graduate ? "O" : "",
    "경력개발": c.career ? "O" : "",
    "첨단산업": c.hitech ? "O" : "",
    "구직자": c.jobseeker ? "O" : "",
    "외국인": c.foreign ? "O" : "",
    "20년 등급": c.s20,
    "21년 등급": c.s21,
    "22년 등급": c.s22,
    "23년 등급": c.s23,
    "24년 등급": c.s24,
    "25년 등급": c.s25,
    "26년 등급": c.s26,
    "27년 등급": c.s27,
    "28년 등급": c.s28,
    "29년 등급": c.s29,
    "30년 등급": c.s30,
    "31년 등급": c.s31,
    "32년 등급": c.s32,
    "33년 등급": c.s33,
    "34년 등급": c.s34,
    "35년 등급": c.s35,
    "특이사항": c.note,
    "비고": c.note2,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 6 }, { wch: 10 }, { wch: 28 }, { wch: 10 }, { wch: 6 },
    { wch: 8 }, { wch: 20 }, { wch: 6 }, { wch: 8 }, { wch: 6 },
    { wch: 6 }, { wch: 8 }, { wch: 8 }, { wch: 6 }, { wch: 6 }, { wch: 6 }, { wch: 6 },
    { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
    { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
    { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
    { wch: 40 }, { wch: 20 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "기관현황");
  XLSX.writeFile(wb, `공동훈련센터_기관현황_${today()}.xlsx`);
}

export function downloadScoresExcel(centers: Center[]) {
  const rows = centers.map((c) => ({
    "연번": c.id,
    "지역": c.region,
    "공동훈련센터명": c.name,
    "담당자": c.manager,
    "사업유형": c.bizType,
    "2020년": c.s20,
    "2021년": c.s21,
    "2022년": c.s22,
    "2023년": c.s23,
    "2024년": c.s24,
    "2025년": c.s25,
    "2026년": c.s26,
    "2027년": c.s27,
    "2028년": c.s28,
    "2029년": c.s29,
    "2030년": c.s30,
    "2031년": c.s31,
    "2032년": c.s32,
    "2033년": c.s33,
    "2034년": c.s34,
    "2035년": c.s35,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 6 }, { wch: 10 }, { wch: 28 }, { wch: 10 }, { wch: 20 },
    { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
    { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
    { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "성과평가현황");
  XLSX.writeFile(wb, `공동훈련센터_성과평가_${today()}.xlsx`);
}

export function downloadNoticesExcel(centers: Center[]) {
  const withNotes = centers.filter((c) => c.note || c.note2);
  const rows = withNotes.map((c) => ({
    "연번": c.id,
    "지역": c.region,
    "공동훈련센터명": c.name,
    "담당자": c.manager,
    "23년 등급": c.s23,
    "24년 등급": c.s24,
    "25년 등급": c.s25,
    "특이사항": c.note,
    "비고": c.note2,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = [
    { wch: 6 }, { wch: 10 }, { wch: 28 }, { wch: 10 },
    { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 50 }, { wch: 30 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "특이사항");
  XLSX.writeFile(wb, `공동훈련센터_특이사항_${today()}.xlsx`);
}

function today() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
}
