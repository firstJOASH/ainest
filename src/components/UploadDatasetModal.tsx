import { useState } from 'react'
import { useAccount } from '@starknet-react/core'
import { useAppStore } from '@/stores/useAppStore'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DATASET_CATEGORIES } from '@/lib/starknet'
import { Upload, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface UploadDatasetModalProps {
  isOpen: boolean
  onClose: () => void
}

export const UploadDatasetModal = ({ isOpen, onClose }: UploadDatasetModalProps) => {
  const { isConnected } = useAccount()
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    file: null as File | null
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to upload datasets",
        variant: "destructive"
      })
      return
    }

    if (!formData.file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)
    
    try {
      // Mock upload process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "Dataset uploaded successfully!",
        description: "Your dataset is now available in the marketplace"
      })
      
      onClose()
      setFormData({
        name: '',
        description: '',
        category: '',
        price: '',
        file: null
      })
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your dataset",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, file }))
    }
  }

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
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter dataset name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
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
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              placeholder="0.1"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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
  )
}