"use client";

import { useState, useEffect } from "react";
import { Download, ArrowLeft, ListChecks } from "lucide-react";
import * as XLSX from "xlsx";

type LogItem = {
  code: string;
  time: string;
  device: string;
};

const GAS_URL = process.env.NEXT_PUBLIC_GAS_WEB_APP_URL as string;
const PRICE_PER_COUPON = 2500;

export default function AdminPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [todayCount, setTodayCount] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [issuedCount, setIssuedCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${GAS_URL}?type=logs`);
      const data = await res.json();
      setLogs(data.logs ?? []);
      setTodayCount(data.todayCount ?? 0);
      setTotalCount(data.totalCount ?? 0);
      setIssuedCount(data.issuedCount ?? 0);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDownloadExcel = () => {
    const rows = logs.map((log) => ({
      쿠폰번호: log.code,
      사용시각: new Date(log.time).toLocaleString("ko-KR"),
      사용기기정보: log.device,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "사용기록");

    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `쿠폰사용기록_${today}.xlsx`);
  };

  const redemptionRate =
    issuedCount && issuedCount > 0 && totalCount !== null
      ? ((totalCount / issuedCount) * 100).toFixed(1)
      : "-";

  const totalRevenue = totalCount !== null ? totalCount * PRICE_PER_COUPON : null;

  return (
    <main className="min-h-screen bg-[#FAFAFA] px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <a href="/" className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#1E3A8A]">
            <ArrowLeft className="w-4 h-4" />
            돌아가기
          </a>
          <button
            onClick={handleDownloadExcel}
            disabled={logs.length === 0}
            className="flex items-center gap-2 bg-[#1E3A8A] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#1e3a8a]/90 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            엑셀 다운로드
          </button>
        </div>

        <h1 className="text-xl font-bold text-[#1E3A8A] mb-6">관리자 페이지</h1>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-2xl font-bold text-[#1E3A8A]">{issuedCount ?? "-"}</p>
            <p className="text-xs text-gray-500 mt-1">쿠폰 발급 수</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-2xl font-bold text-[#1E3A8A]">
              {redemptionRate === "-" ? "-" : `${redemptionRate}%`}
            </p>
            <p className="text-xs text-gray-500 mt-1">수령률 (발급 대비 사용)</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-2xl font-bold text-[#1E3A8A]">{todayCount ?? "-"}</p>
            <p className="text-xs text-gray-500 mt-1">오늘 사용</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-2xl font-bold text-[#1E3A8A]">{totalCount ?? "-"}</p>
            <p className="text-xs text-gray-500 mt-1">전체 사용</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <p className="text-xs text-gray-500 mb-1">
            총 쿠폰 사용 매출 (쿠폰 1장 = {PRICE_PER_COUPON.toLocaleString()}원)
          </p>
          <p className="text-2xl font-bold text-[#1E3A8A]">
            {totalRevenue !== null ? `${totalRevenue.toLocaleString()}원` : "-"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4 text-gray-500">
            <ListChecks className="w-4 h-4" />
            <span className="text-sm font-medium">세부 사용현황</span>
          </div>

          {loading ? (
            <p className="text-sm text-gray-400 text-center py-6">불러오는 중...</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">아직 사용된 쿠폰이 없습니다.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {logs.map((log, idx) => (
                <div key={idx} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-800">{log.code}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{log.device}</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(log.time).toLocaleString("ko-KR")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}