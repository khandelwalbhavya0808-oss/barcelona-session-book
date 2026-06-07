import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/site/TopBar";
import { Hero } from "@/components/site/Hero";
import { Schedule } from "@/components/site/Schedule";
import { Trust } from "@/components/site/Trust";
import { SocialProof } from "@/components/site/SocialProof";
import { Logistics } from "@/components/site/Logistics";
import { BookingCTA } from "@/components/site/BookingCTA";
import { Footer } from "@/components/site/Footer";

const TITLE = "Alex Moreno — Personal Trainer in Barcelona";
const DESC =
  "Structured 1:1 strength & conditioning sessions in Barcelona — indoor studio and outdoor training. Book a session.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <TopBar />
      <Hero />
      <Schedule />
      <Trust />
      <SocialProof />
      <Logistics />
      <BookingCTA />
      <Footer />
    </main>
  );
}
