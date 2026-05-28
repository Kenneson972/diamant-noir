"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { BookingForm } from "@/components/BookingForm";

type DateRange = {
  start: string;
  end: string;
};

type BookingContextType = {
  selectedDates: DateRange | null;
  handleDatesChange: (range: DateRange | null) => void;
};

const BookingContext = createContext<BookingContextType | null>(null);

export const useBookingDates = () => {
  const ctx = useContext(BookingContext);
  if (!ctx) return { selectedDates: null as DateRange | null };
  return ctx;
};

type VillaBookingWrapperProps = {
  villaId: string;
  basePrice: number;
  capacity: number;
  checkInTime: string;
  checkOutTime: string;
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
  children,
}: VillaBookingWrapperProps) => {
  const [selectedDates, setSelectedDates] = useState<DateRange | null>(null);

  const handleDatesChange = useCallback((range: DateRange | null) => {
    setSelectedDates(range);
  }, []);

  const ctxValue = useMemo(
    () => ({ selectedDates, handleDatesChange }),
    [selectedDates, handleDatesChange]
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
export const ConnectedBookingForm = (props: {
  villaId: string;
  basePrice: number;
  capacity: number;
  checkInTime?: string;
  checkOutTime?: string;
  cleaningFeeCents?: number | null;
}) => {
  const { selectedDates } = useBookingDates();

  return (
    <BookingForm
      {...props}
      externalStart={selectedDates?.start}
      externalEnd={selectedDates?.end}
    />
  );
};
