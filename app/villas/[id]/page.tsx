import Image from "next/image";
import Link from "next/link";
import { BookingForm } from "@/components/BookingForm";
import { Check, Wifi, Wind, Waves, Flame, TreePine, Car, Utensils, Tv, Shirt, ChefHat, Ship, Heart, UserCheck, Bed, Zap, Dumbbell, Shield, Key, Plane, ShieldCheck, User } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { VillaGallery } from "@/components/VillaGallery";
import { VillaHeaderActions, ExpandableDescription } from "@/components/VillaInteractions";
import { VillaViewTracker } from "@/components/VillaViewTracker";
import { PriceDisplay } from "@/components/PriceDisplay";
import { BookingBottomSheet } from "@/components/BookingBottomSheet";
import { ConnectedBookingForm, VillaBookingWrapper } from "@/components/villas/VillaBookingWrapper";
import { AvailabilityCalendar } from "@/components/booking/AvailabilityCalendar";
import { VillaAccordionInfo } from "@/components/villas/VillaAccordionInfo";
import { VillaReviews } from "@/components/VillaReviews";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const supabase = await getSupabaseServer();
    const { data } = await supabase
      .from("villas")
      .select("name, description, image_url, image_urls, is_published")
      .eq("id", id)
      .single();
    if (!data || data.is_published === false) return { title: "Villa" };
    const image = data.image_url || (Array.isArray(data.image_urls) && data.image_urls[0]) || null;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    return {
      title: `${data.name} — Kayvila`,
      description: (data.description || "").slice(0, 160),
      openGraph: image && baseUrl
        ? { images: [{ url: image.startsWith("http") ? image : `${baseUrl}${image}` }] }
        : undefined,
    };
  } catch {
    return { title: "Villa — Kayvila" };
  }
}

type VillaDetails = {
  id: string;
  name: string;
  location: string | null;
  description: string | null;
  price: number;
  capacity: number;
  image: string | null;
  images: string[];
  amenities?: string[];
  rooms?: any[];
  cancellation_policy?: string | null;
  house_rules?: string | null;
  safety_info?: string | null;
  bathrooms_count?: number | null;
  surface_m2?: number | null;
  check_in_time?: string | null;
  check_out_time?: string | null;
  environment?: string | null;
  nearby_points?: string[];
  equipment_interior?: string[];
  equipment_exterior?: string[];
  included_services_home?: string[];
  included_services_collection?: string[];
  a_la_carte_services?: string[];
  collection_tier?: "signature" | "iconic";
  booking_terms?: { question: string; answer: string }[];
  latitude?: number | null;
  longitude?: number | null;
  map_embed_url?: string | null;
};

type RecommendedVilla = {
  id: string;
  name: string;
  location: string | null;
  price_per_night: number;
  image_url: string | null;
  image_urls: string[] | null;
  capacity: number | null;
  is_published?: boolean;
};

const fallbackVilla: VillaDetails = {
  id: "fallback",
  name: "Villa Kayvila",
  location: "Le Diamant, Martinique",
  description:
    "Sur les hauteurs du sud caraïbe, Kayvila mêle modernité et nature tropicale. Volumes épurés, baies vitrées sur l'océan, espace extérieur et piscine invitent au calme — à deux pas du Rocher du Diamant et des plages du sud de la Martinique.",
  price: 1000,
  capacity: 8,
  image: "/villa-hero.jpg",
  images: ["/villa-hero.jpg"],
  bathrooms_count: 4,
  surface_m2: 250,
  check_in_time: "17:00",
  check_out_time: "10:00",
  collection_tier: "signature",
  nearby_points: ["Plage", "Restaurants et bars", "Commerces"],
  equipment_interior: [],
  equipment_exterior: [],
  included_services_home: ["Property Manager"],
  included_services_collection: [
    "Concierge dédié avant et pendant votre séjour",
    "Accueil personnalisé",
  ],
  a_la_carte_services: ["Chef à domicile", "Location de bateau", "Babysitter"],
  booking_terms: [],
};

const getEquipmentIcon = (label: string) => {
  const a = label.toLowerCase();
  if (a.includes("wifi")) return <Wifi size={16} strokeWidth={1} />;
  if (a.includes("climatisation") || a.includes("clim")) return <Wind size={16} strokeWidth={1} />;
  if (a.includes("piscine")) return <Waves size={16} strokeWidth={1} />;
  if (a.includes("jacuzzi")) return <Waves size={16} strokeWidth={1} />;
  if (a.includes("barbecue") || a.includes("bbq")) return <Flame size={16} strokeWidth={1} />;
  if (a.includes("jardin") || a.includes("terrasse") || a.includes("extérieur")) return <TreePine size={16} strokeWidth={1} />;
  if (a.includes("parking") || a.includes("garage")) return <Car size={16} strokeWidth={1} />;
  if (a.includes("cuisine") || a.includes("réfrigérateur")) return <Utensils size={16} strokeWidth={1} />;
  if (a.includes("tv") || a.includes("télé") || a.includes("écran")) return <Tv size={16} strokeWidth={1} />;
  if (a.includes("machine à laver") || a.includes("lave-linge")) return <Shirt size={16} strokeWidth={1} />;
  if (a.includes("chef") || a.includes("restauration")) return <ChefHat size={16} strokeWidth={1} />;
  if (a.includes("bateau") || a.includes("nautique") || a.includes("mer") || a.includes("vue") || a.includes("plage")) return <Ship size={16} strokeWidth={1} />;
  if (a.includes("massage") || a.includes("spa") || a.includes("bien-être")) return <Heart size={16} strokeWidth={1} />;
  if (a.includes("concierge") || a.includes("accueil") || a.includes("dédié")) return <UserCheck size={16} strokeWidth={1} />;
  if (a.includes("ménage") || a.includes("draps") || a.includes("serviettes") || a.includes("linge")) return <Bed size={16} strokeWidth={1} />;
  if (a.includes("borne") || a.includes("ev") || a.includes("électrique")) return <Zap size={16} strokeWidth={1} />;
  if (a.includes("salle de sport") || a.includes("fitness") || a.includes("gym")) return <Dumbbell size={16} strokeWidth={1} />;
  if (a.includes("sécurité") || a.includes("alarme") || a.includes("caméra")) return <Shield size={16} strokeWidth={1} />;
  if (a.includes("clé") || a.includes("autonome") || a.includes("self")) return <Key size={16} strokeWidth={1} />;
  if (a.includes("transfert") || a.includes("navette") || a.includes("transport")) return <Plane size={16} strokeWidth={1} />;
  return <Check size={16} strokeWidth={1} />;
};

export default async function VillaDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  noStore();
  let villa: VillaDetails = fallbackVilla;
  let recommendedVillas: RecommendedVilla[] = [];

  try {
    const supabase = await getSupabaseServer();
    const [villaResult, recommendationsResult] = await Promise.all([
      supabase
        .from("villas")
        .select("id,name,location,description,price_per_night,capacity,image_url,image_urls,amenities,rooms_details,is_published,cancellation_policy,house_rules,safety_info,bathrooms_count,surface_m2,check_in_time,check_out_time,environment,nearby_points,equipment_interior,equipment_exterior,included_services_home,included_services_collection,a_la_carte_services,collection_tier,booking_terms,latitude,longitude,map_embed_url")
        .eq("id", id)
        .single(),
      supabase
        .from("villas")
        .select("id,name,location,price_per_night,image_url,image_urls,capacity,is_published")
        .eq("is_published", true)
        .neq("id", id)
        .limit(3),
    ]);

    const { data, error } = villaResult;

    if (!error && data) {
      if (data.is_published === false) notFound();
      villa = {
        id: data.id,
        name: data.name,
        location: data.location,
        description: data.description,
        price: data.price_per_night,
        capacity: data.capacity,
        image: data.image_url || data.image_urls?.[0] || "/villa-hero.jpg",
        images: Array.isArray(data.image_urls) && data.image_urls.length > 0
          ? data.image_urls
          : [data.image_url || "/villa-hero.jpg"],
        amenities: Array.isArray(data.amenities) ? data.amenities : [],
        rooms: Array.isArray(data.rooms_details) ? data.rooms_details : [],
        cancellation_policy: data.cancellation_policy ?? null,
        house_rules: data.house_rules ?? null,
        safety_info: data.safety_info ?? null,
        bathrooms_count: data.bathrooms_count ?? null,
        surface_m2: data.surface_m2 ?? null,
        check_in_time: data.check_in_time ?? null,
        check_out_time: data.check_out_time ?? null,
        environment: data.environment ?? null,
        nearby_points: Array.isArray(data.nearby_points) ? data.nearby_points : [],
        equipment_interior: Array.isArray(data.equipment_interior) ? data.equipment_interior : [],
        equipment_exterior: Array.isArray(data.equipment_exterior) ? data.equipment_exterior : [],
        included_services_home: Array.isArray(data.included_services_home) ? data.included_services_home : [],
        included_services_collection: Array.isArray(data.included_services_collection) ? data.included_services_collection : [],
        a_la_carte_services: Array.isArray(data.a_la_carte_services) ? data.a_la_carte_services : [],
        collection_tier: data.collection_tier === "iconic" ? "iconic" : "signature",
        booking_terms: Array.isArray(data.booking_terms)
          ? data.booking_terms
              .filter((item: any) => item?.question && item?.answer)
              .map((item: any) => ({
                question: String(item.question),
                answer: String(item.answer),
              }))
          : [],
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        map_embed_url: data.map_embed_url ?? null,
      };
    }

    if (!recommendationsResult.error && recommendationsResult.data) {
      recommendedVillas = recommendationsResult.data.filter((v) => v.is_published) as RecommendedVilla[];
    }
  } catch (error) {
    console.error("Supabase fetch error (villa details):", error);
  }

  return (
    <main className="min-h-dvh bg-offwhite pb-24 sm:pb-0">
      <VillaViewTracker villaId={villa.id} />

      {/* ── Galerie plein largeur ── */}
      <div className="pt-16 md:pt-20">
        <VillaGallery images={villa.images} title={villa.name} />
      </div>

      {/* ── Breadcrumb ── */}
      <div className="mx-auto max-w-7xl px-6 pt-10 pb-0">
        <nav aria-label="Fil d'Ariane" className="mb-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em]">
          <Link href="/villas" className="min-h-[44px] flex items-center text-navy/40 hover:text-gold transition-colors duration-300">
            Toutes nos villas
          </Link>
          <span className="text-navy/20" aria-hidden="true">→</span>
          <span className="text-navy/50 min-h-[44px] flex items-center">{villa.name}</span>
        </nav>
      </div>

      {/* ── Titre & Localisation ── */}
      <div className="mx-auto max-w-7xl px-6 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-px w-6 bg-gold" />
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-navy/40">
                {villa.location || "Martinique"}
              </p>
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-navy">
              {villa.name}
            </h1>
            <div className="flex items-center gap-3 mt-4 text-sm text-navy/60 font-medium">
              <span>{villa.capacity} voyageurs</span>
              <span>·</span>
              <span>{villa.rooms?.length || 4} chambres</span>
              <span>·</span>
              <span>{villa.bathrooms_count || villa.rooms?.length || 4} salles de bain</span>
              <span>·</span>
              <span>{villa.surface_m2 || 250} m²</span>
            </div>
          </div>
          <div className="pb-1">
            <VillaHeaderActions villaName={villa.name} villaId={villa.id} />
          </div>
        </div>
      </div>

      {/* ── Contenu principal ── */}
      <VillaBookingWrapper
        villaId={villa.id}
        basePrice={villa.price}
        capacity={villa.capacity}
        checkInTime={villa.check_in_time || "17:00"}
        checkOutTime={villa.check_out_time || "10:00"}
      >
      <div className="mx-auto max-w-7xl px-6 pb-28 pt-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_380px] items-start">
          
          {/* ── Colonne gauche ── */}
          <div className="space-y-12">
            
            {/* 1. Description */}
            <section className="space-y-8">
              <div className="pt-2">
                <ExpandableDescription text={villa.description || "Description à venir pour cette villa d'exception."} />
              </div>
            </section>

            {/* 2. L'expérience Kayvila */}
            <section id="experience" className="pt-10 border-t border-navy/10">
              <h2 className="font-display font-normal text-2xl text-navy mb-8">L'expérience Kayvila</h2>
              <div className="grid sm:grid-cols-2 gap-px bg-navy/8">
                {[
                  { num: "01", title: "Concierge dédié", desc: "Un interlocuteur unique avant et pendant votre séjour pour orchestrer chaque détail." },
                  { num: "02", title: "Accueil personnalisé", desc: "Remise des clés en main propre, visite guidée de la villa et conseils locaux par notre équipe." },
                  { num: "03", title: "Équipe 7j/7", desc: "Réactive et joignable à tout moment — un message, une question, nous sommes là." },
                  { num: "04", title: "Services à la carte", desc: "Chef à domicile, bateau, massage, transfert VIP — composez votre séjour sur mesure." },
                ].map((item) => (
                  <div key={item.num} className="bg-white p-8 flex gap-5">
                    <span className="text-3xl font-light text-gold/25 tabular-nums shrink-0">{item.num}</span>
                    <div>
                      <h3 className="font-bold text-sm text-navy mb-1.5">{item.title}</h3>
                      <p className="text-sm text-navy/55 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Concierge Kayvila */}
            <section id="concierge" className="pt-10 border-t border-navy/10">
              <h2 className="font-display font-normal text-2xl text-navy mb-8">Votre concierge</h2>
              <div className="flex flex-col sm:flex-row gap-6 items-start border border-navy/10 bg-white p-6">
                <div className="w-16 h-16 shrink-0 bg-gold/20 flex items-center justify-center">
                  <User size={28} className="text-gold" strokeWidth={1} />
                </div>
                <div>
                  <h3 className="font-display text-xl text-navy mb-1">L'équipe Kayvila</h3>
                  <p className="text-[11px] text-navy/40 mb-3">Conciergerie · Martinique</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div><span className="block text-navy/40 text-[11px] uppercase tracking-wide">Avis</span><span className="font-semibold text-navy">98% satisfaits</span></div>
                    <div><span className="block text-navy/40 text-[11px] uppercase tracking-wide">Réponse</span><span className="font-semibold text-navy">&lt; 2 heures</span></div>
                    <div><span className="block text-navy/40 text-[11px] uppercase tracking-wide">Expérience</span><span className="font-semibold text-navy">8+ ans</span></div>
                    <div><span className="block text-navy/40 text-[11px] uppercase tracking-wide">Langues</span><span className="font-semibold text-navy">FR · EN · ES</span></div>
                  </div>
                  <p className="mt-4 text-sm text-navy/60 leading-relaxed">
                    Une équipe dédiée, locale et passionnée. Nous connaissons chaque villa, chaque quartier, chaque restaurant — pour vous offrir un séjour fluide, sans surprise, avec la chaleur martiniquaise.
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Les Incontournables */}
            {villa.amenities && villa.amenities.length > 0 && (
              <section id="incontournables" className="pt-10 border-t border-navy/10">
                <h2 className="font-display font-normal text-2xl text-navy mb-8">Les incontournables</h2>
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-6">
                  {villa.amenities.slice(0, 8).map((item: string, i: number) => (
                    <div key={i} className="flex flex-col gap-3">
                      <div className="text-navy">{getEquipmentIcon(item)}</div>
                      <span className="text-navy/80 text-sm font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 4. Avis des voyageurs */}
            <VillaReviews villaId={villa.id} villaName={villa.name} />

            {/* 5. Découvrez les chambres */}
            {villa.rooms && villa.rooms.length > 0 && (
              <section id="chambres" className="pt-10 border-t border-navy/10">
                <h2 className="font-display font-normal text-2xl text-navy mb-8">Découvrez les chambres</h2>
                <div className="space-y-4">
                  {villa.rooms.map((room: any, i: number) => (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-start gap-4 p-6 border border-navy/10 bg-white">
                      <div className="sm:w-1/3">
                        <h4 className="font-bold text-navy text-sm uppercase tracking-wider">{room.title}</h4>
                      </div>
                      <div className="sm:w-2/3 space-y-2">
                        <p className="text-navy/70 text-sm flex items-center gap-2">
                          <Bed size={16} className="text-gold" />
                          {room.description || "1 Lit double King Size"}
                        </p>
                        <p className="text-navy/50 text-sm flex items-center gap-2">
                          <Wind size={16} /> Climatisation
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 6. Disponibilités + Calendrier */}
            <section id="reserver-sejour" className="scroll-mt-28 pt-10 border-t border-navy/10">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display font-normal text-2xl text-navy">Disponibilités</h2>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-none border border-gold/40 bg-gold/10 px-3 py-1 font-semibold text-navy">
                    Arrivée: {villa.check_in_time || "17:00"}
                  </span>
                  <span className="rounded-none border border-navy/20 bg-offwhite px-3 py-1 font-semibold text-navy/80">
                    Départ: {villa.check_out_time || "10:00"}
                  </span>
                </div>
              </div>
              <AvailabilityCalendar villaId={villa.id} />

            </section>

            {/* 7. Les alentours (carte) */}
            {(villa.map_embed_url || (villa.latitude != null && villa.longitude != null)) && (
              <section id="alentours" className="pt-10 border-t border-navy/10">
                <h2 className="font-display font-normal text-2xl text-navy mb-6">Les alentours</h2>
                <div className="mb-6 grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-navy/40 mb-2">Environnement</p>
                    <p className="text-sm text-navy/70">{villa.environment || "En dehors de la ville"}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-navy/40 mb-2">À proximité</p>
                    <div className="flex flex-wrap gap-2">
                      {(villa.nearby_points?.length
                        ? villa.nearby_points
                        : ["Plage", "Restaurants et bars", "Commerces"]).map((point, index) => (
                        <span key={`near-${index}`} className="rounded-none border border-navy/10 px-3 py-1 text-xs text-navy/70">
                          {point}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="relative overflow-hidden border border-navy/10 aspect-[16/7] bg-navy/5 group">
                  <div className="absolute top-3 left-3 z-10">
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-navy/40 bg-white/80 px-3 py-1">
                      Carte interactive
                    </span>
                  </div>
                  <iframe
                    src={villa.map_embed_url || `https://www.google.com/maps?q=${villa.latitude},${villa.longitude}&z=15&output=embed`}
                    title="Carte"
                    className="w-full h-full grayscale-[0.3] contrast-[1.05] transition-all duration-300 group-hover:grayscale-0"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                  <a
                    href={villa.map_embed_url || `https://www.google.com/maps?q=${villa.latitude},${villa.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center bg-navy/0 group-hover:bg-navy/10 transition-all duration-300"
                  >
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 border border-navy/15 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.25em] text-navy">
                      Ouvrir dans Google Maps
                    </span>
                  </a>
                </div>
              </section>
            )}

            {/* 8. Informations complémentaires (accordéon plié) */}
            <VillaAccordionInfo
              checkInTime={villa.check_in_time || "17:00"}
              checkOutTime={villa.check_out_time || "10:00"}
              houseRules={villa.house_rules}
              cancellationPolicy={villa.cancellation_policy}
              safetyInfo={villa.safety_info}
            />


            {/* 9. Questions */}
            <section className="pt-10 border-t border-navy/10">
              <div className="rounded-none border border-gold/25 bg-gold/[0.03] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                  <h3 className="font-display text-2xl text-navy">Des questions à propos de {villa.name} ?</h3>
                  <p className="text-sm text-navy/60 mt-2">
                    Planifiez un appel avec notre équipe pour préparer un séjour entièrement sur mesure.
                  </p>
                </div>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-none border border-navy/20 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.25em] text-navy hover:border-navy transition-colors"
                >
                  Vivre l&apos;expérience Kayvila
                </Link>
              </div>
            </section>
          </div>

          {/* ── Colonne droite — Booking Sticky ── */}
          <div className="relative hidden lg:block">
            <div className="sticky top-28 space-y-6">
              <div className="bg-white rounded-none border border-navy/10 shadow-2xl shadow-navy/5 p-6">
                <ConnectedBookingForm
                  villaId={villa.id}
                  basePrice={villa.price}
                  capacity={villa.capacity}
                  checkInTime={villa.check_in_time || "17:00"}
                  checkOutTime={villa.check_out_time || "10:00"}
                />
              </div>
              
              <div className="p-8 bg-navy/5 rounded-none border border-navy/15 flex flex-col items-center text-center gap-3">
                <div className="w-10 h-10 rounded-none bg-gold/20 flex items-center justify-center text-gold">
                  <ShieldCheck size={20} />
                </div>
                <h4 className="font-display text-lg text-navy">L'Excellence Kayvila</h4>
                <p className="text-xs text-navy/60 leading-relaxed">
                  Cette maison fait partie de notre collection exclusive. Elle a été inspectée en personne par nos équipes pour garantir des standards hôteliers de très haut niveau.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
      </VillaBookingWrapper>

      {/* ── Recommandées ── */}
      {recommendedVillas.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <h3 className="font-display text-3xl text-navy mb-8">Recommandées pour vous</h3>
          <div className="grid gap-6 md:grid-cols-3">
            {recommendedVillas.map((item) => {
              const cardImage = item.image_url || item.image_urls?.[0] || "/villa-hero.jpg";
              return (
                <Link
                  key={item.id}
                  href={`/villas/${item.id}`}
                  className="group overflow-hidden border border-navy/10 bg-white hover:border-gold/40 transition-colors"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={cardImage}
                      alt={item.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-4 space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-navy/40">{item.location || "Martinique"}</p>
                    <p className="font-display text-xl text-navy">{item.name}</p>
                    <p className="text-sm text-navy/60">
                      {item.capacity || 0} voyageurs · <PriceDisplay amount={item.price_per_night} /> / nuit
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Mobile sticky booking bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 sm:hidden border-t border-black/10 bg-white/95 px-4 pt-3 backdrop-blur-none pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-navy/50">À partir de</p>
            <p className="text-base font-semibold text-navy">
              {villa!.price.toLocaleString("fr-FR")} €
              <span className="text-xs font-normal text-navy/50"> / nuit</span>
            </p>
          </div>
          <BookingBottomSheet trigger="Réserver" ariaLabel="Réserver votre séjour">
            <BookingForm
              villaId={villa.id}
              basePrice={villa.price}
              capacity={villa.capacity}
              checkInTime={villa.check_in_time || "17:00"}
              checkOutTime={villa.check_out_time || "10:00"}
            />
          </BookingBottomSheet>
        </div>
      </div>

      {/* ── CTA bas de page ── */}
      <div className="bg-navy py-20 text-center px-6">
        <div className="mx-auto max-w-xl space-y-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.5em] text-gold">Kayvila</p>
          <h3 className="font-display text-4xl text-white">Prêt pour l'exception ?</h3>
          <p className="text-white/50 leading-relaxed">Contactez notre équipe de conciergerie pour organiser votre séjour.</p>
          <Link
            href="/contact"
            className="inline-block rounded-none border border-gold/50 px-10 py-4 text-[11px] font-bold uppercase tracking-[0.3em] text-gold hover:bg-gold hover:text-navy transition-all duration-300"
          >
            Contacter la conciergerie
          </Link>
        </div>
      </div>
    </main>
  );
}
