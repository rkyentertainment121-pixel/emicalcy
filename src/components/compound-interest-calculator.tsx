
"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { IndianRupee, Percent, CalendarClock, Bot, Calculator, BarChart, TrendingUp, Wallet } from "lucide-react";
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
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
import { formatNumber } from "@/lib/utils";
import { ChartConfig, ChartContainer, ChartTooltipContent, ChartTooltip } from "@/components/ui/chart"

const formSchema = z.object({
  principal: z.coerce.number({invalid_type_error: "Please enter a number."}).positive("Principal must be positive"),
  rate: z.coerce.number({invalid_type_error: "Please enter a number."}).positive("Interest rate must be positive").max(100, "Rate seems too high"),
  tenure: z.coerce.number({invalid_type_error: "Please enter a number."}).positive("Tenure must be positive").int(),
  compoundingFrequency: z.coerce.number().int().positive(),
  monthlyContribution: z.coerce.number().min(0).default(0),
});

type FormData = z.infer<typeof formSchema>;

type CalculationResult = {
  totalAmount: number;
  totalInterest: number;
  totalContributions: number;
  chartData: { year: number; principal: number; interest: number; contribution: number }[];
};

const chartConfig = {
  principal: {
    label: "Principal",
    color: "hsl(var(--chart-1))",
  },
  interest: {
    label: "Interest",
    color: "hsl(var(--chart-2))",
  },
  contribution: {
    label: "Contributions",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

type CompoundInterestCalculatorProps = {
  currency: string;
};

export function CompoundInterestCalculator({ currency }: CompoundInterestCalculatorProps) {
  const [result, setResult] = useState<CalculationResult | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      principal: 100000,
      rate: 10,
      tenure: 10,
      compoundingFrequency: 1,
      monthlyContribution: 0,
    },
  });

  const onSubmit = (values: FormData) => {
    calculate(values);
  };
  
  useEffect(() => {
    calculate(form.getValues());
  }, [currency]);

  const calculate = (values: FormData) => {
    const { principal, rate, tenure, compoundingFrequency, monthlyContribution } = values;
    const annualRate = rate / 100;
    const chartData: CalculationResult["chartData"] = [];
    let futureValue = principal;
    let totalContributions = 0;

    for (let year = 1; year <= tenure; year++) {
      let yearEndValue = futureValue;
      let yearlyContribution = 0;
      
      for (let i = 0; i < compoundingFrequency; i++) {
        // Apply interest to the current balance
        yearEndValue *= (1 + annualRate / compoundingFrequency);
        
        // Add contributions for the period and apply interest to them
        if(monthlyContribution > 0) {
          const contributionsPerPeriod = (monthlyContribution * 12) / compoundingFrequency;
          yearlyContribution += contributionsPerPeriod;
          yearEndValue += contributionsPerPeriod * (1 + annualRate / compoundingFrequency);
        }
      }
      
      futureValue = yearEndValue;
      totalContributions += yearlyContribution;

      chartData.push({
        year: year,
        principal: principal,
        interest: futureValue - principal - totalContributions,
        contribution: totalContributions,
      });
    }
    
    setResult({
      totalAmount: futureValue,
      totalInterest: futureValue - principal - totalContributions,
      totalContributions,
      chartData,
    });
  };

  const CurrencyIcon = currency === 'INR' ? IndianRupee : 'span';

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden shadow-lg">
        <CardHeader className="bg-muted/30">
          <div className="flex items-center gap-3">
             <Calculator className="h-6 w-6 text-primary" />
             <CardTitle className="text-2xl">Compound Interest Calculator</CardTitle>
          </div>
          <CardDescription>Calculate the future value of your investment with compound interest.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="principal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><CurrencyIcon className="h-4 w-4"/>Principal Amount</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 100,000" {...field} type="number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Percent className="h-4 w-4"/>Annual Interest Rate (%)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 10" {...field} type="number" step="0.01" />
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
                      <FormLabel className="flex items-center gap-2"><CalendarClock className="h-4 w-4"/>Time Period (Years)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 10" {...field} type="number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="compoundingFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Compounding Frequency</FormLabel>
                      <Select onValueChange={(val) => field.onChange(parseInt(val))} defaultValue={String(field.value)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Annually</SelectItem>
                          <SelectItem value="2">Semi-Annually</SelectItem>
                          <SelectItem value="4">Quarterly</SelectItem>
                          <SelectItem value="12">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="monthlyContribution"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2"><Wallet className="h-4 w-4"/>Monthly Contribution (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 5,000" {...field} type="number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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

      {result && (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Total Amount</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold text-primary">{formatNumber(result.totalAmount, { style: 'currency', currency: currency })}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Total Contributions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{formatNumber(result.totalContributions, { style: 'currency', currency: currency })}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Total Interest Earned</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{formatNumber(result.totalInterest, { style: 'currency', currency: currency })}</p>
                    </CardContent>
                </Card>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BarChart className="h-6 w-6" />Investment Growth</CardTitle>
                    <CardDescription>Year-wise growth of your investment.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[350px] w-full">
                    <RechartsBarChart data={result.chartData} stackOffset="sign">
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="year" tickLine={false} tickMargin={10} axisLine={false} unit=" yr" />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tickMargin={10}
                        tickFormatter={(value) => formatNumber(value, {notation: 'compact', compactDisplay: 'short', style: 'currency', currency: currency})}
                      />
                      <ChartTooltip content={<ChartTooltipContent formatter={(value, name, props) => {
                          return (
                            <div className="flex flex-col">
                              <span>{formatNumber(Number(value), {style: 'currency', currency: currency})}</span>
                            </div>
                          )
                        }} />} />
                      <Legend />
                      <Bar dataKey="principal" stackId="a" fill="var(--color-principal)" radius={[0, 0, 4, 4]} />
                      <Bar dataKey="contribution" stackId="a" fill="var(--color-contribution)" radius={[0, 0, 4, 4]} />
                      <Bar dataKey="interest" stackId="a" fill="var(--color-interest)" radius={[4, 4, 0, 0]}/>
                    </RechartsBarChart>
                  </ChartContainer>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}
