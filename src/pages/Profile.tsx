// src/pages/Profile.tsx
import { useRef, useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useContract,
  useSendTransaction,
  useEvents,
  useBlock,
} from "@starknet-react/core";
import { useAppStore } from "@/stores/useAppStore";
import { useGSAP } from "@/hooks/useGSAP";
import { Dataset, DatasetCategory } from "@/lib/starknet";
import { DatasetCard } from "@/components/DatasetCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Wallet,
  Copy,
  ExternalLink,
  History,
  ArrowLeft,
  Home,
} from "lucide-react"; // Added ArrowLeft and Home
import AINEST_ABI from "@/utils/AINEST_ABI.json";
import { AINEST_ADDRESS } from "@/utils/contracts";
import {
  toU256,
  fromU256,
  decodeByteArray,
  parseUint256FromIntegerString,
} from "@/utils/cairo";
import { BlockTag } from "starknet";

export const Profile = () => {
  const profileRef = useRef<HTMLDivElement>(null);
  const { animatePageEnter } = useGSAP();
  const { address, isConnected, account } = useAccount();
  const {
    contractDatasets,
    setUploadModalOpen,
    isLoading,
    setLoading,
    setContractDatasets,
  } = useAppStore();
  const { contract } = useContract({
    abi: AINEST_ABI as any,
    address: AINEST_ADDRESS,
  });
  const { send } = useSendTransaction({
    calls: undefined,
  });
  const { toast } = useToast();
  const safeName = (id: number) => `Dataset #${id}`;

  const myAddr = (address || "").toLowerCase();
  const [activeTab, setActiveTab] = useState<
    "onSale" | "purchased" | "sold" | "activity"
  >("onSale");

  const load = async () => {
    if (!contract) return;

    setLoading(true);
    try {
      const countRes: any = await (contract as any).get_dataset_count();
      const count = Number(fromU256(countRes));

      const results: Dataset[] = [];

      for (let id = 1; id <= count; id++) {
        try {
          const d: any = await (contract as any).get_dataset(toU256(id));

          const ownerRaw = d.owner ?? d[0];
          const rawNameData = d.name ?? d[1];
          const ipfs_hash = d.ipfs_hash ?? d[2];
          const priceU256 = d.price ?? d[3];
          const category = d.category ?? d[4];
          const originalOwner = d.originalOwner ?? d[5];
          const isListed = d.listed ?? d[6];

          const owner =
            typeof ownerRaw === "string"
              ? ownerRaw
              : `0x${BigInt(ownerRaw).toString(16)}`;

          const name =
            typeof rawNameData === "string" && rawNameData.trim() !== ""
              ? rawNameData.trim()
              : decodeByteArray(rawNameData) || safeName(id);

          const categoryStr = decodeByteArray(category) || "Uncategorized";
          const priceRaw = fromU256(priceU256);

          const datasetId = BigInt(id);

          const datasetObj: Dataset = {
            id: datasetId,
            name,
            owner,
            originalOwner,
            ipfs_hash:
              typeof ipfs_hash === "string"
                ? ipfs_hash
                : `0x${BigInt(ipfs_hash).toString(16)}`,
            price: priceRaw,
            category: categoryStr as DatasetCategory,
            listed: isListed,
          };

          results.push(datasetObj);
        } catch (e) {
          console.log(`get_dataset(${id}) failed`, e);
        }
      }

      setContractDatasets(results);
    } catch (e) {
      console.error("Failed to load datasets:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [contract, account, setLoading, setContractDatasets]);

  // Owned by me (current owner)
  const myOwned = useMemo(
    () =>
      contractDatasets.filter((d) => {
        if (d?.owner === myAddr.toLowerCase().replace(/^0x0/, "0x")) {
          return d;
        }
      }),
    [contractDatasets, myAddr]
  );

  // My listings still for sale
  const myOnSale = useMemo(
    () =>
      contractDatasets.filter((d) => {
        const normalizedMyAddr = myAddr.toLowerCase().replace(/^0x0/, "0x");
        if (d.listed === true && d?.owner === normalizedMyAddr) {
          return d;
        }
      }),
    [contractDatasets, myAddr]
  );

  // Purchased by me
  const myPurchased = useMemo(
    () =>
      contractDatasets.filter((d) => {
        if (
          d?.owner === myAddr.toLowerCase().replace(/^0x0/, "0x") &&
          d?.originalOwner !== myAddr.toLowerCase().replace(/^0x0/, "0x") &&
          d?.listed === false
        ) {
          return d;
        }
      }),
    [contractDatasets, myAddr]
  );

  // Sold by me
  const mySold = useMemo(
    () =>
      contractDatasets.filter((d) => {
        if (
          d?.originalOwner === myAddr.toLowerCase().replace(/^0x0/, "0x") &&
          d?.owner !== myAddr.toLowerCase().replace(/^0x0/, "0x") &&
          d?.listed === false
        ) {
          return d;
        }
      }),
    [contractDatasets, myAddr]
  );

  // Basic stats
  const totalUploads = myOnSale.length + mySold.length;
  const totalOwnedNow = myOwned.length;

  // Fetch recent activity from contract events
  const [recentActivity, setRecentActivity] = useState<
    { id: number; action: string; timestamp: string; blockNumber?: number }[]
  >([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);

  const {
    data: transferredEvents,
    error: transferredError,
    refetch: refetchTransferred,
  } = useEvents({
    address: AINEST_ADDRESS,
    eventName: "DatasetTransferred",
    fromBlock: 1629872,
    toBlock: BlockTag.LATEST,
    pageSize: 50,
    retry: 5,
    retryDelay: 2000,
    enabled: true,
    refetchInterval: 60000,
  });

  const {
    data: relistedEvents,
    error: relistedError,
    refetch: refetchRelisted,
  } = useEvents({
    address: AINEST_ADDRESS,
    eventName: "DatasetRelisted",
    fromBlock: 1629872,
    toBlock: BlockTag.LATEST,
    pageSize: 50,
    retry: 5,
    retryDelay: 2000,
    enabled: true,
    refetchInterval: 60000,
  });

  const { data: block } = useBlock({ refetchInterval: 10000 });

  // Update recent activity when events change
  useEffect(() => {
    setIsLoadingActivity(true);
    const activity: {
      id: number;
      action: string;
      timestamp: string;
      blockNumber?: number;
    }[] = [];
    console.log("Transferred Events Data:", transferredEvents);
    console.log("Relisted Events Data:", relistedEvents);
    console.log("Current Block:", block?.block_number);

    if (transferredEvents?.pages) {
      transferredEvents.pages.forEach((page, pageIndex) => {
        const events = page.events || [];
        events.forEach((event, eventIndex) => {
          console.log("Event Data:", event);
          const dataset_id = event.data?.[0];
          const from = event.data?.[2];
          const to = event.data?.[3];
          const blockNumber = event.block_number;
          const transactionHash = event.transaction_hash;
          if (dataset_id && from && to) {
            activity.push({
              id: pageIndex * 50 + eventIndex,
              action: `Transferred dataset #${Number(
                dataset_id
              )} from ${from} to ${to}. Transaction Hash: ${transactionHash}`,
              timestamp: blockNumber
                ? new Date().toISOString()
                : new Date().toISOString(),
              blockNumber,
            });
          }
        });
      });
    }

    if (relistedEvents?.pages) {
      relistedEvents.pages.forEach((page, pageIndex) => {
        const events = page.events || [];
        events.forEach((event, eventIndex) => {
          const dataset_id = event.data?.[0];
          const owner = event.data?.[1];
          const price = event.data?.[2];
          const blockNumber = event.block_number;
          if (dataset_id && owner && price) {
            activity.push({
              id: pageIndex * 50 + eventIndex,
              action: `Relisted dataset #${Number(
                dataset_id
              )} by ${owner} for ${Number(price)}`,
              timestamp: blockNumber
                ? new Date().toISOString()
                : new Date().toISOString(),
              blockNumber,
            });
          }
        });
      });
    }

    // Sort by blockNumber or timestamp (descending)
    activity.sort((a, b) => (b.blockNumber || 0) - (a.blockNumber || 0));
    console.log("Processed Activity:", activity);
    setRecentActivity(activity);
    setIsLoadingActivity(false);
  }, [transferredEvents, relistedEvents, block]);

  // Refetch events after a purchase
  const handlePurchase = async (datasetId: string) => {
    if (!contract) return;
    try {
      const call = {
        contractAddress: AINEST_ADDRESS,
        entrypoint: "purchase_dataset",
        calldata: [BigInt(datasetId)],
      };

      if (!call) {
        throw new Error("Failed to create contract call");
      }

      const tx = await send([call]);
      toast({ title: "Purchasing dataset..." });

      // Wait and refetch events
      setTimeout(async () => {
        await refetchTransferred();
        await refetchRelisted();
        load(); // Reload datasets
        toast({ title: "Dataset purchased!" });
      }, 10000);
    } catch (err) {
      console.error(err);
      setTimeout(() => toast({ title: "Failed to purchase dataset" }), 5000);
    }
  };

  // Manual refetch button
  const handleManualRefetch = async () => {
    setIsLoadingActivity(true);
    await refetchTransferred();
    await refetchRelisted();
    setIsLoadingActivity(false);
    toast({ title: "Refetched events!" });
  };

  useEffect(() => {
    if (profileRef.current) animatePageEnter(profileRef.current);
  }, [animatePageEnter]);

  const formatAddress = (addr: string) =>
    `${addr.slice(0, 8)}...${addr.slice(-6)}`;

  const copyAddress = () => address && navigator.clipboard.writeText(address);

  const generateAvatar = (addr: string) => {
    const hash = addr.slice(2, 8);
    const hue = parseInt(hash || "0", 16) % 360;
    return `hsl(${hue}, 50%, 50%)`;
  };

  const handleRelist = async (datasetId: string, price: string) => {
    if (!contract) return;
    try {
      const newPrice = parseUint256FromIntegerString(price);

      const call = {
        contractAddress: AINEST_ADDRESS,
        entrypoint: "list_for_sale",
        calldata: [
          BigInt(datasetId),
          { low: newPrice.low, high: newPrice.high },
        ],
      };

      if (!call) {
        throw new Error("Failed to create contract call");
      }

      send([call]);

      setTimeout(() => {
        toast({ title: "Dataset relisted!" });
        load();
      }, 5000);
    } catch (err) {
      console.error(err);
      setTimeout(() => toast({ title: "Failed to relist dataset" }), 5000);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Wallet className="h-16 w-16 text-muted-foreground mx-auto" />
          <h2 className="text-2xl font-semibold text-foreground">
            Connect Your Wallet
          </h2>
          <p className="text-muted-foreground">
            Please connect your wallet to view your profile
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={profileRef} className="min-h-screen p-6">
      <div className="container mx-auto max-w-6xl space-y-8">
        {/* Navigation Buttons */}
        <div className="mb-6 flex space-x-4">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/")}
            className="flex items-center space-x-2"
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Button>
        </div>

        {/* Profile Header */}
        <div className="ainest-card">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl"
              style={{ backgroundColor: generateAvatar(address || "") }}
            >
              {address?.slice(2, 4).toUpperCase()}
            </div>

            {/* User Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  My Profile
                </h1>
                <div className="flex items-center space-x-2">
                  <code className="bg-muted px-3 py-1 rounded font-mono text-sm">
                    {formatAddress(address || "")}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyAddress}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-6 w-6 p-0"
                  >
                    <a
                      href={`https://starkscan.co/contract/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Uploads:
                  </span>
                  <Badge variant="secondary">{totalUploads}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Currently Own:
                  </span>
                  <Badge variant="secondary">{totalOwnedNow}</Badge>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <Button
                onClick={() => setUploadModalOpen(true)}
                className="ainest-btn-primary flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>Upload Dataset</span>
              </Button>
              <Button
                onClick={handleManualRefetch}
                className="ainest-btn-primary flex items-center space-x-2"
              >
                <History className="h-4 w-4" />
                <span>Refresh Activity</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-6 border-b pb-2">
          <button
            onClick={() => setActiveTab("onSale")}
            className={activeTab === "onSale" ? "font-bold" : ""}
          >
            On Sale
          </button>
          <button
            onClick={() => setActiveTab("purchased")}
            className={activeTab === "purchased" ? "font-bold" : ""}
          >
            Purchased
          </button>
          <button
            onClick={() => setActiveTab("sold")}
            className={activeTab === "sold" ? "font-bold" : ""}
          >
            Sold
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={activeTab === "activity" ? "font-bold" : ""}
          >
            Recent Activity
          </button>
        </div>

        {/* Sections */}
        {activeTab === "onSale" && (
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">On Sale</h2>
            {myOnSale.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myOnSale.map((dataset) => (
                  <div key={dataset.id.toString()} className="space-y-2">
                    <DatasetCard dataset={dataset} onView={() => {}} />
                  </div>
                ))}
              </div>
            ) : (
              <p>No active listings</p>
            )}
          </section>
        )}

        {activeTab === "purchased" && (
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">
              Purchased
            </h2>
            {myPurchased.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myPurchased.map((dataset) => (
                  <div key={dataset.id.toString()} className="space-y-2">
                    <DatasetCard
                      key={dataset.id.toString()}
                      dataset={dataset}
                      onView={() => {}}
                    />
                    <Button
                      size="sm"
                      onClick={() =>
                        handleRelist(
                          dataset.id.toString(),
                          "1000000000000000000"
                        )
                      }
                    >
                      Re-list
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p>No purchases yet</p>
            )}
          </section>
        )}

        {activeTab === "sold" && (
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">Sold</h2>
            {mySold.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mySold.map((dataset) => (
                  <div key={dataset.id.toString()} className="space-y-2">
                    <DatasetCard
                      key={dataset.id.toString()}
                      dataset={dataset}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p>No sold datasets</p>
            )}
          </section>
        )}

        {activeTab === "activity" && (
          <section className="space-y-6">
            <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <History className="h-5 w-5" /> Recent Activity
            </h2>
            {isLoadingActivity ? (
              <p>Loading activity...</p>
            ) : transferredError || relistedError ? (
              <p className="text-red-500">
                Failed to load activity. Please try again later.
              </p>
            ) : recentActivity.length > 0 ? (
              <ul className="space-y-2">
                {recentActivity.map((a) => (
                  <li key={a.id} className="flex justify-between border-b pb-2">
                    <span>{a.action}</span>
                    <span className="text-muted-foreground text-sm">
                      {new Date(a.timestamp).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No recent activity found.</p>
            )}
          </section>
        )}
      </div>
    </div>
  );
};
