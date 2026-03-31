"use client";

import Image from "next/image";
import { MapPin, Users, Star, ArrowRight, LayoutGrid } from "lucide-react";

export function VillasView({ data }: { data: any }) {
  const villas = data?.rawVillas || [];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-3xl text-white">Parc Immobilier</h3>
          <p className="text-white/40 text-sm">{villas.length} propriétés sous gestion</p>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-gold border border-white/10">
          <LayoutGrid size={24} />
        </div>
      </div>

      <div className="grid gap-6">
        {villas.map((villa: any, i: number) => (
          <div 
            key={i} 
            className="group relative flex items-center gap-8 rounded-[32px] bg-[#0D0D14] border border-white/5 p-6 hover:border-gold/30 hover:bg-white/[0.02] transition-all cursor-pointer"
          >
            <div className="relative h-32 w-48 overflow-hidden rounded-2xl shadow-2xl">
              <Image 
                src={villa.image_url || "/villa-hero.jpg"} 
                alt={villa.name} 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-bold text-white group-hover:text-gold transition-colors">{villa.name}</h4>
                <div className="flex gap-2">
                  <span className={`rounded-full px-3 py-1 text-[8px] font-bold uppercase tracking-widest ${
                    villa.is_published ? "bg-emerald-500/10 text-emerald-500" : "bg-white/10 text-white/40"
                  }`}>
                    {villa.is_published ? "En ligne" : "Brouillon"}
                  </span>
                  {/* Underperforming Alert */}
                  {data?.insights?.underperformingVillas?.find((uv: any) => uv.id === villa.id) && (
                    <span className="rounded-full px-3 py-1 text-[8px] font-bold uppercase tracking-widest bg-rose-500/10 text-rose-500 border border-rose-500/20">
                      Baisse Performance
                    </span>
                  )}
                  {villa.is_published && !data?.insights?.underperformingVillas?.find((uv: any) => uv.id === villa.id) && (
                    <span className="rounded-full px-3 py-1 text-[8px] font-bold uppercase tracking-widest bg-gold/10 text-gold border border-gold/20">
                      Score: 94%
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-6 text-xs text-white/40 font-medium">
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-gold" />
                  {villa.location}
                </div>
                <div className="flex items-center gap-1.5">
                  <Users size={14} className="text-gold" />
                  {villa.capacity} voyageurs
                </div>
                <div className="flex items-center gap-1.5 text-white/80 font-bold">
                  €{villa.price_per_night}<span className="text-white/20 font-normal">/nuit</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {(villa.amenities || []).slice(0, 4).map((a: string, idx: number) => (
                  <span key={idx} className="rounded-lg bg-white/5 px-2 py-1 text-[9px] text-white/30 border border-white/5">
                    {a}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-white/20 group-hover:bg-gold group-hover:text-navy transition-all">
              <ArrowRight size={20} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
