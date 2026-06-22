import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/book-call")({
  beforeLoad: () => {
    throw redirect({
      to: "/",
      search: {
        bookCall: "true",
      },
    });
  },
});
