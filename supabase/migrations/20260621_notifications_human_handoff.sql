-- Agent A escalade : autoriser le type de notif human_handoff
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (
  type = ANY (ARRAY[
    'villa_submission','booking_new','booking_confirmed','ical_error',
    'availability_alert','system','request_update','checkin_reminder',
    'checkout_reminder','new_message','pre_booking','hot_lead','owner_lead',
    'admin_alert','owner_daily_digest','human_handoff'
  ]::text[])
);
