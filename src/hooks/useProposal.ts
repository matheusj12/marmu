import { ProposalSnapshot } from '../types';

export function saveProposal(snapshot: ProposalSnapshot): string {
  const uuid = crypto.randomUUID();
  localStorage.setItem(`proposal_${uuid}`, JSON.stringify(snapshot));
  return uuid;
}

export function loadProposal(uuid: string): ProposalSnapshot | null {
  const raw = localStorage.getItem(`proposal_${uuid}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ProposalSnapshot;
  } catch {
    return null;
  }
}
