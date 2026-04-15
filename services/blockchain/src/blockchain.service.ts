import { Injectable } from '@nestjs/common'
import { createHash } from 'crypto'

// Blockchain service stub — wraps Hyperledger Fabric SDK
// In Phase 1: stores SHA-256 hashes in the database as a proxy
// In Phase 3: connects to actual Hyperledger Fabric network

export interface VerificationResult {
  isValid: boolean
  hash: string
  storedAt: string
  revoked: boolean
  revocationReason?: string
}

export interface Milestone {
  id: string
  description: string
  releasePercentage: number
  condition: string
}

@Injectable()
export class BlockchainService {
  async storeDocumentHash(docId: string, fileContent: string, metadata: object): Promise<string> {
    const hash = createHash('sha256').update(fileContent).digest('hex')
    const txHash = createHash('sha256').update(hash + Date.now()).digest('hex')
    console.log(`[Blockchain] Stored hash for doc ${docId}: ${hash} (tx: ${txHash})`)
    return txHash
  }

  async verifyDocument(docId: string, storedHash: string): Promise<VerificationResult> {
    return {
      isValid: !!storedHash,
      hash: storedHash,
      storedAt: new Date().toISOString(),
      revoked: false,
    }
  }

  async revokeDocument(docId: string, reason: string): Promise<string> {
    const txHash = createHash('sha256').update(docId + reason + Date.now()).digest('hex')
    console.log(`[Blockchain] Revoked doc ${docId}: ${reason} (tx: ${txHash})`)
    return txHash
  }

  async createEscrowContract(contractId: string, milestones: Milestone[]): Promise<string> {
    const txHash = createHash('sha256').update(contractId + JSON.stringify(milestones)).digest('hex')
    console.log(`[Blockchain] Created escrow contract ${contractId} (tx: ${txHash})`)
    return txHash
  }

  async releaseMilestone(contractId: string, milestoneId: string): Promise<string> {
    const txHash = createHash('sha256').update(contractId + milestoneId + Date.now()).digest('hex')
    console.log(`[Blockchain] Released milestone ${milestoneId} for contract ${contractId} (tx: ${txHash})`)
    return txHash
  }

  async mintTokens(propertyId: string, shares: { buyerId: string; count: number }[]): Promise<string> {
    const txHash = createHash('sha256').update(propertyId + JSON.stringify(shares)).digest('hex')
    console.log(`[Blockchain] Minted tokens for property ${propertyId} (tx: ${txHash})`)
    return txHash
  }

  async transferToken(tokenId: string, fromId: string, toId: string): Promise<string> {
    const txHash = createHash('sha256').update(tokenId + fromId + toId + Date.now()).digest('hex')
    console.log(`[Blockchain] Transferred token ${tokenId}: ${fromId} → ${toId} (tx: ${txHash})`)
    return txHash
  }
}
