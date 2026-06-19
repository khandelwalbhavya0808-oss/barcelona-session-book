import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/admin/sessions/edit/$typeId")({
  component: RedirectToSessions,
});

function RedirectToSessions() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate({ to: "/admin/sessions", replace: true });
  }, [navigate]);

  return null;
}
