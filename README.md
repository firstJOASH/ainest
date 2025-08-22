# AiNest Frontend

A professional decentralized AI dataset marketplace built on **StarkNet**, featuring Cairo v2 smart contracts and seamless wallet integration through **starknet-react**.

---

## 🚀 Overview

AiNest revolutionizes AI dataset trading by providing a secure, trustless marketplace that ensures dataset authenticity and prevents duplication through advanced blockchain technology:

- **StarkNet Integration** - Leveraging Layer 2 zk-rollup technology for scalable and cost-effective transactions
- **Cairo v2 Smart Contracts** - Robust, secure contract architecture for dataset management
- **IPFS Storage** - Decentralized, immutable storage ensuring data integrity and availability
- **Multi-Wallet Support** - Seamless integration with leading StarkNet wallets

This frontend application provides an intuitive interface for interacting with AiNest's smart contract ecosystem.

---

## 🛠 Technology Stack

### Frontend

- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS + shadcn/ui components
- **State Management:** Zustand
- **Routing:** React Router DOM

### Blockchain

- **Network:** StarkNet (Sepolia Testnet)
- **Smart Contracts:** Cairo v2
- **Wallet Integration:** starknet-react + starknetkit
- **Supported Wallets:** ArgentX, Braavos, MetaMask, Web Wallet

### Infrastructure

- **Storage:** IPFS (InterPlanetary File System)
- **Deployment:** Vercel/Netlify Ready
- **Package Manager:** npm/yarn/bun

---

## 📂 Project Architecture

```
src/
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── Layout/             # Layout components (Header, Footer)
│   ├── CategorySidebar.tsx # Dataset categorization
│   ├── DatasetCard.tsx     # Dataset display component
│   └── *.tsx              # Feature-specific components
├── pages/                  # Application pages
│   ├── Landing.tsx         # Landing page
│   ├── Marketplace.tsx     # Main marketplace
│   ├── Profile.tsx         # User profile
│   └── Index.tsx          # Home page
├── lib/                    # Core libraries
│   ├── starknet.ts        # StarkNet configuration
│   ├── ipfs.ts            # IPFS integration
│   └── utils.ts           # Utility functions
├── stores/                 # State management
│   └── useAppStore.ts     # Global app state
├── utils/                  # Smart contract utilities
│   ├── contracts.ts       # Contract interactions
│   ├── cairo.ts          # Cairo type conversions
│   └── *.json            # Contract ABIs
└── hooks/                  # Custom React hooks
```

---

## ⚡ Quick Start

### Prerequisites

- **Node.js** v18+
- **npm**, **yarn**, or **bun**
- **StarkNet Wallet** (ArgentX, Braavos, or MetaMask)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/firstJOASH/starknet-aipacks.git
   cd starknet-aipacks
   ```

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   bun install
   ```

3. **Start development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   bun dev
   ```

4. **Open application**
   Navigate to `http://localhost:5173` in your browser

---

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# IPFS Configuration
VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/

# StarkNet Network Configuration
VITE_STARKNET_NETWORK=sepolia

# Optional: Custom RPC endpoints
VITE_STARKNET_RPC_URL=https://starknet-sepolia.public.blastapi.io
```

### Smart Contract Configuration

Update contract addresses in `src/lib/starknet.ts`:

```typescript
export const CONTRACT_ADDRESS =
  "0x02112566c584fdad21d338baf2b839d60b7f04149354293759692f8a31ee6e39";
```

---

## 🎯 Core Features

### Marketplace Functionality

- **Dataset Discovery** - Browse and search AI datasets by category
- **Secure Transactions** - Blockchain-verified purchases and sales
- **IPFS Integration** - Decentralized file storage and retrieval
- **Ownership Verification** - Immutable proof of dataset ownership

### Wallet Integration

- **Multi-Wallet Support** - ArgentX, Braavos, MetaMask compatibility
- **Seamless Connection** - One-click wallet connection
- **Transaction Management** - Real-time transaction status updates

### User Experience

- **Responsive Design** - Mobile-first, cross-device compatibility
- **Dark/Light Mode** - Adaptive theme support
- **Intuitive UI** - Clean, professional interface
- **Real-time Updates** - Live marketplace data

---

## 🚀 Deployment

### Production Build

```bash
npm run build
yarn build
# or
bun run build
```

### Deploy to Vercel

[![Deploy with Vercel](https://ainest-pi.vercel.app/)]

---

## 🧪 Development

### Testing

```bash
npm run test
# or
yarn test
```

### Linting

```bash
npm run lint
# or
yarn lint
```

### Type Checking

```bash
npm run type-check
# or
yarn type-check
```

---

## 🤝 Contributing

We welcome contributions to AiNest! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Maintain consistent code formatting with Prettier
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

---

## 📞 Support & Community

### Getting Help

- **GitHub Issues** - Report bugs or request features
- **Documentation** - Comprehensive guides and API references
- **Community Discord** - Join our developer community

### Reporting Issues

When reporting bugs, please include:

- **Environment details** (OS, Node.js version, browser)
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Screenshots** (if applicable)

---

## 📋 Roadmap

### Current Phase (v1.0)

- ✅ Core marketplace functionality
- ✅ Multi-wallet integration
- ✅ IPFS storage integration
- ✅ Basic dataset management

### Upcoming Features (v1.1)

- 🔄 Advanced search and filtering
- 🔄 Dataset preview capabilities
- 🔄 Enhanced user profiles
- 🔄 Rating and review system

### Future Vision (v2.0)

- 📋 AI model marketplace
- 📋 Collaborative dataset curation
- 📋 Advanced analytics dashboard
- 📋 Cross-chain compatibility

---

## 📜 License

**MIT License** © 2025 AiNest

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

[Full license text available in LICENSE file]

---

## 🔗 Links

- **Website:** [Coming Soon]
- **Documentation:** [Coming Soon]
- **Twitter:** [@AiNest_Official]
- **GitHub:** [github.com/firstJOASH/starknet-aipacks](https://github.com/firstJOASH/starknet-aipacks)

---

<div align="center">
  <strong>Built with Love for the decentralized AI future</strong>
</div>
