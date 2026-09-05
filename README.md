# HydroIQ — Smart Water Network Intelligence Platform

> AI-powered water network monitoring for leak detection, water quality analysis, predictive maintenance, and intelligent repair prioritization.

## Problem

Traditional water monitoring systems often treat leak detection, water quality, and maintenance as separate problems.

This leads to:

- Fragmented monitoring and decision-making
- False alarms from single-sensor readings
- Delayed detection of pipeline failures
- Reactive rather than preventive maintenance
- No intelligent prioritization of repairs based on risk and impact

##  Our Solution

HydroIQ creates a unified intelligence layer for water distribution networks.

It combines IoT sensor telemetry, multi-signal analytics, Water Risk Score (WRS), automated alerts, and AI-assisted decision support into a single real-time platform.

The system monitors:

- 💧 Pressure
- 🌊 Flow
- 🔊 Acoustic signals
- 🧪 pH
- 🧂 TDS
- 🌫️ Turbidity

Multiple signals are analyzed together to identify abnormal network conditions and prioritize the most critical issues.

---

## Key Features

### Multi-Signal Leak Detection
Combines pressure, flow, and acoustic signals to identify potential pipeline leaks and reduce dependence on a single sensor.

### Water Quality Monitoring
Analyzes pH, TDS, and turbidity to detect potential water-quality issues.

### Water Risk Score (WRS)
Generates a unified 0–100 risk score for monitored zones to communicate network severity clearly.

### Intelligent Alert Prioritization
Prioritizes incidents based on severity, risk, urgency, and network impact.

### AI Intelligence Copilot
Provides operator-focused insights about:

- Current network conditions
- Highest-risk zones
- Leak evidence
- Water-quality concerns
- Sensor health
- Recommended maintenance actions

### Multi-Zone Monitoring
Supports multiple IoT nodes mapped to individual network zones.

### Historical Monitoring
Stores and analyzes sensor telemetry for historical trend analysis.

### Automated Alerts
Integrates with n8n to trigger automated operational workflows and notifications.

---

## System Architecture


                    ┌─────────────────────┐
                    │    IoT Sensor Nodes │
                    │    ESP32 / Wokwi    │
                    └──────────┬──────────┘
                               │
                               │ MQTT
                               ▼
                    ┌─────────────────────┐
                    │     MQTT Broker     │
                    │        EMQX         │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      InfluxDB       │
                    │  Telemetry Storage  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    FastAPI Backend  │
                    │                     │
                    │ • Data Processing   │
                    │ • Leak Detection    │
                    │ • Water Quality     │
                    │ • Sensor Health     │
                    │ • WRS Calculation   │
                    │ • Priority Engine   │
                    └──────────┬──────────┘
                               │
                  ┌────────────┴────────────┐
                  │                         │
                  ▼                         ▼
       ┌─────────────────────┐   ┌────────────────────┐
       │   React Dashboard   │   │        n8n         │
       │                     │   │ Alert Automation   │
       │ • Overview          │   └────────────────────┘
       │ • Network Map       │
       │ • Leak Detection    │
       │ • Water Quality     │
       │ • Alerts            │
       │ • Risk & Maintenance│
       │ • AI Insights       │
       └─────────────────────┘


## Technology Stack
### Hardware / IoT
ESP32
IoT sensor nodes
Wokwi simulation
### Communication
MQTT
EMQX
### Backend
Python
FastAPI
Pydantic
### Data Storage
InfluxDB
### Analytics
Python
Multi-signal leak detection
Water-quality analysis
Sensor health analysis
Condition classification
Water Risk Score
Priority calculation
### Frontend
React
Tailwind CSS
Axios
Lucide Icons
### Automation
n8n
HTTP-based alert integration


## Project Structure

```text

HydroIQ/
│
├── analytics/
│   ├── filters.py
│   ├── leak_detection.py
│   ├── water_quality.py
│   ├── wrs.py
│   ├── priority.py
│   ├── condition_classifier.py
│   └── sensor_health.py
│
├── backend/
│   ├── main.py
│   ├── mqtt_service.py
│   └── database/
│       └── influxdb.py
│
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── Overview.jsx
│       │   ├── NetworkMap.jsx
│       │   ├── LeakDetection.jsx
│       │   ├── WaterQuality.jsx
│       │   ├── Alerts.jsx
│       │   ├── AIInsights.jsx
│       │   ├── LeakLocalization.jsx
│       │   ├── Maintenance.jsx
│       │   └── Sensors.jsx
│       │
│       └── api.js
│
├── wokwi/
│   ├── src/
│   │   └── main.cpp
│   └── platformio.ini
│
├── sensor_simulator.py
├── ml_dataset.csv
├── ml_dataset_synthetic_backup.csv
├── hydroiq_ml_model.pkl
├── .env
├── .gitignore
└── README.md

```
## Monitored Zones

HydroIQ currently supports four monitored zones:
```
Device	      Zone
ESP32_Node_1	Zone_A
ESP32_Node_2	Zone_B
ESP32_Node_3	Zone_C
ESP32_Node_4	Zone_D
```
Each zone can have its own sensor readings, network condition, risk score, priority, and operational context.


## Network Conditions

HydroIQ classifies network conditions into multiple states:
```
Condition	                Description
NORMAL            	Network operating normally
EARLY_ANOMALY	      Early abnormal behaviour detected
LEAK	              Multiple signals indicate a potential leak
WATER_QUALITY	      Water-quality parameters require attention
SENSOR_FAULT	      Sensor readings require investigation
CRITICAL	          High-severity network condition
```

## Water Risk Score

The Water Risk Score (WRS) provides a unified 0–100 representation of network risk.

It helps operators answer:
```
What is happening?
        ↓
How severe is it?
        ↓
Which zone is affected?
        ↓
How important is the affected area?
        ↓
What should be handled first?
```

## Analytics Pipeline
```
Sensor Telemetry
       │
       ▼
Data Filtering
       │
       ▼
Multi-Signal Analysis
       │
       ├───────────────┐
       ▼               ▼
Leak Detection    Water Quality
       │               │
       └───────┬───────┘
               ▼
        Sensor Health
               │
               ▼
      Condition Classifier
               │
               ▼
       Water Risk Score
               │
               ▼
       Priority Engine
               │
               ▼
        Alert Generation
               │
       ┌───────┴────────┐
       ▼                ▼
 React Dashboard       n8n
                        │
                        ▼
                  Notifications

```
## Leak Detection

HydroIQ does not rely on a single sensor reading.

Potential leaks are identified using combined evidence such as:
```
Abnormal pressure
Abnormal flow
Increased acoustic activity
Overall network condition
```
This multi-signal approach is designed to reduce false alarms and provide stronger evidence for operational decisions.


## Water Quality Analysis

HydroIQ monitors:
```
pH
TDS
Turbidity
```
These measurements are combined to determine the water-quality condition of each monitored zone.

The result is surfaced directly on the dashboard so operators can quickly identify zones requiring attention.


## Alert Prioritization

Detected incidents are converted into actionable priorities.
```
Incident
   ↓
Severity
   ↓
Risk Score
   ↓
Population / Area Impact
   ↓
Priority
   ↓
Recommended Action

## n8n Automation

HydroIQ can integrate with n8n for automated alert processing.

HydroIQ Analytics
       ↓
Alert Condition
       ↓
n8n Workflow
       ↓
Split / Filter Alerts
       ↓
External Notification
```
This makes the system capable of moving from:  Detection → Decision → Automated Action

## AI Intelligence Copilot

The HydroIQ Intelligence Copilot provides natural-language operational assistance.
The AI layer uses current network analytics and sensor information to provide operator-oriented explanations.


## Dashboard Modules

### Overview

Provides a high-level view of:

Network risk
Active alerts
Monitored zones
Current network conditions

### Network Map

Visualizes monitored zones and network status.

### Leak Detection

Displays leak-related evidence and affected zones.

### Water Quality

Displays water-quality conditions and sensor measurements.

### Alerts

Shows active incidents, severity, WRS, affected zone, and recommended action.

### Risk & Maintenance

Helps operators prioritize maintenance activities.

### AI Insights

Provides natural-language network intelligence.

### Leak Localization

Supports identification of the affected network zone.

### Sensors & Devices

Displays monitored sensor nodes and telemetry.


## Prototype & Demo

The working prototype demonstrates the complete pipeline:
```
INPUT
IoT sensor telemetry
        ↓
PROCESS
MQTT → Data Storage → Analytics
        ↓
ANALYZE
Leak + Quality + Sensor Health + WRS
        ↓
OUTPUT
Risk + Priority + Alerts
        ↓
USER BENEFIT
Faster detection and better maintenance decisions
```

## Validation

The prototype can be validated by testing controlled scenarios such as:
```
Normal network operation
Early network anomaly
Pipeline leak
Water-quality deterioration
Sensor fault
```
For each scenario, the system evaluates whether the corresponding condition, risk score, priority, and recommended action are correctly generated.


## Real-World Deployment

A real-world deployment would require:
```
Distributed sensor nodes
Reliable wireless communication
Secure MQTT infrastructure
Cloud or local telemetry storage
Network/GIS integration
Utility-specific thresholds
Field validation and calibration
Integration with existing water-management systems
```
The architecture is designed to allow the prototype to evolve from simulation to real-world IoT deployment.


## Future Scope

LoRaWAN-based long-range sensor deployment
Edge AI for local anomaly detection
Advanced ML-based failure prediction
GIS-based leak localization
Digital twin integration
Mobile operator application
Automated valve control
SCADA integration
Cloud-scale deployment
More advanced predictive maintenance models


## Impact

HydroIQ aims to help water utilities move from:
```
Reactive Monitoring
        ↓
Early Detection
        ↓
Risk-Based Decision Making
        ↓
Predictive Maintenance
        ↓
Smarter Water Networks

Potential benefits include:

Faster leak identification
Reduced water loss
Earlier detection of abnormal conditions
Better water-quality monitoring
More efficient maintenance prioritization
Improved operational visibility


