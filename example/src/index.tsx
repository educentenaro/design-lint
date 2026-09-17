import { App } from "./App";
import { TailwindPanel } from "./TailwindPanel";

export function ExampleEntry() {
  return (
    <>
      <App />
      <div className="px-8 pb-12">
        <TailwindPanel />
      </div>
    </>
  );
}