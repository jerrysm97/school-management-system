import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { FileDown, BarChart3, PieChart, TrendingUp, Users, DollarSign, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsPage() {
    const [dateRange, setDateRange] = useState({ from: new Date(new Date().getFullYear(), 0, 1), to: new Date() });

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">Enterprise Reports</h1>
                    <p className="text-muted-foreground mt-1">
                        Access comprehensive analytics across all institution modules.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {/* <CalendarDateRangePicker date={dateRange} setDate={setDateRange} /> */}
                    <Button variant="outline">
                        <FileDown className="mr-2 h-4 w-4" />
                        Export All
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="students">Students</TabsTrigger>
                    <TabsTrigger value="finance">Finance</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Enrollment</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">1,240</div>
                                <p className="text-xs text-muted-foreground">+18% from last month</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Revenue (YTD)</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">$1.2M</div>
                                <p className="text-xs text-muted-foreground">+4% from last year</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Avg. Attendance</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">94.2%</div>
                                <p className="text-xs text-muted-foreground">+1.2% from last month</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">12</div>
                                <p className="text-xs text-muted-foreground">-3 since yesterday</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Enrollment Trends</CardTitle>
                                <CardDescription>Monthly student admission rates.</CardDescription>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <div className="h-[200px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-md">
                                    {/* Chart placeholder */}
                                    <BarChart3 className="h-8 w-8 mr-2 opacity-50" />
                                    Chart Visualization Loading...
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Department Distribution</CardTitle>
                                <CardDescription>Student count by department.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[200px] flex items-center justify-center text-muted-foreground bg-muted/20 rounded-md">
                                    <PieChart className="h-8 w-8 mr-2 opacity-50" />
                                    Distribution Data
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="students">
                    <Card>
                        <CardHeader><CardTitle>Student Reports</CardTitle></CardHeader>
                        <CardContent>
                            <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
                                Coming Soon: Detailed Student Demographics & Grades
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="finance">
                    <Card>
                        <CardHeader><CardTitle>Financial Reports</CardTitle></CardHeader>
                        <CardContent>
                            <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
                                Coming Soon: Fee Collection & Detailed Ledger
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="attendance">
                    <Card>
                        <CardHeader><CardTitle>Attendance Reports</CardTitle></CardHeader>
                        <CardContent>
                            <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
                                Coming Soon: Class-wise Attendance & Absentees
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}
