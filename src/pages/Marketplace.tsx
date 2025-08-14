import { useRef, useEffect, useState } from 'react'
import { useAppStore } from '@/stores/useAppStore'
import { useGSAP } from '@/hooks/useGSAP'
import { Dataset } from '@/lib/starknet'
import { CategorySidebar } from '@/components/CategorySidebar'
import { DatasetCard } from '@/components/DatasetCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Filter, Grid, List } from 'lucide-react'

export const Marketplace = () => {
  const mainRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const { animatePageEnter, animateGridItems } = useGSAP()
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'newest' | 'price' | 'popular'>('newest')
  
  const { 
    datasets, 
    selectedCategory, 
    searchQuery, 
    setSearchQuery,
    isLoading 
  } = useAppStore()

  // Mock datasets for demo
  const mockDatasets: Dataset[] = [
    {
      id: BigInt(1),
      name: 'ImageNet Classification Dataset',
      owner: '0x1234567890abcdef1234567890abcdef12345678',
      ipfs_hash: 'QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o',
      price: BigInt('100000000000000000'), // 0.1 STRK
      category: 'Computer Vision'
    },
    {
      id: BigInt(2),
      name: 'Financial Time Series Data',
      owner: '0xabcdef1234567890abcdef1234567890abcdef12',
      ipfs_hash: 'QmNLei78zWmzUdbeRB3CiUfAizWUrbeeZh5K1rhAQKCh51',
      price: BigInt('250000000000000000'), // 0.25 STRK
      category: 'Financial Data'
    },
    {
      id: BigInt(3),
      name: 'Medical X-Ray Dataset',
      owner: '0x567890abcdef1234567890abcdef1234567890ab',
      ipfs_hash: 'QmRAQB6YaCyidP37UdDnjFY5vQuiBrcqdyoW1CuDgwxkD4',
      price: BigInt('500000000000000000'), // 0.5 STRK
      category: 'Medical Data'
    }
  ]

  useEffect(() => {
    if (mainRef.current) {
      animatePageEnter(mainRef.current)
    }
  }, [])

  useEffect(() => {
    if (gridRef.current) {
      const cards = gridRef.current.querySelectorAll('.ainest-dataset-card')
      if (cards.length > 0) {
        animateGridItems(cards)
      }
    }
  }, [datasets, selectedCategory, searchQuery])

  const filteredDatasets = mockDatasets.filter(dataset => {
    const matchesCategory = selectedCategory === 'All' || dataset.category === selectedCategory
    const matchesSearch = dataset.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const handleDatasetView = (dataset: Dataset) => {
    console.log('View dataset:', dataset)
    // Implement dataset preview modal
  }

  const handleDatasetPurchase = (dataset: Dataset) => {
    console.log('Purchase dataset:', dataset)
    // Implement purchase functionality
  }

  return (
    <div className="flex min-h-screen">
      <CategorySidebar />
      
      <main ref={mainRef} className="flex-1 p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="ainest-section-title mb-4">Dataset Marketplace</h1>
          
          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search datasets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 ainest-input"
              />
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="ainest-input text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="price">Price: Low to High</option>
                <option value="popular">Most Popular</option>
              </select>
              
              {/* View Mode */}
              <div className="flex items-center border border-border rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8 p-0"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 w-8 p-0"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            {filteredDatasets.length} datasets found
            {selectedCategory !== 'All' && ` in ${selectedCategory}`}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>

        {/* Dataset Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="ainest-card animate-pulse">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded w-3/4 mb-4"></div>
                <div className="h-8 bg-muted rounded mb-4"></div>
                <div className="flex space-x-2">
                  <div className="h-8 bg-muted rounded flex-1"></div>
                  <div className="h-8 bg-muted rounded flex-1"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredDatasets.length > 0 ? (
          <div
            ref={gridRef}
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            }
          >
            {filteredDatasets.map((dataset) => (
              <DatasetCard
                key={dataset.id.toString()}
                dataset={dataset}
                onView={handleDatasetView}
                onPurchase={handleDatasetPurchase}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No datasets found</h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search criteria or browse different categories.
            </p>
            <Button
              onClick={() => {
                setSearchQuery('')
              }}
              variant="outline"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}