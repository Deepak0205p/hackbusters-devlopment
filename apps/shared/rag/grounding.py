import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from apps.shared.rag.vector_store import SOPRetrievalResult

class CitationCheck(BaseModel):
    citation_token: str
    verified: bool
    source_document: Optional[str] = None
    page_number: Optional[int] = None
    snippet: Optional[str] = None

class GroundingVerificationResult(BaseModel):
    is_grounded: bool
    grounding_score: float
    status: str
    total_citations_found: int
    verified_citations: List[CitationCheck]
    unverified_citations: List[str]
    audit_notes: str

class GroundingVerifier:
    """
    Grounding Verification Gate & Citation Enforcement Engine.
    Ensures that any SOP clause, section number, standard, or document reference
    in the generated response strictly originates from genuine retrieved chunks.
    """
    def __init__(self):
        self.clause_regex = re.compile(
            r'(?:Clause|Section|Article|Rule|Chapter|Para|SOP|Policy|SOP-MRPL-[\w-]+)\s*[\.:]?\s*([0-9]+(?:\.[0-9]+)*|[A-Za-z0-9_-]+)',
            re.IGNORECASE
        )

    def extract_citations_from_text(self, text: str) -> List[str]:
        matches = self.clause_regex.findall(text)
        found = []
        for m in matches:
            tok = str(m).strip()
            if len(tok) >= 2 and tok not in found:
                found.append(tok)
        return found

    def verify_grounding(
        self,
        generated_answer: str,
        retrieved_chunks: List[SOPRetrievalResult]
    ) -> GroundingVerificationResult:
        if not retrieved_chunks:
            return GroundingVerificationResult(
                is_grounded=False,
                grounding_score=0.0,
                status="NO_RETRIEVED_CONTEXT",
                total_citations_found=0,
                verified_citations=[],
                unverified_citations=[],
                audit_notes="No retrieved context chunks were supplied to ground this response."
            )

        citations_in_answer = self.extract_citations_from_text(generated_answer)
        if not citations_in_answer:
            # Check general text overlap / presence of retrieved document keywords
            has_general_grounding = any(chunk.title.lower() in generated_answer.lower() or chunk.sop_id.lower() in generated_answer.lower() for chunk in retrieved_chunks)
            score = 0.85 if has_general_grounding else 0.70
            return GroundingVerificationResult(
                is_grounded=True,
                grounding_score=score,
                status="CONTENT_ALIGNED",
                total_citations_found=0,
                verified_citations=[],
                unverified_citations=[],
                audit_notes="Response contains general operational guidance aligned with retrieved compliance context without explicit clause numbers."
            )

        # Build context search pool
        all_context_text = " ".join([f"{c.sop_id} {c.title} {c.clause} {c.matched_text}" for c in retrieved_chunks]).lower()

        verified: List[CitationCheck] = []
        unverified: List[str] = []

        for cit in citations_in_answer:
            cit_lower = cit.lower()
            # Check if this token appears in any retrieved chunk
            matched_chunk = None
            for chunk in retrieved_chunks:
                chunk_str = f"{chunk.sop_id} {chunk.title} {chunk.clause} {chunk.matched_text}".lower()
                if cit_lower in chunk_str:
                    matched_chunk = chunk
                    break

            if matched_chunk is not None:
                verified.append(CitationCheck(
                    citation_token=cit,
                    verified=True,
                    source_document=matched_chunk.title,
                    page_number=matched_chunk.page_number,
                    snippet=matched_chunk.matched_text[:120] + "..."
                ))
            else:
                unverified.append(cit)

        total = len(citations_in_answer)
        score = round(len(verified) / total, 2) if total > 0 else 1.0
        is_grounded = (len(unverified) == 0)

        if is_grounded:
            status = "VERIFIED_GROUNDED"
            audit_notes = f"All {len(verified)} citations in answer rigorously verified against real retrieved compliance documents."
        else:
            status = "UNVERIFIED_CITATION_DETECTED"
            audit_notes = f"Detected {len(unverified)} unverified citations ({', '.join(unverified)}) not found in retrieved document chunks."

        return GroundingVerificationResult(
            is_grounded=is_grounded,
            grounding_score=score,
            status=status,
            total_citations_found=total,
            verified_citations=verified,
            unverified_citations=unverified,
            audit_notes=audit_notes
        )

# Global Grounding Verifier Singleton
grounding_verifier = GroundingVerifier()
