SAT-SA
Supervisory Analytics Tool for SOC Assessment

SAT-SA is our solution for Smart India Hackathon 2026 — SIH26157.

The idea is simple: SOCs generate a huge amount of alerts and case-management data, and manually reviewing all of it is difficult. SAT-SA helps supervisors find the cases and entities that deserve a closer look by analysing the operational evidence behind them.

It is not a SOC or SIEM. It is a supervisory analytics tool that helps a human examiner decide where to focus their attention.

What does SAT-SA do?

SAT-SA takes periodic SOC data such as alerts, cases, investigations, escalations and closures and tries to answer:

"Is there anything in this operational data that a supervisor should take a closer look at?"

The system looks for things like:

Execution gaps — something that was expected to happen but doesn't appear in the records.

Negative space — expected activity or evidence that is missing.

Behavioural patterns — unusual investigation or operational behaviour over time.

Peer deviations — meaningful differences between comparable CSEs.

When something looks interesting, SAT-SA creates a finding and lets the supervisor drill down to the evidence behind it.

How it works

The basic flow is:

SOC / CSE Data
      ↓
Data Validation
      ↓
Workflow Reconstruction
      ↓
Supervisory Analytics
      ↓
Prioritisation
      ↓
Evidence
      ↓
Local AI Explanation
      ↓
Human Decision

We keep the core analytics deterministic. The AI is used to explain and summarise findings rather than being responsible for deciding whether something is wrong.

Analytics find it → Evidence supports it → AI explains it → Human decides.

A simple example

Suppose a CSE has 63 critical alerts.

The system finds that 17 of them have no recorded escalation.

Instead of just showing:

17 alerts not escalated

SAT-SA lets the supervisor open the finding and see:

Finding
  ↓
Metric
  ↓
Affected Cases
  ↓
Workflow Events
  ↓
Original Source Record

This makes it possible to understand why the finding was generated and where it came from.

The numbers used in the final demo will come from our synthetic SOC dataset and are not real NCIIPC data.

Main parts of the project

Data & Workflow

The system accepts structured SOC data and connects related records so we can reconstruct what happened during an alert/case lifecycle.

Analytics

The analytics layer focuses on:

Execution Gap detection

Negative Space detection

Behavioural / temporal analysis

Peer benchmarking

Finding prioritisation

Evidence

Every finding should be connected back to the records that produced it.

Local AI

SAT-SA is designed for an offline environment. The local model receives structured findings and evidence and helps generate a readable supervisory explanation.

Sensitive SOC data does not need to be sent to a cloud AI service.

Supervisor

The final decision stays with the human supervisor.

A finding can be reviewed, dismissed, or sent back for additional evidence.

Tech Stack

Frontend

React

TypeScript

Backend

Python

FastAPI

Data / Analytics

PostgreSQL

Pandas

NumPy

AI

Local quantized LLM

Other

SHA-256 for provenance/integrity

RBAC for access control

Running the project

These instructions will be updated to match the final project structure.

Clone the repository:

git clone <repository-url>
cd SAT-SA

Install the frontend dependencies:

cd frontend
npm install
npm run dev

Set up the backend:

cd backend
python -m venv .venv

Windows:

.venv\Scripts\activate

Linux/macOS:

source .venv/bin/activate

Install the backend dependencies:

pip install -r requirements.txt

Start the backend:

uvicorn main:app --reload

The exact commands will be updated according to the final project structure.

Demo

The final 2-minute prototype demonstration will be added here once the prototype is complete.

Demo Video: Coming soon

The demo will show the complete flow from SOC data to a supervisory finding and its supporting evidence.

Screenshots

Screenshots of the final prototype will be added here.

The final repository will include screenshots of the main areas of the application, such as:

Command Center

Findings Registry

Finding Investigation

Evidence Explorer

Supervisory Reasoner

Supervisor decision workflow

Project status

🚧 Currently under development

We are currently working on the complete end-to-end prototype, including the analytics engines, evidence tracing, validation and offline AI integration.

SIH Details

Smart India Hackathon 2026

Problem Statement: SIH26157
Problem: Supervisory Analytics Tool for SOC Assessment
Team: ASTRA

Important note

This is a prototype developed for Smart India Hackathon.

All demonstration data is synthetic. It does not contain real NCIIPC, CSE or SOC data.

SAT-SA is designed to support human supervisory assessment. It is not intended to replace a SOC, SIEM, real-time monitoring system or human supervisory judgement.