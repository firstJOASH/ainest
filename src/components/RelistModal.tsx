// src/components/RelistModal.tsx
import { useState } from "react";
import { useSendTransaction, useContract } from "@starknet-react/core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import AINEST_ABI from "@/utils/AINEST_ABI.json";
import { AINEST_ADDRESS } from "@/utils/contracts";
import { parseUint256FromIntegerString } from "@/utils/cairo";

interface RelistModalProps {
  isOpen: boolean;
  onClose: () => void;
  datasetId: string | null;
  onSuccess?: () => void;
}

export const RelistModal = ({
  isOpen,
  onClose,
  datasetId,
  onSuccess,
}: RelistModalProps) => {
  const [price, setPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const { contract } = useContract({
    abi: AINEST_ABI as any,
    address: AINEST_ADDRESS,
  });

  const { send } = useSendTransaction({ calls: undefined });

  const handleRelist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !datasetId || !price) return;

    try {
      setIsSubmitting(true);

      const newPrice = parseUint256FromIntegerString(price);

      const call = contract?.populate("list_for_sale", [
        datasetId,
        newPrice.low,
        newPrice.high,
      ]);

      await send([call]);
      toast({ title: "Relisting dataset..." });

      setTimeout(() => {
        toast({ title: "Dataset relisted successfully!" });
        onClose();
        if (onSuccess) onSuccess();
        setIsSubmitting(false);
      }, 5000);
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to relist dataset", variant: "destructive" });
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Relist Dataset</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <label className="text-sm font-medium">New Price (STRK)</label>
          <Input
            placeholder="Enter new price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            type="number"
            min="0"
            step="0.01"
          />
        </div>

        <DialogFooter className="mt-6 flex space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleRelist}
            className="ainest-btn-primary"
            disabled={isSubmitting || !price}
          >
            {isSubmitting ? "Listing..." : "List"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
