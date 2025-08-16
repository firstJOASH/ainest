import { useRef, useState } from "react";
import { useGSAP } from "@/hooks/useGSAP";
import { Dataset } from "@/lib/starknet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DatasetPreviewModal } from "@/components/DatasetPreviewModal";
import { Download, Eye, User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { STRK_ADDRESS, AINEST_ADDRESS } from "@/utils/contracts";
import { uint256 } from "starknet";
import { useAccount, useSendTransaction } from "@starknet-react/core";

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

  // Initialize useSendTransaction (docs show you can pass calls initially;
  // we pass undefined and override at send time).
  const {
    send, // quick fire-and-forget send (void)
    sendAsync, // promise-based send that returns tx result
    isPending,
    isSuccess,
    isError,
    error,
  } = useSendTransaction({ calls: undefined });

  const formatAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const formatPrice = (price: bigint) => {
    // Convert raw wei to STRK for display
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

  // const handlePurchase = async () => {
  //   if (!isConnected || !STRK_ADDRESS || !AINEST_ADDRESS) {
  //     toast({
  //       title: "Wallet or Contract Issue",
  //       description:
  //         "Please connect your Starknet wallet and ensure contracts are loaded",
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   setIsPurchasing(true);
  //   try {
  //     // Approve AInestRegistry to spend the price
  //     const priceU256 = uint256.bnToUint256(dataset.price);
  //     const datasetIdU256 = uint256.bnToUint256(dataset.id);

  //     // combine low/high into BigInt
  //     function u256ToBigInt(u: {
  //       low: string | number | bigint;
  //       high: string | number | bigint;
  //     }) {
  //       const low = BigInt(u.low);
  //       const high = BigInt(u.high);
  //       return (high << 128n) + low;
  //     }

  //     const storedPrice = u256ToBigInt(priceU256);
  //     console.log("stored price (wei):", storedPrice.toString());
  //     console.log("stored price (STRK):", Number(storedPrice) / 1e18);

  //     const approveCall = {
  //       contractAddress: STRK_ADDRESS,
  //       entrypoint: "approve",
  //       calldata: [AINEST_ADDRESS, priceU256.low, priceU256.high],
  //     };

  //     if (!approveCall) throw new Error("Approve call preparation failed");

  //     // Send approval transaction and wait for confirmation
  //     toast({
  //       title: "Requesting approval...",
  //       description: "Please confirm in your wallet",
  //     });
  //     await sendAsync([approveCall]);
  //     await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s for approval to propagate (adjust as needed)

  //     // Purchase dataset
  //     const purchaseCall = {
  //       contractAddress: AINEST_ADDRESS,
  //       entrypoint: "purchase_dataset",
  //       calldata: [datasetIdU256.low, datasetIdU256.high],
  //     };
  //     if (!purchaseCall) throw new Error("Purchase call preparation failed");

  //     toast({
  //       title: "Purchasing dataset...",
  //       description: "Please confirm the transaction",
  //     });
  //     const txResult = await sendAsync([purchaseCall]);
  //     console.log("Purchase TX result:", txResult);

  //     if (isSuccess) {
  //       toast({ title: "Purchase successful!" });
  //       onPurchase?.(dataset);
  //     }
  //   } catch (err: any) {
  //     console.error("Purchase failed:", err);
  //     toast({
  //       title: "Purchase failed",
  //       description: err?.message ?? "An unexpected error occurred",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsPurchasing(false);
  //     if (isError) reset();
  //   }
  // };

  const handlePurchase = async () => {
    if (!isConnected || !STRK_ADDRESS || !AINEST_ADDRESS) {
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
      // Convert dataset price to u256 for the transaction
      const priceU256 = uint256.bnToUint256(dataset.price);
      const datasetIdU256 = uint256.bnToUint256(dataset.id);

      console.log("Price (wei):", dataset.price.toString());
      console.log("Price (STRK):", Number(dataset.price) / 1e18);

      // Approve AInest contract to spend STRK
      const approveCall = {
        contractAddress: STRK_ADDRESS,
        entrypoint: "approve",
        calldata: [AINEST_ADDRESS, priceU256.low, priceU256.high],
      };
      await sendAsync([approveCall]);
      toast({ title: "Approval requested. Confirm in wallet." });

      // Purchase dataset
      const purchaseCall = {
        contractAddress: AINEST_ADDRESS,
        entrypoint: "purchase_dataset",
        calldata: [datasetIdU256.low, datasetIdU256.high],
      };
      const txResult = await sendAsync([purchaseCall]);
      console.log("Purchase TX result:", txResult);

      toast({ title: "Purchase successful!" });
      onPurchase?.(dataset);
    } catch (err: any) {
      console.error("Purchase failed:", err);
      toast({
        title: "Purchase failed",
        description: err?.message ?? "An unexpected error occurred",
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

      {/* Optional inline error for debugging */}
      {error && (
        <p className="text-xs text-red-500 mt-2">Error: {error.message}</p>
      )}
    </div>
  );
};
