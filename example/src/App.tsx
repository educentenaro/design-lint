import { Button } from "./Button";
import { Card } from "./Card";

export function App() {
  return (
    <main className="min-h-screen bg-slate-950 px-8 py-12 text-slate-50">
      <section className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Design token fixture</p>
          <h1 className="text-4xl font-semibold">React, TypeScript, Tailwind, and CSS testbed</h1>
          <p className="max-w-2xl text-slate-300">
            This sample combines hardcoded values and token-backed references so the linting pipeline has realistic input.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <Button />
          <Card />
        </div>
      </section>
    </main>
  );
}