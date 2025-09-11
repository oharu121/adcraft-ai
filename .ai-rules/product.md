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

1. **Product Image Upload & Analysis**

   - Drag-and-drop interface for product images
   - AI-powered image analysis using Vertex AI Gemini Pro Vision
   - Automatic product categorization and feature detection

2. **Three-Agent Interactive Pipeline**

   - **Agent 1 (Product Intelligence)**: Analyzes products and refines understanding through chat
   - **Agent 2 (Creative Director)**: Discusses visual styles and generates assets via Imagen API
   - **Agent 3 (Video Producer)**: Creates final commercial using Veo API with production choices

3. **Real-Time Server-Sent Events (SSE) Chat**

   - Natural conversations with each AI agent
   - Contextual follow-up questions and refinements
   - Session persistence with reconnection capability

4. **Professional Video Output**
   - 30-second commercial videos in 1080p quality
   - Multiple format options (16:9, 1:1, 9:16)
   - Downloadable MP4 files with thumbnails

### Technical Innovation Features

- **Bilingual Support**: Full Japanese/English interface and agent conversations
- **Cost-Optimized Processing**: Target <$2.01 per commercial within $300 budget
- **Real-Time Progress Tracking**: Live updates on processing status and costs
- **Intelligent Asset Generation**: Context-aware visual assets tailored to product analysis

### User Experience Features

- **Guided Workflow**: Clear progression through three agent interactions
- **Interactive Refinement**: Users can influence each stage through natural conversation
- **Resume Capability**: Sessions can be resumed after disconnections
- **Multi-Language Support**: Seamless switching between English and Japanese

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

1. **Upload**: User uploads product image with optional description
2. **Analysis**: Agent 1 analyzes product and engages in refinement conversation
3. **Creative Direction**: Agent 2 presents style options and generates visual assets
4. **Production**: Agent 3 discusses narration/pacing and creates final video
5. **Delivery**: User downloads professional commercial in preferred format

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
