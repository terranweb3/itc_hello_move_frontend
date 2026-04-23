import { useMemo, useState } from "react";
import { useCurrentAccount, useDAppKit } from "@mysten/dapp-kit-react";
import { Transaction } from "@mysten/sui/transactions";

const PACKAGE_ID =
  "0xf840baba8a4ac1a05926039e7bffd7a333d892b5ca0f372fd62376e01a20e9d9";
const NETWORK = "testnet";
const TARGET_NEW = `${PACKAGE_ID}::greeting::new`;
const TARGET_UPDATE_TEXT = `${PACKAGE_ID}::greeting::update_text`;

type TxFeedback = {
  status: "idle" | "pending" | "success" | "error";
  action: "create" | "update" | null;
  digest: string | null;
  message: string;
};

function extractCreatedObjectId(txEffects: unknown): string | null {
  if (!txEffects || typeof txEffects !== "object") {
    return null;
  }

  const effects = txEffects as {
    created?: Array<{
      reference?: {
        objectId?: string;
      };
      owner?: unknown;
    }>;
  };

  if (!Array.isArray(effects.created)) {
    return null;
  }

  const sharedCreated = effects.created.find((entry) => {
    if (!entry || typeof entry !== "object") {
      return false;
    }

    const owner = entry.owner;
    return Boolean(owner && typeof owner === "object" && "Shared" in owner);
  });

  return (
    sharedCreated?.reference?.objectId ?? effects.created[0]?.reference?.objectId ?? null
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected error while sending transaction.";
}

function getTxExplorerLink(digest: string): string {
  return `https://suiexplorer.com/txblock/${digest}?network=${NETWORK}`;
}

function getObjectExplorerLink(objectId: string): string {
  return `https://suiexplorer.com/object/${objectId}?network=${NETWORK}`;
}

export default function GreetingManager() {
  const dAppKit = useDAppKit();
  const account = useCurrentAccount();

  const [newText, setNewText] = useState("Xin chao ITC!");
  const [greetingObjectId, setGreetingObjectId] = useState("");
  const [createdGreetingId, setCreatedGreetingId] = useState<string | null>(null);
  const [txFeedback, setTxFeedback] = useState<TxFeedback>({
    status: "idle",
    action: null,
    digest: null,
    message: "No transaction submitted yet.",
  });

  const isConnected = Boolean(account);
  const canUpdate = isConnected && greetingObjectId.trim().length > 0 && newText.trim().length > 0;
  const canCreate = isConnected;

  const feedbackTitle = useMemo(() => {
    if (txFeedback.status === "idle") {
      return "Last transaction";
    }
    if (txFeedback.status === "pending") {
      return "Submitting transaction...";
    }
    if (txFeedback.status === "success") {
      return "Transaction success";
    }
    return "Transaction failed";
  }, [txFeedback.status]);

  async function handleCreateGreeting() {
    const tx = new Transaction();
    tx.moveCall({
      target: TARGET_NEW,
      arguments: [],
    });

    setTxFeedback({
      status: "pending",
      action: "create",
      digest: null,
      message: "Creating shared Greeting object...",
    });

    try {
      const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

      if (result.FailedTransaction) {
        throw new Error(result.FailedTransaction.status.error?.message ?? "Transaction failed.");
      }

      const digest = result.Transaction.digest;
      const objectId = extractCreatedObjectId(result.Transaction.effects);

      if (objectId) {
        setCreatedGreetingId(objectId);
        setGreetingObjectId(objectId);
      }

      setTxFeedback({
        status: "success",
        action: "create",
        digest,
        message: objectId
          ? `Greeting created: ${objectId}`
          : "Greeting created. Copy object ID from explorer if needed.",
      });
    } catch (error) {
      setTxFeedback({
        status: "error",
        action: "create",
        digest: null,
        message: getErrorMessage(error),
      });
    }
  }

  async function handleUpdateGreetingText() {
    const objectId = greetingObjectId.trim();
    const text = newText.trim();

    if (!objectId || !text) {
      return;
    }

    const tx = new Transaction();
    tx.moveCall({
      target: TARGET_UPDATE_TEXT,
      arguments: [tx.object(objectId), tx.pure.string(text)],
    });

    setTxFeedback({
      status: "pending",
      action: "update",
      digest: null,
      message: "Updating greeting text...",
    });

    try {
      const result = await dAppKit.signAndExecuteTransaction({ transaction: tx });

      if (result.FailedTransaction) {
        throw new Error(result.FailedTransaction.status.error?.message ?? "Transaction failed.");
      }

      setTxFeedback({
        status: "success",
        action: "update",
        digest: result.Transaction.digest,
        message: "Greeting text updated successfully.",
      });
    } catch (error) {
      setTxFeedback({
        status: "error",
        action: "update",
        digest: null,
        message: getErrorMessage(error),
      });
    }
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
      <h2 className="text-lg font-semibold">Greeting Contract Actions</h2>
      <p className="mt-1 text-sm text-slate-300">
        Package: <span className="break-all">{PACKAGE_ID}</span>
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label htmlFor="greeting-object-id" className="block text-sm">
          <span className="mb-1 block text-slate-300">Greeting Object ID</span>
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-cyan-500 transition focus:ring-2"
            id="greeting-object-id"
            value={greetingObjectId}
            onChange={(event) => setGreetingObjectId(event.target.value)}
            placeholder="0x... shared greeting object id"
          />
        </label>

        <label htmlFor="new-text" className="block text-sm">
          <span className="mb-1 block text-slate-300">New Text</span>
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-cyan-500 transition focus:ring-2"
            id="new-text"
            value={newText}
            onChange={(event) => setNewText(event.target.value)}
            placeholder="Xin chao ITC!"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          onClick={handleCreateGreeting}
          disabled={!canCreate || txFeedback.status === "pending"}
        >
          Create Greeting
        </button>
        <button
          type="button"
          className="rounded-lg border border-cyan-500 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500"
          onClick={handleUpdateGreetingText}
          disabled={!canUpdate || txFeedback.status === "pending"}
        >
          Update Text
        </button>
      </div>

      {createdGreetingId ? (
        <p className="mt-4 break-all rounded-lg border border-emerald-600/40 bg-emerald-600/10 px-3 py-2 text-sm text-emerald-200">
          Most recent Greeting ID: {createdGreetingId}{" "}
          <a
            className="underline underline-offset-2 hover:text-emerald-100"
            href={getObjectExplorerLink(createdGreetingId)}
            target="_blank"
            rel="noreferrer"
          >
            View on Explorer
          </a>
        </p>
      ) : null}

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
        <h3 className="text-sm font-semibold text-slate-100">{feedbackTitle}</h3>
        <div className="mt-2 space-y-1 text-sm text-slate-300">
          <p>Action: {txFeedback.action ?? "n/a"}</p>
          <p>Status: {txFeedback.status}</p>
          <p className="break-all">Message: {txFeedback.message}</p>
          {txFeedback.digest ? (
            <p className="break-all">
              Digest: {txFeedback.digest}{" "}
              <a
                className="text-cyan-300 underline underline-offset-2 hover:text-cyan-200"
                href={getTxExplorerLink(txFeedback.digest)}
                target="_blank"
                rel="noreferrer"
              >
                View on Explorer
              </a>
            </p>
          ) : null}
          {greetingObjectId.trim() ? (
            <p className="break-all">
              Object: {greetingObjectId.trim()}{" "}
              <a
                className="text-cyan-300 underline underline-offset-2 hover:text-cyan-200"
                href={getObjectExplorerLink(greetingObjectId.trim())}
                target="_blank"
                rel="noreferrer"
              >
                View on Explorer
              </a>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
