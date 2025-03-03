# LiTalkOn Backend API Specification

This document outlines the API endpoints that the backend should implement to support the LiTalkOn voice analysis mobile application.

## Base URL

```
https://api.litalkon.com/api/v1
```

## Authentication

All API requests should include an authentication token in the header:

```
Authorization: Bearer <token>
```

## Endpoints

### Voice Clips

#### Get All Voice Clips

Retrieves a list of all available voice clips for practice.

- **URL**: `/voice-clips`
- **Method**: `GET`
- **Query Parameters**:
  - `limit` (optional): Number of items to return (default: 20)
  - `offset` (optional): Offset for pagination (default: 0)
  - `category` (optional): Filter by category (e.g., "english", "french", "japanese")
  - `difficulty` (optional): Filter by difficulty level (e.g., "beginner", "intermediate", "advanced")

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "title": "English Pronunciation Exercise",
      "description": "Practice your English pronunciation with this short sentence: \"The quick brown fox jumps over the lazy dog.\"",
      "audioUrl": "https://api.litalkon.com/audio/english-pronunciation.mp3",
      "category": "english",
      "difficulty": "beginner",
      "createdAt": "2023-03-01T10:00:00Z",
      "duration": 5.2
    },
    {
      "id": "2",
      "title": "French Accent Training",
      "description": "Improve your French accent with this phrase: \"Je voudrais une tasse de café, s'il vous plaît.\"",
      "audioUrl": "https://api.litalkon.com/audio/french-accent.mp3",
      "category": "french",
      "difficulty": "intermediate",
      "createdAt": "2023-03-02T14:30:00Z",
      "duration": 3.8
    }
  ],
  "pagination": {
    "total": 50,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

#### Get Voice Clip by ID

Retrieves a specific voice clip by its ID.

- **URL**: `/voice-clips/:id`
- **Method**: `GET`
- **URL Parameters**:
  - `id`: The ID of the voice clip

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "1",
    "title": "English Pronunciation Exercise",
    "description": "Practice your English pronunciation with this short sentence: \"The quick brown fox jumps over the lazy dog.\"",
    "audioUrl": "https://api.litalkon.com/audio/english-pronunciation.mp3",
    "category": "english",
    "difficulty": "beginner",
    "createdAt": "2023-03-01T10:00:00Z",
    "duration": 5.2,
    "transcript": "The quick brown fox jumps over the lazy dog.",
    "tips": "Focus on the 'th' sound in 'the' and the 'x' sound in 'fox'."
  }
}
```

### Voice Analysis

#### Analyze Voice Comparison

Analyzes a user's voice recording compared to a reference voice clip.

- **URL**: `/analyze-voice`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Body Parameters**:
  - `originalClipId`: The ID of the reference voice clip
  - `userAudio`: The audio file of the user's recording (MP3, MP4, WAV, or M4A format)

**Response**:

```json
{
  "success": true,
  "data": {
    "originalClipId": "1",
    "userClipId": "user-recording-123",
    "similarityScore": 0.78,
    "feedback": "Good attempt! Your pronunciation is clear, but you could improve the rhythm and intonation of the sentence.",
    "analysisDetails": {
      "pitch": {
        "score": 0.82,
        "feedback": "Your pitch variation is good, but try to emphasize the rising intonation at the end of questions."
      },
      "rhythm": {
        "score": 0.75,
        "feedback": "The rhythm is slightly off. Try to maintain a more consistent pace throughout the sentence."
      },
      "pronunciation": {
        "score": 0.85,
        "feedback": "Your pronunciation of individual words is very good. Pay attention to the 'th' sound in 'the'."
      }
    }
  }
}
```

#### Get User's Analysis History

Retrieves the history of a user's voice analysis attempts.

- **URL**: `/users/me/analysis-history`
- **Method**: `GET`
- **Query Parameters**:
  - `limit` (optional): Number of items to return (default: 20)
  - `offset` (optional): Offset for pagination (default: 0)

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": "analysis-1",
      "originalClipId": "1",
      "originalClipTitle": "English Pronunciation Exercise",
      "userClipId": "user-recording-123",
      "similarityScore": 0.78,
      "createdAt": "2023-03-10T15:30:00Z"
    },
    {
      "id": "analysis-2",
      "originalClipId": "2",
      "originalClipTitle": "French Accent Training",
      "userClipId": "user-recording-124",
      "similarityScore": 0.65,
      "createdAt": "2023-03-09T12:45:00Z"
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

### User Management

#### Register User

Registers a new user.

- **URL**: `/auth/register`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Body**:

```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Login User

Authenticates a user and returns a token.

- **URL**: `/auth/login`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Body**:

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Error Responses

All endpoints should return appropriate HTTP status codes and error messages in case of failure:

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "The provided credentials are invalid."
  }
}
```

Common error codes:

- `INVALID_CREDENTIALS`: Authentication failed
- `INVALID_PARAMETERS`: Missing or invalid request parameters
- `RESOURCE_NOT_FOUND`: The requested resource was not found
- `UNAUTHORIZED`: User is not authorized to access the resource
- `SERVER_ERROR`: Internal server error

## Audio File Requirements

- **Formats**: MP3, MP4, WAV, or M4A
- **Max Size**: 10MB
- **Max Duration**: 60 seconds
- **Sample Rate**: 44.1kHz (recommended)
- **Channels**: Mono or Stereo

## Voice Analysis Algorithm

The backend should implement a voice analysis algorithm that compares the user's recording with the reference clip. The algorithm should analyze:

1. **Pitch**: Comparing the pitch patterns between the recordings
2. **Rhythm**: Analyzing the timing and pacing of speech
3. **Pronunciation**: Evaluating how accurately the user pronounces words and phonemes

Each aspect should receive a score between 0 and 1, with 1 being perfect. The overall similarity score should be a weighted average of these individual scores.

## Implementation Notes

- All timestamps should be in ISO 8601 format (UTC)
- Audio URLs should be pre-signed URLs that expire after a certain period
- User recordings should be stored securely and accessible only to the user who created them
- The API should implement rate limiting to prevent abuse 