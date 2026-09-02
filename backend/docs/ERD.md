# HireDesk ERD

## Entities

### Job

- id: Primary Key
- title: Job title
- description: Job description
- location: Job location
- status: Job status
- createdAt: Creation timestamp
- updatedAt: Last update timestamp

### Candidate

- id: Primary Key
- name: Candidate name
- email: Unique candidate email
- phone: Candidate phone number
- jobId: Foreign Key → Job.id
- createdAt: Creation timestamp
- updatedAt: Last update timestamp

### Interview

- id: Primary Key
- candidateId: Foreign Key → Candidate.id
- scheduledAt: Interview date and time
- status: Interview status
- createdAt: Creation timestamp
- updatedAt: Last update timestamp

### Feedback

- id: Primary Key
- interviewId: Foreign Key → Interview.id
- rating: Interview rating
- comments: Interview feedback
- createdAt: Creation timestamp
- updatedAt: Last update timestamp

## Relationships

```text
Job
 |
 | 1
 |
 | *
Candidate
 |
 | 1
 |
 | *
Interview
 |
 | 1
 |
 | *
Feedback