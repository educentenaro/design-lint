import "./card.css";

export function Card() {
  return (
    <article className="card-shell rounded-2xl p-6 text-slate-950">
      <h2 className="text-2xl font-semibold">CSS-backed card</h2>
      <p className="mt-3 max-w-md text-sm leading-6">
        This component mixes token references and hardcoded CSS values for a useful lint fixture.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <span className="inline-flex h-3 w-3 rounded-full bg-rose-500" />
        <span className="text-sm font-medium">Status: active</span>
      </div>
    </article>
  );
}