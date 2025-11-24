# Feedback System Documentation

## Overview
The app has a feedback system that allows users to submit ratings and comments. Feedback is sent directly to **gearr4th@gmail.com** via Web3Forms.

## How it Works

### Frontend (FeedbackModal.tsx)
- Users rate the app on three metrics (1-5 stars):
  - Ease of use
  - Accuracy of drip rating
  - Usefulness of recommendations
- Users can add optional comments
- Feedback is stored locally as backup
- Feedback is sent to backend API

### Backend (backend/trpc/routes/feedback/send/route.ts)
- Validates user authentication via Supabase
- Formats feedback into a professional email
- Sends email via Web3Forms API to gearr4th@gmail.com
- Includes:
  - Overall rating (average of 3 metrics)
  - Individual ratings
  - User comments
  - User email and ID
  - Platform and app version info

### Email Service (Web3Forms)
- Free email service: https://web3forms.com
- API Key: Stored in `.env` file as `WEB3FORMS_ACCESS_KEY`
- Current key: `ae516279-0274-429a-b537-042ed774a7ca`
- Emails are sent FROM: user's email
- Emails are sent TO: gearr4th@gmail.com

## Configuration

### Environment Variables
The backend requires the WEB3FORMS_ACCESS_KEY environment variable:
```bash
WEB3FORMS_ACCESS_KEY=ae516279-0274-429a-b537-042ed774a7ca
```

### Email Destination
The feedback email address is hardcoded in:
- `backend/trpc/routes/feedback/send/route.ts` (line 80)

To change the destination email, update this line:
```typescript
const FEEDBACK_TO_EMAIL = "your-new-email@example.com";
```

## Backup System
If sending fails (no internet, server down, etc.):
- Feedback is stored in AsyncStorage under `pending_emails`
- Will be retried when connection improves
- User gets appropriate message about status

## Testing
To test the feedback system:
1. Make sure you're logged in
2. Navigate to Profile tab
3. Tap "Give Feedback" button
4. Fill out all ratings (required)
5. Add optional comments
6. Submit
7. Check gearr4th@gmail.com for the feedback email

## Email Format
The feedback email includes:
- Subject: "Drip App Feedback - [Date]"
- Overall rating (calculated average)
- Individual ratings for each category
- User comments
- User email and ID (for follow-up)
- Technical info (platform, app version, timestamp)

## Error Handling
- User not logged in → Backs up locally
- No internet connection → Backs up locally
- Server error → Backs up locally
- Email service down → Backs up locally
- Invalid ratings → Shows alert to user
