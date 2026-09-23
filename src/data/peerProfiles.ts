/**
 * SYNTHETIC DEMONSTRATION DATA
 * 
 * IMPORTANT NOTICE:
 * This file contains deterministic synthetic peer profiles and peer groups created solely
 * for development, testing, and architectural validation of the SAT-SA supervisory peer
 * benchmarking capability.
 * 
 * DO NOT present or interpret this data as real government, regulatory, or live Critical
 * Sector Entity (CSE) operational records.
 */

import { PeerGroup, PeerProfile } from '../types/peerBenchmark';

/**
 * Synthetic demonstration peer groups defined by sector and criticality tier.
 */
export const DEMO_SYNTHETIC_PEER_GROUPS: PeerGroup[] = [
  {
    peerGroupId: 'PEER-FIN-CORE-T1',
    peerGroupName: 'Tier-1 Financial Infrastructure & Core Payment Processors',
    description:
      'High-throughput transaction gateways, national clearing engines, and Tier-1 banking cores subject to high-assurance supervisory review.',
    sector: 'Financial Core',
    criticalityTier: 'Tier-1 High Assurance'
  }
];

/**
 * Synthetic demonstration peer profile registry.
 * Currently configured exclusively for the canonical demonstration CSE-047 submission.
 * Note: Historical peer submissions are not fabricated; peer benchmarking dynamically evaluates
 * against comparable submissions that meet strict data quality gates.
 */
export const DEMO_SYNTHETIC_PEER_PROFILES: PeerProfile[] = [
  {
    entityCode: 'ENT-047-PAY',
    entityId: 'ENT-047-PAY',
    entityName: 'National Payment Clearing Gateway (ENT-047-PAY)',
    peerGroupId: 'PEER-FIN-CORE-T1',
    peerGroupName: 'Tier-1 Financial Infrastructure & Core Payment Processors',
    criticalityTier: 'Tier-1 High Assurance',
    sector: 'Financial Core',
    isSynthetic: true,
    notes:
      'SYNTHETIC DEMONSTRATION DATA: Calibrated peer profile for CSE-047 architectural validation.'
  },
  {
    entityCode: 'ENT-012-CLR',
    entityId: 'ENT-012-CLR',
    entityName: 'Securities Clearing Settlement Hub (ENT-012-CLR)',
    peerGroupId: 'PEER-FIN-CORE-T1',
    peerGroupName: 'Tier-1 Financial Infrastructure & Core Payment Processors',
    criticalityTier: 'Tier-1 High Assurance',
    sector: 'Financial Core',
    isSynthetic: true,
    notes:
      'SYNTHETIC DEMONSTRATION DATA: Synthetic comparable peer in Tier-1 Financial Core.'
  },
  {
    entityCode: 'ENT-028-SWF',
    entityId: 'ENT-028-SWF',
    entityName: 'Cross-Border Message Switch (ENT-028-SWF)',
    peerGroupId: 'PEER-FIN-CORE-T1',
    peerGroupName: 'Tier-1 Financial Infrastructure & Core Payment Processors',
    criticalityTier: 'Tier-1 High Assurance',
    sector: 'Financial Core',
    isSynthetic: true,
    notes:
      'SYNTHETIC DEMONSTRATION DATA: Synthetic comparable peer in Tier-1 Financial Core.'
  },
  {
    entityCode: 'ENT-033-ACH',
    entityId: 'ENT-033-ACH',
    entityName: 'Retail Automated Clearing House (ENT-033-ACH)',
    peerGroupId: 'PEER-FIN-CORE-T1',
    peerGroupName: 'Tier-1 Financial Infrastructure & Core Payment Processors',
    criticalityTier: 'Tier-1 High Assurance',
    sector: 'Financial Core',
    isSynthetic: true,
    notes:
      'SYNTHETIC DEMONSTRATION DATA: Synthetic comparable peer in Tier-1 Financial Core.'
  },
  {
    entityCode: 'ENT-089-BAD',
    entityId: 'ENT-089-BAD',
    entityName: 'Regional Credit Exchange (ENT-089-BAD)',
    peerGroupId: 'PEER-FIN-CORE-T1',
    peerGroupName: 'Tier-1 Financial Infrastructure & Core Payment Processors',
    criticalityTier: 'Tier-1 High Assurance',
    sector: 'Financial Core',
    isSynthetic: true,
    notes:
      'SYNTHETIC DEMONSTRATION DATA: Low-completeness / invalid peer used to validate Quality Gate exclusion.'
  }
];

/**
 * Deterministic lookup for a peer profile by entity code.
 */
export function findPeerProfileByEntityCode(entityCode: string): PeerProfile | null {
  if (!entityCode) return null;
  const normalized = entityCode.trim().toUpperCase();
  const profile = DEMO_SYNTHETIC_PEER_PROFILES.find(
    (p) => p.entityCode.toUpperCase() === normalized
  );
  return profile ? { ...profile } : null;
}

/**
 * Deterministic lookup for a peer group by identifier.
 */
export function findPeerGroupById(peerGroupId: string): PeerGroup | null {
  if (!peerGroupId) return null;
  const group = DEMO_SYNTHETIC_PEER_GROUPS.find(
    (g) => g.peerGroupId === peerGroupId
  );
  return group ? { ...group } : null;
}

/**
 * Returns all registered synthetic peer profiles.
 */
export function getAllPeerProfiles(): PeerProfile[] {
  return DEMO_SYNTHETIC_PEER_PROFILES.map((p) => ({ ...p }));
}

/**
 * Returns all registered synthetic peer groups.
 */
export function getAllPeerGroups(): PeerGroup[] {
  return DEMO_SYNTHETIC_PEER_GROUPS.map((g) => ({ ...g }));
}
