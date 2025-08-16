import { useRef, useEffect, useState } from "react";
import { useAppStore } from "@/stores/useAppStore";
import { useGSAP } from "@/hooks/useGSAP";
import { Dataset, DatasetCategory } from "@/lib/starknet";
import { CategorySidebar } from "@/components/CategorySidebar";
import { DatasetCard } from "@/components/DatasetCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Grid, List } from "lucide-react";
import { useAccount, useContract } from "@starknet-react/core";
import AINEST_ABI from "@/utils/AINEST_ABI.json";
import { AINEST_ADDRESS, STRK_ADDRESS } from "@/utils/contracts";
import { decodeByteArray, ipfsHashToFelt252 } from "@/utils/cairo";

/** Helpers for u256 <-> bigint */
const toU256 = (n: number | bigint) => ({
  low: BigInt(n) & ((1n << 128n) - 1n),
  high: BigInt(n) >> 128n,
});
const fromU256 = (u: any): bigint => {
  if (!u) return 0n;
  if (typeof u === "bigint") return u;
  if (typeof u === "string") return BigInt(u);
  if (Array.isArray(u) && u.length >= 2) {
    return (BigInt(u[1]) << 128n) + BigInt(u[0]);
  }
  if ("low" in u && "high" in u) {
    return (BigInt(u.high) << 128n) + BigInt(u.low);
  }
  return 0n;
};

/** VERY simple fallback for ByteArray -> string (shows a friendly placeholder) */
const safeName = (id: number) => `Dataset #${id}`;

export const Marketplace = () => {
  const mainRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const { animatePageEnter, animateGridItems } = useGSAP();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"newest" | "price" | "popular">(
    "newest"
  );
  const [contractDatasets, setContractDatasets] = useState<Dataset[]>([]);

  const {
    selectedCategory,
    searchQuery,
    setSearchQuery,
    isLoading,
    setLoading,
  } = useAppStore();

  const { account } = useAccount();

  // Create a Contract instance (uses account when connected, otherwise provider)
  const { contract } = useContract({
    abi: AINEST_ABI as any,
    address: AINEST_ADDRESS,
  });

  // Load all datasets
  useEffect(() => {
    const load = async () => {
      if (!contract) return;

      setLoading(true);
      try {
        // 1) read dataset count
        const countRes: any = await (contract as any).get_dataset_count();
        const count = Number(fromU256(countRes));

        const results: Dataset[] = [];

        // 2) read each dataset
        for (let id = 1; id <= count; id++) {
          try {
            console.log(`\n=== Loading Dataset ${id} ===`);
            const d: any = await (contract as any).get_dataset(toU256(id));
            console.log(`Dataset ${id} full contract response:`, d);

            const owner = d.owner ?? d[0];
            const ipfs_hash = d.ipfs_hash ?? d[2];
            const priceU256 = d.price ?? d[3];
            const category = d.category ?? d[4];

            const formatPrice = (price: bigint) => {
              const priceInStrk = Number(price); // No division by 1e18

              if (priceInStrk === 0) {
                return "Free";
              } else if (priceInStrk < 0.001) {
                return `${priceInStrk.toFixed(18)} STRK`;
              } else if (priceInStrk < 1) {
                return `${priceInStrk.toFixed(3)} STRK`;
              } else {
                return `${priceInStrk.toFixed(2)} STRK`;
              }
            };

            const priceRaw = fromU256(priceU256); // Raw bigint value

            // Debug the raw name data from contract
            const rawNameData = d.name ?? d[1];
            console.log(`Dataset ${id} raw name data:`, rawNameData);
            console.log(
              `Dataset ${id} raw name data type:`,
              typeof rawNameData
            );

            let name: string;

            // Since it’s already a string, use it directly
            if (typeof rawNameData === "string" && rawNameData.trim() !== "") {
              name = rawNameData.trim();
              console.log(`Dataset ${id} using raw string name: "${name}"`);
            } else {
              // Only decode if it's not a string (i.e., it's a ByteArray)
              const decodedName = decodeByteArray(rawNameData);
              console.log(`Dataset ${id} decoded name: "${decodedName}"`);
              name = decodedName || safeName(id);
              console.log(
                `Dataset ${id} using decoded/fallback name: "${name}"`
              );
            }

            const categoryStr = decodeByteArray(category) || "Uncategorized";
            console.log(`Dataset ${id} category: "${categoryStr}"`);

            const datasetObj = {
              id: BigInt(id),
              name,
              owner:
                typeof owner === "string"
                  ? owner
                  : `0x${BigInt(owner).toString(16)}`,
              ipfs_hash:
                typeof ipfs_hash === "string"
                  ? ipfs_hash
                  : `0x${BigInt(ipfs_hash).toString(16)}`,
              price: priceRaw, // Use raw bigint for calculations
              category: categoryStr as DatasetCategory,
            };

            console.log(`Dataset ${id} final object:`, datasetObj);
            console.log(`=== End Dataset ${id} ===\n`);

            results.push(datasetObj);
          } catch (e) {
            // Skip missing IDs gracefully
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

    load();
  }, [contract, account, setLoading]);

  // Filter and sort for UI
  const filteredDatasets = contractDatasets
    .filter((dataset) => {
      const matchesCategory =
        selectedCategory === "All" || dataset.category === selectedCategory;
      const matchesSearch = dataset.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "price") return Number(a.price - b.price);
      if (sortBy === "newest") return Number(b.id - a.id);
      return 0; // TODO: Implement popularity
    });

  // Implement purchase
  const handleDatasetPurchase = async (dataset: Dataset) => {
    if (!account || !contract) {
      console.log("Wallet not connected or contract not loaded");
      return;
    }

    console.log("Initiating purchase for dataset:", dataset);
    try {
      const priceInWei = dataset.price; // Use raw bigint
      console.log("Price in Wei:", priceInWei.toString());

      // Approve STRK spending
      const approveCall = {
        contractAddress: STRK_ADDRESS,
        entrypoint: "approve",
        calldata: callData.compile({
          spender: AINEST_ADDRESS,
          amount: priceInWei.toString(),
        }),
      };
      console.log("Approve call:", approveCall);

      // Purchase dataset
      const purchaseCall = {
        contractAddress: AINEST_ADDRESS,
        entrypoint: "purchase_dataset",
        calldata: [dataset.id.toString(), "0"], // Adjust calldata based on ABI
      };
      console.log("Purchase call:", purchaseCall);

      const calls = [approveCall, purchaseCall];
      console.log("Executing transactions:", calls);

      const tx = await account.execute(calls, {
        maxFee: 0n, // Let the wallet estimate fee (adjust if needed)
      });
      console.log("Transaction sent, hash:", tx.transaction_hash);

      // Wait for transaction receipt (optional, adjust timeout)
      const receipt = await tx.wait({ timeout: 30000 }); // 30 seconds timeout
      console.log("Transaction confirmed, receipt:", receipt);
    } catch (e) {
      console.error("Purchase failed:", e);
      if (e instanceof Error) {
        console.error("Error details:", e.message, e.stack);
      }
    }
  };

  // Animations
  useEffect(() => {
    if (mainRef.current) animatePageEnter(mainRef.current);
  }, [animatePageEnter]);

  useEffect(() => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll(".ainest-dataset-card");
    if (cards.length > 0) animateGridItems(cards);
  }, [filteredDatasets, selectedCategory, searchQuery, animateGridItems]);

  return (
    <div className="flex min-h-screen">
      <CategorySidebar />

      <main ref={mainRef} className="flex-1 p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="ainest-section-title mb-4">Dataset Marketplace</h1>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search datasets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 ainest-input"
              />
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="ainest-input text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="price">Price: Low to High</option>
                <option value="popular">Most Popular</option>
              </select>

              <div className="flex items-center border border-border rounded-lg p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="h-8 w-8 p-0"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            {filteredDatasets.length} datasets found
            {selectedCategory !== "All" && ` in ${selectedCategory}`}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>

        {/* Dataset Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="ainest-card animate-pulse">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-muted rounded mb-4"></div>
                <div className="flex space-x-2">
                  <div className="h-8 bg-muted rounded flex-1"></div>
                  <div className="h-8 bg-muted rounded flex-1"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredDatasets.length > 0 ? (
          <div
            ref={gridRef}
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            {filteredDatasets.map((dataset) => (
              <DatasetCard
                key={dataset.id.toString()}
                dataset={dataset}
                onView={() => console.log("View", dataset)}
                onPurchase={() => handleDatasetPurchase(dataset)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No datasets found
            </h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search criteria or browse different categories.
            </p>
            <Button onClick={() => setSearchQuery("")} variant="outline">
              Clear Filters
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};
