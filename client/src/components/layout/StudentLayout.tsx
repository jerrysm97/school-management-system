
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Library,
    Clock,
    CalendarCheck,
    Banknote,
    LogOut,
    User,
    Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";

interface StudentLayoutProps {
    children: React.ReactNode;
}

export function StudentLayout({ children }: StudentLayoutProps) {
    const { user, logoutMutation } = useAuth();
    const [location] = useLocation();

    if (!user) return null;

    const navItems = [
        { label: "Home", href: "/", icon: LayoutDashboard },
        { label: "LMS", href: "/lms", icon: Library },
        { label: "Schedule", href: "/timetable", icon: Clock },
        { label: "Grades", href: "/exams", icon: CalendarCheck },
        { label: "Fees", href: "/fees", icon: Banknote },
    ];

    return (
        <div className="min-h-screen bg-[hsl(225,30%,98%)] dark:bg-[hsl(225,30%,8%)] font-display">
            {/* Lounge: Top Navigation Bar */}
            <header className="sticky top-0 z-40 w-full border-b bg-white/70 dark:bg-[#0f172a]/80 backdrop-blur-xl transition-all">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">

                    {/* Logo Area */}
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <span className="text-white font-bold text-lg">N</span>
                        </div>
                        <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent hidden sm:inline-block">
                            Nexus Student
                        </span>
                    </div>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const isActive = location === item.href;
                            return (
                                <Link key={item.href} href={item.href}>
                                    <div className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer",
                                        isActive
                                            ? "bg-primary/10 text-primary hover:bg-primary/15"
                                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                    )}>
                                        <item.icon className={cn("h-4 w-4", isActive && "text-primary")} />
                                        {item.label}
                                    </div>
                                </Link>
                            )
                        })}
                    </nav>

                    {/* User & Actions */}
                    <div className="flex items-center gap-3">
                        <Button size="icon" variant="ghost" className="rounded-full text-muted-foreground hover:text-foreground relative">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white dark:border-black" />
                        </Button>

                        <div className="flex items-center gap-3 pl-3 border-l border-border/40">
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-medium leading-none">{user.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Student</p>
                            </div>
                            <Avatar className="h-9 w-9 border-2 border-white dark:border-white/10 shadow-sm cursor-pointer hover:scale-105 transition-transform">
                                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.username}`} />
                                <AvatarFallback>ST</AvatarFallback>
                            </Avatar>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => logoutMutation.mutate()}
                                className="text-muted-foreground hover:text-destructive"
                            >
                                <LogOut className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content (Lounge Area) */}
            <main className="container mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {children}
            </main>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#0f172a]/95 backdrop-blur-xl border-t z-50 pb-safe">
                <div className="flex justify-around items-center h-16 px-2">
                    {navItems.map((item) => {
                        const isActive = location === item.href;
                        return (
                            <Link key={item.href} href={item.href}>
                                <div className={cn(
                                    "flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 cursor-pointer w-16",
                                    isActive
                                        ? "text-primary"
                                        : "text-muted-foreground hover:text-foreground"
                                )}>
                                    <item.icon className={cn("h-5 w-5", isActive && "fill-primary/20 scale-110")} />
                                    <span className="text-[10px] font-medium">{item.label}</span>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </div>

            {/* Bottom padding for mobile nav */}
            <div className="h-16 md:hidden" />
        </div>
    );
}
