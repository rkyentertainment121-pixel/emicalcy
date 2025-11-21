
"use client";

import { useState } from "react";
import { LoanCalculator } from "@/components/loan-calculator";
import { CompoundInterestCalculator } from "@/components/compound-interest-calculator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PiggyBank, Landmark, Percent, CircleDollarSign } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Home() {
  const [currency, setCurrency] = useState("INR");

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

        <div className="flex justify-center mb-6">
          <div className="w-full max-w-xs">
             <label htmlFor="currency-selector" className="flex items-center gap-2 mb-2 text-sm font-medium text-muted-foreground justify-center">
              <CircleDollarSign className="h-4 w-4"/> Select Currency
            </label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency-selector" className="w-full">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INR">Indian Rupee (INR)</SelectItem>
                <SelectItem value="USD">US Dollar (USD)</SelectItem>
                <SelectItem value="EUR">Euro (EUR)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
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
            <LoanCalculator currency={currency} />
          </TabsContent>
          <TabsContent value="compound-interest-calculator" className="mt-6">
            <CompoundInterestCalculator currency={currency} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
