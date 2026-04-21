# Pulse Habit Tracker

A lightweight browser-based habit tracker focused on repeatable daily habits and editable daily surveys.

## Features

- Log habits multiple times per day
- Create and delete habits quickly
- Edit daily survey categories
- Save daily feeling check-ins with notes
- See simple correlations between habit counts and survey scores
- Keep data locally in the browser with `localStorage`

## Run

Open [index.html](C:\Users\alecm\OneDrive - Cal Poly\APP Build\index.html) in a browser.

## Firebase account sync

The app is prepared for Firebase Authentication and Cloud Firestore.

To enable real account-based saving:

1. Create a Firebase project.
2. Add a web app in Firebase project settings.
3. Copy the Firebase config values into `firebase-config.js`.
4. In Firebase Authentication, enable Email/Password sign-in.
5. In Cloud Firestore, create a database.
6. Use security rules that only allow each signed-in user to read and write their own document:

```text
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Firebase Authentication requires passwords to be at least 6 characters. The app does not add any extra password requirements or two-factor authentication.

## Notes

Correlation results use a simple Pearson correlation across days where survey data exists. They are useful for spotting patterns, not proving causation.
