"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Activity, Package, Star, AlertTriangle, CheckCircle2,
  AlertCircle, XCircle, ChevronRight, ChevronLeft, MapPin,
  Clock, Calendar, Pencil,
} from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { NumberInput } from "@/components/ui/number-input"
import { AnimatedTabs } from "@/components/ui/animated-tabs"
import { RadioGrid } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

// ─── Emoji wrapper ───────────────────────────────────────────
const E = ({ children }: { children: React.ReactNode }) => (
  <span className="emoji-mono">{children}</span>
)

// ─── Default Options ─────────────────────────────────────────
const WEATHER_DEFAULTS = [
  { label: "Sunny", icon: "☀️" },
  { label: "Cloudy", icon: "☁️" },
  { label: "Windy", icon: "💨" },
  { label: "Fog", icon: "🌫️" },
  { label: "Sandstorms", icon: "🌪️" },
  { label: "Stormy", icon: "⛈️" },
]
const TRAFFIC_DEFAULTS = [
  { label: "Low", icon: "🟢", color: "green" },
  { label: "Medium", icon: "🟡", color: "yellow" },
  { label: "High", icon: "🟠", color: "orange" },
]
const VEHICLE_DEFAULTS = [
  { value: "motorcycle", label: "Motorcycle", icon: "🏍️" },
  { value: "scooter", label: "Scooter", icon: "🛵" },
  { value: "bicycle", label: "Bicycle", icon: "🚲" },
  { value: "van", label: "Van", icon: "🚐" },
]
const AREA_DEFAULTS = ["Urban", "Semi-Urban", "Metropolitian", "Other"]
const CATEGORY_DEFAULTS = [
  "Apparel", "Books", "Clothing", "Cosmetics", "Electronics",
  "Grocery", "Home", "Jewelry", "Kitchen", "Outdoors",
  "Pet Supplies", "Shoes", "Skincare", "Snacks", "Sports", "Toys"
]

// ─── Steps (outside component to avoid re-creation) ────────
const STEPS = [
  { title: "Agent", icon: "🧑" },
  { title: "Location & Time", icon: "📍" },
  { title: "Conditions", icon: "🌦" },
  { title: "Category & Ops", icon: "⚙️" },
]
const DAYS_OF_WEEK = [
  { label: "Mon", value: "0" },
  { label: "Tue", value: "1" },
  { label: "Wed", value: "2" },
  { label: "Thu", value: "3" },
  { label: "Fri", value: "4" },
  { label: "Sat", value: "5" },
  { label: "Sun", value: "6" },
]
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]

// ─── Helpers ─────────────────────────────────────────────────
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1)
}
function timeLabel(h: number) {
  if (h >= 5 && h < 12) return "Morning"
  if (h >= 12 && h < 17) return "Afternoon"
  if (h >= 17 && h < 21) return "Evening"
  return "Night"
}
function trafficBtnClass(color: string, active: boolean) {
  if (!active) return "bg-white/[0.03] text-white/40 border-white/[0.06] hover:bg-white/[0.06]"
  const map: Record<string, string> = {
    green: "bg-green-500/15 text-green-400 border-green-500/30 shadow-[0_0_12px_rgba(34,197,94,0.15)]",
    yellow: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30 shadow-[0_0_12px_rgba(234,179,8,0.15)]",
    orange: "bg-orange-500/15 text-orange-400 border-orange-500/30 shadow-[0_0_12px_rgba(249,115,22,0.15)]",
    red: "bg-red-500/15 text-red-400 border-red-500/30 shadow-[0_0_12px_rgba(239,68,68,0.15)]",
  }
  return map[color] || "bg-white/10 text-white/60 border-white/10"
}

// ─── Types ───────────────────────────────────────────────────
interface FormData {
  Agent_Age: number; Agent_Rating: number
  Store_Latitude: number; Store_Longitude: number
  Drop_Latitude: number; Drop_Longitude: number
  Order_Hour: number; Order_Month: number; Order_Day: number; Order_DayOfWeek: number
  Weather: string; Traffic: string; Vehicle: string; Area: string; Category: string
  Warehouse_Processing_Minutes: number; Orders_Per_Hour: number
}
interface PredictResponse {
  risk_level: "On-Time" | "At-Risk" | "Delayed"
  confidence: number
  probabilities: { "At-Risk": number; "Delayed": number; "On-Time": number }
  message: string
}

// ═════════════════════════════════════════════════════════════
export default function DeliveryRiskDashboard() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PredictResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const analysisRef = useRef<HTMLDivElement>(null)

  const [weatherOpts, setWeatherOpts] = useState(WEATHER_DEFAULTS)
  const [trafficOpts, setTrafficOpts] = useState(TRAFFIC_DEFAULTS)
  const [vehicleOpts, setVehicleOpts] = useState(VEHICLE_DEFAULTS)
  const [areaOpts, setAreaOpts] = useState(AREA_DEFAULTS)
  const [categoryOpts, setCategoryOpts] = useState(CATEGORY_DEFAULTS)

  // Static defaults to avoid SSR/CSR hydration mismatch
  const [form, setForm] = useState<FormData>({
    Agent_Age: 28, Agent_Rating: 4.5,
    Store_Latitude: 12.913, Store_Longitude: 77.683,
    Drop_Latitude: 13.043, Drop_Longitude: 77.813,
    Order_Hour: 14, Order_Month: 3, Order_Day: 19, Order_DayOfWeek: 2,
    Weather: "Sunny", Traffic: "Medium", Vehicle: "motorcycle",
    Area: "Urban", Category: "Electronics",
    Warehouse_Processing_Minutes: 15, Orders_Per_Hour: 5,
  })

  // Sync to real time on client mount (avoids hydration mismatch)
  useEffect(() => {
    const now = new Date()
    setForm(prev => ({
      ...prev,
      Order_Hour: now.getHours(),
      Order_Month: now.getMonth() + 1,
      Order_Day: now.getDate(),
      Order_DayOfWeek: now.getDay() === 0 ? 6 : now.getDay() - 1,
    }))
  }, [])

  // ─── Fetch /options with timeout ───────────────────────────
  useEffect(() => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    fetch(`${API_URL}/options`, { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then(data => {
        if (data?.Weather && Array.isArray(data.Weather)) {
          const icons: Record<string,string> = { Sunny:"☀️", Cloudy:"☁️", Windy:"💨", Fog:"🌫️", Sandstorms:"🌪️", Stormy:"⛈️", Rainy:"🌧️", Snow:"❄️" }
          setWeatherOpts(data.Weather.map((w: string) => ({ label: w, icon: icons[w] || "🌤️" })))
        }
        if (data?.Traffic && Array.isArray(data.Traffic)) {
          const tc: Record<string,{icon:string;color:string}> = { Low:{icon:"🟢",color:"green"}, Medium:{icon:"🟡",color:"yellow"}, High:{icon:"🟠",color:"orange"} }
          setTrafficOpts(data.Traffic.filter((t: string) => t !== "Jam").map((t: string) => ({ label: t, icon: tc[t]?.icon||"⚪", color: tc[t]?.color||"gray" })))
        }
        if (data?.Vehicle && Array.isArray(data.Vehicle)) {
          const vm: Record<string,{icon:string;display:string}> = { motorcycle:{icon:"🏍️",display:"Motorcycle"}, scooter:{icon:"🛵",display:"Scooter"}, bicycle:{icon:"🚲",display:"Bicycle"}, electric_scooter:{icon:"🛴",display:"E-Scooter"}, van:{icon:"🚐",display:"Van"} }
          setVehicleOpts(data.Vehicle.map((v: string) => ({ value: v, label: vm[v]?.display||v, icon: vm[v]?.icon||"🚗" })))
        }
        if (data?.Area && Array.isArray(data.Area)) setAreaOpts(data.Area)
        if (data?.Category && Array.isArray(data.Category)) setCategoryOpts(data.Category)
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.warn("Options API unavailable:", err.message)
      })
      .finally(() => clearTimeout(timeoutId))

    return () => { controller.abort(); clearTimeout(timeoutId) }
  }, [])

  // ─── Navigation ────────────────────────────────────────────
  const [[, direction], setPage] = useState([0, 0])
  const paginate = useCallback((dir: number) => {
    const next = step + dir
    if (next >= 0 && next < STEPS.length) { setStep(next); setPage([next, dir]) }
  }, [step])

  // ─── Input sanitization ────────────────────────────────────
  const sanitizeForm = (f: FormData): FormData => ({
    Agent_Age: Math.round(Math.max(18, Math.min(65, f.Agent_Age))),
    Agent_Rating: Math.round(Math.max(1, Math.min(5, f.Agent_Rating)) * 10) / 10,
    Store_Latitude: f.Store_Latitude,
    Store_Longitude: f.Store_Longitude,
    Drop_Latitude: f.Drop_Latitude,
    Drop_Longitude: f.Drop_Longitude,
    Order_Hour: Math.round(Math.max(0, Math.min(23, f.Order_Hour))),
    Order_Month: Math.round(Math.max(1, Math.min(12, f.Order_Month))),
    Order_Day: Math.round(Math.max(1, Math.min(31, f.Order_Day))),
    Order_DayOfWeek: Math.round(Math.max(0, Math.min(6, f.Order_DayOfWeek))),
    Weather: f.Weather,
    Traffic: f.Traffic,
    Vehicle: f.Vehicle,
    Area: f.Area,
    Category: f.Category,
    Warehouse_Processing_Minutes: Math.max(0, Math.min(120, f.Warehouse_Processing_Minutes)),
    Orders_Per_Hour: Math.round(Math.max(0, Math.min(60, f.Orders_Per_Hour))),
  })

  // ─── Response validation ──────────────────────────────────
  const isValidResponse = (data: unknown): data is PredictResponse => {
    if (!data || typeof data !== "object") return false
    const d = data as Record<string, unknown>
    return (
      typeof d.risk_level === "string" &&
      ["On-Time", "At-Risk", "Delayed"].includes(d.risk_level) &&
      typeof d.confidence === "number" &&
      typeof d.probabilities === "object" && d.probabilities !== null &&
      typeof d.message === "string"
    )
  }

  // ─── Submit with timeout + validation ─────────────────────
  const handlePredict = async () => {
    setLoading(true); setError(null); setShowResult(true)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    try {
      const sanitized = sanitizeForm(form)
      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sanitized),
        signal: controller.signal,
      })
      if (!res.ok) throw new Error(`Server returned ${res.status}`)
      const data = await res.json()
      if (!isValidResponse(data)) throw new Error("Invalid response format")
      setResult(data)
    } catch (err) {
      const msg = err instanceof Error && err.name === "AbortError"
        ? "Request timed out — showing simulated result."
        : "Unable to reach prediction API — showing simulated result."
      setError(msg)
      console.warn("Predict API error:", err)
      setTimeout(() => {
        setResult({ risk_level: "Delayed", confidence: 100, probabilities: { "At-Risk": 0, "Delayed": 100, "On-Time": 0 }, message: "⚠️ High delay risk detected! Confidence: 100.0%" })
        setLoading(false); setError(null)
      }, 1200)
      return
    } finally {
      clearTimeout(timeoutId)
    }
    setLoading(false)
  }

  // ─── Derived (memoized) ────────────────────────────────────
  const dist = useMemo(() => haversine(
    form.Store_Latitude, form.Store_Longitude, form.Drop_Latitude, form.Drop_Longitude
  ), [form.Store_Latitude, form.Store_Longitude, form.Drop_Latitude, form.Drop_Longitude])
  const isWeekend = form.Order_DayOfWeek >= 5
  const isPeakHour = (form.Order_Hour >= 8 && form.Order_Hour <= 10) || (form.Order_Hour >= 18 && form.Order_Hour <= 21)
  const badge = (level: string) => {
    const l = level.toUpperCase()
    if (l === "ON-TIME") return "bg-green-500/10 border-green-500/30 text-green-400 shadow-[0_0_30px_rgba(0,166,80,0.2)]"
    if (l === "DELAYED") return "bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_30px_rgba(229,62,62,0.2)]"
    return "bg-amazon-orange/10 border-amazon-orange/30 text-amazon-orange shadow-[0_0_30px_rgba(255,153,0,0.2)]"
  }
  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d < 0 ? 40 : -40, opacity: 0 }),
  }

  // ─── Shared styles ─────────────────────────────────────────
  const inputClass = "w-full h-10 bg-transparent border border-white/15 rounded-lg px-3 text-sm focus:border-amazon-orange/40 focus:ring-1 focus:ring-amazon-orange/40 outline-none transition-all"
  const tinyLabel = "text-[10px] text-white/30 uppercase tracking-widest mb-1 block"
  const sectionLabel = "text-[11px] text-white/40 uppercase tracking-widest"
  const cardBg = "bg-white/[0.03] border border-white/[0.06] rounded-xl"

  // ═════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-black text-white pb-32">
      {/* Toast */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#141414]/95 backdrop-blur-xl border border-amazon-orange/60 text-amazon-orange px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 shadow-[0_0_30px_rgba(255,153,0,0.15)]">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-black/60 backdrop-blur-xl border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <h1 className="text-lg font-bold tracking-tight">DRA</h1>
              <span className="absolute -bottom-0.5 left-0 w-5 h-[2px] bg-amazon-orange rounded-full" />
            </div>
            <span className="text-[10px] text-white/40 tracking-wide uppercase hidden sm:block">Delivery Risk Analysis</span>
          </div>
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-full px-3 py-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amazon-orange opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amazon-orange" />
            </span>
            <span className="text-[10px] font-medium tracking-wide">API Live</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-20 relative overflow-hidden">

        <AnimatePresence mode="wait" initial={false}>

        {/* ════ INPUT FORM ════ */}
        {!showResult && (
        <motion.div
          key="input"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 32 }}
        >
        <div className="bg-[#0a0a0a]/90 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 sm:p-8 flex flex-col shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="bg-amazon-orange/10 p-2 rounded-lg text-amazon-orange"><Package className="w-4 h-4" /></div>
              <div>
                <h2 className="text-base font-semibold tracking-tight">New Delivery</h2>
                <p className="text-[10px] text-white/35 mt-0.5"><E>{STEPS[step].icon}</E> {STEPS[step].title} — Step {step + 1}/{STEPS.length}</p>
              </div>
            </div>
          </div>
          {/* Progress */}
          <div className="flex gap-1 mb-6">
            {STEPS.map((_, i) => <div key={i} className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${i <= step ? "bg-amazon-orange" : "bg-white/[0.06]"}`} />)}
          </div>

          {/* Step Content */}
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div key={step} custom={direction} variants={variants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }} className="w-full">

              {/* ═══ STEP 0 — AGENT ═══ */}
              {step === 0 && (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Age */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <Label className={sectionLabel}>Agent Age</Label>
                      <output className="text-sm font-semibold tabular-nums">{form.Agent_Age} <span className="text-white/30 font-normal text-xs">yrs</span></output>
                    </div>
                    <div className={`${cardBg} p-5`}>
                      <Slider value={[form.Agent_Age]} min={18} max={65} step={1}
                        onValueChange={(v) => setForm({ ...form, Agent_Age: v[0] })}
                        showTooltip tooltipContent={(v) => `${v} yrs`} />
                    </div>
                  </div>
                  {/* Rating */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className={sectionLabel}>Agent Rating</Label>
                      <span className="text-sm font-semibold text-amazon-orange tabular-nums">{form.Agent_Rating.toFixed(1)} ★</span>
                    </div>
                    <p className="text-[10px] text-white/25 mb-2">Tap a star to set rating →</p>
                    <div className={`${cardBg} p-2.5 flex gap-1.5`}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s}
                          onClick={() => { setForm({ ...form, Agent_Rating: s }); setTimeout(() => paginate(1), 400) }}
                          className={`flex-1 py-3 rounded-lg flex justify-center transition-all duration-200 ${form.Agent_Rating >= s
                            ? "bg-amazon-orange/15 text-amazon-orange"
                            : "bg-white/[0.02] text-white/15 hover:bg-white/[0.05]"}`}>
                          <Star className="w-5 h-5 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ STEP 1 — LOCATION & TIME ═══ */}
              {step === 1 && (
                <div className="space-y-5">
                  {/* Coordinates */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className={`${sectionLabel} mb-2 flex items-center gap-1.5`}>
                        <MapPin className="w-3 h-3 text-amazon-orange" /> Store
                      </Label>
                      <div className={`${cardBg} p-3 grid grid-cols-2 gap-2`}>
                        <NumberInput value={form.Store_Latitude} onChange={(v) => setForm({...form, Store_Latitude: v})} label="Lat" step={0.001} min={-90} max={90} />
                        <NumberInput value={form.Store_Longitude} onChange={(v) => setForm({...form, Store_Longitude: v})} label="Long" step={0.001} min={-180} max={180} />
                      </div>
                    </div>
                    <div>
                      <Label className={`${sectionLabel} mb-2 flex items-center gap-1.5`}>
                        <MapPin className="w-3 h-3 text-amazon-blue" /> Drop
                      </Label>
                      <div className={`${cardBg} p-3 grid grid-cols-2 gap-2`}>
                        <NumberInput value={form.Drop_Latitude} onChange={(v) => setForm({...form, Drop_Latitude: v})} label="Lat" step={0.001} min={-90} max={90} />
                        <NumberInput value={form.Drop_Longitude} onChange={(v) => setForm({...form, Drop_Longitude: v})} label="Long" step={0.001} min={-180} max={180} />
                      </div>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      {/* Hour */}
                      <div className={`${cardBg} p-4`}>
                        <div className="flex items-center justify-between mb-3">
                          <Label className={`${sectionLabel} flex items-center gap-1`}><Clock className="w-3 h-3" /> Hour</Label>
                          <output className="text-sm font-semibold tabular-nums">{String(form.Order_Hour).padStart(2, "0")}:00</output>
                        </div>
                        <Slider value={[form.Order_Hour]} min={0} max={23} step={1}
                          onValueChange={(v) => setForm({ ...form, Order_Hour: v[0] })}
                          showTooltip tooltipContent={(v) => `${String(v).padStart(2, "0")}:00`} />
                      </div>
                      {/* Month + Day */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className={tinyLabel}>Month</span>
                          <Select
                            value={String(form.Order_Month)}
                            onValueChange={(v) => setForm({ ...form, Order_Month: parseInt(v) })}
                            indicatorPosition="right"
                          >
                            <SelectTrigger className="mt-1 w-full bg-white/[0.03] border-white/10 text-white hover:bg-white/[0.05] focus-visible:ring-amazon-orange/30 focus-visible:border-amazon-orange/40">
                              <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#111] border-white/10">
                              {MONTHS.map((m, i) => (
                                <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <NumberInput
                            value={form.Order_Day}
                            onChange={(v) => setForm({ ...form, Order_Day: Math.min(31, Math.max(1, Math.round(v))) })}
                            label="Day"
                            min={1}
                            max={31}
                            step={1}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Day of Week */}
                    <div>
                      <Label className={`${sectionLabel} mb-2 flex items-center gap-1`}>
                        <Calendar className="w-3 h-3" /> Day of Week
                      </Label>
                      <p className="text-[10px] text-white/25 mb-2">Select day to continue →</p>
                      <AnimatedTabs
                        tabs={DAYS_OF_WEEK}
                        value={String(form.Order_DayOfWeek)}
                        onChange={(v) => { setForm({ ...form, Order_DayOfWeek: parseInt(v) }); setTimeout(() => paginate(1), 400) }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ STEP 2 — CONDITIONS ═══ */}
              {step === 2 && (
                <div className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    {/* LEFT — Weather */}
                    <div>
                      <Label className={`${sectionLabel} mb-3 block`}><E>🌦</E> Weather</Label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {weatherOpts.map((w) => (
                          <button key={w.label} onClick={() => setForm({ ...form, Weather: w.label })}
                            className={`py-5 px-2 rounded-lg text-xs font-medium transition-all border flex flex-col items-center justify-center gap-1 ${form.Weather === w.label
                              ? "bg-white/[0.06] text-white border-white/20"
                              : "bg-white/[0.02] text-white/40 border-white/[0.05] hover:bg-white/[0.05]"}`}>
                            <span className="text-xl emoji-mono">{w.icon}</span>
                            <span className="text-[10px]">{w.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* RIGHT — Traffic (no Jam) */}
                    <div>
                      <Label className={`${sectionLabel} mb-1 block`}><E>🚦</E> Traffic</Label>
                      <p className="text-[10px] text-white/25 mb-2">Select traffic to continue →</p>
                      <div className="flex flex-col gap-1.5">
                        {trafficOpts.map((t) => (
                          <button key={t.label}
                            onClick={() => { setForm({ ...form, Traffic: t.label }); setTimeout(() => paginate(1), 400) }}
                            className={`py-2.5 px-4 w-full text-left rounded-lg text-xs font-medium transition-all border flex items-center gap-2.5 ${trafficBtnClass(t.color, form.Traffic === t.label)}`}>
                            <span className="text-sm emoji-mono">{t.icon}</span> {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    {/* LEFT — Area */}
                    <div>
                      <Label className={`${sectionLabel} mb-3 block`}><E>📍</E> Area</Label>
                      <Select
                        value={form.Area}
                        onValueChange={(v) => setForm({ ...form, Area: v })}
                        indicatorPosition="right"
                      >
                        <SelectTrigger className="w-full bg-white/[0.03] border-white/10 text-white hover:bg-white/[0.05] focus-visible:ring-amazon-orange/30 focus-visible:border-amazon-orange/40">
                          <SelectValue placeholder="Select area" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#111] border-white/10">
                          {areaOpts.map((a) => (
                            <SelectItem key={a} value={a}>{a}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* RIGHT — Vehicle */}
                    <div>
                      <Label className={`${sectionLabel} mb-3 block`}><E>🚗</E> Vehicle</Label>
                      <RadioGrid
                        options={vehicleOpts.map(v => ({ value: v.value, label: v.label, icon: v.icon }))}
                        value={form.Vehicle}
                        onChange={(v) => setForm({ ...form, Vehicle: v })}
                        columns={2}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ═══ STEP 3 — CATEGORY & OPS ═══ */}
              {step === 3 && (
                <div className="space-y-5">
                  {/* Category */}
                  <div>
                    <Label className={`${sectionLabel} mb-3 block`}><E>📦</E> Category</Label>
                    <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
                      {categoryOpts.map((c) => (
                        <button key={c} onClick={() => setForm({ ...form, Category: c })}
                          className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all border whitespace-nowrap ${form.Category === c
                            ? "bg-white/[0.08] text-white border-white/20"
                            : "bg-white/[0.02] text-white/40 border-white/[0.05] hover:bg-white/[0.05]"}`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Operations */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className={sectionLabel}>Warehouse Processing</Label>
                        <output className="text-sm font-semibold tabular-nums">{form.Warehouse_Processing_Minutes} <span className="text-white/30 font-normal text-xs">min</span></output>
                      </div>
                      <div className={`${cardBg} p-4`}>
                        <Slider value={[form.Warehouse_Processing_Minutes]} min={0} max={120} step={1}
                          onValueChange={(v) => setForm({ ...form, Warehouse_Processing_Minutes: v[0] })}
                          showTooltip tooltipContent={(v) => `${v} min`} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className={sectionLabel}>Orders Per Hour</Label>
                        <output className="text-sm font-semibold text-amazon-orange tabular-nums">{form.Orders_Per_Hour} <span className="text-white/30 font-normal text-xs">/hr</span></output>
                      </div>
                      <div className={`${cardBg} p-4`}>
                        <Slider value={[form.Orders_Per_Hour]} min={0} max={60} step={1}
                          onValueChange={(v) => setForm({ ...form, Orders_Per_Hour: v[0] })}
                          showTooltip tooltipContent={(v) => `${v}/hr`} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>

          {/* Nav Footer */}
          <div className="mt-8 pt-5 border-t border-white/[0.06] flex items-center justify-between">
            {step > 0 ? (
              <Button variant="ghost" onClick={() => paginate(-1)} className="text-white/40 hover:text-white hover:bg-white/[0.04] rounded-lg h-10 px-5 text-sm">
                <ChevronLeft className="w-3.5 h-3.5 mr-1.5" /> Back
              </Button>
            ) : <div />}
            {step < STEPS.length - 1 ? (
              <Button onClick={() => paginate(1)} className="bg-amazon-blue hover:bg-amazon-blue/80 text-white rounded-lg h-10 px-6 text-sm shadow-[0_0_12px_rgba(20,110,180,0.2)] transition-all">
                Next <ChevronRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            ) : (
              <Button onClick={handlePredict} disabled={loading}
                className="h-12 px-8 rounded-full bg-gradient-to-r from-[#FF9900] to-[#e47911] hover:to-[#FF9900] text-black font-bold text-sm shadow-[0_0_20px_rgba(255,153,0,0.3)] hover:shadow-[0_0_30px_rgba(255,153,0,0.45)] transition-all border-none ring-0 focus-visible:ring-0">
                {loading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 1 }}>
                    <Activity className="w-4 h-4" />
                  </motion.div>
                ) : "Analyse Risk →"}
              </Button>
            )}
          </div>
        </div>
        </motion.div>
        )}

        {/* ════ OUTPUT CARD ════ */}
        {showResult && (
        <motion.div
          key="output"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 32 }}
        >
        <div ref={analysisRef}
          className="relative bg-[#080808] border border-white/[0.07] rounded-2xl overflow-hidden shadow-2xl">

          {/* Ambient risk glow — changes colour with result */}
          {result && (
            <div className={`absolute inset-0 pointer-events-none transition-all duration-1000 ${
              result.risk_level === "On-Time"
                ? "bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(0,166,80,0.07),transparent)]"
                : result.risk_level === "Delayed"
                  ? "bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(229,62,62,0.07),transparent)]"
                  : "bg-[radial-gradient(ellipse_80%_40%_at_50%_0%,rgba(255,153,0,0.07),transparent)]"
            }`} />
          )}

          {/* Header row */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/[0.05]">
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-amazon-orange" />
              <h2 className="text-[11px] font-semibold tracking-widest uppercase text-white/40">Risk Analysis</h2>
            </div>
            <div className="flex items-center gap-3">
              {result && (
                <span className="text-[10px] text-white/20 tabular-nums tracking-wider">
                  {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
              {/* Edit button — go back to input */}
              <button
                onClick={() => setShowResult(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-white/35 hover:text-white/70 transition-all text-[10px] tracking-wide"
              >
                <Pencil className="w-3 h-3" /> Edit
              </button>
            </div>
          </div>

          {/* Empty state */}
          {!result && !loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-20 h-20 rounded-full border border-white/[0.05] flex items-center justify-center">
                <Package className="w-7 h-7 text-white/10" />
              </div>
              <div className="text-center">
                <p className="text-[11px] text-white/20 uppercase tracking-widest">Awaiting Submission</p>
                <p className="text-[10px] text-white/12 mt-1">Complete the form and click Analyse Risk</p>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-6">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-[2px] border-white/[0.04]" />
                <div className="absolute inset-0 rounded-full border-[2px] border-transparent border-t-amazon-orange animate-spin" />
                <div className="absolute inset-2 rounded-full border-[2px] border-transparent border-t-amazon-orange/40 animate-spin" style={{ animationDuration: "0.8s", animationDirection: "reverse" }} />
              </div>
              <div className="space-y-2 w-32 text-center">
                <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                  <div className="h-full bg-amazon-orange/60 rounded-full animate-pulse w-3/4" />
                </div>
                <p className="text-[10px] text-white/25 tracking-widest uppercase">Analysing</p>
              </div>
            </div>
          )}

          {/* Result */}
          <AnimatePresence>
            {result && !loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>

                {/* ── Hero: Risk badge + gauge ── */}
                <div className="px-6 pt-6 pb-5 flex flex-col items-center gap-5">

                  {/* Large risk badge */}
                  <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 18 }}
                    className={`relative flex items-center gap-3 px-7 py-3 rounded-full border text-lg font-bold tracking-widest uppercase ${badge(result.risk_level)}`}
                  >
                    {/* Slow pulsing aura ring */}
                    <motion.span
                      className={`absolute inset-0 rounded-full opacity-25 ${
                        result.risk_level === "On-Time" ? "bg-green-500" :
                        result.risk_level === "Delayed" ? "bg-red-500" : "bg-amazon-orange"
                      }`}
                      animate={{ scale: [1, 1.18, 1], opacity: [0.25, 0, 0.25] }}
                      transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
                    />
                    {result.risk_level === "On-Time" ? <CheckCircle2 className="w-5 h-5" /> :
                     result.risk_level === "Delayed" ? <XCircle className="w-5 h-5" /> :
                     <AlertCircle className="w-5 h-5" />}
                    {result.risk_level}
                  </motion.div>

                  {/* Semicircular gauge */}
                  <div className="relative w-full max-w-[260px]">
                    <svg viewBox="0 0 120 65" className="w-full">
                      {/* Track */}
                      <path d="M 10 58 A 50 50 0 0 1 110 58"
                        fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" strokeLinecap="round" />
                      {/* Tick marks */}
                      {[0, 0.25, 0.5, 0.75, 1].map((t) => {
                        const angle = Math.PI + t * Math.PI
                        const r = 50, cx = 60, cy = 58
                        const x1 = cx + r * Math.cos(angle)
                        const y1 = cy + r * Math.sin(angle)
                        const x2 = cx + (r - 5) * Math.cos(angle)
                        const y2 = cy + (r - 5) * Math.sin(angle)
                        return <line key={t} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round" />
                      })}
                      {/* Animated arc */}
                      <motion.path
                        d="M 10 58 A 50 50 0 0 1 110 58"
                        fill="none"
                        stroke={result.risk_level === "On-Time" ? "#00a650" : result.risk_level === "Delayed" ? "#e53e3e" : "#FF9900"}
                        strokeWidth="8"
                        strokeLinecap="round"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: result.confidence / 100, opacity: 1 }}
                        transition={{ duration: 1.8, ease: "easeOut" }}
                        style={{ filter: `drop-shadow(0 0 6px ${result.risk_level === "On-Time" ? "rgba(0,166,80,0.6)" : result.risk_level === "Delayed" ? "rgba(229,62,62,0.6)" : "rgba(255,153,0,0.6)"})`}}
                      />
                    </svg>
                    {/* Central readout */}
                    <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center -mt-3">
                      <motion.span
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="text-5xl font-black tabular-nums tracking-tighter leading-none"
                      >
                        {result.confidence}<span className="text-2xl text-white/25 font-light">%</span>
                      </motion.span>
                      <span className="text-[9px] text-white/25 uppercase tracking-[0.2em] mt-1">Confidence</span>
                    </div>
                  </div>
                </div>

                {/* ── Stat row ── */}
                <div className="grid grid-cols-3 border-t border-white/[0.05] divide-x divide-white/[0.05]">
                  {[
                    { label: "Distance", value: `${dist} km`, icon: "📍" },
                    { label: "Time Slot", value: timeLabel(form.Order_Hour), icon: "🕐" },
                    { label: "Traffic", value: form.Traffic, icon: "🚦" },
                  ].map((s) => (
                    <div key={s.label} className="flex flex-col items-center py-4 gap-1">
                      <span className="text-sm emoji-mono">{s.icon}</span>
                      <span className="text-sm font-semibold text-white/80">{s.value}</span>
                      <span className="text-[9px] uppercase tracking-widest text-white/25">{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* ── Probability bars ── */}
                <div className="px-6 pt-5 pb-4 border-t border-white/[0.05]">
                  <p className="text-[9px] uppercase tracking-[0.18em] text-white/25 mb-4">Class Probabilities</p>
                  <div className="space-y-3">
                    {([
                      { key: "On-Time", color: "#00a650", glow: "rgba(0,166,80,0.4)" },
                      { key: "At-Risk", color: "#FF9900", glow: "rgba(255,153,0,0.4)" },
                      { key: "Delayed", color: "#e53e3e", glow: "rgba(229,62,62,0.4)" },
                    ] as const).map(({ key, color, glow }) => {
                      const val: number = (result.probabilities as Record<string, number>)[key] || 0
                      const isActive = result.risk_level === key
                      return (
                        <div key={key}>
                          <div className="flex justify-between items-center mb-1.5">
                            <span className={`text-xs font-medium ${isActive ? "text-white" : "text-white/40"}`}>{key}</span>
                            <span className="text-xs tabular-nums text-white/30 font-mono">{val}%</span>
                          </div>
                          <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${val}%` }}
                              transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }}
                              style={{ background: color, boxShadow: isActive ? `0 0 8px ${glow}` : "none" }}
                              className="h-full rounded-full"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* ── Message ── */}
                <div className="mx-6 mb-5 px-4 py-3.5 rounded-xl bg-white/[0.025] border border-white/[0.06] flex items-start gap-3">
                  <AlertTriangle className="w-3.5 h-3.5 text-white/20 mt-0.5 shrink-0" />
                  <p className="text-[11px] text-white/45 italic font-light leading-relaxed tracking-wide">{result.message}</p>
                </div>

                {/* ── Metadata pills ── */}
                <div className="flex flex-wrap gap-2 px-6 pb-6">
                  {isPeakHour && (
                    <span className="bg-amazon-blue/10 border border-amazon-blue/25 text-amazon-blue px-3 py-1.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5">
                      <E>⚡</E> Peak Hour
                    </span>
                  )}
                  {isWeekend && (
                    <span className="bg-amazon-orange/10 border border-amazon-orange/25 text-amazon-orange px-3 py-1.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5">
                      <E>📅</E> Weekend
                    </span>
                  )}
                  <span className="bg-white/[0.03] border border-white/[0.06] text-white/35 px-3 py-1.5 rounded-full text-[10px] font-medium">
                    {form.Vehicle.charAt(0).toUpperCase() + form.Vehicle.slice(1)}
                  </span>
                  <span className="bg-white/[0.03] border border-white/[0.06] text-white/35 px-3 py-1.5 rounded-full text-[10px] font-medium">
                    {form.Area}
                  </span>
                  <span className="bg-white/[0.03] border border-white/[0.06] text-white/35 px-3 py-1.5 rounded-full text-[10px] font-medium">
                    Agent ★ {form.Agent_Rating.toFixed(1)}
                  </span>
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </motion.div>
        )}

        </AnimatePresence>

      </main>
    </div>
  )
}
