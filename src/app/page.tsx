"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Activity, MapPin, Package, Star, Calendar, Clock, CloudRain, CarFront, Truck, Warehouse, CheckCircle2, AlertTriangle, AlertCircle, XCircle } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function DeliveryRiskDashboard() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Options state
  const [options, setOptions] = useState({
    weather: ["Sunny", "Rainy", "Cloudy", "Snow"],
    traffic: ["Low", "Medium", "High"],
    vehicle: ["motorcycle", "scooter", "electric_scooter", "bicycle"],
    area: ["Urban", "Suburban", "Metropolitan", "Semi-Urban"],
    categories: ["Electronics", "Clothing", "Food", "Groceries", "Medicine", "Documents"]
  })

  // Form State
  const [form, setForm] = useState({
    agent_age: 28,
    agent_rating: 4.5,
    store_lat: 40.7128,
    store_lon: -74.0060,
    drop_lat: 40.7306,
    drop_lon: -73.9866,
    order_hour: 14,
    order_day: "Mon",
    order_month: 4,
    order_day_num: 15,
    weather: "Sunny",
    traffic: "Medium",
    vehicle: "motorcycle",
    area: "Urban",
    category: "Electronics",
    warehouse_processing_min: 15,
    orders_per_hour: 5
  })

  useEffect(() => {
    // Try fetch options
    fetch(`${API_URL}/options`)
      .then(res => res.json())
      .then(data => {
        if(data && Object.keys(data).length > 0) {
          setOptions(prev => ({...prev, ...data}))
        }
      })
      .catch((e) => {
        console.warn("API not available for options, using defaults.")
      })
  }, [])

  const handlePredict = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      
      if(!res.ok) throw new Error("API request failed")
      const data = await res.json()
      setResult(data)
    } catch(e) {
      setError("Unable to reach prediction API.")
      // Mock result for demonstration if API fails
      setTimeout(() => {
        setResult({
          prediction: "AT-RISK", // ON-TIME, AT-RISK, DELAYED
          confidence: 76.5,
          probabilities: {
            "ON-TIME": 12.0,
            "AT-RISK": 76.5,
            "DELAYED": 11.5
          },
          message: "Potential traffic delays observed in routing.",
          metadata: {
            distance_km: "4.2",
            time_of_day: "Afternoon",
            peak_hour: true,
            weekend: false
          }
        })
        setLoading(false)
        setError(null)
      }, 1000)
      return
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-amazon-orange selection:text-white pb-20">
      {/* Toast Notification */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#141414]/90 backdrop-blur-xl border border-amazon-orange text-amazon-orange px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 shadow-orange-500/20 shadow-lg"
          >
            <AlertTriangle className="w-4 h-4" />
            {error} (Simulating result...)
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-black/50 backdrop-blur-xl border-b border-white/8">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">
              DRA <span className="border-b-2 border-amazon-orange ml-0.5"></span>
            </h1>
            <span className="text-xs text-white/50 tracking-wide uppercase mt-1 hidden sm:inline-block">
              Delivery Risk Analysis
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/8 rounded-full px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amazon-orange opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amazon-orange"></span>
            </span>
            <span className="text-xs font-medium tracking-wide">API Live</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column - Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#0d0d0d]/80 backdrop-blur-xl border border-white/8 rounded-3xl p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-amazon-orange/10 p-2 rounded-xl text-amazon-orange">
                <Package className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-semibold tracking-tight">New Delivery</h2>
            </div>

            <div className="space-y-8">
              
              {/* Agent Section */}
              <section>
                <div className="flex justify-between items-end mb-4">
                  <h3 className="text-sm font-medium text-white/60 uppercase tracking-widest flex items-center gap-2">
                    Agent
                  </h3>
                  <div className="text-right flex gap-4 text-sm font-medium">
                    <span>{form.agent_age} yrs</span>
                    <span className="text-amazon-orange capitalize">{form.agent_rating} ★</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div>
                    <label className="text-xs text-white/40 mb-2 block">Age</label>
                    <Slider 
                      defaultValue={[form.agent_age]} max={65} min={18} step={1}
                      onValueChange={(val) => setForm({...form, agent_age: val[0]})}
                      className="[&_[role=slider]]:bg-amazon-orange [&_[role=slider]]:border-amazon-orange [&>.relative]:bg-white/20 [&_.absolute]:bg-amazon-orange"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-2 block">Rating</label>
                    <div className="flex justify-between gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                          key={star}
                          onClick={() => setForm({...form, agent_rating: star})}
                          className={`flex-1 py-1 rounded-xl flex justify-center items-center transition-all ${
                            form.agent_rating >= star ? 'bg-amazon-orange/20 text-amazon-orange' : 'bg-white/5 text-white/20'
                          }`}
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Conditions Section */}
              <section>
                <h3 className="text-sm font-medium text-white/60 uppercase tracking-widest mb-4">Conditions</h3>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {options.weather.map(w => (
                      <button key={w} onClick={() => setForm({...form, weather: w})}
                        className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${form.weather === w ? 'bg-amazon-blue text-white shadow-blue-500/20 shadow-lg border border-amazon-blue' : 'bg-white/5 text-white/60 border border-white/5 hover:bg-white/10'}`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {options.traffic.map(t => {
                      const colorClass = t === 'High' ? 'bg-red-500/20 text-red-400 border-red-500/30' : t === 'Medium' ? 'bg-amazon-orange/20 text-amazon-orange border-amazon-orange/30' : 'bg-green-500/20 text-green-400 border-green-500/30';
                      return (
                      <button key={t} onClick={() => setForm({...form, traffic: t})}
                        className={`py-3 rounded-2xl text-xs font-medium transition-all border ${form.traffic === t ? colorClass : 'bg-white/5 text-white/40 border-white/5 hover:bg-white/10'}`}
                      >
                        {t} Traffic
                      </button>
                    )})}
                  </div>
                </div>
              </section>

              {/* Context Section */}
              <section>
                <h3 className="text-sm font-medium text-white/60 uppercase tracking-widest mb-4">Context</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                      <label className="text-xs text-white/40 mb-3 block">Time of Day ({form.order_hour}:00)</label>
                      <Slider 
                        defaultValue={[form.order_hour]} max={23} min={0} step={1}
                        onValueChange={(val) => setForm({...form, order_hour: val[0]})}
                        className="[&_[role=slider]]:bg-amazon-blue [&_[role=slider]]:border-amazon-blue [&>.relative]:bg-white/20 [&_.absolute]:bg-amazon-blue"
                      />
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex gap-2 overflow-x-auto no-scrollbar">
                      {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => (
                        <button key={day} onClick={() => setForm({...form, order_day: day})}
                          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium transition-all ${form.order_day === day ? 'bg-white text-black' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                        >
                          {day[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Location Area & Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar flex gap-2">
                       {options.area.map(a => (
                        <button key={a} onClick={() => setForm({...form, area: a})}
                          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${form.area === a ? 'bg-amazon-orange text-black border-amazon-orange' : 'bg-white/5 text-white/60 border-white/5 hover:bg-white/10'}`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar flex gap-2">
                       {options.categories.map(c => (
                        <button key={c} onClick={() => setForm({...form, category: c})}
                          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${form.category === c ? 'bg-amazon-blue text-white border-amazon-blue shadow-[0_0_15px_rgba(20,110,180,0.4)]' : 'bg-white/5 text-white/60 border-white/5 hover:bg-white/10'}`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              {/* Operations Section */}
              <section>
                <div className="flex justify-between items-end mb-4">
                  <h3 className="text-sm font-medium text-white/60 uppercase tracking-widest flex items-center gap-2">
                    Operations
                  </h3>
                  <div className="text-right flex gap-4 text-sm font-medium">
                    <span>{form.warehouse_processing_min} min</span>
                    <span className="text-amazon-orange uppercase">{form.orders_per_hour} ord/hr</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div>
                    <label className="text-xs text-white/40 mb-2 block">Warehouse Processing (Min)</label>
                    <Slider 
                      defaultValue={[form.warehouse_processing_min]} max={120} min={1} step={1}
                      onValueChange={(val) => setForm({...form, warehouse_processing_min: val[0]})}
                      className="[&_[role=slider]]:bg-white [&_[role=slider]]:border-white [&>.relative]:bg-white/20 [&_.absolute]:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/40 mb-2 block">Orders Per Hour</label>
                    <Slider 
                      defaultValue={[form.orders_per_hour]} max={30} min={1} step={1}
                      onValueChange={(val) => setForm({...form, orders_per_hour: val[0]})}
                      className="[&_[role=slider]]:bg-amazon-orange [&_[role=slider]]:border-amazon-orange [&>.relative]:bg-white/20 [&_.absolute]:bg-amazon-orange"
                    />
                  </div>
                </div>
              </section>

              {/* Submit Button */}
              <div className="pt-4">
                <Button 
                  onClick={handlePredict}
                  disabled={loading}
                  className="w-full h-14 rounded-full bg-gradient-to-r from-[#FF9900] to-[#e47911] hover:to-[#FF9900] text-black font-bold text-lg shadow-[0_0_20px_rgba(255,153,0,0.3)] hover:shadow-[0_0_30px_rgba(255,153,0,0.5)] transition-all border-none"
                >
                  {loading ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 1 }} className="mr-2">
                      <Activity className="w-5 h-5" />
                    </motion.div>
                  ) : "Analyse Risk"}
                </Button>
              </div>

            </div>
          </div>
        </div>

        {/* Right Column - Output */}
        <div className="lg:col-span-5 sticky top-24">
          <div className="bg-[#0d0d0d]/80 backdrop-blur-xl border border-white/8 rounded-3xl p-6 sm:p-8 min-h-[500px] flex flex-col relative overflow-hidden">
            
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-semibold tracking-tight text-white/80">Analysis</h2>
              {result && (
                <span className="text-xs font-medium text-white/40 uppercase tracking-widest">{new Date().toLocaleTimeString()}</span>
              )}
            </div>

            {!result && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                <Activity className="w-16 h-16 text-white/20 mb-4" />
                <p className="text-sm text-white/60">Submit a delivery to see risk analysis</p>
              </div>
            )}

            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} 
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-32 h-32 rounded-full border-4 border-white/10 border-t-amazon-orange flex items-center justify-center animate-spin"
                >
                </motion.div>
                <div className="space-y-3 w-full max-w-[200px]">
                  <div className="h-2 bg-white/10 rounded-full w-full animate-pulse"></div>
                  <div className="h-2 bg-white/10 rounded-full w-4/5 mx-auto animate-pulse"></div>
                </div>
              </div>
            )}

            <AnimatePresence>
              {result && !loading && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 flex flex-col"
                >
                  {/* Giant Risk Badge */}
                  <div className="flex justify-center mb-10">
                    <div className={`px-6 py-2 rounded-full border flex items-center gap-2 ${
                      result.prediction === 'ON-TIME' ? 'bg-green-500/10 border-green-500/30 text-green-400 shadow-[0_0_30px_rgba(34,197,94,0.2)]' :
                      result.prediction === 'DELAYED' ? 'bg-red-500/10 border-red-500/30 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]' :
                      'bg-amazon-orange/10 border-amazon-orange/30 text-amazon-orange shadow-[0_0_30px_rgba(255,153,0,0.2)]'
                    }`}>
                      {result.prediction === 'ON-TIME' ? <CheckCircle2 className="w-5 h-5" /> : 
                       result.prediction === 'DELAYED' ? <XCircle className="w-5 h-5" /> : 
                       <AlertCircle className="w-5 h-5" />}
                      <span className="text-xl font-bold tracking-widest">{result.prediction}</span>
                    </div>
                  </div>

                  {/* SVG Arc Meter */}
                  <div className="relative flex justify-center mb-8">
                    <svg className="w-48 h-24 overflow-visible" viewBox="0 0 100 50">
                      <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" strokeLinecap="round" />
                      <motion.path 
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: result.confidence / 100 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        d="M 10 50 A 40 40 0 0 1 90 50" 
                        fill="none" 
                        stroke={result.prediction === 'ON-TIME' ? '#22c55e' : result.prediction === 'DELAYED' ? '#ef4444' : '#FF9900'} 
                        strokeWidth="8" 
                        strokeLinecap="round" 
                        className="drop-shadow-lg"
                      />
                    </svg>
                    <div className="absolute bottom-0 flex flex-col items-center">
                      <span className="text-3xl font-bold tracking-tighter">{result.confidence}<span className="text-sm opacity-50">%</span></span>
                      <span className="text-xs text-white/40 uppercase tracking-widest mt-1">Confidence</span>
                    </div>
                  </div>

                  {/* Probabilities Breakdown */}
                  <div className="space-y-4 mb-8">
                    <h3 className="text-xs font-medium text-white/40 uppercase tracking-widest mb-2">Class Probability</h3>
                    {Object.entries(result.probabilities).map(([key, value]) => (
                      <div key={key} className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-white/80">{key}</span>
                          <span className="text-white/50">{value as number}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${value}%` }}
                            transition={{ duration: 1, delay: 0.5 }}
                            className={`h-full rounded-full ${
                              key === 'ON-TIME' ? 'bg-green-500' : 
                              key === 'DELAYED' ? 'bg-red-500' : 'bg-amazon-orange'
                            }`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message */}
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 mb-6">
                    <p className="text-sm text-white/70 italic font-light tracking-wide flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-white/40 mt-0.5 shrink-0" />
                      {result.message}
                    </p>
                  </div>

                  {/* Metadata Row */}
                  <div className="grid grid-cols-2 gap-3 mt-auto">
                    <div className="bg-black/30 p-3 rounded-xl border border-white/5 flex flex-col">
                      <span className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Distance</span>
                      <span className="text-sm font-medium">{result.metadata.distance_km} km</span>
                    </div>
                    <div className="bg-black/30 p-3 rounded-xl border border-white/5 flex flex-col items-start">
                      <span className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Conditions</span>
                      <div className="flex gap-2 mt-auto">
                        {result.metadata.peak_hour && <span className="bg-amazon-blue/20 text-amazon-blue px-2 py-0.5 rounded text-[10px] font-medium border border-amazon-blue/30">PEAK</span>}
                        {result.metadata.weekend && <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-[10px] font-medium border border-purple-500/30">WKND</span>}
                      </div>
                    </div>
                  </div>

                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

      </main>
    </div>
  )
}
