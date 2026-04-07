"use client"

import { useState, useEffect, useMemo, useRef, ChangeEvent } from "react"
import Link from "next/link"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, LogOut, Settings, Calendar, FileText, ExternalLink, Plus, X, Check, Star, Wifi, Wind, Waves, Coffee, Shield, MapPin, ListChecks, RefreshCw, MoreVertical, Wand2, Trash2, Edit, CheckCircle, XCircle, CreditCard, Link as LinkIcon, Sparkles, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSupabaseBrowser } from "@/lib/supabase"
import { AdminCalendar } from "@/components/AdminCalendar"
import { revalidateVillas } from "@/lib/actions"
import { ActionMenu } from "@/components/dashboard/ActionMenu"
import { PlanningIcalSyncCard } from "@/components/dashboard/villa-editor/PlanningIcalSyncCard"
import { VillaBookingsRegistry } from "@/components/dashboard/villa-editor/VillaBookingsRegistry"
import { VillaPublishChecklist } from "@/components/dashboard/villa-editor/VillaPublishChecklist"
import { IcalConnectivityStatus } from "@/components/dashboard/villa-editor/IcalConnectivityStatus"

// DND Kit
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableImage } from "@/components/dashboard/SortableImage";
import { SUGGESTED_AMENITY_LABELS, SUGGESTED_AMENITY_SET } from "@/lib/villa-amenities-suggested";

function AmenityImportTag({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md bg-emerald-600/12 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-800 ${className}`}
    >
      <Sparkles className="h-2.5 w-2.5 shrink-0" aria-hidden />
      Import
    </span>
  );
}

export default function VillaDashboard() {
  const params = useParams()
  const rawVillaId = params.villaId
  const villaId = Array.isArray(rawVillaId) ? rawVillaId[0] : rawVillaId
  const router = useRouter()
  const supabase = getSupabaseBrowser()
  const [villa, setVilla] = useState<any>(null)
  const [bookings, setBookings] = useState<any[]>([])
  const [icalFeeds, setIcalFeeds] = useState<
    { platform?: string | null; last_synced_at?: string | null; last_error?: string | null; is_active?: boolean | null }[]
  >([])
  const [bookingSearch, setBookingSearch] = useState("")
  const [bookingStatusFilter, setBookingStatusFilter] = useState<"all" | "confirmed" | "pending">("all")
  const [bookingSourceFilter, setBookingSourceFilter] = useState<"all" | "airbnb" | "other">("all")
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [importingAirbnb, setImportingAirbnb] = useState(false)
  const [importUseAi, setImportUseAi] = useState(true)
  const [amenityDraft, setAmenityDraft] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pendingBookingDelete, setPendingBookingDelete] = useState<{ id: string; label: string } | null>(null)
  const [pendingVillaDelete, setPendingVillaDelete] = useState(false)
  const [selectedRange, setSelectedRange] = useState<{ start: string; end: string } | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const bookingDeleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const villaDeleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const maintenanceTaskInputRef = useRef<HTMLInputElement>(null)
  const isNew = villaId === "new"
  const [form, setForm] = useState({
    name: "",
    location: "",
    description: "",
    price_per_night: "",
    capacity: "",
    image_url: "",
    image_urls: [] as string[],
    airbnb_url: "",
    ical_url: "",
    access_token: "",
    is_published: false,
    amenities: [] as string[],
    amenities_import_labels: [] as string[],
    rooms_details: [] as { title: string; description: string }[],
    seasonal_prices: [] as { name: string; start_date: string; end_date: string; price: string }[],
    cancellation_policy: "",
    house_rules: "",
    safety_info: "",
    bathrooms_count: "",
    surface_m2: "",
    check_in_time: "",
    check_out_time: "",
    environment: "",
    nearby_points_text: "",
    equipment_interior_text: "",
    equipment_exterior_text: "",
    included_services_home_text: "",
    included_services_collection_text: "",
    a_la_carte_services_text: "",
    booking_terms_text: "",
    collection_tier: "signature",
    latitude: "",
    longitude: "",
    map_embed_url: "",
  })

  const customAmenityItems = useMemo(
    () => form.amenities.filter((a) => !SUGGESTED_AMENITY_SET.has(a)),
    [form.amenities]
  )

  const contentNavItems = useMemo(
    () =>
      [
        { href: "#content-section-general", label: "Général" },
        { href: "#content-section-public", label: "Fiche publique" },
        { href: "#content-section-amenities", label: "Équipements" },
        { href: "#content-section-rooms", label: "Chambres" },
        { href: "#content-section-media", label: "Médias" },
        { href: "#content-section-import", label: "Import OTA" },
        { href: "#content-section-connectivity", label: "Sync & liens" },
      ] as const,
    []
  )

  useEffect(() => {
    async function checkAuth() {
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push("/login")
        }
      }
    }
    checkAuth()
  }, [supabase, router])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    async function fetchVilla() {
      if (isNew) {
        setVilla({ id: "new", name: "Nouvelle villa" })
        setLoading(false)
        return
      }

      if (!supabase) {
        setError("Supabase non configuré. Vérifie `.env.local` puis redémarre le serveur.")
        setVilla({ id: villaId ?? "unknown", name: "Villa Inconnue" })
        setLoading(false)
        return
      }

      if (!villaId) {
        setError("Identifiant villa manquant.")
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("villas")
        .select("*")
        .eq("id", villaId)
        .single()

      if (error) {
        console.error("Error fetching villa:", error)
        setError(error.message || "Erreur Supabase")
        setVilla({ id: villaId, name: "Villa Inconnue" })
      } else {
        const d = data as Record<string, unknown> | null
        setVilla(d ?? { id: villaId, name: "Villa Inconnue" })
        setForm({
          name: (d?.name as string) || "",
          location: (d?.location as string) || "",
          description: (d?.description as string) || "",
          price_per_night: d?.price_per_night != null ? String(d.price_per_night) : "",
          capacity: d?.capacity != null ? String(d.capacity) : "",
          image_url: (d?.image_url as string) || "",
          image_urls: Array.isArray(d?.image_urls) ? d.image_urls as string[] : [],
          airbnb_url: (d?.airbnb_url as string) || "",
          ical_url: (d?.ical_url as string) || "",
          access_token: (d?.access_token as string) || "",
          is_published: Boolean(d?.is_published),
          amenities: Array.isArray(d?.amenities) ? d.amenities as string[] : [],
          amenities_import_labels: Array.isArray((d as { amenities_import_labels?: unknown })?.amenities_import_labels)
            ? ((d as { amenities_import_labels: string[] }).amenities_import_labels as string[])
            : [],
          rooms_details: Array.isArray(d?.rooms_details) ? d.rooms_details as { title: string; description: string }[] : [],
          seasonal_prices: Array.isArray(d?.seasonal_prices) ? d.seasonal_prices as { name: string; start_date: string; end_date: string; price: string }[] : [],
          cancellation_policy: (d?.cancellation_policy as string) || "",
          house_rules: (d?.house_rules as string) || "",
          safety_info: (d?.safety_info as string) || "",
          bathrooms_count: d?.bathrooms_count != null ? String(d.bathrooms_count) : "",
          surface_m2: d?.surface_m2 != null ? String(d.surface_m2) : "",
          check_in_time: (d?.check_in_time as string) || "",
          check_out_time: (d?.check_out_time as string) || "",
          environment: (d?.environment as string) || "",
          nearby_points_text: Array.isArray(d?.nearby_points) ? (d.nearby_points as string[]).join("\n") : "",
          equipment_interior_text: Array.isArray(d?.equipment_interior) ? (d.equipment_interior as string[]).join("\n") : "",
          equipment_exterior_text: Array.isArray(d?.equipment_exterior) ? (d.equipment_exterior as string[]).join("\n") : "",
          included_services_home_text: Array.isArray(d?.included_services_home) ? (d.included_services_home as string[]).join("\n") : "",
          included_services_collection_text: Array.isArray(d?.included_services_collection) ? (d.included_services_collection as string[]).join("\n") : "",
          a_la_carte_services_text: Array.isArray(d?.a_la_carte_services) ? (d.a_la_carte_services as string[]).join("\n") : "",
          booking_terms_text: Array.isArray(d?.booking_terms)
            ? (d.booking_terms as { question?: string; answer?: string }[])
                .map((item) => `${item.question || ""}::${item.answer || ""}`)
                .join("\n")
            : "",
          collection_tier:
            d?.collection_tier === "iconic" || d?.collection_tier === "signature"
              ? (d.collection_tier as string)
              : "signature",
          latitude: d?.latitude != null ? String(d.latitude) : "",
          longitude: d?.longitude != null ? String(d.longitude) : "",
          map_embed_url: (d?.map_embed_url as string) || "",
        })

        // Fetch bookings
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select("*")
          .eq("villa_id", villaId)
          .order("start_date", { ascending: true })

        if (!bookingsError && bookingsData) {
          setBookings(bookingsData)
        }

        // Fetch tasks
        const { data: tasksData } = await supabase
          .from("tasks")
          .select("*")
          .eq("villa_id", villaId)
          .order("created_at", { ascending: false })

        if (tasksData) {
          setTasks(tasksData)
        }

        const { data: feedsData } = await supabase
          .from("villa_ical_feeds")
          .select("platform, last_synced_at, last_error, is_active")
          .eq("villa_id", villaId)
        setIcalFeeds(feedsData ?? [])
      }
      setLoading(false)
    }

    fetchVilla()
  }, [villaId, supabase, isNew])

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null)
        setError(null)
      }, 4500)
      return () => clearTimeout(timer)
    }
  }, [success, error])

  useEffect(() => {
    return () => {
      if (bookingDeleteTimerRef.current) {
        clearTimeout(bookingDeleteTimerRef.current)
      }
      if (villaDeleteTimerRef.current) {
        clearTimeout(villaDeleteTimerRef.current)
      }
    }
  }, [])

  const handleChange = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = (event.target as HTMLInputElement).type === 'checkbox' ? (event.target as HTMLInputElement).checked : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const parseMultilineList = (value: string) =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)

  const handleRemoveAmenity = (item: string) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.filter((a) => a !== item),
      amenities_import_labels: prev.amenities_import_labels.filter((a) => a !== item),
    }))
  }

  const handleToggleSuggestedAmenity = (label: string) => {
    setForm((prev) => {
      const has = prev.amenities.includes(label)
      if (has) {
        return {
          ...prev,
          amenities: prev.amenities.filter((a) => a !== label),
          amenities_import_labels: prev.amenities_import_labels.filter((a) => a !== label),
        }
      }
      return {
        ...prev,
        amenities: [...prev.amenities, label],
      }
    })
  }

  const handleAddAmenityDraft = () => {
    const t = amenityDraft.trim()
    if (!t) return
    setForm((prev) => {
      if (prev.amenities.includes(t)) return prev
      return { ...prev, amenities: [...prev.amenities, t] }
    })
    setAmenityDraft("")
  }

  const parseBookingTerms = (value: string) =>
    value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [question, ...answerParts] = line.split("::")
        return {
          question: (question || "").trim(),
          answer: answerParts.join("::").trim(),
        }
      })
      .filter((item) => item.question && item.answer)

  const handleAddRoom = () => {
    setForm(prev => ({
      ...prev,
      rooms_details: [...prev.rooms_details, { title: "Chambre " + (prev.rooms_details.length + 1), description: "1 Lit King Size" }]
    }))
  }

  const handleRoomChange = (index: number, field: 'title' | 'description', value: string) => {
    setForm(prev => {
      const next = [...prev.rooms_details];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, rooms_details: next };
    })
  }

  const handleRemoveRoom = (index: number) => {
    setForm(prev => ({
      ...prev,
      rooms_details: prev.rooms_details.filter((_, i) => i !== index)
    }))
  }

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = form.image_urls.indexOf(active.id);
      const newIndex = form.image_urls.indexOf(over.id);
      const nextUrls = arrayMove(form.image_urls, oldIndex, newIndex);
      
      setForm((prev) => ({ ...prev, image_urls: nextUrls }));
      
      if (supabase && !isNew) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          await fetch("/api/dashboard/update-villa", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ villaId, payload: { image_urls: nextUrls } }),
          });
          await revalidateVillas();
        }
      }
    }
  };

  const handleAddTask = async (content: string) => {
    if (!supabase || isNew || !content.trim()) return;
    const { data, error } = await (supabase as any)
      .from("tasks")
      .insert({ villa_id: villaId, content: content.trim(), status: "pending" })
      .select()
      .single();
    if (data) setTasks([data, ...tasks]);
  };

  const handleToggleTask = async (id: string, currentStatus: string) => {
    if (!supabase) return;
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    await (supabase as any).from("tasks").update({ status: nextStatus }).eq("id", id);
    setTasks(tasks.map(t => t.id === id ? { ...t, status: nextStatus } : t));
  };

  const handleDeleteTask = async (id: string) => {
    if (!supabase) return;
    await (supabase as any).from("tasks").delete().eq("id", id);
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleSyncIcal = async () => {
    if (!supabase || isNew || typeof villaId !== "string") return;
    setSaving(true);
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ villaId })
      });
      if (response.ok) {
        setSuccess("Synchronisation lancée avec succès.");
        const { data: feedsData } = await supabase
          .from("villa_ical_feeds")
          .select("platform, last_synced_at, last_error, is_active")
          .eq("villa_id", villaId)
        if (feedsData) setIcalFeeds(feedsData)
        router.refresh();
      } else {
        setError("Erreur lors de la synchronisation.");
      }
    } catch (e) {
      setError("Erreur réseau lors de la synchronisation.");
    }
    setSaving(false);
  };

  const handleAirbnbImport = async () => {
    if (!form.airbnb_url?.trim()) {
      setError("Veuillez coller l'URL de votre annonce (Airbnb, Booking, etc.)");
      return;
    }
    setImportingAirbnb(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/import-airbnb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.airbnb_url.trim(), useAi: importUseAi }),
      });

      const data = await response.json();

      if (response.ok && data) {
        setForm((prev) => {
          const importedBatch =
            Array.isArray(data.amenities) && data.amenities.length > 0
              ? data.amenities.map((x: string) => String(x).trim()).filter(Boolean)
              : [];
          const batchSet = new Set(importedBatch);

          const nextAmenities =
            importedBatch.length > 0
              ? Array.from(new Set([...prev.amenities, ...importedBatch]))
              : prev.amenities;

          const prevOta = new Set(prev.amenities_import_labels);
          const nextOtaLabels: string[] = [];
          const otaSeen = new Set<string>();
          for (const a of nextAmenities) {
            if (otaSeen.has(a)) continue;
            if (batchSet.has(a) || prevOta.has(a)) {
              otaSeen.add(a);
              nextOtaLabels.push(a);
            }
          }

          // Auto-populate equipment_interior_text from imported amenities if empty
          const importedAmenityLines =
            importedBatch.length > 0 ? importedBatch.join("\n") : "";
          const nextEquipmentInterior =
            !prev.equipment_interior_text.trim() && importedAmenityLines
              ? importedAmenityLines
              : prev.equipment_interior_text;

          // nearby_points → nearby_points_text
          const nextNearbyPoints =
            Array.isArray(data.nearby_points) && data.nearby_points.length > 0 && !prev.nearby_points_text.trim()
              ? data.nearby_points.map((x: string) => String(x).trim()).filter(Boolean).join('\n')
              : prev.nearby_points_text;

          return {
            ...prev,
            name: data.name || prev.name,
            description: data.description || prev.description,
            location: data.location || prev.location,
            capacity: data.capacity != null ? String(data.capacity) : prev.capacity,
            price_per_night:
              data.price_per_night != null ? String(data.price_per_night) : prev.price_per_night,
            bathrooms_count:
              data.bathrooms_count != null ? String(data.bathrooms_count) : prev.bathrooms_count,
            surface_m2: data.surface_m2 != null ? String(data.surface_m2) : prev.surface_m2,
            check_in_time: data.check_in_time || prev.check_in_time,
            check_out_time: data.check_out_time || prev.check_out_time,
            latitude: data.latitude != null ? String(data.latitude) : prev.latitude,
            longitude: data.longitude != null ? String(data.longitude) : prev.longitude,
            house_rules: data.house_rules || prev.house_rules,
            cancellation_policy: data.cancellation_policy || prev.cancellation_policy,
            safety_info: data.safety_info || prev.safety_info,
            environment: data.environment || prev.environment,
            nearby_points_text: nextNearbyPoints,
            image_url: data.image_url || prev.image_url,
            image_urls:
              data.image_urls && data.image_urls.length > 0
                ? Array.from(new Set([...prev.image_urls, ...data.image_urls]))
                : prev.image_urls,
            amenities: nextAmenities,
            amenities_import_labels: nextOtaLabels,
            equipment_interior_text: nextEquipmentInterior,
          };
        });

        const warnings = Array.isArray(data.warnings) ? data.warnings.filter(Boolean).join(" · ") : "";
        const aiHint =
          data.ai_used === true
            ? " Complément IA appliqué sur les champs vides."
            : importUseAi && data.ai_note
              ? ` (IA : ${String(data.ai_note).slice(0, 120)})`
              : "";

        setSuccess(
          `Annonce importée — vérifiez les champs puis enregistrez.${aiHint}${
            warnings ? ` Avertissements : ${warnings}` : ""
          }`
        );
      } else {
        setError(data.error || "Échec de l'importation");
      }
    } catch (e) {
      setError("Erreur réseau lors de l'importation");
    } finally {
      setImportingAirbnb(false);
    }
  };

  const handleAddSeasonalPrice = () => {
    setForm(prev => ({
      ...prev,
      seasonal_prices: [...prev.seasonal_prices, { name: "Haute Saison", start_date: "", end_date: "", price: "" }]
    }))
  }

  const handleBlockDates = async () => {
    if (!selectedRange || !supabase || isNew || !villaId) return

    setSaving(true)
    const vid = villaId
    const { error: blockError } = await (supabase as any)
      .from("bookings")
      .insert({
        villa_id: vid,
        start_date: selectedRange.start,
        end_date: selectedRange.end,
        status: "confirmed",
        source: "direct",
        guest_name: "Propriétaire (Bloqué)",
        price: 0,
      })

    if (blockError) {
      setError(blockError.message)
    } else {
      setSuccess("Dates bloquées avec succès.")
      setSelectedRange(null)
      // Re-fetch bookings
      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("*")
        .eq("villa_id", vid)
        .order("start_date", { ascending: true })
      if (bookingsData) setBookings(bookingsData)
    }
    setSaving(false)
  }

  const scheduleDeleteBooking = async (id: string, label: string) => {
    if (!supabase) return
    setPendingBookingDelete({ id, label })
    if (bookingDeleteTimerRef.current) {
      clearTimeout(bookingDeleteTimerRef.current)
    }

    bookingDeleteTimerRef.current = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError("Session expirée. Veuillez vous reconnecter.")
        setPendingBookingDelete(null)
        return
      }

      const response = await fetch("/api/dashboard/delete-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ bookingId: id }),
      })
      const payload = await response.json()
      if (!response.ok) {
        setError(payload?.error || "Suppression impossible")
        setPendingBookingDelete(null)
        return
      }

      setSuccess("Réservation supprimée / dates débloquées.")
      setBookings((prev) => prev.filter((b) => b.id !== id))
      setSelectedEventId(null)
      setPendingBookingDelete(null)
    }, 10000)
  }

  const handleUndoDeleteBooking = () => {
    if (bookingDeleteTimerRef.current) {
      clearTimeout(bookingDeleteTimerRef.current)
    }
    setPendingBookingDelete(null)
  }

  const handleUnblock = async () => {
    if (!selectedEventId || !supabase) return

    const bookingLabel = bookings.find((b) => b.id === selectedEventId)?.guest_name || "Réservation"
    await scheduleDeleteBooking(selectedEventId, bookingLabel)
  }

  const handleDeleteBooking = async (id: string) => {
    if (!supabase) return
    if (!confirm("Supprimer cette réservation ?")) return
    const bookingLabel = bookings.find((b) => b.id === id)?.guest_name || "Réservation"
    await scheduleDeleteBooking(id, bookingLabel)
  }

  const handleUpdateBookingStatus = async (id: string, status: string) => {
    if (!supabase) return
    const { error } = await (supabase as any).from("bookings").update({ status }).eq("id", id)
    if (error) setError(error.message)
    else setBookings(bookings.map(b => b.id === id ? { ...b, status } : b))
  }

  const handleUpdatePaymentStatus = async (id: string, payment_status: string) => {
    if (!supabase) return
    const { error } = await (supabase as any).from("bookings").update({ payment_status }).eq("id", id)
    if (error) setError(error.message)
    else setBookings(bookings.map(b => b.id === id ? { ...b, payment_status } : b))
  }

  const handleSeasonalPriceChange = (index: number, field: 'name' | 'start_date' | 'end_date' | 'price', value: string) => {
    setForm(prev => {
      const next = [...prev.seasonal_prices];
      next[index] = { ...next[index], [field]: value };
      return { ...prev, seasonal_prices: next };
    })
  }

  const handleRemoveSeasonalPrice = (index: number) => {
    setForm(prev => ({
      ...prev,
      seasonal_prices: prev.seasonal_prices.filter((_, i) => i !== index)
    }))
  }

  const handleTogglePublished = async (checked: boolean) => {
    setForm((prev) => ({ ...prev, is_published: checked }))
    if (isNew || !supabase || !villaId || typeof villaId !== "string") {
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      setError("Session expirée. Veuillez vous reconnecter.")
      return
    }

    const response = await fetch("/api/dashboard/update-villa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        villaId,
        payload: { is_published: checked },
      }),
    })
    const payload = await response.json()

    if (!response.ok) {
      setError(payload?.error || "Impossible de mettre à jour le statut.")
      return
    }

    setSuccess(checked ? "Villa publiée." : "Villa mise en brouillon.")
  }

  // Calculs statistiques réels
  const stats = useMemo(() => {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    const recentBookings = bookings.filter(b => new Date(b.created_at) >= thirtyDaysAgo)
    const revenue = recentBookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0)
    
    const futureBookings = bookings.filter(b => new Date(b.end_date) >= now)
    const occupiedDays = futureBookings.reduce((sum, b) => {
      const start = new Date(b.start_date)
      const end = new Date(b.end_date)
      return sum + Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    }, 0)
    
    const occupancy = Math.min(100, Math.round((occupiedDays / 365) * 100)) // Sur base annuelle simplifiée

    return { revenue, occupancy, count: bookings.length }
  }, [bookings])

  const upcomingArrivals = useMemo(() => {
    const now = new Date()
    return bookings
      .filter(b => new Date(b.start_date) >= now)
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .slice(0, 5)
  }, [bookings])

  const calendarEvents = useMemo(() => {
    return bookings.map(b => ({
      id: b.id,
      title: b.guest_name || "Réservé",
      start: b.start_date,
      end: b.end_date,
      color: b.status === 'confirmed' ? '#1e293b' : '#94a3b8'
    }))
  }, [bookings])

  const filteredBookings = useMemo(() => {
    const q = bookingSearch.trim().toLowerCase()
    return bookings.filter((b) => {
      const name = (b.guest_name || "").toLowerCase()
      const idShort = String(b.id ?? "").toLowerCase()
      if (q && !name.includes(q) && !idShort.includes(q)) return false
      if (bookingStatusFilter !== "all" && (b.status || "pending") !== bookingStatusFilter) return false
      const src = String(b.source || "direct").toLowerCase()
      if (bookingSourceFilter === "airbnb" && src !== "airbnb") return false
      if (bookingSourceFilter === "other" && src === "airbnb") return false
      return true
    })
  }, [bookings, bookingSearch, bookingStatusFilter, bookingSourceFilter])

  const icalSyncSummary = useMemo(() => {
    if (!icalFeeds.length) {
      return {
        lastLine: null as string | null,
        body: "Aucun flux iCal enregistré côté serveur pour cette villa. Enregistrez une URL dans l’onglet Contenu pour activer la synchronisation.",
        tone: "neutral" as const,
      }
    }
    const times = icalFeeds.map((f) => f.last_synced_at).filter(Boolean) as string[]
    const lastMs = times.length ? Math.max(...times.map((t) => new Date(t).getTime())) : null
    const lastLine = lastMs
      ? `Dernière synchronisation enregistrée : ${new Date(lastMs).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}`
      : "Aucune date de synchronisation enregistrée pour l’instant."
    const errs = icalFeeds.filter((f) => f.last_error)
    const body =
      errs.length > 0
        ? `${errs.length} flux signalent une erreur (détail dans Contenu → Sync & liens).`
        : "Le serveur met à jour les flux périodiquement ; vous pouvez forcer une synchronisation ci-dessous."
    const tone = errs.length > 0 ? ("warn" as const) : ("ok" as const)
    return { lastLine, body, tone }
  }, [icalFeeds])

  const publishChecklistItems = useMemo(() => {
    const n = form.image_urls.length
    const desc = form.description.trim().length > 0
    const photosOk = n >= 3
    const price =
      form.price_per_night !== "" &&
      !Number.isNaN(Number(form.price_per_night)) &&
      Number(form.price_per_night) > 0
    const icalOk = form.ical_url.trim().length > 0
    return [
      { id: "desc", ok: desc, label: "Description renseignée", optional: false as boolean },
      { id: "photos", ok: photosOk, label: `Au moins 3 photos (${n} chargée(s))`, optional: false },
      { id: "price", ok: price, label: "Prix par nuit renseigné", optional: false },
      { id: "ical", ok: icalOk, label: "URL iCal (recommandé si Airbnb/Booking)", optional: true },
    ]
  }, [form.description, form.image_urls, form.price_per_night, form.ical_url])

  const exportBookingsCsv = () => {
    const headers = ["id", "guest_name", "start_date", "end_date", "source", "status", "payment_status", "price"] as const
    const escapeCell = (v: unknown) => {
      const s = String(v ?? "")
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`
      return s
    }
    const lines = [
      headers.join(","),
      ...filteredBookings.map((b) => headers.map((h) => escapeCell(b[h])).join(",")),
    ]
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reservations-villa-${typeof villaId === "string" ? villaId : "export"}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return
    if (!supabase) {
      setError("Supabase non configuré. Impossible d'uploader l'image.")
      return
    }

    setUploading(true)
    setError(null)
    setSuccess(null)

    const uploadedUrls: string[] = []
    for (const file of files) {
      const fileExt = file.name.split(".").pop()
      const filePath = `${isNew ? "draft" : villaId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`

      const { error: uploadError } = await supabase
        .storage
        .from("villa-images")
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        setError(uploadError.message || "Erreur upload Supabase Storage")
        setUploading(false)
        return
      }

      const { data: publicUrl } = supabase.storage.from("villa-images").getPublicUrl(filePath)
      if (publicUrl?.publicUrl) {
        uploadedUrls.push(publicUrl.publicUrl)
      }
    }

    if (uploadedUrls.length > 0) {
      const nextImageUrls = [...form.image_urls, ...uploadedUrls]
      const primaryImage = form.image_url || nextImageUrls[0] || ""

      setForm((prev) => ({
        ...prev,
        image_urls: nextImageUrls,
        image_url: primaryImage,
      }))

      if (!isNew && villaId && typeof villaId === "string") {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          setError("Session expirée. Veuillez vous reconnecter.")
          setUploading(false)
          return
        }

        const response = await fetch("/api/dashboard/update-villa", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            villaId,
            payload: { image_urls: nextImageUrls, image_url: primaryImage || null },
          }),
        })
        const payload = await response.json()

        if (!response.ok) {
          setError(payload?.error || "Erreur mise à jour image")
        } else {
          setSuccess("Images uploadées et enregistrées.")
          setVilla((prev: any) => ({ ...(prev || {}), image_url: primaryImage, image_urls: nextImageUrls }))
          await revalidateVillas()
          router.refresh()
        }
      } else {
        setSuccess("Images uploadées. Pense à cliquer sur Créer pour enregistrer.")
      }
    }
    setUploading(false)
  }

  const handleAddImagesClick = () => {
    const input = document.getElementById("villa-images-input") as HTMLInputElement | null
    input?.click()
  }

  const handleRemoveImage = async (url: string) => {
    const nextImageUrls = form.image_urls.filter((item) => item !== url)
    const nextPrimary = form.image_url === url ? (nextImageUrls[0] || "") : form.image_url

    setForm((prev) => ({
      ...prev,
      image_urls: nextImageUrls,
      image_url: nextPrimary,
    }))

    if (!supabase || isNew || !villaId || typeof villaId !== "string") {
      return
    }

    const publicPrefix = "/storage/v1/object/public/villa-images/"
    const urlPath = url.split(publicPrefix)[1]
    if (urlPath) {
      const { error: removeError } = await supabase.storage
        .from("villa-images")
        .remove([urlPath])
      if (removeError) {
        setError(removeError.message || "Erreur suppression image storage")
      }
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return
    }

    const response = await fetch("/api/dashboard/update-villa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        villaId,
        payload: { image_urls: nextImageUrls, image_url: nextPrimary || null },
      }),
    })
    const payload = await response.json()

    if (!response.ok) {
      setError(payload?.error || "Erreur mise à jour image")
    } else {
      await revalidateVillas()
      router.refresh()
    }
  }

  const handleSetPrimary = async (url: string) => {
    setForm((prev) => ({ ...prev, image_url: url }))
    if (!supabase || isNew || !villaId || typeof villaId !== "string") {
      return
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return
    }

    const response = await fetch("/api/dashboard/update-villa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ villaId, payload: { image_url: url } }),
    })
    const payload = await response.json()

    if (!response.ok) {
      setError(payload?.error || "Erreur mise à jour image principale")
    } else {
      setSuccess("Image principale mise à jour.")
      setVilla((prev: any) => ({ ...(prev || {}), image_url: url }))
      await revalidateVillas()
      router.refresh()
    }
  }

  const handleSave = async () => {
    if (!supabase) {
      setError("Supabase non configuré. Impossible d'enregistrer.")
      return
    }

    if (!villaId || typeof villaId !== "string") {
      setError("Identifiant villa invalide. Recharge la page.")
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    const payload = {
      name: form.name.trim(),
      location: form.location.trim() || null,
      description: form.description.trim() || null,
      price_per_night: form.price_per_night ? Number(form.price_per_night) : null,
      capacity: form.capacity ? Number(form.capacity) : null,
      bathrooms_count: form.bathrooms_count ? Number(form.bathrooms_count) : null,
      surface_m2: form.surface_m2 ? Number(form.surface_m2) : null,
      image_url: form.image_url.trim() || null,
      image_urls: form.image_urls,
      airbnb_url: form.airbnb_url.trim() || null,
      ical_url: form.ical_url.trim() || null,
      access_token: form.access_token.trim() || null,
      is_published: form.is_published,
      amenities: form.amenities,
      amenities_import_labels: form.amenities_import_labels.filter((x) => form.amenities.includes(x)),
      rooms_details: form.rooms_details,
      seasonal_prices: form.seasonal_prices,
      cancellation_policy: form.cancellation_policy?.trim() || null,
      house_rules: form.house_rules?.trim() || null,
      safety_info: form.safety_info?.trim() || null,
      check_in_time: form.check_in_time?.trim() || null,
      check_out_time: form.check_out_time?.trim() || null,
      environment: form.environment?.trim() || null,
      nearby_points: parseMultilineList(form.nearby_points_text),
      equipment_interior: parseMultilineList(form.equipment_interior_text),
      equipment_exterior: parseMultilineList(form.equipment_exterior_text),
      included_services_home: parseMultilineList(form.included_services_home_text),
      included_services_collection: parseMultilineList(form.included_services_collection_text),
      a_la_carte_services: parseMultilineList(form.a_la_carte_services_text),
      booking_terms: parseBookingTerms(form.booking_terms_text),
      collection_tier: form.collection_tier === "iconic" ? "iconic" : "signature",
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
      map_embed_url: form.map_embed_url?.trim() || null,
    }

    if (!payload.name) {
      setError("Le nom de la villa est obligatoire.")
      setSaving(false)
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      setError("Session expirée. Veuillez vous reconnecter.")
      setSaving(false)
      return
    }

    if (isNew) {
      const response = await fetch("/api/dashboard/create-villa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      })
      const payloadResponse = await response.json()

      if (!response.ok) {
        setError(payloadResponse?.error || "Erreur création villa")
      } else {
        setSuccess("Villa créée avec succès.")
        router.push(`/dashboard/proprio/${payloadResponse.data.id}`)
      }
    } else {
      const response = await fetch("/api/dashboard/update-villa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ villaId, payload }),
      })
      const payloadResponse = await response.json()

      if (!response.ok) {
        setError(payloadResponse?.error || "Erreur mise à jour villa")
      } else {
        setSuccess("Villa mise à jour.")
        setVilla(payloadResponse.data)
        await revalidateVillas()
        router.refresh()
      }
    }

    setSaving(false)
  }

  const handleSignOut = async () => {
    if (supabase) await supabase.auth.signOut()
    router.push("/")
  }

  const handleDeleteVilla = async () => {
    if (isNew || !supabase) return
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette villa ? Cette action est irréversible.")) {
      return
    }

    setPendingVillaDelete(true)
    if (villaDeleteTimerRef.current) {
      clearTimeout(villaDeleteTimerRef.current)
    }

    villaDeleteTimerRef.current = setTimeout(async () => {
      setSaving(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError("Session expirée. Veuillez vous reconnecter.")
        setSaving(false)
        setPendingVillaDelete(false)
        return
      }

      const response = await fetch("/api/dashboard/delete-villa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ villaId }),
      })

      const payload = await response.json()
      if (!response.ok) {
        setError(payload?.error || "Suppression impossible")
        setSaving(false)
        setPendingVillaDelete(false)
        return
      }

      await revalidateVillas()
      router.push("/dashboard/proprio")
    }, 10000)
  }

  const handleUndoDeleteVilla = () => {
    if (villaDeleteTimerRef.current) {
      clearTimeout(villaDeleteTimerRef.current)
    }
    setPendingVillaDelete(false)
  }

  if (loading) {
    return <div className="flex min-h-dvh items-center justify-center bg-offwhite font-display text-2xl text-navy animate-pulse">Chargement...</div>
  }

  return (
    <main className="flex min-h-dvh flex-col bg-offwhite">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-none md:backdrop-blur-md">
        <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push("/dashboard/proprio")}
              className="rounded-full h-10 w-10 p-0 text-navy/40 hover:text-navy hover:bg-navy/5"
            >
              <ArrowLeft size={20} />
            </Button>
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="font-display text-2xl text-navy leading-none">{villa?.name}</h1>
                <span className={`rounded-full px-3 py-1 text-[8px] font-bold uppercase tracking-widest ${
                  form.is_published ? "bg-emerald-50 text-emerald-600" : "bg-navy/5 text-navy/40"
                }`}>
                  {form.is_published ? "Publié" : "Brouillon"}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] uppercase tracking-widest text-gold font-bold">Gestion Villa</span>
                <span className="h-1 w-1 rounded-full bg-navy/10" />
                <Link href={`/villas/${villaId}`} target="_blank" className="text-[10px] uppercase tracking-widest text-navy/40 hover:text-navy flex items-center gap-1">
                  Voir en ligne <ExternalLink size={10} />
                </Link>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="rounded-full text-navy/60 hover:text-navy">
            <LogOut size={18} />
          </Button>
        </div>
      </header>

      {/* Main Content Area with Tabs */}
      <div className="mx-auto w-full max-w-7xl flex-1 p-6 pb-20">
        <Tabs defaultValue="planning" className="space-y-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b pb-6">
            <TabsList className="bg-navy/5 p-1 h-12 rounded-2xl">
              <TabsTrigger value="planning" className="px-6 rounded-xl gap-2 data-[state=active]:bg-white data-[state=active]:text-navy data-[state=active]:shadow-sm">
                <Calendar size={16} />
                <span className="text-[10px] uppercase tracking-widest font-bold">Planning</span>
              </TabsTrigger>
              <TabsTrigger value="content" className="px-6 rounded-xl gap-2 data-[state=active]:bg-white data-[state=active]:text-navy data-[state=active]:shadow-sm">
                <FileText size={16} />
                <span className="text-[10px] uppercase tracking-widest font-bold">Contenu</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="px-6 rounded-xl gap-2 data-[state=active]:bg-white data-[state=active]:text-navy data-[state=active]:shadow-sm">
                <Settings size={16} />
                <span className="text-[10px] uppercase tracking-widest font-bold">Réglages</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-3">
              {!isNew && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 text-[10px] font-bold uppercase tracking-widest px-6 gap-2"
                  onClick={handleDeleteVilla}
                  disabled={saving}
                >
                  <Trash2 size={14} /> Supprimer
                </Button>
              )}
              <Button
                size="sm"
                className="rounded-full bg-navy text-white hover:bg-navy/90 text-[10px] font-bold uppercase tracking-widest px-6"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Enregistrement..." : isNew ? "Créer" : "Enregistrer"}
              </Button>
            </div>
          </div>

          {(error || success) && (
            <div className={`rounded-2xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
              {error || success}
            </div>
          )}
          {pendingBookingDelete && (
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <span>Suppression de "{pendingBookingDelete.label}" dans 10s…</span>
              <Button variant="outline" size="sm" className="rounded-full" onClick={handleUndoDeleteBooking}>
                Annuler
              </Button>
            </div>
          )}
          {pendingVillaDelete && (
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              <span>Suppression de la villa dans 10s…</span>
              <Button variant="outline" size="sm" className="rounded-full" onClick={handleUndoDeleteVilla}>
                Annuler
              </Button>
            </div>
          )}

          {/* Planning Content */}
          <TabsContent value="planning" className="space-y-6 outline-none">
            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
              <div className="rounded-[40px] border border-navy/5 bg-white p-8 shadow-sm">
                <div className="mb-8 flex items-center justify-between">
                  <h3 className="font-display text-2xl text-navy">Disponibilités</h3>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest">
                      <span className="h-2 w-2 rounded-full bg-emerald-600" />
                      Libre
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-navy/5 text-navy text-[10px] font-bold uppercase tracking-widest">
                      <span className="h-2 w-2 rounded-full bg-navy" />
                      Occupé
                    </div>
                  </div>
                </div>
                {/* Ici on passera villaId au calendrier plus tard */}
                <AdminCalendar 
                  events={calendarEvents} 
                  onDateSelect={(start, end) => {
                    setSelectedEventId(null)
                    setSelectedRange({ start, end })
                  }}
                  onEventClick={(id) => {
                    setSelectedRange(null)
                    setSelectedEventId(id)
                  }}
                />

                {selectedRange && (
                  <div className="mt-6 flex items-center justify-between rounded-2xl bg-navy p-4 text-white animate-in fade-in slide-in-from-top-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-widest text-gold">Dates sélectionnées</p>
                      <p className="text-sm">
                        Du {new Date(selectedRange.start).toLocaleDateString('fr-FR')} au {new Date(selectedRange.end).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedRange(null)} className="text-white hover:bg-white/10 text-xs">
                        Annuler
                      </Button>
                      <Button size="sm" onClick={handleBlockDates} disabled={saving} className="bg-gold text-navy hover:bg-white text-xs font-bold">
                        {saving ? "Blocage..." : "Bloquer ces dates"}
                      </Button>
                    </div>
                  </div>
                )}

                {selectedEventId && (
                  <div className="mt-6 flex items-center justify-between rounded-2xl bg-red-500 p-4 text-white animate-in fade-in slide-in-from-top-4 shadow-lg">
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-widest text-white/80">Réservation sélectionnée</p>
                      <p className="text-sm font-bold">
                        {bookings.find(b => b.id === selectedEventId)?.guest_name || "Client"}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedEventId(null)} className="text-white hover:bg-white/10 text-xs">
                        Annuler
                      </Button>
                      <Button size="sm" onClick={handleUnblock} disabled={saving} className="bg-white text-red-500 hover:bg-navy hover:text-white text-xs font-bold">
                        {saving ? "Suppression..." : "Débloquer / Supprimer"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="rounded-[32px] border border-navy/5 bg-white p-6 shadow-sm">
                  <h4 className="text-[10px] uppercase tracking-widest font-bold text-navy/40 mb-4">Prochaines Arrivées</h4>
                  <div className="space-y-4">
                    {upcomingArrivals.length === 0 ? (
                      <p className="text-sm text-navy/60 italic">Aucune arrivée prévue.</p>
                    ) : (
                      upcomingArrivals.map((b, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-navy/5 pb-3 last:border-0 last:pb-0">
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-navy">{b.guest_name || "Client Privé"}</p>
                            <p className="text-[10px] text-navy/40 uppercase tracking-widest">
                              {new Date(b.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - {new Date(b.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                          <div className="text-[10px] font-bold text-gold">€{b.price}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <PlanningIcalSyncCard
                  lastLine={icalSyncSummary.lastLine}
                  body={icalSyncSummary.body}
                  tone={icalSyncSummary.tone}
                  saving={saving}
                  onSync={handleSyncIcal}
                />
              </div>
            </div>

            <VillaBookingsRegistry
              bookingsTotal={bookings.length}
              filteredBookings={filteredBookings}
              bookingSearch={bookingSearch}
              onBookingSearchChange={setBookingSearch}
              bookingStatusFilter={bookingStatusFilter}
              onBookingStatusFilterChange={setBookingStatusFilter}
              bookingSourceFilter={bookingSourceFilter}
              onBookingSourceFilterChange={setBookingSourceFilter}
              onExportCsv={exportBookingsCsv}
              renderRowActions={(booking) => (
                <ActionMenu
                  items={[
                    {
                      label: booking.status === "confirmed" ? "Passer en attente" : "Confirmer",
                      icon: booking.status === "confirmed" ? <XCircle size={14} /> : <CheckCircle size={14} />,
                      onClick: () =>
                        handleUpdateBookingStatus(booking.id, booking.status === "confirmed" ? "pending" : "confirmed"),
                    },
                    {
                      label: booking.payment_status === "paid" ? "Marquer non-payé" : "Marquer comme payé",
                      icon: <CreditCard size={14} />,
                      onClick: () =>
                        handleUpdatePaymentStatus(booking.id, booking.payment_status === "paid" ? "unpaid" : "paid"),
                    },
                    {
                      label: "Copier lien de paiement",
                      icon: <LinkIcon size={14} />,
                      onClick: () => {
                        navigator.clipboard.writeText(`${window.location.origin}/checkout/${booking.id}`)
                        setSuccess("Lien de paiement copié !")
                      },
                    },
                    {
                      label: "Supprimer",
                      icon: <Trash2 size={14} />,
                      onClick: () => handleDeleteBooking(booking.id),
                      variant: "danger",
                    },
                  ]}
                />
              )}
            />
          </TabsContent>

          {/* Content & Settings Placeholders */}
          <TabsContent value="content" className="rounded-[40px] border border-navy/5 bg-white p-8 shadow-sm outline-none space-y-8">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <h3 className="font-display text-3xl text-navy">Éditeur de Villa</h3>
                <div className="flex flex-wrap items-center gap-3">
                  {!isNew && typeof villaId === "string" && (
                    <Link
                      href={`/villas/${villaId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-[10px] font-bold uppercase tracking-widest text-navy hover:bg-slate-100"
                    >
                      Voir la fiche publique <ExternalLink size={12} aria-hidden />
                    </Link>
                  )}
                  <div className="flex items-center gap-3 rounded-full bg-navy/5 px-4 py-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-navy/40">Statut:</span>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input 
                        type="checkbox" 
                        className="peer sr-only" 
                        checked={form.is_published}
                        onChange={(e) => handleTogglePublished(e.target.checked)}
                      />
                      <div className="peer h-6 w-11 rounded-full bg-navy/20 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-gold peer-checked:after:translate-x-full" />
                      <span className="ml-3 text-[10px] font-bold uppercase tracking-widest text-navy">
                        {form.is_published ? "Publié" : "Brouillon"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
              <p className="text-navy/60">Modifiez le contenu public et les informations de {villa?.name}.</p>
            </div>

            {(error || success) && (
              <div className={`rounded-2xl border px-4 py-3 text-sm ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                {error || success}
              </div>
            )}

            <nav
              aria-label="Sections du contenu"
              className="flex flex-wrap gap-2 rounded-2xl border border-navy/8 bg-offwhite/80 p-4 lg:sticky lg:top-28 lg:z-10"
            >
              <p className="w-full text-[10px] font-bold uppercase tracking-widest text-navy/40 lg:mb-0 lg:w-auto lg:shrink-0 lg:py-1.5">
                Sur cette page
              </p>
              {contentNavItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-navy/10 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-navy/70 hover:border-gold/40 hover:bg-offwhite"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <VillaPublishChecklist items={publishChecklistItems} />

            <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-10">
                {/* Infos de base */}
                <div id="content-section-general" className="scroll-mt-28 space-y-6">
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Informations Générales</h4>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-navy/40">Nom de la villa</label>
                      <Input value={form.name} onChange={handleChange("name")} placeholder="Villa Diamant Noir" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-navy/40">Localisation</label>
                      <Input value={form.location} onChange={handleChange("location")} placeholder="Le Diamant, Martinique" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-navy/40">Prix par nuit (€)</label>
                      <Input value={form.price_per_night} onChange={handleChange("price_per_night")} type="number" min="0" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-navy/40">Capacité (voyageurs)</label>
                      <Input value={form.capacity} onChange={handleChange("capacity")} type="number" min="0" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-navy/40">Nombre de salles de bain</label>
                      <Input value={form.bathrooms_count} onChange={handleChange("bathrooms_count")} type="number" min="0" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-navy/40">Surface (m²)</label>
                      <Input value={form.surface_m2} onChange={handleChange("surface_m2")} type="number" min="0" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-navy/40">Check-in</label>
                      <Input value={form.check_in_time} onChange={handleChange("check_in_time")} placeholder="17:00" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-navy/40">Check-out</label>
                      <Input value={form.check_out_time} onChange={handleChange("check_out_time")} placeholder="10:00" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-navy/40">Collection</label>
                      <select
                        value={form.collection_tier}
                        onChange={(e) => setForm((prev) => ({ ...prev, collection_tier: e.target.value }))}
                        className="h-10 w-full rounded-xl border border-navy/10 bg-white px-3 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/30"
                      >
                        <option value="signature">Signature</option>
                        <option value="iconic">Iconic</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-navy/40">Description immersive</label>
                    <textarea
                      className="min-h-[160px] w-full rounded-2xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40 transition-all"
                      value={form.description}
                      onChange={handleChange("description")}
                      placeholder="Décrivez l'expérience et les atouts de la villa."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest font-bold text-navy/40">Environnement</label>
                    <Input
                      value={form.environment}
                      onChange={handleChange("environment")}
                      placeholder="Ex: En dehors de la ville"
                    />
                  </div>
                </div>

                <div id="content-section-public" className="scroll-mt-28 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Fiche villa publique</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-navy/40">Conditions d&apos;annulation</label>
                      <textarea
                        className="min-h-[80px] w-full rounded-2xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
                        value={form.cancellation_policy}
                        onChange={handleChange("cancellation_policy")}
                        placeholder="Ex: Annulation gratuite jusqu'à 30 jours avant..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-navy/40">Règlement intérieur</label>
                      <textarea
                        className="min-h-[80px] w-full rounded-2xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
                        value={form.house_rules}
                        onChange={handleChange("house_rules")}
                        placeholder="Règles de la maison..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-navy/40">Sécurité & logement</label>
                      <textarea
                        className="min-h-[80px] w-full rounded-2xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
                        value={form.safety_info}
                        onChange={handleChange("safety_info")}
                        placeholder="Infos pratiques, sécurité..."
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-navy/40">Latitude (carte)</label>
                        <Input value={form.latitude} onChange={handleChange("latitude")} type="number" step="any" placeholder="14.4681" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-navy/40">Longitude (carte)</label>
                        <Input value={form.longitude} onChange={handleChange("longitude")} type="number" step="any" placeholder="-61.0392" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-navy/40">Ou URL iframe Google Maps (optionnel)</label>
                      <Input value={form.map_embed_url} onChange={handleChange("map_embed_url")} placeholder="https://www.google.com/maps/embed?pb=..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-navy/40">Points à proximité (1 ligne = 1 item)</label>
                      <textarea
                        className="min-h-[90px] w-full rounded-2xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
                        value={form.nearby_points_text}
                        onChange={handleChange("nearby_points_text")}
                        placeholder={"Plage\nCentre-ville\nRestaurants et bars"}
                      />
                    </div>
                  </div>
                </div>

                <div id="content-section-amenities" className="scroll-mt-28 space-y-5">
                      <div>
                        <h4 className="text-[10px] uppercase tracking-widest font-bold text-navy/40">Équipements</h4>
                        <p className="text-[11px] text-navy/45 leading-snug max-w-2xl mt-2">
                          Le catalogue ci-dessous est <strong className="text-navy/55">toujours visible</strong> dans l’éditeur. Cochez une suggestion pour l’ajouter. L’import OTA ajoute des libellés (souvent hors catalogue) : ils apparaissent en <strong className="text-navy/55">personnalisés</strong> avec la pastille verte « Import » lorsque c’est issu de l’annonce. Enregistrez la villa pour conserver les marques Import.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-navy/40">Suggestions (catalogue)</p>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                          {SUGGESTED_AMENITY_LABELS.map((label) => {
                            const selected = form.amenities.includes(label);
                            const fromOta = form.amenities_import_labels.includes(label);
                            return (
                              <button
                                key={label}
                                type="button"
                                onClick={() => handleToggleSuggestedAmenity(label)}
                                className={`flex min-h-[4rem] flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-center transition-all ${
                                  selected
                                    ? "border-gold bg-gold/10 text-navy shadow-sm"
                                    : "border-navy/10 bg-white text-navy/45 hover:border-navy/20 hover:bg-offwhite/80"
                                }`}
                              >
                                <span className="text-[10px] font-bold leading-tight">{label}</span>
                                {selected && fromOta ? <AmenityImportTag /> : null}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-navy/40">
                          Personnalisés
                          {customAmenityItems.length > 0 ? ` (${customAmenityItems.length})` : ""}
                        </p>
                        <p className="text-[11px] text-navy/45">
                          Équipements qui ne sont pas dans le catalogue (ex. texte exact Airbnb). Pastille violette = ajout manuel ; verte « Import » = présent dans le dernier import.
                        </p>
                        {customAmenityItems.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {customAmenityItems.map((item, idx) => {
                                const fromOta = form.amenities_import_labels.includes(item);
                                return (
                                  <button
                                    key={`${idx}-${item.slice(0, 40)}`}
                                    type="button"
                                    onClick={() => handleRemoveAmenity(item)}
                                    className={`group flex max-w-full items-start gap-1.5 rounded-xl border px-3 py-2 text-left text-xs font-medium transition-all hover:border-red-200 hover:bg-red-50/80 ${
                                      fromOta
                                        ? "border-emerald-400/45 bg-emerald-50/35 text-navy"
                                        : "border-violet-300/55 bg-violet-50/45 text-navy"
                                    }`}
                                    aria-label={`Retirer ${item}`}
                                  >
                                    <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                                      <span className="break-words leading-snug">{item}</span>
                                      <span className="flex flex-wrap items-center gap-1">
                                        {!fromOta ? (
                                          <span className="rounded-md bg-violet-600/12 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-violet-900">
                                            Perso
                                          </span>
                                        ) : null}
                                        {fromOta ? <AmenityImportTag /> : null}
                                      </span>
                                    </span>
                                    <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-navy/35 group-hover:text-red-500" aria-hidden />
                                  </button>
                                );
                              })}
                          </div>
                        ) : (
                          <p className="text-xs text-navy/38 italic rounded-xl border border-dashed border-navy/12 bg-white px-4 py-4 text-center">
                            Aucun libellé hors catalogue — un import les remplira souvent automatiquement.
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Input
                          value={amenityDraft}
                          onChange={(e) => setAmenityDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddAmenityDraft();
                            }
                          }}
                          placeholder="Ajouter un équipement personnalisé…"
                          className="sm:max-w-md rounded-xl"
                        />
                        <Button type="button" variant="outline" size="sm" className="rounded-xl shrink-0" onClick={handleAddAmenityDraft}>
                          Ajouter
                        </Button>
                      </div>
                      <details className="rounded-2xl border border-navy/10 bg-offwhite/50 px-4 py-3">
                        <summary className="cursor-pointer text-[10px] uppercase tracking-widest font-bold text-navy/50">
                          Saisie ou collage multi-lignes
                        </summary>
                        <p className="text-[11px] text-navy/45 mt-3 mb-2">
                          Une ligne = un équipement. Les marques « Import » non présentes dans le texte collé seront retirées pour rester cohérentes.
                        </p>
                        <textarea
                          className="min-h-[120px] w-full rounded-xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
                          value={form.amenities.join("\n")}
                          onChange={(e) => {
                            const next = parseMultilineList(e.target.value);
                            setForm((prev) => ({
                              ...prev,
                              amenities: next,
                              amenities_import_labels: prev.amenities_import_labels.filter((x) => next.includes(x)),
                            }));
                          }}
                          placeholder={"Wifi\nClimatisation\nCuisine équipée"}
                        />
                      </details>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-navy/40">Détail intérieur (optionnel, 1 ligne = 1 item)</label>
                        <p className="text-[11px] text-navy/45 leading-snug">
                          Colonne « Intérieur » sous « Tous les équipements ». Si vide, la fiche utilise la <strong className="text-navy/55">liste équipements</strong> ci-dessus.
                        </p>
                        <textarea
                          className="min-h-[110px] w-full rounded-2xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
                          value={form.equipment_interior_text}
                          onChange={handleChange("equipment_interior_text")}
                          placeholder={"Cuisine équipée\nCheminée\nSmart TV"}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-navy/40">Détail extérieur (optionnel, 1 ligne = 1 item)</label>
                        <p className="text-[11px] text-navy/45 leading-snug">
                          Colonne « Extérieur » (piscine, terrasse, parking…). <strong className="text-navy/55">Pas de recopie</strong> depuis la liste principale : indiquez uniquement l’extérieur.
                        </p>
                        <textarea
                          className="min-h-[110px] w-full rounded-2xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
                          value={form.equipment_exterior_text}
                          onChange={handleChange("equipment_exterior_text")}
                          placeholder={"Piscine chauffée\nJardin arboré\nTerrain de pétanque"}
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-navy/40">Services maison inclus (1 ligne = 1 item)</label>
                        <textarea
                          className="min-h-[110px] w-full rounded-2xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
                          value={form.included_services_home_text}
                          onChange={handleChange("included_services_home_text")}
                          placeholder={"Property Manager\nMénage quotidien"}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest font-bold text-navy/40">Services Collection inclus (1 ligne = 1 item)</label>
                        <textarea
                          className="min-h-[110px] w-full rounded-2xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
                          value={form.included_services_collection_text}
                          onChange={handleChange("included_services_collection_text")}
                          placeholder={"Concierge dédié\nAccueil personnalisé"}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-navy/40">Services à la carte (1 ligne = 1 item)</label>
                      <textarea
                        className="min-h-[90px] w-full rounded-2xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
                        value={form.a_la_carte_services_text}
                        onChange={handleChange("a_la_carte_services_text")}
                        placeholder={"Chef à domicile\nLocation de bateau\nBabysitter"}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-navy/40">Conditions de réservation (format: Question::Réponse, 1 ligne = 1 QA)</label>
                      <textarea
                        className="min-h-[120px] w-full rounded-2xl border border-navy/10 bg-white px-4 py-3 text-sm text-navy focus:outline-none focus:ring-2 focus:ring-gold/40"
                        value={form.booking_terms_text}
                        onChange={handleChange("booking_terms_text")}
                        placeholder={"Comment fonctionne la réservation ?::Vous choisissez la villa puis confirmez avec acompte.\nQuelles sont les conditions d'annulation ?::Jusqu'à 60 jours: 50%. Après: 100%."}
                      />
                    </div>
                </div>

                {/* Détail des chambres */}
                <div id="content-section-rooms" className="scroll-mt-28 space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Détail des Chambres</h4>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddRoom} className="rounded-full h-8 text-[10px]">
                      Ajouter une chambre
                    </Button>
                  </div>
                  <div className="grid gap-4">
                    {form.rooms_details.map((room, index) => (
                      <div key={index} className="flex items-start gap-4 rounded-2xl border border-navy/5 bg-offwhite p-4">
                        <div className="flex-1 space-y-3">
                          <Input 
                            value={room.title} 
                            onChange={(e) => handleRoomChange(index, 'title', e.target.value)}
                            placeholder="Ex: Suite Master"
                            className="bg-transparent border-none font-bold text-navy h-auto p-0 focus-visible:ring-0"
                          />
                          <Input 
                            value={room.description} 
                            onChange={(e) => handleRoomChange(index, 'description', e.target.value)}
                            placeholder="Ex: 1 Lit King Size, Terrasse privée"
                            className="bg-transparent border-none text-xs text-navy/60 h-auto p-0 focus-visible:ring-0"
                          />
                        </div>
                        <button onClick={() => handleRemoveRoom(index)} className="text-navy/20 hover:text-red-500">
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <div id="content-section-media" className="scroll-mt-28 space-y-6">
                  <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Visuels</h4>
                  <div className="rounded-[32px] border border-navy/5 bg-offwhite p-6">
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[24px] bg-navy/10 shadow-inner">
                      <Image
                        src={form.image_url || form.image_urls[0] || "/villa-hero.jpg"}
                        alt={form.name || "Villa"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-widest text-navy/40">Aperçu Principal</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-navy/40">Galerie Photos</label>
                      <span className="text-[10px] font-bold text-navy/20">{form.image_urls.length} images (glissez pour ordonner)</span>
                    </div>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={form.image_urls}
                        strategy={rectSortingStrategy}
                      >
                        <div className="grid grid-cols-3 gap-3">
                          {form.image_urls.map((url) => (
                            <SortableImage
                              key={url}
                              url={url}
                              isPrimary={form.image_url === url}
                              onSetPrimary={handleSetPrimary}
                              onRemove={handleRemoveImage}
                            />
                          ))}
                          <input
                            id="villa-images-input"
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={handleAddImagesClick}
                            disabled={uploading}
                            className="flex aspect-square flex-col items-center justify-center rounded-2xl border-2 border-dashed border-navy/10 text-navy/20 hover:border-gold hover:text-gold transition-all"
                          >
                            {uploading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-gold border-t-transparent" /> : <Plus size={24} />}
                          </button>
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                </div>

                <div id="content-section-import" className="scroll-mt-28 rounded-[32px] border border-navy/5 bg-white p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Import annonce (OTA)</h4>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-gold">
                      <Wand2 size={16} />
                    </div>
                  </div>
                  <p className="text-xs text-navy/60 leading-relaxed mb-6">
                    Collez le lien public de votre fiche (Airbnb, Booking, Abritel, etc.). Les métadonnées et le texte de
                    page sont analysés ; optionnellement, l&apos;IA complète les champs encore vides (n8n ou OpenAI selon
                    la config serveur).
                  </p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-navy/40">
                        URL de l&apos;annonce
                      </label>
                      <Input 
                        value={form.airbnb_url} 
                        onChange={handleChange("airbnb_url")} 
                        placeholder="https://www.airbnb.com/rooms/… ou booking.com/hotel/…" 
                        className="rounded-xl" 
                      />
                    </div>
                    <label className="flex cursor-pointer items-start gap-3 text-left">
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-navy/25 text-gold focus:ring-gold"
                        checked={importUseAi}
                        onChange={(e) => setImportUseAi(e.target.checked)}
                      />
                      <span className="text-xs leading-relaxed text-navy/70">
                        Compléter avec l&apos;IA les informations manquantes (après extraction automatique). Nécessite{" "}
                        <code className="rounded bg-navy/5 px-1">LISTING_IMPORT_N8N_WEBHOOK_URL</code> ou{" "}
                        <code className="rounded bg-navy/5 px-1">LISTING_IMPORT_OPENAI_API_KEY</code> sur le serveur.
                      </span>
                    </label>
                    <Button 
                      onClick={handleAirbnbImport} 
                      disabled={importingAirbnb || !form.airbnb_url}
                      className="w-full rounded-xl bg-navy text-white hover:bg-gold hover:text-navy transition-all h-12 font-bold uppercase tracking-widest text-[10px] gap-2"
                    >
                      {importingAirbnb ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          Importation...
                        </>
                      ) : (
                        <>
                          <Wand2 size={14} />
                          Importer les détails
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div id="content-section-connectivity" className="scroll-mt-28 rounded-[32px] border border-navy/5 bg-white p-8 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Liens Externes & Sync</h4>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Connecté</span>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-navy/40">URL iCal (Airbnb/Booking)</label>
                      <div className="flex gap-3">
                        <Input value={form.ical_url} onChange={handleChange("ical_url")} placeholder="https://..." className="rounded-xl flex-1" />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleSyncIcal}
                          className="rounded-xl border-navy/10 hover:bg-navy hover:text-white transition-all"
                        >
                          <RefreshCw size={14} className={saving ? "animate-spin" : ""} />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest font-bold text-navy/40">Access Token Privé</label>
                      <Input value={form.access_token} onChange={handleChange("access_token")} placeholder="Token de sécurité" className="rounded-xl" />
                    </div>
                  </div>
                  <IcalConnectivityStatus
                    lastLine={icalSyncSummary.lastLine}
                    body={icalSyncSummary.body}
                    tone={icalSyncSummary.tone}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="rounded-[40px] border border-navy/5 bg-white p-8 shadow-sm outline-none space-y-8">
            <div className="flex flex-col gap-2">
              <h3 className="font-display text-3xl text-navy">Gestion Financière & Tarifs</h3>
              <p className="text-navy/60">Configurez vos prix saisonniers et consultez les performances de {villa?.name}.</p>
            </div>

            <div className="grid gap-12 lg:grid-cols-[1fr_350px]">
              <div className="space-y-10">
                {/* Statistiques */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-3xl bg-offwhite p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-navy/40 mb-1">Revenus (30j)</p>
                    <p className="text-2xl font-bold text-navy">€{stats.revenue.toLocaleString()}</p>
                  </div>
                  <div className="rounded-3xl bg-offwhite p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-navy/40 mb-1">Occupation</p>
                    <p className="text-2xl font-bold text-navy">{stats.occupancy}%</p>
                  </div>
                  <div className="rounded-3xl bg-offwhite p-6">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-navy/40 mb-1">Total Résas</p>
                    <p className="text-2xl font-bold text-navy">{stats.count}</p>
                  </div>
                </div>

                {/* Tarifs Saisonniers */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Tarifs Saisonniers</h4>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddSeasonalPrice} className="rounded-full h-8 text-[10px]">
                      Ajouter une période
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {form.seasonal_prices.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-navy/10 p-12 text-center text-navy/40 text-sm">
                        Aucun tarif saisonnier configuré. La villa utilisera le prix par nuit par défaut.
                      </div>
                    ) : (
                      form.seasonal_prices.map((period, index) => (
                        <div key={index} className="flex flex-col gap-4 rounded-3xl border border-navy/5 bg-offwhite p-6 md:flex-row md:items-center">
                          <div className="flex-1 space-y-2">
                            <label className="text-[8px] uppercase tracking-widest font-bold text-navy/40">Nom de la saison</label>
                            <Input 
                              value={period.name} 
                              onChange={(e) => handleSeasonalPriceChange(index, 'name', e.target.value)}
                              placeholder="Ex: Été 2026"
                              className="bg-white border-none font-bold"
                            />
                          </div>
                          <div className="w-full md:w-32 space-y-2">
                            <label className="text-[8px] uppercase tracking-widest font-bold text-navy/40">Début</label>
                            <Input 
                              type="date"
                              value={period.start_date} 
                              onChange={(e) => handleSeasonalPriceChange(index, 'start_date', e.target.value)}
                              className="bg-white border-none"
                            />
                          </div>
                          <div className="w-full md:w-32 space-y-2">
                            <label className="text-[8px] uppercase tracking-widest font-bold text-navy/40">Fin</label>
                            <Input 
                              type="date"
                              value={period.end_date} 
                              onChange={(e) => handleSeasonalPriceChange(index, 'end_date', e.target.value)}
                              className="bg-white border-none"
                            />
                          </div>
                          <div className="w-full md:w-24 space-y-2">
                            <label className="text-[8px] uppercase tracking-widest font-bold text-navy/40">Prix (€)</label>
                            <Input 
                              type="number"
                              value={period.price} 
                              onChange={(e) => handleSeasonalPriceChange(index, 'price', e.target.value)}
                              placeholder="1200"
                              className="bg-white border-none font-bold text-gold"
                            />
                          </div>
                          <button onClick={() => handleRemoveSeasonalPrice(index)} className="mt-6 text-navy/20 hover:text-red-500">
                            <X size={18} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-[32px] bg-navy p-8 text-white">
                  <h4 className="font-display text-xl mb-4">Optimisation du Prix</h4>
                  <p className="text-sm text-white/60 leading-relaxed mb-6">
                    Les périodes configurées ici surchargeront automatiquement votre prix de base de <strong>€{form.price_per_night || '0'}</strong>.
                  </p>
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gold mb-2">Conseil Conciergerie</p>
                    <p className="text-xs text-white/40 italic">
                      Anticipez la haute saison (vacances scolaires françaises, carnaval, fin d&apos;année) et les pics de demande locale : gardez un prix de base raisonnable hors saison et ajustez à la hausse quand la demande monte en Martinique.
                    </p>
                  </div>
                </div>

                <Link
                  href="/dashboard/proprio/analytics"
                  className="flex items-center gap-4 rounded-[32px] border border-navy/10 bg-offwhite p-6 shadow-sm transition-colors hover:border-gold/30 hover:bg-white"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gold/10 text-gold">
                    <BarChart3 className="h-6 w-6" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-navy/40">Analyses</p>
                    <p className="font-display text-lg text-navy">Vue multi-villas</p>
                    <p className="text-xs text-navy/50">Indicateurs réels sur l&apos;ensemble de vos biens.</p>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0 text-navy/30" aria-hidden />
                </Link>
              </div>
            </div>

            <div className="rounded-[40px] border border-navy/5 bg-white p-8 shadow-sm mt-12">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="font-display text-3xl text-navy">Carnet de maintenance</h3>
                  <p className="text-sm text-navy/40">Suivez les tâches et l&apos;entretien de la propriété.</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold">
                  <ListChecks aria-hidden />
                </div>
              </div>

              <div className="flex gap-3 mb-10">
                <Input
                  ref={maintenanceTaskInputRef}
                  placeholder="Ajouter une tâche (ex: Nettoyage piscine)..."
                  className="rounded-2xl border-navy/10 h-14"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const v = e.currentTarget.value.trim()
                      if (!v) return
                      void handleAddTask(v).then(() => {
                        e.currentTarget.value = ""
                      })
                    }
                  }}
                />
                <Button
                  type="button"
                  className="h-14 rounded-2xl bg-navy px-8 font-bold uppercase tracking-widest text-[10px]"
                  onClick={async () => {
                    const el = maintenanceTaskInputRef.current
                    if (!el) return
                    const v = el.value.trim()
                    if (!v) return
                    await handleAddTask(v)
                    el.value = ""
                  }}
                >
                  Ajouter
                </Button>
              </div>

              <div className="space-y-4">
                {tasks.length === 0 ? (
                  <div className="py-12 text-center text-navy/40 italic">
                    Aucune tâche en cours. Tout est en ordre.
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between rounded-2xl border border-navy/5 bg-offwhite p-5 group transition-all hover:shadow-md">
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => handleToggleTask(task.id, task.status)}
                          className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                            task.status === 'completed'
                              ? "bg-emerald-500 border-emerald-500 text-white"
                              : "border-navy/10 bg-white"
                          }`}
                        >
                          {task.status === 'completed' && <Check size={14} />}
                        </button>
                        <span className={`text-sm font-medium transition-all ${
                          task.status === 'completed' ? "text-navy/30 line-through" : "text-navy"
                        }`}>
                          {task.content}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-navy/10 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                        aria-label="Supprimer la tâche"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
