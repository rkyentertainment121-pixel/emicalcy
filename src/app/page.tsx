import { LoanCalculator } from "@/components/loan-calculator";
import { PiggyBank } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen w-full font-body">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center justify-center bg-primary/20 text-primary p-3 rounded-full mb-4">
             <PiggyBank className="h-8 w-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Kenz Tech Analyzer
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
            Your all-in-one calculator for smart loan management. Make informed decisions about your loans and prepayments.
          </p>
        </header>
        <LoanCalculator />
      </div>
    </main>
  );
}
