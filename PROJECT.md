# Intelligent Media Processing Pipeline

## Objective

Build a scalable asynchronous backend system that accepts uploaded vehicle images, processes them in the background, detects potential quality or authenticity issues, and exposes APIs for monitoring processing status and retrieving structured analysis results.


## Hosted on :  [Intelligent Media Processing Pipeline](https://intelligent-media-processing-pipeline-production-aa93.up.railway.app/docs/)

---

# Tech Stack

Backend
- Node.js
- TypeScript
- Express.js

Database
- PostgreSQL
- Prisma ORM

Queue
- BullMQ
- Redis

Storage
- Local Uploads (/uploads)

Image Processing
- Sharp
- OpenCV
- Tesseract OCR
- image-hash

Validation
- Zod

Logging
- Pino

Documentation
- Swagger

Testing
- Vitest

---

# Project Architecture

```
Client

   │

POST /upload

   │

Express API

   │

Store Metadata

   │

Save Image

   │

Push Job to BullMQ

   │

Return Processing ID

   │

──────────────────────────

Background Worker

   │

Blur Detection

Brightness Detection

OCR

Duplicate Detection

Metadata Validation

Dimension Validation

   │

Aggregate Results

   │

Save to PostgreSQL

   │

Update Status

──────────────────────────

GET /status/:id

GET /result/:id

GET /failure/:id
```

---

# Processing Pipeline

1. Upload image
2. Validate request
3. Save image
4. Store metadata
5. Queue background job
6. Worker processes image
7. Execute analysis modules
8. Aggregate findings
9. Store structured results
10. Update processing status

---

# Analysis Modules

- Blur Detection
- Brightness Analysis
- Duplicate Detection (Perceptual Hash)
- OCR Extraction
- Indian Number Plate Validation
- Dimension Validation
- Metadata Inspection

---

# API Endpoints

POST /upload

GET /status/:id

GET /result/:id

GET /failure/:id

---

# Database Design

## Images

- id
- filename
- filepath
- status
- createdAt
- updatedAt

## Analysis

- imageId
- blur
- brightness
- duplicate
- ocrText
- numberPlate
- numberPlateValid
- confidence
- failureReason
- completedAt

---

# Design Principles

- Asynchronous Processing
- Modular Architecture
- Single Responsibility
- Easy to Extend
- Fault Tolerant
- Production-Oriented

---

# Future Improvements

- AWS S3 Storage
- AWS Rekognition
- Retry Mechanisms
- Dead Letter Queue
- Prometheus Metrics
- Grafana Dashboard
- Kubernetes Deployment
- Authentication
- Rate Limiting
- Confidence Scoring
- AI-based Tampering Detection

---

# Engineering Goals

This project prioritizes clean architecture, maintainability, observability, scalability, and reliable asynchronous processing over machine learning accuracy. Each analysis module is independently extensible, allowing future enhancements without impacting the overall processing pipeline.
