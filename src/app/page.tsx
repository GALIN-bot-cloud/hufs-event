"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, AlertTriangle, ArrowRight } from "lucide-react";
import CoffeeBean from "./components/CoffeeBean";
import clsx from "clsx";
import Image from "next/image";

type ResultState =
  | { type: "idle" }
  | { type: "valid"; code: string }
  | { type: "used"; code: string }
  | { type: "invalid"; code: string }
  | { type: "error"; code: string };

const GAS_URL = process.env.NEXT_PUBLIC_GAS_WEB_APP_URL as string;

function getDeviceInfo() {
  if (typeof window === "undefined") return "알 수 없음";
  const ua = navigator.userAgent;
  let os = "알 수 없음";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/iPhone|iPad/i.test(ua)) os = "iPhone/iPad";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Macintosh/i.test(ua)) os = "Mac";

  let browser = "알 수 없음";
  if (/Chrome/i.test(ua)) browser = "Chrome";
  else if (/Safari/i.test(ua)) browser = "Safari";
  else if (/Firefox/i.test(ua)) browser = "Firefox";
  else if (/Edg/i.test(ua)) browser = "Edge";

  return `${os} / ${browser}`;
}

export default function Home() {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<ResultState>({ type: "idle" });
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setResult({ type: "idle" });

    try {
      const res = await fetch(GAS_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          code: code.trim(),
          deviceInfo: getDeviceInfo(),
        }),
      });
      const data = await res.json();

      if (data.status === "valid") {
        setResult({ type: "valid", code });
      } else if (data.status === "used") {
        setResult({ type: "used", code });
      } else if (data.status === "invalid") {
        setResult({ type: "invalid", code });
      } else {
        setResult({ type: "error", code });
      }
    } catch {
      setResult({ type: "error", code });
    } finally {
      setLoading(false);
      setCode("");
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA] flex flex-col items-center px-4 py-12 relative overflow-hidden">
      <CoffeeBean className="absolute top-8 left-10 w-8 h-8 text-[#1E3A8A]/10 floating-icon-slow" />
<CoffeeBean className="absolute top-6 right-16 w-6 h-6 text-[#1E3A8A]/10 floating-icon-medium" />
<CoffeeBean className="absolute bottom-56 right-6 w-9 h-9 text-[#1E3A8A]/10 floating-icon-slow" />
<CoffeeBean className="absolute bottom-14 left-16 w-7 h-7 text-[#1E3A8A]/10 floating-icon-slow" />
<CoffeeBean className="absolute bottom-4 right-24 w-6 h-6 text-[#1E3A8A]/10 floating-icon-medium" />
      <div className="w-full max-w-xl">
        <div className="flex flex-col items-center text-center gap-4 mb-6">
  <Image src="/mebookie.png" alt="프로모션 캐릭터" width={500} height={500} className="shrink-0 object-contain w-40 sm:w-[200px]" style={{ height: "auto" }} />
  <div className="min-w-0">
    <h1 className="text-xl sm:text-2xl font-bold text-[#1E3A8A]" style={{ fontFamily: "var(--font-title)" }}>메가스터디교육 미북 × 한국외대 프로모션</h1>
    <p className="text-base sm:text-lg font-semibold text-gray-700 mt-1">아메리카노 무료 증정 쿠폰번호 조회 페이지</p>
    <p className="text-sm text-gray-500 mt-3 leading-relaxed">한국외대 프로모션 대상자의 쿠폰을 확인하고<br />무료 증정 여부를 확인해 주세요.</p>
  </div>
</div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-600 mb-2">쿠폰번호</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCheck()}
            placeholder="예: HUFS-0001"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-lg tracking-wide focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:border-transparent mb-3"
          />
          <button
            onClick={handleCheck}
            disabled={loading || !code.trim()}
            className={clsx(
              "w-full rounded-xl py-3 font-semibold text-white transition",
              loading || !code.trim() ? "bg-gray-300 cursor-not-allowed" : "bg-[#1E3A8A] hover:bg-[#1e3a8a]/90"
            )}
          >
            {loading ? "확인 중..." : "확인하기"}
          </button>
        </div>

        {result.type !== "idle" && (
          <div
            className={clsx(
              "rounded-2xl p-4 mb-4 flex items-center gap-3 border",
              result.type === "valid" && "bg-green-50 border-green-200 text-green-700",
              result.type === "used" && "bg-amber-50 border-amber-200 text-amber-700",
              (result.type === "invalid" || result.type === "error") && "bg-red-50 border-red-200 text-red-700"
            )}
          >
            {result.type === "valid" && <CheckCircle2 className="w-5 h-5 shrink-0" />}
            {result.type === "used" && <AlertTriangle className="w-5 h-5 shrink-0" />}
            {(result.type === "invalid" || result.type === "error") && <XCircle className="w-5 h-5 shrink-0" />}
            <span className="font-medium">
              {result.type === "valid" && "사용 가능한 코드입니다."}
              {result.type === "used" && "이미 사용된 코드입니다."}
              {result.type === "invalid" && "존재하지 않는 코드입니다."}
              {result.type === "error" && "확인 중 오류가 발생했습니다. 다시 시도해주세요."}
            </span>
          </div>
        )}

        <div className="flex justify-center mt-6">
          <a href="/admin" className="inline-flex items-center gap-1.5 bg-[#1E3A8A] text-white text-sm font-semibold px-4 py-2 rounded-full shadow-sm hover:bg-[#1e3a8a]/90 transition">관리자 페이지 바로가기<ArrowRight className="w-3.5 h-3.5" /></a>
        </div>
      </div>
    </main>
  );
}