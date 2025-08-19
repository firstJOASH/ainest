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
import { AINEST_ADDRESS } from "@/utils/contracts";
import { decodeByteArray } from "@/utils/cairo";

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

const safeName = (id: number) => `Dataset #${id}`;

export const Marketplace = () => {
  const mainRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const { animatePageEnter, animateGridItems } = useGSAP();

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"newest" | "price" | "popular">(
    "newest"
  );

  const {
    selectedCategory,
    searchQuery,
    setSearchQuery,
    isLoading,
    setLoading,
    contractDatasets,
    setContractDatasets,
  } = useAppStore();

  const { account } = useAccount();

  const { contract } = useContract({
    abi: AINEST_ABI as Array<any>,
    address: AINEST_ADDRESS,
  });

  // Define load function outside useEffect to make it reusable
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
          console.log("Raw dataset response:", d);

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
          console.log(datasetId);

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

  // Only show datasets that are still for sale
  const filteredDatasets = contractDatasets
    .filter((dataset) => {
      const matchesCategory =
        selectedCategory === "All" || dataset.category === selectedCategory;
      const matchesSearch = dataset.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      // Convert originalOwner to string if not already
      const originalOwnerStr =
        typeof dataset.originalOwner === "string"
          ? dataset.originalOwner
          : `0x${BigInt(dataset.originalOwner).toString(16)}`;
      const isForSale =
        dataset.owner.toLowerCase() === originalOwnerStr.toLowerCase() &&
        dataset.listed === true;
      // console.log("Dataset:", dataset, "Is For Sale:", isForSale);
      return matchesCategory && matchesSearch && isForSale;
    })
    .sort((a, b) => {
      if (sortBy === "price") return Number(a.price - b.price);
      if (sortBy === "newest") return Number(b.id - a.id);
      return 0;
    });

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
                onView={() => {}}
                onPurchase={async () => {
                  await load(); // Now accessible
                }}
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
