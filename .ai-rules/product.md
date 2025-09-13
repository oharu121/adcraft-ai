---
title: Product Vision
description: "Defines the project's core purpose, target users, and main features for the  AdCraft AI multi-agent AI system."
inclusion: always
---

# Product Vision - AdCraft AI

## Core Purpose

The AdCraft AI is an **interactive multi-agent AI system** that transforms a single product image into professional commercial videos through real-time conversations with three specialized AI agents. Built for the **AI Agent Hackathon 2025**, it demonstrates "AI Agents that enrich reality" by democratizing professional commercial video creation.

## Target Users

### Primary Users

- **Small Business Owners**: Need professional commercials but lack budget for traditional video production
- **Entrepreneurs**: Launching products and need compelling marketing content quickly
- **Marketing Professionals**: Seeking rapid prototyping tools for commercial concepts
- **E-commerce Sellers**: Require product videos for online marketplaces

### Secondary Users

- **Hackathon Judges**: Evaluating technical innovation and business potential
- **Content Creators**: Exploring AI-powered video generation capabilities
- **Developers**: Learning multi-agent AI system patterns

## Main Features

### Core Functionality

1. **Dual Input Mode Product Analysis**

   - **Image-to-Image Mode**: Drag-and-drop interface for product images with AI-powered analysis
   - **Text-to-Image Mode**: Rich text input for detailed product descriptions
   - AI-powered analysis using Vertex AI Gemini Pro Vision and Gemini Pro
   - Automatic product categorization, feature detection, and commercial strategy generation

2. **Three-Agent Interactive Pipeline with Specialized Expertise**

   - **Agent 1 - Maya (Product Intelligence Agent)**
     - **Personality**: Product expert, analytical, strategic communicator
     - **Core Responsibilities**:
       - Deep product analysis via Gemini Pro Vision (image input) and Gemini Pro (text input)
       - Product categorization, feature detection, and target audience identification
       - **Key Messages**: Core value propositions, headlines, taglines, and communication strategy
       - Real-time conversational strategy refinement through sophisticated chat system
     - **User Interaction**: "What should our main message be? Who is your target audience?"
     - **Output**: Product analysis + key messaging strategy → Handoff to David

   - **Agent 2 - David (Creative Director Agent)**
     - **Personality**: Visual perfectionist, artistic expertise, brand-focused storyteller
     - **Core Responsibilities**:
       - **Visual Style**: Style refinement, mood board creation, color palette and lighting decisions
       - **Key Scenes**: Scene composition, shot selection, visual storytelling structure
       - **Visual Asset Generation**: Imagen API integration for backgrounds, product shots, lifestyle contexts, overlays
       - Step-by-step visual decision workflow (Welcome → Style Selection → Scene Planning → Asset Generation)
     - **User Interaction**: "How should we show this visually? What style resonates with your brand?"
     - **Output**: Complete visual package + generated assets → Handoff to Alex

   - **Agent 3 - Alex (Video Producer Agent)**
     - **Personality**: Production expert, timing specialist, audio-focused storytelling professional
     - **Core Responsibilities**:
       - **Narrative Style**: Pacing decisions (slow-dramatic vs fast-energetic), narration style (authoritative vs conversational)
       - **Music & Tone**: Audio coordination, music genre selection, final audio mixing
       - **Final Production**: Veo API orchestration with all visual assets, video format optimization (16:9, 1:1, 9:16)
       - Production polish: color grading, transition effects, timing refinement
     - **User Interaction**: "How should this sound and feel? Should we go with energetic or dramatic pacing?"
     - **Output**: Final commercial video in multiple formats with professional production quality

3. **Advanced Conversational Chat System**

   - **Maya's Conversational AI**: Natural conversations with sophisticated agent personalities
   - **Real-Time Strategy Updates**: Dynamic strategy modifications with user confirmation system
   - **Contextual Quick Actions**: AI-generated suggestions based on conversation flow
   - **Session Persistence**: Complete conversation history and state management

4. **Professional Commercial Strategy & Video Output**
   - **Interactive Strategy Cards**: Dynamic expandable sections for strategy review
   - **Strategy Update Confirmation**: User-controlled approval system for strategy changes
   - **Professional Video Output**: 30-second commercial videos in 1080p quality
   - **Multiple Format Options**: 16:9, 1:1, 9:16 with downloadable MP4 files

### Technical Innovation Features

- **Demo-First Architecture**: Sophisticated demo mode for risk-free feature validation before real AI processing
- **Advanced State Management**: Zustand-powered state persistence across component interactions
- **Maya's Conversational Intelligence**: Sophisticated AI with contextual understanding and strategy refinement
- **Strategy Update Confirmation System**: User-controlled strategy modifications with approval workflow
- **Bilingual Agent Personalities**: Full Japanese/English interface with distinct agent conversational styles
- **Cost-Optimized Processing**: Target <$2.01 per commercial within $300 budget with real-time tracking
- **Interactive UI Components**: Dynamic expandable strategy cards with smooth animations and magical designs

### User Experience Features

- **Hero Section with CTA**: Compelling landing with smooth scroll to Product Intelligence section
- **Maya's Conversational Intelligence**: Natural, expert-level conversations about commercial strategy
- **Dual Input Flexibility**: Choose between image upload or detailed text descriptions
- **Interactive Strategy Refinement**: Real-time strategy updates through agent conversations
- **Dynamic UI Mode Switching**: Smooth transitions between chat and strategy review modes
- **Strategy Confirmation System**: User-controlled approval process for strategy changes
- **Contextual Quick Actions**: Smart suggestions that adapt to conversation context and user needs
- **Professional Agent Handoffs**: Seamless transitions between Maya, David, and Alex with complete context
- **Resume Capability**: Complete session state persistence across disconnections
- **Multi-Language Agent Personalities**: Each agent speaks naturally in English and Japanese

## Value Proposition

### Business Value

- **Cost Efficiency**: Professional commercials at <$2 cost vs. $1000+ traditional production
- **Speed**: Complete video generation in 8-12 minutes vs. weeks of traditional production
- **Accessibility**: No video production expertise required
- **Scalability**: Multiple products can be processed concurrently

### Technical Innovation

- **Multi-Agent Coordination**: Demonstrates advanced AI agent handoff and context sharing
- **Real-Time Interaction**: Unlike batch processing, enables human-AI collaboration
- **GCP Integration**: Showcases Vertex AI, Imagen, and Veo API capabilities
- **Production Ready**: Deployed on Cloud Run with proper monitoring and scaling

## Success Metrics

### User Experience Metrics

- **Completion Rate**: >90% of started sessions complete successfully
- **Processing Time**: <12 minutes total including chat interactions
- **User Satisfaction**: Clear, engaging agent conversations
- **Error Recovery**: Graceful handling of failures with fallback options

### Technical Performance Metrics

- **Cost Efficiency**: <$2.01 per commercial generation
- **Availability**: >99% uptime during hackathon demonstration period
- **Scalability**: Support 5+ concurrent users processing simultaneously
- **Response Time**: <2 seconds for chat interactions, <5 seconds for agent handoffs

### Business Impact Metrics

- **Demo Success**: Live 5-minute demonstration capability for judges
- **Innovation Recognition**: Technical sophistication appreciated by evaluators
- **Market Validation**: Clear business model and value proposition demonstrated
- **Emotional Engagement**: Compelling user experience that "enriches reality"

## Competitive Advantages

1. **Interactive Multi-Agent Design**: Unlike static AI tools, enables collaborative refinement
2. **Real-Time Processing**: Immediate feedback and adjustments during generation
3. **Cost Transparency**: Real-time cost tracking and budget management
4. **Bilingual Operation**: Serves both Japanese and international markets
5. **Production Integration**: Full GCP deployment ready for scaling

## User Journey

1. **Hero Engagement**: User lands on compelling hero section and smoothly scrolls to Product Intelligence

2. **Input Mode Selection**: Choose between image upload or text description input modes

3. **Maya's Product Intelligence Phase**:
   - **Product Analysis**: Comprehensive product understanding via AI vision/text processing
   - **Key Messages Development**: Core value propositions, headlines, and communication strategy
   - **Interactive Chat**: Natural conversation to refine messaging through sophisticated chat system
   - **Strategy Confirmation**: User approves product understanding and key messages

4. **Smooth Phase Transition**: Beautiful handoff animation from Maya to David with context preservation

5. **David's Creative Direction Phase**:
   - **Welcome & Introduction**: David explains visual creation process
   - **Visual Style Selection**: User chooses style (minimalist, cinematic, lifestyle, luxury)
   - **Scene Planning**: David presents key scenes based on Maya's messaging strategy
   - **Visual Asset Generation**: Real-time creation of backgrounds, product shots, lifestyle contexts via Imagen API
   - **Interactive Chat**: Ongoing conversation about visual choices and creative decisions

6. **Smooth Phase Transition**: Beautiful handoff animation from David to Alex with complete visual package

7. **Alex's Video Production Phase**:
   - **Production Planning**: Alex reviews visual assets and messaging from previous agents
   - **Narrative Style Selection**: Pacing (dramatic vs energetic) and narration style decisions
   - **Music & Tone Selection**: Audio genre, mood, and final audio coordination
   - **Final Video Production**: Veo API orchestration with all assets for professional commercial creation
   - **Interactive Chat**: Real-time production decisions and final polish options

8. **Professional Delivery**: Download complete commercial video with full cost tracking and session history

## Market Context

### Problem Solved

- **Small businesses struggle with expensive video production costs**
- **Traditional commercial creation requires weeks and professional teams**
- **Language barriers limit global commercial production capabilities**
- **Lack of technical expertise prevents SMEs from creating professional content**

### Solution Impact

- **Democratizes professional video creation through AI automation**
- **Reduces production time from weeks to minutes**
- **Eliminates need for specialized video production knowledge**
- **Enables global reach through bilingual operation**

## All Needed Context

### Documentation & References

# Google Cloud APIs (CRITICAL - Use Vertex AI, not AI Studio)

- url: https://cloud.google.com/vertex-ai/docs/generative-ai/model-reference/gemini
  why: Vertex AI Gemini Pro Vision implementation patterns, authentication, and pricing
- url: https://cloud.google.com/vertex-ai/docs/generative-ai/chat/chat-prompts
  why: Gemini Pro chat conversation patterns for interactive agent conversations
- url: https://cloud.google.com/vertex-ai/docs/generative-ai/image/overview
  why: Imagen API documentation for visual asset generation
- url: https://deepmind.google/technologies/veo/
  why: Veo API documentation for video generation capabilities and limitations
- url: https://cloud.google.com/storage/docs/apis
  why: Cloud Storage for media file handling and signed URL patterns
- url: https://cloud.google.com/firestore/docs
  why: Firestore for session state and chat history persistence
- url: https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events
  why: Server-Sent Events implementation patterns for real-time agent updates
- url: https://cloud.google.com/text-to-speech/docs
  why: Text-to-Speech API for narration generation in multiple languages

# Next.js and TypeScript Implementation

- url: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
  why: Next.js API Routes patterns for backend functionality
- url: https://next-intl-docs.vercel.app/docs/getting-started
  why: next-intl implementation for bilingual support

# Architecture and Implementation Guides

- file: discussion/02-development/architecture/product-commercial-agent-architecture.md
  why: Detailed agent responsibilities, processing pipeline, and coordination patterns
- file: discussion/DESIGN.md
  why: Complete technical architecture, API schemas, and system integration details
