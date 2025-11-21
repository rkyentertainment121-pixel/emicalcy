
import { LoanCalculator } from "@/components/loan-calculator";
import { CompoundInterestCalculator } from "@/components/compound-interest-calculator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PiggyBank, Landmark, Percent } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen w-full font-body">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-8 md:mb-12">
          <div className="inline-flex items-center justify-center bg-primary/20 text-primary p-3 rounded-full mb-4">
             <PiggyBank className="h-8 w-8" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Kenz EMI Calculator
          </h1>
          <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
            Your all-in-one suite for smart financial planning. Make informed decisions about your loans, investments, and savings.
          </p>
        </header>
        
        <Tabs defaultValue="emi-calculator" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-lg mx-auto">
            <TabsTrigger value="emi-calculator">
              <Landmark className="mr-2 h-4 w-4"/>
              EMI Calculator
            </TabsTrigger>
            <TabsTrigger value="compound-interest-calculator">
              <Percent className="mr-2 h-4 w-4"/>
              Compound Interest
            </TabsTrigger>
          </TabsList>
          <TabsContent value="emi-calculator" className="mt-6">
            <LoanCalculator />
          </TabsContent>
          <TabsContent value="compound-interest-calculator" className="mt-6">
            <CompoundInterestCalculator />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
