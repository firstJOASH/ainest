import { useState } from "react";
import { useAccount, useContract } from "@starknet-react/core";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DATASET_CATEGORIES } from "@/lib/starknet";
import { AINEST_ADDRESS } from "@/utils/contracts";
import AINEST_ABI from "@/utils/AINEST_ABI.json";
import { encodeByteArray, ipfsHashToFelt252 } from "@/utils/cairo";

// Simple IPFS uploader (Pinata example)
async function uploadToIPFS(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`https://api.pinata.cloud/pinning/pinFileToIPFS`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
    },
    body: formData,
  });

  if (!res.ok) throw new Error("Failed to upload file to IPFS");

  const data = await res.json();
  return data.IpfsHash; // CID
}

interface UploadDatasetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadDatasetModal = ({
  isOpen,
  onClose,
}: UploadDatasetModalProps) => {
  const { account, isConnected } = useAccount();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    file: null as File | null,
  });

  // Contract instance
  const { contract } = useContract({
    abi: AINEST_ABI as any,
    address: AINEST_ADDRESS,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !account) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to upload datasets",
        variant: "destructive",
      });
      return;
    }

    if (!formData.file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // 1. Upload dataset file to IPFS
      const ipfsHash = await uploadToIPFS(formData.file);
      const ipfsHashFelt = ipfsHashToFelt252(ipfsHash);

      // 2. Prepare calldata
      const nameByteArray = encodeByteArray(formData.name);
      const categoryByteArray = encodeByteArray(formData.category);
      const priceBigInt = BigInt(Math.floor(Number(formData.price) * 1e18));
      const priceLow = priceBigInt & ((1n << 128n) - 1n);
      const priceHigh = priceBigInt >> 128n;

      // 3. Call contract's register_dataset
      await contract?.invoke("register_dataset", [
        ...nameByteArray,
        ipfsHashFelt,
        priceLow.toString(),
        priceHigh.toString(),
        ...categoryByteArray,
      ]);

      toast({
        title: "Dataset uploaded successfully!",
      });

      onClose();
      setFormData({
        name: "",
        description: "",
        category: "",
        price: "",
        file: null,
      });
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Upload failed",
        description:
          error?.message || "There was an error uploading your dataset",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, file }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            Upload Dataset
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Dataset Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Enter dataset name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category: value }))
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {DATASET_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (STRK)</Label>
            <Input
              id="price"
              type="number"
              step="0.001"
              value={formData.price}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, price: e.target.value }))
              }
              placeholder="0.1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Describe your dataset..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Dataset File</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              accept=".csv,.json,.zip,.tar.gz"
              required
            />
            {formData.file && (
              <p className="text-sm text-muted-foreground">
                Selected: {formData.file.name}
              </p>
            )}
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 ainest-btn-primary"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
