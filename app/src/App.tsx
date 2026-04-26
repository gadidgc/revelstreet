import { ProgressHeader } from './components/ProgressHeader';
import { StopList } from './components/StopList';
import { RouteMap } from './components/RouteMap';

function App() {
  return (
    <div className="flex h-full flex-col bg-neutral-950">
      <ProgressHeader />
      <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[420px_1fr]">
        <section className="min-h-0 border-r border-neutral-800">
          <StopList />
        </section>
        <section className="min-h-0">
          <RouteMap />
        </section>
      </main>
    </div>
  );
}

export default App;
