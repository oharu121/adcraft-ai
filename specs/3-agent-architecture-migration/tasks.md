# Plan: 3-Agent Architecture Migration

## Tasks

Based on the approved architectural decisions, this task list implements the Maya/David scope redistribution with Alex agent design preserved for future implementation.

### Phase 1: Foundation Setup and Infrastructure

- [ ] 1. Create Alex Agent Infrastructure (Deferred Design Preservation)
  - [ ] 1.1 Create `lib/agents/video-producer/` directory structure with placeholder files
  - [ ] 1.2 Create basic Alex types in `lib/agents/video-producer/types/` with DEFERRED comments
  - [ ] 1.3 Create Alex Zustand store skeleton in `lib/stores/video-producer-store.ts` with DEFERRED flag
  - [ ] 1.4 Create Alex API endpoint placeholders in `app/api/agents/video-producer/` with DEFERRED responses
  - [ ] 1.5 Create Alex component placeholders in `components/video-producer/` with DEFERRED status indicators
  - [ ] 1.6 Document Alex implementation requirements in `specs/3-agent-architecture-migration/alex-future-implementation.md`

- [ ] 2. Update Project Type Definitions
  - [ ] 2.1 Search existing types for agent handoff structures using Grep tool
  - [ ] 2.2 Create `lib/types/agent-handoff-types.ts` with MayaToDataHandoffData and DavidToAlexHandoffData interfaces
  - [ ] 2.3 Update `lib/types/app-phases.ts` with 3-agent phase flow (including Alex phases marked as DEFERRED)
  - [ ] 2.4 Create handoff metadata types for Firestore storage structure
  - [ ] 2.5 Update session schema types to support 3-agent workflow

- [ ] 3. Implement Persistent Handoff Data Storage (Option B)
  - [ ] 3.1 Create Firestore collection schema for agent handoff data
  - [ ] 3.2 Create `lib/services/handoff-storage.ts` with Firestore operations
  - [ ] 3.3 Implement handoff data validation and error recovery
  - [ ] 3.4 Add automatic cleanup after 48 hours using Firestore TTL
  - [ ] 3.5 Create handoff data encryption for sensitive information

### Phase 2: Maya Agent Refinement (Scope Reduction)

- [ ] 4. Refine Maya's Core Responsibilities
  - [ ] 4.1 Read current `lib/agents/product-intelligence/types/product-analysis.ts`
  - [ ] 4.2 Create refined ProductAnalysisRefined interface removing visual/audio elements
  - [ ] 4.3 Enhance messaging strategy capabilities in Maya's core logic
  - [ ] 4.4 Add strategic insights generation to Maya's analysis pipeline
  - [ ] 4.5 Remove music tone logic from Maya (move references to Alex placeholders)

- [ ] 5. Update Maya's UI Components
  - [ ] 5.1 Read current Maya accordion sections in product intelligence store
  - [ ] 5.2 Remove visualStyle, keyScenes, musicTone sections from Maya's expandedSections
  - [ ] 5.3 Add strategicInsights, messagingStrategy sections to Maya's UI
  - [ ] 5.4 Create new `components/product-intelligence/MessagingStrategyCard.tsx`
  - [ ] 5.5 Create new `components/product-intelligence/StrategicInsightsCard.tsx`
  - [ ] 5.6 Create `components/product-intelligence/HandoffPreparationCard.tsx` for David handoff

- [ ] 6. Maya Handoff Preparation System
  - [ ] 6.1 Create Maya handoff data preparation logic
  - [ ] 6.2 Implement handoff validation and completeness checks
  - [ ] 6.3 Create `app/api/agents/product-intelligence/handoff/david/route.ts` endpoint
  - [ ] 6.4 Add Maya → David handoff UI flow and confirmation
  - [ ] 6.5 Update Maya store with handoff preparation state

### Phase 3: David Agent Enhancement (Scope Expansion)

- [ ] 7. Import Scene Generation from Maya (Direct Migration - Option A)
  - [ ] 7.1 Read Maya's `lib/agents/product-intelligence/tools/scene-generator.ts`
  - [ ] 7.2 Migrate scene generation logic to `lib/agents/creative-director/tools/scene-composer.ts`
  - [ ] 7.3 Update scene generation to receive Maya handoff data as input
  - [ ] 7.4 Preserve existing scene generation algorithms and logic patterns
  - [ ] 7.5 Test scene generation with Maya's handoff data structure

- [ ] 8. Import Visual Analysis from Maya (Direct Migration - Option A)
  - [ ] 8.1 Read Maya's `lib/agents/product-intelligence/tools/visual-analyzer.ts`
  - [ ] 8.2 Migrate visual analysis to `lib/agents/creative-director/tools/visual-direction-engine.ts`
  - [ ] 8.3 Enhance visual style recommendations with Maya's strategic insights
  - [ ] 8.4 Integrate visual analysis with David's creative workflow
  - [ ] 8.5 Update visual preferences logic for David's enhanced scope

- [ ] 9. Enhance David's Creative Workflow
  - [ ] 9.1 Read current David store and enhance with Maya imports
  - [ ] 9.2 Add scene composition state management to David store
  - [ ] 9.3 Add style decision workflow to David store
  - [ ] 9.4 Create interactive style selection process
  - [ ] 9.5 Implement scene approval workflow for user engagement

- [ ] 10. Create David's Enhanced UI Components
  - [ ] 10.1 Create `components/creative-director/MayaHandoffCard.tsx` to receive Maya data
  - [ ] 10.2 Create `components/creative-director/StyleSelectionCard.tsx` for interactive style choice
  - [ ] 10.3 Create `components/creative-director/SceneCompositionCard.tsx` for scene planning interface
  - [ ] 10.4 Enhance existing `components/creative-director/AssetGenerationCard.tsx`
  - [ ] 10.5 Create `components/creative-director/AlexHandoffCard.tsx` for production preparation

- [ ] 11. David Handoff Preparation System
  - [ ] 11.1 Design David → Alex handoff data structure
  - [ ] 11.2 Create David handoff data preparation logic
  - [ ] 11.3 Create `app/api/agents/creative-director/handoff/alex/route.ts` endpoint
  - [ ] 11.4 Add production notes generation for Alex guidance
  - [ ] 11.5 Implement David handoff validation and completeness checks

### Phase 4: State Management Architecture (Independent Stores - Option B)

- [ ] 12. Update Maya Store for Reduced Scope
  - [ ] 12.1 Read current `lib/stores/product-intelligence-store.ts`
  - [ ] 12.2 Remove visualStyle, keyScenes, musicTone from Maya's expandedSections
  - [ ] 12.3 Add handoff preparation state to Maya store
  - [ ] 12.4 Update Maya store actions for refined scope
  - [ ] 12.5 Add Maya → David handoff coordination actions

- [ ] 13. Enhance David Store for Expanded Scope
  - [ ] 13.1 Read current `lib/stores/creative-director-store.ts`
  - [ ] 13.2 Add Maya handoff data state to David store
  - [ ] 13.3 Add scene composition state (imported from Maya)
  - [ ] 13.4 Add style decisions state (imported from Maya)
  - [ ] 13.5 Add Alex handoff preparation state
  - [ ] 13.6 Update David store actions for expanded scope

- [ ] 14. Create Alex Store Placeholder (DEFERRED)
  - [ ] 14.1 Create basic `lib/stores/video-producer-store.ts` structure
  - [ ] 14.2 Add DEFERRED comments and placeholder state
  - [ ] 14.3 Document future Alex store requirements
  - [ ] 14.4 Create empty actions with DEFERRED implementation notes

### Phase 5: API Endpoint Restructuring

- [ ] 15. Refine Maya API Endpoints
  - [ ] 15.1 Read current Maya API structure in `app/api/agents/product-intelligence/`
  - [ ] 15.2 Remove visual style and scene endpoints from Maya
  - [ ] 15.3 Enhance messaging strategy endpoint
  - [ ] 15.4 Create strategic insights endpoint
  - [ ] 15.5 Update Maya's main route.ts for refined scope

- [ ] 16. Enhance David API Endpoints
  - [ ] 16.1 Read current David API structure in `app/api/agents/creative-director/`
  - [ ] 16.2 Create Maya handoff initialization endpoint
  - [ ] 16.3 Create scene composition endpoints (imported from Maya)
  - [ ] 16.4 Create style selection and approval endpoints
  - [ ] 16.5 Enhance asset generation and approval endpoints
  - [ ] 16.6 Create Alex handoff preparation endpoint

- [ ] 17. Create Alex API Placeholders (DEFERRED)
  - [ ] 17.1 Create `app/api/agents/video-producer/` directory structure
  - [ ] 17.2 Create placeholder endpoints with DEFERRED responses
  - [ ] 17.3 Document future Alex API requirements
  - [ ] 17.4 Create basic handoff initialization placeholder

### Phase 6: UI Layout Updates (Consistent Left/Right - Option A)

- [ ] 18. Update Maya Phase Layout
  - [ ] 18.1 Read current Maya component layout structure
  - [ ] 18.2 Implement consistent left panel (Maya chat + actions) / right panel (analysis + handoff) layout
  - [ ] 18.3 Update Maya components to fit standardized layout pattern
  - [ ] 18.4 Remove visual/scene UI elements from Maya phase
  - [ ] 18.5 Add handoff preparation UI to Maya's right panel

- [ ] 19. Update David Phase Layout
  - [ ] 19.1 Read current David component layout structure
  - [ ] 19.2 Implement consistent left panel (David chat + creative actions) / right panel (style + scenes + assets) layout
  - [ ] 19.3 Add Maya handoff reception UI to David's layout
  - [ ] 19.4 Integrate imported scene/style components into David's right panel
  - [ ] 19.5 Add Alex handoff preparation UI to David's right panel

- [ ] 20. Create Alex Phase Layout Placeholder (DEFERRED)
  - [ ] 20.1 Create basic Alex component layout structure with DEFERRED status
  - [ ] 20.2 Design consistent left/right layout for future Alex implementation
  - [ ] 20.3 Document Alex layout requirements and UI patterns
  - [ ] 20.4 Create placeholder components with DEFERRED indicators

### Phase 7: Phase Management and Workflow Updates

- [ ] 21. Update App Phase Flow
  - [ ] 21.1 Read current phase management in `lib/types/app-phases.ts`
  - [ ] 21.2 Add Maya handoff, David creative/scenes/assets, David handoff phases
  - [ ] 21.3 Add Alex phases (marked as DEFERRED) to phase flow
  - [ ] 21.4 Update phase transition logic for 3-agent workflow
  - [ ] 21.5 Create phase validation and error handling

- [ ] 22. Update Home Component for 3-Agent Flow
  - [ ] 22.1 Read current home component phase switching logic
  - [ ] 22.2 Add support for new Maya and David phases
  - [ ] 22.3 Add placeholder Alex phase handling with DEFERRED status
  - [ ] 22.4 Update progress indicators for 3-agent workflow
  - [ ] 22.5 Implement smooth transitions between agent handoffs

### Phase 8: Integration and Handoff Coordination

- [ ] 23. Implement Maya → David Handoff Flow
  - [ ] 23.1 Test Maya handoff data preparation and validation
  - [ ] 23.2 Test David handoff data reception and processing
  - [ ] 23.3 Verify scene and style data migration from Maya to David
  - [ ] 23.4 Test UI transitions from Maya handoff to David initialization
  - [ ] 23.5 Implement error handling and retry logic for handoff failures

- [ ] 24. Implement David → Alex Handoff Placeholder
  - [ ] 24.1 Create David handoff data preparation for future Alex implementation
  - [ ] 24.2 Design Alex handoff data structure and validation
  - [ ] 24.3 Create placeholder Alex initialization endpoint
  - [ ] 24.4 Add DEFERRED status indicators when David completes
  - [ ] 24.5 Document Alex handoff requirements for future implementation

- [ ] 25. Create Handoff Monitoring and Debugging
  - [ ] 25.1 Add logging for handoff data preparation and validation
  - [ ] 25.2 Create handoff status monitoring dashboard
  - [ ] 25.3 Implement handoff data inspection tools for debugging
  - [ ] 25.4 Add handoff performance metrics and monitoring
  - [ ] 25.5 Create handoff error recovery and user notification systems

### Phase 9: Testing and Validation

- [ ] 26. Test Maya Refined Scope
  - [ ] 26.1 Test Maya's enhanced messaging strategy generation
  - [ ] 26.2 Test Maya's strategic insights capabilities
  - [ ] 26.3 Verify removal of visual/scene elements from Maya
  - [ ] 26.4 Test Maya handoff preparation and data completeness
  - [ ] 26.5 Verify Maya UI changes and user experience

- [ ] 27. Test David Enhanced Scope
  - [ ] 27.1 Test imported scene generation functionality from Maya
  - [ ] 27.2 Test imported visual analysis capabilities from Maya
  - [ ] 27.3 Test David's enhanced creative workflow and user interactions
  - [ ] 27.4 Verify David asset generation with Maya handoff data
  - [ ] 27.5 Test David handoff preparation for future Alex integration

- [ ] 28. Test Complete Maya → David Flow
  - [ ] 28.1 End-to-end test from Maya analysis to David creative workflow
  - [ ] 28.2 Test handoff data integrity and validation
  - [ ] 28.3 Test UI transitions and user experience across agents
  - [ ] 28.4 Verify all Maya functionality preserved in new architecture
  - [ ] 28.5 Test error handling and recovery scenarios

- [ ] 29. Test Demo Mode Functionality
  - [ ] 29.1 Verify Maya demo mode works with refined scope
  - [ ] 29.2 Verify David demo mode works with enhanced scope
  - [ ] 29.3 Test handoff demo data preparation and processing
  - [ ] 29.4 Ensure demo mode bypasses real API calls appropriately
  - [ ] 29.5 Test demo mode user experience and transitions

### Phase 10: Performance and Cost Optimization

- [ ] 30. Optimize Session-Level Cost Tracking (Option B)
  - [ ] 30.1 Read current cost tracking implementation
  - [ ] 30.2 Update cost tracking for session-level aggregation across agents
  - [ ] 30.3 Add cost breakdown by agent while maintaining session totals
  - [ ] 30.4 Implement cost monitoring and budget alerts for 3-agent flow
  - [ ] 30.5 Test cost tracking accuracy across Maya → David transitions

- [ ] 31. Performance Testing and Optimization
  - [ ] 31.1 Test response times for Maya refined scope
  - [ ] 31.2 Test response times for David enhanced scope
  - [ ] 31.3 Test handoff data transfer performance
  - [ ] 31.4 Optimize Firestore queries for handoff data persistence
  - [ ] 31.5 Monitor memory usage with independent agent stores

### Phase 11: Documentation and Future Planning

- [ ] 32. Update Documentation
  - [ ] 32.1 Update README.md with 3-agent architecture description
  - [ ] 32.2 Document Maya's refined scope and capabilities
  - [ ] 32.3 Document David's enhanced scope and imported capabilities
  - [ ] 32.4 Create Alex implementation guide for future development
  - [ ] 32.5 Update API documentation for new agent endpoints

- [ ] 33. Create Alex Implementation Roadmap
  - [ ] 33.1 Document Alex agent requirements and scope
  - [ ] 33.2 Create Alex implementation timeline and milestones
  - [ ] 33.3 Design Alex integration points with David handoff data
  - [ ] 33.4 Plan Alex UI/UX requirements and user interaction patterns
  - [ ] 33.5 Estimate Alex implementation cost and resource requirements

### Phase 12: Final Integration and Deployment

- [ ] 34. Final Testing and Quality Assurance
  - [ ] 34.1 Complete end-to-end testing of Maya → David workflow
  - [ ] 34.2 User acceptance testing for refined agent responsibilities
  - [ ] 34.3 Performance testing under concurrent user load
  - [ ] 34.4 Security testing for handoff data storage and encryption
  - [ ] 34.5 Accessibility testing for updated UI components

- [ ] 35. Deployment and Monitoring
  - [ ] 35.1 Deploy 3-agent architecture to staging environment
  - [ ] 35.2 Monitor system performance and error rates
  - [ ] 35.3 Set up monitoring alerts for handoff failures
  - [ ] 35.4 Deploy to production with gradual rollout
  - [ ] 35.5 Monitor user adoption and satisfaction with new architecture

---

## Implementation Notes

### Critical Dependencies
- Tasks 1-3 must be completed before any agent modifications
- Maya refinement (tasks 4-6) must complete before David enhancement (tasks 7-11)
- State management updates (tasks 12-14) depend on agent scope changes
- API endpoint restructuring (tasks 15-17) depends on state management changes
- UI updates (tasks 18-20) depend on API endpoint changes

### Alex Agent Deferred Implementation
All Alex-related tasks are marked as DEFERRED and create placeholder infrastructure for future implementation. The current migration focuses exclusively on Maya scope reduction and David scope enhancement.

### Success Criteria
- ✅ Zero data loss during Maya → David handoff
- ✅ All existing Maya functionality preserved in new architecture
- ✅ David enhanced with scene generation and visual analysis capabilities
- ✅ Independent agent stores working correctly
- ✅ Consistent left/right UI layout across all agent phases
- ✅ Session-level cost tracking operational
- ✅ Demo mode functionality preserved
- ✅ Performance targets maintained (< 8 minutes total workflow)
- ✅ Alex implementation roadmap documented for future development

### Testing Strategy
Each phase includes comprehensive testing to ensure:
1. Functionality preservation during migration
2. Handoff data integrity and validation
3. User experience consistency
4. Performance target maintenance
5. Demo mode operational status
6. Error handling and recovery mechanisms