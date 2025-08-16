import { useRef, useEffect, useMemo } from "react";
import { useAccount } from "@starknet-react/core";
import { useAppStore } from "@/stores/useAppStore";
import { useGSAP } from "@/hooks/useGSAP";
import { Dataset } from "@/lib/starknet";
import { DatasetCard } from "@/components/DatasetCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, Wallet, Copy, ExternalLink } from "lucide-react";

export const Profile = () => {
  const profileRef = useRef<HTMLDivElement>(null);
  const { animatePageEnter } = useGSAP();
  const { address, isConnected } = useAccount();
  const { contractDatasets, setUploadModalOpen } = useAppStore();

  // Filter datasets owned by current user
  const myDatasets = useMemo(
    () =>
      contractDatasets.filter(
        (dataset) => dataset.owner.toLowerCase() === address?.toLowerCase()
      ),
    [contractDatasets, address]
  );

  // Compute stats
  const totalUploads = myDatasets.length;
  const totalEarned = myDatasets.reduce(
    (acc, dataset) => acc + Number(dataset.price) / 1e18,
    0
  );
  const totalDownloads = myDatasets.reduce(
    (acc, dataset) => acc + (dataset.downloads || 0),
    0
  );

  // Mock recent activity for now (replace with actual events if available)
  const recentActivity = useMemo(() => {
    const uploads = myDatasets.map((d) => ({
      type: "upload" as const,
      datasetName: d.name,
      time: d.createdAt || new Date().toISOString(), // store timestamp when uploading
    }));

    // If you track purchases in your store, you can append them here
    const purchases: { type: "purchase"; datasetName: string; time: string }[] =
      [];

    // Add wallet connected event
    const walletConnect = {
      type: "wallet",
      datasetName: "Wallet connected",
      time: new Date().toISOString(),
    };

    return [...uploads, ...purchases, walletConnect].sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    );
  }, [myDatasets]);

  useEffect(() => {
    if (profileRef.current) {
      animatePageEnter(profileRef.current);
    }
  }, []);

  const formatAddress = (addr: string) =>
    `${addr.slice(0, 8)}...${addr.slice(-6)}`;

  const copyAddress = () => {
    if (address) navigator.clipboard.writeText(address);
  };

  const generateAvatar = (addr: string) => {
    const hash = addr.slice(2, 8);
    const hue = parseInt(hash, 16) % 360;
    return `hsl(${hue}, 50%, 50%)`;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Wallet className="h-16 w-16 text-muted-foreground mx-auto" />
          <h2 className="text-2xl font-semibold text-foreground">
            Connect Your Wallet
          </h2>
          <p className="text-muted-foreground">
            Please connect your wallet to view your profile
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={profileRef} className="min-h-screen p-6">
      <div className="container mx-auto max-w-6xl space-y-8">
        {/* Profile Header */}
        <div className="ainest-card">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-2xl"
              style={{ backgroundColor: generateAvatar(address || "") }}
            >
              {address?.slice(2, 4).toUpperCase()}
            </div>

            {/* User Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  My Profile
                </h1>
                <div className="flex items-center space-x-2">
                  <code className="bg-muted px-3 py-1 rounded font-mono text-sm">
                    {formatAddress(address || "")}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyAddress}
                    className="h-6 w-6 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-6 w-6 p-0"
                  >
                    <a
                      href={`https://starkscan.co/contract/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Uploads:
                  </span>
                  <Badge variant="secondary">{totalUploads}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Download className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Downloads:
                  </span>
                  <Badge variant="secondary">{totalDownloads}</Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Total Earned:
                  </span>
                  <Badge variant="secondary">
                    {totalEarned.toFixed(3)} STRK
                  </Badge>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              <Button
                onClick={() => setUploadModalOpen(true)}
                className="ainest-btn-primary flex items-center space-x-2"
              >
                <Upload className="h-4 w-4" />
                <span>Upload Dataset</span>
              </Button>
            </div>
          </div>
        </div>

        {/* My Datasets */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">
              My Datasets
            </h2>
            <p className="text-muted-foreground">
              {myDatasets.length} datasets
            </p>
          </div>

          {myDatasets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myDatasets.map((dataset) => (
                <DatasetCard
                  key={dataset.id.toString()}
                  dataset={dataset}
                  onView={(dataset) => console.log("View:", dataset)}
                  onPurchase={(dataset) => console.log("Edit:", dataset)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 ainest-card">
              <Upload className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No datasets yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Start by uploading your first dataset to the marketplace.
              </p>
              <Button
                onClick={() => setUploadModalOpen(true)}
                className="ainest-btn-primary"
              >
                Upload First Dataset
              </Button>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">
            Recent Activity
          </h2>

          <div className="ainest-card">
            <div className="space-y-4">
              {recentActivity.map((act, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-3 border-b border-border last:border-b-0"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        act.type === "upload"
                          ? "bg-green-500"
                          : act.type === "purchase"
                          ? "bg-blue-500"
                          : "bg-purple-500"
                      }`}
                    ></div>
                    <span className="text-foreground">
                      {act.type === "wallet"
                        ? act.datasetName
                        : `${
                            act.type === "upload"
                              ? "Dataset uploaded:"
                              : "Purchased:"
                          } ${act.datasetName}`}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(act.time).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
