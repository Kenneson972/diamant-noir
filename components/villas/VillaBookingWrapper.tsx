"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { BookingForm } from "@/components/BookingForm";
import { AvailabilityCalendar } from "@/components/booking/AvailabilityCalendar";

type DateRange = {
  start: string;
  end: string;
};

type SeasonalPrice = {
  season: string;
  start: string;
  end: string;
  price: number;
};

type BookingContextType = {
  selectedDates: DateRange | null;
  handleDatesChange: (range: DateRange | null) => void;
  basePrice: number;
  seasonalPrices?: SeasonalPrice[];
};

const BookingContext = createContext<BookingContextType | null>(null);

export const useBookingDates = () => {
  const ctx = useContext(BookingContext);
  if (!ctx) {
    return {
      selectedDates: null as DateRange | null,
      handleDatesChange: (_range: DateRange | null) => {},
      basePrice: 0,
      seasonalPrices: undefined as SeasonalPrice[] | undefined,
    };
  }
  return ctx;
};

type VillaBookingWrapperProps = {
  villaId: string;
  basePrice: number;
  capacity: number;
  checkInTime: string;
  checkOutTime: string;
  seasonalPrices?: SeasonalPrice[];
  children?: React.ReactNode;
};

/**
 * Wrapper client qui connecte le calendrier (sélection de dates)
 * au BookingForm dans la sidebar sticky.
 *
 * Le calendrier est dans la colonne gauche, le formulaire dans
 * la colonne droite. Ce wrapper partage l'état entre les deux
 * via un contexte React.
 */
export const VillaBookingWrapper = ({
  villaId,
  basePrice,
  capacity,
  checkInTime,
  checkOutTime,
  seasonalPrices,
  children,
}: VillaBookingWrapperProps) => {
  const [selectedDates, setSelectedDates] = useState<DateRange | null>(null);

  const handleDatesChange = useCallback((range: DateRange | null) => {
    setSelectedDates(range);
  }, []);

  const ctxValue = useMemo(
    () => ({ selectedDates, handleDatesChange, basePrice, seasonalPrices }),
    [selectedDates, handleDatesChange, basePrice, seasonalPrices]
  );

  return (
    <BookingContext.Provider value={ctxValue}>
      {children}
    </BookingContext.Provider>
  );
};

/**
 * BookingForm qui lit automatiquement les dates sélectionnées
 * dans le calendrier via le contexte.
 */
type BookingFormSharedProps = {
  villaId: string;
  basePrice: number;
  capacity: number;
  checkInTime?: string;
  checkOutTime?: string;
  cleaningFeeCents?: number | null;
  seasonalPrices?: { season: string; start: string; end: string; price: number }[];
};

export const ConnectedAvailabilityCalendar = ({ villaId }: { villaId: string }) => {
  const { handleDatesChange, basePrice, seasonalPrices } = useBookingDates();
  return (
    <AvailabilityCalendar
      villaId={villaId}
      basePrice={basePrice}
      seasonalPrices={seasonalPrices}
      onDatesChange={handleDatesChange}
    />
  );
};

export const ConnectedBookingForm = (props: BookingFormSharedProps) => {
  const { selectedDates } = useBookingDates();

  return (
    <BookingForm
      {...props}
      externalStart={selectedDates?.start}
      externalEnd={selectedDates?.end}
    />
  );
};

export const ConnectedMobileBookingForm = (props: BookingFormSharedProps) => {
  const { selectedDates } = useBookingDates();

  return (
    <BookingForm
      {...props}
      externalStart={selectedDates?.start}
      externalEnd={selectedDates?.end}
    />
  );
};
