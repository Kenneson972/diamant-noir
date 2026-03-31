"use client";

import { useState } from "react";
import { Share, Heart, ChevronDown, ChevronUp, DoorOpen, CalendarDays, Award } from "lucide-react";

const getShareUrl = (path: string) => {
  if (typeof window !== "undefined") return window.location.origin + path;
  return "";
};

export const VillaHeaderActions = ({ villaName, villaId }: { villaName: string; villaId: string }) => {
  const [isSaved, setIsSaved] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const path = `/villas/${villaId}`;
  const shareUrl = getShareUrl(path);
  const encodedUrl = encodeURIComponent(shareUrl);
  const text = encodeURIComponent(`${villaName} — Diamant Noir`);
  const whatsappUrl = `https://wa.me/?text=${text}%20${encodedUrl}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <button
          onClick={() => setShareOpen(!shareOpen)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-navy hover:bg-navy/5 transition-colors underline"
        >
          <Share size={16} />
          Partager
        </button>
        {shareOpen && (
          <div className="absolute right-0 top-full mt-1 z-10 bg-white border border-navy/10 rounded-lg shadow-lg py-2 min-w-[180px]">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-2 text-sm text-navy hover:bg-navy/5"
            >
              WhatsApp
            </a>
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-2 text-sm text-navy hover:bg-navy/5"
            >
              Facebook
            </a>
          </div>
        )}
      </div>
      <button
        onClick={() => setIsSaved(!isSaved)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-navy hover:bg-navy/5 transition-colors underline"
      >
        <Heart size={16} className={isSaved ? "fill-red-500 text-red-500" : ""} />
        {isSaved ? "Enregistré" : "Enregistrer"}
      </button>
    </div>
  );
};

export const VillaHighlights = () => {
  const highlights = [
    {
      icon: <DoorOpen className="text-navy" size={24} />,
      title: "Arrivée autonome",
      description: "Vous pouvez entrer dans les lieux avec une boîte à clé sécurisée."
    },
    {
      icon: <Award className="text-navy" size={24} />,
      title: "Julian est Superhôte",
      description: "Les Superhôtes sont des hôtes expérimentés qui bénéficient de très bonnes évaluations."
    },
    {
      icon: <CalendarDays className="text-navy" size={24} />,
      title: "Annulation gratuite avant le 1er février",
      description: "Profitez d'une flexibilité totale pour votre voyage."
    }
  ];

  return (
    <div className="space-y-6 py-8 border-b border-navy/10">
      {highlights.map((h, i) => (
        <div key={i} className="flex gap-4">
          <div className="mt-1">{h.icon}</div>
          <div>
            <h4 className="font-semibold text-navy">{h.title}</h4>
            <p className="text-sm text-navy/60">{h.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export const ExpandableDescription = ({ text }: { text: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = text.length > 300;
  const displayText = isExpanded ? text : text.slice(0, 300) + (shouldTruncate ? "..." : "");

  return (
    <div className="space-y-4">
      <p className="text-navy/70 leading-relaxed whitespace-pre-line">
        {displayText}
      </p>
      {shouldTruncate && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 font-semibold underline text-navy"
        >
          {isExpanded ? "Afficher moins" : "En savoir plus"}
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      )}
    </div>
  );
};
