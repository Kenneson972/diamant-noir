export function generateICS(props: {
  villaName: string;
  startDate: string;
  endDate: string;
  checkInTime?: string;
  checkOutTime?: string;
  address?: string;
}) {
  const { villaName, startDate, endDate, checkInTime = "17:00", checkOutTime = "10:00", address } = props;

  const fmt = (d: string, t: string) => {
    const dt = new Date(`${d}T${t}:00`);
    return dt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const start = fmt(startDate, checkInTime);
  const end = fmt(endDate, checkOutTime);

  const location = address ?? "Martinique";
  const description = `Séjour à ${villaName}\\nCheck-in: ${checkInTime}\\nCheck-out: ${checkOutTime}\\nRéservé via Kayvila`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Kayvila//FR",
    "BEGIN:VEVENT",
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `DTSTAMP:${now}`,
    `SUMMARY:Séjour — ${villaName}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadICS(props: Parameters<typeof generateICS>[0]) {
  const ics = generateICS(props);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kayvila-${props.villaName.toLowerCase().replace(/\s+/g, "-")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
