import { Dataset } from "@/lib/starknet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Download, ExternalLink } from "lucide-react";

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
    const priceInStrk = Number(price);

    if (priceInStrk === 0) {
      return "Free";
    } else if (priceInStrk < 0.001) {
      return `${priceInStrk.toFixed(18)} STRK`;
    } else if (priceInStrk < 1) {
      return `${priceInStrk.toFixed(18)} STRK`;
    } else {
      return `${priceInStrk.toFixed(3)} STRK`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {dataset.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Dataset Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Category
                </Label>
                <Badge variant="secondary" className="ml-2">
                  {dataset.category}
                </Badge>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Owner
                </Label>
                <div className="flex items-center space-x-2 mt-1">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">
                    {formatAddress(dataset.owner)}
                  </span>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Dataset ID
                </Label>
                <p className="font-mono text-sm mt-1">
                  #{dataset.id.toString()}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Price
                </Label>
                <p className="text-2xl font-bold mt-1">
                  {formatPrice(dataset.price)}
                </p>
              </div>

              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Storage
                </Label>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm">IPFS</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>

          {/* IPFS Hash */}
          {/* <div>
            <Label className="text-sm font-medium text-muted-foreground">IPFS Hash</Label>
            <div className="mt-2 p-3 bg-muted rounded-lg border">
              <code className="text-xs font-mono break-all">
                {dataset.ipfs_hash}
              </code>
            </div>
          </div> */}

          {/* Mock Dataset Preview */}
          <div>
            <Label className="text-sm font-medium text-muted-foreground">
              Dataset Preview
            </Label>
            <div className="mt-2 p-4 bg-muted rounded-lg border">
              <div className="text-sm text-muted-foreground mb-2">
                Sample data structure:
              </div>
              <pre className="text-xs font-mono">
                {`{
  "samples": 10000,
  "features": ["text", "label", "category"],
  "format": "JSON/CSV",
  "size": "2.5MB",
  "description": "High-quality labeled dataset for NLP tasks"
}`}
              </pre>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Close
            </Button>
            <Button
              onClick={() => onPurchase?.(dataset)}
              className="flex-1 ainest-btn-primary"
            >
              <Download className="h-4 w-4 mr-2" />
              Purchase & Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Label = ({ className, children, ...props }: any) => (
  <label className={`block text-sm font-medium ${className}`} {...props}>
    {children}
  </label>
);
