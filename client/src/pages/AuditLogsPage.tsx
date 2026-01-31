import { useState } from "react";
import { useAuditLogs } from "@/hooks/use-audit-logs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { Eye, Filter, RefreshCw, Clock, User, Database } from "lucide-react";

const actionColors: Record<string, string> = {
    create: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    update: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    delete: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    login: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    logout: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    view: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    export: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    approve: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    reject: "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200",
};

export default function AuditLogsPage() {
    const [filters, setFilters] = useState({
        tableName: "",
        action: "",
        limit: 50,
        offset: 0,
    });

    const { data: logs = [], isLoading, refetch } = useAuditLogs(filters);

    const uniqueTables = [...new Set(logs.map((log) => log.tableName))];

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Audit Trail</h1>
                    <p className="text-muted-foreground">
                        Complete history of all system changes
                    </p>
                </div>
                <Button onClick={() => refetch()} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Select
                            value={filters.tableName}
                            onValueChange={(value) => setFilters({ ...filters, tableName: value === "all" ? "" : value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Tables" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Tables</SelectItem>
                                <SelectItem value="users">Users</SelectItem>
                                <SelectItem value="students">Students</SelectItem>
                                <SelectItem value="fees">Fees</SelectItem>
                                <SelectItem value="payments">Payments</SelectItem>
                                <SelectItem value="fiscal_period_locks">Fiscal Periods</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters.action}
                            onValueChange={(value) => setFilters({ ...filters, action: value === "all" ? "" : value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="All Actions" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Actions</SelectItem>
                                <SelectItem value="create">Create</SelectItem>
                                <SelectItem value="update">Update</SelectItem>
                                <SelectItem value="delete">Delete</SelectItem>
                                <SelectItem value="login">Login</SelectItem>
                                <SelectItem value="logout">Logout</SelectItem>
                                <SelectItem value="export">Export</SelectItem>
                                <SelectItem value="approve">Approve</SelectItem>
                                <SelectItem value="reject">Reject</SelectItem>
                            </SelectContent>
                        </Select>

                        <Input
                            type="date"
                            placeholder="Start Date"
                            className="w-full"
                        />

                        <Input
                            type="date"
                            placeholder="End Date"
                            className="w-full"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Logs Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Activity Log
                    </CardTitle>
                    <CardDescription>
                        Showing {logs.length} records
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No audit logs found
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[180px]">Timestamp</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Table</TableHead>
                                        <TableHead>Record ID</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>IP Address</TableHead>
                                        <TableHead className="text-right">Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-mono text-xs">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(log.createdAt), "MMM dd, yyyy HH:mm:ss")}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={actionColors[log.action] || ""}>
                                                    {log.action.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {log.tableName}
                                            </TableCell>
                                            <TableCell className="font-mono">
                                                {log.recordId || "-"}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <User className="h-3 w-3" />
                                                    {log.userId || "System"}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {log.ipAddress || "-"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-2xl">
                                                        <DialogHeader>
                                                            <DialogTitle>Audit Log Details</DialogTitle>
                                                        </DialogHeader>
                                                        <ScrollArea className="max-h-[500px]">
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <h4 className="font-medium mb-2">Metadata</h4>
                                                                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-auto">
                                                                        {JSON.stringify(log.metadata, null, 2)}
                                                                    </pre>
                                                                </div>
                                                                {log.oldValue && (
                                                                    <div>
                                                                        <h4 className="font-medium mb-2 text-red-600">Old Value</h4>
                                                                        <pre className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg text-xs overflow-auto">
                                                                            {JSON.stringify(log.oldValue, null, 2)}
                                                                        </pre>
                                                                    </div>
                                                                )}
                                                                {log.newValue && (
                                                                    <div>
                                                                        <h4 className="font-medium mb-2 text-green-600">New Value</h4>
                                                                        <pre className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-xs overflow-auto">
                                                                            {JSON.stringify(log.newValue, null, 2)}
                                                                        </pre>
                                                                    </div>
                                                                )}
                                                                <div>
                                                                    <h4 className="font-medium mb-2">User Agent</h4>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {log.userAgent || "Not recorded"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </ScrollArea>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFilters({ ...filters, offset: Math.max(0, filters.offset - filters.limit) })}
                            disabled={filters.offset === 0}
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Page {Math.floor(filters.offset / filters.limit) + 1}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFilters({ ...filters, offset: filters.offset + filters.limit })}
                            disabled={logs.length < filters.limit}
                        >
                            Next
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
