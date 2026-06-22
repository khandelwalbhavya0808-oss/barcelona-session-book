import { createFileRoute, useRouter } from "@tanstack/react-router";
import { TopBar } from "@/components/site/TopBar";
import { Hero } from "@/components/site/Hero";
import { Schedule } from "@/components/site/Schedule";
import { Trust } from "@/components/site/Trust";
import { SocialProof } from "@/components/site/SocialProof";
import { Logistics } from "@/components/site/Logistics";
import { BookingCTA } from "@/components/site/BookingCTA";
import { Footer } from "@/components/site/Footer";
import { CalendlyModal } from "@/components/site/CalendlyModal";
import { useState, useEffect } from "react";
import { z } from "zod";

const TITLE = "Alex Moreno — Personal Trainer in Barcelona";
const DESC =
  "Structured 1:1 strength & conditioning sessions in Barcelona — indoor studio and outdoor training. Book a session.";

const indexSearchSchema = z.object({
  bookCall: z.string().optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: (search) => indexSearchSchema.parse(search),
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
  const { bookCall } = Route.useSearch();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (bookCall === "true") {
      setIsModalOpen(true);
    }
  }, [bookCall]);

  const handleModalClose = (open: boolean) => {
    setIsModalOpen(open);
    if (!open && bookCall === "true") {
      // Clear query parameter from address bar
      router.navigate({
        to: "/",
        search: {},
        replace: true,
      });
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <TopBar />
      <Hero />
      <Schedule />
      <Trust />
      <SocialProof />
      <Logistics />
      <BookingCTA onOpenModal={() => setIsModalOpen(true)} />
      <Footer />

      <CalendlyModal isOpen={isModalOpen} onOpenChange={handleModalClose} />
    </main>
  );
}
