import { useRef, useEffect, useState } from "react";
import { useGSAP } from "@/hooks/useGSAP";
import { Dataset } from "@/lib/starknet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DatasetPreviewModal } from "@/components/DatasetPreviewModal";
import { Download, Eye, User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const cardRef = useRef<HTMLDivElement>(null);
  const { animateCardHover } = useGSAP();
  const { toast } = useToast();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatPrice = (price: bigint) => {
    // Convert wei to STRK (simplified)
    return `${Number(price) / 1e18} STRK`;
  };

  const handleMouseEnter = () => {
    if (cardRef.current) {
      animateCardHover(cardRef.current, true);
    }
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      animateCardHover(cardRef.current, false);
    }
  };

  const handlePreview = () => {
    setIsPreviewOpen(true);
    onView?.(dataset);
  };

  const handlePurchase = async () => {
    setIsPurchasing(true);
    try {
      // Mock purchase process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      toast({
        title: "Purchase successful!",
        description: `You have successfully purchased ${dataset.name}`,
      });

      onPurchase?.(dataset);
    } catch (error) {
      toast({
        title: "Purchase failed",
        description: "There was an error processing your purchase",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
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
        <div className="text-2xl font-bold text-foreground">
          {formatPrice(dataset.price)}
        </div>
        <div className="text-sm text-muted-foreground">
          Dataset #{dataset.id.toString()}
        </div>
      </div>

      {/* IPFS Hash */}
      {/* <div className="mb-6">
        <div className="text-xs text-muted-foreground mb-1">IPFS Hash</div>
        <div className="font-mono text-xs bg-muted p-2 rounded border truncate">
          {dataset.ipfs_hash}
        </div>
      </div> */}

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
          disabled={isPurchasing}
          className="flex-1 flex items-center justify-center space-x-1 ainest-btn-primary"
        >
          {isPurchasing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          <span>{isPurchasing ? "Purchasing..." : "Purchase"}</span>
        </Button>
      </div>

      {/* Hover overlay effect */}
      <div className="absolute inset-0 border border-ring opacity-0 group-hover:opacity-20 rounded-xl transition-opacity duration-300 pointer-events-none" />

      {/* Preview Modal */}
      <DatasetPreviewModal
        dataset={dataset}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onPurchase={handlePurchase}
      />
    </div>
  );
};
