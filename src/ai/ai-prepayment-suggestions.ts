'use server';

/**
 * @fileOverview Provides AI-powered suggestions for optimal loan prepayment strategies.
 *
 * - `getPrepaymentSuggestions` -  A function that suggests optimal prepayment strategies.
 * - `PrepaymentSuggestionsInput` - The input type for the `getPrepaymentSuggestions` function.
 * - `PrepaymentSuggestionsOutput` - The return type for the `getPrepaymentSuggestions` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PrepaymentSuggestionsInputSchema = z.object({
  loanAmount: z.number().describe('The total amount of the loan.'),
  interestRate: z.number().describe('The annual interest rate of the loan (as a decimal, e.g., 0.05 for 5%).'),
  loanTenureMonths: z.number().describe('The total tenure of the loan in months.'),
  monthlyPayment: z.number().describe('The current monthly payment amount.'),
  financialGoals: z.string().describe('The user financial goals, e.g., pay off the loan quickly, minimize interest.'),
  riskTolerance: z.string().describe('The user risk tolerance, e.g., aggressive, moderate, conservative.'),
});
export type PrepaymentSuggestionsInput = z.infer<typeof PrepaymentSuggestionsInputSchema>;

const PrepaymentSuggestionsOutputSchema = z.object({
  suggestedStrategy: z.string().describe('An AI-optimized prepayment strategy including lump sum amounts and extra monthly payments.'),
  estimatedInterestSavings: z.number().describe('The estimated total interest savings from following the suggested strategy.'),
  estimatedTenureReductionMonths: z.number().describe('The estimated reduction in loan tenure (in months) from following the suggested strategy.'),
  reasoning: z.string().describe('The AI reasoning behind the suggested strategy.')
});
export type PrepaymentSuggestionsOutput = z.infer<typeof PrepaymentSuggestionsOutputSchema>;

export async function getPrepaymentSuggestions(input: PrepaymentSuggestionsInput): Promise<PrepaymentSuggestionsOutput> {
  return prepaymentSuggestionsFlow(input);
}

const prepaymentSuggestionsPrompt = ai.definePrompt({
  name: 'prepaymentSuggestionsPrompt',
  input: {schema: PrepaymentSuggestionsInputSchema},
  output: {schema: PrepaymentSuggestionsOutputSchema},
  prompt: `You are an AI financial advisor specializing in loan prepayment strategies.

  Based on the following loan details and financial goals, provide an optimal prepayment strategy:

  Loan Amount: {{{loanAmount}}}
  Interest Rate: {{{interestRate}}}
  Loan Tenure (Months): {{{loanTenureMonths}}}
  Current Monthly Payment: {{{monthlyPayment}}}
  Financial Goals: {{{financialGoals}}}
  Risk Tolerance: {{{riskTolerance}}}

  Suggest a prepayment strategy that includes both lump sum payments (if applicable) and extra monthly payments.
  Provide the estimated interest savings and loan tenure reduction (in months) that would result from following your strategy.
  Explain your reasoning behind the suggested strategy, considering the user's goals and risk tolerance.

  Follow the output schema format closely.
  `,
});

const prepaymentSuggestionsFlow = ai.defineFlow(
  {
    name: 'prepaymentSuggestionsFlow',
    inputSchema: PrepaymentSuggestionsInputSchema,
    outputSchema: PrepaymentSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prepaymentSuggestionsPrompt(input);
    return output!;
  }
);
