import { Button } from "@/components/ui/button";
import heroBackground from "@/assets/hero-background.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        <div className="absolute inset-0 bg-gradient-primary opacity-80"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground mb-6 animate-fade-in">
          Website Simple
        </h1>
        <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 animate-fade-in-delay max-w-2xl mx-auto">
          Selamat datang di website sederhana yang elegan dan modern
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-delay">
          <Button size="lg" variant="secondary" className="text-lg px-8 py-3 shadow-soft">
            Mulai Sekarang
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8 py-3 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
            Pelajari Lebih
          </Button>
        </div>
      </div>
    </section>
  );
};