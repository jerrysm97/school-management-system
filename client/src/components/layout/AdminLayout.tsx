
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";

interface AdminLayoutProps {
    children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Cockpit: Fixed Sidebar */}
            <Sidebar />

            {/* Cockpit: Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-background/50 relative">
                {/* Texture/Grid for precision feel could go here */}
                {children}
            </main>
        </div>
    );
}
