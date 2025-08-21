import { useState, useEffect } from "react";
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
import { useAppStore } from "@/stores/useAppStore";
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
import { DATASET_CATEGORIES, DATASET_FORMATS } from "@/lib/starknet";
import { AINEST_ADDRESS } from "@/utils/contracts";
import AINEST_ABI from "@/utils/AINEST_ABI.json";
import {
  ipfsHashToFelt252,
  parseUint256FromIntegerString,
} from "@/utils/cairo";

// Mock IPFS upload (simulated hash)
// Generates a realistic-looking CIDv0 (starts with 'Qm' and 46 chars long)
async function mockUploadToIPFS(file: File): Promise<string> {
  // small artificial delay to simulate network/upload
  await new Promise((res) => setTimeout(res, 700));
  const base58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  // CIDv0 is Qm + 44 base58 chars (total length 46)
  let suffix = "";
  for (let i = 0; i < 44; i++) {
    suffix += base58[Math.floor(Math.random() * base58.length)];
  }
  return `Qm${suffix}`;
}

// Real IPFS upload function placeholder. When you integrate ipfs-http-client
// replace this implementation. It must accept a File and return a CID string.
async function realUploadToIPFS(file: File): Promise<string> {
  // Placeholder: return mock until real implementation wired.
  return mockUploadToIPFS(file);
}

const shouldUseMockIPFS =
  process.env.NODE_ENV === "development" ||
  process.env.REACT_APP_USE_MOCK_IPFS === "true";

const uploadToIPFS = async (file: File) => {
  return shouldUseMockIPFS ? mockUploadToIPFS(file) : realUploadToIPFS(file);
};

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
    format: "", // Add format field
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

  const addDataset = useAppStore((state) => state.addDataset);
  const setContractDatasets = useAppStore((state) => state.setContractDatasets);

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

    if (!formData.format) {
      toast({
        title: "Invalid format",
        description: "Please select a format",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // 1) Upload to IPFS (mock or real depending on env)
      const ipfsHash = await uploadToIPFS(formData.file!);
      const ipfsHashFelt = ipfsHashToFelt252(ipfsHash);

      // 2) Encode ByteArrays as *structs*
      const nameBA = formData.name;
      const categoryBA = formData.category;

      // 3) Price as integer → u256
      const priceU256 = parseUint256FromIntegerString(formData.price);

      // 4) Build the call with the correct shapes
      const call = contract?.populate("register_dataset", {
        name: nameBA,
        ipfs_hash: ipfsHashFelt,
        price: { low: priceU256.low, high: priceU256.high },
        category: categoryBA,
      });

      if (!call) {
        throw new Error("Failed to create contract call");
      }

      // 5) Send
      send([call]);
      toast({ title: "Uploading Dataset..." });

      setContractDatasets([...useAppStore.getState().contractDatasets]);

      setTimeout(() => {
        onClose();
      }, 5000);
      toast({ title: "Dataset uploaded successfully!" });

      setFormData({
        name: "",
        description: "",
        category: "",
        format: "",
        price: "",
        file: null,
      });
    } catch (err) {
      const error = err as unknown;
      console.error("Upload failed:", error);
      const message =
        (error && typeof error === "object" && "message" in error
          ? (error as { message?: string }).message
          : undefined) || "There was an error uploading your dataset";
      toast({
        title: "Upload failed",
        description: message as string,
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
      // Auto-detect format from file extension if format not selected
      const extension = file.name.split(".").pop()?.toUpperCase();
      const autoFormat =
        DATASET_FORMATS.find((f) => f === extension) || formData.format;

      setFormData((prev) => ({
        ...prev,
        file,
        format: autoFormat,
      }));
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
            <Label htmlFor="format">Format</Label>
            <Select
              value={formData.format}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, format: value }))
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                {DATASET_FORMATS.map((format) => (
                  <SelectItem key={format} value={format}>
                    {format}
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
              placeholder="Describe your dataset (features, use cases, data source, etc.)"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Dataset File</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              accept=".csv,.json,.zip,.tar.gz,.xlsx,.pdf,.txt"
              required
            />
            {formData.file && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Selected: {formData.file.name}</p>
                <p>Size: {(formData.file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
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
