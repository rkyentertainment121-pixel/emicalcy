
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Home, Car, User, Percent, CalendarClock, IndianRupee, Wallet, Bot, TrendingUp, Sparkles, ReceiptText, Calculator
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNumber } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { getPrepaymentSuggestions, PrepaymentSuggestionsInput, PrepaymentSuggestionsOutput } from "@/ai/ai-prepayment-suggestions";
import { useToast } from "@/hooks/use-toast";


const formSchema = z.object({
  loanAmount: z.coerce.number({invalid_type_error: "Please enter a number."}).positive("Loan amount must be positive"),
  interestRate: z.coerce.number({invalid_type_error: "Please enter a number."}).positive("Interest rate must be positive").max(100, "Rate seems too high"),
  tenure: z.coerce.number({invalid_type_error: "Please enter a number."}).positive("Tenure must be positive").int(),
  loanType: z.enum(["home", "car", "personal"]),
  processingFee: z.coerce.number().min(0, "Fee cannot be negative").default(0),
  lumpSumAmount: z.coerce.number().min(0).default(0),
  lumpSumMonth: z.coerce.number().min(1).int().optional(),
  extraMonthlyPayment: z.coerce.number().min(0).default(0),
  financialGoals: z.string().default("Pay off loan quickly"),
  riskTolerance: z.string().default("Moderate"),
}).refine(data => {
  if (data.lumpSumAmount > 0) {
    return data.lumpSumMonth !== undefined && data.lumpSumMonth > 0;
  }
  return true;
}, {
  message: "Month is required for lump sum payment",
  path: ["lumpSumMonth"],
});

type AmortizationData = {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
};

type SummaryData = {
  emi: number;
  totalInterest: number;
  totalPayment: number;
  originalTenure: number;
  newTenure: number;
  interestSaved: number;
  totalPaidWithPrepayment: number;
};

type LoanCalculatorProps = {
  currency: string;
};

export function LoanCalculator({ currency }: LoanCalculatorProps) {
  const [amortizationData, setAmortizationData] = useState<AmortizationData[] | null>(null);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [aiSuggestion, setAiSuggestion] = useState<PrepaymentSuggestionsOutput | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      loanAmount: 1000000,
      interestRate: 8.5,
      tenure: 20,
      loanType: "home",
      processingFee: 10000,
      lumpSumAmount: 0,
      extraMonthlyPayment: 0,
      financialGoals: "Pay off loan quickly",
      riskTolerance: "Moderate",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    calculate(values);
  };
  
  useEffect(() => {
    calculate(form.getValues());
  }, [currency]);

  const calculate = (values: z.infer<typeof formSchema>) => {
    const principal = values.loanAmount + (values.processingFee || 0);
    const monthlyRate = values.interestRate / 12 / 100;
    const numberOfMonths = values.tenure * 12;

    if (monthlyRate <= 0) {
        // Simple interest or zero interest loan
        const emi = principal / numberOfMonths;
        let remainingBalance = principal;
        const schedule: AmortizationData[] = [];
        let months = 0;

        while(remainingBalance > 0 && months < 1000) { // safety break
            months++;
            const payment = emi + (values.extraMonthlyPayment || 0);
            let principalPaid = payment;

            if (values.lumpSumMonth === months && values.lumpSumAmount) {
                remainingBalance -= values.lumpSumAmount;
            }

            if (remainingBalance < principalPaid) {
                principalPaid = remainingBalance;
            }
            remainingBalance -= principalPaid;
            
            schedule.push({
                month: months,
                payment: principalPaid,
                principal: principalPaid,
                interest: 0,
                remainingBalance: remainingBalance < 0 ? 0 : remainingBalance,
            });
        }
        
        setAmortizationData(schedule);
        setSummary({
            emi: emi,
            totalInterest: 0,
            totalPayment: principal,
            originalTenure: numberOfMonths,
            newTenure: months,
            interestSaved: 0,
            totalPaidWithPrepayment: principal,
        });

        return;
    }


    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfMonths)) / (Math.pow(1 + monthlyRate, numberOfMonths) - 1);

    const schedule: AmortizationData[] = [];
    let remainingBalance = principal;
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;
    let months = 0;

    while (remainingBalance > 0 && months < 1000) { // Safety break
      months++;
      const interestForMonth = remainingBalance * monthlyRate;
      let monthlyPayment = emi + (values.extraMonthlyPayment || 0);
      let principalForMonth = monthlyPayment - interestForMonth;

      if (values.lumpSumMonth === months && values.lumpSumAmount) {
        remainingBalance -= values.lumpSumAmount;
      }

      if (remainingBalance - principalForMonth < 0) {
        principalForMonth = remainingBalance;
        monthlyPayment = principalForMonth + interestForMonth;
      }
      
      remainingBalance -= principalForMonth;

      totalInterestPaid += interestForMonth;
      totalPrincipalPaid += principalForMonth;

      schedule.push({
        month: months,
        payment: monthlyPayment,
        principal: principalForMonth,
        interest: interestForMonth,
        remainingBalance: remainingBalance < 0 ? 0 : remainingBalance,
      });
    }

    const originalTotalInterest = emi * numberOfMonths - principal;
    const totalPaidWithPrepayment = totalPrincipalPaid + totalInterestPaid + (values.lumpSumAmount || 0);

    setAmortizationData(schedule);
    setSummary({
      emi: emi,
      totalInterest: totalInterestPaid,
      totalPayment: principal + totalInterestPaid,
      originalTenure: numberOfMonths,
      newTenure: months,
      interestSaved: originalTotalInterest - totalInterestPaid,
      totalPaidWithPrepayment,
    });
  }

  const handleAiSuggestion = async () => {
    setIsGeneratingAi(true);
    setAiSuggestion(null);
    try {
      const values = form.getValues();
      const input: PrepaymentSuggestionsInput = {
        loanAmount: values.loanAmount,
        interestRate: values.interestRate / 100,
        loanTenureMonths: values.tenure * 12,
        monthlyPayment: summary?.emi || 0,
        financialGoals: values.financialGoals,
        riskTolerance: values.riskTolerance,
      };
      const suggestion = await getPrepaymentSuggestions(input);
      setAiSuggestion(suggestion);
    } catch (error) {
      console.error("Error getting AI suggestion:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get AI suggestion. Please try again.",
      });
    } finally {
      setIsGeneratingAi(false);
    }
  };
  
  const loanTypeIcons = {
    home: <Home className="h-4 w-4" />,
    car: <Car className="h-4 w-4" />,
    personal: <User className="h-4 w-4" />,
  };

  const CurrencyIcon = currency === 'INR' ? IndianRupee : 'span';


  return (
    <div className="space-y-8">
      <Card className="overflow-hidden shadow-lg">
        <CardHeader className="bg-muted/30">
          <div className="flex items-center gap-3">
             <Calculator className="h-6 w-6 text-primary" />
             <CardTitle className="text-2xl">Loan Details</CardTitle>
          </div>
          <CardDescription>Enter your loan information to get started.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="loanAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><CurrencyIcon className="h-4 w-4"/>Loan Amount</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 1,000,000" {...field} type="number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="interestRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Percent className="h-4 w-4"/>Annual Interest Rate (%)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 8.5" {...field} type="number" step="0.01" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tenure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><CalendarClock className="h-4 w-4"/>Loan Tenure (Years)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 20" {...field} type="number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="loanType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        {loanTypeIcons[field.value]}
                        Loan Type
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a loan type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="home">Home Loan</SelectItem>
                          <SelectItem value="car">Car Loan</SelectItem>
                          <SelectItem value="personal">Personal Loan</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="processingFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Wallet className="h-4 w-4"/>Processing Fee (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 10,000" {...field} type="number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 rounded-lg border p-4 bg-muted/20">
                <h3 className="text-lg font-semibold flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary"/>Prepayment Options (Optional)</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="lumpSumAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lump Sum Amount</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 100,000" {...field} type="number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lumpSumMonth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lump Sum Payment Month</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 12" {...field} type="number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="extraMonthlyPayment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Extra Monthly Payment</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 5,000" {...field} type="number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                <FormDescription>Simulate the impact of prepayments on your loan.</FormDescription>
              </div>

            </CardContent>
            <CardContent className="p-6 pt-0 text-center">
              <Button type="submit" size="lg" className="w-full sm:w-auto">
                <Calculator className="mr-2 h-4 w-4" /> Calculate
              </Button>
            </CardContent>
          </form>
        </Form>
      </Card>

      {summary && amortizationData && (
        <Tabs defaultValue="summary" className="w-full mt-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary"><ReceiptText className="mr-2 h-4 w-4"/>Summary</TabsTrigger>
            <TabsTrigger value="schedule"><CalendarClock className="mr-2 h-4 w-4"/>Amortization Schedule</TabsTrigger>
            <TabsTrigger value="ai-advisor"><Sparkles className="mr-2 h-4 w-4"/>AI Advisor</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Monthly Payment (EMI)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-primary">{formatNumber(summary.emi, { style: 'currency', currency: currency })}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total Interest</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{formatNumber(summary.totalInterest, { style: 'currency', currency: currency })}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total Payment</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{formatNumber(summary.totalPaidWithPrepayment, { style: 'currency', currency: currency })}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tenure Reduction</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">{summary.originalTenure - summary.newTenure} Months</p>
                  <p className="text-sm text-muted-foreground">Original: {summary.originalTenure} months</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Interest Saved</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">{formatNumber(summary.interestSaved, { style: 'currency', currency: currency })}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">New Loan Tenure</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{summary.newTenure} Months</p>
                  <p className="text-sm text-muted-foreground">({(summary.newTenure / 12).toFixed(1)} years)</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Amortization Schedule</CardTitle>
                <CardDescription>Detailed breakdown of your payments over time.</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader className="sticky top-0 bg-card">
                      <TableRow>
                        <TableHead className="w-[100px]">Month</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Principal</TableHead>
                        <TableHead>Interest</TableHead>
                        <TableHead className="text-right">Remaining Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {amortizationData.map((row) => (
                        <TableRow key={row.month}>
                          <TableCell className="font-medium">{row.month}</TableCell>
                          <TableCell>{formatNumber(row.payment, { style: 'currency', currency: currency })}</TableCell>
                          <TableCell>{formatNumber(row.principal, { style: 'currency', currency: currency })}</TableCell>
                          <TableCell>{formatNumber(row.interest, { style: 'currency', currency: currency })}</TableCell>
                          <TableCell className="text-right">{formatNumber(row.remainingBalance, { style: 'currency', currency: currency })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="ai-advisor" className="mt-6">
            <Card className="bg-accent/20 border-accent">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Bot className="h-6 w-6 text-accent-foreground" />AI Prepayment Advisor</CardTitle>
                    <CardDescription>Get AI-powered suggestions for optimal prepayment strategies based on your financial goals and risk tolerance.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="financialGoals"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Financial Goal</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a goal" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Pay off loan quickly">Pay off loan quickly</SelectItem>
                              <SelectItem value="Minimize total interest paid">Minimize total interest paid</SelectItem>
                              <SelectItem value="Keep monthly payments low">Keep monthly payments low</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="riskTolerance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Risk Tolerance</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select risk tolerance" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Conservative">Conservative</SelectItem>
                              <SelectItem value="Moderate">Moderate</SelectItem>
                              <SelectItem value="Aggressive">Aggressive</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  </div>
                    <Button onClick={handleAiSuggestion} disabled={isGeneratingAi || !summary} className="bg-accent text-accent-foreground hover:bg-accent/90">
                        <Sparkles className="mr-2 h-4 w-4" />
                        {isGeneratingAi ? 'Analyzing...' : 'Get AI Suggestions'}
                    </Button>
                    {isGeneratingAi && (
                        <div className="space-y-2">
                           <Skeleton className="h-4 w-full" />
                           <Skeleton className="h-4 w-full" />
                           <Skeleton className="h-4 w-3/4" />
                        </div>
                    )}
                    {aiSuggestion && (
                         <Alert className="bg-background">
                            <Sparkles className="h-4 w-4" />
                            <AlertTitle>Recommendation</AlertTitle>
                            <AlertDescription className="space-y-2">
                               <p className="font-semibold">{aiSuggestion.suggestedStrategy}</p>
                               <p>{aiSuggestion.reasoning}</p>
                               <div className="flex justify-between text-sm mt-2 pt-2 border-t">
                                <span>Interest Saved: <span className="font-bold text-green-600">{formatNumber(aiSuggestion.estimatedInterestSavings, {style: 'currency', currency: currency})}</span></span>
                                <span>Tenure Reduction: <span className="font-bold text-green-600">{aiSuggestion.estimatedTenureReductionMonths} months</span></span>
                               </div>
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
