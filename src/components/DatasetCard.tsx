import { useRef, useState } from "react";
import { useGSAP } from "@/hooks/useGSAP";
import { Dataset, DatasetCategory } from "@/lib/starknet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DatasetPreviewModal } from "@/components/DatasetPreviewModal";
import { Download, Eye, User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { STRK_ADDRESS, AINEST_ADDRESS } from "@/utils/contracts";
import { uint256 } from "starknet";
import {
  useAccount,
  useSendTransaction,
  useContract,
} from "@starknet-react/core";
import { useAppStore } from "@/stores/useAppStore";
import AINEST_ABI from "@/utils/AINEST_ABI.json";
import STRK_ABI from "@/utils/STRK_ABI.json";
import { fromU256, toU256, decodeByteArray } from "@/utils/cairo";

interface DatasetCardProps {
  dataset: Dataset;
  onView?: (dataset: Dataset) => void;
  onPurchase?: (dataset: Dataset) => void;
}

export const DatasetCard = ({
  dataset,
  onView,
  onPurchase,
}: DatasetCardProps) => {
  const { address, isConnected } = useAccount();
  const cardRef = useRef<HTMLDivElement>(null);
  const { animateCardHover } = useGSAP();
  const { toast } = useToast();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const { setContractDatasets, contractDatasets } = useAppStore();

  const { contract: strkContract } = useContract({
    abi: STRK_ABI as any, // Replace with STRK_ABI if available
    address: STRK_ADDRESS,
  });
  const { contract: ainestContract } = useContract({
    abi: AINEST_ABI as any,
    address: AINEST_ADDRESS,
  });

  const { sendAsync, isPending, isSuccess, isError, error, reset } =
    useSendTransaction({ calls: undefined });

  const formatAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const formatPrice = (price: bigint) => {
    const priceStrk = Number(price) / 1e18;
    if (priceStrk === 0) return "Free";
    if (priceStrk < 1) return `${priceStrk.toFixed(18)} STRK`;
    return `${priceStrk.toFixed(3)} STRK`;
  };

  const priceDisplay = formatPrice(dataset.price);

  const handleMouseEnter = () => {
    if (cardRef.current) animateCardHover(cardRef.current, true);
  };
  const handleMouseLeave = () => {
    if (cardRef.current) animateCardHover(cardRef.current, false);
  };

  const handlePreview = () => {
    setIsPreviewOpen(true);
    onView?.(dataset);
  };

  const reloadDatasets = async () => {
    if (!ainestContract) return;
    const countRes: any = await ainestContract.get_dataset_count();
    const count = Number(fromU256(countRes));
    const results: Dataset[] = [];
    for (let id = 1; id <= count; id++) {
      try {
        const d: any = await ainestContract.get_dataset(toU256(id));
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
            : decodeByteArray(rawNameData) || `Dataset #${id}`;
        const categoryStr = decodeByteArray(category) || "Uncategorized";
        const priceRaw = fromU256(priceU256);
        const description = d?.description ?? d[7];
        const format = d?.format ?? d[8];
        const size = d?.size ?? d[9];
        const createdAt = d?.createdAt ?? d[10];
        const downloads = d?.downloads ?? d[11];

        results.push({
          id: BigInt(id),
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
          description: description,
          format: format,
          size: size,
          createdAt: createdAt,
          downloads: downloads,
        });
      } catch (e) {
        console.log(`get_dataset(${id}) failed`, e);
      }
    }
    setContractDatasets(results);
  };

  const handlePurchase = async () => {
    if (!isConnected || !address || !strkContract || !ainestContract) {
      toast({
        title: "Wallet or Contract Issue",
        description:
          "Please connect your Starknet wallet and ensure contracts are loaded",
        variant: "destructive",
      });
      return;
    }

    setIsPurchasing(true);
    try {
      const priceU256 = uint256.bnToUint256(dataset.price);
      const datasetIdU256 = uint256.bnToUint256(dataset.id);

      const approveCall = {
        contractAddress: STRK_ADDRESS,
        entrypoint: "approve",
        calldata: [AINEST_ADDRESS, priceU256.low, priceU256.high],
      };
      if (!approveCall) throw new Error("Approve call preparation failed");

      toast({
        title: "Requesting approval...",
        description: "Confirm in wallet",
      });
      await sendAsync([approveCall]);
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for approval

      const purchaseCall = {
        contractAddress: AINEST_ADDRESS,
        entrypoint: "purchase_dataset",
        calldata: [datasetIdU256.low, datasetIdU256.high],
      };
      if (!purchaseCall) throw new Error("Purchase call preparation failed");

      toast({
        title: "Purchasing dataset...",
        description: "Confirm transaction",
      });
      const txResult = await sendAsync([purchaseCall]);
      console.log("Purchase TX result:", txResult);

      if (isSuccess) {
        setTimeout(() => toast({ title: "Purchase successful!" }), 5000);
        await reloadDatasets(); // Refresh dataset list
        onPurchase?.(dataset);
      }
    } catch (err: any) {
      console.error("Purchase failed:", err);
      let errorMessage = "An unexpected error occurred";
      if (err?.message?.includes("insufficient")) {
        errorMessage = "Insufficient STRK balance.";
      } else if (err?.message?.includes("not executed")) {
        errorMessage = "Transaction failed due to gas or availability.";
      } else if (err?.message?.includes("rejected")) {
        errorMessage = "Transaction rejected in wallet.";
      } else if (err?.message) {
        errorMessage = err.message;
      }
      toast({
        title: "Purchase failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
      if (isError) reset();
    }
  };

  return (
    <div
      ref={cardRef}
      className="ainest-dataset-card group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-lg mb-2 truncate">
            {dataset.name}
          </h3>
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <User className="h-3 w-3" />
            <span>{formatAddress(dataset.owner)}</span>
          </div>
        </div>
        <Badge variant="secondary" className="ml-2">
          {dataset.category}
        </Badge>
      </div>

      {/* Price */}
      <div className="mb-4">
        <div className="text-2xl font-bold text-foreground">{priceDisplay}</div>
        <div className="text-sm text-muted-foreground">
          Dataset #{dataset.id.toString()}
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreview}
          className="flex-1 flex items-center justify-center space-x-1"
        >
          <Eye className="h-4 w-4" />
          <span>Preview</span>
        </Button>

        <Button
          size="sm"
          onClick={handlePurchase}
          disabled={isPurchasing || isPending}
          className="flex-1 flex items-center justify-center space-x-1 ainest-btn-primary"
        >
          {isPurchasing || isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span>
            {isPurchasing || isPending ? "Purchasing..." : "Purchase"}
          </span>
        </Button>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 border border-ring opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300 pointer-events-none" />

      {/* Preview Modal */}
      <DatasetPreviewModal
        dataset={dataset}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onPurchase={handlePurchase}
      />

      {isError && error && (
        <p className="text-xs text-red-500 mt-2">Error: {error.message}</p>
      )}
    </div>
  );
};
