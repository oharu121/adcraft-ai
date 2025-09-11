🔄 Three-Layer Mode Management System:

1. Client-Side Dynamic Mode (AppModeConfig)


    - Runtime switching via sessionStorage
    - UI-driven mode toggles
    - Falls back to APP_MODE environment variable

2. Server-Side Static Mode (Service Classes)


    - Based on ENABLE_MOCK_MODE environment variable
    - Set at service initialization time
    - Used as fallback when no runtime override provided

3. Request-Level Mode Override (API Parameter)


    - { forceMode: appMode } parameter passed to service methods
    - Allows per-request mode control
    - Overrides service-level defaults

✅ All Services Are Correctly Synchronized:

| Service             | Client → API                        | API → Service             | Mode Override |
| ------------------- | ----------------------------------- | ------------------------- | ------------- |
| GeminiVisionService | ✅ appMode: AppModeConfig.getMode() | ✅ { forceMode: appMode } | ✅ Working    |
| GeminiChatService   | ✅ appMode: AppModeConfig.getMode() | ✅ { forceMode: appMode } | ✅ Working    |
| VertexAIService     | N/A (Infrastructure)                | ✅ Environment-based      | ✅ Working    |

🔧 Mode Detection Logic (All Consistent):

// All services use this exact pattern:
const shouldUseMockMode = options?.forceMode === 'demo' ||
(!options?.forceMode && options?.forceMode !== 'real' && this.isMockMode);

🎯 Mode Priority Order (All Services):

1. Explicit forceMode: 'demo' → Demo mode
2. Explicit forceMode: 'real' → Real mode
3. No forceMode + service.isMockMode = true → Demo mode
4. No forceMode + service.isMockMode = false → Real mode
