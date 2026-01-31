import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft, Search } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-lg mx-4 bg-white/5 backdrop-blur-xl border-white/10 shadow-2xl relative z-10">
        <CardContent className="pt-12 pb-10 px-8 text-center">
          {/* Error Code */}
          <div className="relative mb-8">
            <h1 className="text-[120px] font-bold leading-none bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 blur-2xl" />
            </div>
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
          </div>

          {/* Message */}
          <h2 className="text-2xl font-bold text-white mb-3">
            Page Not Found
          </h2>
          <p className="text-slate-400 mb-8 max-w-sm mx-auto">
            Oops! The page you're looking for doesn't exist or has been moved to a different location.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              className="border-white/20 text-white bg-white/5 hover:bg-white/10"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0"
              onClick={() => setLocation("/")}
            >
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>

          {/* Helpful Links */}
          <div className="mt-10 pt-6 border-t border-white/10">
            <p className="text-sm text-slate-500 mb-4">Or try these popular pages:</p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white hover:bg-white/10"
                onClick={() => setLocation("/dashboard")}
              >
                Dashboard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white hover:bg-white/10"
                onClick={() => setLocation("/students")}
              >
                Students
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white hover:bg-white/10"
                onClick={() => setLocation("/reports")}
              >
                Reports
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white hover:bg-white/10"
                onClick={() => setLocation("/settings")}
              >
                Settings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
