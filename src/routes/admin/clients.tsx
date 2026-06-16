import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, MoreHorizontal, Mail, Eye, Trash2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/clients")({
  component: AdminClientsList,
});

const MOCK_CLIENTS = [
  {
    id: "c1",
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    role: "client",
    joinedDate: "2024-01-15",
    totalBookings: 24,
    status: "active",
    avatar: "",
  },
  {
    id: "c2",
    name: "Michael Chen",
    email: "m.chen@example.com",
    role: "client",
    joinedDate: "2024-03-22",
    totalBookings: 8,
    status: "active",
    avatar: "",
  },
  {
    id: "c3",
    name: "Emma Davis",
    email: "emma.d@example.com",
    role: "user",
    joinedDate: "2024-05-10",
    totalBookings: 0,
    status: "inactive",
    avatar: "",
  },
];

function AdminClientsList() {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage all registered users and active clients.
          </p>
        </div>
        <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
          <Link to="/admin/clients/new" disabled>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Link>
        </Button>
      </div>

      <div className="rounded-md border border-border bg-surface">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-[300px]">Client</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-center">Total Bookings</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_CLIENTS.map((client) => (
              <TableRow key={client.id} className="border-border/50 hover:bg-muted/50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={client.avatar} alt={client.name} />
                      <AvatarFallback className="bg-muted text-[10px]">
                        {getInitials(client.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm">{client.name}</span>
                      <span className="text-xs text-muted-foreground">{client.email}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    {client.role}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{client.joinedDate}</TableCell>
                <TableCell className="text-center font-medium">{client.totalBookings}</TableCell>
                <TableCell>
                  <Badge
                    variant={client.status === "active" ? "default" : "secondary"}
                    className={
                      client.status === "active"
                        ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20"
                        : "bg-muted text-muted-foreground border-border"
                    }
                  >
                    {client.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[180px]">
                      <DropdownMenuItem className="cursor-pointer" asChild>
                        <Link to={`/admin/clients/${client.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer">
                        <Mail className="mr-2 h-4 w-4" />
                        Message Client
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="cursor-pointer">
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        Reset Password
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove Account
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
