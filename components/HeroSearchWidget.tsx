"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

export function HeroSearchWidget() {
  const router = useRouter();
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [guests, setGuests] = useState("2");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (checkin) params.set("checkin", checkin);
    if (checkout) params.set("checkout", checkout);
    params.set("guests", guests);
    router.push(`/villas?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSearch}
      className="glass-card rounded-2xl px-6 py-5 max-w-2xl w-full mx-auto mt-8 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
    >
      <div className="flex flex-col gap-1 flex-1">
        <label className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/50">Arrivée</label>
        <input
          type="date"
          value={checkin}
          onChange={(e) => setCheckin(e.target.value)}
          className="bg-transparent text-white text-sm min-h-[44px] focus:outline-none border-b border-white/20 focus:border-white transition-colors pb-1"
        />
      </div>
      <div className="hidden sm:block w-[1px] h-10 bg-white/20 self-end mb-1" />
      <div className="flex flex-col gap-1 flex-1">
        <label className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/50">Départ</label>
        <input
          type="date"
          value={checkout}
          onChange={(e) => setCheckout(e.target.value)}
          className="bg-transparent text-white text-sm min-h-[44px] focus:outline-none border-b border-white/20 focus:border-white transition-colors pb-1"
        />
      </div>
      <div className="hidden sm:block w-[1px] h-10 bg-white/20 self-end mb-1" />
      <div className="flex flex-col gap-1 flex-1">
        <label className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/50">Voyageurs</label>
        <select
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          className="bg-transparent text-white text-sm min-h-[44px] focus:outline-none border-b border-white/20 focus:border-white transition-colors pb-1 cursor-pointer"
        >
          {[1,2,3,4,5,6,7,8,9,10].map(n => (
            <option key={n} value={n} className="bg-black text-white">{n} {n === 1 ? "voyageur" : "voyageurs"}</option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        className="tap-target flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-black transition-all hover:bg-white/90 sm:ml-2"
      >
        <Search size={14} />
        Rechercher
      </button>
    </form>
  );
}
