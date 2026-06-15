export type Focus = "Strength" | "Conditioning" | "Mobility";
export type Location = "Studio" | "Outdoor";

export type Slot = {
  day: string;
  time: string;
  name: string;
  focus: Focus;
  location: Location;
  area: string;
  duration: string;
  open: boolean;
};

export const FEATURED_SLOTS: Slot[] = [
  {
    day: "Mon",
    time: "07:00",
    name: "Morning Strength",
    focus: "Strength",
    location: "Studio",
    area: "Eixample Studio",
    duration: "60 min",
    open: true,
  },
  {
    day: "Tue",
    time: "07:00",
    name: "Beach Conditioning",
    focus: "Conditioning",
    location: "Outdoor",
    area: "Barceloneta",
    duration: "45 min",
    open: true,
  },
  {
    day: "Wed",
    time: "18:30",
    name: "Upper Body",
    focus: "Strength",
    location: "Studio",
    area: "Eixample Studio",
    duration: "60 min",
    open: false,
  },
  {
    day: "Thu",
    time: "07:00",
    name: "Beach Strength",
    focus: "Strength",
    location: "Outdoor",
    area: "Barceloneta",
    duration: "60 min",
    open: true,
  },
  {
    day: "Fri",
    time: "09:30",
    name: "Montjuïc Hills",
    focus: "Conditioning",
    location: "Outdoor",
    area: "Montjuïc",
    duration: "60 min",
    open: true,
  },
  {
    day: "Sat",
    time: "10:00",
    name: "Open Studio Strength",
    focus: "Strength",
    location: "Studio",
    area: "Eixample Studio",
    duration: "60 min",
    open: true,
  },
];
