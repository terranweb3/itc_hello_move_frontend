// App.tsx
import { DAppKitProvider } from "@mysten/dapp-kit-react";
import { ConnectButton } from "@mysten/dapp-kit-react/ui";
import { dAppKit } from "./dapp-kit";
import WalletStatus from "./components/WalletStatus";
import GreetingManager from "./components/GreetingManager";

export default function App() {
  return (
    <DAppKitProvider dAppKit={dAppKit}>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              ITC Hello Move dApp
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Connect wallet, create shared Greeting object, and update text on
              Sui testnet.
            </p>
            <div className="mt-4">
              <ConnectButton />
            </div>
          </div>

          <WalletStatus />
          <GreetingManager />
        </main>
      </div>
    </DAppKitProvider>
  );
}
