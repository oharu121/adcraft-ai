# AdCraft AI - Development Guide

## ⚠️ **CRITICAL TOOL USAGE POLICY**

**NEVER use any tools without explicit user permission first.**
- ALWAYS ask before running any commands (npm, build, bash, etc.)
- ALWAYS ask before reading, writing, or editing files
- ALWAYS ask before making any changes to the codebase
- User must explicitly approve each tool use before proceeding

## 🎯 **PROJECT OVERVIEW**

**AI Agent Hackathon 2025** - Multi-agent system that transforms product images into commercial videos  
**Deadline**: September 24, 2025 (23:59 JST)  
**Budget**: $300 Google Cloud credits  

## 🏗️ **CORE ARCHITECTURE**

### Agent Flow
```
Product Image/Description → Agent 1: Product Intelligence → Agent 2: Creative Director → Agent 3: Video Producer → Commercial Video
```

### Tech Stack (PROVEN PATTERNS)
- **Framework**: Next.js 15+ App Router + TypeScript (strict)
- **State Management**: **Zustand** (PREFERRED over Context API)
- **Styling**: Tailwind CSS
- **i18n**: next-intl (Japanese/English)
- **Deployment**: Google Cloud Run (MANDATORY for judging)
- **APIs**: Vertex AI Gemini Pro Vision, Imagen API, Veo API

## 🚀 **DEVELOPMENT PATTERNS** (Updated January 2025)

### State Management Strategy

#### ✅ ALWAYS Use Zustand When:
- Complex state (4+ variables)
- State needs persistence across component unmounts
- Multiple components sharing state
- Performance critical applications
- Chat inputs, form data, UI state

#### ❌ AVOID Context API When:
- 10+ state variables (causes re-render hell)
- State persistence required
- Performance matters

#### Zustand Store Pattern:
```typescript
const useMyStore = create<MyStore>((set, get) => ({
  // State
  data: null,
  loading: false,
  
  // Setters
  setData: (data) => set({ data }),
  
  // Complex actions
  fetchData: async () => {
    set({ loading: true });
    const data = await api.getData();
    set({ data, loading: false });
  },
  
  // Reset
  reset: () => set({ data: null, loading: false })
}));
```

### Component Architecture Strategy

#### File Size Rules:
- **Break down at 500+ lines**
- **Target: <300 lines per component**

#### Component Types:
```typescript
// ✅ Server Components (Static, no JS sent to client)
export default function HeroSection({ dict }) {
  return <div>Static content</div>;
}

// ✅ Client Components (Interactive with Zustand)
"use client";
export default function InteractiveForm() {
  const { data, setData } = useStore();
  return <form>Interactive content</form>;
}
```

#### DOM Ref Management (CRITICAL)

**⚠️ NEVER create duplicate refs for the same DOM element**

#### ✅ ALWAYS Follow: Pass Ref Down from Parent
```typescript
// Parent component owns and manages refs
const ParentComponent = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  
  const focusInput = () => {
    inputRef.current?.focus();
  };
  
  return (
    <ChildComponent 
      inputRef={inputRef}
      onFocus={focusInput}
    />
  );
};

// Child component receives ref as prop
interface ChildProps {
  inputRef?: React.RefObject<HTMLInputElement>;
}

const ChildComponent = ({ inputRef }: ChildProps) => {
  return <input ref={inputRef} />;
};
```

#### ❌ NEVER Do: Duplicate Refs
```typescript
// ❌ BAD: Both parent and child have refs for same element
const Parent = () => {
  const inputRef = useRef<HTMLInputElement>(null); // ❌ Duplicate!
  return <Child />;
};

const Child = () => {
  const inputRef = useRef<HTMLInputElement>(null); // ❌ Duplicate!
  return <input ref={inputRef} />;
};
```

#### Ref Ownership Rules:
1. **Parent owns ref** when parent needs to control child's DOM element
2. **Child owns ref** when only child needs internal DOM access  
3. **Pass ref as prop** when parent needs to trigger actions on child's element
4. **Use imperative handle** only for complex component APIs

#### Scroll Implementation (CRITICAL)

**⚠️ ALWAYS use `getElementById` for page scrolling, NOT refs**

#### ✅ ALWAYS Follow: getElementById for Smooth Scrolling
```typescript
// ✅ GOOD: Smart browser scrolling with optimal positioning
const scrollToSection = useCallback(() => {
  const element = document.getElementById("section-id");
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
}, []);
```

#### ❌ NEVER Do: Refs for Page Scrolling  
```typescript
// ❌ BAD: Forces exact positioning, gets cut off by headers
const scrollToSection = () => {
  myRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
};
```

#### Scrolling Rules:
1. **getElementById for page sections** - browser handles headers intelligently
2. **No `block` property needed** - browser finds optimal positioning automatically  
3. **Always use `useCallback`** - prevents unnecessary re-renders
4. **Refs only for component DOM manipulation** - focus, measurements, etc.
5. **Target parent containers** - more robust than specific elements

#### Localized Text Management (CRITICAL)

**⚠️ NEVER hardcode localized text in components**

#### ✅ ALWAYS Follow: Dictionary-First Pattern
```typescript
// ❌ BAD: Hardcoded text in component
const Component = () => {
  const text = {
    en: { title: "Hello" },
    ja: { title: "こんにちは" }
  };
  const t = text[locale];
  
  return <h1>{t.title}</h1>;
};

// ✅ GOOD: Dictionary-driven text
const Component = ({ dict }: { dict: Dictionary }) => {
  const t = dict.productIntelligence.componentName; // KEEP this pattern!
  
  return <h1>{t.title}</h1>;
};
```

#### Localized Text Rules:
1. **All text goes in `dictionaries/en.json` and `dictionaries/ja.json`**
2. **Components accept `dict: Dictionary` prop**
3. **Use `const t = dict.section.subsection` pattern** (ALWAYS keep this!)
4. **Organize by feature**: `dict.productIntelligence.imageUpload.title`
5. **Dynamic text** (like file sizes) handled in component, labels in dictionary

#### Professional Dictionary Usage (CRITICAL)

**⚠️ NEVER use optional chaining (?) when accessing dictionary keys - ALWAYS check dictionary structure first**

#### ✅ ALWAYS Follow: Check Dictionary First, Then Use Direct Access
```typescript
// ❌ BAD: Optional chaining and fallbacks (unprofessional)
const t = dict.agentJourney || dict.common;
const title = t.agents?.maya?.phase || "Product Analysis";
const description = t.fields?.category || "Category";

// ✅ GOOD: Check dictionary structure first, then use direct access
const t = dict.agentJourney;  // Result is certain - dictionary structure exists
const title = t.agents.maya.phase;  // Direct access - no optional chaining
const description = t.fields.category;  // Direct access - no fallbacks
```

#### Dictionary Development Workflow:
1. **First: Check existing dictionary structure** - Use Read tool to examine `dictionaries/en.json`
2. **Add missing sections** - Create proper nested structure in both `en.json` and `ja.json`
3. **Use direct access** - Access keys with certainty: `t.section.subsection.key`
4. **No fallbacks needed** - Dictionary structure guarantees key existence
5. **Professional pattern** - `const t = dict.sectionName;` then `t.key` (not `t?.key`)

#### Dictionary Structure Rules:
- **Nested organization**: `agentJourney.agents.maya.phase`
- **Consistent structure**: Both EN and JA files must have identical key structure
- **Atomic keys**: Each key serves a single, specific purpose
- **Professional access**: `t.fields.targetAudience` not `t.fields?.targetAudience || "fallback"`

#### Interactive Component Styling (CRITICAL)

**⚠️ ALL interactive elements MUST have cursor-pointer for better UX**

#### ✅ ALWAYS Add cursor-pointer to:
```typescript
// Buttons
<button className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600">
  Click me
</button>

// Interactive divs, cards, inputs
<div 
  onClick={handleClick}
  className="p-4 border rounded cursor-pointer hover:bg-gray-50"
>
  Clickable content
</div>

// Links and navigation elements
<Link href="/path" className="text-blue-600 cursor-pointer hover:underline">
  Navigate
</Link>

// File inputs and form controls
<input 
  type="file"
  className="block w-full cursor-pointer file:mr-4 file:cursor-pointer"
/>
```

#### Interactive Element Rules:
1. **buttons, input[type="file"], clickable divs** → Always add `cursor-pointer`
2. **Links and navigation** → Add `cursor-pointer hover:underline`
3. **Cards with onClick** → Add `cursor-pointer hover:bg-gray-50`
4. **Form controls** → Add `cursor-pointer` for better accessibility
5. **Icons with actions** → Add `cursor-pointer` to indicate interactivity

#### TypeScript Type Development (CRITICAL)

**⚠️ ALWAYS search for existing types before creating new ones**

#### ✅ Type Development Workflow:
1. **Search existing types first** - Use Grep tool to find similar interfaces/types
2. **Make types atomic and unique** - Each type should have a single, clear responsibility
3. **Check for name conflicts** - Ensure type names don't clash with existing ones
4. **Reuse over recreation** - Extend existing types rather than duplicating logic

```typescript
// ✅ GOOD: Search first, then create atomic types
// Step 1: Search for existing user-related types
// grep -r "interface.*User" lib/types/

// Step 2: Create atomic, focused types
interface UserId {
  readonly value: string;
}

interface UserProfile {
  id: UserId;
  email: string;
  name: string;
}

interface UserPreferences {
  locale: 'en' | 'ja';
  theme: 'light' | 'dark';
}

// ❌ BAD: Generic, overlapping types
interface User {
  id?: string;
  email?: string;
  name?: string;
  locale?: string;
  theme?: string;
  // ... mixed responsibilities
}
```

#### Type Search Commands:
```bash
# Search for existing interfaces
grep -r "interface.*Product" lib/types/
grep -r "interface.*User" lib/types/
grep -r "interface.*Response" lib/types/

# Search for existing enums
grep -r "enum.*" lib/enums/
grep -r "export.*enum" lib/

# Search for type aliases
grep -r "type.*=" lib/types/
```

#### TypeScript Type Issues (CRITICAL)

**⚠️ ALWAYS check for enums when string literals fail - NEVER use 'any' type**

#### ✅ When TypeScript complains about string types:
```typescript
// ❌ BAD: String literal when enum expected
category: "electronics"  // Error: string not assignable to ProductCategory

// ✅ GOOD: Check if enum exists first
import { ProductCategory } from "@/lib/agents/product-intelligence/enums";
category: ProductCategory.ELECTRONICS

// ❌ NEVER DO: Using 'any' type
category: "electronics" as any  // FORBIDDEN - find proper type instead
```

#### Type Resolution Strategy:
1. **Check for existing enums** in `/lib/agents/product-intelligence/enums.ts`
2. **Import the enum** and use proper enum values
3. **Create proper interfaces** instead of using 'any'
4. **Use union types** for specific string literals: `type Status = 'pending' | 'completed'`
5. **Search codebase** for similar usage patterns when unsure
6. **NEVER use 'any'** - always find the correct type solution

#### Common Enum Locations:
- `ProductCategory` → electronics, fashion, etc.
- `TopicStatus` → pending, completed, in_progress
- `ColorRole` → primary, secondary, accent
- `Gender` → male, female, unisex

#### Next.js 15 API Route Patterns (CRITICAL)

**⚠️ ALWAYS use async params pattern in Next.js 15 API routes**

#### ✅ Next.js 15 Dynamic Route Handler Pattern:
```typescript
// ✅ GOOD: Next.js 15 async params pattern
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params; // MUST await params

    // Route logic here
  } catch (error) {
    // Error handling
  }
}
```

#### ❌ Old Next.js 14 Pattern (Will Cause TypeScript Errors):
```typescript
// ❌ BAD: Next.js 14 synchronous params - causes .next/types/validator.ts errors
interface RouteParams {
  params: { videoId: string }; // Missing Promise wrapper
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { videoId } = params; // Missing await
}
```

#### Next.js 15 API Route Rules:
1. **Dynamic route params are now Promises** - must be awaited
2. **Remove RouteParams interfaces** - use inline types instead
3. **Always await params** - `const { id } = await params;`
4. **TypeScript validates routes** - errors appear in `.next/types/validator.ts`
5. **Apply to all dynamic routes** - `[id]`, `[slug]`, `[...params]`, etc.

#### Common Dynamic Route Patterns:
```typescript
// Single param: /api/video/[videoId]/route.ts
{ params }: { params: Promise<{ videoId: string }> }

// Multiple params: /api/user/[userId]/post/[postId]/route.ts
{ params }: { params: Promise<{ userId: string; postId: string }> }

// Catch-all: /api/files/[...path]/route.ts
{ params }: { params: Promise<{ path: string[] }> }
```

#### Proven Component Organization:
```
components/
├── [feature]/              # Group by feature
│   ├── FeatureCard.tsx     # Container (client)
│   ├── FeatureForm.tsx     # Form logic (client)
│   ├── FeatureProgress.tsx # Progress (client)
│   └── FeatureModal.tsx    # Modal (client)
├── home/                   # Static sections
│   ├── HeroSection.tsx     # Server component
│   └── InstructionsCard.tsx # Server component
└── ui/                     # Shared components
    ├── Card.tsx
    └── Modal.tsx
```

### Refactor Process (PROVEN SUCCESSFUL)

1. **Install Zustand**: `npm install zustand`
2. **Create store** with all useState variables
3. **Extract static content** to server components (easy wins)
4. **Extract interactive parts** to client components with Zustand
5. **Test state persistence** - type in chat, close, reopen, verify text persists
6. **Build and verify** - ensure no TypeScript errors

## 🎭 **DEMO-FIRST DEVELOPMENT WORKFLOW** (MANDATORY)

**⚠️ ALL new features MUST be implemented in demo mode first, approved by user, then synced to real mode**

### Core Principle
Demo mode provides a zero-failure, controlled environment for feature validation before costly real AI integration. This approach:
- Prevents budget waste on untested features
- Allows rapid iteration without API costs
- Ensures user satisfaction before real implementation
- Maintains high demo experience quality

### Mandatory Development Flow

#### 1. **Design Phase**
```typescript
// Plan feature with clear demo/real mode separation
interface FeatureRequest {
  demoImplementation: DemoStrategy;
  realImplementation: RealStrategy;
  syncPoints: string[];
}
```

#### 2. **Demo Implementation** (FIRST)
- Implement complete feature functionality in demo mode
- Use mock data, pre-scripted responses, controlled outcomes
- Focus on UX, UI flows, and user interaction patterns
- Include all localization and error states
- **Test thoroughly** - demo mode must be production-quality

#### 3. **User Approval Process**
- Present working demo to user
- Gather feedback on UX, flows, and feature behavior
- Iterate on demo until fully approved
- **No real mode work until demo approval confirmed**

#### 4. **Real Mode Synchronization** 
- Mirror demo functionality exactly in real mode
- Replace mock data with actual API calls
- Maintain identical UI/UX patterns
- Preserve error handling and edge cases
- **Real mode should be functionally identical to approved demo**

#### 5. **Integration Testing**
- Verify both modes work independently
- Test mode switching (if applicable)
- Confirm cost estimates align with budget
- Performance validation

### Implementation Patterns

#### ✅ Demo Mode Implementation Strategy
```typescript
// Always check mode directly from AppModeConfig (backend-only)
const isDemoMode = AppModeConfig.mode === 'demo';

if (isDemoMode) {
  // Complete, production-ready demo implementation
  const demoResponse = await processDemo({
    // Full mock context with realistic data
    mockContext: {
      productAnalysis: mockProductData,
      conversationHistory: mockHistory,
      // ... complete demo state
    },
    userInput,
    locale
  });
  
  return formatResponse(demoResponse);
}

// Real mode implementation comes after demo approval
const realResponse = await processReal(userInput, context);

return formatResponse(realResponse);
```

#### ⚠️ Backend-Only Mode Checking
```typescript
// ✅ GOOD: Backend API routes check AppModeConfig directly
import { AppModeConfig } from '@/lib/config/app-mode';
const isDemoMode = AppModeConfig.mode === 'demo';

// ❌ BAD: Never import AppModeConfig in client components
// Client components should get mode via API calls or props

// ✅ GOOD: Client components use API to get mode info
const response = await fetch('/api/debug/mode');
const { data } = await response.json();
const isDemoMode = data.currentMode === 'demo';
```

#### ✅ Feature Parity Validation
```typescript
// Both modes must return identical structure
interface FeatureResponse {
  success: boolean;
  data: ResponseData;
  cost: CostInfo;
  processingTime: number;
  // Identical interfaces for both modes
}
```

### File Organization for Dual Mode
```
lib/agents/feature/
├── core/
│   ├── demo-handler.ts     # Complete demo implementation
│   ├── real-handler.ts     # Real implementation (mirrors demo)
│   └── shared-types.ts     # Common interfaces
├── mock/
│   ├── demo-data.ts        # Realistic mock data
│   └── demo-responses.ts   # Pre-scripted responses
└── index.ts                # Mode routing logic
```

### Quality Gates

#### Demo Mode Requirements (Before Real Implementation):
- ✅ Feature works end-to-end in demo
- ✅ All error states handled gracefully
- ✅ Realistic mock data and responses
- ✅ Proper localization (EN/JA)
- ✅ UI/UX flows validated
- ✅ Performance meets targets
- ✅ **User approval obtained**

#### Real Mode Requirements (After Demo Approval):
- ✅ Functionally identical to approved demo
- ✅ API integration working
- ✅ Cost tracking implemented
- ✅ Error handling mirrors demo behavior
- ✅ Performance within targets
- ✅ Both modes tested and working

### Benefits of Demo-First Approach

1. **Cost Control**: No API spend on unproven features
2. **Rapid Iteration**: Fast feedback cycles without infrastructure delays
3. **User Satisfaction**: Features approved before expensive implementation
4. **Quality Assurance**: Demo mode forces attention to UX details
5. **Risk Mitigation**: Identifies issues before real AI integration
6. **Professional Development**: Industry-standard validation approach

### When to Use This Workflow

#### ✅ ALWAYS Use Demo-First For:
- New feature development
- Major UX changes
- New agent capabilities
- Chat system modifications
- Complex user interactions
- API integration changes

#### ⚠️ Exceptions (Direct Real Mode):
- Bug fixes in existing real mode features
- Performance optimizations
- Security patches
- Configuration changes

## 💡 **QUICK DECISION TREES**

### State Management:
- 1-3 variables → useState
- 4+ variables → Zustand
- Needs persistence → Zustand (REQUIRED)
- Chat/form inputs → Zustand (REQUIRED)

### Component Breakdown:
- File >500 lines → Break down
- 3+ responsibilities → Break down
- Static content → Server component
- Interactive → Client component + Zustand

### Ref Management:
- Parent needs to control child's DOM → Parent owns ref, passes as prop
- Child needs internal DOM access only → Child owns ref
- Multiple components need same element → ❌ NEVER duplicate refs
- Complex component APIs → Use forwardRef + useImperativeHandle

### Localized Text:
- Any user-facing text → Add to dictionaries first
- Component needs text → Accept dict prop, use `const t = dict.section`
- New component with text → Create dictionary section, then component
- Hardcoded text found → ❌ IMMEDIATELY move to dictionaries

## 🎯 **SUCCESS METRICS**

- ✅ File sizes <500 lines
- ✅ State persists across component toggles
- ✅ Build succeeds without TypeScript errors
- ✅ Components are reusable and focused
- ✅ Server components reduce bundle size
- ✅ No duplicate refs - clear ref ownership hierarchy
- ✅ All localized text in dictionaries - no hardcoded text in components

## ⚠️ **CRITICAL CONSTRAINTS**

### Google Cloud (MANDATORY)
- **MUST use Vertex AI Gemini API** (not AI Studio)
- **MUST deploy on Cloud Run** for judging
- **Budget monitoring** at 50%, 75%, 90%
- **Cost per commercial**: Target <$2.00

### Session Management (MANDATORY)
- **MUST use UUID format for sessionId** (`crypto.randomUUID()`)
- **NEVER use custom format** like `session-${Date.now()}-${random}`  
- **UUID provides security, standardization, and framework compatibility**
- **All generated IDs** (jobId, costId, messageId) must use `crypto.randomUUID()`

### Performance Targets
- API response <2s
- File upload <30s
- Video generation 5-8 min
- Success rate >90%

### Rate Limiting (Demo App)
- 1 commercial/hour per IP, max 3/day
- Max 5 concurrent users
- Dynamic limits based on remaining budget

## 📁 **PROJECT STRUCTURE**

```
/
├── app/[locale]/           # Next.js App Router pages
├── components/             # Component library
│   ├── home/              # Home page components
│   ├── product-intelligence/ # Agent components
│   └── ui/                # Shared UI components
├── lib/
│   ├── agents/            # Agent implementations
│   ├── stores/            # Zustand stores
│   ├── services/          # API integrations  
│   └── utils/             # Helper functions
├── types/                 # TypeScript definitions
└── i18n/messages/         # Translations (en.json, ja.json)
```

## 🧠 **MEMORY TRIGGERS**

### When Users Ask About:
- **"Component breakdown"** → Recommend Zustand + component extraction
- **"State management"** → Zustand over Context API for complex cases
- **"Performance"** → Server components for static content
- **"State persistence"** → Zustand required for chat inputs
- **"Ref issues"** or **"Focus not working"** → Check for duplicate refs, apply parent-owns-ref pattern
- **"Localization"** or **"Text in component"** → Move to dictionaries, use `const t = dict.section` pattern
- **"Dictionary access"** or **"i18n error"** → NEVER use optional chaining (?), check dictionary structure first, use direct access
- **"Scrolling"** or **"Header blocking view"** → Use getElementById approach, never refs for page scrolling
- **"Function optimization"** → Always wrap functions in useCallback to prevent re-renders
- **"API route errors"** or **".next/types/validator.ts errors"** → Use Next.js 15 async params pattern with await
- **"New feature"** or **"Feature request"** → ALWAYS implement in demo mode first, get approval, then sync to real mode
- **"Demo mode not working"** → Check for separate demo handlers bypassing main implementation
- **"Button styling"** or **"Interactive elements"** → ALWAYS add cursor-pointer to clickable elements
- **"Type error"** or **"String not assignable"** → Check for enums first, import and use proper enum values
- **"Creating types"** or **"New interface"** → ALWAYS search existing types first, make types atomic and unique

### Remember:
- Users often have great instincts - listen when they question recommendations
- **DEMO-FIRST IS MANDATORY** - implement in demo mode, get approval, then sync to real mode
- **cursor-pointer on ALL interactive elements** - buttons, clickable divs, file inputs, links
- **Check enums before using strings** - ProductCategory.ELECTRONICS not "electronics"
- **Search existing types before creating new ones** - Use Grep tool to find similar interfaces
- **Make types atomic and unique** - Each type should have single, clear responsibility
- Test state persistence early and often
- Break down components by responsibility, not just size
- Server components = free performance wins
- **ALWAYS check for duplicate refs** when debugging DOM interaction issues
- Parent component should own refs when it needs to control child DOM elements
- **ALWAYS use dictionaries for text** - never hardcode localized strings in components
- **Keep `const t = dict.section` pattern** - it's clean and readable
- **NEVER use optional chaining (?) with dictionaries** - check structure first, then use direct access for professional code
- **getElementById beats refs for scrolling** - browser handles headers intelligently
- **useCallback for all functions** - prevents unnecessary re-renders and improves performance
- **Demo mode bypasses** are common bugs - ensure demo handlers use the same core logic as real mode

### Development Environment Notes:
- **User runs `npm run dev`** - don't run it yourself
- **Ask for browser dev console logs** when debugging frontend issues (F12 → Console/Network tabs)
- **Ask for server logs** when debugging backend issues (terminal output)
- **Request API response JSON** from Network tab when investigating API issues

---

## 📚 **REFERENCE GUIDES**

Located in `05-gcp-reference/`:
- Vertex AI TypeScript patterns
- Imagen API integration  
- Veo API video generation
- Cloud Run deployment