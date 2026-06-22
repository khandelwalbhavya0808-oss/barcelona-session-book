import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { CalendlyInline } from "./CalendlyWidget";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Award,
  MapPin,
  Flame,
  Activity,
  HeartPulse,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendlyModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const STORAGE_KEY = "alex_moreno_onboarding_form";

export function CalendlyModal({ isOpen, onOpenChange }: CalendlyModalProps) {
  const { user, profile } = useAuth();

  // Step state: 1 (Contact), 2 (Goal), 3 (Location), 4 (Experience), 5 (Injuries), 6 (Calendly)
  const [step, setStep] = useState(1);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    goal: "",
    location: "",
    experience: "",
    injuries: "",
  });

  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  // 1. Recover form state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({ ...prev, ...parsed.data }));
        setStep(parsed.step || 1);
      }
    } catch (e) {
      console.warn("Failed to load saved onboarding progress:", e);
    }
  }, []);

  // 2. Cache form state in localStorage on changes
  useEffect(() => {
    if (step < 6) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ data: formData, step: step })
      );
    }
  }, [formData, step]);

  // 3. Auto-populate from Supabase auth profile if logged in
  useEffect(() => {
    if (user && isOpen) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || profile?.full_name || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [user, profile, isOpen]);

  // Reset function on complete or close
  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setFormData({
      name: "",
      email: "",
      goal: "",
      location: "",
      experience: "",
      injuries: "",
    });
    setStep(1);
  };

  // Close helper
  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open && step === 6) {
      // Clear data if they successfully reached/completed the booking step
      handleReset();
    }
  };

  // Validation for Step 1
  const validateStep1 = () => {
    const errs: typeof errors = {};
    if (!formData.name.trim()) errs.name = "Full name is required.";
    if (!formData.email.trim()) {
      errs.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = "Please enter a valid email address.";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Check if "Next" button should be disabled for the current step
  const isNextDisabled = () => {
    if (step === 1) return !formData.name.trim() || !formData.email.trim();
    if (step === 2) return !formData.goal;
    if (step === 3) return !formData.location;
    if (step === 4) return !formData.experience;
    return false; // Step 5 is optional notes
  };

  // Navigation handlers
  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !formData.goal) return;
    if (step === 3 && !formData.location) return;
    if (step === 4 && !formData.experience) return;
    setStep((prev) => Math.min(prev + 1, 6));
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const selectOption = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Auto-advance for simple choice inputs (Goals, Location, Experience)
    setTimeout(() => {
      setStep((prev) => Math.min(prev + 1, 6));
    }, 250);
  };

  // Convert answers for Calendly mapping
  const getPrefillData = () => {
    return {
      name: formData.name,
      email: formData.email,
      customAnswers: {
        a1: formData.goal,
        a2: formData.location,
        a3: formData.experience,
        a4: formData.injuries || "None declared",
      },
    };
  };

  const progressPercentage = ((step - 1) / 5) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "bg-surface border-border p-6 shadow-xl transition-all duration-300 ease-in-out text-foreground flex flex-col justify-between",
          step === 6
            ? "w-full max-w-4xl h-[90vh] md:h-[800px] overflow-hidden"
            : "w-full max-w-md max-h-[92vh] overflow-y-auto"
        )}
      >
        <DialogHeader className="space-y-1">
          <DialogTitle className="font-display uppercase tracking-wide text-2xl font-black italic">
            {step === 6 ? "SECURE YOUR SLOT" : "PERSONAL TIMETABLE PREPARATION"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {step === 6
              ? "Select an introduction slot below. Your answers have been mapped."
              : `Step ${step} of 5: Let's gather your training background first.`}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar (Hidden on Calendly Embed Screen) */}
        {step < 6 && (
          <div className="my-2 space-y-1">
            <Progress value={progressPercentage} className="h-1.5 bg-background/60" />
            <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground/80 tracking-wider">
              <span>Profile setup</span>
              <span>Ready for booking</span>
            </div>
          </div>
        )}

        {/* Form Steps */}
        <div
          className={cn(
            "my-4 flex flex-col justify-between",
            step === 6 ? "flex-1 min-h-0" : "min-h-[320px]"
          )}
        >
          <div className={cn("space-y-4", step === 6 && "h-full flex flex-col")}>
            {/* STEP 1: Basic Contact Details */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="p-3 bg-accent/5 border border-accent/15 rounded-md flex items-start gap-2.5">
                  <Sparkles className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Introductory consultations are free. Please fill in your basic details. Logged in clients can edit prefilled credentials.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, name: e.target.value }));
                      if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    placeholder="Enter your name"
                    className={cn(
                      "w-full h-11 bg-background border border-border px-3 rounded-md text-sm outline-none focus:border-accent transition-colors text-foreground",
                      errors.name && "border-destructive"
                    )}
                  />
                  {errors.name && <p className="text-[10px] text-destructive font-semibold">{errors.name}</p>}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, email: e.target.value }));
                      if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    placeholder="Enter your email"
                    className={cn(
                      "w-full h-11 bg-background border border-border px-3 rounded-md text-sm outline-none focus:border-accent transition-colors text-foreground",
                      errors.email && "border-destructive"
                    )}
                  />
                  {errors.email && <p className="text-[10px] text-destructive font-semibold">{errors.email}</p>}
                </div>
              </div>
            )}

            {/* STEP 2: Fitness Goal */}
            {step === 2 && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-3">
                  What is your primary fitness goal?
                </p>

                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    { value: "Strength & Muscle Gain", icon: Flame, desc: "Increase power & build muscle" },
                    { value: "Weight Loss & Conditioning", icon: Activity, desc: "Burn calories & boost stamina" },
                    { value: "Mobility & Rehab", icon: HeartPulse, desc: "Fix posture & recover joint range" },
                    { value: "Athletic Performance", icon: Award, desc: "Sport-specific agility & speed" },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = formData.goal === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => selectOption("goal", opt.value)}
                        className={cn(
                          "flex flex-col items-start p-4 rounded-lg border border-border bg-background/50 hover:border-accent/40 text-left transition-all cursor-pointer",
                          isSelected && "border-accent bg-accent/10 shadow-md"
                        )}
                      >
                        <Icon className={cn("h-5 w-5 mb-2 text-muted-foreground", isSelected && "text-accent")} />
                        <span className="text-sm font-semibold text-foreground">{opt.value}</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{opt.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 3: Location Preference */}
            {step === 3 && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-3">
                  Where do you prefer to train?
                </p>

                <div className="space-y-2">
                  {[
                    { value: "Indoor Studio (Barcelona Centre)", desc: "Private studio environment with premium coaching gear" },
                    { value: "Outdoor (Park/Beach in Barcelona)", desc: "Fresh air, beaches and functional bodyweight drills" },
                    { value: "Online / Home Training", desc: "Digital sessions from the comfort of your living room" },
                  ].map((opt) => {
                    const isSelected = formData.location === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => selectOption("location", opt.value)}
                        className={cn(
                          "w-full flex items-center gap-3 p-4 rounded-lg border border-border bg-background/50 hover:border-accent/40 text-left transition-all cursor-pointer",
                          isSelected && "border-accent bg-accent/10 shadow-md"
                        )}
                      >
                        <MapPin className={cn("h-5 w-5 shrink-0 text-muted-foreground", isSelected && "text-accent")} />
                        <div>
                          <span className="text-sm font-semibold text-foreground block">{opt.value}</span>
                          <span className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{opt.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 4: Experience Level */}
            {step === 4 && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-3">
                  What is your training experience level?
                </p>

                <div className="space-y-2">
                  {[
                    { value: "Beginner (Under 6 months)", desc: "Getting started or returning after a long break. Need proper onboarding." },
                    { value: "Intermediate (1-2 years)", desc: "Comfortable with key patterns. Want to optimize details and load." },
                    { value: "Advanced (3+ years)", desc: "Experienced lifter. Seeking structured athletic cycles or complex lifts." },
                  ].map((opt) => {
                    const isSelected = formData.experience === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => selectOption("experience", opt.value)}
                        className={cn(
                          "w-full p-4 rounded-lg border border-border bg-background/50 hover:border-accent/40 text-left transition-all cursor-pointer",
                          isSelected && "border-accent bg-accent/10 shadow-md"
                        )}
                      >
                        <span className="text-sm font-semibold text-foreground block">{opt.value}</span>
                        <span className="text-[10px] text-muted-foreground mt-1 leading-relaxed block">{opt.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 5: Injuries & Notes */}
            {step === 5 && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <label htmlFor="injuries" className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                  Injuries, Health Conditions, or Limitations
                </label>
                <textarea
                  id="injuries"
                  value={formData.injuries}
                  onChange={(e) => setFormData((prev) => ({ ...prev, injuries: e.target.value }))}
                  placeholder="e.g. Previous knee surgeries, lower back stiffness, asthma, none, etc."
                  rows={4}
                  className="w-full bg-background border border-border p-3 rounded-md text-sm outline-none focus:border-accent transition-colors text-foreground resize-none"
                />
                <div className="p-3 bg-background/30 rounded-md border border-border text-[11px] text-muted-foreground leading-normal mt-2">
                  📝 *Note: This helps the coach select safe exercises during your onboarding assessment.*
                </div>
              </div>
            )}

            {/* STEP 6: Calendly Scheduler Embed */}
            {step === 6 && (
              <div className="animate-in fade-in duration-500 w-full flex-1 min-h-0 bg-[#0c0d0f] rounded-lg p-2 border border-border/10">
                <CalendlyInline prefill={getPrefillData()} className="h-full border-0" />
              </div>
            )}
          </div>

          {/* Form Actions Footer (Hidden on Calendly Embed Screen) */}
          {step < 6 && (
            <div className="mt-8 pt-4 border-t border-border/40 flex items-center justify-between gap-4">
              <button
                onClick={prevStep}
                disabled={step === 1}
                className={cn(
                  "inline-flex h-10 items-center justify-center gap-1 px-4 text-xs font-semibold uppercase tracking-wider rounded border border-border text-foreground hover:bg-background/80 transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                )}
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>

              <button
                onClick={nextStep}
                disabled={isNextDisabled()}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded bg-accent px-5 text-xs font-semibold uppercase tracking-wider text-accent-foreground transition hover:opacity-90 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
              >
                {step === 5 ? "Load Scheduler" : "Next"} <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
