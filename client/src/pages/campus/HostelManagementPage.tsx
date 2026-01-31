import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Building2, DoorOpen, Users, Plus, BedDouble, Thermometer, UserCheck } from "lucide-react";

interface Hostel {
    id: number;
    name: string;
    type: string;
    capacity: number;
    wardenId: number | null;
    address: string | null;
    status: string;
}

interface HostelRoom {
    id: number;
    hostelId: number;
    roomNumber: string;
    floor: number | null;
    capacity: number;
    occupiedBeds: number;
    costPerTerm: number;
    roomType: string;
    isAc: boolean;
}

interface HostelAllocation {
    id: number;
    studentId: number;
    roomId: number;
    academicPeriodId: number | null;
    checkInDate: string;
    checkOutDate: string | null;
    status: string;
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

export default function HostelManagementPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedHostel, setSelectedHostel] = useState<number | null>(null);
    const [addHostelOpen, setAddHostelOpen] = useState(false);
    const [addRoomOpen, setAddRoomOpen] = useState(false);

    // Fetch hostels
    const { data: hostels = [], isLoading: hostelsLoading } = useQuery<Hostel[]>({
        queryKey: ["/api/hostels"],
        queryFn: () => fetchWithAuth("/api/hostels"),
    });

    // Fetch rooms for selected hostel
    const { data: rooms = [] } = useQuery<HostelRoom[]>({
        queryKey: ["/api/hostel-rooms", selectedHostel],
        queryFn: () => fetchWithAuth(`/api/hostels/${selectedHostel}/rooms`),
        enabled: !!selectedHostel,
    });

    // Fetch allocations
    const { data: allocations = [] } = useQuery<HostelAllocation[]>({
        queryKey: ["/api/hostel-allocations"],
        queryFn: () => fetchWithAuth("/api/hostel-allocations"),
    });

    // Create hostel mutation
    const createHostelMutation = useMutation({
        mutationFn: (data: Partial<Hostel>) => fetchWithAuth("/api/hostels", {
            method: "POST",
            body: JSON.stringify(data),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/hostels"] });
            setAddHostelOpen(false);
            toast({ title: "Success", description: "Hostel created successfully" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    // Create room mutation
    const createRoomMutation = useMutation({
        mutationFn: (data: Partial<HostelRoom>) => fetchWithAuth("/api/hostel-rooms", {
            method: "POST",
            body: JSON.stringify(data),
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["/api/hostel-rooms", selectedHostel] });
            setAddRoomOpen(false);
            toast({ title: "Success", description: "Room created successfully" });
        },
        onError: (error: Error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    // Stats
    const totalCapacity = hostels.reduce((sum, h) => sum + h.capacity, 0);
    const totalRooms = rooms.length;
    const occupiedBeds = rooms.reduce((sum, r) => sum + r.occupiedBeds, 0);
    const availableBeds = rooms.reduce((sum, r) => sum + (r.capacity - r.occupiedBeds), 0);

    const handleAddHostel = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        createHostelMutation.mutate({
            name: formData.get("name") as string,
            type: formData.get("type") as string,
            capacity: parseInt(formData.get("capacity") as string),
            address: formData.get("address") as string,
        });
    };

    const handleAddRoom = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        createRoomMutation.mutate({
            hostelId: selectedHostel!,
            roomNumber: formData.get("roomNumber") as string,
            floor: parseInt(formData.get("floor") as string) || 0,
            capacity: parseInt(formData.get("capacity") as string),
            costPerTerm: parseInt(formData.get("costPerTerm") as string) * 100, // Convert to cents
            roomType: formData.get("roomType") as string,
            isAc: formData.get("isAc") === "true",
        });
    };

    if (hostelsLoading) {
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
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                        Hostel Management
                    </h1>
                    <p className="text-slate-400 mt-1">Manage hostels, rooms, and student allocations</p>
                </div>
                <Dialog open={addHostelOpen} onOpenChange={setAddHostelOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600">
                            <Plus className="h-4 w-4 mr-2" /> Add Hostel
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900 border-slate-800">
                        <DialogHeader>
                            <DialogTitle>Add New Hostel</DialogTitle>
                            <DialogDescription>Create a new hostel building</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddHostel} className="space-y-4">
                            <div>
                                <Label>Hostel Name</Label>
                                <Input name="name" required className="bg-slate-800 border-slate-700" />
                            </div>
                            <div>
                                <Label>Type</Label>
                                <Select name="type" defaultValue="Co-Ed">
                                    <SelectTrigger className="bg-slate-800 border-slate-700">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Boys">Boys</SelectItem>
                                        <SelectItem value="Girls">Girls</SelectItem>
                                        <SelectItem value="Co-Ed">Co-Ed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Total Capacity</Label>
                                <Input name="capacity" type="number" required className="bg-slate-800 border-slate-700" />
                            </div>
                            <div>
                                <Label>Address</Label>
                                <Input name="address" className="bg-slate-800 border-slate-700" />
                            </div>
                            <Button type="submit" className="w-full" disabled={createHostelMutation.isPending}>
                                {createHostelMutation.isPending ? "Creating..." : "Create Hostel"}
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border-indigo-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-indigo-500/20">
                                <Building2 className="h-6 w-6 text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{hostels.length}</p>
                                <p className="text-sm text-slate-400">Total Hostels</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border-cyan-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-cyan-500/20">
                                <DoorOpen className="h-6 w-6 text-cyan-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{totalRooms}</p>
                                <p className="text-sm text-slate-400">Total Rooms</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-500/20">
                                <BedDouble className="h-6 w-6 text-green-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{availableBeds}</p>
                                <p className="text-sm text-slate-400">Available Beds</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/20">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-amber-500/20">
                                <Users className="h-6 w-6 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-white">{occupiedBeds}</p>
                                <p className="text-sm text-slate-400">Occupied Beds</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="hostels" className="space-y-4">
                <TabsList className="bg-slate-800 border-slate-700">
                    <TabsTrigger value="hostels">Hostels</TabsTrigger>
                    <TabsTrigger value="rooms">Rooms</TabsTrigger>
                    <TabsTrigger value="allocations">Allocations</TabsTrigger>
                </TabsList>

                <TabsContent value="hostels" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {hostels.map((hostel) => (
                            <Card
                                key={hostel.id}
                                className={`cursor-pointer transition-all hover:border-indigo-500/50 ${selectedHostel === hostel.id ? "border-indigo-500" : "border-slate-800"
                                    }`}
                                onClick={() => setSelectedHostel(hostel.id)}
                            >
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-lg">{hostel.name}</CardTitle>
                                        <Badge variant={hostel.status === "active" ? "default" : "secondary"}>
                                            {hostel.status}
                                        </Badge>
                                    </div>
                                    <CardDescription>{hostel.address || "No address"}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-1">
                                            <Users className="h-4 w-4 text-slate-400" />
                                            <span>Capacity: {hostel.capacity}</span>
                                        </div>
                                        <Badge variant="outline">{hostel.type}</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="rooms" className="space-y-4">
                    {selectedHostel ? (
                        <>
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">
                                    Rooms in {hostels.find(h => h.id === selectedHostel)?.name}
                                </h3>
                                <Dialog open={addRoomOpen} onOpenChange={setAddRoomOpen}>
                                    <DialogTrigger asChild>
                                        <Button size="sm">
                                            <Plus className="h-4 w-4 mr-2" /> Add Room
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-slate-900 border-slate-800">
                                        <DialogHeader>
                                            <DialogTitle>Add New Room</DialogTitle>
                                        </DialogHeader>
                                        <form onSubmit={handleAddRoom} className="space-y-4">
                                            <div>
                                                <Label>Room Number</Label>
                                                <Input name="roomNumber" required className="bg-slate-800 border-slate-700" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Floor</Label>
                                                    <Input name="floor" type="number" className="bg-slate-800 border-slate-700" />
                                                </div>
                                                <div>
                                                    <Label>Capacity</Label>
                                                    <Input name="capacity" type="number" defaultValue="2" className="bg-slate-800 border-slate-700" />
                                                </div>
                                            </div>
                                            <div>
                                                <Label>Cost Per Term ($)</Label>
                                                <Input name="costPerTerm" type="number" required className="bg-slate-800 border-slate-700" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <Label>Room Type</Label>
                                                    <Select name="roomType" defaultValue="double">
                                                        <SelectTrigger className="bg-slate-800 border-slate-700">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="single">Single</SelectItem>
                                                            <SelectItem value="double">Double</SelectItem>
                                                            <SelectItem value="dormitory">Dormitory</SelectItem>
                                                            <SelectItem value="studio">Studio</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label>AC Room?</Label>
                                                    <Select name="isAc" defaultValue="false">
                                                        <SelectTrigger className="bg-slate-800 border-slate-700">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="true">Yes</SelectItem>
                                                            <SelectItem value="false">No</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <Button type="submit" className="w-full" disabled={createRoomMutation.isPending}>
                                                {createRoomMutation.isPending ? "Creating..." : "Create Room"}
                                            </Button>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-slate-800">
                                        <TableHead>Room</TableHead>
                                        <TableHead>Floor</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Capacity</TableHead>
                                        <TableHead>Occupied</TableHead>
                                        <TableHead>Cost/Term</TableHead>
                                        <TableHead>Features</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rooms.map((room) => (
                                        <TableRow key={room.id} className="border-slate-800">
                                            <TableCell className="font-medium">{room.roomNumber}</TableCell>
                                            <TableCell>{room.floor || "-"}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{room.roomType}</Badge>
                                            </TableCell>
                                            <TableCell>{room.capacity}</TableCell>
                                            <TableCell>
                                                <span className={room.occupiedBeds >= room.capacity ? "text-red-400" : "text-green-400"}>
                                                    {room.occupiedBeds}/{room.capacity}
                                                </span>
                                            </TableCell>
                                            <TableCell>${(room.costPerTerm / 100).toFixed(2)}</TableCell>
                                            <TableCell>
                                                {room.isAc && (
                                                    <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
                                                        <Thermometer className="h-3 w-3 mr-1" /> AC
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {rooms.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                                                No rooms found. Add rooms to this hostel.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </>
                    ) : (
                        <Card className="border-dashed border-slate-700">
                            <CardContent className="py-12 text-center">
                                <DoorOpen className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400">Select a hostel to view and manage rooms</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="allocations" className="space-y-4">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-slate-800">
                                <TableHead>Student ID</TableHead>
                                <TableHead>Room ID</TableHead>
                                <TableHead>Check In</TableHead>
                                <TableHead>Check Out</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Billing</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allocations.map((alloc) => (
                                <TableRow key={alloc.id} className="border-slate-800">
                                    <TableCell className="font-medium">#{alloc.studentId}</TableCell>
                                    <TableCell>Room #{alloc.roomId}</TableCell>
                                    <TableCell>{alloc.checkInDate}</TableCell>
                                    <TableCell>{alloc.checkOutDate || "—"}</TableCell>
                                    <TableCell>
                                        <Badge variant={alloc.status === "active" ? "default" : "secondary"}>
                                            {alloc.status}
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
                            ))}
                            {allocations.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-slate-400 py-8">
                                        No allocations found
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
