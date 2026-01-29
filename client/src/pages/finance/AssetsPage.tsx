import { useState } from "react";
import { useFinAssets, useCreateFinAsset } from "@/hooks/use-finance";
import { insertFinAssetSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, DollarSign, Plus } from "lucide-react";
import { format } from "date-fns";
import { z } from "zod";

const formSchema = insertFinAssetSchema.extend({
    initialCost: z.coerce.number().min(0),
    currentValue: z.coerce.number().min(0).optional(),
    purchaseDate: z.string().transform((str) => new Date(str).toISOString()),
});

export default function AssetsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { data: assets, isLoading } = useFinAssets();
    const createAsset = useCreateFinAsset();

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            type: "fixed",
            initialCost: 0,
            currentValue: 0,
            purchaseDate: format(new Date(), "yyyy-MM-dd"),
            description: "",
            location: "",
        },
    });

    const onSubmit = (data: any) => {
        const payload = {
            ...data,
            initialCost: Math.round(data.initialCost * 100),
            currentValue: Math.round((data.currentValue || data.initialCost) * 100),
        };

        createAsset.mutate(payload, {
            onSuccess: () => {
                setIsDialogOpen(false);
                form.reset();
            },
        });
    };

    if (isLoading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    const totalAssetValue = assets?.reduce((sum, item) => sum + item.currentValue, 0) || 0;

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Asset Registry</h1>
                    <p className="text-muted-foreground mt-1">
                        Track fixed, current, and intangible assets.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Register Asset
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Register New Asset</DialogTitle>
                            </DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Asset Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. School Bus #4" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="type"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Type</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="fixed">Fixed</SelectItem>
                                                            <SelectItem value="current">Current</SelectItem>
                                                            <SelectItem value="intangible">Intangible</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="initialCost"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Cost ($)</FormLabel>
                                                    <FormControl>
                                                        <Input type="number" step="0.01" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="purchaseDate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Purchase Date</FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="location"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Location</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. Block A" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={createAsset.isPending}>
                                        {createAsset.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Save Asset
                                    </Button>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700">Total Asset Value</CardTitle>
                        <DollarSign className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-700">
                            ${(totalAssetValue / 100).toFixed(2)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="rounded-md border bg-white">
                <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                        <tr className="border-b hover:bg-slate-100/50">
                            <th className="h-12 px-4 text-left font-medium text-slate-500">Name</th>
                            <th className="h-12 px-4 text-left font-medium text-slate-500">Type</th>
                            <th className="h-12 px-4 text-left font-medium text-slate-500">Purchased</th>
                            <th className="h-12 px-4 text-left font-medium text-slate-500">Location</th>
                            <th className="h-12 px-4 text-right font-medium text-slate-500">Current Value</th>
                        </tr>
                    </thead>
                    <tbody>
                        {assets?.length === 0 ? (
                            <tr><td colSpan={5} className="h-24 text-center">No assets found.</td></tr>
                        ) : (
                            assets?.map((asset) => (
                                <tr key={asset.id} className="border-b hover:bg-slate-100/50">
                                    <td className="p-4 font-medium">{asset.name}</td>
                                    <td className="p-4 capitalize">{asset.type}</td>
                                    <td className="p-4">{format(new Date(asset.purchaseDate), "MMM d, yyyy")}</td>
                                    <td className="p-4">{asset.location || "-"}</td>
                                    <td className="p-4 text-right font-medium text-blue-700">
                                        ${(asset.currentValue / 100).toFixed(2)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
