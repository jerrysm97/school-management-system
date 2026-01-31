import { useState } from "react";
import { Bell, Check, CheckCheck, Clock, CreditCard, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead } from "@/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";

const typeIcons: Record<string, React.ReactNode> = {
    fee_reminder: <Clock className="h-4 w-4 text-blue-500" />,
    fee_overdue: <AlertTriangle className="h-4 w-4 text-red-500" />,
    payment_received: <CreditCard className="h-4 w-4 text-green-500" />,
    announcement: <Info className="h-4 w-4 text-purple-500" />,
    system: <Bell className="h-4 w-4 text-gray-500" />,
};

const typeColors: Record<string, string> = {
    fee_reminder: "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20",
    fee_overdue: "bg-red-50 hover:bg-red-100 dark:bg-red-900/20",
    payment_received: "bg-green-50 hover:bg-green-100 dark:bg-green-900/20",
    announcement: "bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20",
    system: "bg-gray-50 hover:bg-gray-100 dark:bg-gray-900/20",
};

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [, setLocation] = useLocation();

    const { data: notifications = [], isLoading } = useNotifications(10, 0);
    const { data: unreadData } = useUnreadCount();
    const markAsRead = useMarkAsRead();
    const markAllAsRead = useMarkAllAsRead();

    const unreadCount = unreadData?.count || 0;

    const handleNotificationClick = async (notification: any) => {
        if (!notification.readAt) {
            await markAsRead.mutateAsync(notification.id);
        }
        if (notification.link) {
            setLocation(notification.link);
            setOpen(false);
        }
    };

    const handleMarkAllAsRead = async () => {
        await markAllAsRead.mutateAsync();
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 text-xs"
                            onClick={handleMarkAllAsRead}
                        >
                            <CheckCheck className="h-3 w-3 mr-1" />
                            Mark all read
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <ScrollArea className="h-[300px]">
                    {isLoading ? (
                        <div className="p-4 text-center text-muted-foreground">Loading...</div>
                    ) : notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No notifications yet</p>
                        </div>
                    ) : (
                        notifications.map((notification: any) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!notification.readAt ? typeColors[notification.type] || typeColors.system : ""
                                    }`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="flex items-start gap-2 w-full">
                                    {typeIcons[notification.type] || typeIcons.system}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-medium text-sm truncate">
                                                {notification.title}
                                            </span>
                                            {!notification.readAt && (
                                                <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <span className="text-xs text-muted-foreground">
                                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                </div>
                            </DropdownMenuItem>
                        ))
                    )}
                </ScrollArea>

                {notifications.length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-center text-sm text-muted-foreground justify-center"
                            onClick={() => {
                                setLocation("/notifications");
                                setOpen(false);
                            }}
                        >
                            View all notifications
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
