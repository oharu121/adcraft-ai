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

## 2025-09-14 - 3-Agent Architecture Migration Decisions

### Context
Strategic planning session for migrating from current 2-agent system to specialized 3-agent architecture with clear separation of concerns.

### Decision 1: Agent Handoff Data Storage Strategy
**Options Presented:**
- Option A: In-memory session data (faster, data loss risk during failures)
- Option B: Persistent Firestore storage (reliable, slightly slower, better error recovery)
- Option C: Hybrid approach (memory for active data, Firestore for critical handoffs)

**Decision Made:** Option B - Persistent Firestore storage
**Rationale:** Critical for production reliability, handoff data is too important to lose, minimal performance impact acceptable for better user experience

### Decision 2: Scene Generation Migration Strategy
**Options Presented:**
- Option A: Direct code migration from Maya to David (faster, preserves existing logic)
- Option B: Complete rewrite for David (cleaner, more work, potential bugs)
- Option C: Gradual refactoring over time (slower, complex transition)

**Decision Made:** Option A - Direct code migration
**Rationale:** Preserves proven functionality, faster implementation, lower risk of introducing bugs

### Decision 3: State Management Architecture
**Options Presented:**
- Option A: Shared global store for all agents (simpler, potential conflicts)
- Option B: Independent agent stores with handoff coordination (cleaner separation, more complex)
- Option C: Hybrid with shared session state (middle ground)

**Decision Made:** Option B - Independent agent stores
**Rationale:** Clean separation of concerns, better maintainability, aligns with specialized agent architecture

### Decision 4: UI Layout Strategy
**Options Presented:**
- Option A: Consistent left/right layout for all agents (familiar, professional)
- Option B: Unique layout per agent personality (more creative, potentially confusing)
- Option C: Adaptive layout based on agent task (flexible, complex)

**Decision Made:** Option A - Consistent left/right layout
**Rationale:** Maintains familiar user experience, professional appearance, easier to implement and maintain

### Decision 5: Cost Allocation Strategy
**Options Presented:**
- Option A: Per-agent cost tracking (detailed, complex reporting)
- Option B: Session-level cost tracking (simpler, sufficient granularity)
- Option C: Feature-based cost tracking (mixed approach)

**Decision Made:** Option B - Session-level cost tracking
**Rationale:** Adequate for budget management, simpler to implement, aligns with user billing model

### Decision 6: Zara Agent Implementation Priority
**Options Presented:**
- Implement all three agents simultaneously
- Focus on Maya/David migration first, Zara later
- Implement Zara first as new capability

**Decision Made:** Focus on Maya/David migration only (no Zara implementation yet)
**Rationale:** User specifically requested to focus on Maya/David migration first, Zara can be added later as separate initiative

### Strategic Implementation Notes
- **Migration Approach:** Preserve all existing functionality while redistributing responsibilities
- **User Experience:** Maintain familiar workflows with enhanced capabilities
- **Risk Mitigation:** Incremental migration with comprehensive testing at each step
- **Timeline:** Focus on Maya scope refinement and David scope enhancement

---