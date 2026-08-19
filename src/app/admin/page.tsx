"use client";

import { useState, useEffect, useRef } from "react";
import { Download, ArrowLeft, ListChecks, RefreshCw } from "lucide-react";
import * as XLSX from "xlsx";

type LogItem = {
  code: string;
  time: string;
  device: string;
  campus: string;
};

type Tab = "all" | "seoul" | "global";

const GAS_URL = process.env.NEXT_PUBLIC_GAS_WEB_APP_URL as string;
const STORAGE_KEY = "admin_stats_cache_v1";

export default function AdminPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [todayCount, setTodayCount] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [issuedCount, setIssuedCount] = useState<number | null>(null);
  const [seoulCount, setSeoulCount] = useState<number | null>(null);
  const [globalCount, setGlobalCount] = useState<number | null>(null);
  const [seoulTodayCount, setSeoulTodayCount] = useState<number | null>(null);
  const [globalTodayCount, setGlobalTodayCount] = useState<number | null>(null);
  const [seoulRevenue, setSeoulRevenue] = useState<number | null>(null);
  const [globalRevenue, setGlobalRevenue] = useState<number | null>(null);
  const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tab, setTab] = useState<Tab>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const lastFetchRef = useRef<string | null>(null);

  const applyStats = (data: any) => {
    setTodayCount(data.todayCount ?? 0);
    setTotalCount(data.totalCount ?? 0);
    setIssuedCount(data.issuedCount ?? 0);
    setSeoulCount(data.seoulCount ?? 0);
    setGlobalCount(data.globalCount ?? 0);
    setSeoulTodayCount(data.seoulTodayCount ?? 0);
    setGlobalTodayCount(data.globalTodayCount ?? 0);
    setSeoulRevenue(data.seoulRevenue ?? 0);
    setGlobalRevenue(data.globalRevenue ?? 0);
    setTotalRevenue(data.totalRevenue ?? 0);
  };

  // 세션 저장소에 마지막 성공 데이터를 저장 (다음 방문 시 즉시 화면에 보여주기 위함)
  const saveToSession = (data: any, logsData: LogItem[]) => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, logs: logsData }));
    } catch {
      // 저장 실패해도 무시 (기능에 영향 없음)
    }
  };

  const loadFromSession = () => {
    try {
      const cached = sessionStorage.getItem(STORAGE_KEY);
      if (!cached) return false;
      const data = JSON.parse(cached);
      setLogs(data.logs ?? []);
      applyStats(data);
      return true;
    } catch {
      return false;
    }
  };

  const fetchInitial = async (attempt = 1) => {
    if (attempt === 1) {
      setProgress(0);
    }

    const progressTimer = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + Math.random() * 8 : prev));
    }, 400);

    try {
      const res = await fetch(`${GAS_URL}?type=logs`);
      if (!res.ok) throw new Error("응답 실패");
      const data = await res.json();
      const newLogs: LogItem[] = data.logs ?? [];

      setLogs(newLogs);
      applyStats(data);
      saveToSession(data, newLogs);
      lastFetchRef.current = new Date().toISOString();
      setProgress(100);
      clearInterval(progressTimer);
      setTimeout(() => setLoading(false), 300);
    } catch {
      clearInterval(progressTimer);
      if (attempt < 4) {
        setTimeout(() => fetchInitial(attempt + 1), 700);
      } else {
        // 재시도 다 실패해도, 세션에 저장된 이전 값이 있으면 그대로 유지 (화면이 "-"로 깨지지 않음)
        setProgress(100);
        setLoading(false);
      }
    }
  };

  const fetchIncremental = async () => {
    if (!lastFetchRef.current) return;
    setRefreshing(true);
    try {
      const since = encodeURIComponent(lastFetchRef.current);
      const res = await fetch(`${GAS_URL}?type=logs&since=${since}`);
      if (!res.ok) throw new Error("응답 실패");
      const data = await res.json();

      applyStats(data);

      const newLogs: LogItem[] = data.logs ?? [];
      let mergedLogs: LogItem[] = logs;
      if (newLogs.length > 0) {
        const existingCodes = new Set(logs.map((l) => l.code));
        const uniqueNew = newLogs.filter((l) => !existingCodes.has(l.code));
        mergedLogs = [...uniqueNew, ...logs];
        setLogs(mergedLogs);
      }

      saveToSession(data, mergedLogs);
      lastFetchRef.current = new Date().toISOString();
    } catch {
      // 새로고침 실패 시 조용히 무시 (기존 데이터는 그대로 유지)
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // 1) 세션에 저장된 값이 있으면 즉시 화면에 표시 (로딩 화면 없이 바로 보임)
    const hasCache = loadFromSession();
    if (hasCache) {
      setLoading(false);
    } else {
      setLoading(true);
    }
    // 2) 그 사이/이후에도 최신 데이터로 조용히 갱신
    fetchInitial();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const campusMatch =
      tab === "all" || log.campus === (tab === "seoul" ? "서울캠퍼스" : "글로벌캠퍼스");

    const logDate = new Date(log.time);
    const afterStart = !startDate || logDate >= new Date(startDate + "T00:00:00");
    const beforeEnd = !endDate || logDate <= new Date(endDate + "T23:59:59");

    return campusMatch && afterStart && beforeEnd;
  });

  const handleDownloadExcel = () => {
    const rows = filteredLogs.map((log) => ({
      쿠폰번호: log.code,
      캠퍼스: log.campus,
      사용시각: new Date(log.time).toLocaleString("ko-KR"),
      사용기기정보: log.device,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "사용기록");

    const today = new Date().toISOString().slice(0, 10);
    const tabFileName = tab === "all" ? "전체" : tab === "seoul" ? "서울캠퍼스" : "글로벌캠퍼스";
    XLSX.writeFile(workbook, `쿠폰사용기록_${tabFileName}_${today}.xlsx`);
  };

  const currentUsedCount = tab === "all" ? totalCount : tab === "seoul" ? seoulCount : globalCount;
  const currentTodayCount = tab === "all" ? todayCount : tab === "seoul" ? seoulTodayCount : globalTodayCount;
  const currentRevenue = tab === "all" ? totalRevenue : tab === "seoul" ? seoulRevenue : globalRevenue;

  const redemptionRate =
    issuedCount && issuedCount > 0 && currentUsedCount !== null
      ? ((currentUsedCount / issuedCount) * 100).toFixed(1)
      : "-";

  const tabLabel = tab === "all" ? "전체" : tab === "seoul" ? "서울캠퍼스" : "글로벌캠퍼스";

  return (
    <main className="min-h-screen bg-[#FAFAFA] px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <a href="/" className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#1E3A8A]">
            <ArrowLeft className="w-4 h-4" />
            돌아가기
          </a>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchIncremental}
              disabled={loading || refreshing}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1E3A8A] px-3 py-2 disabled:opacity-40"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              새로고침
            </button>
            <button
              onClick={handleDownloadExcel}
              disabled={filteredLogs.length === 0}
              className="flex items-center gap-2 bg-[#1E3A8A] text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-[#1e3a8a]/90 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              엑셀 다운로드
            </button>
          </div>
        </div>

        <h1 className="text-xl font-bold text-[#1E3A8A] mb-4">관리자 페이지</h1>

        <div className="flex gap-2 mb-6 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
          {[
            { key: "all" as Tab, label: "합산" },
            { key: "seoul" as Tab, label: "서울캠퍼스" },
            { key: "global" as Tab, label: "글로벌캠퍼스" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                tab === t.key ? "bg-[#1E3A8A] text-white" : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-2xl font-bold text-[#1E3A8A]">{issuedCount ?? "-"}</p>
            <p className="text-xs text-gray-500 mt-1">쿠폰 발급 수 (전체)</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-2xl font-bold text-[#1E3A8A]">
              {redemptionRate === "-" ? "-" : `${redemptionRate}%`}
            </p>
            <p className="text-xs text-gray-500 mt-1">{tabLabel} 수령률</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-2xl font-bold text-[#1E3A8A]">{currentTodayCount ?? "-"}</p>
            <p className="text-xs text-gray-500 mt-1">{tabLabel} 오늘 사용</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-2xl font-bold text-[#1E3A8A]">{currentUsedCount ?? "-"}</p>
            <p className="text-xs text-gray-500 mt-1">{tabLabel} 사용 건수</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <p className="text-xs text-gray-500 mb-1">{tabLabel} 쿠폰 사용 매출 (구간별 단가 적용)</p>
          <p className="text-2xl font-bold text-[#1E3A8A]">
            {currentRevenue !== null ? `${currentRevenue.toLocaleString()}원` : "-"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <div className="flex items-center gap-2 mb-4 text-gray-500">
            <ListChecks className="w-4 h-4" />
            <span className="text-sm font-medium">{tabLabel} 세부 사용현황</span>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 flex-1"
            />
            <span className="text-gray-400 text-sm">~</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 flex-1"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="text-xs text-gray-400 hover:text-[#1E3A8A] whitespace-nowrap px-2"
              >
                초기화
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-6 px-2">
              <p className="text-sm text-gray-400 text-center mb-3">
                데이터를 불러오는 중... {Math.round(progress)}%
              </p>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#1E3A8A] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">해당 조건의 사용 기록이 없습니다.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredLogs.map((log, idx) => (
                <div key={idx} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-800">{log.code}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {log.campus} · {log.device}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(log.time).toLocaleString("ko-KR")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-[11px] text-red-500 leading-relaxed">
          ※ 유의사항: 커피 가격은 1~800잔 2,500원, 801~999잔 2,400원, 1,000잔 이상 2,300원 구간별 단가로 계산되며,
          서울캠퍼스와 글로벌캠퍼스는 각각 별도로 잔수를 산정합니다.
        </p>
      </div>
    </main>
  );
}