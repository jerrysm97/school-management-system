import { useQuery } from "@tanstack/react-query";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Mail, Phone, Building } from "lucide-react";

export default function StaffDirectory() {
    // We fetch teachers for now as they are the primary staff
    const { data: teachers, isLoading } = useQuery({
        queryKey: ["/api/teachers"],
    });

    if (isLoading) {
        return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-3xl font-display font-bold">Staff Directory</h1>
                <p className="text-muted-foreground">View and manage institution staff and faculty</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Academic Faculty (Teachers)</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Staff Member</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Role</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(teachers as any[])?.map((teacher) => (
                                <TableRow key={teacher.id}>
                                    <TableCell className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${teacher.user.name}`} />
                                            <AvatarFallback>{teacher.user.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{teacher.user.name}</p>
                                            <p className="text-xs text-muted-foreground">@{teacher.user.username}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Building className="h-4 w-4 text-muted-foreground" />
                                            {teacher.department || "General"}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Mail className="h-3 w-3 text-muted-foreground" />
                                                {teacher.user.email || "No email"}
                                            </div>
                                            {teacher.phone && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                                    {teacher.phone}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="capitalize">{teacher.user.role}</span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
