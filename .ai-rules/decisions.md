# Project Decisions Log

## 2025-08-26 - Minimal Video Generator Planning Session

### Context
Strategic planning session for first feature implementation - minimal video generator as foundation for full AdCraft AI system.

### Decision 1: Chat Interface Implementation
**Options Presented:**
- Simple back-and-forth suggestions
- AI-powered conversation that understands context  
- Template-based refinement options

**Decision Made:** Simple back-and-forth suggestions
**Rationale:** User wants to move to AI-powered conversation right after initial implementation - start simple for PoC

### Decision 2: Video Duration Limits
**Options Presented:**
- Shorter (15 seconds) for faster testing
- Current proposal (30 seconds) 
- Longer (60 seconds) for more complete demos

**Decision Made:** 15 seconds maximum
**Rationale:** Faster testing and cost control during PoC phase

### Decision 3: Concurrent User Limits  
**Options Presented:**
- Lower (1-2 users) for cost control
- Current proposal (3 users)
- Higher (5 users) for better demo capability

**Decision Made:** 1-2 users maximum
**Rationale:** Cost management priority given $300 budget constraint

### Decision 4: Budget Alert Thresholds
**Options Presented:**
- $50/$100/$150 thresholds as proposed
- Alternative threshold amounts

**Decision Made:** $50/$100/$150 thresholds approved
**Rationale:** Appropriate for $300 total budget management

### Strategic Context Decisions
- **Implementation Approach:** Simplified version of existing AdCraft AI project for incremental development
- **Primary Goal:** Visual confirmation of progress while building foundation for full 3-agent system  
- **Input Method:** Text prompts only (no image upload in Phase 1)
- **API Integration:** Direct Veo API integration (bypassing Agent 1 & 2 initially)
- **User Interface:** Basic chat interface for prompt refinement

## 2025-08-26 - Cloud Deployment Strategy Discussion

### Context
User is considering Pulumi for cloud deployment infrastructure as code, seeking advice on deployment approach for minimal video generator.

### User Context
- Limited cloud experience
- Never used Pulumi before
- Wants consistent deployment method for future refinement
- Seeking strategic advice on deployment approach

### Options to Present
**Option A: Pulumi Infrastructure as Code**
- Pros: Version-controlled infrastructure, consistent deployments, matches project tech.md specifications
- Cons: Learning curve for new user, additional complexity for simple PoC
- Fits: Existing project architecture calls for Pulumi with TypeScript

**Option B: Manual GCP Console Setup**
- Pros: Visual interface, immediate feedback, simpler for beginners
- Cons: Not repeatable, harder to version control, doesn't scale
- Fits: Good for initial learning and prototyping

**Option C: gcloud CLI Commands**
- Pros: Scriptable, good middle ground, documentation-friendly
- Cons: Less structured than IaC, harder to maintain state
- Fits: Good stepping stone to eventual Pulumi adoption

### Decision Made: Direct Pulumi Implementation

**Decision Changed:** User decided to jump directly to Pulumi implementation
- Skip manual setup phase
- Go straight to infrastructure-as-code
- Learn Pulumi alongside cloud concepts

**Additional Decision: Regional Location**
**Context:** Hackathon held in Tokyo
**Decision:** Use Japan region (asia-northeast1) instead of us-central1
- Better latency for Tokyo-based demo
- Appropriate for hackathon location
- Aligns with target audience geography

**Final Rationale:** 
- Direct path to production-ready infrastructure
- No migration overhead later
- Consistent with project's infrastructure-as-code goals
- Optimized for hackathon demo location

## 2025-08-26 - Technical Design Architectural Choices

### Context
User confirming architectural decisions for the technical design phase.

### Decision 1: Container Resources
**Options Presented:**
- Smaller: 1 CPU, 1GiB (lower cost, might be slower)
- Current: 2 CPU, 2GiB memory per Cloud Run instance  
- Larger: 4 CPU, 4GiB (faster processing, higher cost)

**Decision Made:** Stick with current (2 CPU, 2GiB)
**Rationale:** Good balance of performance and cost for video processing

### Decision 2: Auto-scaling Configuration
**Options Presented:**
- Always-on: 1-3 instances (faster response, higher cost)
- Current: 0-3 instances (scale to zero when idle)
- More aggressive: 0-5 instances (handle more load)

**Decision Made:** Stick with current (0-3 instances)
**Rationale:** Cost-effective for demo/PoC with good scalability

### Decision 3: Storage Lifecycle
**Options Presented:**
- Current: Auto-delete videos after 24 hours
- Shorter: 12 hours (lower storage cost)  
- Longer: 48 hours (better user experience)

**Decision Made:** 12 hours (shorter)
**Rationale:** Lower storage costs, appropriate for demo/testing phase

### Decision 4: Budget Alert Strategy
**Options Presented:**
- More conservative: 25%, 50%, 75% alerts
- Current: Alerts at 50%, 75%, 90% of $300 budget
- Different thresholds: Custom amounts

**Decision Made:** Stick with current (50%, 75%, 90%)
**Rationale:** Appropriate monitoring levels for hackathon budget management

---