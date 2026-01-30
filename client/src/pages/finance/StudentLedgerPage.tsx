import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStudents } from "@/hooks/use-students";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Printer, DollarSign, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { format } from "date-fns";
import { useReactToPrint } from "react-to-print";

export default function StudentLedgerPage() {
    const [selectedStudentId, setSelectedStudentId] = useState<string>("");

    // Print handling
    const printRef = useRef<HTMLDivElement>(null);
    const handlePrint = useReactToPrint({
        contentRef: printRef,
        documentTitle: `Student-Ledger-${selectedStudentId}`,
    });

    const { data: students } = useStudents();

    const { data: ledgerData, isLoading } = useQuery({
        queryKey: ['/api/finance/student-ledger', selectedStudentId],
        queryFn: async () => {
            const res = await fetch(`/api/finance/student-ledger/${selectedStudentId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            if (!res.ok) throw new Error("Failed to fetch ledger");
            return res.json();
        },
        enabled: !!selectedStudentId
    });

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Student Ledger</h1>
                    <p className="text-muted-foreground mt-1">
                        View financial history and statements for any student.
                    </p>
                </div>
                {selectedStudentId && (
                    <Button onClick={handlePrint} variant="outline" className="gap-2">
                        <Printer className="w-4 h-4" />
                        Print Statement
                    </Button>
                )}
            </div>

            {/* Student Selector */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex gap-4 items-end">
                        <div className="flex-1 max-w-md space-y-2">
                            <label className="text-sm font-medium">Select Student</label>
                            <Select onValueChange={setSelectedStudentId} value={selectedStudentId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Search student..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {students?.map((s) => (
                                        <SelectItem key={s.id} value={String(s.id)}>
                                            {(s as any).user?.name || `Student #${s.id}`} ({(s as any).user?.username || s.admissionNo})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {isLoading && (
                <div className="flex h-[20vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}

            {ledgerData && (
                <div ref={printRef} className="space-y-8 bg-white p-4 md:p-0 print:p-8">
                    {/* Header for Print */}
                    <div className="hidden print:block mb-8 border-b pb-4">
                        <h1 className="text-2xl font-bold">Student Account Statement</h1>
                        <p className="text-gray-500">UMS Institute</p>
                        <div className="mt-4">
                            <p><strong>Student:</strong> {ledgerData.student.name}</p>
                            <p><strong>ID:</strong> {ledgerData.student.username}</p>
                            <p><strong>Date:</strong> {format(new Date(), "PPP")}</p>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
                        <Card className="bg-slate-50 border-slate-200 print:border print:shadow-none">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-slate-700">Total Billed</CardTitle>
                                <ArrowUpCircle className="h-4 w-4 text-slate-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-slate-700">
                                    ${(ledgerData.summary.totalBilled / 100).toFixed(2)}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-green-50 border-green-200 print:border print:shadow-none">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-green-700">Total Paid</CardTitle>
                                <ArrowDownCircle className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-700">
                                    ${(ledgerData.summary.totalPaid / 100).toFixed(2)}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className={`${ledgerData.summary.outstandingBalance > 0 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                            } print:border print:shadow-none`}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
                                <DollarSign className="h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${ledgerData.summary.outstandingBalance > 0 ? 'text-red-700' : 'text-blue-700'
                                    }`}>
                                    ${(ledgerData.summary.outstandingBalance / 100).toFixed(2)}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Ledger Table */}
                    <div className="rounded-md border bg-white print:border-none">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50 print:bg-gray-100">
                                    <TableHead>Date</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Debit (+)</TableHead>
                                    <TableHead className="text-right">Credit (-)</TableHead>
                                    <TableHead className="text-right">Balance</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {ledgerData.ledger.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                            No transactions found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    ledgerData.ledger.map((entry: any) => (
                                        <TableRow key={entry.id}>
                                            <TableCell>{format(new Date(entry.date), "MMM d, yyyy")}</TableCell>
                                            <TableCell className="font-medium">
                                                {entry.description}
                                                <div className="text-xs text-muted-foreground capitalize">{entry.status}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={entry.type === 'debit' ? 'outline' : 'secondary'} className="capitalize">
                                                    {entry.type === 'debit' ? 'Charge' : 'Payment'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right text-slate-600">
                                                {entry.type === 'debit' ? `$${(entry.amount / 100).toFixed(2)}` : '-'}
                                            </TableCell>
                                            <TableCell className="text-right text-green-600">
                                                {entry.type === 'credit' ? `$${(entry.amount / 100).toFixed(2)}` : '-'}
                                            </TableCell>
                                            <TableCell className="text-right font-bold">
                                                ${(entry.balance / 100).toFixed(2)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="hidden print:block mt-8 pt-8 border-t text-center text-sm text-gray-500">
                        <p>If you have any questions about this statement, please contact the finance office.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
