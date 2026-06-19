import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/admin/sessions/schedule")({
  component: RedirectToCreateSession,
});

function RedirectToCreateSession() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/admin/sessions/new", replace: true });
  }, [navigate]);

  return null;
}
