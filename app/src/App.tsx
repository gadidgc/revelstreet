import { ProgressHeader } from './components/ProgressHeader';
import { StopList } from './components/StopList';
import { RouteMap } from './components/RouteMap';
import { CameraModal } from './components/CameraModal';
import { DevPanel } from './components/DevPanel';
import { useSimTick } from './sim/useSimTick';

function App() {
  useSimTick();
  return (
    <div className="flex h-full flex-col bg-canvas">
      <ProgressHeader />
      <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[440px_1fr]">
        <section className="min-h-0 border-r border-hairline">
          <StopList />
        </section>
        <section className="min-h-0 p-4">
          <RouteMap />
        </section>
      </main>
      <CameraModal />
      {import.meta.env.DEV && <DevPanel />}
    </div>
  );
}

export default App;
