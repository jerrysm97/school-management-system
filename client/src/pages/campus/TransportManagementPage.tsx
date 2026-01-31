import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Bus, Route, Users, Plus, MapPin, Phone, User, DollarSign, UserCheck } from "lucide-react";

interface TransportRoute {
    id: number;
    routeName: string;
    vehicleNumber: string | null;
    driverName: string | null;
    driverPhone: string | null;
    costPerTerm: number;
    capacity: number | null;
    startPoint: string | null;
    endPoint: string | null;
    distanceKm: number | null;
}

interface TransportAllocation {
    id: number;
    studentId: number;
    routeId: number;
    pickupPoint: string | null;
    academicPeriodId: number | null;
    startDate: string | null;
    endDate: string | null;
    isActive: boolean;
    financeFeeId: number | null;
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const token = localStorage.getItem("token");
    const res = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export default function TransportManagementPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [addRouteOpen, setAddRouteOpen] = useState(false);
    const [addAllocationOpen, setAddAllocationOpen] = useState(false);

    // Fetch routes
    const { data: routes = [], isLoading } = useQuery<TransportRoute[]>({
        queryKey: ["/api/transport-routes"],
        queryFn: () => fetchWithAuth("/api/transport-routes"),
    });

    // Fetch allocations
    const { data: allocations = [] } = useQuery<TransportAllocation[]>({
        queryKey: ["/api/transport-allocations"],
        queryFn: () => fetchWithAuth("/api/transport-allocations"),
    });

    // Create route mutation
    const createRouteMutation = useMutation({
        mutationFn: (data: Partial<TransportRoute>) => fetchWithAuth("/api/transport-routes", {
            method: "POST",
            body: JSON.stringify(data),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/transport-routes"] });
            setAddRouteOpen(false);
            toast({ title: "Success", description: "Route created successfully" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    // Create allocation mutation
    const createAllocationMutation = useMutation({
        mutationFn: (data: Partial<TransportAllocation>) => fetchWithAuth("/api/transport-allocations", {
            method: "POST",
            body: JSON.stringify(data),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/transport-allocations"] });
            setAddAllocationOpen(false);
            toast({ title: "Success", description: "Student allocated to route" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    // Stats
    const totalRoutes = routes.length;
    const totalCapacity = routes.reduce((sum, r) => sum + (r.capacity || 0), 0);
    const activeStudents = allocations.filter(a => a.isActive).length;
    const totalRevenue = routes.reduce((sum, r) => {
        const studentsOnRoute = allocations.filter(a => a.routeId === r.id && a.isActive).length;
        return sum + (studentsOnRoute * r.costPerTerm);
    }, 0);

    const handleAddRoute = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        createRouteMutation.mutate({
            routeName: formData.get("routeName") as string,
            vehicleNumber: formData.get("vehicleNumber") as string,
            driverName: formData.get("driverName") as string,
            driverPhone: formData.get("driverPhone") as string,
            costPerTerm: parseInt(formData.get("costPerTerm") as string) * 100, // Convert to cents
            capacity: parseInt(formData.get("capacity") as string) || null,
            startPoint: formData.get("startPoint") as string,
            endPoint: formData.get("endPoint") as string,
            distanceKm: parseInt(formData.get("distanceKm") as string) || null,
        });
    };

    const handleAddAllocation = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        createAllocationMutation.mutate({
            studentId: parseInt(formData.get("studentId") as string),
            routeId: parseInt(formData.get("routeId") as string),
            pickupPoint: formData.get("pickupPoint") as string,
            isActive: true,
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                        Transport Management
                    </h1>
                    <p className="text-slate-400 mt-1">Manage bus routes and student transport allocations</p>
                </div>
                <Dialog open={addRouteOpen} onOpenChange={setAddRouteOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                            <Plus className="h-4 w-4 mr-2" /> Add Route
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-slate-800 max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Add New Route</DialogTitle>
                            <DialogDescription>Create a new transport route</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddRoute} className="space-y-4">
                            <div>
                                <Label>Route Name</Label>
                                <Input name="routeName" placeholder="e.g., Route A - Downtown" required className="bg-slate-800 border-slate-700" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Vehicle Number</Label>
                                    <Input name="vehicleNumber" placeholder="e.g., BUS-001" className="bg-slate-800 border-slate-700" />
                                </div>
                                <div>
                                    <Label>Capacity</Label>
                                    <Input name="capacity" type="number" placeholder="e.g., 40" className="bg-slate-800 border-slate-700" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Driver Name</Label>
                                    <Input name="driverName" className="bg-slate-800 border-slate-700" />
                                </div>
                                <div>
                                    <Label>Driver Phone</Label>
                                    <Input name="driverPhone" className="bg-slate-800 border-slate-700" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Start Point</Label>
                                    <Input name="startPoint" className="bg-slate-800 border-slate-700" />
                                </div>
                                <div>
                                    <Label>End Point</Label>
                                    <Input name="endPoint" className="bg-slate-800 border-slate-700" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Cost Per Term ($)</Label>
                                    <Input name="costPerTerm" type="number" required className="bg-slate-800 border-slate-700" />
                                </div>
                                <div>
                                    <Label>Distance (km)</Label>
                                    <Input name="distanceKm" type="number" className="bg-slate-800 border-slate-700" />
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={createRouteMutation.isPending}>
                                {createRouteMutation.isPending ? "Creating..." : "Create Route"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-amber-500/20">
                                <Route className="h-6 w-6 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{totalRoutes}</p>
                                <p className="text-sm text-slate-400">Active Routes</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-orange-500/20">
                                <Bus className="h-6 w-6 text-orange-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{totalCapacity}</p>
                                <p className="text-sm text-slate-400">Total Capacity</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-500/20">
                                <Users className="h-6 w-6 text-green-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{activeStudents}</p>
                                <p className="text-sm text-slate-400">Students Enrolled</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-cyan-500/20">
                                <DollarSign className="h-6 w-6 text-cyan-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">${(totalRevenue / 100).toFixed(0)}</p>
                                <p className="text-sm text-slate-400">Expected Revenue</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="routes" className="space-y-4">
                <TabsList className="bg-slate-800 border-slate-700">
                    <TabsTrigger value="routes">Routes</TabsTrigger>
                    <TabsTrigger value="allocations">Student Allocations</TabsTrigger>
                </TabsList>

                <TabsContent value="routes" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {routes.map((route) => {
                            const studentsOnRoute = allocations.filter(a => a.routeId === route.id && a.isActive).length;
                            const occupancyPercent = route.capacity ? Math.round((studentsOnRoute / route.capacity) * 100) : 0;

                            return (
                                <Card key={route.id} className="border-slate-800 hover:border-amber-500/50 transition-all">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <Bus className="h-5 w-5 text-amber-400" />
                                                {route.routeName}
                                            </CardTitle>
                                            <Badge variant="outline" className="text-amber-400 border-amber-400/30">
                                                {route.vehicleNumber || "No Vehicle"}
                                            </Badge>
                                        </div>
                                        <CardDescription className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {route.startPoint || "Start"} → {route.endPoint || "End"}
                                            {route.distanceKm && <span className="ml-2">({route.distanceKm} km)</span>}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Driver Info */}
                                        {route.driverName && (
                                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                                <User className="h-4 w-4" />
                                                <span>{route.driverName}</span>
                                                {route.driverPhone && (
                                                    <>
                                                        <Phone className="h-3 w-3 ml-2" />
                                                        <span>{route.driverPhone}</span>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {/* Occupancy Bar */}
                                        {route.capacity && (
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs text-slate-400">
                                                    <span>Occupancy</span>
                                                    <span>{studentsOnRoute}/{route.capacity} ({occupancyPercent}%)</span>
                                                </div>
                                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all ${occupancyPercent > 90 ? 'bg-red-500' :
                                                                occupancyPercent > 70 ? 'bg-amber-500' : 'bg-green-500'
                                                            }`}
                                                        style={{ width: `${Math.min(occupancyPercent, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Cost */}
                                        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                                            <span className="text-sm text-slate-400">Cost per Term</span>
                                            <span className="font-semibold text-green-400">${(route.costPerTerm / 100).toFixed(2)}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                        {routes.length === 0 && (
                            <Card className="col-span-full border-dashed border-slate-700">
                                <CardContent className="py-12 text-center">
                                    <Bus className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                                    <p className="text-slate-400">No routes found. Add your first transport route.</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="allocations" className="space-y-4">
                    <div className="flex justify-end">
                        <Dialog open={addAllocationOpen} onOpenChange={setAddAllocationOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm">
                                    <Plus className="h-4 w-4 mr-2" /> Allocate Student
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-slate-900 border-slate-800">
                                <DialogHeader>
                                    <DialogTitle>Allocate Student to Route</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleAddAllocation} className="space-y-4">
                                    <div>
                                        <Label>Student ID</Label>
                                        <Input name="studentId" type="number" required className="bg-slate-800 border-slate-700" />
                                    </div>
                                    <div>
                                        <Label>Route</Label>
                                        <select
                                            name="routeId"
                                            required
                                            className="w-full p-2 bg-slate-800 border border-slate-700 rounded-md text-white"
                                        >
                                            <option value="">Select a route</option>
                                            {routes.map((route) => (
                                                <option key={route.id} value={route.id}>{route.routeName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <Label>Pickup Point</Label>
                                        <Input name="pickupPoint" placeholder="e.g., Main Street Stop" className="bg-slate-800 border-slate-700" />
                                    </div>
                                    <Button type="submit" className="w-full" disabled={createAllocationMutation.isPending}>
                                        {createAllocationMutation.isPending ? "Allocating..." : "Allocate Student"}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow className="border-slate-800">
                                <TableHead>Student ID</TableHead>
                                <TableHead>Route</TableHead>
                                <TableHead>Pickup Point</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Billing</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allocations.map((alloc) => {
                                const route = routes.find(r => r.id === alloc.routeId);
                                return (
                                    <TableRow key={alloc.id} className="border-slate-800">
                                        <TableCell className="font-medium">#{alloc.studentId}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Bus className="h-4 w-4 text-amber-400" />
                                                {route?.routeName || `Route #${alloc.routeId}`}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {alloc.pickupPoint || (
                                                <span className="text-slate-500">Not specified</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={alloc.isActive ? "default" : "secondary"}>
                                                {alloc.isActive ? "Active" : "Inactive"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {alloc.financeFeeId ? (
                                                <Badge className="bg-green-500/20 text-green-400">
                                                    <UserCheck className="h-3 w-3 mr-1" /> Linked
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline">Not Linked</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {allocations.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-slate-400 py-8">
                                        No allocations found. Allocate students to transport routes.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TabsContent>
            </Tabs>
        </div>
    );
}
