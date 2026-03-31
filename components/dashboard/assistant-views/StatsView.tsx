"use client";

import { TrendingUp, Activity, AlertCircle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function StatsView({ data }: { data: any }) {
  // Use V2 metrics if available
  const metrics = data?.metrics || {};
  const insights = data?.insights || {};

  const kpiList = [
    { 
      label: "Chiffre d'Affaires", 
      value: `€${Number(metrics.totalRevenue || 0).toLocaleString()}`, 
      color: "text-gold" 
    },
    { 
      label: "Taux d'Occupation", 
      value: `${metrics.occupancyRate || "0"}%`, 
      color: "text-white" 
    },
    { 
      label: "RevPAR (30j)", 
      value: `€${metrics.revPAR || "0"}`, 
      color: "text-white" 
    },
    { 
      label: "Nuits Vendues", 
      value: metrics.bookedNights || 0, 
      color: "text-white" 
    },
  ];

  const chartData = data?.charts?.monthlyRevenue || [
    { month: 'Jan', revenue: 4000 },
    { month: 'Fev', revenue: 3000 },
    { month: 'Mar', revenue: 2000 },
    { month: 'Avr', revenue: 2780 },
    { month: 'Mai', revenue: 1890 },
    { month: 'Juin', revenue: 2390 },
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-3xl text-white">Analyse Business V2</h3>
          <p className="text-white/40 text-sm">Directeur de Stratégie IA actif</p>
        </div>
        <div className="rounded-2xl bg-gold/10 px-4 py-2 border border-gold/20 text-xs font-bold uppercase tracking-widest text-gold flex items-center gap-2">
          <Activity size={14} className="animate-pulse" /> Strategic Mode
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiList.map((kpi, i) => (
          <div key={i} className="rounded-3xl bg-[#0D0D14] border border-white/5 p-6 hover:border-white/10 transition-all">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">{kpi.label}</p>
            <p className={`text-2xl font-display ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {insights?.underperformingVillas?.length > 0 && (
        <div className="rounded-3xl bg-rose-500/5 border border-rose-500/10 p-6">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-4 flex items-center gap-2">
            <AlertCircle size={14} /> Villas sous-performantes
          </h4>
          <div className="grid gap-3">
            {insights.underperformingVillas.map((v: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs py-2 border-b border-white/5 last:border-0">
                <span className="font-bold text-white/80">{v.name}</span>
                <span className="text-white/40">{v.bookings} réservations</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-[40px] bg-[#0D0D14] border border-white/5 p-10 h-[400px] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <TrendingUp size={120} className="text-gold" />
        </div>
        <h4 className="text-xs font-bold uppercase tracking-widest text-gold mb-10 flex items-center gap-2">
          <TrendingUp size={14} /> Performance Mensuelle
        </h4>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#ffffff40'}} />
            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#ffffff40'}} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0D0D14', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', color: '#fff' }}
              itemStyle={{ color: '#D4AF37' }}
            />
            <Area type="monotone" dataKey="revenue" stroke="#D4AF37" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
