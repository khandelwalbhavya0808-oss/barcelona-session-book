export type Focus = "Strength" | "Conditioning" | "Mobility";
export type Location = "Studio" | "Outdoor";

export type Slot = {
  time: string;
  name: string;
  focus: Focus;
  location: Location;
  duration: string;
  open: boolean;
};

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
export type Day = (typeof DAYS)[number];

export const SCHEDULE: Record<Day, Slot[]> = {
  Mon: [
    { time: "07:00", name: "Morning Strength", focus: "Strength", location: "Studio", duration: "60 min", open: true },
    { time: "09:30", name: "Park Conditioning", focus: "Conditioning", location: "Outdoor", duration: "45 min", open: true },
    { time: "18:30", name: "Heavy Lifts", focus: "Strength", location: "Studio", duration: "60 min", open: false },
  ],
  Tue: [
    { time: "07:00", name: "Beach Conditioning", focus: "Conditioning", location: "Outdoor", duration: "45 min", open: true },
    { time: "12:00", name: "Lunch Mobility", focus: "Mobility", location: "Studio", duration: "30 min", open: true },
    { time: "19:00", name: "Lower Body", focus: "Strength", location: "Studio", duration: "60 min", open: true },
  ],
  Wed: [
    { time: "07:00", name: "Morning Strength", focus: "Strength", location: "Studio", duration: "60 min", open: false },
    { time: "10:00", name: "Ciutadella Circuit", focus: "Conditioning", location: "Outdoor", duration: "45 min", open: true },
    { time: "18:30", name: "Upper Body", focus: "Strength", location: "Studio", duration: "60 min", open: true },
  ],
  Thu: [
    { time: "07:00", name: "Beach Strength", focus: "Strength", location: "Outdoor", duration: "60 min", open: true },
    { time: "12:00", name: "Mobility Reset", focus: "Mobility", location: "Studio", duration: "30 min", open: true },
    { time: "19:00", name: "Conditioning Block", focus: "Conditioning", location: "Studio", duration: "45 min", open: false },
  ],
  Fri: [
    { time: "07:00", name: "Full Body", focus: "Strength", location: "Studio", duration: "60 min", open: true },
    { time: "09:30", name: "Montjuïc Hills", focus: "Conditioning", location: "Outdoor", duration: "60 min", open: true },
    { time: "18:00", name: "Week-end Strength", focus: "Strength", location: "Studio", duration: "60 min", open: true },
  ],
  Sat: [
    { time: "08:00", name: "Barceloneta Session", focus: "Conditioning", location: "Outdoor", duration: "60 min", open: true },
    { time: "10:00", name: "Open Studio Strength", focus: "Strength", location: "Studio", duration: "60 min", open: true },
    { time: "11:30", name: "Mobility & Recovery", focus: "Mobility", location: "Studio", duration: "45 min", open: true },
  ],
};
