import { useState } from "react";
import { CreditCard, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eyebrow, SectionHeading } from "../primitives";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const invoices = [
  { date: "Aug 1, 2026", amount: "$499.00" },
  { date: "Jul 1, 2026", amount: "$499.00" },
  { date: "Jun 1, 2026", amount: "$499.00" },
];

export function SettingsSection() {
  const [users, setUsers] = useState<User[]>([
    { id: "1", name: "Priya Shah", email: "priya@littlelemon.com", role: "Head of Marketing" },
  ]);
  const [form, setForm] = useState({ name: "", email: "", role: "" });

  function addUser(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setUsers((u) => [...u, { id: crypto.randomUUID(), ...form }]);
    setForm({ name: "", email: "", role: "" });
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Settings"
        title="Workspace settings"
        description="Manage your workspace, the people who receive GrowthOS output, and billing."
        right={<Badge variant="outline">Little Lemon · 3 locations</Badge>}
      />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="users">User access</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-5">
          <Card>
            <CardHeader className="pb-2">
              <p className="text-sm font-medium">Workspace</p>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Workspace name" defaultValue="Little Lemon" />
              <Field label="Primary market" defaultValue="Chicago, IL" />
              <div className="space-y-2">
                <Label>Time zone</Label>
                <Select defaultValue="ct">
                  <SelectTrigger className="bg-card/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ct">America/Chicago (CT)</SelectItem>
                    <SelectItem value="et">America/New_York (ET)</SelectItem>
                    <SelectItem value="mt">America/Denver (MT)</SelectItem>
                    <SelectItem value="pt">America/Los_Angeles (PT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select defaultValue="usd">
                  <SelectTrigger className="bg-card/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="usd">USD ($)</SelectItem>
                    <SelectItem value="cad">CAD ($)</SelectItem>
                    <SelectItem value="eur">EUR (€)</SelectItem>
                    <SelectItem value="gbp">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <p className="text-sm font-medium">Analytics delivery</p>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Brief cadence</Label>
                <Select defaultValue="fri">
                  <SelectTrigger className="bg-card/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fri">Weekly (Fridays)</SelectItem>
                    <SelectItem value="mon">Weekly (Mondays)</SelectItem>
                    <SelectItem value="biweekly">Every two weeks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data freshness target</Label>
                <Select defaultValue="t3">
                  <SelectTrigger className="bg-card/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="t3">T–3 (default)</SelectItem>
                    <SelectItem value="t2">T–2</SelectItem>
                    <SelectItem value="t1">T–1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">User access management</p>
                <Badge variant="muted">{users.length} users</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={addUser} className="grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <Input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <Input placeholder="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
                <Button type="submit">
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </form>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell className="text-muted-foreground">{u.role || "—"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setUsers((list) => list.filter((x) => x.id !== u.id))}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-5">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Current plan</p>
                <Badge variant="brand">Growth</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-2xl font-semibold">
                  $499 <span className="text-sm font-normal text-muted-foreground">/ month</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Up to 10 locations · unlimited connected ad accounts · unified analytics · retrieval agents · decision workflows.
                </p>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Connected locations</span>
                  <span>3 of 10</span>
                </div>
                <Progress value={30} />
              </div>
              <div className="flex gap-2">
                <Button>Upgrade plan</Button>
                <Button variant="outline">Contact sales</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <p className="text-sm font-medium">Payment method</p>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <span className="flex h-10 w-14 items-center justify-center rounded-md border border-border bg-background">
                <CreditCard className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">•••• •••• •••• 4821</p>
                <p className="text-xs text-muted-foreground">Expires 08 / 2027</p>
              </div>
              <Button variant="outline" size="sm">
                Update
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <p className="text-sm font-medium">Billing history</p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.date}>
                      <TableCell className="font-medium">{inv.date}</TableCell>
                      <TableCell className="text-muted-foreground">Growth plan — monthly</TableCell>
                      <TableCell className="text-right tabular-nums">{inv.amount}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="success">Paid</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input defaultValue={defaultValue} />
    </div>
  );
}
