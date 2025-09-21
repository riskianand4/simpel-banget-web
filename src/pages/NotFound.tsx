import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/30 px-4">
      <Card className="w-full max-w-md mx-auto shadow-lg border-0 bg-background/95 backdrop-blur-sm">
        <CardContent className="pt-12 pb-8 px-8 text-center">
          {/* Large 404 with gradient */}
          <div className="mb-8">
            <h1 className="text-8xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent mb-2">
              404
            </h1>
            <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto rounded-full"></div>
          </div>

          {/* Error message */}
          <div className="mb-8 space-y-3">
            <h2 className="text-2xl font-semibold text-foreground">
              Halaman Tidak Ditemukan
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              Maaf, halaman yang Anda cari tidak dapat ditemukan. 
              Mungkin halaman telah dipindahkan atau tidak lagi tersedia.
            </p>
            {location.pathname && (
              <div className="text-sm text-muted-foreground/80 font-mono bg-muted/50 px-3 py-2 rounded-md inline-block">
                {location.pathname}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button asChild className="w-full" size="lg">
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Kembali ke Beranda
              </Link>
            </Button>
            
            <div className="flex gap-2">
              <Button asChild variant="outline" className="flex-1" size="lg">
                <Link to="/products">
                  <Search className="mr-2 h-4 w-4" />
                  Produk
                </Link>
              </Button>
              <Button 
                variant="outline" 
                className="flex-1" 
                size="lg"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
              </Button>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="mt-8 pt-6 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Jika masalah berlanjut, hubungi administrator sistem
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
