import {
  useCurrentAccount,
  useCurrentWallet,
  useCurrentNetwork,
} from "@mysten/dapp-kit-react";

function WalletStatus() {
  const account = useCurrentAccount();
  const wallet = useCurrentWallet();
  const network = useCurrentNetwork();

  if (!account) {
    return (
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <h2 className="text-lg font-semibold">Wallet Status</h2>
        <p className="mt-2 text-sm text-slate-300">
          Connect your wallet to get started.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
      <h2 className="text-lg font-semibold">Wallet Status</h2>
      <div className="mt-3 space-y-2 text-sm text-slate-200">
        <p>
          <span className="text-slate-400">Wallet:</span> {wallet?.name}
        </p>
        <p className="break-all">
          <span className="text-slate-400">Address:</span> {account.address}
        </p>
        <p>
          <span className="text-slate-400">Network:</span> {network}
        </p>
      </div>
    </section>
  );
}

export default WalletStatus;
