import {
  CodeIcon,
  PaletteIcon,
  RocketIcon,
  SmartphoneIcon,
} from "lucide-react";

const features = [
  {
    icon: CodeIcon,
    title: "AI-Powered Development",
    description:
      "Build full-stack applications with intelligent code generation",
  },
  {
    icon: RocketIcon,
    title: "Instant Deployment",
    description: "See your creations come to life in real-time",
  },
  {
    icon: PaletteIcon,
    title: "Beautiful UI/UX",
    description: "Create stunning interfaces with modern design patterns",
  },
  {
    icon: SmartphoneIcon,
    title: "Responsive Design",
    description: "Build apps that work perfectly on all devices",
  },
];

export default function FeaturesSection() {
  return (
    <section className="rounded-md border bg-gray-50/10 px-4 py-16 backdrop-blur-xs sm:px-6 lg:px-8 dark:bg-gray-900/5">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl lg:text-4xl dark:text-white">
            Why Choose Sagent?
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Experience the future of development with our AI-powered platform
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative rounded-2xl border bg-white/50 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl dark:bg-gray-900/50"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <div className="relative">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50">
                  <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
