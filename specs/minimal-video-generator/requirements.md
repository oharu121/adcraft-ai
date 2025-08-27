# Requirements: Minimal Video Generator

## Feature Overview

The Minimal Video Generator is the foundational implementation of the AdCraft AI system, focusing on direct text-to-video generation using Google's Veo API. This phase establishes the core infrastructure and user experience patterns that will later expand into the full 3-agent commercial creation system.

## User Stories

### US-1: Text Prompt Video Generation
**As a** user  
**I want to** enter a text description for a video  
**So that** I can generate a commercial video using AI

**Acceptance Criteria:**
- **WHEN** the user enters a text prompt in the input field, **THE SYSTEM SHALL** validate the input is between 10-500 characters
- **WHEN** the user submits a valid prompt, **THE SYSTEM SHALL** initiate video generation using Veo API
- **WHEN** video generation begins, **THE SYSTEM SHALL** display a progress indicator with estimated completion time
- **WHEN** video generation completes successfully, **THE SYSTEM SHALL** display the generated video with download capability
- **WHEN** video generation fails, **THE SYSTEM SHALL** display a clear error message with retry option

### US-2: Chat-Based Prompt Refinement
**As a** user  
**I want to** refine my video prompt through simple conversation  
**So that** I can improve the generated video without starting over

**Acceptance Criteria:**
- **WHEN** the user clicks "Refine Prompt", **THE SYSTEM SHALL** open a simple chat interface
- **WHEN** the user sends a refinement message, **THE SYSTEM SHALL** provide basic suggestion for updated prompt
- **WHEN** the user approves a refined prompt, **THE SYSTEM SHALL** use it for new video generation
- **WHEN** the chat session exceeds 10 minutes, **THE SYSTEM SHALL** provide timeout warning
- **WHEN** the user abandons refinement, **THE SYSTEM SHALL** preserve the original prompt

**Note:** Simple back-and-forth suggestions for Phase 1. AI-powered contextual conversation planned for next iteration.

### US-3: Video Preview and Download
**As a** user  
**I want to** preview and download generated videos  
**So that** I can use them for my business needs

**Acceptance Criteria:**
- **WHEN** video generation completes, **THE SYSTEM SHALL** display video player with standard controls
- **WHEN** the user clicks download, **THE SYSTEM SHALL** provide MP4 file download
- **WHEN** video exceeds 25MB, **THE SYSTEM SHALL** show file size warning before download
- **WHEN** video download fails, **THE SYSTEM SHALL** provide alternative access method via signed URL

### US-4: Cost and Usage Tracking
**As a** user  
**I want to** see the cost of video generation  
**So that** I can understand the resource usage

**Acceptance Criteria:**
- **WHEN** video generation starts, **THE SYSTEM SHALL** display estimated cost
- **WHEN** video generation completes, **THE SYSTEM SHALL** show actual cost incurred
- **WHEN** session costs exceed $5, **THE SYSTEM SHALL** display budget warning
- **WHEN** system budget approaches limit, **THE SYSTEM SHALL** restrict new generations

### US-5: Basic Error Handling
**As a** user  
**I want to** receive clear feedback when something goes wrong  
**So that** I can understand what to do next

**Acceptance Criteria:**
- **WHEN** Veo API is unavailable, **THE SYSTEM SHALL** display service status and estimated recovery time
- **WHEN** prompt violates content policy, **THE SYSTEM SHALL** suggest modifications with specific guidance
- **WHEN** generation takes longer than expected, **THE SYSTEM SHALL** provide progress updates every 30 seconds
- **WHEN** network connection fails, **THE SYSTEM SHALL** offer retry with exponential backoff

## Technical Requirements

### TR-1: Google Veo API Integration
- Must use Google Vertex AI Veo API (not AI Studio)
- Must implement proper authentication with service accounts
- Must handle rate limiting with exponential backoff
- Must track API costs in real-time

### TR-2: Next.js Architecture Compliance
- Must follow established project structure in `.ai-rules/structure.md`
- Must use TypeScript strict mode
- Must implement proper error boundaries
- Must support bilingual interface (English/Japanese)

### TR-3: Performance Requirements
- Video generation must complete within 10 minutes
- UI must remain responsive during processing
- Must support concurrent sessions (limit: 1-2 for minimal version)
- Must cleanup temporary files after 24 hours

### TR-4: Cost Management
- Must not exceed $2.50 per video generation
- Must implement budget alerts at $50, $100, $150 thresholds
- Must provide real-time cost estimation
- Must preserve 20% of budget for error recovery

## Business Rules

### BR-1: Content Restrictions
- Prompts must be family-friendly commercial content only
- Generated videos must be suitable for business use
- System must reject inappropriate content requests
- Must comply with Google's content policies

### BR-2: Usage Limitations (Demo Phase)
- Maximum 5 videos per IP address per day
- Maximum 15-second video duration
- No user account required (anonymous usage)
- Session timeout after 30 minutes of inactivity

### BR-3: Data Handling
- No persistent storage of user prompts beyond session
- Generated videos deleted after 24 hours
- No personal data collection required
- Must provide clear data usage disclosure

## Non-Functional Requirements

### NFR-1: Scalability Foundation
- Architecture must support future expansion to 3-agent system
- Must design for Cloud Run horizontal scaling
- Must separate concerns for easy agent integration later

### NFR-2: Monitoring and Observability
- Must log all API calls with cost tracking
- Must monitor video generation success rates
- Must track user interaction patterns for UX improvement

### NFR-3: Security
- Must secure all API keys server-side only
- Must validate all user inputs
- Must implement HTTPS-only communication
- Must use signed URLs for video access

## Out of Scope (Future Phases)

- Product image upload and analysis (Agent 1)
- Creative asset generation with Imagen (Agent 2)
- Multi-language narration
- User authentication and accounts
- Advanced video editing capabilities
- Social media integration

## Success Criteria

1. **Functional Success**: User can generate a 15-second video from text prompt in under 8 minutes
2. **Technical Success**: System handles 1-2 concurrent users without performance degradation
3. **Cost Success**: Average cost per generation stays under $2.00
4. **User Success**: Clear, intuitive interface that requires no documentation
5. **Foundation Success**: Architecture cleanly supports adding Agents 1 & 2 in future phases