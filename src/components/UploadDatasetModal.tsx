import { useState } from "react";
import {
  useAccount,
  useContract,
  useSendTransaction,
} from "@starknet-react/core";
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
import {
  ipfsHashToFelt252,
  parseUint256FromIntegerString,
} from "@/utils/cairo";

// Mock IPFS upload (simulated hash)
async function mockUploadToIPFS(file: File) {
  return "QmMockHash12345678awer899uiuiu8922"; // Static CID for testing
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

  const { contract } = useContract({
    abi: AINEST_ABI as any,
    address: AINEST_ADDRESS,
  });

  const { send, reset, isPending, isError } = useSendTransaction({
    calls: undefined,
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

    if (!formData.name.trim()) {
      toast({
        title: "Invalid name",
        description: "Please enter a valid dataset name",
        variant: "destructive",
      });
      return;
    }

    if (!formData.category) {
      toast({
        title: "Invalid category",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // 1) Mock IPFS
      const ipfsHash = await mockUploadToIPFS(formData.file!);
      const ipfsHashFelt = ipfsHashToFelt252(ipfsHash);

      // 2) Encode ByteArrays as *structs*
      const nameBA = formData.name;
      const categoryBA = formData.category;

      // 3) Price as integer → u256
      // 3) Convert STRK decimal input to wei (BigInt) → u256
      // 1 STRK = 10^18 wei
      // const priceWei = BigInt(Math.floor(Number(formData.price) * 1e18));
      const priceU256 = parseUint256FromIntegerString(formData.price);

      console.log("User input price (STRK):", formData.price);

      console.log("Calling with:", {
        name: nameBA,
        ipfs_hash: ipfsHashFelt,
        price: priceU256,
        category: categoryBA,
      });

      // 4) Build the call with the correct shapes
      // Positional args assuming Cairo fn signature is:
      // fn register_dataset(name: ByteArray, ipfs_hash: felt252, price: u256, category: ByteArray)

      // Using positional arguments
      const call = contract?.populate("register_dataset", [
        formData.name, // name: ByteArray
        ipfsHashFelt, // ipfs_hash: felt252
        { low: priceU256.low, high: priceU256.high }, // price.high: u128
        formData.category, // category: ByteArray
      ]);

      if (!call) {
        throw new Error("Failed to create contract call");
      }

      console.log("Contract call:", call);
      // 5) Send
      send([call]);

      toast({ title: "Dataset uploaded successfully!" });
      onClose();
      setFormData({
        name: "",
        description: "",
        category: "",
        price: "",
        file: null,
      });
    } catch (error: any) {
      console.error("Upload failed:", error);
      toast({
        title: "Upload failed",
        description:
          error?.message ?? "There was an error uploading your dataset",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (isError) reset();
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
              disabled={isUploading || isPending}
            >
              {isPending || isUploading ? (
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
