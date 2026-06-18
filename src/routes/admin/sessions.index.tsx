import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { SessionTemplateDetailsModal } from "@/components/admin/SessionTemplateDetailsModal";

export const Route = createFileRoute("/admin/sessions/")({
  component: AdminSessionsList,
});

import { useQuery } from "@tanstack/react-query";
import { getAdminSessionTypesFn } from "@/lib/api/admin.functions";

function AdminSessionsList() {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["admin-session-types"],
    queryFn: async () => await getAdminSessionTypesFn(),
  });

  const openModal = (template: any) => {
    setSelectedTemplate(template);
    setIsModalOpen(true);
  };

  const displayTemplates = templates || [];
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Session Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your offering categories, pricing, and durations.
          </p>
        </div>
        <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link to="/admin/sessions/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Template
          </Link>
        </Button>
      </div>

      <div className="rounded-md border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-[300px]">Template Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Loading templates...
                </TableCell>
              </TableRow>
            ) : displayTemplates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No templates found.
                </TableCell>
              </TableRow>
            ) : (
              displayTemplates.map((template: any) => (
              <TableRow 
                key={template.id} 
                className="border-border/50 hover:bg-muted/50 cursor-pointer"
                onClick={() => openModal(template)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${template.color}`} />
                    {template.title}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{template.location_name}</TableCell>
                <TableCell>{template.duration_minutes} min</TableCell>
                <TableCell>€{template.pricing}</TableCell>
                <TableCell>
                  <Badge
                    variant={template.is_active ? "default" : "secondary"}
                    className={
                      template.is_active
                        ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20"
                    }
                  >
                    {template.is_active ? "active" : "draft"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); openModal(template); }}>
                    <span className="sr-only">View template</span>
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SessionTemplateDetailsModal
        template={selectedTemplate}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
