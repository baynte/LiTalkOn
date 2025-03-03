# LiTalkOn - Voice Analysis Application

A React Native mobile application for analyzing and comparing user voice recordings with reference voice clips.

## Features

- Browse a list of voice clips for practice
- Play reference voice clips
- Record your own voice for comparison
- Analyze your voice against the reference clip
- Get detailed feedback on pitch, rhythm, and pronunciation

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- React Native development environment set up
- Android Studio or Xcode (depending on your target platform)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/LiTalkOn.git
cd LiTalkOn
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Install pods (for iOS):
```bash
cd ios && pod install && cd ..
```

4. Start the application:
```bash
# For Android
npm run android
# or
yarn android

# For iOS
npm run ios
# or
yarn ios
```

## Project Structure

```
src/
├── assets/         # Images, fonts, and other static assets
├── components/     # Reusable UI components
├── hooks/          # Custom React hooks
├── screens/        # Application screens
├── services/       # API services
├── types/          # TypeScript type definitions
└── utils/          # Utility functions
```

## Key Components

- **VoiceClipListScreen**: Main screen displaying a list of voice clips
- **VoiceAnalysisModal**: Modal for playing, recording, and analyzing voice
- **AudioPlayer**: Component for playing audio clips
- **AudioRecorder**: Component for recording user's voice

## API Integration

The application is designed to work with a backend API that provides:

1. A list of voice clips for practice
2. Voice analysis functionality to compare user recordings with reference clips

For development and testing purposes, the application includes mock data.

## Dependencies

- React Native
- React Navigation
- React Native Audio Recorder Player
- React Native Sound
- React Native Vector Icons
- Axios

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [React Native](https://reactnative.dev/)
- [React Native Audio Recorder Player](https://github.com/hyochan/react-native-audio-recorder-player)
- [React Native Sound](https://github.com/zmxv/react-native-sound)
