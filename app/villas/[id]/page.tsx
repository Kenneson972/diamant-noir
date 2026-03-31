import Image from "next/image";
import Link from "next/link";
import { BookingForm } from "@/components/BookingForm";
import { Check, Wifi, Wind, Waves, Coffee, Shield, Bed, ShieldCheck, User } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { VillaGallery } from "@/components/VillaGallery";
import { VillaHeaderActions, ExpandableDescription } from "@/components/VillaInteractions";
import { AvailabilityCalendar } from "@/components/booking/AvailabilityCalendar";
import { VillaViewTracker } from "@/components/VillaViewTracker";
import { PriceDisplay } from "@/components/PriceDisplay";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const supabase = getSupabaseServer();
    const { data } = await supabase
      .from("villas")
      .select("name, description, image_url, image_urls, is_published")
      .eq("id", id)
      .single();
    if (!data || data.is_published === false) return { title: "Villa" };
    const image = data.image_url || (Array.isArray(data.image_urls) && data.image_urls[0]) || null;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "";
    return {
      title: `${data.name} — Diamant Noir`,
      description: (data.description || "").slice(0, 160),
      openGraph: image && baseUrl
        ? { images: [{ url: image.startsWith("http") ? image : `${baseUrl}${image}` }] }
        : undefined,
    };
  } catch {
    return { title: "Villa — Diamant Noir" };
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
  name: "Villa Diamant Noir",
  location: "Le Diamant, Martinique",
  description:
    "Sur les hauteurs du sud caraïbe, Diamant Noir mêle modernité et nature tropicale. Volumes épurés, baies vitrées sur l’océan, espace extérieur et piscine invitent au calme — à deux pas du Rocher du Diamant et des plages du sud de la Martinique.",
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

const getIcon = (amenity: string) => {
  const a = amenity.toLowerCase();
  if (a.includes("wifi")) return <Wifi size={18} strokeWidth={1} />;
  if (a.includes("climatisation") || a.includes("clim")) return <Wind size={18} strokeWidth={1} />;
  if (a.includes("piscine")) return <Waves size={18} strokeWidth={1} />;
  if (a.includes("café") || a.includes("café")) return <Coffee size={18} strokeWidth={1} />;
  if (a.includes("mer") || a.includes("vue")) return <Waves size={18} strokeWidth={1} />;
  if (a.includes("chef") || a.includes("cuisine")) return <Shield size={18} strokeWidth={1} />;
  return <Check size={18} strokeWidth={1} />;
};

export default async function VillaDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  noStore();
  let villa: VillaDetails | null = null;
  let recommendedVillas: RecommendedVilla[] = [];

  try {
    const supabase = getSupabaseServer();
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
    } else {
      // Ne pas afficher de villa fallback si l'ID n'existe pas en base
      notFound();
    }

    if (!recommendationsResult.error && recommendationsResult.data) {
      recommendedVillas = recommendationsResult.data.filter((v) => v.is_published) as RecommendedVilla[];
    }
  } catch (error) {
    console.error("Supabase fetch error (villa details):", error);
    notFound();
  }

  return (
    <main className="min-h-screen bg-offwhite">
      <VillaViewTracker villaId={villa!.id} />
 

      {/* ── Galerie plein largeur ── */}
      <div className="pt-16 md:pt-20">
        <VillaGallery images={villa!.images} title={villa!.name} />
      </div>

      {/* ── Titre & Localisation ── */}
      <div className="mx-auto max-w-7xl px-6 pt-10 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="h-px w-6 bg-gold" />
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-navy/40">
                {villa!.location || "Martinique"}
              </p>
            </div>
            <h1 className="font-display text-4xl md:text-5xl text-navy">
              {villa!.name}
            </h1>
            <div className="flex items-center gap-3 mt-4 text-sm text-navy/60 font-medium">
              <span>{villa!.capacity} voyageurs</span>
              <span>·</span>
              <span>{villa!.rooms?.length || 4} chambres</span>
              <span>·</span>
              <span>{villa!.bathrooms_count || villa!.rooms?.length || 4} salles de bain</span>
              <span>·</span>
              <span>{villa!.surface_m2 || 250} m²</span>
            </div>
          </div>
          <div className="pb-1">
            <VillaHeaderActions villaName={villa!.name} villaId={villa!.id} />
          </div>
        </div>
      </div>

      {/* ── Contenu principal ── */}
      <div className="mx-auto max-w-7xl px-6 pb-28 pt-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_380px] items-start">
          
          {/* ── Colonne gauche ── */}
          <div className="space-y-16">
            
            {/* Description */}
            <section className="space-y-8">
              <div className="pt-2">
                <ExpandableDescription text={villa.description || "Description à venir pour cette villa d'exception."} />
              </div>
            </section>

            {/* Hôte */}
            <section className="pt-10 border-t border-navy/10">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold">
                  <User size={20} />
                </div>
                <div>
                  <h3 className="font-display text-xl text-navy">Votre hôte</h3>
                  <p className="text-sm text-navy/70 mt-1">
                    Conciergerie Diamant Noir
                  </p>
                  <p className="text-sm text-navy/55 mt-2 leading-relaxed">
                    Équipe locale dédiée, disponible avant et pendant le séjour pour organiser votre expérience sur mesure.
                  </p>
                </div>
              </div>
            </section>

            {/* Les Incontournables */}
            {villa.amenities && villa.amenities.length > 0 && (
              <section className="pt-10 border-t border-navy/10">
                <h2 className="font-display font-normal text-2xl text-navy mb-8">Les incontournables</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {villa.amenities.slice(0, 8).map((item: string, i: number) => (
                    <div key={i} className="flex flex-col gap-3">
                      <div className="text-navy">{getIcon(item)}</div>
                      <span className="text-navy/80 text-sm font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Découvrez les chambres */}
            {villa.rooms && villa.rooms.length > 0 && (
              <section className="pt-10 border-t border-navy/10">
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

            {/* Tous les équipements */}
            <section className="pt-10 border-t border-navy/10">
              <h2 className="font-display font-normal text-2xl text-navy mb-8">Tous les équipements</h2>
              <div className="grid gap-8 md:grid-cols-2">
                <div>
                  <h3 className="font-display text-lg text-navy mb-4">Intérieur</h3>
                  <div className="space-y-2 text-sm text-navy/70">
                    {(villa.equipment_interior?.length ? villa.equipment_interior : villa.amenities || []).map((item, index) => (
                      <p key={`eq-int-${index}`} className="flex items-center gap-2">
                        <span className="text-gold">•</span>
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-display text-lg text-navy mb-4">Extérieur</h3>
                  <div className="space-y-2 text-sm text-navy/70">
                    {(villa.equipment_exterior?.length ? villa.equipment_exterior : villa.amenities || []).map((item, index) => (
                      <p key={`eq-ext-${index}`} className="flex items-center gap-2">
                        <span className="text-gold">•</span>
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Services inclus */}
            <section className="pt-10 border-t border-navy/10">
              <h2 className="font-display font-normal text-2xl text-navy mb-8">Services inclus</h2>
              {!!villa.included_services_home?.length && (
                <>
                  <h3 className="font-display text-lg text-navy mb-4">Services de la maison</h3>
                  <div className="space-y-3 text-sm text-navy/70 mb-8">
                    {villa.included_services_home.map((service, index) => (
                      <div key={`home-${index}`} className="flex items-center gap-3">
                        <Check size={18} className="text-gold" />
                        {service}
                      </div>
                    ))}
                  </div>
                </>
              )}

              <h3 className="font-display text-lg text-navy mb-4">Services de conciergerie inclus</h3>
              <div className="space-y-3 text-sm text-navy/70">
                {(villa.included_services_collection?.length
                  ? villa.included_services_collection
                  : [
                      "Concierge dédié avant et pendant votre séjour",
                      "Accueil personnalisé à la villa",
                      "Ménage en cours et en fin de séjour",
                      "Indispensables du quotidien fournis",
                    ]).map((service, index) => (
                  <div key={`collection-${index}`} className="flex items-center gap-3">
                    <Check size={18} className="text-gold" />
                    {service}
                  </div>
                ))}
              </div>

              <h3 className="font-display text-lg text-navy mt-10 mb-6">Services à la carte</h3>
              <p className="text-sm text-navy/60 mb-6">Composez votre séjour parmi l’ensemble de nos services sur mesure.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-navy/70">
                {(villa.a_la_carte_services?.length
                  ? villa.a_la_carte_services
                  : [
                      "Transfert aéroport",
                      "Chef à domicile",
                      "Location de bateau",
                      "Location de voiture",
                      "Soins & massages",
                      "Courses à l'arrivée",
                    ]).map((service, index) => (
                  <div key={`a-la-carte-${index}`} className="flex items-center gap-2">• {service}</div>
                ))}
              </div>
            </section>

            {/* Calendrier (large) */}
            <section className="pt-10 border-t border-navy/10">
              <h2 className="font-display font-normal text-2xl text-navy mb-6">Disponibilités</h2>
              <div className="rounded-2xl border border-navy/10 bg-white p-5 sm:p-7">
                <div className="mb-5 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 font-semibold text-navy">
                    Arrivée: {villa.check_in_time || "17:00"}
                  </span>
                  <span className="rounded-full border border-navy/20 bg-offwhite px-3 py-1 font-semibold text-navy/80">
                    Départ: {villa.check_out_time || "10:00"}
                  </span>
                </div>
                <AvailabilityCalendar villaId={villa.id} />
              </div>
            </section>

            {/* Carte */}
            {(villa.map_embed_url || (villa.latitude != null && villa.longitude != null)) && (
              <section className="pt-10 border-t border-navy/10">
                <h2 className="font-display font-normal text-2xl text-navy mb-6">Les alentours</h2>
                <div className="mb-6 grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-navy/40 mb-2">Environnement</p>
                    <p className="text-sm text-navy/70">{villa.environment || "En dehors de la ville"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-navy/40 mb-2">À proximité</p>
                    <div className="flex flex-wrap gap-2">
                      {(villa.nearby_points?.length
                        ? villa.nearby_points
                        : ["Plage", "Restaurants et bars", "Commerces"]).map((point, index) => (
                        <span key={`near-${index}`} className="rounded-full border border-navy/10 px-3 py-1 text-xs text-navy/70">
                          {point}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="overflow-hidden border border-navy/10 aspect-[16/7] bg-navy/5">
                  <iframe
                    src={villa.map_embed_url || `https://www.google.com/maps?q=${villa.latitude},${villa.longitude}&z=15&output=embed`}
                    title="Carte"
                    className="w-full h-full"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </section>
            )}

            {/* Informations complémentaires */}
            <section className="pt-10 border-t border-navy/10">
              <h2 className="font-display font-normal text-2xl text-navy mb-8">Informations complémentaires</h2>
              <div className="grid sm:grid-cols-2 gap-10">
                <div>
                  <h4 className="font-bold text-navy text-sm mb-4 uppercase tracking-wider">Check-in / Check-out</h4>
                  <ul className="space-y-2 text-navy/60 text-sm">
                    <li className="flex justify-between border-b border-navy/5 pb-2">
                      <span>Check-in</span>
                      <span>{villa.check_in_time || "17:00"}</span>
                    </li>
                    <li className="flex justify-between border-b border-navy/5 pb-2">
                      <span>Check-out</span>
                      <span>{villa.check_out_time || "10:00"}</span>
                    </li>
                  </ul>
                </div>

                {villa.house_rules && villa.house_rules !== "" && (
                  <div>
                    <h4 className="font-bold text-navy text-sm mb-4 uppercase tracking-wider">Règlement</h4>
                    <p className="text-navy/60 text-sm leading-relaxed whitespace-pre-line">{villa.house_rules}</p>
                  </div>
                )}
                {villa.cancellation_policy && villa.cancellation_policy !== "" && (
                  <div>
                    <h4 className="font-bold text-navy text-sm mb-4 uppercase tracking-wider">Annulation</h4>
                    <p className="text-navy/60 text-sm leading-relaxed whitespace-pre-line">{villa.cancellation_policy}</p>
                  </div>
                )}
                {villa.safety_info && villa.safety_info !== "" && (
                  <div>
                    <h4 className="font-bold text-navy text-sm mb-4 uppercase tracking-wider">Sécurité</h4>
                    <p className="text-navy/60 text-sm leading-relaxed whitespace-pre-line">{villa.safety_info}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Conditions de réservation */}
            <section className="pt-10 border-t border-navy/10">
              <h2 className="font-display font-normal text-2xl text-navy mb-8">Conditions de réservation</h2>
              <div className="space-y-6">
                {(villa.booking_terms?.length
                  ? villa.booking_terms
                  : [
                      {
                        question: "Comment fonctionne la réservation ?",
                        answer:
                          "Choisissez votre propriété, confirmez la disponibilité avec notre équipe, puis validez votre réservation avec un acompte.",
                      },
                      {
                        question: "Comment se déroule le paiement ?",
                        answer:
                          "Un acompte est demandé pour confirmer la réservation. Le solde est réglé avant l'arrivée selon les modalités de votre contrat.",
                      },
                      {
                        question: "Quelles sont les conditions d'annulation ?",
                        answer:
                          "Les conditions varient selon la villa et la période. Consultez la politique d'annulation affichée et votre contrat.",
                      },
                    ]).map((term, index) => (
                  <div key={`term-${index}`} className="rounded-2xl border border-navy/10 bg-white p-5">
                    <h4 className="font-bold text-navy text-sm mb-2">{term.question}</h4>
                    <p className="text-sm text-navy/60 leading-relaxed">{term.answer}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Questions */}
            <section className="pt-10 border-t border-navy/10">
              <div className="rounded-2xl border border-gold/25 bg-gold/[0.03] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                  <h3 className="font-display text-2xl text-navy">Des questions à propos de {villa.name} ?</h3>
                  <p className="text-sm text-navy/60 mt-2">
                    Planifiez un appel avec notre équipe pour préparer un séjour entièrement sur mesure.
                  </p>
                </div>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-none border border-navy/20 px-6 py-3 text-[10px] font-bold uppercase tracking-[0.25em] text-navy hover:border-navy transition-colors"
                >
                  Planifier un appel
                </Link>
              </div>
            </section>
          </div>

          {/* ── Colonne droite — Booking Sticky ── */}
          <div className="relative hidden lg:block">
            <div className="sticky top-28 space-y-6">
      <div className="bg-white rounded-2xl border border-navy/10 shadow-2xl shadow-navy/5 p-6">
        <BookingForm
          villaId={villa.id}
          basePrice={villa.price}
          capacity={villa.capacity}
          checkInTime={villa.check_in_time || "17:00"}
          checkOutTime={villa.check_out_time || "10:00"}
        />
      </div>
              
              <div className="p-6 bg-navy/5 rounded-2xl flex flex-col items-center text-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold">
                  <ShieldCheck size={20} />
                </div>
                <h4 className="font-display text-lg text-navy">L'Excellence Diamant Noir</h4>
                <p className="text-xs text-navy/60 leading-relaxed">
                  Cette maison fait partie de notre collection exclusive. Elle a été inspectée en personne par nos équipes pour garantir des standards hôteliers de très haut niveau.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

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
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-navy/40">{item.location || "Martinique"}</p>
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

      {/* ── CTA bas de page ── */}
      <div className="bg-navy py-20 text-center px-6">
        <div className="mx-auto max-w-xl space-y-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-gold">Diamant Noir</p>
          <h3 className="font-display text-4xl text-white">Prêt pour l'exception ?</h3>
          <p className="text-white/50 leading-relaxed">Contactez notre équipe de conciergerie pour organiser votre séjour.</p>
          <Link
            href="/contact"
            className="inline-block rounded-none border border-gold/50 px-10 py-4 text-[10px] font-bold uppercase tracking-[0.3em] text-gold hover:bg-gold hover:text-navy transition-all duration-300"
          >
            Contacter la conciergerie
          </Link>
        </div>
      </div>
    </main>
  );
}
