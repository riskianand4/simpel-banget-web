import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    title: "Desain Modern",
    description: "Interface yang clean dan modern dengan user experience terbaik"
  },
  {
    title: "Responsive",
    description: "Website yang sempurna di semua device, dari mobile hingga desktop"
  },
  {
    title: "Cepat & Ringan",
    description: "Performa optimal dengan loading time yang sangat cepat"
  }
];

export const Features = () => {
  return (
    <section className="py-20 px-4 bg-gradient-secondary">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-foreground mb-16">
          Fitur Unggulan
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="border-0 shadow-soft hover:shadow-lg transition-smooth">
              <CardHeader>
                <CardTitle className="text-xl text-primary">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};