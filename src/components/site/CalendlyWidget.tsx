import { useEffect, useState, useRef } from "react";
import { Loader2, AlertCircle, ExternalLink } from "lucide-react";

// Extend global window type for Calendly API
declare global {
  interface Window {
    Calendly?: {
      initInlineWidget: (options: {
        url: string;
        parentElement: HTMLElement | null;
        prefill?: Record<string, any>;
        pageSettings?: Record<string, any>;
        utm?: Record<string, any>;
      }) => void;
      initPopupWidget: (options: {
        url: string;
        prefill?: Record<string, any>;
        pageSettings?: Record<string, any>;
        utm?: Record<string, any>;
      }) => void;
    };
  }
}

// React Custom Hook to load Calendly JS and CSS assets asynchronously on-demand
export function useCalendlyScript() {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // If Calendly is already available globally, set loaded to true
    if (window.Calendly) {
      setLoaded(true);
      return;
    }

    // Check if the script tag is already in DOM to avoid duplicate injection
    const existingScript = document.querySelector(
      'script[src="https://assets.calendly.com/assets/external/widget.js"]'
    );

    const handleLoad = () => setLoaded(true);
    const handleError = () => setError(true);

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad);
      existingScript.addEventListener("error", handleError);
      return () => {
        existingScript.removeEventListener("load", handleLoad);
        existingScript.removeEventListener("error", handleError);
      };
    }

    // Ingress the stylesheet
    const link = document.createElement("link");
    link.href = "https://assets.calendly.com/assets/external/widget.css";
    link.rel = "stylesheet";
    document.head.appendChild(link);

    // Ingress the script
    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);
    document.head.appendChild(script);

    // Set a timeout fallback (5 seconds) to catch adblockers that block the load event silently
    const timeoutId = setTimeout(() => {
      if (!window.Calendly) {
        setError(true);
      }
    }, 5000);

    return () => {
      clearTimeout(timeoutId);
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };
  }, []);

  return { loaded, error };
}

interface CalendlyPrefill {
  name?: string;
  email?: string;
  customAnswers?: Record<string, string>;
}

interface CalendlyInlineProps {
  url?: string;
  prefill?: CalendlyPrefill;
  className?: string;
}

export function CalendlyInline({
  url = import.meta.env.VITE_CALENDLY_URL || "",
  prefill,
  className = "",
}: CalendlyInlineProps) {
  const { loaded, error } = useCalendlyScript();
  const containerRef = useRef<HTMLDivElement>(null);
  const [initError, setInitError] = useState(false);

  useEffect(() => {
    // Only initialize when script is loaded, container exists, and no errors
    if (!loaded || !containerRef.current || error) return;

    // If an iframe is already rendered, do not re-initialize (prevents reloads on window focus/tab change)
    if (containerRef.current.querySelector("iframe")) {
      return;
    }

    // Clear any existing children to prevent duplicate widgets on re-renders
    containerRef.current.innerHTML = "";

    try {
      if (window.Calendly) {
        // Enforce dark branding to match our site design
        const primaryColor = "fe7222";
        const textColor = "f8f8f8";
        const backgroundColor = "0c0d0f";

        // Append query parameters to the URL to force the dark theme in the iframe
        let finalUrl = url;
        try {
          const urlObj = new URL(url);
          urlObj.searchParams.set("primary_color", primaryColor);
          urlObj.searchParams.set("text_color", textColor);
          urlObj.searchParams.set("background_color", backgroundColor);
          urlObj.searchParams.set("hide_gdpr_banner", "1");
          finalUrl = urlObj.toString();
        } catch (e) {
          const separator = url.includes("?") ? "&" : "?";
          finalUrl = `${url}${separator}primary_color=${primaryColor}&text_color=${textColor}&background_color=${backgroundColor}&hide_gdpr_banner=1`;
        }

        window.Calendly.initInlineWidget({
          url: finalUrl,
          parentElement: containerRef.current,
          prefill: prefill ? {
            name: prefill.name,
            email: prefill.email,
            customAnswers: prefill.customAnswers,
          } : undefined,
          pageSettings: {
            hideLandingPageDetails: false,
            hideGdprBanner: true, // We already manage cookie warnings on our own terms
            primaryColor: primaryColor,
            textColor: textColor,
            backgroundColor: backgroundColor,
          },
        });
      } else {
        setInitError(true);
      }
    } catch (err) {
      console.error("Failed to initialize Calendly Inline Widget:", err);
      setInitError(true);
    }
  }, [loaded, url, prefill, error]);

  // Render direct link fallback if script fails to load (e.g. adblockers) or initialization errors occur
  if (error || initError) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 text-center rounded-xl border border-border bg-surface/30 max-w-xl mx-auto space-y-4 animate-in fade-in duration-300 ${className}`}>
        <div className="p-3 bg-destructive/10 rounded-full border border-destructive/20 text-destructive">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-lg text-foreground">Connection Blocked</h3>
          <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
            It looks like your browser settings or adblocker is preventing the booking interface from loading. 
            You can still book a session directly on Calendly in a new tab.
          </p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center justify-center gap-2 rounded bg-accent px-5 text-xs font-semibold uppercase tracking-wider text-accent-foreground transition hover:opacity-90 cursor-pointer"
        >
          Open Calendly Booking <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    );
  }

  return (
    <div 
      className={`relative w-full rounded-xl overflow-hidden border border-border/10 bg-[#0c0d0f] ${className}`}
      style={{ colorScheme: "dark" }}
    >
      {/* Loading Skeleton */}
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0c0d0f] backdrop-blur-sm z-10 space-y-3 min-h-[500px] md:min-h-[600px]">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Loading scheduler...
          </span>
        </div>
      )}

      {/* Target Container for Calendly Widget */}
      <div
        ref={containerRef}
        className="w-full h-full min-h-[500px] md:min-h-[600px]"
        style={{ colorScheme: "dark" }}
        data-testid="calendly-inline-container"
      />
    </div>
  );
}

interface CalendlyPopupTriggerProps {
  url?: string;
  prefill?: CalendlyPrefill;
  children: (props: { onClick: () => void; isLoading: boolean }) => React.ReactNode;
}

export function CalendlyPopupTrigger({
  url = import.meta.env.VITE_CALENDLY_URL || "",
  prefill,
  children,
}: CalendlyPopupTriggerProps) {
  const { loaded, error } = useCalendlyScript();
  const [loadingPopup, setLoadingPopup] = useState(false);

  const handleTrigger = () => {
    // If script failed to load, open directly in a new tab
    if (error) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }

    if (!loaded) {
      setLoadingPopup(true);
      // Wait for script to load or timeout
      const checkScript = setInterval(() => {
        if (window.Calendly) {
          clearInterval(checkScript);
          setLoadingPopup(false);
          openPopup();
        }
      }, 100);

      setTimeout(() => {
        clearInterval(checkScript);
        setLoadingPopup(false);
        // If still not loaded, open in new tab
        if (!window.Calendly) {
          window.open(url, "_blank", "noopener,noreferrer");
        }
      }, 4000);
      return;
    }

    openPopup();
  };

  const openPopup = () => {
    if (window.Calendly) {
      const primaryColor = "fe7222";
      const textColor = "f8f8f8";
      const backgroundColor = "0c0d0f";

      let finalUrl = url;
      try {
        const urlObj = new URL(url);
        urlObj.searchParams.set("primary_color", primaryColor);
        urlObj.searchParams.set("text_color", textColor);
        urlObj.searchParams.set("background_color", backgroundColor);
        urlObj.searchParams.set("hide_gdpr_banner", "1");
        finalUrl = urlObj.toString();
      } catch (e) {
        const separator = url.includes("?") ? "&" : "?";
        finalUrl = `${url}${separator}primary_color=${primaryColor}&text_color=${textColor}&background_color=${backgroundColor}&hide_gdpr_banner=1`;
      }

      window.Calendly.initPopupWidget({
        url: finalUrl,
        prefill: prefill ? {
          name: prefill.name,
          email: prefill.email,
          customAnswers: prefill.customAnswers,
        } : undefined,
        pageSettings: {
          hideLandingPageDetails: false,
          hideGdprBanner: true,
          primaryColor: primaryColor,
          textColor: textColor,
          backgroundColor: backgroundColor,
        },
      });
    }
  };

  return <>{children({ onClick: handleTrigger, isLoading: loadingPopup })}</>;
}
