# Requirements: 3-Agent Architecture Migration

## Project Overview

This specification outlines the comprehensive migration from the current AdCraft AI architecture to a new 3-agent responsibility distribution system. This migration will redistribute the responsibilities currently handled by Maya (Product Intelligence Agent) and David (Creative Director Agent) into a more specialized 3-agent system with clearer separation of concerns.

## Current State Analysis

### Current Agent Responsibilities

#### Maya (Product Intelligence Agent) - Current Scope
- ✅ **Product Analysis**: Deep product understanding via Gemini Pro Vision/Text
- ✅ **Key Messages**: Core value propositions, headlines, taglines
- ❌ **Visual Style**: Currently handling style recommendations (TO BE MOVED)
- ❌ **Key Scenes**: Scene generation and composition (TO BE MOVED)
- ❌ **Music & Tone**: Audio-related decisions (TO BE MOVED)
- ✅ **Chat System**: Interactive strategy refinement

#### David (Creative Director Agent) - Current Scope
- ✅ **Visual Asset Generation**: Imagen API integration for backgrounds, product shots
- ✅ **Creative Direction**: Brand alignment and visual storytelling
- ❌ **Limited Scope**: Currently underutilized compared to Maya's broad responsibilities

#### Zara (Video Producer Agent) - Current State
- ❌ **Not Implemented**: Currently exists only as placeholder references

### Current Technical Architecture

#### Phase Management (Current)
- `product-input`: User uploads image or enters text description
- `maya-analysis`: Maya analyzes product
- `maya-strategy`: Maya shows strategy + chat interface
- `david-creative`: David handles creative direction (limited implementation)
- `zara-production`: Placeholder phase
- `completed`: Final state

#### State Management (Current)
- **Zustand Stores**: `product-intelligence-store.ts`, `creative-director-store.ts`
- **UI Components**: Phase-based component rendering in `HomeClient.tsx`
- **Handoff Data**: Basic handoff structure between Maya and David

## Target State: New 3-Agent Architecture

### Agent 1: Maya (Product Intelligence Agent) - Refined Scope

#### Core Responsibilities (KEEP)
- **Product Analysis**: Deep product understanding via Gemini Pro Vision and Gemini Pro text analysis
- **Product Categorization**: Automatic product classification and feature detection
- **Key Messages Development**:
  - Core value propositions and unique selling points
  - Headlines and taglines
  - Communication strategy and messaging framework
  - Target audience identification and persona development
- **Interactive Strategy Refinement**: Real-time conversational intelligence for messaging strategy

#### Removed Responsibilities (MOVE OUT)
- ❌ **Visual Style Decisions**: Move to David
- ❌ **Scene Generation**: Move to David
- ❌ **Music & Tone Selection**: Move to Zara
- ❌ **Narrative Pacing**: Move to Zara

#### Technical Requirements
- **Preserve Existing**: All current product analysis capabilities
- **Enhance**: Focus on deeper messaging strategy and audience insights
- **Handoff Output**: Clean product analysis + messaging strategy to David

### Agent 2: David (Creative Director Agent) - Expanded Scope

#### Core Responsibilities (EXPAND)
- **Visual Style Direction**:
  - Style refinement and mood board creation
  - Color palette and lighting decisions
  - Visual brand alignment
- **Key Scenes Planning**:
  - Scene composition and shot selection
  - Visual storytelling structure
  - Cinematic flow and visual narrative
- **Visual Asset Generation**:
  - Imagen API integration for backgrounds
  - Product shots and lifestyle contexts
  - Visual overlays and creative elements
- **Creative Decision Workflow**:
  - Step-by-step visual decision process
  - Style selection interface
  - Creative iteration and approval system

#### New Responsibilities (MOVE FROM MAYA)
- ✅ **Visual Style**: Take over from Maya's current visual style logic
- ✅ **Key Scenes**: Take over from Maya's scene generation system
- ✅ **Creative Flow**: Develop proper creative director workflow

#### Technical Requirements
- **Import from Maya**: Scene generation logic from `lib/agents/product-intelligence/tools/scene-generator.ts`
- **Enhance Current**: Build upon existing creative director infrastructure
- **Handoff Output**: Complete visual package + generated assets to Zara

### Agent 3: Zara (Video Producer Agent) - New Implementation

#### Core Responsibilities (NEW)
- **Narrative Style Direction**:
  - Pacing decisions (slow-dramatic vs fast-energetic)
  - Narration style (authoritative vs conversational)
  - Storytelling flow and timing
- **Music & Tone Coordination**:
  - Audio genre selection and music style
  - Final audio mixing and synchronization
  - Sound design and audio effects
- **Final Video Production**:
  - Veo API orchestration with all visual assets
  - Video format optimization (16:9, 1:1, 9:16)
  - Production polish: color grading, transitions, timing
- **Quality Assurance**:
  - Final review and optimization
  - Format conversion and delivery

#### Technical Requirements
- **New Implementation**: Complete agent implementation from scratch
- **Music Integration**: New music selection and audio coordination system
- **Veo API**: Video generation orchestration
- **Multi-format Support**: Output optimization for different aspect ratios

## User Experience Requirements

### Requirement 1: Seamless Phase Transitions

**User Story**: As a user, I want to experience smooth transitions between agents without losing context or having to repeat information.

**Acceptance Criteria**:
- ✅ When Maya completes analysis and messaging, the transition to David must be visually smooth
- ✅ When David completes visual direction, the transition to Zara must maintain all context
- ✅ Each agent handoff must include a brief introduction explaining their role
- ✅ Users must be able to review previous agent outputs during later phases
- ✅ Navigation between phases must be intuitive with clear progress indicators

### Requirement 2: Preserved Chat Experience

**User Story**: As a user, I want to maintain the same high-quality conversational experience with each agent that I currently have with Maya.

**Acceptance Criteria**:
- ✅ Maya's chat system must be preserved exactly as it currently functions
- ✅ David must have an equivalent chat interface for creative decisions
- ✅ Zara must have a chat interface for production decisions
- ✅ Chat history must be preserved across agent transitions
- ✅ Each agent must have distinct personality and communication style
- ✅ Quick actions and suggested responses must be agent-appropriate

### Requirement 3: Comprehensive Strategy Review

**User Story**: As a user, I want to review and understand the complete strategy developed across all three agents before final video generation.

**Acceptance Criteria**:
- ✅ Final strategy card must show contributions from all three agents
- ✅ Product analysis and messaging (Maya) must be clearly presented
- ✅ Visual direction and scene planning (David) must be viewable
- ✅ Narrative style and audio decisions (Zara) must be documented
- ✅ Users must be able to request modifications at any stage
- ✅ Strategy confirmation system must work across all agent outputs

### Requirement 4: Enhanced Creative Control

**User Story**: As a user, I want more granular control over visual and audio decisions that were previously automatic.

**Acceptance Criteria**:
- ✅ David must provide multiple visual style options with clear previews
- ✅ Scene selection must be interactive with user approval
- ✅ Zara must offer music genre and pacing choices
- ✅ Users must be able to iterate on creative decisions
- ✅ Each creative choice must include rationale and alternatives
- ✅ Final decisions must be clearly summarized before video generation

## Technical Migration Requirements

### Requirement 5: Agent Code Redistribution

**User Story**: As a developer, I need to cleanly migrate existing functionality between agents while maintaining system stability.

**Acceptance Criteria**:
- ✅ Maya's scene generation logic must be moved to David's agent system
- ✅ Maya's visual style logic must be moved to David's agent system
- ✅ All music and tone logic must be moved to Zara's new agent system
- ✅ Maya's core product analysis must be preserved exactly
- ✅ Maya's messaging system must be enhanced with deeper strategy capabilities
- ✅ No functionality must be lost during the migration
- ✅ All existing demo modes must continue to work

### Requirement 6: Data Structure Migration

**User Story**: As a developer, I need updated data structures that support the new 3-agent workflow.

**Acceptance Criteria**:
- ✅ Handoff data structures must be updated for Maya → David → Zara flow
- ✅ ProductAnalysis type must be refined to focus on messaging only
- ✅ New CreativeDirection type must capture David's visual outputs
- ✅ New ProductionPlan type must capture Zara's final decisions
- ✅ Session state must track progress across all three agents
- ✅ All agent outputs must be properly typed and validated
- ✅ Backward compatibility must be maintained for existing sessions

### Requirement 7: UI Component Restructuring

**User Story**: As a developer, I need UI components that properly reflect the new agent responsibilities.

**Acceptance Criteria**:
- ✅ Maya's components must be updated to remove visual style sections
- ✅ David's components must be enhanced with scene planning interface
- ✅ Zara's components must be created from scratch with production interface
- ✅ Strategy cards must be redistributed to show appropriate agent outputs
- ✅ Phase indicators must reflect the new 3-agent flow
- ✅ Handoff animations must be updated for the new transitions
- ✅ All existing animations and UI polish must be preserved

### Requirement 8: State Management Updates

**User Story**: As a developer, I need Zustand stores that properly manage the new 3-agent state.

**Acceptance Criteria**:
- ✅ Product Intelligence store must be updated to remove visual/audio state
- ✅ Creative Director store must be enhanced with scene planning state
- ✅ New Video Producer store must be created for Zara's state
- ✅ Phase management must support the new agent progression
- ✅ Cross-agent state sharing must be implemented
- ✅ State persistence must work across all agent transitions
- ✅ Existing chat state persistence must be maintained

## API and Integration Requirements

### Requirement 9: API Endpoint Restructuring

**User Story**: As a developer, I need API endpoints that support the new agent specializations.

**Acceptance Criteria**:
- ✅ Maya's API must be focused on product analysis and messaging
- ✅ David's API must be enhanced for visual direction and scene planning
- ✅ Zara's API must be created for production decisions and video generation
- ✅ Handoff APIs must support the new agent flow
- ✅ All endpoints must maintain backward compatibility during migration
- ✅ Error handling must work consistently across all agents
- ✅ Cost tracking must be updated for the new agent distribution

### Requirement 10: External Service Integration

**User Story**: As a developer, I need proper integration of Google Cloud services across the new agent architecture.

**Acceptance Criteria**:
- ✅ Maya must continue using Gemini Pro Vision and Gemini Pro
- ✅ David must continue using Imagen API for visual asset generation
- ✅ Zara must integrate with Veo API for video generation
- ✅ Zara must integrate with Text-to-Speech API for narration
- ✅ All agents must share cost tracking and budget management
- ✅ Rate limiting must be coordinated across all agents
- ✅ Error recovery must work for all external service failures

## Quality Assurance Requirements

### Requirement 11: Functional Completeness

**User Story**: As a user, I want all existing functionality to work exactly as before, but with better organization.

**Acceptance Criteria**:
- ✅ All current product analysis features must be preserved
- ✅ All current chat functionality must be preserved
- ✅ All current visual asset generation must be preserved
- ✅ All current demo modes must continue to work
- ✅ All current error handling must be preserved
- ✅ All current cost tracking must be preserved
- ✅ Performance must be equal or better than current system

### Requirement 12: User Experience Continuity

**User Story**: As a user, I want the new system to feel like a natural evolution, not a completely different application.

**Acceptance Criteria**:
- ✅ Overall user flow must feel familiar and intuitive
- ✅ Visual design and branding must be consistent
- ✅ Response times must be equal or better than current system
- ✅ Error messages must be clear and helpful
- ✅ All accessibility features must be preserved
- ✅ Mobile responsiveness must be maintained
- ✅ All keyboard shortcuts and interactions must work

## Data Migration Requirements

### Requirement 13: Schema Evolution

**User Story**: As a developer, I need database schemas that support the new agent outputs.

**Acceptance Criteria**:
- ✅ Session schema must support 3-agent progression tracking
- ✅ Maya's output schema must focus on product analysis and messaging
- ✅ David's output schema must capture visual decisions and scene planning
- ✅ Zara's output schema must capture production decisions and final video
- ✅ Handoff data schema must support the new agent transitions
- ✅ All existing session data must be migrated or remain compatible
- ✅ Cost tracking schema must support per-agent cost attribution

### Requirement 14: Configuration Migration

**User Story**: As a developer, I need configuration systems that support the new agent architecture.

**Acceptance Criteria**:
- ✅ Agent persona configurations must be updated
- ✅ Phase management configuration must reflect new agent flow
- ✅ Dictionary entries must be updated for new agent responsibilities
- ✅ Error code mappings must be updated for new agent errors
- ✅ Rate limiting configuration must support all three agents
- ✅ Cost calculation configuration must be updated
- ✅ All environment variables must support the new architecture

## Performance Requirements

### Requirement 15: Response Time Maintenance

**User Story**: As a user, I want the new system to be as fast or faster than the current system.

**Acceptance Criteria**:
- ✅ Maya's analysis time must remain under 30 seconds
- ✅ David's creative direction must complete within 60 seconds
- ✅ Zara's production decisions must complete within 30 seconds
- ✅ Agent transitions must be instantaneous (under 1 second)
- ✅ Chat responses must remain under 2 seconds
- ✅ Overall workflow must complete within current time limits
- ✅ Concurrent user support must be maintained

### Requirement 16: Resource Optimization

**User Story**: As a system administrator, I want the new architecture to use resources efficiently.

**Acceptance Criteria**:
- ✅ Memory usage must not increase significantly
- ✅ CPU usage must be distributed efficiently across agents
- ✅ API call optimization must reduce overall costs
- ✅ Caching strategies must be implemented for agent outputs
- ✅ Database queries must be optimized for the new schema
- ✅ File storage must be efficiently managed across agents
- ✅ Network bandwidth usage must be optimized

## Security and Compliance Requirements

### Requirement 17: Security Continuity

**User Story**: As a security administrator, I need the new architecture to maintain all current security standards.

**Acceptance Criteria**:
- ✅ All current authentication mechanisms must be preserved
- ✅ Session security must be maintained across agent transitions
- ✅ Data encryption must be maintained for all agent communications
- ✅ API security must be consistent across all agent endpoints
- ✅ Input validation must be strengthened across all agents
- ✅ Rate limiting must prevent abuse across all agent interactions
- ✅ Error information disclosure must be controlled

## Testing Requirements

### Requirement 18: Comprehensive Test Coverage

**User Story**: As a QA engineer, I need comprehensive test coverage for the new agent architecture.

**Acceptance Criteria**:
- ✅ Unit tests must cover all migrated agent functionality
- ✅ Integration tests must verify agent handoff processes
- ✅ End-to-end tests must validate complete user workflows
- ✅ Performance tests must verify response time requirements
- ✅ Security tests must validate all security requirements
- ✅ Regression tests must ensure no functionality is broken
- ✅ Load tests must verify concurrent user support

### Requirement 19: Demo Mode Testing

**User Story**: As a developer, I need demo mode to work perfectly for all three agents.

**Acceptance Criteria**:
- ✅ Maya's demo mode must continue working exactly as before
- ✅ David's demo mode must provide realistic creative direction outputs
- ✅ Zara's demo mode must provide realistic production decisions
- ✅ All agent handoffs must work in demo mode
- ✅ Demo mode must provide complete user experience without API costs
- ✅ Demo mode must be indistinguishable from real mode for users
- ✅ Demo mode must support all error scenarios and edge cases

## Success Metrics

### User Experience Metrics
- **Task Completion Rate**: >95% of users successfully complete the full 3-agent workflow
- **User Satisfaction**: Survey ratings >4.5/5 for overall experience
- **Agent Transition Smoothness**: <2% of users report confusion during handoffs
- **Feature Discoverability**: >90% of users discover and use new agent-specific features

### Technical Performance Metrics
- **Response Time**: All agent interactions <2 seconds
- **System Reliability**: >99.5% uptime during migration period
- **Error Rate**: <1% of agent interactions result in errors
- **Resource Efficiency**: Memory usage increase <10% from current baseline

### Business Impact Metrics
- **Cost Per Commercial**: Maintain <$2.01 target cost
- **Agent Utilization**: All three agents actively used in >90% of sessions
- **Feature Adoption**: New creative control features used in >75% of sessions
- **Migration Success**: Zero data loss during migration

## Risk Mitigation

### High-Risk Areas
1. **Agent Handoff Logic**: Complex state transitions between agents
2. **UI Component Migration**: Risk of breaking existing user interfaces
3. **State Management**: Risk of data loss during Zustand store updates
4. **API Compatibility**: Risk of breaking existing integrations

### Mitigation Strategies
1. **Incremental Migration**: Phase the migration to reduce risk
2. **Comprehensive Testing**: Extensive testing at each migration step
3. **Rollback Plan**: Ability to revert to current system if needed
4. **User Communication**: Clear communication about changes and benefits

## Dependencies

### Internal Dependencies
- **Zustand Store Updates**: Must be completed before UI component migration
- **Agent Logic Migration**: Must be completed before API endpoint updates
- **Schema Migration**: Must be completed before production deployment
- **Dictionary Updates**: Must be completed before UI updates

### External Dependencies
- **Google Cloud APIs**: Continued availability of Vertex AI, Imagen, and Veo APIs
- **Browser Compatibility**: No changes to browser requirements
- **Mobile Support**: Continued mobile browser compatibility
- **Third-party Libraries**: No breaking changes in key dependencies

## Conclusion

This comprehensive migration will transform AdCraft AI from a 2-agent system with overlapping responsibilities into a clean 3-agent architecture with specialized roles. The migration prioritizes user experience continuity while enabling enhanced creative control and professional production capabilities.

The success of this migration depends on careful attention to user experience preservation, technical excellence in agent handoffs, and comprehensive testing across all components. The result will be a more intuitive, powerful, and professionally capable AI commercial generation system.