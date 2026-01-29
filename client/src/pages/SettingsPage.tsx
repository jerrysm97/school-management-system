import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAcademicPeriods, useCreateAcademicPeriod, useToggleAcademicPeriod } from "@/hooks/use-academic-periods";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

export default function SettingsPage() {
    return (
        <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-display font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage school configuration and system preferences.</p>
            </div>

            <Tabs defaultValue="general">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="academic">Academic Periods</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>General Information</CardTitle>
                            <CardDescription>Update your school's public profile.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="school-name">School Name</Label>
                                <Input id="school-name" defaultValue="Springfield High School" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">Address</Label>
                                <Input id="address" defaultValue="742 Evergreen Terrace" />
                            </div>
                            <Button>Save Changes</Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>System Preferences</CardTitle>
                            <CardDescription>Configure system behavior.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Maintenance Mode</Label>
                                    <p className="text-sm text-muted-foreground">Disable access for non-admins.</p>
                                </div>
                                <Switch />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Allow Parent Registration</Label>
                                    <p className="text-sm text-muted-foreground">Allow parents to self-register accounts.</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="academic" className="mt-6">
                    <AcademicPeriodsSettings />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function AcademicPeriodsSettings() {
    const { data: periods, isLoading } = useAcademicPeriods();
    const createMutation = useCreateAcademicPeriod();
    const toggleMutation = useToggleAcademicPeriod();
    const { toast } = useToast();
    const [newPeriod, setNewPeriod] = useState({ name: "", startDate: "", endDate: "" });

    const handleCreate = () => {
        if (!newPeriod.name || !newPeriod.startDate || !newPeriod.endDate) {
            toast({ title: "Please fill all fields", variant: "destructive" });
            return;
        }
        createMutation.mutate(newPeriod, {
            onSuccess: () => {
                toast({ title: "Academic Period created" });
                setNewPeriod({ name: "", startDate: "", endDate: "" });
            },
            onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" })
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Academic Periods</CardTitle>
                <CardDescription>Manage semesters, terms, and active sessions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end border p-4 rounded-lg bg-muted/20">
                    <div className="space-y-2">
                        <Label>Period Name</Label>
                        <Input placeholder="e.g. Fall 2024" value={newPeriod.name} onChange={e => setNewPeriod({ ...newPeriod, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input type="date" value={newPeriod.startDate} onChange={e => setNewPeriod({ ...newPeriod, startDate: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input type="date" value={newPeriod.endDate} onChange={e => setNewPeriod({ ...newPeriod, endDate: e.target.value })} />
                    </div>
                    <Button onClick={handleCreate} disabled={createMutation.isPending}>
                        {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Period
                    </Button>
                </div>

                <div className="space-y-4">
                    {isLoading ? <div>Loading...</div> : periods?.map((period: any) => (
                        <div key={period.id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold">{period.name}</h3>
                                    {period.isActive && <Badge>Active</Badge>}
                                </div>
                                <p className="text-sm text-muted-foreground">{new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label className="text-sm text-muted-foreground mr-2">{period.isActive ? "Current" : "Set as Current"}</Label>
                                <Switch
                                    checked={period.isActive}
                                    onCheckedChange={(checked) => toggleMutation.mutate({ id: period.id, isActive: checked })}
                                    disabled={period.isActive} // Cannot deactivate safely without activating another
                                />
                            </div>
                        </div>
                    ))}
                    {periods?.length === 0 && <div className="text-center text-muted-foreground py-8">No academic periods defined.</div>}
                </div>
            </CardContent>
        </Card>
    );
}
