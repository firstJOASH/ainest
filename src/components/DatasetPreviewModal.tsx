import { Dataset } from "@/lib/starknet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Download,
  ExternalLink,
  FileText,
  Database,
  DollarSign,
} from "lucide-react";
import { toU256, fromU256 } from "@/utils/cairo";

interface DatasetPreviewModalProps {
  dataset: Dataset | null;
  isOpen: boolean;
  onClose: () => void;
  onPurchase?: (dataset: Dataset) => void;
}

export const DatasetPreviewModal = ({
  dataset,
  isOpen,
  onClose,
  onPurchase,
}: DatasetPreviewModalProps) => {
  if (!dataset) return null;

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatPrice = (price: bigint) => {
    const priceStrk = Number(price) / 1e18;
    if (priceStrk === 0) return "Free";
    if (priceStrk < 1) return `${priceStrk.toFixed(6)} STRK`;
    return `${priceStrk.toFixed(3)} STRK`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown";
    const mb = bytes / 1024 / 1024;
    if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${mb.toFixed(1)} MB`;
  };

  // Get actual description or fallback
  const getDescription = () => {
    // Type assertion to access description if it exists
    const datasetWithDesc = dataset as Dataset & { description?: string };
    return datasetWithDesc.description && datasetWithDesc.description.trim()
      ? datasetWithDesc.description
      : "No description provided by the dataset owner.";
  };

  // Create realistic preview based on actual dataset info
  const generateDatasetInfo = () => {
    const info = {
      format: dataset.format || "Unknown",
      category: dataset.category,
      size: formatFileSize(dataset.size),
      description: getDescription(),
      samples: "Variable", // Since we don't store sample count
      features: "See description", // Let uploader describe in description
    };

    return `{
  "name": "${dataset.name}",
  "category": "${info.category}",
  "format": "${info.format}",
  "size": "${info.size}",
  "price": "${formatPrice(dataset.price)}",
  "description": "${info.description.slice(0, 100)}${
      info.description.length > 100 ? "..." : ""
    }",
  "owner": "${formatAddress(dataset.owner)}",
  "dataset_id": ${dataset.id.toString()}
}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center space-x-2">
            <Database className="h-6 w-6" />
            <span>{dataset.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Dataset Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                  <FileText className="h-3 w-3" />
                  <span>Category</span>
                </Label>
                <Badge variant="secondary" className="mt-1">
                  {dataset.category}
                </Badge>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span>Owner</span>
                </Label>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                    {formatAddress(dataset.owner)}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Dataset ID
                </Label>
                <p className="font-mono text-sm mt-1 bg-muted px-2 py-1 rounded w-fit">
                  #{dataset.id.toString()}
                </p>
              </div>

              {dataset.format && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Format
                  </Label>
                  <Badge variant="outline" className="mt-1">
                    {dataset.format}
                  </Badge>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                  <DollarSign className="h-3 w-3" />
                  <span>Price</span>
                </Label>
                <p className="text-2xl font-bold mt-1 text-primary">
                  {formatPrice(dataset.price)}
                </p>
              </div>

              {dataset.size && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    File Size
                  </Label>
                  <p className="text-sm mt-1">{formatFileSize(dataset.size)}</p>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-muted-foreground flex items-center space-x-1">
                  <ExternalLink className="h-3 w-3" />
                  <span>Storage</span>
                </Label>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm">IPFS</span>
                  <Badge variant="outline" className="text-xs">
                    Decentralized
                  </Badge>
                </div>
              </div>

              {dataset.downloads !== undefined && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Downloads
                  </Label>
                  <p className="text-sm mt-1">{dataset.downloads}</p>
                </div>
              )}
            </div>
          </div>

          {/* Description Section */}
          {dataset.description && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                Description
              </Label>
              <div className="bg-muted rounded-lg border p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {dataset.description}
                </p>
              </div>
            </div>
          )}

          {/* IPFS Hash Section */}
          {/* <div>
            <Label className="text-sm font-medium text-muted-foreground">
              IPFS Hash
            </Label>
            <div className="mt-2 p-3 bg-muted rounded-lg border">
              <code className="text-xs font-mono break-all text-muted-foreground">
                {dataset.ipfs_hash}
              </code>
            </div>
          </div> */}

          {/* Dataset Information Preview */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Dataset Information
            </Label>
            <div className="mt-2 p-4 bg-muted rounded-lg border">
              <div className="text-sm text-muted-foreground mb-2">
                JSON metadata:
              </div>
              <pre className="text-xs font-mono overflow-x-auto">
                {generateDatasetInfo()}
              </pre>
            </div>
          </div>

          {/* Timestamp if available */}
          {dataset.createdAt && (
            <div className="text-xs text-muted-foreground">
              Uploaded:{" "}
              {new Date(Number(dataset.createdAt) * 1000).toLocaleString()}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-6 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            <Button
              onClick={() => onPurchase?.(dataset)}
              className="flex-1 ainest-btn-primary"
              disabled={dataset.price === 0n} // Disable if free - should be download instead
            >
              <Download className="h-4 w-4 mr-2" />
              {dataset.price === 0n ? "Download Free" : "Purchase & Download"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Label = ({ className, children, ...props }: any) => (
  <label className={`block text-sm font-medium ${className || ""}`} {...props}>
    {children}
  </label>
);
