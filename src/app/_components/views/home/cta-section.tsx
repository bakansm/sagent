"use client";

import { CreditCardIcon, RocketIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "../../ui/button";

export default function CTASection() {
  return (
    <section className="px-4 py-16 text-center sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
          Ready to start building?
        </h2>
        <p className="text-muted-foreground mt-4 text-lg">
          Join thousands of developers who are already creating amazing apps
          with Sagent
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button
            size="lg"
            className="h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 text-white transition-all duration-200 hover:scale-105 hover:from-blue-700 hover:to-purple-700"
            onClick={() => {
              const textarea = document.querySelector("textarea");
              textarea?.focus();
            }}
          >
            <RocketIcon className="mr-2 h-5 w-5" />
            Start Building Now
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-12 rounded-xl border-2 px-8 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-900"
            asChild
          >
            <Link href="/billing">
              <CreditCardIcon className="mr-2 h-5 w-5" />
              View Pricing
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
