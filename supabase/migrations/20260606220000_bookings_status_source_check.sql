-- Aligner contraintes bookings avec le code app (admin annulation, paid, manual)

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'paid', 'refunded'));

ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_source_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_source_check
  CHECK (source IN (
    'airbnb', 'expedia', 'trivago', 'vrbo', 'booking', 'direct',
    'manual', 'ical', 'admin'
  ));
